-- ==============================================================================
-- ALL-IN-ONE HIGH SPEED GAME STORED PROCEDURES (ATOMIC TRANSACTIONS)
-- ==============================================================================

-- 1. CHẾ BIẾN BẾP & DƯỢC SƯ (CRAFT RECIPE)
CREATE OR REPLACE FUNCTION public.action_craft_recipe(p_recipe_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_recipe RECORD;
  v_ing RECORD;
  v_user_qty INT;
  v_item_category item_category;
  v_existing_id UUID;
  v_existing_qty INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  SELECT * INTO v_recipe FROM public.recipes WHERE id = p_recipe_id AND is_active = TRUE;
  IF v_recipe.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Công thức không tồn tại hoặc đã ngừng hoạt động!');
  END IF;

  -- Kiểm tra đủ tất cả nguyên liệu
  FOR v_ing IN SELECT * FROM jsonb_to_recordset(v_recipe.ingredients) AS x("itemId" TEXT, "itemName" TEXT, "quantity" INT) LOOP
    SELECT quantity INTO v_user_qty FROM public.inventory WHERE user_id = v_user_id AND item_id = v_ing."itemId" FOR UPDATE;
    IF v_user_qty IS NULL OR v_user_qty < v_ing."quantity" THEN
      RETURN jsonb_build_object('success', false, 'error', 'Không đủ nguyên liệu: ' || v_ing."itemName");
    END IF;
  END LOOP;

  -- Trừ nguyên liệu
  FOR v_ing IN SELECT * FROM jsonb_to_recordset(v_recipe.ingredients) AS x("itemId" TEXT, "quantity" INT) LOOP
    SELECT quantity INTO v_user_qty FROM public.inventory WHERE user_id = v_user_id AND item_id = v_ing."itemId";
    IF v_user_qty = v_ing."quantity" THEN
      DELETE FROM public.inventory WHERE user_id = v_user_id AND item_id = v_ing."itemId";
    ELSE
      UPDATE public.inventory SET quantity = quantity - v_ing."quantity", updated_at = NOW() WHERE user_id = v_user_id AND item_id = v_ing."itemId";
    END IF;
  END LOOP;

  -- Thêm thành phẩm vào kho
  v_item_category := CASE WHEN v_recipe.category = 'potion' THEN 'potion'::item_category ELSE 'processed_food'::item_category END;
  SELECT id, quantity INTO v_existing_id, v_existing_qty FROM public.inventory WHERE user_id = v_user_id AND item_id = v_recipe.result_item_id FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.inventory SET quantity = quantity + v_recipe.result_quantity, updated_at = NOW() WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.inventory (user_id, item_id, item_name, category, quantity, icon)
    VALUES (v_user_id, v_recipe.result_item_id, v_recipe.result_item_name, v_item_category, v_recipe.result_quantity, v_recipe.icon);
  END IF;

  -- Thưởng EXP
  UPDATE public.profiles SET exp = exp + v_recipe.exp_reward, updated_at = NOW() WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'resultName', v_recipe.result_item_name,
    'expReward', v_recipe.exp_reward
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. BÁN ĐỒ CHO CỬA HÀNG NPC (SELL TO NPC)
CREATE OR REPLACE FUNCTION public.action_sell_to_npc(p_item_id TEXT, p_quantity INT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item RECORD;
  v_price_per_unit INT := 10;
  v_crop_def RECORD;
  v_total_gold BIGINT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng không hợp lệ!');
  END IF;

  SELECT * INTO v_item FROM public.inventory WHERE user_id = v_user_id AND item_id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL OR v_item.quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không có đủ số lượng vật phẩm này để bán!');
  END IF;

  -- Xác định giá bán
  IF v_item.item_id LIKE 'crop_%' THEN
    SELECT sell_price INTO v_price_per_unit FROM public.crop_definitions WHERE id = REPLACE(v_item.item_id, 'crop_', '')::crop_type;
  ELSIF v_item.item_id LIKE 'seed_%' THEN
    SELECT buy_price INTO v_price_per_unit FROM public.crop_definitions WHERE id = REPLACE(v_item.item_id, 'seed_', '')::crop_type;
    v_price_per_unit := FLOOR(v_price_per_unit * 0.5)::INT;
  ELSIF v_item.category = 'herb' THEN
    v_price_per_unit := 25;
  ELSIF v_item.category = 'processed_food' THEN
    v_price_per_unit := 40;
  ELSIF v_item.category = 'potion' THEN
    v_price_per_unit := 60;
  END IF;

  IF v_price_per_unit IS NULL THEN
    v_price_per_unit := 10;
  END IF;

  v_total_gold := v_price_per_unit * p_quantity;

  -- Trừ đồ trong kho
  IF v_item.quantity = p_quantity THEN
    DELETE FROM public.inventory WHERE id = v_item.id;
  ELSE
    UPDATE public.inventory SET quantity = quantity - p_quantity, updated_at = NOW() WHERE id = v_item.id;
  END IF;

  -- Cộng Vàng
  UPDATE public.profiles SET gold = gold + v_total_gold, updated_at = NOW() WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'totalGoldEarned', v_total_gold,
    'message', 'Đã bán ' || p_quantity || 'x ' || v_item.item_name || ' và nhận +' || v_total_gold || ' Vàng! 🪙'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. MUA HẠT GIỐNG TỪ CỬA HÀNG NPC (BUY SEEDS FROM NPC)
CREATE OR REPLACE FUNCTION public.action_buy_seed(p_crop_id crop_type, p_quantity INT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_crop_def RECORD;
  v_total_cost BIGINT;
  v_gold BIGINT;
  v_seed_item_id TEXT := 'seed_' || p_crop_id;
  v_seed_name TEXT;
  v_existing_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng không hợp lệ!');
  END IF;

  SELECT * INTO v_crop_def FROM public.crop_definitions WHERE id = p_crop_id;
  IF v_crop_def.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hạt giống không tồn tại!');
  END IF;

  v_total_cost := v_crop_def.buy_price * p_quantity;
  SELECT gold INTO v_gold FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_gold < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không đủ Vàng! Cần ' || v_total_cost || ' Vàng (Bạn có ' || v_gold || ').');
  END IF;

  -- Trừ tiền
  UPDATE public.profiles SET gold = gold - v_total_cost, updated_at = NOW() WHERE id = v_user_id;

  -- Cộng hạt giống
  v_seed_name := 'Hạt ' || v_crop_def.name;
  SELECT id INTO v_existing_id FROM public.inventory WHERE user_id = v_user_id AND item_id = v_seed_item_id FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.inventory SET quantity = quantity + p_quantity, updated_at = NOW() WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.inventory (user_id, item_id, item_name, category, quantity, icon)
    VALUES (v_user_id, v_seed_item_id, v_seed_name, 'seed', p_quantity, '🌱');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'totalCost', v_total_cost,
    'message', 'Đã mua ' || p_quantity || 'x ' || v_seed_name || '!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. NHẬN THƯỞNG THÁM HIỂM MINION (CLAIM EXPEDITION REWARD)
CREATE OR REPLACE FUNCTION public.action_claim_expedition(p_minion_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_minion RECORD;
  v_mission RECORD;
  v_ends_epoch BIGINT;
  v_now_epoch BIGINT;
  v_total_power INT;
  v_total_def INT;
  v_damage INT := 0;
  v_final_hp INT;
  v_is_alive BOOLEAN;
  v_drop RECORD;
  v_awarded_drops JSONB := '[]'::jsonb;
  v_inv_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  SELECT * INTO v_minion FROM public.minions WHERE id = p_minion_id AND user_id = v_user_id FOR UPDATE;
  IF v_minion.id IS NULL OR v_minion.status <> 'expedition' OR v_minion.expedition_ends_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhân viên không trong chuyến thám hiểm nào!');
  END IF;

  v_ends_epoch := EXTRACT(EPOCH FROM v_minion.expedition_ends_at)::BIGINT;
  v_now_epoch := EXTRACT(EPOCH FROM NOW())::BIGINT;
  IF v_now_epoch < v_ends_epoch THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chuyến thám hiểm chưa hoàn tất! Còn lại ' || (v_ends_epoch - v_now_epoch) || 's.');
  END IF;

  SELECT * INTO v_mission FROM public.expedition_missions WHERE id = v_minion.expedition_mission_id;
  IF v_mission.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dữ liệu nhiệm vụ không tìm thấy!');
  END IF;

  -- Tính toán sát thương
  v_total_power := v_minion.power + COALESCE(v_minion.temp_dmg_buff, 0);
  v_total_def := COALESCE(v_minion.temp_def_buff, 0);

  IF v_total_power < v_mission.recommended_power THEN
    v_damage := GREATEST(10, ((v_mission.recommended_power - v_total_power) * 2 - v_total_def));
  ELSE
    v_damage := GREATEST(0, (15 - v_total_def));
  END IF;

  v_final_hp := GREATEST(0, (v_minion.hp - v_damage));
  v_is_alive := (v_final_hp > 0);

  -- Roll phần thưởng
  FOR v_drop IN SELECT * FROM jsonb_to_recordset(v_mission.possible_drops) AS x("itemId" TEXT, "itemName" TEXT, "category" TEXT, "quantity" INT, "chance" FLOAT, "icon" TEXT) LOOP
    IF random() <= v_drop."chance" THEN
      v_awarded_drops := v_awarded_drops || jsonb_build_object('itemName', v_drop."itemName", 'quantity', v_drop."quantity", 'icon', v_drop."icon");

      SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = v_user_id AND item_id = v_drop."itemId" FOR UPDATE;
      IF v_inv_id IS NOT NULL THEN
        UPDATE public.inventory SET quantity = quantity + v_drop."quantity", updated_at = NOW() WHERE id = v_inv_id;
      ELSE
        INSERT INTO public.inventory (user_id, item_id, item_name, category, quantity, icon)
        VALUES (v_user_id, v_drop."itemId", v_drop."itemName", v_drop."category"::item_category, v_drop."quantity", v_drop."icon");
      END IF;
    END IF;
  END LOOP;

  -- Thưởng Vàng và EXP
  UPDATE public.profiles SET gold = gold + v_mission.gold_reward, exp = exp + v_mission.exp_reward, updated_at = NOW() WHERE id = v_user_id;

  -- Reset trạng thái Minion
  UPDATE public.minions
  SET status = 'idle',
      expedition_mission_id = NULL,
      expedition_ends_at = NULL,
      hp = v_final_hp,
      is_alive = v_is_alive,
      temp_dmg_buff = 0,
      temp_def_buff = 0
  WHERE id = p_minion_id;

  RETURN jsonb_build_object(
    'success', true,
    'goldReward', v_mission.gold_reward,
    'expReward', v_mission.exp_reward,
    'damageTaken', v_damage,
    'isAlive', v_is_alive,
    'drops', v_awarded_drops
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

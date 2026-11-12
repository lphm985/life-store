-- ==============================================================================
-- FARM ACTIONS STORED PROCEDURES (SINGLE DATABASE ROUNDTRIP - ZERO LAG)
-- ==============================================================================

-- 1. GIEO HẠT TRONG 1 TRANSACTION DUY NHẤT
CREATE OR REPLACE FUNCTION public.action_plant_crop(p_plot_id UUID, p_crop_type crop_type)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_seed_item_id TEXT := 'seed_' || p_crop_type;
  v_seed_qty INT;
  v_seed_id UUID;
  v_plot_crop crop_type;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  -- Kiểm tra hạt giống trong kho
  SELECT id, quantity INTO v_seed_id, v_seed_qty
  FROM public.inventory
  WHERE user_id = v_user_id AND item_id = v_seed_item_id
  FOR UPDATE;

  IF v_seed_id IS NULL OR v_seed_qty < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không có đủ hạt giống trong kho!');
  END IF;

  -- Kiểm tra ô đất
  SELECT crop_type INTO v_plot_crop
  FROM public.farm_plots
  WHERE id = p_plot_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_plot_crop IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ô đất này đang có cây trồng!');
  END IF;

  -- Trừ hạt giống
  IF v_seed_qty = 1 THEN
    DELETE FROM public.inventory WHERE id = v_seed_id;
  ELSE
    UPDATE public.inventory SET quantity = quantity - 1, updated_at = NOW() WHERE id = v_seed_id;
  END IF;

  -- Cập nhật ô đất
  UPDATE public.farm_plots
  SET crop_type = p_crop_type,
      planted_at = NOW(),
      is_watered = false,
      is_fertilized = false
  WHERE id = p_plot_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. TƯỚI NƯỚC TRONG 1 TRANSACTION DUY NHẤT
CREATE OR REPLACE FUNCTION public.action_water_crop(p_plot_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_energy INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  -- Kiểm tra năng lượng
  SELECT energy INTO v_energy
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_energy IS NULL OR v_energy < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hết năng lượng! Hãy nghỉ ngơi hoặc ăn món ăn.');
  END IF;

  -- Trừ 1 năng lượng
  UPDATE public.profiles
  SET energy = energy - 1, updated_at = NOW()
  WHERE id = v_user_id;

  -- Cập nhật ô đất
  UPDATE public.farm_plots
  SET is_watered = true
  WHERE id = p_plot_id AND user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. THU HOẠCH TRONG 1 TRANSACTION DUY NHẤT
CREATE OR REPLACE FUNCTION public.action_harvest_crop(p_plot_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plot RECORD;
  v_crop_def RECORD;
  v_planted_epoch BIGINT;
  v_now_epoch BIGINT;
  v_elapsed INT;
  v_required INT;
  v_crop_item_id TEXT;
  v_existing_id UUID;
  v_existing_qty INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập!');
  END IF;

  -- Lấy thông tin ô đất
  SELECT * INTO v_plot
  FROM public.farm_plots
  WHERE id = p_plot_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_plot.crop_type IS NULL OR v_plot.planted_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ô đất không có cây để thu hoạch!');
  END IF;

  -- Lấy định nghĩa cây trồng
  SELECT * INTO v_crop_def
  FROM public.crop_definitions
  WHERE id = v_plot.crop_type;

  IF v_crop_def.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dữ liệu cây trồng không tồn tại!');
  END IF;

  -- Kiểm tra thời gian lớn
  v_planted_epoch := EXTRACT(EPOCH FROM v_plot.planted_at)::BIGINT;
  v_now_epoch := EXTRACT(EPOCH FROM NOW())::BIGINT;
  v_elapsed := (v_now_epoch - v_planted_epoch)::INT;

  IF v_plot.is_fertilized THEN
    v_required := FLOOR(v_crop_def.grow_time_seconds * 0.75)::INT;
  ELSE
    v_required := v_crop_def.grow_time_seconds;
  END IF;

  IF v_elapsed < v_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cây chưa chín! Còn lại ' || (v_required - v_elapsed) || 's.');
  END IF;

  -- Thêm 2 nông sản vào kho
  v_crop_item_id := 'crop_' || v_plot.crop_type;
  SELECT id, quantity INTO v_existing_id, v_existing_qty
  FROM public.inventory
  WHERE user_id = v_user_id AND item_id = v_crop_item_id
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.inventory
    SET quantity = quantity + 2, updated_at = NOW()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.inventory (user_id, item_id, item_name, category, quantity, icon)
    VALUES (v_user_id, v_crop_item_id, v_crop_def.name, 'crop', 2, v_crop_def.icon);
  END IF;

  -- Thưởng EXP
  UPDATE public.profiles
  SET exp = exp + v_crop_def.exp_reward, updated_at = NOW()
  WHERE id = v_user_id;

  -- Reset ô đất
  UPDATE public.farm_plots
  SET crop_type = NULL,
      planted_at = NULL,
      is_watered = false,
      is_fertilized = false
  WHERE id = p_plot_id;

  RETURN jsonb_build_object(
    'success', true,
    'rewardExp', v_crop_def.exp_reward,
    'rewardCropCount', 2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

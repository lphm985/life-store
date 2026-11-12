-- ==============================================================================
-- P2P TRANSACTION RPC (CHỐNG RACE-CONDITION & CONCURRENCY)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.buy_marketplace_item(listing_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_buyer_id UUID := auth.uid();
  v_listing RECORD;
  v_buyer_gold BIGINT;
  v_existing_item RECORD;
BEGIN
  -- 1. Kiểm tra đăng nhập
  IF v_buyer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn chưa đăng nhập!');
  END IF;

  -- 2. Khóa dòng listing để tránh 2 người mua cùng 1 tích tắc (SELECT FOR UPDATE)
  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = listing_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vật phẩm không tồn tại!');
  END IF;

  IF v_listing.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vật phẩm đã được người khác mua hoặc đã hủy!');
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không thể tự mua vật phẩm của chính mình!');
  END IF;

  -- 3. Kiểm tra số dư Vàng của người mua (Khóa dòng profile người mua)
  SELECT gold INTO v_buyer_gold
  FROM public.profiles
  WHERE id = v_buyer_id FOR UPDATE;

  IF v_buyer_gold < v_listing.total_price THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Không đủ Vàng! Cần ' || v_listing.total_price || ' Vàng (Bạn có ' || v_buyer_gold || ').'
    );
  END IF;

  -- 4. Trừ Vàng người mua
  UPDATE public.profiles
  SET gold = gold - v_listing.total_price
  WHERE id = v_buyer_id;

  -- 5. Cộng Vàng cho người bán
  UPDATE public.profiles
  SET gold = gold + v_listing.total_price
  WHERE id = v_listing.seller_id;

  -- 6. Cập nhật trạng thái listing thành 'sold'
  UPDATE public.marketplace_listings
  SET status = 'sold', updated_at = NOW()
  WHERE id = listing_id;

  -- 7. Thêm vật phẩm vào kho người mua
  SELECT * INTO v_existing_item
  FROM public.inventory
  WHERE user_id = v_buyer_id AND item_id = v_listing.item_id;

  IF FOUND THEN
    UPDATE public.inventory
    SET quantity = quantity + v_listing.quantity, updated_at = NOW()
    WHERE id = v_existing_item.id;
  ELSE
    INSERT INTO public.inventory (user_id, item_id, item_name, category, quantity, icon)
    VALUES (
      v_buyer_id, 
      v_listing.item_id, 
      v_listing.item_name, 
      'crop', -- Category mặc định
      v_listing.quantity, 
      'Package'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Giao dịch thành công! Đã mua ' || v_listing.quantity || 'x ' || v_listing.item_name || ' với giá ' || v_listing.total_price || ' Vàng.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

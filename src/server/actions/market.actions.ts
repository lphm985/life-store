'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type CropDef = Database['public']['Tables']['crop_definitions']['Row'];

/**
 * 1. Mua Hạt Giống từ Cửa Hàng (Atomic RPC - 1 Roundtrip)
 */
export async function buySeedFromShop(cropId: CropDef['id'], quantity: number = 1) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('action_buy_seed', {
    p_crop_id: cropId,
    p_quantity: quantity,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; message?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return { success: true, message: result.message };
}

/**
 * 2. Bán Vật Phẩm Cho Cửa Hàng NPC (Atomic RPC - 1 Roundtrip)
 */
export async function sellItemToNpcShop(itemId: string, quantityToSell: number = 1) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('action_sell_to_npc', {
    p_item_id: itemId,
    p_quantity: quantityToSell,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; message?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return { success: true, message: result.message };
}

/**
 * 3. Đăng Bán Vật Phẩm lên Chợ P2P
 */
export async function createMarketListing(itemId: string, quantityToSell: number, pricePerUnit: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');
  if (quantityToSell <= 0 || pricePerUnit <= 0) {
    return { success: false, error: 'Số lượng và giá bán phải lớn hơn 0!' };
  }

  const { data: inventoryItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .single();

  if (!inventoryItem || inventoryItem.quantity < quantityToSell) {
    return {
      success: false,
      error: `Bạn không đủ số lượng trong túi đồ! (Có ${inventoryItem?.quantity || 0}, muốn bán ${quantityToSell})`,
    };
  }

  if (inventoryItem.quantity === quantityToSell) {
    await supabase.from('inventory').delete().eq('id', inventoryItem.id);
  } else {
    await supabase
      .from('inventory')
      .update({ quantity: inventoryItem.quantity - quantityToSell })
      .eq('id', inventoryItem.id);
  }

  const { error } = await supabase.from('marketplace_listings').insert({
    seller_id: user.id,
    item_id: inventoryItem.item_id,
    item_name: inventoryItem.item_name,
    quantity: quantityToSell,
    price_per_unit: pricePerUnit,
    status: 'active',
  });

  if (error) {
    await supabase.from('inventory').upsert({
      ...inventoryItem,
      quantity: inventoryItem.quantity,
    });
    return { success: false, error: error.message };
  }

  revalidatePath('/play/market');
  revalidatePath('/play/inventory');
  return { success: true, message: 'Đã niêm yết vật phẩm lên Chợ P2P thành công!' };
}

/**
 * 4. Hủy Tin Đăng Bán Trên Chợ P2P
 */
export async function cancelMarketListing(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', listingId)
    .eq('seller_id', user.id)
    .eq('status', 'active')
    .single();

  if (!listing) return { success: false, error: 'Mục bán không tồn tại hoặc đã được giao dịch!' };

  await supabase
    .from('marketplace_listings')
    .update({ status: 'cancelled' })
    .eq('id', listing.id);

  const { data: existingItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', listing.item_id)
    .maybeSingle();

  if (existingItem) {
    await supabase
      .from('inventory')
      .update({ quantity: existingItem.quantity + listing.quantity })
      .eq('id', existingItem.id);
  } else {
    await supabase.from('inventory').insert({
      user_id: user.id,
      item_id: listing.item_id,
      item_name: listing.item_name,
      category: 'crop',
      quantity: listing.quantity,
      icon: 'Package',
    });
  }

  revalidatePath('/play/market');
  revalidatePath('/play/inventory');
  return { success: true, message: 'Đã hủy niêm yết và nhận lại vật phẩm về túi!' };
}

/**
 * 5. Mua Vật Phẩm Từ Chợ P2P
 */
export async function buyFromMarketplace(listingId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('buy_marketplace_item', {
    listing_id: listingId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; message?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return { success: true, message: result.message };
}

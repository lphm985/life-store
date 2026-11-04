'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type CropDef = Database['public']['Tables']['crop_definitions']['Row'];

/**
 * 1. Mua Hạt Giống từ Cửa Hàng Hệ Thống (Shop NPC)
 */
export async function buySeedFromShop(cropId: CropDef['id'], quantity: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');
  if (quantity <= 0) return { success: false, error: 'Số lượng mua không hợp lệ!' };

  // 1. Lấy thông tin cây trồng
  const { data: cropDef } = await supabase
    .from('crop_definitions')
    .select('*')
    .eq('id', cropId)
    .single();

  if (!cropDef) return { success: false, error: 'Cây trồng không tồn tại!' };

  const totalCost = cropDef.buy_price * quantity;

  // 2. Kiểm tra Vàng của người chơi
  const { data: profile } = await supabase
    .from('profiles')
    .select('gold')
    .eq('id', user.id)
    .single();

  if (!profile || profile.gold < totalCost) {
    return {
      success: false,
      error: `Không đủ Vàng! Cần ${totalCost} Vàng (Bạn có ${profile?.gold || 0}).`,
    };
  }

  // 3. Trừ Vàng
  await supabase
    .from('profiles')
    .update({ gold: profile.gold - totalCost })
    .eq('id', user.id);

  // 4. Cộng hạt giống vào kho đồ
  const seedItemId = `seed_${cropDef.id}`;
  const seedName = `Hạt ${cropDef.name}`;

  const { data: existingSeed } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', seedItemId)
    .maybeSingle();

  if (existingSeed) {
    await supabase
      .from('inventory')
      .update({ quantity: existingSeed.quantity + quantity })
      .eq('id', existingSeed.id);
  } else {
    await supabase.from('inventory').insert({
      user_id: user.id,
      item_id: seedItemId,
      item_name: seedName,
      category: 'seed',
      quantity,
      icon: '🌱',
    });
  }

  revalidatePath('/play');
  return { success: true, message: `Đã mua ${quantity}x ${seedName}!` };
}

/**
 * 2. BÁN VẬT PHẨM CHO CỬA HÀNG HỆ THỐNG (SELL TO NPC SHOP)
 */
export async function sellItemToNpcShop(itemId: string, quantityToSell: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');
  if (quantityToSell <= 0) return { success: false, error: 'Số lượng bán không hợp lệ!' };

  // 1. Kiểm tra vật phẩm trong túi người chơi
  const { data: inventoryItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .single();

  if (!inventoryItem || inventoryItem.quantity < quantityToSell) {
    return { success: false, error: 'Bạn không đủ số lượng vật phẩm này để bán!' };
  }

  // 2. Tính giá bán theo định nghĩa
  let pricePerUnit = 10; // Giá sàn mặc định nếu là đồ rơi tự do

  if (inventoryItem.item_id.startsWith('crop_')) {
    const cropId = inventoryItem.item_id.replace('crop_', '');
    const { data: cropDef } = await supabase
      .from('crop_definitions')
      .select('sell_price')
      .eq('id', cropId as any)
      .single();
    if (cropDef) pricePerUnit = cropDef.sell_price;
  } else if (inventoryItem.item_id.startsWith('seed_')) {
    const cropId = inventoryItem.item_id.replace('seed_', '');
    const { data: cropDef } = await supabase
      .from('crop_definitions')
      .select('buy_price')
      .eq('id', cropId as any)
      .single();
    if (cropDef) pricePerUnit = Math.floor(cropDef.buy_price * 0.5); // Bán lại hạt giống được 50% giá mua
  } else if (inventoryItem.category === 'herb') {
    pricePerUnit = 25; // Thảo dược bán shop NPC
  } else if (inventoryItem.category === 'processed_food') {
    pricePerUnit = 40; // Thức ăn đã chế biến
  } else if (inventoryItem.category === 'potion') {
    pricePerUnit = 60; // Dược phẩm cao cấp
  }

  const totalGoldEarned = pricePerUnit * quantityToSell;

  // 3. Trừ đồ trong kho
  if (inventoryItem.quantity === quantityToSell) {
    await supabase.from('inventory').delete().eq('id', inventoryItem.id);
  } else {
    await supabase
      .from('inventory')
      .update({ quantity: inventoryItem.quantity - quantityToSell })
      .eq('id', inventoryItem.id);
  }

  // 4. Cộng Vàng cho người chơi
  const { data: profile } = await supabase
    .from('profiles')
    .select('gold')
    .eq('id', user.id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ gold: profile.gold + totalGoldEarned })
      .eq('id', user.id);
  }

  revalidatePath('/play');
  return {
    success: true,
    message: `Đã bán ${quantityToSell}x ${inventoryItem.item_name} và nhận được +${totalGoldEarned} Vàng! 🪙`,
  };
}

/**
 * 3. Đăng Bán Vật Phẩm lên Chợ P2P (Marketplace Listing)
 */
export async function createMarketListing(itemId: string, quantityToSell: number, pricePerUnit: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');
  if (quantityToSell <= 0 || pricePerUnit <= 0) {
    return { success: false, error: 'Số lượng và giá bán phải lớn hơn 0!' };
  }

  // 1. Kiểm tra tồn kho
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

  // 2. Trừ vật phẩm trong kho người bán trước khi treo lên chợ
  if (inventoryItem.quantity === quantityToSell) {
    await supabase.from('inventory').delete().eq('id', inventoryItem.id);
  } else {
    await supabase
      .from('inventory')
      .update({ quantity: inventoryItem.quantity - quantityToSell })
      .eq('id', inventoryItem.id);
  }

  // 3. Tạo dòng đăng bán trên marketplace_listings
  const { error } = await supabase.from('marketplace_listings').insert({
    seller_id: user.id,
    item_id: inventoryItem.item_id,
    item_name: inventoryItem.item_name,
    quantity: quantityToSell,
    price_per_unit: pricePerUnit,
    status: 'active',
  });

  if (error) {
    // Hoàn trả lại đồ nếu lỗi insert
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
 * 4. Hủy Tin Đăng Bán Trên Chợ P2P & Nhận Lại Đồ
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

  // 1. Đổi status thành cancelled
  await supabase
    .from('marketplace_listings')
    .update({ status: 'cancelled' })
    .eq('id', listing.id);

  // 2. Hoàn lại vật phẩm vào kho
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

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

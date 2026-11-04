'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type CropType = Database['public']['Tables']['crop_definitions']['Row']['id'];

/**
 * Gieo hạt giống vào ô đất
 */
export async function plantCrop(plotId: string, cropType: CropType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Kiểm tra xem người chơi có hạt giống trong kho không
  const seedItemId = `seed_${cropType}`;
  const { data: inventoryItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', seedItemId)
    .single();

  if (!inventoryItem || inventoryItem.quantity < 1) {
    return { success: false, error: 'Bạn không có đủ hạt giống trong kho!' };
  }

  // 2. Kiểm tra ô đất có đang trống không
  const { data: plot } = await supabase
    .from('farm_plots')
    .select('*')
    .eq('id', plotId)
    .eq('user_id', user.id)
    .single();

  if (!plot || plot.crop_type !== null) {
    return { success: false, error: 'Ô đất này đang có cây trồng!' };
  }

  // 3. Trừ hạt giống trong kho
  if (inventoryItem.quantity === 1) {
    await supabase.from('inventory').delete().eq('id', inventoryItem.id);
  } else {
    await supabase
      .from('inventory')
      .update({ quantity: inventoryItem.quantity - 1 })
      .eq('id', inventoryItem.id);
  }

  // 4. Cập nhật ô đất
  await supabase
    .from('farm_plots')
    .update({
      crop_type: cropType,
      planted_at: new Date().toISOString(),
      is_watered: false,
      is_fertilized: false,
    })
    .eq('id', plotId);

  revalidatePath('/play/farm');
  return { success: true };
}

/**
 * Tưới nước cho cây (Giúp cây tăng trưởng bình thường hoặc tăng tốc)
 */
export async function waterCrop(plotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Trừ 1 năng lượng của người chơi
  const { data: profile } = await supabase
    .from('profiles')
    .select('energy')
    .eq('id', user.id)
    .single();

  if (!profile || profile.energy < 1) {
    return { success: false, error: 'Hết năng lượng! Hãy nghỉ ngơi để hồi phục.' };
  }

  await supabase
    .from('profiles')
    .update({ energy: profile.energy - 1 })
    .eq('id', user.id);

  await supabase
    .from('farm_plots')
    .update({ is_watered: true })
    .eq('id', plotId)
    .eq('user_id', user.id);

  revalidatePath('/play');
  return { success: true };
}

/**
 * Thu hoạch cây trồng (Server-authoritative validation: Kiểm tra thời gian chuẩn trên server)
 */
export async function harvestCrop(plotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Lấy thông tin ô đất
  const { data: plot } = await supabase
    .from('farm_plots')
    .select('*')
    .eq('id', plotId)
    .eq('user_id', user.id)
    .single();

  if (!plot || !plot.crop_type || !plot.planted_at) {
    return { success: false, error: 'Ô đất không có cây để thu hoạch!' };
  }

  // 2. Lấy định nghĩa thời gian sinh trưởng của cây
  const { data: cropDef } = await supabase
    .from('crop_definitions')
    .select('*')
    .eq('id', plot.crop_type)
    .single();

  if (!cropDef) {
    return { success: false, error: 'Dữ liệu cây trồng không tồn tại!' };
  }

  // 3. Tính toán thời gian thực tế đã trôi qua (Server check chống gian lận)
  const plantedTime = new Date(plot.planted_at).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - plantedTime) / 1000);

  // Nếu bón phân có thể giảm 25% thời gian (ví dụ logic mở rộng)
  const requiredSeconds = plot.is_fertilized
    ? Math.floor(cropDef.grow_time_seconds * 0.75)
    : cropDef.grow_time_seconds;

  if (elapsedSeconds < requiredSeconds) {
    const remaining = requiredSeconds - elapsedSeconds;
    return { success: false, error: `Cây chưa chín! Còn lại ${remaining}s.` };
  }

  // 4. Cộng nông sản vào kho đồ
  const cropItemId = `crop_${plot.crop_type}`;
  const { data: existingCrop } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', cropItemId)
    .maybeSingle();

  if (existingCrop) {
    await supabase
      .from('inventory')
      .update({ quantity: existingCrop.quantity + 2 }) // Mỗi lần thu hoạch được 2 nông sản
      .eq('id', existingCrop.id);
  } else {
    await supabase.from('inventory').insert({
      user_id: user.id,
      item_id: cropItemId,
      item_name: cropDef.name,
      category: 'crop',
      quantity: 2,
      icon: cropDef.icon,
    });
  }

  // 5. Cộng kinh nghiệm và Reset ô đất
  const { data: profile } = await supabase
    .from('profiles')
    .select('exp, level')
    .eq('id', user.id)
    .single();

  if (profile) {
    const newExp = profile.exp + cropDef.exp_reward;
    await supabase
      .from('profiles')
      .update({ exp: newExp })
      .eq('id', user.id);
  }

  await supabase
    .from('farm_plots')
    .update({
      crop_type: null,
      planted_at: null,
      is_watered: false,
      is_fertilized: false,
    })
    .eq('id', plotId);

  revalidatePath('/play');
  return { success: true, rewardExp: cropDef.exp_reward, rewardCropCount: 2 };
}

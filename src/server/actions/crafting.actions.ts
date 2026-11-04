'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database, RecipeIngredient } from '@/types/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

/**
 * Chế biến vật phẩm (áp dụng chung cho cả Món Ăn Bếp & Thuốc Dược Sư)
 */
export async function craftItem(recipeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Lấy thông tin công thức từ database (Admin cấu hình)
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('is_active', true)
    .single();

  if (!recipe) {
    return { success: false, error: 'Công thức không tồn tại hoặc đã bị vô hiệu hóa!' };
  }

  const ingredients = recipe.ingredients as unknown as RecipeIngredient[];
  const ingredientItemIds = ingredients.map((ing) => ing.itemId);

  // 2. Kiểm tra tồn kho của người chơi
  const { data: userInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .in('item_id', ingredientItemIds);

  const inventoryMap = new Map((userInventory || []).map((item) => [item.item_id, item]));

  for (const ing of ingredients) {
    const userItem = inventoryMap.get(ing.itemId);
    if (!userItem || userItem.quantity < ing.quantity) {
      return {
        success: false,
        error: `Thiếu nguyên liệu: ${ing.itemName}! (Cần ${ing.quantity}, có ${userItem?.quantity || 0})`,
      };
    }
  }

  // 3. Trừ nguyên liệu
  for (const ing of ingredients) {
    const userItem = inventoryMap.get(ing.itemId)!;
    if (userItem.quantity === ing.quantity) {
      await supabase.from('inventory').delete().eq('id', userItem.id);
    } else {
      await supabase
        .from('inventory')
        .update({ quantity: userItem.quantity - ing.quantity })
        .eq('id', userItem.id);
    }
  }

  // 4. Cộng thành phẩm vào kho đồ (category: 'potion' hoặc 'processed_food')
  const itemCategory = recipe.category === 'potion' ? 'potion' : 'processed_food';
  const { data: existingItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', recipe.result_item_id)
    .maybeSingle();

  if (existingItem) {
    await supabase
      .from('inventory')
      .update({ quantity: existingItem.quantity + recipe.result_quantity })
      .eq('id', existingItem.id);
  } else {
    await supabase.from('inventory').insert({
      user_id: user.id,
      item_id: recipe.result_item_id,
      item_name: recipe.result_item_name,
      category: itemCategory,
      quantity: recipe.result_quantity,
      icon: recipe.icon,
    });
  }

  // 5. Thưởng EXP cho người chơi
  const { data: profile } = await supabase
    .from('profiles')
    .select('exp')
    .eq('id', user.id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ exp: profile.exp + recipe.exp_reward })
      .eq('id', user.id);
  }

  revalidatePath('/play');
  return {
    success: true,
    resultName: recipe.result_item_name,
    expReward: recipe.exp_reward,
  };
}

/**
 * Sử dụng thuốc lên Minion RPG
 */
export async function usePotionOnMinion(potionItemId: string, minionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Kiểm tra potion trong kho
  const { data: potionItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', potionItemId)
    .single();

  if (!potionItem || potionItem.quantity < 1) {
    return { success: false, error: 'Bạn không có loại thuốc này trong kho!' };
  }

  // 2. Lấy thông số hiệu ứng của thuốc từ recipes
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('result_item_id', potionItemId)
    .single();

  if (!recipe || !recipe.effect_type) {
    return { success: false, error: 'Dữ liệu dược tính không hợp lệ!' };
  }

  // 3. Lấy thông tin Minion
  const { data: minion } = await supabase
    .from('minions')
    .select('*')
    .eq('id', minionId)
    .eq('user_id', user.id)
    .single();

  if (!minion) {
    return { success: false, error: 'Không tìm thấy Minion chỉ định!' };
  }

  if (minion.status === 'expedition') {
    return { success: false, error: 'Minion đang đi thám hiểm, không thể dùng thuốc!' };
  }

  // 4. Áp dụng hiệu ứng thuốc lên Minion
  let updateData: Partial<Database['public']['Tables']['minions']['Update']> = {};
  let successMessage = '';

  switch (recipe.effect_type) {
    case 'heal_hp':
      if (!minion.is_alive) return { success: false, error: 'Minion đã tử trận! Cần dùng Thánh Thủy Phục Sinh.' };
      if (minion.hp >= minion.max_hp) return { success: false, error: 'Minion đang đầy máu (100%)!' };
      const newHp = Math.min(minion.max_hp, minion.hp + recipe.effect_value);
      updateData = { hp: newHp };
      successMessage = `Đã hồi phục ${newHp - minion.hp} Máu cho ${minion.name}!`;
      break;

    case 'revive':
      if (minion.is_alive) return { success: false, error: 'Minion vẫn còn sống bình thường!' };
      updateData = { is_alive: true, hp: Math.floor(minion.max_hp * 0.5) };
      successMessage = `${minion.name} đã được hồi sinh với 50% lượng máu!`;
      break;

    case 'temp_dmg_boost':
      updateData = { temp_dmg_buff: (minion.temp_dmg_buff || 0) + recipe.effect_value };
      successMessage = `Tăng +${recipe.effect_value} Sức Mạnh cho chuyến thám hiểm tới!`;
      break;

    case 'temp_def_boost':
      updateData = { temp_def_buff: (minion.temp_def_buff || 0) + recipe.effect_value };
      successMessage = `Tăng +${recipe.effect_value} Phòng Thủ cho chuyến thám hiểm tới!`;
      break;

    case 'perm_stat_boost':
      updateData = { power: minion.power + recipe.effect_value };
      successMessage = `${minion.name} được tăng vĩnh viễn +${recipe.effect_value} Sức Mạnh cơ bản!`;
      break;

    case 'level_up':
      updateData = { level: minion.level + 1, power: minion.power + 5, max_hp: minion.max_hp + 20, hp: minion.max_hp + 20 };
      successMessage = `${minion.name} đã thăng lên cấp ${minion.level + 1}!`;
      break;

    default:
      return { success: false, error: 'Hiệu ứng thuốc chưa hỗ trợ!' };
  }

  // 5. Cập nhật Minion & Trừ 1 lọ thuốc
  await supabase.from('minions').update(updateData).eq('id', minion.id);

  if (potionItem.quantity === 1) {
    await supabase.from('inventory').delete().eq('id', potionItem.id);
  } else {
    await supabase
      .from('inventory')
      .update({ quantity: potionItem.quantity - 1 })
      .eq('id', potionItem.id);
  }

  revalidatePath('/play');
  return { success: true, message: successMessage };
}

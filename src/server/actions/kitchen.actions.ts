'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { RECIPES } from '@/lib/constants/recipes';

/**
 * Nấu món ăn (Kiểm tra nguyên liệu và trừ nông sản trong kho đồ)
 */
export async function cookRecipe(recipeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) {
    return { success: false, error: 'Công thức nấu ăn không tồn tại!' };
  }

  // 1. Kiểm tra tồn kho của tất cả nguyên liệu yêu cầu
  const ingredientItemIds = recipe.ingredients.map((ing) => ing.itemId);
  const { data: userInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .in('item_id', ingredientItemIds);

  const inventoryMap = new Map((userInventory || []).map((item) => [item.item_id, item]));

  for (const ingredient of recipe.ingredients) {
    const userItem = inventoryMap.get(ingredient.itemId);
    if (!userItem || userItem.quantity < ingredient.quantity) {
      return {
        success: false,
        error: `Không đủ nguyên liệu: thiếu ${ingredient.itemName}! Cần ${ingredient.quantity}, bạn có ${userItem?.quantity || 0}.`,
      };
    }
  }

  // 2. Trừ nguyên liệu trong kho
  for (const ingredient of recipe.ingredients) {
    const userItem = inventoryMap.get(ingredient.itemId)!;
    if (userItem.quantity === ingredient.quantity) {
      await supabase.from('inventory').delete().eq('id', userItem.id);
    } else {
      await supabase
        .from('inventory')
        .update({ quantity: userItem.quantity - 1 * ingredient.quantity })
        .eq('id', userItem.id);
    }
  }

  // 3. Thêm món ăn hoàn thiện vào kho đồ
  const { data: existingFood } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', recipe.resultItemId)
    .maybeSingle();

  if (existingFood) {
    await supabase
      .from('inventory')
      .update({ quantity: existingFood.quantity + recipe.resultQuantity })
      .eq('id', existingFood.id);
  } else {
    await supabase.from('inventory').insert({
      user_id: user.id,
      item_id: recipe.resultItemId,
      item_name: recipe.resultName,
      category: 'processed_food',
      quantity: recipe.resultQuantity,
      icon: recipe.icon,
    });
  }

  // 4. Cộng EXP làm bếp cho người chơi
  const { data: profile } = await supabase
    .from('profiles')
    .select('exp')
    .eq('id', user.id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ exp: profile.exp + recipe.expReward })
      .eq('id', user.id);
  }

  revalidatePath('/play');
  return {
    success: true,
    resultName: recipe.resultName,
    expReward: recipe.expReward,
  };
}

/**
 * Tiêu thụ thức ăn trực tiếp để hồi phục Năng Lượng (Energy) cho Người chơi
 */
export async function consumeFood(foodItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Tìm công thức ứng với món ăn để biết số năng lượng hồi phục
  const recipe = RECIPES.find((r) => r.resultItemId === foodItemId);
  if (!recipe) {
    return { success: false, error: 'Món ăn không hợp lệ!' };
  }

  // 1. Kiểm tra thức ăn trong kho
  const { data: foodItem } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', foodItemId)
    .single();

  if (!foodItem || foodItem.quantity < 1) {
    return { success: false, error: 'Bạn không có món ăn này trong túi!' };
  }

  // 2. Lấy chỉ số năng lượng hiện tại
  const { data: profile } = await supabase
    .from('profiles')
    .select('energy, max_energy')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Không tìm thấy người chơi!' };

  if (profile.energy >= profile.max_energy) {
    return { success: false, error: 'Năng lượng của bạn đã đầy (100%)!' };
  }

  // 3. Trừ 1 món ăn
  if (foodItem.quantity === 1) {
    await supabase.from('inventory').delete().eq('id', foodItem.id);
  } else {
    await supabase
      .from('inventory')
      .update({ quantity: foodItem.quantity - 1 })
      .eq('id', foodItem.id);
  }

  // 4. Hồi năng lượng (không vượt quá max_energy)
  const newEnergy = Math.min(profile.max_energy, profile.energy + recipe.energyRestore);
  await supabase
    .from('profiles')
    .update({ energy: newEnergy })
    .eq('id', user.id);

  revalidatePath('/play');
  return { success: true, restored: newEnergy - profile.energy };
}

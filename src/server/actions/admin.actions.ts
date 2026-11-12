'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database, ExpeditionDropItem, RecipeIngredient } from '@/types/database.types';

type CropDef = Database['public']['Tables']['crop_definitions']['Row'];
type ExpeditionMission = Database['public']['Tables']['expedition_missions']['Row'];
type MinionTemplate = Database['public']['Tables']['minion_templates']['Row'];
type Recipe = Database['public']['Tables']['recipes']['Row'];

// Helper kiểm tra quyền Admin
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return { supabase, user };
}

/**
 * 1. Cập nhật thông số Cây Trồng
 */
export async function updateCropDefinition(
  cropId: CropDef['id'],
  data: {
    name: string;
    grow_time_seconds: number;
    buy_price: number;
    sell_price: number;
    exp_reward: number;
    icon: string;
  }
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('crop_definitions')
    .update(data)
    .eq('id', cropId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/play/farm');
  revalidatePath('/admin/crops');
  return { success: true };
}

/**
 * 2. Cập nhật hoặc Thêm Bản Đồ Thám Hiểm
 */
export async function upsertExpeditionMission(missionData: {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  description: string;
  duration_seconds: number;
  min_power_required: number;
  recommended_power: number;
  gold_reward: number;
  exp_reward: number;
  possible_drops: ExpeditionDropItem[];
  icon: string;
  is_active: boolean;
}) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('expedition_missions')
    .upsert({
      ...missionData,
      possible_drops: missionData.possible_drops as any,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/play/minions');
  revalidatePath('/admin/expeditions');
  return { success: true };
}

/**
 * 3. Cập nhật hoặc Thêm Mẫu Nhân Viên (Minion Template)
 */
export async function upsertMinionTemplate(templateData: {
  id: string;
  name: string;
  avatar: string;
  base_power: number;
  base_hp: number;
  base_stamina: number;
  recruit_cost_gold: number;
  recruit_cost_gems: number;
  description: string;
  is_active: boolean;
}) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('minion_templates')
    .upsert(templateData);

  if (error) return { success: false, error: error.message };

  revalidatePath('/play/minions');
  revalidatePath('/admin/minions');
  return { success: true };
}

/**
 * 4. Cập nhật hoặc Thêm Công Thức Nấu Ăn / Chế Thuốc (Recipe)
 */
export async function upsertRecipe(recipeData: {
  id: string;
  name: string;
  category: 'food' | 'potion';
  description: string;
  craft_time_seconds: number;
  ingredients: RecipeIngredient[];
  result_item_id: string;
  result_item_name: string;
  result_quantity: number;
  icon: string;
  exp_reward: number;
  effect_type: Recipe['effect_type'];
  effect_duration_type: Recipe['effect_duration_type'];
  effect_value: number;
  is_active: boolean;
}) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('recipes')
    .upsert({
      ...recipeData,
      ingredients: recipeData.ingredients as any,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/play/kitchen');
  revalidatePath('/admin/recipes');
  return { success: true };
}

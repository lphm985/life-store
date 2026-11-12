'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type CropType = Database['public']['Tables']['crop_definitions']['Row']['id'];

/**
 * Gieo hạt giống vào ô đất (Chạy qua RPC Postgres Transaction - 1 Network Roundtrip duy nhất)
 */
export async function plantCrop(plotId: string, cropType: CropType) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('action_plant_crop', {
    p_plot_id: plotId,
    p_crop_type: cropType,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return { success: true };
}

/**
 * Tưới nước cho cây (1 Network Roundtrip duy nhất)
 */
export async function waterCrop(plotId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('action_water_crop', {
    p_plot_id: plotId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return { success: true };
}

/**
 * Thu hoạch cây trồng (1 Network Roundtrip duy nhất)
 */
export async function harvestCrop(plotId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('action_harvest_crop', {
    p_plot_id: plotId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as {
    success: boolean;
    error?: string;
    rewardExp?: number;
    rewardCropCount?: number;
  };

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return {
    success: true,
    rewardExp: result.rewardExp,
    rewardCropCount: result.rewardCropCount,
  };
}

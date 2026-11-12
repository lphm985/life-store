'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';

type ExpeditionMission = Database['public']['Tables']['expedition_missions']['Row'];
type MinionTemplate = Database['public']['Tables']['minion_templates']['Row'];

/**
 * Chiêu mộ Minion từ mẫu (Template)
 */
export async function recruitMinion(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: template } = await supabase
    .from('minion_templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .single();

  if (!template) {
    return { success: false, error: 'Mẫu nhân viên không tồn tại hoặc đã ngừng chiêu mộ!' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('gold, gems')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Không tìm thấy hồ sơ người chơi!' };

  if (profile.gold < template.recruit_cost_gold) {
    return {
      success: false,
      error: `Không đủ Vàng! Cần ${template.recruit_cost_gold} Vàng (Bạn có ${profile.gold}).`,
    };
  }

  if (profile.gems < template.recruit_cost_gems) {
    return {
      success: false,
      error: `Không đủ Kim Cương! Cần ${template.recruit_cost_gems} Gems (Bạn có ${profile.gems}).`,
    };
  }

  await supabase
    .from('profiles')
    .update({
      gold: profile.gold - template.recruit_cost_gold,
      gems: profile.gems - template.recruit_cost_gems,
    })
    .eq('id', user.id);

  const { data: newMinion, error } = await supabase
    .from('minions')
    .insert({
      user_id: user.id,
      name: template.name,
      avatar: template.avatar,
      level: 1,
      power: template.base_power,
      hp: template.base_hp,
      max_hp: template.base_hp,
      stamina: template.base_stamina,
      is_alive: true,
      status: 'idle',
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/play');
  return { success: true, minion: newMinion };
}

/**
 * Cử Minion đi thám hiểm
 */
export async function dispatchExpedition(minionId: string, missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: mission } = await supabase
    .from('expedition_missions')
    .select('*')
    .eq('id', missionId)
    .eq('is_active', true)
    .single();

  if (!mission) {
    return { success: false, error: 'Bản đồ thám hiểm không tồn tại!' };
  }

  const { data: minion } = await supabase
    .from('minions')
    .select('*')
    .eq('id', minionId)
    .eq('user_id', user.id)
    .single();

  if (!minion) return { success: false, error: 'Không tìm thấy nhân viên!' };
  if (!minion.is_alive) return { success: false, error: 'Nhân viên đã tử trận! Hãy dùng Thánh Thủy Phục Sinh.' };
  if (minion.status === 'expedition') return { success: false, error: 'Nhân viên đang trong chuyến thám hiểm khác!' };

  const totalPower = minion.power + (minion.temp_dmg_buff || 0);
  if (totalPower < mission.min_power_required) {
    return {
      success: false,
      error: `Sức mạnh không đủ! Yêu cầu tối thiểu ${mission.min_power_required} Sức Mạnh (Bạn có ${totalPower}). Hãy uống Dược Thủy Cuồng Nộ!`,
    };
  }

  const endsAt = new Date(Date.now() + mission.duration_seconds * 1000).toISOString();

  await supabase
    .from('minions')
    .update({
      status: 'expedition',
      expedition_mission_id: mission.id,
      expedition_ends_at: endsAt,
    })
    .eq('id', minion.id);

  revalidatePath('/play/minions');
  return { success: true, endsAt };
}

/**
 * Nhận thưởng khi chuyến thám hiểm kết thúc (Atomic RPC - 1 Roundtrip)
 */
export async function claimExpeditionReward(minionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('action_claim_expedition', {
    p_minion_id: minionId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as {
    success: boolean;
    error?: string;
    goldReward?: number;
    expReward?: number;
    damageTaken?: number;
    isAlive?: boolean;
    drops?: { itemName: string; quantity: number; icon: string }[];
  };

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/play');
  return {
    success: true,
    goldReward: result.goldReward,
    expReward: result.expReward,
    damageTaken: result.damageTaken,
    isAlive: result.isAlive,
    drops: result.drops,
  };
}

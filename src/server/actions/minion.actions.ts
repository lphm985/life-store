'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database, ExpeditionDropItem } from '@/types/database.types';

type ExpeditionMission = Database['public']['Tables']['expedition_missions']['Row'];
type MinionTemplate = Database['public']['Tables']['minion_templates']['Row'];

/**
 * Chiêu mộ Minion từ mẫu (Template) - Trả bằng Vàng hoặc Kim Cương
 */
export async function recruitMinion(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Lấy mẫu Minion từ database
  const { data: template } = await supabase
    .from('minion_templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .single();

  if (!template) {
    return { success: false, error: 'Mẫu nhân viên không tồn tại hoặc đã ngừng chiêu mộ!' };
  }

  // 2. Kiểm tra tài nguyên người chơi (Gold & Gems)
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

  // 3. Trừ Vàng & Gems
  await supabase
    .from('profiles')
    .update({
      gold: profile.gold - template.recruit_cost_gold,
      gems: profile.gems - template.recruit_cost_gems,
    })
    .eq('id', user.id);

  // 4. Tạo nhân viên mới cho người chơi
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
 * Cử Minion đi thám hiểm (Đọc trực tiếp thời gian & yêu cầu từ Database)
 */
export async function dispatchExpedition(minionId: string, missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Lấy thông tin bản đồ thám hiểm từ Database
  const { data: mission } = await supabase
    .from('expedition_missions')
    .select('*')
    .eq('id', missionId)
    .eq('is_active', true)
    .single();

  if (!mission) {
    return { success: false, error: 'Bản đồ thám hiểm không tồn tại!' };
  }

  // 2. Lấy thông tin Minion
  const { data: minion } = await supabase
    .from('minions')
    .select('*')
    .eq('id', minionId)
    .eq('user_id', user.id)
    .single();

  if (!minion) return { success: false, error: 'Không tìm thấy nhân viên!' };
  if (!minion.is_alive) return { success: false, error: 'Nhân viên đã tử trận! Hãy dùng Thánh Thủy Phục Sinh.' };
  if (minion.status === 'expedition') return { success: false, error: 'Nhân viên đang trong chuyến thám hiểm khác!' };

  // 3. Kiểm tra sức mạnh tối thiểu (Tính cả buff thuốc tạm thời)
  const totalPower = minion.power + (minion.temp_dmg_buff || 0);
  if (totalPower < mission.min_power_required) {
    return {
      success: false,
      error: `Sức mạnh không đủ! Yêu cầu tối thiểu ${mission.min_power_required} Sức Mạnh (Bạn có ${totalPower}). Hãy uống Dược Thủy Cuồng Nộ!`,
    };
  }

  // 4. Tính thời điểm hoàn thành từ duration_seconds trong Database
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
 * Nhận thưởng khi chuyến thám hiểm kết thúc (Đọc tỷ lệ rơi đồ từ Database JSONB)
 */
export async function claimExpeditionReward(minionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Lấy thông tin Minion
  const { data: minion } = await supabase
    .from('minions')
    .select('*')
    .eq('id', minionId)
    .eq('user_id', user.id)
    .single();

  if (!minion || minion.status !== 'expedition' || !minion.expedition_ends_at || !minion.expedition_mission_id) {
    return { success: false, error: 'Nhân viên không trong chuyến thám hiểm nào!' };
  }

  // 2. Server check: Kiểm tra thời gian kết thúc
  const endsAtTime = new Date(minion.expedition_ends_at).getTime();
  const now = Date.now();
  if (now < endsAtTime) {
    const remainingSecs = Math.ceil((endsAtTime - now) / 1000);
    return { success: false, error: `Chuyến thám hiểm chưa hoàn tất! Còn lại ${remainingSecs}s.` };
  }

  // 3. Lấy thông tin bản đồ từ Database
  const { data: mission } = await supabase
    .from('expedition_missions')
    .select('*')
    .eq('id', minion.expedition_mission_id)
    .single();

  if (!mission) return { success: false, error: 'Dữ liệu nhiệm vụ không tìm thấy!' };

  // 4. Tính toán lượng sát thương nhận phải
  const totalPower = minion.power + (minion.temp_dmg_buff || 0);
  const totalDef = minion.temp_def_buff || 0;

  let damageTaken = 0;
  if (totalPower < mission.recommended_power) {
    damageTaken = Math.max(10, Math.floor((mission.recommended_power - totalPower) * 2 - totalDef));
  } else {
    damageTaken = Math.max(0, 15 - totalDef);
  }

  const finalHp = Math.max(0, minion.hp - damageTaken);
  const isAlive = finalHp > 0;

  // 5. Roll tỷ lệ nhận vật phẩm thưởng từ cột possible_drops trong Database
  const possibleDrops = mission.possible_drops as unknown as ExpeditionDropItem[];
  const awardedDrops: { itemName: string; quantity: number; icon: string }[] = [];

  for (const drop of possibleDrops || []) {
    if (Math.random() <= drop.chance) {
      awardedDrops.push({ itemName: drop.itemName, quantity: drop.quantity, icon: drop.icon });

      const { data: existingItem } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', drop.itemId)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from('inventory')
          .update({ quantity: existingItem.quantity + drop.quantity })
          .eq('id', existingItem.id);
      } else {
        await supabase.from('inventory').insert({
          user_id: user.id,
          item_id: drop.itemId,
          item_name: drop.itemName,
          category: drop.category,
          quantity: drop.quantity,
          icon: drop.icon,
        });
      }
    }
  }

  // 6. Cộng Vàng & EXP
  const { data: profile } = await supabase
    .from('profiles')
    .select('gold, exp')
    .eq('id', user.id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        gold: profile.gold + mission.gold_reward,
        exp: profile.exp + mission.exp_reward,
      })
      .eq('id', user.id);
  }

  // 7. Reset Minion về trạng thái rảnh
  await supabase
    .from('minions')
    .update({
      status: 'idle',
      expedition_mission_id: null,
      expedition_ends_at: null,
      hp: finalHp,
      is_alive: isAlive,
      temp_dmg_buff: 0,
      temp_def_buff: 0,
    })
    .eq('id', minion.id);

  revalidatePath('/play');
  return {
    success: true,
    goldReward: mission.gold_reward,
    expReward: mission.exp_reward,
    damageTaken,
    isAlive,
    drops: awardedDrops,
  };
}

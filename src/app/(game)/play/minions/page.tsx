import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MinionsView } from '@/components/game/MinionsView';

export default async function MinionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Lấy danh sách Minions của người chơi
  const { data: minions } = await supabase
    .from('minions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // 2. Lấy các bản đồ thám hiểm đang kích hoạt (Dynamic từ Database)
  const { data: missions } = await supabase
    .from('expedition_missions')
    .select('*')
    .eq('is_active', true)
    .order('duration_seconds', { ascending: true });

  // 3. Lấy các mẫu nhân viên chiêu mộ (Dynamic từ Database)
  const { data: templates } = await supabase
    .from('minion_templates')
    .select('*')
    .eq('is_active', true)
    .order('recruit_cost_gold', { ascending: true });

  // 4. Lấy các loại thuốc trong túi đồ (category = 'potion')
  const { data: userPotions } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', 'potion');

  return (
    <MinionsView
      minions={minions || []}
      missions={missions || []}
      templates={templates || []}
      userPotions={userPotions || []}
    />
  );
}

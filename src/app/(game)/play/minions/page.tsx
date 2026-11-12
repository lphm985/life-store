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

  // Lấy song song Minions, Bản đồ và Mẫu nhân viên (Túi đồ đã có GameContext quản lý 0ms)
  const [{ data: minions }, { data: missions }, { data: templates }] = await Promise.all([
    supabase
      .from('minions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('expedition_missions')
      .select('*')
      .eq('is_active', true)
      .order('duration_seconds', { ascending: true }),
    supabase
      .from('minion_templates')
      .select('*')
      .eq('is_active', true)
      .order('recruit_cost_gold', { ascending: true }),
  ]);

  return (
    <MinionsView
      minions={minions || []}
      missions={missions || []}
      templates={templates || []}
    />
  );
}

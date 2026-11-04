import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FarmView } from '@/components/game/FarmView';

export default async function FarmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Lấy danh sách ô đất của người chơi
  const { data: plots } = await supabase
    .from('farm_plots')
    .select('*')
    .eq('user_id', user.id)
    .order('plot_index', { ascending: true });

  // 2. Lấy định nghĩa tất cả cây trồng
  const { data: cropDefs } = await supabase
    .from('crop_definitions')
    .select('*');

  // 3. Lấy hạt giống trong kho của người chơi
  const { data: userSeeds } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', 'seed');

  return (
    <FarmView
      initialPlots={plots || []}
      cropDefs={cropDefs || []}
      userSeeds={userSeeds || []}
    />
  );
}

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

  // Lấy danh sách ô đất và định nghĩa cây trồng
  const [{ data: plots }, { data: cropDefs }] = await Promise.all([
    supabase
      .from('farm_plots')
      .select('*')
      .eq('user_id', user.id)
      .order('plot_index', { ascending: true }),
    supabase.from('crop_definitions').select('*'),
  ]);

  return (
    <FarmView
      initialPlots={plots || []}
      cropDefs={cropDefs || []}
    />
  );
}

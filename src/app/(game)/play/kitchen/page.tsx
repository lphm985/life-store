import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CraftingStudioView } from '@/components/game/CraftingStudioView';

export default async function CraftingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Lấy danh sách công thức đang kích hoạt (Túi đồ đã có GameContext quản lý 0ms)
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: false });

  return (
    <CraftingStudioView
      recipes={recipes || []}
    />
  );
}

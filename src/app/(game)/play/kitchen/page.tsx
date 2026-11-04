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

  // 1. Lấy danh sách công thức đang kích hoạt (do Admin quản lý trong database)
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: false });

  // 2. Lấy túi đồ của người chơi
  const { data: userInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id);

  return (
    <CraftingStudioView
      recipes={recipes || []}
      userInventory={userInventory || []}
    />
  );
}

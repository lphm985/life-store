import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GameHeader } from '@/components/game/GameHeader';
import { GameNavBar } from '@/components/game/GameNavBar';
import { GameProvider } from '@/components/game/GameContext';

export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Lấy Profile và Inventory ban đầu
  const [{ data: profile }, { data: inventory }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('inventory').select('*').eq('user_id', user.id),
  ]);

  if (!profile) {
    redirect('/login');
  }

  return (
    <GameProvider initialProfile={profile} initialInventory={inventory || []}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* 1. Header hiển thị Level, Tiền, Năng lượng với Global State 0ms */}
        <GameHeader />

        {/* 2. Thanh Menu Chuyển Tab */}
        <GameNavBar />

        {/* 3. Nội dung game */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </GameProvider>
  );
}

import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { GameHeader } from '@/components/game/GameHeader';
import { Sprout, Utensils, Users, Store, Backpack } from 'lucide-react';

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

  // Lấy Profile người dùng
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const navItems = [
    { label: 'Nông trại', href: '/play/farm', icon: Sprout },
    { label: 'Nhà bếp', href: '/play/kitchen', icon: Utensils },
    { label: 'Nhân viên RPG', href: '/play/minions', icon: Users },
    { label: 'Chợ P2P', href: '/play/market', icon: Store },
    { label: 'Túi đồ', href: '/play/inventory', icon: Backpack },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <GameHeader profile={profile} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Bottom Navigation Bar for Mobile / Game Feel */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800 md:hidden flex justify-around p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 p-1"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

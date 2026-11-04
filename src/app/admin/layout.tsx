import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  ShieldAlert,
  Sprout,
  Compass,
  Users,
  FlaskConical,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Kiểm tra role Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/play?error=unauthorized_admin');
  }

  const navLinks = [
    { label: 'Tổng Quan', href: '/admin', icon: LayoutDashboard },
    { label: 'Cây Trồng & Nông Sản', href: '/admin/crops', icon: Sprout },
    { label: 'Bản Đồ Thám Hiểm', href: '/admin/expeditions', icon: Compass },
    { label: 'Mẫu Nhân Viên RPG', href: '/admin/minions', icon: Users },
    { label: 'Công Thức Chế Biến', href: '/admin/recipes', icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white uppercase">Game Admin</h2>
              <span className="text-xs text-slate-400">{profile.username}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to Game Button */}
        <div className="pt-4 border-t border-slate-800">
          <Link
            href="/play"
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Game</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl">
        {children}
      </main>
    </div>
  );
}

'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sprout, Utensils, Users, Store, Backpack } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Nông Trại', href: '/play/farm', icon: Sprout },
  { label: 'Bếp & Dược Sư', href: '/play/kitchen', icon: Utensils },
  { label: 'Nhân Viên RPG', href: '/play/minions', icon: Users },
  { label: 'Chợ P2P', href: '/play/market', icon: Store },
  { label: 'Túi Đồ', href: '/play/inventory', icon: Backpack },
];

export function GameNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (href: string) => {
    router.push(href);
  };

  return (
    <>
      {/* 1. Desktop & Tablet Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <button
                type="button"
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none whitespace-nowrap shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-800 md:hidden flex justify-around p-2 shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <button
              type="button"
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={`flex flex-col items-center gap-1 text-[11px] p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

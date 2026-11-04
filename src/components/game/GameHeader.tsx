import React from 'react';
import Link from 'next/link';
import { Coins, Sparkles, Zap, ShieldAlert, LogOut } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface GameHeaderProps {
  profile: Profile;
}

export function GameHeader({ profile }: GameHeaderProps) {
  const energyPercent = Math.min(100, Math.round((profile.energy / profile.max_energy) * 100));

  return (
    <header className="relative z-30 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* User Info & Level */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-inner">
            {profile.level}
          </div>
          <div>
            <div className="font-semibold text-sm flex items-center gap-1.5">
              <span>{profile.username}</span>
              {profile.role === 'admin' && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono font-medium">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">EXP: {formatNumber(profile.exp)}</div>
          </div>
        </div>

        {/* Resources Dashboard (Gold, Gems, Energy) */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Gold */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-sm">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="font-bold text-sm text-amber-200">{formatNumber(profile.gold)}</span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span className="font-bold text-sm text-cyan-200">{formatNumber(profile.gems)}</span>
          </div>

          {/* Energy */}
          <div className="flex flex-col gap-1 min-w-[100px]">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                {profile.energy}/{profile.max_energy}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-2">
          {profile.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 px-2.5 py-1.5 rounded-md transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

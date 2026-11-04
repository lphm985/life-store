'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sword, Heart, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/utils';
import { claimExpeditionReward } from '@/server/actions/minion.actions';
import type { Database } from '@/types/database.types';

type Minion = Database['public']['Tables']['minions']['Row'];
type ExpeditionMission = Database['public']['Tables']['expedition_missions']['Row'];

interface MinionCardProps {
  minion: Minion;
  missions: ExpeditionMission[];
  onDispatchClick: (minion: Minion) => void;
  onPotionClick: (minion: Minion) => void;
}

export function MinionCard({ minion, missions, onDispatchClick, onPotionClick }: MinionCardProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [claiming, setClaiming] = useState(false);

  const activeMission = missions.find((m) => m.id === minion.expedition_mission_id);

  useEffect(() => {
    if (minion.status !== 'expedition' || !minion.expedition_ends_at) {
      setSecondsRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const diff = Math.floor((new Date(minion.expedition_ends_at!).getTime() - Date.now()) / 1000);
      setSecondsRemaining(Math.max(0, diff));
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [minion.status, minion.expedition_ends_at]);

  const isCompleted = minion.status === 'expedition' && secondsRemaining === 0;
  const hpPercent = Math.min(100, Math.round((minion.hp / minion.max_hp) * 100));

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const res = await claimExpeditionReward(minion.id);
      if (!res.success) {
        alert(res.error);
      } else {
        const dropNames = res.drops.map((d) => `${d.icon} ${d.itemName} x${d.quantity}`).join(', ');
        alert(
          `🎉 Thám hiểm thành công!\n+${res.goldReward} Vàng | +${res.expReward} EXP\nMất máu: -${res.damageTaken} HP\nVật phẩm: ${dropNames || 'Không có'}`
        );
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition">
      <div>
        {/* Header Avatar & Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              {minion.avatar || '⚔️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">{minion.name}</h3>
                <span className="text-xs bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                  Lv.{minion.level}
                </span>
              </div>
              <div className="mt-0.5">
                {!minion.is_alive ? (
                  <span className="text-xs text-red-400 font-bold bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded-full">
                    💀 Đã Tử Trận
                  </span>
                ) : minion.status === 'expedition' ? (
                  <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                    <Compass className="w-3 h-3 animate-spin" /> Đang khám phá: {activeMission?.title || 'Bản đồ'}
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">💤 Đang rảnh rỗi</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thanh Máu (HP) */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400/30" /> Máu (HP)
            </span>
            <span className="font-medium text-slate-200">
              {minion.hp} / {minion.max_hp}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent < 30 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Chỉ số Chiến Đấu (Power, Def, Buffs) */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Sword className="w-3.5 h-3.5 text-red-400" /> Sức Mạnh
            </span>
            <span className="font-bold text-slate-200">
              {minion.power}
              {minion.temp_dmg_buff > 0 && (
                <span className="text-emerald-400 text-[10px] ml-1">+{minion.temp_dmg_buff}</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Phòng Thủ
            </span>
            <span className="font-bold text-slate-200">
              {minion.temp_def_buff > 0 ? `+${minion.temp_def_buff}` : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Hành Động */}
      <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
        {minion.status === 'expedition' ? (
          isCompleted ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {claiming ? 'Đang nhận quà...' : 'Nhận Thưởng Thám Hiểm'}
            </button>
          ) : (
            <div className="w-full py-2 bg-slate-800/80 border border-slate-700/60 text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2">
              <Compass className="w-4 h-4 animate-spin text-amber-400" />
              <span>Trở về sau: {formatTimeRemaining(secondsRemaining)}</span>
            </div>
          )
        ) : (
          <>
            <button
              onClick={() => onPotionClick(minion)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-cyan-300 font-semibold text-xs rounded-xl active:scale-95 transition flex items-center gap-1.5"
              title="Dùng bình thuốc hồi máu / tăng lực"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Dùng Thuốc
            </button>

            <button
              disabled={!minion.is_alive}
              onClick={() => onDispatchClick(minion)}
              className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              Cử Đi Thám Hiểm
            </button>
          </>
        )}
      </div>
    </div>
  );
}

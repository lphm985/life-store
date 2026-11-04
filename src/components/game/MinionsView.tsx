'use client';

import React, { useState } from 'react';
import { MinionCard } from '@/components/game/MinionCard';
import { dispatchExpedition, recruitMinion } from '@/server/actions/minion.actions';
import { usePotionOnMinion } from '@/server/actions/crafting.actions';
import { Users, UserPlus, Compass, X, Sparkles, AlertCircle, Coins } from 'lucide-react';
import type { Database, ExpeditionDropItem } from '@/types/database.types';

type Minion = Database['public']['Tables']['minions']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type ExpeditionMission = Database['public']['Tables']['expedition_missions']['Row'];
type MinionTemplate = Database['public']['Tables']['minion_templates']['Row'];

interface MinionsViewProps {
  minions: Minion[];
  missions: ExpeditionMission[];
  templates: MinionTemplate[];
  userPotions: InventoryItem[];
}

export function MinionsView({ minions, missions, templates, userPotions }: MinionsViewProps) {
  const [selectedMinionForDispatch, setSelectedMinionForDispatch] = useState<Minion | null>(null);
  const [selectedMinionForPotion, setSelectedMinionForPotion] = useState<Minion | null>(null);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecruit = async (templateId: string) => {
    try {
      setLoading(true);
      const res = await recruitMinion(templateId);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(`Chiêu mộ thành công: ${res.minion?.name}! 🎉`);
        setShowRecruitModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (mission: ExpeditionMission) => {
    if (!selectedMinionForDispatch) return;
    try {
      setLoading(true);
      const res = await dispatchExpedition(selectedMinionForDispatch.id, mission.id);
      if (!res.success) {
        alert(res.error);
      } else {
        setSelectedMinionForDispatch(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPotion = async (potionItemId: string) => {
    if (!selectedMinionForPotion) return;
    try {
      setLoading(true);
      const res = await usePotionOnMinion(potionItemId, selectedMinionForPotion.id);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
        setSelectedMinionForPotion(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Quản Lý Đội Ngũ Nhân Viên (RPG)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dữ liệu nhân viên & bản đồ thám hiểm được đồng bộ trực tiếp từ Database Supabase (Dynamic Master Data).
          </p>
        </div>

        <button
          onClick={() => setShowRecruitModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          Tửu Quán Chiêu Mộ Nhân Viên
        </button>
      </div>

      {/* Grid Danh Sách Minions */}
      {minions.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <p className="text-sm text-slate-400">Bạn chưa có nhân viên nào.</p>
          <p className="text-xs text-slate-500 mt-1">
            Hãy ghé **Tửu Quán Chiêu Mộ** để tuyển dụng chiến binh đồng hành đầu tiên!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {minions.map((minion) => (
            <MinionCard
              key={minion.id}
              minion={minion}
              missions={missions}
              onDispatchClick={(m) => setSelectedMinionForDispatch(m)}
              onPotionClick={(m) => setSelectedMinionForPotion(m)}
            />
          ))}
        </div>
      )}

      {/* Modal Chiêu Mộ Nhân Viên (Tửu Quán) */}
      {showRecruitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                🍺 Tửu Quán Chiêu Mộ (Mẫu Nhân Viên Từ Database)
              </h3>
              <button
                onClick={() => setShowRecruitModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-900 rounded-xl border border-slate-800">
                      {tpl.avatar}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{tpl.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>
                      <div className="flex gap-3 text-xs mt-1.5 text-slate-400">
                        <span>⚔️ Sức mạnh: <b className="text-slate-200">{tpl.base_power}</b></span>
                        <span>❤️ Máu: <b className="text-slate-200">{tpl.base_hp}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {tpl.recruit_cost_gold} Vàng
                    </div>

                    <button
                      disabled={loading}
                      onClick={() => handleRecruit(tpl.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg active:scale-95 transition"
                    >
                      Chiêu Mộ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chọn Bản Đồ Thám Hiểm */}
      {selectedMinionForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-400" /> Cử {selectedMinionForDispatch.name} Đi Khám Phá
                </h3>
                <span className="text-xs text-slate-400">
                  Sức mạnh hiện tại: <b className="text-emerald-400">{selectedMinionForDispatch.power + (selectedMinionForDispatch.temp_dmg_buff || 0)}</b>
                </span>
              </div>
              <button
                onClick={() => setSelectedMinionForDispatch(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {missions.map((mission) => {
                const totalPower = selectedMinionForDispatch.power + (selectedMinionForDispatch.temp_dmg_buff || 0);
                const canJoin = totalPower >= mission.min_power_required;
                const drops = mission.possible_drops as unknown as ExpeditionDropItem[];

                return (
                  <div
                    key={mission.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{mission.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-200">{mission.title}</h4>
                          <span className="text-[11px] text-slate-400">Thời gian: {mission.duration_seconds}s</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Cần: {mission.min_power_required} Sức Mạnh
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{mission.description}</p>

                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                      <span>Rơi:</span>
                      {drops.map((d) => (
                        <span key={d.itemId} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                          {d.icon} {d.itemName} ({Math.round(d.chance * 100)}%)
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                      <span className="text-amber-400 font-medium">
                        Thưởng: +{mission.gold_reward} Vàng | +{mission.exp_reward} EXP
                      </span>

                      <button
                        disabled={!canJoin || loading}
                        onClick={() => handleDispatch(mission)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-lg active:scale-95 transition"
                      >
                        {canJoin ? 'Xuất Phát' : 'Thiếu Sức Mạnh'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cho Minion Dùng Thuốc */}
      {selectedMinionForPotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Dùng Dược Phẩm Cho {selectedMinionForPotion.name}
              </h3>
              <button
                onClick={() => setSelectedMinionForPotion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {userPotions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-slate-500" />
                  Bạn chưa có bình thuốc nào trong túi. Hãy ghé Phòng Chế Dược (Dược Sư) để luyện đan!
                </div>
              ) : (
                userPotions.map((potion) => (
                  <div
                    key={potion.id}
                    className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{potion.icon}</span>
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{potion.item_name}</div>
                        <div className="text-[11px] text-slate-400">Số lượng: x{potion.quantity}</div>
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      onClick={() => handleApplyPotion(potion.item_id)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg active:scale-95 transition"
                    >
                      Sử Dụng
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

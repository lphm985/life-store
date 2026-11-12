'use client';

import React, { useState } from 'react';
import { upsertExpeditionMission } from '@/server/actions/admin.actions';
import { Compass, Save, Plus, X } from 'lucide-react';
import type { Database, ExpeditionDropItem } from '@/types/database.types';

type ExpeditionMission = Database['public']['Tables']['expedition_missions']['Row'];

interface AdminExpeditionsViewProps {
  missions: ExpeditionMission[];
}

export function AdminExpeditionsView({ missions }: AdminExpeditionsViewProps) {
  const [missionList, setMissionList] = useState(missions);
  const [editingMission, setEditingMission] = useState<ExpeditionMission | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (mission: ExpeditionMission) => {
    setEditingMission({ ...mission });
  };

  const handleCreateNew = () => {
    const newMission: ExpeditionMission = {
      id: `mission_${Date.now()}`,
      title: 'Vùng Đất Mới',
      difficulty: 'easy',
      description: 'Mô tả khu vực thám hiểm...',
      duration_seconds: 60,
      min_power_required: 20,
      recommended_power: 30,
      gold_reward: 100,
      exp_reward: 50,
      possible_drops: [
        { itemId: 'herb_green_leaf', itemName: 'Lá Thảo Dược', category: 'herb', quantity: 2, chance: 0.8, icon: '🌿' },
      ],
      icon: '🗺️',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setEditingMission(newMission);
  };

  const handleSave = async () => {
    if (!editingMission) return;
    try {
      setSaving(true);
      const res = await upsertExpeditionMission({
        ...editingMission,
        duration_seconds: Number(editingMission.duration_seconds),
        min_power_required: Number(editingMission.min_power_required),
        recommended_power: Number(editingMission.recommended_power),
        gold_reward: Number(editingMission.gold_reward),
        exp_reward: Number(editingMission.exp_reward),
      });

      if (!res.success) {
        alert(res.error);
      } else {
        alert('Đã lưu thành công bản đồ thám hiểm! ✅');
        setMissionList((prev) => {
          const exists = prev.some((m) => m.id === editingMission.id);
          if (exists) {
            return prev.map((m) => (m.id === editingMission.id ? editingMission : m));
          }
          return [...prev, editingMission];
        });
        setEditingMission(null);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" /> Quản Lý Bản Đồ Thám Hiểm
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Điều chỉnh thời gian chờ, quái vật, tỷ lệ rớt thảo dược quý hiếm.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Thêm Map Mới
        </button>
      </div>

      {/* Grid Danh Sách Map Hiện Tại */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missionList.map((m) => {
          const drops = m.possible_drops as unknown as ExpeditionDropItem[];
          return (
            <div
              key={m.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                      {m.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-slate-100">{m.title}</h3>
                      <span className="text-xs font-mono text-slate-500">{m.id}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                    {m.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3">{m.description}</p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Thời gian:</span>
                    <b className="text-slate-200">{m.duration_seconds}s</b>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Yêu cầu Power:</span>
                    <b className="text-slate-200">{m.min_power_required}</b>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Vàng Thưởng:</span>
                    <b className="text-amber-400">+{m.gold_reward}</b>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">EXP Thưởng:</span>
                    <b className="text-indigo-400">+{m.exp_reward}</b>
                  </div>
                </div>

                {/* Drops list */}
                <div className="mt-3 text-[11px] text-slate-400">
                  <span className="block mb-1 font-semibold text-slate-300">Vật phẩm rớt:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {drops.map((d) => (
                      <span key={d.itemId} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        {d.icon} {d.itemName} ({Math.round(d.chance * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleEdit(m)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
                >
                  Chỉnh Sửa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Chỉnh Sửa / Tạo Map Mới */}
      {editingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                ✏️ Chỉnh Sửa Bản Đồ Thám Hiểm
              </h3>
              <button
                onClick={() => setEditingMission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mã ID (Không đổi nếu đang có):</label>
                <input
                  type="text"
                  value={editingMission.id}
                  onChange={(e) => setEditingMission({ ...editingMission, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tên Bản Đồ:</label>
                  <input
                    type="text"
                    value={editingMission.title}
                    onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Biểu Tượng (Emoji / Path):</label>
                  <input
                    type="text"
                    value={editingMission.icon}
                    onChange={(e) => setEditingMission({ ...editingMission, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mô tả:</label>
                <textarea
                  value={editingMission.description}
                  onChange={(e) => setEditingMission({ ...editingMission, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200 h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Thời gian đi (giây):</label>
                  <input
                    type="number"
                    value={editingMission.duration_seconds}
                    onChange={(e) =>
                      setEditingMission({ ...editingMission, duration_seconds: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Sức mạnh tối thiểu:</label>
                  <input
                    type="number"
                    value={editingMission.min_power_required}
                    onChange={(e) =>
                      setEditingMission({ ...editingMission, min_power_required: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Vàng thưởng:</label>
                  <input
                    type="number"
                    value={editingMission.gold_reward}
                    onChange={(e) =>
                      setEditingMission({ ...editingMission, gold_reward: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">EXP thưởng:</label>
                  <input
                    type="number"
                    value={editingMission.exp_reward}
                    onChange={(e) =>
                      setEditingMission({ ...editingMission, exp_reward: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingMission(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { upsertMinionTemplate } from '@/server/actions/admin.actions';
import { Users, Save, Plus, X, Coins, Sparkles } from 'lucide-react';
import type { Database } from '@/types/database.types';

type MinionTemplate = Database['public']['Tables']['minion_templates']['Row'];

interface AdminMinionsViewProps {
  templates: MinionTemplate[];
}

export function AdminMinionsView({ templates }: AdminMinionsViewProps) {
  const [templateList, setTemplateList] = useState(templates);
  const [editingTemplate, setEditingTemplate] = useState<MinionTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (tpl: MinionTemplate) => {
    setEditingTemplate({ ...tpl });
  };

  const handleCreateNew = () => {
    const newTpl: MinionTemplate = {
      id: `class_${Date.now()}`,
      name: 'Chiến Binh Mới',
      avatar: '🗡️',
      base_power: 20,
      base_hp: 100,
      base_stamina: 100,
      recruit_cost_gold: 500,
      recruit_cost_gems: 0,
      description: 'Mô tả lớp nhân vật...',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setEditingTemplate(newTpl);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    try {
      setSaving(true);
      const res = await upsertMinionTemplate({
        ...editingTemplate,
        base_power: Number(editingTemplate.base_power),
        base_hp: Number(editingTemplate.base_hp),
        base_stamina: Number(editingTemplate.base_stamina),
        recruit_cost_gold: Number(editingTemplate.recruit_cost_gold),
        recruit_cost_gems: Number(editingTemplate.recruit_cost_gems),
      });

      if (!res.success) {
        alert(res.error);
      } else {
        alert('Đã lưu thành công mẫu nhân viên! ✅');
        setTemplateList((prev) => {
          const exists = prev.some((t) => t.id === editingTemplate.id);
          if (exists) {
            return prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t));
          }
          return [...prev, editingTemplate];
        });
        setEditingTemplate(null);
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
            <Users className="w-6 h-6 text-blue-400" /> Quản Lý Mẫu Nhân Viên RPG
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thêm mới hoặc chỉnh sửa chỉ số cơ bản (Máu, Công, Thủ) và giá bán trong Tửu Quán.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Thêm Mẫu Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templateList.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                  {tpl.avatar}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{tpl.name}</h3>
                  <span className="text-xs font-mono text-slate-500">{tpl.id}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3">{tpl.description}</p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Sức mạnh gốc:</span>
                  <b className="text-slate-200">{tpl.base_power}</b>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Máu (HP) gốc:</span>
                  <b className="text-slate-200">{tpl.base_hp}</b>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Giá Vàng:</span>
                  <b className="text-amber-400">{tpl.recruit_cost_gold} Vàng</b>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Giá Gems:</span>
                  <b className="text-cyan-400">{tpl.recruit_cost_gems} Gems</b>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => handleEdit(tpl)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
              >
                Chỉnh Sửa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Chỉnh Sửa / Tạo Mẫu Mới */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                ✏️ Chỉnh Sửa Mẫu Nhân Viên
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mã ID (VD: warrior, mage):</label>
                <input
                  type="text"
                  value={editingTemplate.id}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tên Hiển Thị:</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Avatar (Emoji hoặc Link):</label>
                  <input
                    type="text"
                    value={editingTemplate.avatar}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, avatar: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mô tả:</label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200 h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Sức mạnh gốc (Power):</label>
                  <input
                    type="number"
                    value={editingTemplate.base_power}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, base_power: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Máu gốc (HP):</label>
                  <input
                    type="number"
                    value={editingTemplate.base_hp}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, base_hp: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Giá Vàng chiêu mộ:</label>
                  <input
                    type="number"
                    value={editingTemplate.recruit_cost_gold}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, recruit_cost_gold: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Giá Kim Cương:</label>
                  <input
                    type="number"
                    value={editingTemplate.recruit_cost_gems}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, recruit_cost_gems: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Mẫu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { upsertRecipe } from '@/server/actions/admin.actions';
import { FlaskConical, Save, Plus, X, UtensilsCrossed } from 'lucide-react';
import type { Database, RecipeIngredient } from '@/types/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface AdminRecipesViewProps {
  recipes: Recipe[];
}

export function AdminRecipesView({ recipes }: AdminRecipesViewProps) {
  const [recipeList, setRecipeList] = useState(recipes);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe({ ...recipe });
  };

  const handleCreateNew = () => {
    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}`,
      name: 'Công Thức Mới',
      category: 'potion',
      description: 'Mô tả công dụng món ăn / dược phẩm...',
      craft_time_seconds: 20,
      ingredients: [
        { itemId: 'crop_wheat', itemName: 'Lúa mì', quantity: 2 },
      ],
      result_item_id: `item_${Date.now()}`,
      result_item_name: 'Dược Phẩm Mới',
      result_quantity: 1,
      icon: '🧪',
      exp_reward: 30,
      effect_type: 'heal_hp',
      effect_duration_type: 'instant',
      effect_value: 50,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingRecipe(newRecipe);
  };

  const handleSave = async () => {
    if (!editingRecipe) return;
    try {
      setSaving(true);
      const res = await upsertRecipe({
        ...editingRecipe,
        craft_time_seconds: Number(editingRecipe.craft_time_seconds),
        result_quantity: Number(editingRecipe.result_quantity),
        exp_reward: Number(editingRecipe.exp_reward),
        effect_value: Number(editingRecipe.effect_value),
        ingredients: editingRecipe.ingredients as unknown as RecipeIngredient[],
      });

      if (!res.success) {
        alert(res.error);
      } else {
        alert('Đã lưu thành công công thức chế biến! ✅');
        setRecipeList((prev) => {
          const exists = prev.some((r) => r.id === editingRecipe.id);
          if (exists) {
            return prev.map((r) => (r.id === editingRecipe.id ? editingRecipe : r));
          }
          return [...prev, editingRecipe];
        });
        setEditingRecipe(null);
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
            <FlaskConical className="w-6 h-6 text-cyan-400" /> Quản Lý Công Thức Chế Biến
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tạo công thức đan dược mới cho Dược Sư hoặc món ăn ẩm thực cho Bếp Nấu.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Thêm Công Thức
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipeList.map((r) => (
          <div
            key={r.id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                    {r.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{r.name}</h3>
                    <span className="text-xs font-mono text-slate-500">{r.id}</span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                    r.category === 'potion'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {r.category === 'potion' ? 'Dược Phẩm' : 'Bếp Nấu'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-3">{r.description}</p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Thời gian luyện:</span>
                  <b className="text-slate-200">{r.craft_time_seconds}s</b>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Hiệu ứng:</span>
                  <b className="text-cyan-400">{r.effect_type ? `${r.effect_type} (+${r.effect_value})` : 'Hồi Năng Lượng'}</b>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => handleEdit(r)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
              >
                Chỉnh Sửa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Chỉnh Sửa / Tạo Mới Công Thức */}
      {editingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                ✏️ Chỉnh Sửa Công Thức
              </h3>
              <button
                onClick={() => setEditingRecipe(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Mã ID:</label>
                  <input
                    type="text"
                    value={editingRecipe.id}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Phân Loại:</label>
                  <select
                    value={editingRecipe.category}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  >
                    <option value="potion">Thuốc (Dược Sư)</option>
                    <option value="food">Thức Ăn (Bếp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tên Công Thức:</label>
                  <input
                    type="text"
                    value={editingRecipe.name}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Icon (Emoji):</label>
                  <input
                    type="text"
                    value={editingRecipe.icon}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mô tả:</label>
                <textarea
                  value={editingRecipe.description}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200 h-16"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Thời gian (s):</label>
                  <input
                    type="number"
                    value={editingRecipe.craft_time_seconds}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, craft_time_seconds: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Loại hiệu ứng:</label>
                  <select
                    value={editingRecipe.effect_type || 'heal_hp'}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, effect_type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  >
                    <option value="heal_hp">Hồi HP</option>
                    <option value="revive">Hồi sinh</option>
                    <option value="temp_dmg_boost">+DMG tạm thời</option>
                    <option value="temp_def_boost">+DEF tạm thời</option>
                    <option value="perm_stat_boost">+Power vĩnh viễn</option>
                    <option value="level_up">+1 Cấp</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Chỉ số tăng (+):</label>
                  <input
                    type="number"
                    value={editingRecipe.effect_value}
                    onChange={(e) =>
                      setEditingRecipe({ ...editingRecipe, effect_value: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingRecipe(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Công Thức'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

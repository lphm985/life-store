'use client';

import React, { useState } from 'react';
import { updateCropDefinition } from '@/server/actions/admin.actions';
import { Sprout, Save } from 'lucide-react';
import type { Database } from '@/types/database.types';

type CropDef = Database['public']['Tables']['crop_definitions']['Row'];

interface AdminCropsViewProps {
  crops: CropDef[];
}

export function AdminCropsView({ crops }: AdminCropsViewProps) {
  const [cropList, setCropList] = useState(crops);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleChange = (id: string, field: keyof CropDef, value: any) => {
    setCropList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = async (crop: CropDef) => {
    try {
      setSavingId(crop.id);
      const res = await updateCropDefinition(crop.id, {
        name: crop.name,
        grow_time_seconds: Number(crop.grow_time_seconds),
        buy_price: Number(crop.buy_price),
        sell_price: Number(crop.sell_price),
        exp_reward: Number(crop.exp_reward),
        icon: crop.icon,
      });

      if (!res.success) {
        alert(res.error);
      } else {
        alert(`Đã lưu thông số cho ${crop.name}! ✅`);
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-400" /> Quản Lý Cây Trồng & Nông Sản
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Chỉnh sửa thời gian sinh trưởng, giá mua bán và điểm kinh nghiệm thu hoạch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cropList.map((crop) => (
          <div
            key={crop.id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
          >
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">
                🌱
              </div>
              <div>
                <input
                  type="text"
                  value={crop.name}
                  onChange={(e) => handleChange(crop.id, 'name', e.target.value)}
                  className="font-bold text-sm bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                />
                <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {crop.id}</div>
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Thời gian lớn (s)</label>
                <input
                  type="number"
                  value={crop.grow_time_seconds}
                  onChange={(e) => handleChange(crop.id, 'grow_time_seconds', e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Giá hạt giống (Gold)</label>
                <input
                  type="number"
                  value={crop.buy_price}
                  onChange={(e) => handleChange(crop.id, 'buy_price', e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Giá bán nông sản</label>
                <input
                  type="number"
                  value={crop.sell_price}
                  onChange={(e) => handleChange(crop.id, 'sell_price', e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">EXP Thưởng</label>
                <input
                  type="number"
                  value={crop.exp_reward}
                  onChange={(e) => handleChange(crop.id, 'exp_reward', e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              disabled={savingId === crop.id}
              onClick={() => handleSave(crop)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 self-end md:self-center"
            >
              <Save className="w-4 h-4" />
              {savingId === crop.id ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

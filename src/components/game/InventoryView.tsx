'use client';

import React, { useState } from 'react';
import { Backpack, Utensils, FlaskConical } from 'lucide-react';
import { consumeFood } from '@/server/actions/kitchen.actions';
import type { Database } from '@/types/database.types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InventoryViewProps {
  items: InventoryItem[];
}

export function InventoryView({ items }: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'seed' | 'crop' | 'herb' | 'processed_food' | 'potion'>('all');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const handleEat = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      const res = await consumeFood(itemId);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(`Đã ăn và hồi phục ${res.restored} Năng lượng! ⚡`);
      }
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Backpack className="w-6 h-6 text-purple-400" /> Túi Đồ Của Bạn
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý hạt giống, thảo dược, nông sản, thức ăn và các loại linh đan dược thủy.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'seed', label: 'Hạt giống' },
              { id: 'crop', label: 'Nông sản' },
              { id: 'herb', label: 'Thảo dược' },
              { id: 'potion', label: 'Dược phẩm' },
              { id: 'processed_food', label: 'Món ăn' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Vật phẩm */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-800/80 rounded-2xl">
          <p className="text-sm text-slate-400">Không có vật phẩm nào trong mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredItems.map((item) => {
            const isFood = item.category === 'processed_food';
            const isPotion = item.category === 'potion';

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between shadow-md relative group"
              >
                <div>
                  <div className="text-3xl text-center my-2 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h4 className="font-semibold text-xs text-slate-200 text-center truncate" title={item.item_name}>
                    {item.item_name}
                  </h4>
                  <div className="text-center mt-1">
                    <span className="text-[11px] font-bold bg-slate-800/80 px-2 py-0.5 rounded-full text-slate-300">
                      x{item.quantity}
                    </span>
                  </div>
                </div>

                {isFood && (
                  <button
                    disabled={loadingItemId === item.item_id}
                    onClick={() => handleEat(item.item_id)}
                    className="mt-3 w-full py-1.5 bg-emerald-600/80 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Utensils className="w-3 h-3" /> Ăn (+⚡)
                  </button>
                )}

                {isPotion && (
                  <div className="mt-3 text-center">
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-full flex items-center justify-center gap-1">
                      <FlaskConical className="w-2.5 h-2.5" /> Dùng cho Minion
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

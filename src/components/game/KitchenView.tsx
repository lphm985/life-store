'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Zap, Flame, Clock, Sparkles } from 'lucide-react';
import { cookRecipe } from '@/server/actions/kitchen.actions';
import { RECIPES, type FoodRecipe } from '@/lib/constants/recipes';
import type { Database } from '@/types/database.types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface KitchenViewProps {
  userInventory: InventoryItem[];
}

export function KitchenView({ userInventory }: KitchenViewProps) {
  const [cookingId, setCookingId] = useState<string | null>(null);

  const inventoryMap = new Map(userInventory.map((item) => [item.item_id, item.quantity]));

  const handleCook = async (recipe: FoodRecipe) => {
    try {
      setCookingId(recipe.id);
      const res = await cookRecipe(recipe.id);
      if (!res.success) {
        alert(res.error);
      }
    } finally {
      setCookingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-500" /> Bếp Nấu & Chế Biến Thức Ăn
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sử dụng nông sản thu hoạch để tạo ra các món ăn tăng cường năng lượng và thể lực cho nhân viên.
          </p>
        </div>
      </div>

      {/* Danh sách công thức nấu ăn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RECIPES.map((recipe) => {
          // Kiểm tra xem có đủ tất cả nguyên liệu không
          const canCraft = recipe.ingredients.every((ing) => {
            const currentQty = inventoryMap.get(ing.itemId) || 0;
            return currentQty >= ing.quantity;
          });

          const isCookingThis = cookingId === recipe.id;

          return (
            <div
              key={recipe.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
            >
              <div>
                {/* Header món ăn */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-inner">
                      {recipe.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-slate-100">{recipe.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{recipe.description}</p>
                    </div>
                  </div>
                </div>

                {/* Chỉ số buff (Năng lượng & Thể lực) */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <Zap className="w-3.5 h-3.5" />
                    +{recipe.energyRestore} Năng lượng
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    +{recipe.expReward} EXP
                  </div>
                </div>

                {/* Danh sách nguyên liệu cần thiết */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Nguyên liệu yêu cầu:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {recipe.ingredients.map((ing) => {
                      const userQty = inventoryMap.get(ing.itemId) || 0;
                      const hasEnough = userQty >= ing.quantity;

                      return (
                        <div
                          key={ing.itemId}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-800"
                        >
                          <span className="text-slate-300">{ing.itemName}</span>
                          <span
                            className={`font-semibold ${
                              hasEnough ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {userQty}/{ing.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Button: Nấu */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời gian: {recipe.craftTimeSeconds}s</span>
                </div>

                <button
                  disabled={!canCraft || Boolean(cookingId)}
                  onClick={() => handleCook(recipe)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4 fill-white/20" />
                  {isCookingThis ? 'Đang chế biến...' : canCraft ? 'Bắt đầu Nấu' : 'Thiếu nguyên liệu'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

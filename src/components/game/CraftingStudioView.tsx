'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, FlaskConical, Flame, Sparkles, Clock, Shield, Sword, Heart, Zap } from 'lucide-react';
import { craftItem } from '@/server/actions/crafting.actions';
import type { Database, RecipeIngredient } from '@/types/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface CraftingStudioViewProps {
  recipes: Recipe[];
  userInventory: InventoryItem[];
}

export function CraftingStudioView({ recipes, userInventory }: CraftingStudioViewProps) {
  const [activeTab, setActiveTab] = useState<'potion' | 'food'>('potion');
  const [craftingId, setCraftingId] = useState<string | null>(null);

  const inventoryMap = new Map(userInventory.map((item) => [item.item_id, item.quantity]));

  const filteredRecipes = recipes.filter((r) => r.category === activeTab);

  const handleCraft = async (recipe: Recipe) => {
    try {
      setCraftingId(recipe.id);
      const res = await craftItem(recipe.id);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(`Chế tạo thành công: ${res.resultName}! (+${res.expReward} EXP)`);
      }
    } finally {
      setCraftingId(null);
    }
  };

  const renderEffectBadge = (recipe: Recipe) => {
    if (recipe.category === 'food') {
      return (
        <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
          <Zap className="w-3 h-3 text-emerald-400" /> +Hồi phục Năng lượng
        </span>
      );
    }

    switch (recipe.effect_type) {
      case 'heal_hp':
        return (
          <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
            <Heart className="w-3 h-3 text-red-400 fill-red-400" /> Hồi +{recipe.effect_value} HP
          </span>
        );
      case 'temp_dmg_boost':
        return (
          <span className="flex items-center gap-1 text-[11px] bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-md">
            <Sword className="w-3 h-3 text-red-400" /> +{recipe.effect_value} DMG (Chuyến tới)
          </span>
        );
      case 'temp_def_boost':
        return (
          <span className="flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-md">
            <Shield className="w-3 h-3 text-blue-400" /> +{recipe.effect_value} DEF (Chuyến tới)
          </span>
        );
      case 'perm_stat_boost':
        return (
          <span className="flex items-center gap-1 text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md font-semibold">
            <Sparkles className="w-3 h-3 text-purple-400" /> +{recipe.effect_value} Sức Mạnh Vĩnh Viễn
          </span>
        );
      case 'revive':
        return (
          <span className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
            ✨ Hồi Sinh Minion
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {activeTab === 'potion' ? (
              <>
                <FlaskConical className="w-6 h-6 text-cyan-400" /> Phòng Chế Dược (Dược Sư)
              </>
            ) : (
              <>
                <UtensilsCrossed className="w-6 h-6 text-amber-500" /> Bếp Nấu & Ẩm Thực
              </>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'potion'
              ? 'Luyện linh đan và dược thủy từ thảo dược để cường hóa và hồi sinh Minion RPG.'
              : 'Nấu món ăn dinh dưỡng từ nông sản để hồi phục năng lượng cho người chơi.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('potion')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'potion'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> Dược Sư (Chế Thuốc)
          </button>
          <button
            onClick={() => setActiveTab('food')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'food'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" /> Bếp Nấu (Thức Ăn)
          </button>
        </div>
      </div>

      {/* Grid danh sách công thức */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecipes.map((recipe) => {
          const ingredients = recipe.ingredients as unknown as RecipeIngredient[];
          const canCraft = ingredients.every((ing) => {
            const currentQty = inventoryMap.get(ing.itemId) || 0;
            return currentQty >= ing.quantity;
          });

          const isCraftingThis = craftingId === recipe.id;

          return (
            <div
              key={recipe.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition ${
                activeTab === 'potion'
                  ? 'border-slate-800 hover:border-cyan-500/50'
                  : 'border-slate-800 hover:border-amber-500/50'
              }`}
            >
              <div>
                {/* Header item */}
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

                {/* Effect Badges */}
                <div className="flex items-center gap-2 my-3 flex-wrap">
                  {renderEffectBadge(recipe)}
                  <span className="flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
                    +{recipe.exp_reward} EXP
                  </span>
                </div>

                {/* Nguyên liệu cần thiết */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Nguyên liệu yêu cầu:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ingredients.map((ing) => {
                      const userQty = inventoryMap.get(ing.itemId) || 0;
                      const hasEnough = userQty >= ing.quantity;

                      return (
                        <div
                          key={ing.itemId}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-800"
                        >
                          <span className="text-slate-300 truncate max-w-[110px]" title={ing.itemName}>
                            {ing.itemName}
                          </span>
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

              {/* Action Button: Bắt đầu Luyện / Chế */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời gian: {recipe.craft_time_seconds}s</span>
                </div>

                <button
                  disabled={!canCraft || Boolean(craftingId)}
                  onClick={() => handleCraft(recipe)}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5 text-white disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 ${
                    activeTab === 'potion'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-white/20" />
                  {isCraftingThis
                    ? 'Đang luyện...'
                    : canCraft
                    ? activeTab === 'potion'
                      ? 'Luyện Đan'
                      : 'Nấu Bếp'
                    : 'Thiếu nguyên liệu'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

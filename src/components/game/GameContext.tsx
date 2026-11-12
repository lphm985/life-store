'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface GameContextType {
  profile: Profile;
  userInventory: InventoryItem[];
  modifyEnergy: (delta: number) => void;
  modifyGold: (delta: number) => void;
  modifyExp: (delta: number) => void;
  modifyItemQty: (itemId: string, deltaQty: number, itemMeta?: { name: string; category: InventoryItem['category']; icon: string }) => void;
  syncProfile: (newProfile: Profile) => void;
  syncInventory: (newInventory: InventoryItem[]) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({
  initialProfile,
  initialInventory,
  children,
}: {
  initialProfile: Profile;
  initialInventory: InventoryItem[];
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [userInventory, setUserInventory] = useState<InventoryItem[]>(initialInventory);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    setUserInventory(initialInventory);
  }, [initialInventory]);

  // Cập nhật Năng lượng 0ms
  const modifyEnergy = (delta: number) => {
    setProfile((prev) => ({
      ...prev,
      energy: Math.min(prev.max_energy, Math.max(0, prev.energy + delta)),
    }));
  };

  // Cập nhật Vàng 0ms
  const modifyGold = (delta: number) => {
    setProfile((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold + delta),
    }));
  };

  // Cập nhật EXP 0ms
  const modifyExp = (delta: number) => {
    setProfile((prev) => ({
      ...prev,
      exp: prev.exp + delta,
    }));
  };

  // Cập nhật số lượng vật phẩm trong túi 0ms (Trừ hạt giống, cộng nông sản)
  const modifyItemQty = (
    itemId: string,
    deltaQty: number,
    itemMeta?: { name: string; category: InventoryItem['category']; icon: string }
  ) => {
    setUserInventory((prev) => {
      const existing = prev.find((i) => i.item_id === itemId);
      if (existing) {
        const nextQty = existing.quantity + deltaQty;
        if (nextQty <= 0) {
          return prev.filter((i) => i.item_id !== itemId);
        }
        return prev.map((i) => (i.item_id === itemId ? { ...i, quantity: nextQty } : i));
      }
      if (deltaQty > 0 && itemMeta) {
        return [
          ...prev,
          {
            id: `temp_${Date.now()}`,
            user_id: profile.id,
            item_id: itemId,
            item_name: itemMeta.name,
            category: itemMeta.category,
            quantity: deltaQty,
            icon: itemMeta.icon,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      return prev;
    });
  };

  return (
    <GameContext.Provider
      value={{
        profile,
        userInventory,
        modifyEnergy,
        modifyGold,
        modifyExp,
        modifyItemQty,
        syncProfile: setProfile,
        syncInventory: setUserInventory,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

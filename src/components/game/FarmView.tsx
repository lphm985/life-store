'use client';

import React, { useState } from 'react';
import { PlotCard } from '@/components/game/PlotCard';
import { plantCrop, waterCrop, harvestCrop } from '@/server/actions/farm.actions';
import { X, Sprout } from 'lucide-react';
import type { Database } from '@/types/database.types';

type FarmPlot = Database['public']['Tables']['farm_plots']['Row'];
type CropDef = Database['public']['Tables']['crop_definitions']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface FarmViewProps {
  initialPlots: FarmPlot[];
  cropDefs: CropDef[];
  userSeeds: InventoryItem[];
}

export function FarmView({ initialPlots, cropDefs, userSeeds }: FarmViewProps) {
  // Quản lý state cục bộ để cập nhật UI phản hồi tức thì 0ms (Optimistic UI)
  const [plots, setPlots] = useState<FarmPlot[]>(initialPlots);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [isPlanting, setIsPlanting] = useState(false);

  const cropDefMap = new Map(cropDefs.map((c) => [c.id, c]));

  // 1. Gieo hạt tức thì
  const handlePlant = async (cropType: CropDef['id']) => {
    if (!selectedPlotId) return;
    const targetPlotId = selectedPlotId;
    setSelectedPlotId(null);

    // Cập nhật giao diện ngay lập tức trong 0ms
    setPlots((prev) =>
      prev.map((p) =>
        p.id === targetPlotId
          ? {
              ...p,
              crop_type: cropType,
              planted_at: new Date().toISOString(),
              is_watered: false,
              is_fertilized: false,
            }
          : p
      )
    );

    // Đồng bộ server ngầm phía sau
    const res = await plantCrop(targetPlotId, cropType);
    if (!res.success) {
      alert(res.error);
      // Rollback nếu server báo lỗi
      setPlots(initialPlots);
    }
  };

  // 2. Tưới nước phản hồi tức thì
  const handleWater = async (plotId: string) => {
    // Cập nhật giao diện ngay lập tức
    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, is_watered: true } : p))
    );

    const res = await waterCrop(plotId);
    if (!res.success) {
      alert(res.error);
      setPlots(initialPlots);
    }
  };

  // 3. Thu hoạch phản hồi tức thì
  const handleHarvest = async (plotId: string) => {
    // Đưa ô đất về trống ngay lập tức
    setPlots((prev) =>
      prev.map((p) =>
        p.id === plotId
          ? {
              ...p,
              crop_type: null,
              planted_at: null,
              is_watered: false,
              is_fertilized: false,
            }
          : p
      )
    );

    const res = await harvestCrop(plotId);
    if (!res.success) {
      alert(res.error);
      setPlots(initialPlots);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-400" /> Nông Trại Của Bạn
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gieo hạt, tưới nước và thu hoạch nông sản tươi sạch khi tới mùa vụ.
          </p>
        </div>
      </div>

      {/* Grid Ô Đất Farm Plots */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {plots.map((plot) => (
          <PlotCard
            key={plot.id}
            plot={plot}
            cropDef={plot.crop_type ? cropDefMap.get(plot.crop_type) : undefined}
            onPlantClick={(plotId) => setSelectedPlotId(plotId)}
            onWater={handleWater}
            onHarvest={handleHarvest}
          />
        ))}
      </div>

      {/* Modal Chọn Hạt Giống Gieo Trồng */}
      {selectedPlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                🌱 Chọn Hạt Giống
              </h3>
              <button
                onClick={() => setSelectedPlotId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {cropDefs.map((crop) => {
                const seedInBag = userSeeds.find((s) => s.item_id === `seed_${crop.id}`);
                const hasSeed = (seedInBag?.quantity || 0) > 0;

                return (
                  <div
                    key={crop.id}
                    className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-200">
                        {crop.name} <span className="text-xs text-slate-400">({crop.grow_time_seconds}s)</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Có sẵn: <span className="font-semibold text-emerald-400">{seedInBag?.quantity || 0}</span>
                      </div>
                    </div>

                    <button
                      disabled={!hasSeed || isPlanting}
                      onClick={() => handlePlant(crop.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 text-white font-medium text-xs rounded-lg transition cursor-pointer"
                    >
                      {hasSeed ? 'Gieo' : 'Hết hạt'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

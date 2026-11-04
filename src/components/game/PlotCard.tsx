'use client';

import React, { useState, useEffect } from 'react';
import { Droplets, Sparkles, CheckCircle2, Sprout } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/utils';
import { waterCrop, harvestCrop } from '@/server/actions/farm.actions';
import type { Database } from '@/types/database.types';

type FarmPlot = Database['public']['Tables']['farm_plots']['Row'];
type CropDef = Database['public']['Tables']['crop_definitions']['Row'];

interface PlotCardProps {
  plot: FarmPlot;
  cropDef?: CropDef;
  onPlantClick: (plotId: string) => void;
}

export function PlotCard({ plot, cropDef, onPlantClick }: PlotCardProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Tính toán thời gian còn lại theo thời gian thực phía Client
  useEffect(() => {
    if (!plot.crop_type || !plot.planted_at || !cropDef) {
      setSecondsRemaining(0);
      return;
    }

    const totalSeconds = plot.is_fertilized
      ? Math.floor(cropDef.grow_time_seconds * 0.75)
      : cropDef.grow_time_seconds;

    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - new Date(plot.planted_at!).getTime()) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsRemaining(remaining);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [plot.crop_type, plot.planted_at, plot.is_fertilized, cropDef]);

  const isReady = plot.crop_type && secondsRemaining === 0;

  const handleWater = async () => {
    try {
      setLoading(true);
      const res = await waterCrop(plot.id);
      if (!res.success) alert(res.error);
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async () => {
    try {
      setLoading(true);
      const res = await harvestCrop(plot.id);
      if (!res.success) {
        alert(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Ô đất trống
  if (!plot.crop_type) {
    return (
      <div
        onClick={() => onPlantClick(plot.id)}
        className="group relative flex flex-col items-center justify-center p-6 bg-amber-950/20 border-2 border-dashed border-amber-800/40 hover:border-amber-500 rounded-xl cursor-pointer transition-all hover:bg-amber-900/20 min-h-[190px]"
      >
        <div className="w-12 h-12 rounded-full bg-amber-900/40 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
          <Sprout className="w-6 h-6" />
        </div>
        <span className="mt-3 text-sm font-medium text-amber-200/80 group-hover:text-amber-200">
          Ô đất #{plot.plot_index + 1} (Trống)
        </span>
        <span className="text-xs text-amber-500/60 mt-0.5">Nhấp để gieo hạt</span>
      </div>
    );
  }

  // Ô đất đang có cây
  return (
    <div className="relative flex flex-col justify-between p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl shadow-lg min-h-[190px]">
      {/* Header trạng thái */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">
          #{plot.plot_index + 1} {cropDef?.name || plot.crop_type}
        </span>
        <div className="flex gap-1.5">
          {plot.is_watered && (
            <span className="p-1 rounded bg-blue-500/20 text-blue-400" title="Đã tưới nước">
              <Droplets className="w-3.5 h-3.5" />
            </span>
          )}
          {plot.is_fertilized && (
            <span className="p-1 rounded bg-purple-500/20 text-purple-400" title="Đã bón phân">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Hiển thị trung tâm (Icon & Trạng thái phát triển) */}
      <div className="flex flex-col items-center my-2">
        <div className="text-3xl mb-1 animate-bounce">
          {isReady ? '🌾' : '🌱'}
        </div>
        {isReady ? (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Chín muồi!
          </span>
        ) : (
          <span className="text-xs font-medium text-amber-400">
            {formatTimeRemaining(secondsRemaining)}
          </span>
        )}
      </div>

      {/* Hành động: Tưới nước hoặc Thu hoạch */}
      <div>
        {isReady ? (
          <button
            onClick={handleHarvest}
            disabled={loading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Đang thu hoạch...' : '🌾 Thu hoạch'}
          </button>
        ) : (
          <button
            onClick={handleWater}
            disabled={loading || plot.is_watered}
            className={`w-full py-2 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 ${
              plot.is_watered
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600/80 hover:bg-blue-500 text-white active:scale-95'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            {plot.is_watered ? 'Đất còn ẩm' : 'Tưới (-1⚡)'}
          </button>
        )}
      </div>
    </div>
  );
}

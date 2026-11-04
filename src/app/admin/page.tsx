import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Sprout, Compass, Users, FlaskConical, ArrowRight } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Đếm nhanh số lượng records
  const [
    { count: cropsCount },
    { count: missionsCount },
    { count: minionsCount },
    { count: recipesCount },
  ] = await Promise.all([
    supabase.from('crop_definitions').select('*', { count: 'exact', head: true }),
    supabase.from('expedition_missions').select('*', { count: 'exact', head: true }),
    supabase.from('minion_templates').select('*', { count: 'exact', head: true }),
    supabase.from('recipes').select('*', { count: 'exact', head: true }),
  ]);

  const cards = [
    {
      title: 'Cây Trồng & Nông Sản',
      desc: 'Thời gian lớn, giá bán, EXP thưởng từ thu hoạch.',
      count: cropsCount || 0,
      icon: Sprout,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      href: '/admin/crops',
    },
    {
      title: 'Bản Đồ Thám Hiểm',
      desc: 'Thời gian đi rừng, yêu cầu sức mạnh, tỷ lệ rớt đồ thảo dược.',
      count: missionsCount || 0,
      icon: Compass,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      href: '/admin/expeditions',
    },
    {
      title: 'Mẫu Nhân Viên RPG',
      desc: 'Chỉ số gốc Máu/Công/Thủ và giá tuyển dụng trong Tửu Quán.',
      count: minionsCount || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      href: '/admin/minions',
    },
    {
      title: 'Công Thức Chế Biến',
      desc: 'Công thức nấu ăn và đan dược của Dược Sư.',
      count: recipesCount || 0,
      icon: FlaskConical,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      href: '/admin/recipes',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Bảng Quản Trị Cân Bằng Game (Admin)</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tùy chỉnh toàn bộ chỉ số game theo thời gian thực mà không cần deploy lại code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between shadow-lg group transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold text-slate-200 font-mono">{card.count} mục</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-4 group-hover:text-white transition">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200 transition">
                <span>Mở quản trị chi tiết</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

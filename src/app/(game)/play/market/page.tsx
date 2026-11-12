import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MarketView } from '@/components/game/MarketView';

export default async function MarketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Lấy song song cây trồng và danh sách chợ
  const [{ data: cropDefs }, { data: listings }] = await Promise.all([
    supabase
      .from('crop_definitions')
      .select('*')
      .order('buy_price', { ascending: true }),
    supabase
      .from('marketplace_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <MarketView
      cropDefs={cropDefs || []}
      listings={listings || []}
      currentUserId={user.id}
    />
  );
}

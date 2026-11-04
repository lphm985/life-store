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

  // 1. Lấy danh sách cây trồng (Hạt giống bán ở Shop NPC)
  const { data: cropDefs } = await supabase
    .from('crop_definitions')
    .select('*')
    .order('buy_price', { ascending: true });

  // 2. Lấy danh sách đang rao bán trên Chợ P2P
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // 3. Lấy kho đồ của người chơi hiện tại (để chọn vật phẩm đem bán)
  const { data: userInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .gt('quantity', 0);

  return (
    <MarketView
      cropDefs={cropDefs || []}
      listings={listings || []}
      userInventory={userInventory || []}
      currentUserId={user.id}
    />
  );
}

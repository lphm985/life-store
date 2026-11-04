import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InventoryView } from '@/components/game/InventoryView';

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <InventoryView items={items || []} />;
}

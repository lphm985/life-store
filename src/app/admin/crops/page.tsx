import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminCropsView } from '@/components/admin/AdminCropsView';

export default async function AdminCropsPage() {
  const supabase = await createClient();

  const { data: crops } = await supabase
    .from('crop_definitions')
    .select('*')
    .order('buy_price', { ascending: true });

  return <AdminCropsView crops={crops || []} />;
}

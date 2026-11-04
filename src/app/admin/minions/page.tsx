import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminMinionsView } from '@/components/admin/AdminMinionsView';

export default async function AdminMinionsPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('minion_templates')
    .select('*')
    .order('recruit_cost_gold', { ascending: true });

  return <AdminMinionsView templates={templates || []} />;
}

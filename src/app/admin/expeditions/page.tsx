import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminExpeditionsView } from '@/components/admin/AdminExpeditionsView';

export default async function AdminExpeditionsPage() {
  const supabase = await createClient();

  const { data: missions } = await supabase
    .from('expedition_missions')
    .select('*')
    .order('duration_seconds', { ascending: true });

  return <AdminExpeditionsView missions={missions || []} />;
}

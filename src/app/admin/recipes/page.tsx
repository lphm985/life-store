import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminRecipesView } from '@/components/admin/AdminRecipesView';

export default async function AdminRecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('category', { ascending: false });

  return <AdminRecipesView recipes={recipes || []} />;
}

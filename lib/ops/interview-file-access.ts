import type { createClient } from '@/lib/supabase/server';

export async function getActiveStaffForApi(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role, capabilities')
    .eq('id', userId)
    .eq('active', true)
    .maybeSingle();
  return staff;
}

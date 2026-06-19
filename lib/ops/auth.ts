import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role, active')
    .eq('id', user.id)
    .eq('active', true)
    .single();

  if (!staff) {
    redirect('/login?error=not_staff');
  }

  return { user, staff, supabase };
}

export async function requireProjectMember(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/p/${slug}/login`);
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, slug, status, client_visible, organization_id, progress_percent, description, target_delivery_date')
    .eq('slug', slug)
    .eq('client_visible', true)
    .single();

  if (!project) {
    redirect(`/p/${slug}/login?error=not_found`);
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('id, role')
    .eq('project_id', project.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect(`/p/${slug}/login?error=no_access`);
  }

  return { user, project, membership, supabase };
}

export async function getStaffIfAny() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .eq('active', true)
    .single();

  return staff ? { user, staff, supabase } : null;
}

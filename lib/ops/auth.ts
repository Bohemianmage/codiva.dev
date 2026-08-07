import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAcceptanceStatus, type MemberAcceptanceFields } from '@/lib/ops/legal/acceptances';

const PROJECT_SELECT =
  'id, name, slug, status, client_visible, organization_id, progress_percent, description, target_delivery_date, portal_show_quote, portal_show_costs, site_preview_url, site_production_url';

const MEMBER_SELECT =
  'id, role, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, nda_accepted_at, nda_version';

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

async function getActiveStaff(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .eq('active', true)
    .maybeSingle();
  return staff;
}

/**
 * Acceso al portal: miembro del proyecto o staff en vista previa.
 * Staff puede ver incluso si client_visible = false.
 */
export async function requirePortalAccess(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/p/${slug}/login`);
  }

  const staff = await getActiveStaff(supabase, user.id);

  let projectQuery = supabase.from('projects').select(PROJECT_SELECT).eq('slug', slug);
  if (!staff) {
    projectQuery = projectQuery.eq('client_visible', true);
  }

  const { data: project } = await projectQuery.maybeSingle();

  if (!project) {
    redirect(`/p/${slug}/login?error=not_found`);
  }

  if (staff) {
    return {
      user,
      project,
      membership: null as null,
      isStaffPreview: true as const,
      supabase,
      staff,
    };
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select(MEMBER_SELECT)
    .eq('project_id', project.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    redirect(`/p/${slug}/login?error=no_access`);
  }

  return {
    user,
    project,
    membership: membership as MemberAcceptanceFields & { id: string; role: string },
    isStaffPreview: false as const,
    supabase,
    staff: null,
  };
}

/** @deprecated prefer requirePortalAccess - mantiene compatibilidad */
export async function requireProjectMember(slug: string) {
  const access = await requirePortalAccess(slug);
  if (access.isStaffPreview) {
    return {
      user: access.user,
      project: access.project,
      membership: { id: 'staff-preview', role: 'viewer' as const },
      supabase: access.supabase,
      isStaffPreview: true as const,
    };
  }
  return {
    user: access.user,
    project: access.project,
    membership: access.membership,
    supabase: access.supabase,
    isStaffPreview: false as const,
  };
}

export async function requirePortalMemberWithAcceptances(slug: string) {
  const access = await requirePortalAccess(slug);

  if (access.isStaffPreview) {
    return access;
  }

  const status = getAcceptanceStatus(access.membership);
  if (!status.complete) {
    redirect(`/p/${slug}/aceptar`);
  }

  return access;
}

export async function getStaffIfAny() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const staff = await getActiveStaff(supabase, user.id);
  return staff ? { user, staff, supabase } : null;
}

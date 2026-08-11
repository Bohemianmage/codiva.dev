'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendClientEmail } from '@/lib/ops/email';
import {
  templatePasswordRecoveryHtml,
  templatePortalPasswordRecoveryHtml,
} from '@/lib/ops/email-templates';
import { opsAuthCallbackUrl, portalAuthCallbackUrl, portalHubAuthCallbackUrl } from '@/lib/ops/auth-urls';
import { findUserIdByEmail } from '@/lib/ops/auth-users';

type ResetResult = { ok: true; message: string } | { ok: false; message: string };

export { findUserIdByEmail };

async function sendSupabaseRecoveryEmail(email: string, redirectTo: string): Promise<ResetResult | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const client = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    console.error('resetPasswordForEmail:', error);
    return { ok: false, message: error.message };
  }
  return {
    ok: true,
    message: 'Te enviamos un enlace a tu correo (vía Supabase). Revisa también spam.',
  };
}

async function sendRecoveryEmail(
  email: string,
  redirectTo: string,
  options?: { projectName?: string }
): Promise<ResetResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: email.toLowerCase().trim(),
    options: { redirectTo },
  });

  if (error) {
    console.error('generateLink recovery:', error);
    const fallback = await sendSupabaseRecoveryEmail(email, redirectTo);
    if (fallback?.ok) return fallback;
    return {
      ok: false,
      message:
        error.message.includes('redirect')
          ? 'URL de redirección no permitida en Supabase. Agrega https://ops.codiva.dev/** y https://portal.codiva.dev/** en Authentication → URL Configuration.'
          : `No pudimos generar el enlace: ${error.message}`,
    };
  }

  const link = data?.properties?.action_link;
  if (!link) {
    return { ok: false, message: 'No se pudo generar el enlace de recuperación.' };
  }

  const html = options?.projectName
    ? templatePortalPasswordRecoveryHtml(options.projectName, link)
    : templatePasswordRecoveryHtml(link);

  const mail = await sendClientEmail({
    to: email,
    subject: options?.projectName
      ? `Restablecer acceso - ${options.projectName}`
      : 'Restablecer contraseña - Codiva Ops',
    html,
  });

  if (mail.ok) {
    return {
      ok: true,
      message: 'Te enviamos un enlace a tu correo. Revisa también spam.',
    };
  }

  console.error('Resend failed, trying Supabase email fallback:', mail.error);

  const fallback = await sendSupabaseRecoveryEmail(email, redirectTo);
  if (fallback?.ok) return fallback;

  return {
    ok: false,
    message: `No se pudo enviar el correo: ${mail.error ?? 'error desconocido'}. Verifica RESEND_API_KEY y RESEND_FROM_NOREPLY (o RESEND_FROM) en Vercel — dominio y noreply@ verificados.`,
  };
}

export async function requestStaffPasswordReset(email: string): Promise<ResetResult> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { ok: false, message: 'Ingresa tu email.' };
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return {
      ok: true,
      message: 'Si el email tiene acceso de staff, recibirás un enlace en breve.',
    };
  }

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from('staff_profiles')
    .select('id, active')
    .eq('id', userId)
    .eq('active', true)
    .maybeSingle();

  if (!staff) {
    return {
      ok: true,
      message: 'Si el email tiene acceso de staff, recibirás un enlace en breve.',
    };
  }

  return sendRecoveryEmail(normalized, opsAuthCallbackUrl('/reset-password'));
}

export async function requestPortalPasswordReset(
  email: string,
  slug: string
): Promise<ResetResult> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !slug) {
    return { ok: false, message: 'Datos incompletos.' };
  }

  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select('id, name')
    .eq('slug', slug)
    .eq('client_visible', true)
    .maybeSingle();

  if (!project) {
    return {
      ok: true,
      message: 'Si tienes acceso a este portal, recibirás un enlace en breve.',
    };
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return {
      ok: true,
      message: 'Si tienes acceso a este portal, recibirás un enlace en breve.',
    };
  }

  const { data: member } = await admin
    .from('project_members')
    .select('id')
    .eq('project_id', project.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) {
    return {
      ok: true,
      message: 'Si tienes acceso a este portal, recibirás un enlace en breve.',
    };
  }

  return sendRecoveryEmail(
    normalized,
    portalAuthCallbackUrl(slug, `/p/${slug}/reset-password`),
    { projectName: project.name }
  );
}

/** Recuperación desde el login hub (sin slug): usa el primer proyecto visible del miembro. */
export async function requestPortalHubPasswordReset(email: string): Promise<ResetResult> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { ok: false, message: 'Datos incompletos.' };
  }

  const admin = createAdminClient();
  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return {
      ok: true,
      message: 'Si tienes acceso al portal, recibirás un enlace en breve.',
    };
  }

  const { data: member } = await admin
    .from('project_members')
    .select('project_id, projects!inner(id, name, slug, client_visible)')
    .eq('user_id', userId)
    .limit(20);

  const project = (member ?? [])
    .map((row) => {
      const raw = row.projects as
        | { id: string; name: string; slug: string; client_visible: boolean }
        | { id: string; name: string; slug: string; client_visible: boolean }[]
        | null;
      return Array.isArray(raw) ? raw[0] : raw;
    })
    .find((p) => p && p.client_visible);

  if (!project) {
    return {
      ok: true,
      message: 'Si tienes acceso al portal, recibirás un enlace en breve.',
    };
  }

  return sendRecoveryEmail(
    normalized,
    portalHubAuthCallbackUrl('/reset-password'),
    { projectName: project.name }
  );
}

export async function updatePassword(newPassword: string): Promise<ResetResult> {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: 'Sesión expirada. Solicita un nuevo enlace.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

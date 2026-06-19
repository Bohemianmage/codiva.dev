'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendClientEmail } from '@/lib/ops/email';
import { opsAuthCallbackUrl, portalAuthCallbackUrl } from '@/lib/ops/auth-urls';

type ResetResult = { ok: true; message: string } | { ok: false; message: string };

async function sendRecoveryEmail(email: string, redirectTo: string): Promise<ResetResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: email.toLowerCase().trim(),
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    console.error('generateLink recovery:', error);
    return { ok: false, message: 'No pudimos generar el enlace. Intenta de nuevo.' };
  }

  const link = data.properties.action_link;

  const mail = await sendClientEmail({
    to: email,
    subject: 'Restablecer contraseña — Codiva Ops',
    html: `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${link}">Haz clic aquí para crear una nueva contraseña</a></p>
      <p>Si no solicitaste esto, ignora este correo.</p>
      <p>— Codiva</p>
    `,
  });

  if (mail.skipped) {
    return {
      ok: false,
      message: 'Correo no configurado (Resend). Contacta al administrador.',
    };
  }

  return {
    ok: true,
    message: 'Te enviamos un enlace a tu correo. Revisa también spam.',
  };
}

export async function requestStaffPasswordReset(email: string): Promise<ResetResult> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { ok: false, message: 'Ingresa tu email.' };
  }

  const admin = createAdminClient();

  const { data: users } = await admin.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email?.toLowerCase() === normalized);

  if (!user) {
    // No revelar si existe — misma respuesta genérica
    return {
      ok: true,
      message: 'Si el email tiene acceso de staff, recibirás un enlace en breve.',
    };
  }

  const { data: staff } = await admin
    .from('staff_profiles')
    .select('id, active')
    .eq('id', user.id)
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
    .select('id')
    .eq('slug', slug)
    .eq('client_visible', true)
    .maybeSingle();

  if (!project) {
    return {
      ok: true,
      message: 'Si tienes acceso a este portal, recibirás un enlace en breve.',
    };
  }

  const { data: users } = await admin.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email?.toLowerCase() === normalized);

  if (!user) {
    return {
      ok: true,
      message: 'Si tienes acceso a este portal, recibirás un enlace en breve.',
    };
  }

  const { data: member } = await admin
    .from('project_members')
    .select('id')
    .eq('project_id', project.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) {
    return {
      ok: true,
      message: 'Si tienes acceso a este portal, recibirás un enlace en breve.',
    };
  }

  return sendRecoveryEmail(
    normalized,
    portalAuthCallbackUrl(slug, `/p/${slug}/reset-password`)
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

'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendClientEmail } from '@/lib/ops/email';
import { opsAuthCallbackUrl, portalAuthCallbackUrl } from '@/lib/ops/auth-urls';

type ResetResult = { ok: true; message: string } | { ok: false; message: string };

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('listUsers:', error);
      return null;
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

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

async function sendRecoveryEmail(email: string, redirectTo: string): Promise<ResetResult> {
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
          ? 'URL de redirección no permitida en Supabase. Agrega https://ops.codiva.dev/** en Authentication → URL Configuration.'
          : `No pudimos generar el enlace: ${error.message}`,
    };
  }

  const link = data?.properties?.action_link;
  if (!link) {
    return { ok: false, message: 'No se pudo generar el enlace de recuperación.' };
  }

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
    message: `No se pudo enviar el correo: ${mail.error ?? 'error desconocido'}. Verifica RESEND_API_KEY y RESEND_FROM en Vercel (dominio verificado).`,
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

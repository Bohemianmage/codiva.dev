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
import { getT } from '@/i18n/locale';
import { tSync } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';

type ResetResult = { ok: true; message: string } | { ok: false; message: string };

export { findUserIdByEmail };

async function sendSupabaseRecoveryEmail(
  email: string,
  redirectTo: string,
  locale: Locale
): Promise<ResetResult | null> {
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
    message: tSync(locale, 'auth.sentSupabase'),
  };
}

async function sendRecoveryEmail(
  email: string,
  redirectTo: string,
  options?: { projectName?: string }
): Promise<ResetResult> {
  const t = await getT();
  const locale = t.locale;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: email.toLowerCase().trim(),
    options: { redirectTo },
  });

  if (error) {
    console.error('generateLink recovery:', error);
    const fallback = await sendSupabaseRecoveryEmail(email, redirectTo, locale);
    if (fallback?.ok) return fallback;
    return {
      ok: false,
      message: error.message.includes('redirect')
        ? t('auth.redirectNotAllowed')
        : t('auth.generateFailed', { error: error.message }),
    };
  }

  const link = data?.properties?.action_link;
  if (!link) {
    return { ok: false, message: t('auth.noLink') };
  }

  const html = options?.projectName
    ? templatePortalPasswordRecoveryHtml(options.projectName, link, locale)
    : templatePasswordRecoveryHtml(link, locale);

  const mail = await sendClientEmail({
    to: email,
    subject: options?.projectName
      ? `${t('email.portalRecovery.title')} - ${options.projectName}`
      : `${t('email.recovery.title')} - Codiva.dev`,
    html,
  });

  if (mail.ok) {
    return {
      ok: true,
      message: t('auth.sent'),
    };
  }

  console.error('Resend failed, trying Supabase email fallback:', mail.error);

  const fallback = await sendSupabaseRecoveryEmail(email, redirectTo, locale);
  if (fallback?.ok) return fallback;

  return {
    ok: false,
    message: t('auth.sendFailed', { error: mail.error ?? t('auth.unknownError') }),
  };
}

export async function requestStaffPasswordReset(email: string): Promise<ResetResult> {
  const t = await getT();
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { ok: false, message: t('auth.emailRequired') };
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return {
      ok: true,
      message: t('auth.staffIfExists'),
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
      message: t('auth.staffIfExists'),
    };
  }

  return sendRecoveryEmail(normalized, opsAuthCallbackUrl('/reset-password'));
}

export async function requestPortalPasswordReset(
  email: string,
  slug: string
): Promise<ResetResult> {
  const t = await getT();
  const normalized = email.toLowerCase().trim();
  if (!normalized || !slug) {
    return { ok: false, message: t('auth.incomplete') };
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
      message: t('auth.portalIfExists'),
    };
  }

  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return {
      ok: true,
      message: t('auth.portalIfExists'),
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
      message: t('auth.portalIfExists'),
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
  const t = await getT();
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { ok: false, message: t('auth.incomplete') };
  }

  const admin = createAdminClient();
  const userId = await findUserIdByEmail(normalized);
  if (!userId) {
    return {
      ok: true,
      message: t('auth.hubIfExists'),
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
      message: t('auth.hubIfExists'),
    };
  }

  return sendRecoveryEmail(
    normalized,
    portalHubAuthCallbackUrl('/reset-password'),
    { projectName: project.name }
  );
}

export async function updatePassword(newPassword: string): Promise<ResetResult> {
  const t = await getT();
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, message: t('auth.minLength') };
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: t('auth.sessionExpired') };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: t('auth.updated') };
}

import { getT } from '@/i18n/locale';
import { isTechnicalErrorMessage } from '@/lib/user-error';

export type DbLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null | undefined;

/** Loguea el error de Postgres/Supabase y lanza copy segura para el toast. Use `throw await throwDb(...)`. */
export async function throwDb(error: DbLikeError, fallback?: string): Promise<never> {
  console.error('[ops db]', error);
  const t = await getT();
  const code = error?.code ?? '';
  const message = error?.message ?? '';

  if (code === '23505' || /duplicate key/i.test(message)) {
    throw new Error(t('common.status.alreadyExists'));
  }
  if (code === '23503' || /foreign key/i.test(message)) {
    throw new Error(t('common.status.inUse'));
  }
  if (code === '42501' || /row-level security|permission denied/i.test(message)) {
    throw new Error(t('common.status.forbidden'));
  }
  if (fallback && !isTechnicalErrorMessage(fallback)) {
    throw new Error(fallback);
  }
  throw new Error(t('common.status.actionFailed'));
}

/** Loguea un fallo de GitHub/Vercel/etc. y lanza copy segura. */
export async function throwExternal(error: unknown, key = 'common.status.actionFailed'): Promise<never> {
  console.error('[ops external]', error);
  const t = await getT();
  throw new Error(t(key));
}

export async function throwPublic(key: string): Promise<never> {
  const t = await getT();
  throw new Error(t(key));
}

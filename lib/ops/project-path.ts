import { opsBaseUrl } from '@/lib/ops/host';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Path staff de un proyecto: `/projects/{slug}` (nunca el UUID). */
export function opsProjectPath(slug: string, suffix = ''): string {
  const key = slug.trim();
  if (!key) return '/projects';
  if (!suffix) return `/projects/${key}`;
  if (suffix.startsWith('?') || suffix.startsWith('#')) return `/projects/${key}${suffix}`;
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `/projects/${key}${path}`;
}

export function opsProjectUrl(slug: string, suffix = ''): string {
  return `${opsBaseUrl()}${opsProjectPath(slug, suffix)}`;
}

type ProjectsClient = {
  from: (table: 'projects') => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { id?: string; slug?: string | null } | null }>;
      };
    };
  };
};

export async function resolveOpsProject(
  supabase: ProjectsClient,
  idOrSlug: string
): Promise<{ id: string; slug: string } | null> {
  const key = idOrSlug.trim();
  if (!key) return null;

  if (isUuid(key)) {
    const { data } = await supabase.from('projects').select('id, slug').eq('id', key).maybeSingle();
    if (data?.id && data.slug) return { id: data.id, slug: data.slug };
  }

  const { data } = await supabase.from('projects').select('id, slug').eq('slug', key).maybeSingle();
  if (data?.id && data.slug) return { id: data.id, slug: data.slug };
  return null;
}

export async function opsProjectPathById(
  supabase: ProjectsClient,
  projectId: string,
  suffix = ''
): Promise<string> {
  const { data } = await supabase.from('projects').select('slug').eq('id', projectId).maybeSingle();
  return opsProjectPath(data?.slug || projectId, suffix);
}

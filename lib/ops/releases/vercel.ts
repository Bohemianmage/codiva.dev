/**
 * Vercel REST: list preview deployments and promote to production.
 * Token: VERCEL_RELEASES_TOKEN (preferred) or VERCEL_TOKEN — server-only.
 */

export type VercelPreview = {
  deploymentId: string;
  previewUrl: string;
  inspectUrl: string | null;
  sha: string | null;
  message: string | null;
  author: string | null;
  branch: string | null;
  createdAt: string;
};

export type VercelPromoteResult =
  | { ok: true; inspectUrl: string | null }
  | { ok: false; error: string; missingToken?: boolean };

function vercelToken(): string | null {
  const t =
    process.env.VERCEL_RELEASES_TOKEN?.trim() || process.env.VERCEL_TOKEN?.trim() || null;
  return t || null;
}

export function vercelTokenConfigured(): boolean {
  return Boolean(vercelToken());
}

function vercelHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

function teamQuery(teamId: string | null | undefined): string {
  const id = teamId?.trim();
  if (!id) return '';
  if (id.startsWith('team_')) return `&teamId=${encodeURIComponent(id)}`;
  return `&slug=${encodeURIComponent(id)}`;
}

function teamQueryPrefix(teamId: string | null | undefined): string {
  const id = teamId?.trim();
  if (!id) return '';
  if (id.startsWith('team_')) return `?teamId=${encodeURIComponent(id)}`;
  return `?slug=${encodeURIComponent(id)}`;
}

function asHttps(url: string): string {
  const trimmed = url.trim().replace(/^https?:\/\//, '');
  return `https://${trimmed}`;
}

type VercelDeployment = {
  uid?: string;
  url?: string | null;
  inspectorUrl?: string | null;
  created?: number;
  createdAt?: number;
  target?: string | null;
  meta?: Record<string, string | undefined>;
};

export async function listVercelPreviews(input: {
  projectId: string;
  teamId?: string | null;
}): Promise<{ items: VercelPreview[]; error: string | null }> {
  const token = vercelToken();
  if (!token) {
    return {
      items: [],
      error: 'Falta VERCEL_RELEASES_TOKEN (o VERCEL_TOKEN) en el entorno de Codiva.',
    };
  }

  const projectId = input.projectId.trim();
  if (!projectId) return { items: [], error: null };

  const url = `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectId)}&state=READY&limit=20${teamQuery(input.teamId)}`;
  const res = await fetch(url, { headers: vercelHeaders(token), cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      items: [],
      error: `Vercel list deployments falló (${res.status}): ${body.slice(0, 300) || res.statusText}`,
    };
  }

  const data = (await res.json()) as { deployments?: VercelDeployment[] };
  const items: VercelPreview[] = [];

  for (const d of data.deployments ?? []) {
    if (d.target === 'production') continue;
    if (!d.uid || !d.url) continue;
    const meta = d.meta ?? {};
    const createdMs = d.createdAt ?? d.created ?? Date.now();
    items.push({
      deploymentId: d.uid,
      previewUrl: asHttps(d.url),
      inspectUrl: d.inspectorUrl ?? null,
      sha: meta.githubCommitSha ?? null,
      message: meta.githubCommitMessage ?? null,
      author: meta.githubCommitAuthorName ?? null,
      branch: meta.githubCommitRef ?? null,
      createdAt: new Date(createdMs).toISOString(),
    });
    if (items.length >= 8) break;
  }

  return { items, error: null };
}

export async function resolveVercelDeploymentId(input: {
  previewUrl: string;
  teamId?: string | null;
}): Promise<string | null> {
  const token = vercelToken();
  if (!token) return null;
  const host = input.previewUrl.trim().replace(/^https?:\/\//, '').split('/')[0];
  if (!host) return null;
  const qs = teamQueryPrefix(input.teamId);
  const res = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(host)}${qs}`, {
    headers: vercelHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { uid?: string; id?: string };
  return data.uid || data.id || null;
}

export async function promoteVercelDeployment(input: {
  projectId: string;
  deploymentId: string;
  teamId?: string | null;
}): Promise<VercelPromoteResult> {
  const token = vercelToken();
  if (!token) {
    return {
      ok: false,
      missingToken: true,
      error: 'Falta VERCEL_RELEASES_TOKEN (o VERCEL_TOKEN) en el entorno de Codiva.',
    };
  }

  const projectId = encodeURIComponent(input.projectId.trim());
  const deploymentId = encodeURIComponent(input.deploymentId.trim());
  const qs = teamQueryPrefix(input.teamId);
  const url = `https://api.vercel.com/v10/projects/${projectId}/promote/${deploymentId}${qs}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: vercelHeaders(token),
  });

  if (res.status === 201 || res.status === 202 || res.ok) {
    return {
      ok: true,
      inspectUrl: `https://vercel.com/deployments/${input.deploymentId.trim()}`,
    };
  }

  const body = await res.text().catch(() => '');
  return {
    ok: false,
    error: `Vercel promote falló (${res.status}): ${body.slice(0, 400) || res.statusText}`,
  };
}

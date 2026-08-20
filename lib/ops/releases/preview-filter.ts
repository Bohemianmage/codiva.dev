/**
 * Pure helpers for Ops Incoming: drop dirty deploys, prefer git aliases, one row per SHA.
 */

export type PreviewFilterable = {
  deploymentId: string;
  previewUrl: string;
  sha: string | null;
  createdAt: string;
  dirty?: boolean;
  hasGitAlias?: boolean;
};

export function isDirtyVercelMeta(meta?: Record<string, string | undefined> | null): boolean {
  if (!meta) return false;
  const dirty = meta.gitDirty?.trim().toLowerCase();
  if (dirty === '1' || dirty === 'true' || dirty === 'yes') return true;
  const actor = (meta.actor ?? '').trim().toLowerCase();
  if (actor === 'cursor-cli' || actor.startsWith('cursor')) return true;
  return false;
}

/** Integration branches are not Incoming; QA uses preview/* (e.g. preview/ops-release). */
export function isIntegrationGitRef(ref?: string | null): boolean {
  const value = (ref ?? '').trim().replace(/^refs\/heads\//, '').toLowerCase();
  return value === 'main' || value === 'master';
}

/** When Incoming is empty, explain main vs preview/ops-release. */
export function incomingEmptyHint(input: {
  mainSha: string | null;
  previewSha: string | null;
}): 'preview_behind' | 'preview_waiting' | null {
  const main = input.mainSha?.trim().toLowerCase() ?? '';
  if (main.length < 7) return null;
  const preview = input.previewSha?.trim().toLowerCase() ?? '';
  if (!preview || (!main.startsWith(preview) && !preview.startsWith(main))) return 'preview_behind';
  return 'preview_waiting';
}

export function previewHasGitAlias(previewUrl: string, aliases: string[] = []): boolean {
  const hosts = [previewUrl, ...aliases]
    .map((u) => u.trim().replace(/^https?:\/\//, '').split('/')[0]?.toLowerCase() ?? '')
    .filter(Boolean);
  return hosts.some((h) => /-git-/.test(h));
}

export function normalizePreviewSha(sha: string | null | undefined): string | null {
  const value = sha?.trim().toLowerCase() ?? '';
  return value.length >= 7 ? value : null;
}

export function shasOverlap(a: string, b: string): boolean {
  return a.startsWith(b) || b.startsWith(a);
}

/** Keep newest per SHA; prefer git-alias URLs over opaque hosts. */
export function dedupePreviewsBySha<T extends PreviewFilterable>(items: T[]): T[] {
  const bySha = new Map<string, T>();
  const withoutSha: T[] = [];

  for (const item of items) {
    const sha = normalizePreviewSha(item.sha);
    if (!sha) {
      withoutSha.push(item);
      continue;
    }
    const existing = bySha.get(sha);
    if (!existing) {
      bySha.set(sha, item);
      continue;
    }
    const existingGit = existing.hasGitAlias || /-git-/.test(existing.previewUrl);
    const nextGit = item.hasGitAlias || /-git-/.test(item.previewUrl);
    if (nextGit && !existingGit) {
      bySha.set(sha, item);
      continue;
    }
    if (existingGit && !nextGit) continue;
    if (Date.parse(item.createdAt) > Date.parse(existing.createdAt)) {
      bySha.set(sha, item);
    }
  }

  return [...bySha.values(), ...withoutSha].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export function filterPromotedPreviews<T extends { sha: string | null; previewUrl: string }>(
  items: T[],
  promoted: { sha: string | null; previewUrl: string | null }[]
): T[] {
  const promotedShas = promoted
    .map((row) => normalizePreviewSha(row.sha))
    .filter((sha): sha is string => Boolean(sha));
  const promotedHosts = new Set(
    promoted
      .map((row) => row.previewUrl?.trim().replace(/^https?:\/\//, '').split('/')[0]?.toLowerCase() ?? '')
      .filter(Boolean)
  );

  return items.filter((item) => {
    const sha = normalizePreviewSha(item.sha);
    if (sha && promotedShas.some((p) => shasOverlap(sha, p))) return false;
    const host = item.previewUrl.trim().replace(/^https?:\/\//, '').split('/')[0]?.toLowerCase() ?? '';
    if (host && promotedHosts.has(host)) return false;
    return true;
  });
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

/** Previews older than 7 days (for cleanup), excluding the newest git-alias per SHA. */
export function selectStalePreviewIds(
  items: PreviewFilterable[],
  nowMs = Date.now()
): string[] {
  const keep = new Set(dedupePreviewsBySha(items.filter((i) => i.hasGitAlias || /-git-/.test(i.previewUrl))).map((i) => i.deploymentId));
  return items
    .filter((item) => {
      if (keep.has(item.deploymentId)) return false;
      const age = nowMs - Date.parse(item.createdAt);
      return Number.isFinite(age) && age > STALE_MS;
    })
    .map((item) => item.deploymentId);
}

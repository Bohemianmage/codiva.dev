/**
 * Dispatch GitHub Actions promote workflow for a project release.
 * Token: GITHUB_RELEASES_TOKEN (preferred) or GITHUB_TOKEN — server-only.
 */

export type PromoteDispatchInput = {
  owner: string;
  repo: string;
  workflow: string;
  ref: string;
  deploymentUrlInput: string;
  previewUrl: string;
};

export type PromoteDispatchResult =
  | { ok: true; runUrl: string | null }
  | { ok: false; error: string; missingToken?: boolean };

function githubToken(): string | null {
  const t =
    process.env.GITHUB_RELEASES_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    null;
  return t || null;
}

export async function dispatchPromoteWorkflow(
  input: PromoteDispatchInput
): Promise<PromoteDispatchResult> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      missingToken: true,
      error:
        'Falta GITHUB_RELEASES_TOKEN (o GITHUB_TOKEN) en el entorno de Codiva. Configura el secret y reintenta, o promueve manualmente en GitHub/Vercel.',
    };
  }

  const owner = input.owner.trim();
  const repo = input.repo.trim();
  const workflow = encodeURIComponent(input.workflow.trim());
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: input.ref.trim() || 'main',
      inputs: {
        [input.deploymentUrlInput.trim() || 'deployment_url']: input.previewUrl,
      },
    }),
  });

  if (res.status === 204 || res.status === 201) {
    return {
      ok: true,
      runUrl: `https://github.com/${owner}/${repo}/actions/workflows/${input.workflow.trim()}`,
    };
  }

  const body = await res.text().catch(() => '');
  return {
    ok: false,
    error: `GitHub dispatch falló (${res.status}): ${body.slice(0, 400) || res.statusText}`,
  };
}

export function releasesTokenConfigured(): boolean {
  return Boolean(githubToken());
}

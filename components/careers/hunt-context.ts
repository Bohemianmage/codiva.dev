export type HuntContext = {
  jobPostingId: string;
  token: string;
  discipline?: string;
};

const TOKEN_KEY = (jobPostingId: string, discipline?: string) =>
  discipline
    ? `codiva.career.attempt.${jobPostingId}.${discipline}`
    : `codiva.career.attempt.${jobPostingId}`;

const HUNT_CTX_KEY = 'codiva.career.hunt';

export function readAttemptToken(jobPostingId: string, discipline?: string): string {
  if (typeof window === 'undefined') return '';
  return (
    sessionStorage.getItem(TOKEN_KEY(jobPostingId, discipline)) ||
    localStorage.getItem(TOKEN_KEY(jobPostingId, discipline)) ||
    ''
  );
}

export function writeAttemptToken(jobPostingId: string, token: string, discipline?: string) {
  sessionStorage.setItem(TOKEN_KEY(jobPostingId, discipline), token);
  localStorage.setItem(TOKEN_KEY(jobPostingId, discipline), token);
  writeHuntContext({ jobPostingId, token, discipline });
}

export function writeHuntContext(ctx: HuntContext) {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(ctx);
  sessionStorage.setItem(HUNT_CTX_KEY, payload);
  localStorage.setItem(HUNT_CTX_KEY, payload);
}

export function readHuntContext(): HuntContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(HUNT_CTX_KEY) || localStorage.getItem(HUNT_CTX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HuntContext;
    if (!parsed?.token || !parsed?.jobPostingId) return null;
    return parsed;
  } catch {
    return null;
  }
}

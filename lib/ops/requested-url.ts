const HTTP_URL_RE = /^https?:\/\/[^\s]+$/i;

export function normalizeRequestedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('URL requerida');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('URL inválida. Usa un enlace https, por ejemplo https://github.com/org/repo');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Usa una URL http o https');
  }
  if (!parsed.hostname.includes('.')) {
    throw new Error('URL inválida');
  }
  return parsed.toString();
}

export function isHttpUrl(value: string | null | undefined): boolean {
  return Boolean(value && HTTP_URL_RE.test(value.trim()));
}

/** Vacío → null; si hay valor, normaliza a http(s). */
export function optionalHttpUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  return normalizeRequestedUrl(trimmed);
}

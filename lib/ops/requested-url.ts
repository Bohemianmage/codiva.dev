const HTTP_URL_RE = /^https?:\/\/[^\s]+$/i;

export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

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

export type FileOrUrlInput =
  | { kind: 'file'; file: File }
  | { kind: 'url'; url: string };

/** Archivo tiene prioridad; si no hay, se exige una URL http(s). */
export function resolveFileOrUrlInput(
  file: File | null | undefined,
  urlRaw: string
): FileOrUrlInput {
  if (file && file.size > 0) {
    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) throw new Error('Máximo 10 MB');
    return { kind: 'file', file };
  }
  const trimmed = urlRaw.trim();
  if (trimmed) return { kind: 'url', url: normalizeRequestedUrl(trimmed) };
  throw new Error('Sube un archivo o pega una URL donde esté alojado el documento');
}

import { redirect } from 'next/navigation';

/** Redirect relativo con flash toast en la página destino (`OpsFlashToast`). */
export function redirectWithToast(
  path: string,
  message: string,
  type: 'success' | 'error' = 'success'
): never {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const qIndex = withoutHash.indexOf('?');
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const existing = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : '';
  const params = new URLSearchParams(existing);
  params.set('toast', type);
  params.set('toastMsg', message);
  redirect(`${pathname}?${params.toString()}${hash}`);
}

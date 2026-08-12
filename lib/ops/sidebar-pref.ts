export const OPS_SIDEBAR_OPEN_COOKIE = 'codiva_ops_sidebar_v1';
export const OPS_SIDEBAR_OPEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isOpsSidebarOpenCookie(value: string | undefined) {
  return value !== '0';
}

export function writeOpsSidebarOpenCookie(open: boolean) {
  document.cookie = `${OPS_SIDEBAR_OPEN_COOKIE}=${open ? '1' : '0'};path=/;max-age=${OPS_SIDEBAR_OPEN_COOKIE_MAX_AGE};SameSite=Lax`;
}

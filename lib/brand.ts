import brand from './brand.json';

export type CodivaBrand = typeof brand;

/** Canonical brand tokens for UI, emails, and documents. */
export const CODIVA_BRAND = brand;

export const BRAND_COLORS = brand.colors;

/** Email and PDF layouts share this palette. */
export const BRAND_EMAIL = {
  primary: brand.colors.primary,
  primaryDark: brand.colors.primaryEmail,
  background: brand.colors.background,
  backgroundAlt: brand.colors.backgroundAlt,
  card: brand.colors.card,
  text: brand.colors.text,
  muted: brand.colors.textEmailMuted,
  textMuted: brand.colors.textMuted,
  border: brand.colors.border,
  borderQuote: brand.colors.borderQuote,
} as const;

const FONT_DISPLAY = `'Plus Jakarta Sans', Inter, Arial, Helvetica, sans-serif`;
const BRAND_NAME = brand.name;

/** Wordmark HTML: Codiva (ink/white) + .dev (primary / accent on dark). */
export function brandWordmarkHtml(options?: {
  sizePx?: number;
  as?: 'span' | 'p';
  onDark?: boolean;
}): string {
  const sizePx = options?.sizePx ?? 22;
  const tag = options?.as ?? 'span';
  const nameColor = options?.onDark ? '#FFFFFF' : brand.colors.text;
  const dotColor = options?.onDark ? brand.colors.accentLight : brand.colors.primary;
  const display = tag === 'p' ? 'block' : 'inline';
  return `<${tag} style="display:${display};margin:0;font-family:${FONT_DISPLAY};font-size:${sizePx}px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${nameColor};white-space:nowrap;">Codiva<span style="font-weight:500;color:${dotColor};">.dev</span></${tag}>`;
}

/** Replaces visible Codiva.dev in already-escaped or HTML copy. */
export function paintBrandNameHtml(html: string, sizePx = 15): string {
  const mark = brandWordmarkHtml({ sizePx, as: 'span' });
  return html.replaceAll(`<strong>${BRAND_NAME}</strong>`, mark).replaceAll(BRAND_NAME, mark);
}

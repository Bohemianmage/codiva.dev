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

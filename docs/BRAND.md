# Codiva.dev — Brand guidelines

Reference for visual identity across marketing, Codiva Ops, emails, and commercial documents.

## Name and wordmark

- **Full name:** Codiva.dev
- **Wordmark:** `Codiva` in zinc-900 (`#18181B`) + `.dev` in primary teal
- **Minimum logo size:** 24px height for the mark; 28px used in navbar
- **Clear space:** at least half the logo height on all sides

Assets: `public/logo.svg`, `public/wordmark.svg`, `public/logo-white.svg`, `public/logo-dark.svg`

## Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#104E4E` | CTAs, headings, links, logo |
| `primaryDark` | `#0c3e3e` | Hover states on primary buttons |
| `background` | `#F9FAFB` | Page background |
| `secondary` | `#6A757A` | Muted nav and body text |
| `muted` | `#E5E7EB` | Borders, neutral surfaces |
| `text` | `#18181B` | Body text (zinc-900) |
| `accentLight` | `#5EEAD4` | Links on dark backgrounds (footer) |

Source of truth: [`lib/brand.json`](../lib/brand.json) — import via [`lib/brand.ts`](../lib/brand.ts).

## Typography

| Role | Font | Tailwind class |
|------|------|----------------|
| Headings / wordmark | Plus Jakarta Sans | `font-display` |
| Body / UI | Inter | `font-inter` / `font-sans` |

Do not label Plus Jakarta Sans as “Satoshi” in code or docs.

## Border radius

| Element | Class |
|---------|-------|
| Buttons / CTAs | `rounded-xl` |
| Cards / panels | `rounded-2xl` |
| Inputs | `rounded-lg` |

## Tone

- Direct, operational, no bureaucracy
- Minimal visual noise; motion should support content, not decorate
- B2B trust: process clarity, production focus, Mexico-based studio

## Do

- Use `text-codiva-primary`, `bg-codiva-primary`, `hover:bg-codiva-primary-dark`
- Use shared UI components from `components/ui/` when adding buttons, cards, inputs
- Use `CODIVA_BRAND` / `BRAND_EMAIL` in emails and PDFs
- Use `public/og-image.png` for Open Graph and Twitter cards

## Don't

- Hardcode `#104E4E` or hover hex in components — use Tailwind tokens
- Use the PWA icon as social share image
- Link GitHub to personal profiles — use `https://github.com/Codiva-dev`
- Add client product screenshots to marketing without explicit approval

## Touchpoints

| Surface | Location |
|---------|----------|
| Marketing site | `codiva.dev` |
| Ops / portal | `ops.codiva.dev` |
| Transactional email | `lib/ops/email-templates.ts` |
| Quote PDF | `lib/ops/quote-document/` |
| Supabase auth email | `scripts/supabase-email-layout.mjs` |

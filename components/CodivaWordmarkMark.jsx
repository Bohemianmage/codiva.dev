import clsx from 'clsx';

export const WORDMARK_SIZE = {
  sm: { codiva: 'text-base', dev: 'text-sm' },
  md: { codiva: 'text-xl', dev: 'text-base' },
  lg: { codiva: 'text-2xl', dev: 'text-lg' },
  inline: { codiva: 'text-[1em]', dev: 'text-[1em]' },
};

export const WORDMARK_VARIANT = {
  default: {
    codiva: 'text-zinc-900',
    dev: 'text-codiva-primary',
    weight: 'font-bold',
  },
  footer: {
    codiva: 'text-white',
    dev: 'text-codiva-accent-light',
    weight: 'font-medium',
  },
  inline: {
    codiva: 'text-zinc-900',
    dev: 'text-codiva-primary',
    weight: 'font-semibold',
  },
};

export function wordmarkClassName(size, variant, className) {
  const colors = WORDMARK_VARIANT[variant] ?? WORDMARK_VARIANT.default;
  return clsx(
    'inline-flex whitespace-nowrap font-display tracking-tight',
    size === 'inline' ? 'items-baseline align-baseline' : 'items-end',
    colors.weight,
    className
  );
}

/**
 * Wordmark oficial sin animación: Codiva (zinc-900) + .dev (primary).
 * Usar en lockups de producto; el de marketing anima con CodivaWordmark.
 */
export default function CodivaWordmarkMark({
  size = 'md',
  variant = 'default',
  className = '',
}) {
  const sizes = WORDMARK_SIZE[size] ?? WORDMARK_SIZE.md;
  const colors = WORDMARK_VARIANT[variant] ?? WORDMARK_VARIANT.default;

  return (
    <span className={wordmarkClassName(size, variant, className)}>
      <span className={clsx('inline-block', sizes.codiva, colors.codiva)}>Codiva</span>
      <span
        className={clsx(
          'inline-block',
          sizes.dev,
          colors.dev,
          variant === 'default' && 'font-medium'
        )}
      >
        .dev
      </span>
    </span>
  );
}

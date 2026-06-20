'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

const SIZE = {
  sm: { codiva: 'text-base', dev: 'text-sm', gap: 'ml-0.5' },
  md: { codiva: 'text-xl', dev: 'text-base', gap: 'ml-1' },
  lg: { codiva: 'text-2xl', dev: 'text-lg', gap: 'ml-1' },
  inline: { codiva: 'text-[1em]', dev: 'text-[1em]', gap: 'ml-0' },
};

const VARIANT = {
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

/**
 * Wordmark unificado: Codiva + .dev con animación en cascada.
 */
export default function CodivaWordmark({
  size = 'md',
  variant = 'default',
  animate = true,
  active = true,
  className = '',
}) {
  const sizes = SIZE[size] ?? SIZE.md;
  const colors = VARIANT[variant] ?? VARIANT.default;
  const shouldAnimate = animate && active;

  return (
    <span
      className={clsx(
        'inline-flex tracking-tight',
        size === 'inline' ? 'items-baseline' : 'items-end font-display',
        colors.weight,
        className
      )}
    >
      <motion.span
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : animate ? { opacity: 0, y: 10 } : undefined}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={clsx('inline-block', sizes.codiva, colors.codiva)}
      >
        Codiva
      </motion.span>
      <motion.span
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : animate ? { opacity: 0, y: 10 } : undefined}
        transition={{ duration: 0.6, delay: 0.5 }}
        className={clsx('inline-block', sizes.dev, sizes.gap, colors.dev, variant === 'default' && 'font-medium')}
      >
        .dev
      </motion.span>
    </span>
  );
}

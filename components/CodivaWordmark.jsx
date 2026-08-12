'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  WORDMARK_SIZE,
  WORDMARK_VARIANT,
  wordmarkClassName,
} from './CodivaWordmarkMark';

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
  const sizes = WORDMARK_SIZE[size] ?? WORDMARK_SIZE.md;
  const colors = WORDMARK_VARIANT[variant] ?? WORDMARK_VARIANT.default;
  const shouldAnimate = animate && active;

  return (
    <span className={wordmarkClassName(size, variant, className)}>
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
        className={clsx('inline-block', sizes.dev, colors.dev, variant === 'default' && 'font-medium')}
      >
        .dev
      </motion.span>
    </span>
  );
}

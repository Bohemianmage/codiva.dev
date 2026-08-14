'use client';

import { motion } from 'framer-motion';
import { getLogoFrame } from '../utils/logoFrame';

/**
 * Logos diseñados sobre fondo oscuro: misma silueta que el resto, con contenedor negro.
 */
export function CaseStudyLogo({ item, alt, className, motionProps }) {
  const frame = getLogoFrame(item);
  const innerImgClass =
    item.logoSurface === 'dark'
      ? `max-h-full w-auto max-w-full object-contain ${className ?? ''}`.trim()
      : (className ?? '');

  const imgProps = {
    src: item.logo,
    alt,
    width: frame.width,
    height: frame.height,
    decoding: 'async',
  };

  if (item.logoSurface === 'dark') {
    return (
      <div className="flex h-full w-full max-h-full items-center justify-center rounded-lg bg-black px-2 py-1.5 sm:px-3 sm:py-2">
        {motionProps ? (
          <motion.img className={innerImgClass} {...imgProps} {...motionProps} />
        ) : (
          <img className={innerImgClass} {...imgProps} />
        )}
      </div>
    );
  }

  if (motionProps) {
    return <motion.img className={className} {...imgProps} {...motionProps} />;
  }

  return <img className={className} {...imgProps} />;
}

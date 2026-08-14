'use client';

import { motion } from 'framer-motion';
import { getLogoFrame } from '../utils/logoFrame';

export function CaseStudyLogo({ item, alt, className, motionProps }) {
  const frame = getLogoFrame(item);
  const imgProps = {
    src: item.logo,
    alt,
    width: frame.width,
    height: frame.height,
    decoding: 'async',
  };

  if (motionProps) {
    return <motion.img className={className} {...imgProps} {...motionProps} />;
  }

  return <img className={className} {...imgProps} />;
}

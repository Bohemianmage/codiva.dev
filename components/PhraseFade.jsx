'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cross-fades between phrases without typewriter effect.
 */
export default function PhraseFade({
  phrases = [],
  intervalMs = 3200,
  className = '',
  active = true,
}) {
  const [index, setIndex] = useState(0);
  const phrasesKey = phrases.join('\u0000');

  useEffect(() => {
    setIndex(0);
  }, [phrasesKey]);

  useEffect(() => {
    if (!active || phrases.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [active, phrases.length, intervalMs, phrasesKey]);

  if (phrases.length === 0) return null;

  const phrase = phrases[index % phrases.length];

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={`${phrasesKey}-${index}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="inline-block"
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

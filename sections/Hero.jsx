'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Heading from '../components/Heading';
import HeroVisual from '../components/HeroVisual';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();
  const heroRef = useRef(null);

  const staticText1 = t('hero.cleanCode');
  const staticText2 = t('hero.customTech');
  const staticText3 = t('hero.withoutNoise');
  const badges = t('hero.trustBadges', { returnObjects: true });
  const badgeList = Array.isArray(badges) ? badges : [];

  return (
    <section
      id="hero"
      ref={heroRef}
      className="flex min-h-screen flex-col items-center justify-center bg-codiva-background px-6 pb-10 pt-[max(6rem,env(safe-area-inset-top,0px)+4.5rem)] text-center md:pt-[max(6.5rem,env(safe-area-inset-top,0px)+4.5rem)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl"
      >
        <Heading
          as="h1"
          size="text-4xl md:text-6xl"
          className="text-zinc-900 leading-tight mb-6"
        >
          {staticText1}{' '}
          <span className="text-codiva-primary">{staticText2}</span>
          <br />
          {staticText3}
        </Heading>

        <noscript>
          <h1 style={{ display: 'none' }}>
            {staticText1} {staticText2} {staticText3}
          </h1>
        </noscript>

        {badgeList.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-2 flex flex-wrap items-center justify-center gap-2"
          >
            {badgeList.map((badge) => (
              <li
                key={badge}
                className="rounded-full border border-codiva-primary/20 bg-white/80 px-3 py-1 text-xs font-medium text-codiva-primary backdrop-blur-sm"
              >
                {badge}
              </li>
            ))}
          </motion.ul>
        )}
      </motion.div>

      <HeroVisual />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        <Button
          type="button"
          onClick={() => {
            const el = document.getElementById('services');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mt-8"
        >
          {t('hero.viewServices')}
        </Button>
      </motion.div>
    </section>
  );
}

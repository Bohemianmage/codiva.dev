'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Heading from '../components/Heading';
import Button from '../components/ui/Button';
import TypewriterCycle from '../components/TypewriterCycle';
import { scrollToSectionCenter } from '../utils/scrollToSection';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();
  const heroRef = useRef(null);

  const staticText1 = t('hero.cleanCode');
  const staticText2 = t('hero.customTech');
  const staticText3 = t('hero.withoutNoise');

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
      >
        <Heading
          as="h1"
          size="text-4xl md:text-6xl"
          className="text-zinc-900 leading-tight mb-6"
        >
          {staticText1}{' '}
          <span className="text-codiva-primary">
            <TypewriterCycle phrases={[staticText2]} loop={false} active />
          </span>
          <br />
          {staticText3}
        </Heading>

        <noscript>
          <h1 style={{ display: 'none' }}>
            {staticText1} {staticText2} {staticText3}
          </h1>
        </noscript>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Button
          type="button"
          onClick={() => scrollToSectionCenter('services')}
          className="mt-6"
        >
          {t('hero.viewServices')}
        </Button>
      </motion.div>
    </section>
  );
}

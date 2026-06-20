'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Heading from '../components/Heading';
import Paragraph from '../components/Paragraph';
import PhraseFade from '../components/PhraseFade';
import BrandPattern from '../components/BrandPattern';

export default function About() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  const inView = useInView(sectionRef, {
    triggerOnce: false,
    threshold: 0.85,
  });

  const productionTypes = t('about.productionTypes', { returnObjects: true });
  const typedPhrases = Array.isArray(productionTypes) ? productionTypes : [];

  const CodivaDev = () => (
    <>
      <motion.span
        key="codiva"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="inline-block font-semibold text-zinc-900"
      >
        Codiva
      </motion.span>
      <motion.span
        key="dev"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="inline-block text-codiva-primary"
      >
        .dev
      </motion.span>
    </>
  );

  return (
    <section
      id="about"
      className="section-spacing scroll-mt-24 md:scroll-mt-28 relative w-full px-6 md:px-12 flex justify-center bg-zinc-50 overflow-hidden"
    >
      <BrandPattern />
      <div
        ref={sectionRef}
        className="glass-panel relative w-full max-w-4xl rounded-2xl px-8 py-12 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          key={inView ? 'visible-title' : 'hidden-title'}
        >
          <Heading
            as="h2"
            size="text-3xl md:text-4xl"
            className="text-codiva-primary mb-6"
            role="heading"
            aria-level={2}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {t('about.title')}
            </motion.span>
          </Heading>

          <noscript>
            <h2 style={{ display: 'none' }}>{t('about.title')}</h2>
            <p style={{ display: 'none' }}>
              {t('about.paragraph1Intro')}
              {typedPhrases.join(', ')}
              {t('about.paragraph1Outro')}
            </p>
          </noscript>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          key={inView ? 'visible-text' : 'hidden-text'}
        >
          <Paragraph className="max-w-2xl mx-auto text-codiva-secondary text-base md:text-lg mb-4">
            {t('about.paragraph1Intro').split('Codiva.dev')[0]}
            <CodivaDev />
            {t('about.paragraph1Intro').split('Codiva.dev')[1]}
            <PhraseFade
              phrases={typedPhrases}
              className="font-medium text-codiva-primary"
              active={inView}
            />
            {t('about.paragraph1Outro')}
          </Paragraph>

          <Paragraph className="max-w-2xl mx-auto text-zinc-600 text-base md:text-lg">
            {t('about.paragraph2').split('Codiva.dev')[0]}
            <CodivaDev />
            {t('about.paragraph2').split('Codiva.dev')[1]}
          </Paragraph>
        </motion.div>
      </div>
    </section>
  );
}

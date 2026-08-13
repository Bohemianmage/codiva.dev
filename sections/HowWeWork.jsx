'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Heading from '../components/Heading';
import Paragraph from '../components/Paragraph';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function HowWeWork() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { triggerOnce: false, threshold: 0.35 });

  const steps = t('process.steps', { returnObjects: true });
  const stepList = Array.isArray(steps) ? steps : [];

  return (
    <section
      id="proceso"
      ref={sectionRef}
      className="section-spacing relative flex w-full scroll-mt-24 justify-center bg-zinc-50 px-6 md:scroll-mt-28 md:px-12"
    >
      <div className="glass-panel relative w-full max-w-4xl rounded-2xl px-8 py-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeInUp} className="text-center">
            <Heading as="h2" size="text-3xl md:text-4xl" className="mb-6 text-codiva-primary">
              {t('process.title')}
            </Heading>
            <Paragraph className="mx-auto mb-10 max-w-2xl text-codiva-secondary">
              {t('process.subtitle')}
            </Paragraph>
          </motion.div>

          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            {stepList.map((step, index) => (
              <motion.li key={step.title} variants={fadeInUp} className="text-left">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-codiva-primary">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mb-2 text-xl font-semibold text-zinc-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600 md:text-base">{step.description}</p>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}

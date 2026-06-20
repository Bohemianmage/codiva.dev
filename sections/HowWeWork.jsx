'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, PenTool, Rocket, LifeBuoy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Heading from '../components/Heading';
import Paragraph from '../components/Paragraph';
import BrandPattern from '../components/BrandPattern';

const STEP_ICONS = [Search, PenTool, Rocket, LifeBuoy];

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
      className="section-spacing relative scroll-mt-24 md:scroll-mt-28 w-full overflow-hidden px-6 md:px-12 flex justify-center bg-zinc-50"
    >
      <BrandPattern />
      <div className="relative w-full max-w-6xl rounded-2xl bg-white px-6 py-12 shadow-md md:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeInUp}>
            <Heading as="h2" size="text-3xl md:text-4xl" className="text-codiva-primary mb-4 text-center">
              {t('process.title')}
            </Heading>
            <Paragraph className="mx-auto mb-12 max-w-2xl text-center text-codiva-secondary">
              {t('process.subtitle')}
            </Paragraph>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {stepList.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? Search;
              return (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  className="relative rounded-2xl border border-zinc-100 bg-codiva-background/80 p-6 text-left"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-codiva-primary/10 text-codiva-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-codiva-primary">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mb-2 font-display text-lg font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-600">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

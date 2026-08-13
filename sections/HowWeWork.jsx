'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Heading from '../components/Heading';
import Paragraph from '../components/Paragraph';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const STEP_MS = 2800;

export default function HowWeWork() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const inView = useInView(sectionRef, { triggerOnce: false, threshold: 0.35 });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const steps = t('process.steps', { returnObjects: true });
  const stepList = Array.isArray(steps) ? steps : [];
  const count = stepList.length;
  const rail = count > 1 ? active / (count - 1) : 0;

  useEffect(() => {
    if (!inView) setActive(0);
  }, [inView]);

  useEffect(() => {
    if (!inView || paused || reduceMotion || count < 2) return undefined;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [inView, paused, reduceMotion, count]);

  const pause = () => setPaused(true);
  const resume = (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && listRef.current?.contains(next)) return;
    setPaused(false);
  };

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

          <ol
            ref={listRef}
            aria-label={t('process.title')}
            onMouseEnter={pause}
            onMouseLeave={() => setPaused(false)}
            className="relative grid grid-cols-1 md:grid-cols-4 md:gap-x-5"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[12.5%] top-[1.125rem] hidden h-px bg-codiva-primary/20 md:block"
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-[12.5%] top-[1.125rem] hidden h-px w-[75%] origin-left bg-codiva-primary md:block"
              initial={false}
              animate={{ scaleX: reduceMotion ? 1 : rail }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            />

            {stepList.map((step, index) => {
              const isCurrent = !reduceMotion && index === active;
              const filled = reduceMotion || index < active;
              const isLast = index === count - 1;

              return (
                <motion.li
                  key={step.title}
                  variants={fadeInUp}
                  aria-current={isCurrent ? 'step' : undefined}
                  tabIndex={0}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => {
                    pause();
                    setActive(index);
                  }}
                  onBlur={resume}
                  className="flex cursor-pointer gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-codiva-primary/40 focus-visible:ring-offset-2 md:flex-col md:items-center md:gap-3 md:text-center"
                >
                  <div className="flex w-9 shrink-0 flex-col items-center self-stretch">
                    <span
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold tracking-wider transition duration-300 ${
                        isCurrent
                          ? 'scale-110 bg-codiva-primary text-white shadow-sm'
                          : filled
                            ? 'bg-codiva-primary/15 text-codiva-primary'
                            : 'border border-codiva-primary/25 bg-white/80 text-codiva-primary'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {isLast ? null : (
                      <div className="mt-2 w-px flex-1 overflow-hidden bg-codiva-primary/20 md:hidden">
                        <motion.div
                          className="h-full w-full origin-top bg-codiva-primary"
                          initial={false}
                          animate={{ scaleY: filled ? 1 : 0 }}
                          transition={{ duration: 0.45, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </div>

                  <div
                    className={`min-w-0 flex-1 rounded-xl px-1 transition duration-300 ${
                      isLast ? 'pb-0' : 'pb-8 md:pb-0'
                    } ${isCurrent ? 'md:bg-codiva-primary/5 md:py-2' : 'md:py-2'}`}
                  >
                    <h3 className="mb-2 text-xl font-semibold text-zinc-900">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-zinc-600 md:text-base">{step.description}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}

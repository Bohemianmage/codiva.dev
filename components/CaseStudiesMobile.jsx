'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CaseStudyLogo } from './CaseStudyLogo';
import { getLogoFrame, isWideLogo } from '../utils/logoFrame';
import useMarqueeCopies from '../hooks/useMarqueeCopies';
import useMarqueePause from '../hooks/useMarqueePause';

const AUTO_MS = 4800;
const SWIPE_PX = 44;
const MARQUEE_GAP = 'gap-6';

export default function CaseStudiesMobile({ logos }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [timerNonce, setTimerNonce] = useState(0);
  const pausedRef = useRef(false);
  const touchRef = useRef({ x: 0, y: 0 });
  const logosMarquee = useMarqueePause();
  const logosCopies = useMarqueeCopies(logos, MARQUEE_GAP);

  const count = logos.length;
  const project = logos[index];
  const indexByName = useMemo(() => {
    const map = new Map();
    logos.forEach((item, i) => map.set(item.name, i));
    return map;
  }, [logos]);

  const descriptions = t('cases.list', { returnObjects: true });
  const description = Array.isArray(descriptions)
    ? descriptions.find((item) => item.name === project?.name)?.description
    : null;

  const goTo = useCallback(
    (next) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
      setTimerNonce((n) => n + 1);
    },
    [count]
  );

  useEffect(() => {
    if (reduceMotion || count < 2) return undefined;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [count, reduceMotion, timerNonce]);

  const onTouchStart = (event) => {
    pausedRef.current = true;
    touchRef.current = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  };

  const onTouchEnd = (event) => {
    const dx = event.changedTouches[0].clientX - touchRef.current.x;
    const dy = event.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      goTo(index + (dx < 0 ? 1 : -1));
    }
    pausedRef.current = false;
  };

  const selectByName = (name) => {
    const next = indexByName.get(name);
    if (next == null) return;
    goTo(next);
  };

  if (!project) return null;

  const logoFrame = getLogoFrame(project);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={(node) => {
          logosCopies.containerRef.current = node;
        }}
        className="relative w-full overflow-x-auto scrollbar-hidden px-1 touch-pan-x overscroll-x-contain"
        {...logosMarquee.containerProps}
      >
        <div
          ref={logosCopies.measureRef}
          className={`pointer-events-none absolute left-0 top-0 flex w-max ${MARQUEE_GAP} opacity-0`}
          aria-hidden
        >
          {logos.map((item) => {
            const frame = getLogoFrame(item);
            return (
              <div
                key={`meas-${item.name}`}
                className="flex flex-shrink-0 items-center justify-center"
                style={{
                  height: '3.5rem',
                  minWidth:
                    isWideLogo(item) ? `${frame.width / 22}rem` : '3.5rem',
                }}
              >
                <CaseStudyLogo
                  item={item}
                  alt=""
                  className="h-full w-auto object-contain"
                />
              </div>
            );
          })}
        </div>
        <div
          style={{ ...logosCopies.marqueeStyle, animationDuration: '45s' }}
          className={logosMarquee.innerClassName(
            `flex ${MARQUEE_GAP} min-w-max whitespace-nowrap will-change-transform animate-scroll-right animate-medium py-2`
          )}
        >
          {logosCopies.flatWithKeys.map(({ item, key, copyIdx }) => {
            const frame = getLogoFrame(item);
            const selected = item.name === project.name;
            const interactive = copyIdx === 0;
            return (
              <button
                key={key}
                type="button"
                tabIndex={interactive ? 0 : -1}
                aria-hidden={!interactive}
                aria-label={interactive ? item.name : undefined}
                aria-pressed={interactive ? selected : undefined}
                onClick={() => selectByName(item.name)}
                className={`flex flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codiva-primary ${
                  selected ? 'scale-105 opacity-100' : 'opacity-40'
                }`}
                style={{
                  height: '3.5rem',
                  minWidth:
                    isWideLogo(item) ? `${frame.width / 22}rem` : '3.5rem',
                }}
              >
                <CaseStudyLogo
                  item={item}
                  alt=""
                  className="h-full w-auto object-contain"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mt-6 w-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={project.name}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col items-center"
          >
            <div className="flex w-full items-center gap-4 text-left">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-shrink-0 items-center justify-center"
                style={{
                  height: '4rem',
                  width: isWideLogo(project) ? `${logoFrame.width / 20}rem` : '4.5rem',
                }}
                aria-label={t('cases.visitSite', { name: project.name })}
              >
                <CaseStudyLogo
                  item={project}
                  alt=""
                  className="h-full w-auto max-w-full object-contain"
                />
              </a>
              <div className="min-w-0">
                <p className="text-base font-semibold text-codiva-primary">{project.name}</p>
                {description ? (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{description}</p>
                ) : null}
              </div>
            </div>
            <ul
              className="mt-5 flex min-h-[4.5rem] w-full flex-wrap justify-center gap-2"
              aria-label={t('cases.technologiesOf', { name: project.name })}
            >
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-codiva-primary/20 bg-codiva-primary/5 px-3 py-1 text-sm text-codiva-primary"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

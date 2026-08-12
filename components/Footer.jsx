'use client';

import Link from 'next/link';
import { Github, Linkedin, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CODIVA_BRAND } from '@/lib/brand';
import CodivaWordmark from './CodivaWordmark';
import { careerBaseUrl, ticketBaseUrl } from '@/lib/ops/host';

export default function Footer({ variant = 'marketing' }) {
  const { t } = useTranslation();
  const footerRef = useRef(null);
  const inView = useInView(footerRef, { triggerOnce: false, threshold: 0.4 });
  const isCareer = variant === 'career';
  const year = isCareer ? 2024 : new Date().getFullYear();

  return (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full px-6 md:px-12 py-10 text-sm bg-zinc-900 border-t border-zinc-800 font-inter"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-zinc-400 text-center md:text-left">
          © {year}{' '}
          <CodivaWordmark size="sm" variant="footer" animate active={inView} />
          {' '}
          {t('footer.rights')}
        </span>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <Link
            href={careerBaseUrl()}
            className="text-zinc-300 hover:text-white font-medium transition-colors"
          >
            {t('footer.careers')}
          </Link>
          <Link
            href={isCareer ? '/hallazgos' : ticketBaseUrl()}
            className="text-zinc-300 hover:text-white font-medium transition-colors"
          >
            {isCareer ? t('footer.huntLink') : t('footer.ticketLink')}
          </Link>
          {isCareer ? (
            <Link
              href="/mapa"
              className="text-zinc-300 hover:text-white font-medium transition-colors"
            >
              {t('footer.sitemap')}
            </Link>
          ) : null}
          {isCareer ? (
            <a
              href="/api/careers/feed"
              className="text-zinc-300 hover:text-white font-medium transition-colors"
            >
              {t('footer.feed')}
            </a>
          ) : null}
          <Link
            href="/legal/terminos"
            className="text-zinc-300 hover:text-white font-medium transition-colors"
          >
            {t('footer.terms')}
          </Link>
          <Link
            href="/legal/aviso-privacidad"
            className="text-zinc-300 hover:text-white font-medium transition-colors"
          >
            {t('footer.privacy')}
          </Link>

          <a
            href={`mailto:${CODIVA_BRAND.urls.email}`}
            className="text-zinc-300 hover:text-white font-medium transition-colors"
          >
            {CODIVA_BRAND.urls.email}
          </a>

          <div className="flex items-center space-x-3">
            {isCareer ? (
              <button
                type="button"
                className="text-zinc-500 hover:text-white transition-all duration-200 p-1"
              >
                ?
              </button>
            ) : null}
            <a
              href={CODIVA_BRAND.urls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="text-codiva-accent-light hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 p-1.5"
            >
              <Linkedin size={22} strokeWidth={1.8} />
            </a>
            <a
              href={CODIVA_BRAND.urls.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="text-zinc-400 hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 p-1"
            >
              <Github size={20} strokeWidth={1.8} />
            </a>
            <a
              href={CODIVA_BRAND.urls.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="text-zinc-500 hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 p-1"
            >
              <Instagram size={18} strokeWidth={1.8} />
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

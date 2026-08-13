'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useRouter, usePathname } from 'next/navigation';
import { scrollToSectionCenter } from '../utils/scrollToSection';
import CodivaWordmark from './CodivaWordmark';
import { marketingBaseUrl } from '@/lib/ops/host';

// Menú de navegación (ya sin 'Home')
const navItems = [
  { labelKey: 'nav.about', id: 'about' },
  { labelKey: 'nav.services', id: 'services' },
  { labelKey: 'nav.cases', id: 'casos' },
  { labelKey: 'nav.contact', id: 'contact' },
];

// Animaciones del navbar
const navVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: { opacity: 1, y: 0 },
};

function MenuToggle({ open, onToggle, label }) {
  const bar =
    'absolute left-0 h-0.5 w-full rounded-full bg-slate-800 transition duration-200 ease-out';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={open}
      aria-controls="mobile-menu"
      className="relative flex h-7 w-7 shrink-0 items-center justify-center p-0 leading-none"
    >
      <span className="relative block h-3.5 w-[18px]" aria-hidden="true">
        <span
          className={`${bar} ${open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'}`}
        />
        <span
          className={`${bar} top-1/2 -translate-y-1/2 ${open ? 'scale-0 opacity-0' : ''}`}
        />
        <span
          className={`${bar} ${open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'}`}
        />
      </span>
    </button>
  );
}

export default function Navbar({ variant = 'marketing' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { t } = useTranslation();
  const isSatellite = variant === 'career' || variant === 'ticket';
  const marketingUrl = marketingBaseUrl();

  /**
   * Navega a la sección correspondiente.
   * En la bolsa (career.*) las secciones viven en el sitio de marketing.
   */
  const scrollTo = (id) => {
    if (isSatellite) {
      window.location.href = `${marketingUrl}/#${id}`;
      setMenuOpen(false);
      return;
    }
    if (pathname !== '/') {
      router.push(`/#${id}`);
    } else {
      scrollToSectionCenter(id);
    }
    setMenuOpen(false);
  };

  const goBrandHome = () => {
    if (isSatellite) {
      window.location.href = marketingUrl;
      return;
    }
    scrollTo('hero');
  };

  // Mostrar u ocultar navbar según el scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNavbar(currentScrollY <= 80 || currentScrollY < lastScrollY);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cerrar menú con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed top-0 z-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:px-6 ${
        menuOpen ? 'inset-0' : 'w-full'
      }`}
    >
      {/* Backdrop fuera del nav: su transform impide que fixed cubra el viewport */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu-backdrop"
            onClick={() => setMenuOpen(false)}
            className="pointer-events-auto fixed inset-0 z-40 bg-zinc-900/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: showNavbar ? 0 : -96 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="glass-panel pointer-events-auto relative z-50 mx-auto flex h-14 max-w-7xl items-center rounded-2xl px-5 font-inter md:px-8"
      >
      <div className="flex w-full items-center justify-between">
        {/* Logo principal (click lleva al inicio) */}
        <motion.div
          onClick={goBrandHome}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex h-7 cursor-pointer items-center space-x-2"
        >
          <Image src="/logo.svg" alt="Codiva logo" width={28} height={28} className="block h-7 w-7" />
          <CodivaWordmark
            size="md"
            variant="default"
            animate
            active
            className="leading-none [&_span]:leading-none"
          />
        </motion.div>

        {/* Navegación desktop */}
        <div className="hidden md:flex items-center justify-between gap-6">
          <motion.div
            className="flex gap-12"
            variants={navVariants}
            initial="hidden"
            animate="visible"
          >
            {navItems.map(({ labelKey, id }) => (
              <motion.button
                key={id}
                variants={itemVariants}
                onClick={() => scrollTo(id)}
                className="relative text-codiva-secondary hover:text-zinc-900 transition-colors font-medium after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:bg-codiva-primary after:w-0 hover:after:w-full after:transition-all"
              >
                {t(labelKey)}
              </motion.button>
            ))}
          </motion.div>

          <div className="pl-4">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile: idioma + hamburguesa */}
        <div className="flex h-7 items-center gap-3 md:hidden">
          <LanguageSwitcher />
          <MenuToggle
            open={menuOpen}
            onToggle={() => setMenuOpen((open) => !open)}
            label={t('a11y.menu')}
          />
        </div>
      </div>

      {/* Menú mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-panel-solid absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl px-6 pb-6 pt-2 md:hidden"
          >
            <motion.div
              variants={navVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-4"
            >
              {navItems.map(({ labelKey, id }) => (
                <motion.button
                  key={id}
                  variants={itemVariants}
                  onClick={() => scrollTo(id)}
                  className="block w-full text-left text-codiva-secondary hover:text-zinc-900 transition font-medium"
                >
                  {t(labelKey)}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.nav>
    </div>
  );
}
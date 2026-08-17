'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { scrollToSectionCenter } from '../utils/scrollToSection';
import HuntBeacon from '../components/careers/HuntBeacon';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';

const Footer = dynamic(() => import('../components/Footer'));
const FloatingQuoteButton = dynamic(() => import('../components/FloatingQuoteButton'), {
  ssr: false,
});

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then((mod) => mod.Analytics),
  { ssr: false }
);

export default function LayoutClient({ children, variant = 'marketing' }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isCareer = variant === 'career';
  const isTicket = variant === 'ticket';
  const isSatellite = isCareer || isTicket;

  useEffect(() => {
    if (isSatellite || pathname !== '/') return;

    const scrollFromHash = () => {
      const id = window.location.hash.replace('#', '');
      if (!id) return;
      requestAnimationFrame(() => scrollToSectionCenter(id));
    };

    scrollFromHash();
    window.addEventListener('hashchange', scrollFromHash);
    return () => window.removeEventListener('hashchange', scrollFromHash);
  }, [pathname, isSatellite]);

  // ✅ Microdatos para SEO (Organization)
  const schemaOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Codiva.dev",
    "url": "https://www.codiva.dev",
    "logo": "https://www.codiva.dev/logo.svg",
    "sameAs": ["https://www.linkedin.com/company/codiva"],
    "description": t('description')
  };

  const showQuote = !isSatellite;

  return (
    <div className="bg-neutral-50 text-zinc-900 font-sans antialiased">
      {/* Microdatos JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJsonLd)}
      </script>

      <Navbar variant={variant} />
      {isCareer ? (
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-codiva-primary"
        >
          {t('career.skip_to_content')}
        </a>
      ) : null}
      {children}
      <div data-site-footer="">
        <Footer variant={variant} />
      </div>

      {showQuote && <FloatingQuoteButton />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'font-inter text-sm',
        }}
      />

      {isTicket ? null : <HuntBeacon />}

      <Analytics />
    </div>
  );
}
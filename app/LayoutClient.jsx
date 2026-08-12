'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation'; 
import { scrollToSectionCenter } from '../utils/scrollToSection';
import { Analytics } from '@vercel/analytics/react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingQuoteButton from '../components/FloatingQuoteButton';
import { Toaster } from 'react-hot-toast';

export default function LayoutClient({ children, variant = 'marketing' }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isCareer = variant === 'career';

  useEffect(() => {
    if (isCareer || pathname !== '/') return;

    const scrollFromHash = () => {
      const id = window.location.hash.replace('#', '');
      if (!id) return;
      requestAnimationFrame(() => scrollToSectionCenter(id));
    };

    scrollFromHash();
    window.addEventListener('hashchange', scrollFromHash);
    return () => window.removeEventListener('hashchange', scrollFromHash);
  }, [pathname, isCareer]);

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

  // --- Ocultar FloatingQuoteButton en /ticket
  const segments = (pathname || '').split('/').filter(Boolean);
  const onTicket = segments[segments.length - 1] === 'ticket';
  const showQuote = !isCareer && !onTicket;

  return (
    <div className="bg-neutral-50 text-zinc-900 font-sans antialiased">
      {/* Microdatos JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJsonLd)}
      </script>

      <Navbar variant={variant} />
      {children}
      <Footer />

      {showQuote && <FloatingQuoteButton />}{/* ← Condicional */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'font-inter text-sm',
        }}
      />

      <Analytics />
    </div>
  );
}
'use client';

import { useEffect } from 'react';

const COPY = {
  es: {
    title: 'Error crítico',
    body: 'La aplicación no pudo cargar. Reintenta; si persiste, contacta a hello@codiva.dev.',
    retry: 'Reintentar',
  },
  en: {
    title: 'Critical error',
    body: 'The app could not load. Retry; if it persists, contact hello@codiva.dev.',
    retry: 'Try again',
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const lang =
    typeof document !== 'undefined' && document.documentElement.lang?.startsWith('en')
      ? 'en'
      : 'es';
  const copy = COPY[lang];

  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fafafa',
          color: '#18181b',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#18181B' }}>
            Codiva<span style={{ fontWeight: 500, color: '#104E4E' }}>.dev</span>
          </p>
          <h1 style={{ marginTop: 16, fontSize: 24, fontWeight: 700 }}>{copy.title}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: '#52525b', maxWidth: 360 }}>{copy.body}</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 8,
              background: '#104E4E',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            {copy.retry}
          </button>
        </div>
      </body>
    </html>
  );
}

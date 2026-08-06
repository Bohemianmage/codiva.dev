'use client';

import { useEffect } from 'react';

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

  return (
    <html lang="es">
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
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#0d9488' }}>
            CODIVA
          </p>
          <h1 style={{ marginTop: 16, fontSize: 24, fontWeight: 700 }}>Error crítico</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: '#52525b', maxWidth: 360 }}>
            La aplicación no pudo cargar. Reintenta; si persiste, contacta a hello@codiva.dev.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 8,
              background: '#0d9488',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}

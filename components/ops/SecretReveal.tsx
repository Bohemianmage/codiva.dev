'use client';

import { useState } from 'react';

export default function SecretReveal({
  value,
  label = 'Contraseña / token',
}: {
  value: string;
  label?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-zinc-100 px-2.5 py-1.5 font-mono text-sm text-zinc-800">
          {revealed ? value : '••••••••••••'}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {revealed ? 'Ocultar' : 'Mostrar'}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

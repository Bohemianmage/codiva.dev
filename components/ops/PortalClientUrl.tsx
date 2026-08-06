'use client';

import { useState } from 'react';
import { projectPortalShortLabel, projectPortalUrl } from '@/lib/ops/host';

type Props = {
  slug: string;
  path?: string;
  className?: string;
};

export default function PortalClientUrl({ slug, path = '', className = '' }: Props) {
  const full = projectPortalUrl(slug, path);
  const short = projectPortalShortLabel(slug, path);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`inline-flex max-w-full items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 py-1 pl-2.5 pr-1 ${className}`}
    >
      <a
        href={full}
        target="_blank"
        rel="noreferrer"
        title={full}
        className="min-w-0 truncate font-mono text-xs tracking-tight text-zinc-700 hover:text-codiva-primary"
      >
        {short}
      </a>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 hover:bg-white hover:text-zinc-800"
        title={copied ? 'Copiado' : `Copiar ${full}`}
        aria-label={copied ? 'URL copiada' : 'Copiar URL del cliente'}
      >
        {copied ? 'Listo' : 'Copiar'}
      </button>
    </div>
  );
}

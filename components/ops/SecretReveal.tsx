'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SecretReveal({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const resolvedLabel = label ?? t('portal.secret.label');

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
      <p className="text-xs font-medium text-zinc-500">{resolvedLabel}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-zinc-100 px-2.5 py-1.5 font-mono text-sm text-zinc-800">
          {revealed ? value : '••••••••••••'}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {revealed ? t('portal.secret.hide') : t('portal.secret.show')}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {copied ? t('portal.secret.copied') : t('portal.secret.copy')}
        </button>
      </div>
    </div>
  );
}

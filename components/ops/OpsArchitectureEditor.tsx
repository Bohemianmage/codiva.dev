'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ToastForm from '@/components/ops/ToastForm';

const KIND_OPTIONS = [
  { value: 'architecture', labelKey: 'ops.architecture.kindArchitecture' },
  { value: 'mvp', labelKey: 'ops.architecture.kindMvp' },
  { value: 'proposal', labelKey: 'ops.architecture.kindProposal' },
] as const;

type ArchitectureEditorValues = {
  title: string;
  description: string;
  kind: string;
  sortOrder: number;
  visibleToClient: boolean;
  initialHtml: string;
  source: 'ops' | 'pack' | 'starter';
};

export default function OpsArchitectureEditor({
  action,
  values,
}: {
  action: (formData: FormData) => Promise<void>;
  values: ArchitectureEditorValues;
}) {
  const { t } = useTranslation();
  const [html, setHtml] = useState(values.initialHtml);
  const [preview, setPreview] = useState(values.initialHtml);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreview(html), 400);
    return () => window.clearTimeout(timer);
  }, [html]);

  const sourceLabel =
    values.source === 'ops'
      ? t('ops.archEditor.sourceOps')
      : values.source === 'pack'
        ? t('ops.archEditor.sourcePack')
        : t('ops.archEditor.sourceStarter');

  return (
    <ToastForm success={t('ops.archEditor.saved')} action={action} className="space-y-4">
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        {sourceLabel}
      </p>
      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
        <input
          name="title"
          required
          defaultValue={values.title}
          placeholder={t('ops.archEditor.title')}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <select
          name="kind"
          defaultValue={values.kind}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
        <input
          name="sortOrder"
          type="number"
          defaultValue={values.sortOrder}
          placeholder={t('ops.archEditor.order')}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          defaultValue={values.description}
          placeholder={t('ops.archEditor.desc')}
          rows={2}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="visibleToClient" defaultChecked={values.visibleToClient} />
          {t('ops.archEditor.visibleProposal')}
        </label>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-zinc-700">{t('ops.archEditor.html')}</label>
          <textarea
            name="bodyHtml"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            spellCheck={false}
            className="h-[min(70vh,820px)] w-full resize-y rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800"
          />
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium text-zinc-700">{t('ops.archEditor.preview')}</p>
          <iframe
            title={t('ops.archEditor.iframeTitle')}
            srcDoc={preview}
            className="h-[min(70vh,820px)] w-full rounded-xl border border-zinc-200 bg-white"
            sandbox="allow-scripts allow-same-origin allow-downloads"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
        {t('ops.archEditor.save')}
      </button>
    </ToastForm>
  );
}

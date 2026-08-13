'use client';

import { useEffect, useState } from 'react';
import ToastForm from '@/components/ops/ToastForm';

const KIND_OPTIONS = [
  { value: 'architecture', label: 'Arquitectura' },
  { value: 'mvp', label: 'MVP / alcance' },
  { value: 'proposal', label: 'Propuesta / identidad' },
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
  const [html, setHtml] = useState(values.initialHtml);
  const [preview, setPreview] = useState(values.initialHtml);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreview(html), 400);
    return () => window.clearTimeout(timer);
  }, [html]);

  const sourceLabel =
    values.source === 'ops'
      ? 'Fuente: Ops. El cliente ve este documento en Propuesta cuando está visible.'
      : values.source === 'pack'
        ? 'Aún vive en un pack estático. Al guardar, Ops pasa a ser la fuente y el cliente verá esta versión.'
        : 'Documento nuevo. Al guardar queda en Ops y puedes publicarlo al cliente.';

  return (
    <ToastForm success="Arquitectura guardada" action={action} className="space-y-4">
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        {sourceLabel}
      </p>
      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
        <input
          name="title"
          required
          defaultValue={values.title}
          placeholder="Título"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <select
          name="kind"
          defaultValue={values.kind}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          name="sortOrder"
          type="number"
          defaultValue={values.sortOrder}
          placeholder="Orden"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          defaultValue={values.description}
          placeholder="Descripción (visible en el portal)"
          rows={2}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="visibleToClient" defaultChecked={values.visibleToClient} />
          Visible al cliente en Propuesta
        </label>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-2 block text-sm font-medium text-zinc-700">HTML</label>
          <textarea
            name="bodyHtml"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            spellCheck={false}
            className="h-[min(70vh,820px)] w-full resize-y rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800"
          />
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium text-zinc-700">Vista previa</p>
          <iframe
            title="Vista previa arquitectura"
            srcDoc={preview}
            className="h-[min(70vh,820px)] w-full rounded-xl border border-zinc-200 bg-white"
            sandbox="allow-scripts allow-same-origin allow-downloads"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
        Guardar en Ops
      </button>
    </ToastForm>
  );
}

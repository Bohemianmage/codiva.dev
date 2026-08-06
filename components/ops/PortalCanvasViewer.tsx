'use client';

import { useMemo, useState } from 'react';

export type PortalCanvasItem = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  url: string | null;
  file_url: string | null;
};

const KIND_LABEL: Record<string, string> = {
  architecture: 'Arquitectura',
  mvp: 'MVP',
  proposal: 'Propuesta',
  other: 'Documento',
};

function resolveSrc(item: PortalCanvasItem): string | null {
  return item.url || item.file_url || null;
}

function isEmbeddable(src: string): boolean {
  return /\.(html?|pdf)(\?|#|$)/i.test(src) || src.includes('/client-packs/');
}

export default function PortalCanvasViewer({ items }: { items: PortalCanvasItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const active = useMemo(
    () => items.find((i) => i.id === activeId) ?? items[0],
    [activeId, items]
  );
  const src = active ? resolveSrc(active) : null;

  if (!items.length) {
    return <p className="text-sm text-zinc-500">Aún no hay arquitectura ni MVP publicados.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selected ? 'bg-codiva-primary text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {KIND_LABEL[item.kind] ?? item.kind}: {item.title}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {KIND_LABEL[active.kind] ?? 'Canvas'}
              </p>
              <h3 className="font-semibold text-zinc-900">{active.title}</h3>
              {active.description && <p className="mt-1 text-sm text-zinc-600">{active.description}</p>}
            </div>
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
              >
                Abrir en nueva pestaña
              </a>
            )}
          </div>
          {src && isEmbeddable(src) ? (
            <iframe
              title={active.title}
              src={src}
              className="h-[70vh] w-full bg-white"
            />
          ) : src ? (
            <div className="p-6 text-sm text-zinc-600">
              Este recurso no se puede previsualizar aquí.{' '}
              <a href={src} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                Abrirlo
              </a>
            </div>
          ) : (
            <div className="p-6 text-sm text-zinc-500">Sin archivo o URL asociado.</div>
          )}
        </div>
      )}
    </div>
  );
}

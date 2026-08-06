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

type CanvasTab = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  canvasSrc: string | null;
  pdfSrc: string | null;
  label: string;
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

function isHtml(src: string): boolean {
  return /\.html?(\?|#|$)/i.test(src);
}

function isPdf(src: string): boolean {
  return /\.pdf(\?|#|$)/i.test(src);
}

function isEmbeddable(src: string): boolean {
  return isHtml(src) || isPdf(src) || src.includes('/client-packs/');
}

/** Agrupa HTML (canvas) + PDF del mismo kind; prioriza vista interactiva. */
function buildTabs(items: PortalCanvasItem[]): CanvasTab[] {
  const byKind = new Map<string, PortalCanvasItem[]>();
  for (const item of items) {
    const list = byKind.get(item.kind) ?? [];
    list.push(item);
    byKind.set(item.kind, list);
  }

  const kindOrder = ['architecture', 'mvp', 'proposal', 'other'];
  const kinds = [...byKind.keys()].sort(
    (a, b) => (kindOrder.indexOf(a) + 99) - (kindOrder.indexOf(b) + 99)
  );

  const tabs: CanvasTab[] = [];
  for (const kind of kinds) {
    const group = byKind.get(kind) ?? [];
    const htmlItems = group.filter((i) => {
      const src = resolveSrc(i);
      return src && isHtml(src);
    });
    const pdfItems = group.filter((i) => {
      const src = resolveSrc(i);
      return src && isPdf(src);
    });
    const otherItems = group.filter((i) => {
      const src = resolveSrc(i);
      return src && !isHtml(src) && !isPdf(src);
    });

    if (htmlItems.length) {
      const primary = htmlItems[0];
      const pdfSrc = pdfItems[0] ? resolveSrc(pdfItems[0]) : null;
      tabs.push({
        id: primary.id,
        kind,
        title: primary.title.replace(/\s*\(PDF\)\s*/i, '').trim() || primary.title,
        description: primary.description,
        canvasSrc: resolveSrc(primary),
        pdfSrc,
        label: `${KIND_LABEL[kind] ?? kind}: Canvas`,
      });
      // PDFs sueltos del mismo kind ya van como descarga del canvas
    } else if (pdfItems.length) {
      const primary = pdfItems[0];
      tabs.push({
        id: primary.id,
        kind,
        title: primary.title,
        description: primary.description,
        canvasSrc: resolveSrc(primary),
        pdfSrc: null,
        label: `${KIND_LABEL[kind] ?? kind}: PDF`,
      });
    }

    for (const item of otherItems) {
      tabs.push({
        id: item.id,
        kind,
        title: item.title,
        description: item.description,
        canvasSrc: resolveSrc(item),
        pdfSrc: null,
        label: `${KIND_LABEL[kind] ?? kind}: ${item.title}`,
      });
    }

    // Si solo hay PDFs adicionales sin HTML (ya cubierto) o múltiples HTML
    for (const extra of htmlItems.slice(1)) {
      tabs.push({
        id: extra.id,
        kind,
        title: extra.title,
        description: extra.description,
        canvasSrc: resolveSrc(extra),
        pdfSrc: null,
        label: `${KIND_LABEL[kind] ?? kind}: ${extra.title}`,
      });
    }
  }

  return tabs;
}

export default function PortalCanvasViewer({ items }: { items: PortalCanvasItem[] }) {
  const tabs = useMemo(() => buildTabs(items), [items]);
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');
  const active = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? tabs[0],
    [activeId, tabs]
  );
  const src = active?.canvasSrc ?? null;
  const preferHtml = src ? isHtml(src) : false;

  if (!tabs.length) {
    return <p className="text-sm text-zinc-500">Aún no hay arquitectura ni MVP publicados.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selected ? 'bg-codiva-primary text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {preferHtml ? 'Canvas interactivo' : KIND_LABEL[active.kind] ?? 'Documento'}
              </p>
              <h3 className="font-semibold text-zinc-900">{active.title}</h3>
              {active.description && (
                <p className="mt-1 text-sm text-zinc-600">{active.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {active.pdfSrc && (
                <a
                  href={active.pdfSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                >
                  Descargar PDF
                </a>
              )}
              {src && (
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                >
                  Pantalla completa
                </a>
              )}
            </div>
          </div>
          {src && isEmbeddable(src) ? (
            <iframe
              title={active.title}
              src={src}
              className={`w-full bg-white ${preferHtml ? 'h-[min(85vh,920px)]' : 'h-[70vh]'}`}
              allow="fullscreen"
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

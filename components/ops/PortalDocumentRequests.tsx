'use client';

import { useMemo, useState } from 'react';
import BrandedFileInput from '@/components/ops/BrandedFileInput';
import ToastForm from '@/components/ops/ToastForm';
import {
  DOCUMENT_REQUEST_INPUT_LABELS,
  DOCUMENT_REQUEST_STATUS_LABELS,
  formatDate,
} from '@/lib/ops/labels';

export type PortalDocRequest = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  expected_type: string;
  input_mode: 'file' | 'text' | 'credentials' | string;
  status: string;
  required: boolean;
  sort_order: number;
  due_date: string | null;
  fulfilled_at: string | null;
  response_text: string | null;
  fulfilled_document_id: string | null;
};

export type PortalDocTemplate = {
  type: string;
  title: string;
  href: string;
};

type Props = {
  requests: PortalDocRequest[];
  templates?: PortalDocTemplate[];
  fulfillAction: (formData: FormData) => Promise<void>;
};

const STATUS_TONE: Record<string, string> = {
  open: 'bg-amber-50 text-amber-800 border-amber-200',
  fulfilled: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  waived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

export default function PortalDocumentRequests({
  requests,
  templates = [],
  fulfillAction,
}: Props) {
  const sorted = useMemo(
    () => [...requests].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)),
    [requests]
  );
  const templatesByType = useMemo(() => {
    const map = new Map<string, PortalDocTemplate>();
    for (const t of templates) {
      if (!map.has(t.type)) map.set(t.type, t);
    }
    return map;
  }, [templates]);
  const openCount = sorted.filter((r) => r.status === 'open').length;
  const doneCount = sorted.filter((r) => r.status === 'fulfilled').length;
  const [activeId, setActiveId] = useState(
    sorted.find((r) => r.status === 'open')?.id ?? sorted[0]?.id ?? ''
  );
  const active = sorted.find((r) => r.id === activeId) ?? sorted[0];

  if (!sorted.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
        Codiva aún no ha solicitado documentos o accesos. Cuando lo haga, aparecerán aquí como
        casillas para completar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Solicitudes de Codiva</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Cada ítem es un pedido concreto. Solo se habilita la carga cuando Codiva lo solicita.
          </p>
        </div>
        <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
          {doneCount} de {sorted.length} entregados
          {openCount ? ` · ${openCount} pendientes` : ''}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-codiva-primary transition-all"
          style={{ width: `${sorted.length ? Math.round((doneCount / sorted.length) * 100) : 0}%` }}
        />
      </div>

      <ul className="space-y-3">
        {sorted.map((req) => {
          const open = req.status === 'open';
          const selected = req.id === active?.id;
          const template = templatesByType.get(req.expected_type);
          return (
            <li
              key={req.id}
              className={`rounded-2xl border bg-white transition-shadow ${
                selected ? 'border-codiva-primary/40 shadow-sm' : 'border-zinc-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveId(req.id)}
                className="flex w-full flex-wrap items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                        req.status === 'fulfilled'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : open
                            ? 'border-amber-400 text-amber-700'
                            : 'border-zinc-300 text-zinc-400'
                      }`}
                    >
                      {req.status === 'fulfilled' ? '✓' : open ? '!' : '·'}
                    </span>
                    <p className="font-medium text-zinc-900">{req.title}</p>
                    {req.required && open && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Requerido
                      </span>
                    )}
                  </div>
                  {req.description && (
                    <p className="mt-1 pl-7 text-sm text-zinc-600">{req.description}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                    STATUS_TONE[req.status] ?? STATUS_TONE.open
                  }`}
                >
                  {DOCUMENT_REQUEST_STATUS_LABELS[req.status] ?? req.status}
                  {' · '}
                  {DOCUMENT_REQUEST_INPUT_LABELS[req.input_mode] ?? req.input_mode}
                </span>
              </button>

              {selected && (
                <div className="border-t border-zinc-100 px-4 py-4">
                  {req.instructions && (
                    <p className="mb-3 text-sm text-zinc-600">
                      <span className="font-medium text-zinc-800">Instrucciones: </span>
                      {req.instructions}
                    </p>
                  )}
                  {req.due_date && open && (
                    <p className="mb-3 text-xs text-zinc-500">Fecha objetivo: {formatDate(req.due_date)}</p>
                  )}

                  {template && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-codiva-primary/20 bg-codiva-primary/5 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-codiva-primary">
                          Borrador
                        </p>
                        <p className="truncate text-sm font-medium text-zinc-900">{template.title}</p>
                      </div>
                      <a
                        href={template.href}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
                      >
                        Descargar
                      </a>
                    </div>
                  )}

                  {open ? (
                    <ToastForm
                      action={fulfillAction}
                      success="Respuesta enviada"
                      loading="Enviando…"
                      className="space-y-3 rounded-xl bg-zinc-50 p-4"
                    >
                      <input type="hidden" name="requestId" value={req.id} />

                      {req.input_mode === 'file' && (
                        <BrandedFileInput
                          required
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.csv,.fig,.ai,.svg"
                          hint={
                            req.expected_type === 'nda'
                              ? 'PDF firmado por el representante legal'
                              : 'PDF, imagen, Office o ZIP'
                          }
                        />
                      )}

                      {req.input_mode === 'text' && (
                        <textarea
                          name="responseText"
                          required
                          rows={4}
                          placeholder="Escribe aquí la información solicitada"
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                        />
                      )}

                      {req.input_mode === 'credentials' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            name="provider"
                            placeholder="Proveedor (Vercel, Cloudflare, GoDaddy…)"
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
                          />
                          <input
                            name="domain"
                            placeholder="Dominio (ej. nirc.mx)"
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            name="panelUrl"
                            placeholder="URL del panel"
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                          />
                          <input
                            name="username"
                            placeholder="Usuario / correo del panel"
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
                          />
                          <textarea
                            name="accessNotes"
                            rows={3}
                            placeholder="Cómo acceder (invitar a hello@codiva.dev, share link de 1Password, DNS pendientes…). Evita pegar contraseñas en claro."
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
                          />
                        </div>
                      )}

                      <textarea
                        name="notes"
                        rows={2}
                        placeholder="Notas opcionales para Codiva"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
                      >
                        Enviar respuesta
                      </button>
                    </ToastForm>
                  ) : req.status === 'fulfilled' ? (
                    <div className="rounded-xl bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                      <p className="font-medium">
                        Entregado{req.fulfilled_at ? ` · ${formatDate(req.fulfilled_at)}` : ''}
                      </p>
                      {req.response_text && (
                        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-xs text-zinc-700">
                          {req.response_text}
                        </pre>
                      )}
                      {req.fulfilled_document_id && (
                        <p className="mt-2 text-xs text-emerald-800">Archivo recibido y registrado.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Esta solicitud fue marcada como{' '}
                      {(DOCUMENT_REQUEST_STATUS_LABELS[req.status] ?? req.status).toLowerCase()}.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

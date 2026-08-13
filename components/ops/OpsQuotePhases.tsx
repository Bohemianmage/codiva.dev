'use client';

import { useMemo, useState } from 'react';
import type { QuotePhase } from '@/lib/ops/quote-document';

const EMPTY_PHASE: QuotePhase = { name: '', weeks: '', deliverable: '' };

export default function OpsQuotePhases({
  name = 'phases',
  initialPhases,
}: {
  name?: string;
  initialPhases: QuotePhase[];
}) {
  const [phases, setPhases] = useState<QuotePhase[]>(initialPhases.length ? initialPhases : []);

  const serialized = useMemo(
    () =>
      JSON.stringify(
        phases
          .map((phase) => ({
            name: (phase.name ?? '').trim(),
            weeks: (phase.weeks ?? '').trim(),
            deliverable: (phase.deliverable ?? '').trim(),
          }))
          .filter((phase) => phase.name || phase.deliverable)
      ),
    [phases]
  );

  function update(index: number, patch: Partial<QuotePhase>) {
    setPhases((current) => current.map((phase, i) => (i === index ? { ...phase, ...patch } : phase)));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-800">Plan de entregas (opcional)</p>
        <button
          type="button"
          className="text-sm font-medium text-codiva-primary hover:underline"
          onClick={() => setPhases((current) => [...current, { ...EMPTY_PHASE }])}
        >
          Agregar fase
        </button>
      </div>
      {phases.length === 0 && (
        <p className="text-sm text-zinc-500">Si el proyecto va por fases, agrégalas aquí. Salen en el documento.</p>
      )}
      <ul className="space-y-3">
        {phases.map((phase, index) => (
          <li key={index} className="grid gap-2 rounded-xl border border-zinc-200 p-3 md:grid-cols-[1fr_8rem_auto]">
            <input
              value={phase.name ?? ''}
              onChange={(event) => update(index, { name: event.target.value })}
              placeholder="Fase"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              value={phase.weeks ?? ''}
              onChange={(event) => update(index, { weeks: event.target.value })}
              placeholder="Semanas"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="text-sm text-zinc-500 hover:text-red-700"
              onClick={() => setPhases((current) => current.filter((_, i) => i !== index))}
            >
              Quitar
            </button>
            <textarea
              value={phase.deliverable ?? ''}
              onChange={(event) => update(index, { deliverable: event.target.value })}
              placeholder="Entregable de la fase"
              rows={2}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-3"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

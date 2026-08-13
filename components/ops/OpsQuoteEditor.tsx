import ToastForm from '@/components/ops/ToastForm';
import OpsQuoteLineItems from '@/components/ops/OpsQuoteLineItems';
import OpsQuotePhases from '@/components/ops/OpsQuotePhases';
import { DEFAULT_PROJECT_STATE } from '@/lib/ops/labels';
import type { QuoteLineItem, QuotePhase } from '@/lib/ops/quote-document';

const SERVICE_TYPES = ['PWA', 'Web', 'App', 'Platform', 'E-Shop', 'LMS', 'Pentesting'];

export default function OpsQuoteEditor({
  action,
  submitLabel = 'Guardar en Ops',
  values,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  values: {
    title: string;
    serviceType: string;
    projectState: string;
    scope: string;
    deliverables: string;
    considerations: string;
    optionalExtras: string;
    lineItems: QuoteLineItem[];
    phases: QuotePhase[];
    totalAmount: number | null;
    currency: string;
    validUntil: string | null;
    status?: string;
  };
}) {
  return (
    <ToastForm success="Cotización guardada" action={action} className="space-y-4">
      {values.status && values.status !== 'draft' && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Esta cotización ya está {values.status === 'accepted' ? 'aceptada' : 'enviada'}. Los cambios
          actualizan el documento que ve el cliente.
        </p>
      )}
      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
        <input
          name="title"
          required
          defaultValue={values.title}
          placeholder="Título"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <select
          name="serviceType"
          defaultValue={values.serviceType || 'Web'}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          name="projectState"
          defaultValue={values.projectState || DEFAULT_PROJECT_STATE}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <textarea
          name="scope"
          defaultValue={values.scope}
          placeholder="Alcance del servicio"
          rows={5}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <textarea
          name="deliverables"
          defaultValue={values.deliverables}
          placeholder="Entregables (uno por línea, puedes usar •)"
          rows={4}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <textarea
          name="considerations"
          defaultValue={values.considerations}
          placeholder="Consideraciones"
          rows={3}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <textarea
          name="optionalExtras"
          defaultValue={values.optionalExtras}
          placeholder="Extras opcionales (no incluidos)"
          rows={3}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <div className="md:col-span-2">
          <OpsQuoteLineItems initialItems={values.lineItems} />
        </div>
        <div className="md:col-span-2">
          <OpsQuotePhases initialPhases={values.phases} />
        </div>
        <input
          name="totalAmount"
          type="number"
          step="0.01"
          defaultValue={values.totalAmount ?? ''}
          placeholder="Monto total"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <select
          name="currency"
          defaultValue={values.currency || 'MXN'}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="MXN">MXN</option>
          <option value="USD">USD</option>
        </select>
        <input
          name="validUntil"
          type="date"
          defaultValue={values.validUntil ?? ''}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
        {submitLabel}
      </button>
    </ToastForm>
  );
}

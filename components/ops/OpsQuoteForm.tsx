import { DEFAULT_PROJECT_STATE } from '@/lib/ops/labels';

export const DEFAULT_QUOTE_LINE_ITEMS = JSON.stringify(
  [
    {
      title: 'Desarrollo Frontend',
      detail: 'ReactJS, TailwindCSS',
      hours: 96,
      rate: 450,
      rateLabel: 'MXN/hora',
      total: 43200,
    },
  ],
  null,
  2
);

type OpsQuoteFormProps = {
  action: (formData: FormData) => Promise<void>;
  title: string;
  heading?: string;
  defaultTitle?: string;
  submitLabel?: string;
};

export default function OpsQuoteForm({
  action,
  title,
  heading,
  defaultTitle = 'Propuesta comercial',
  submitLabel = 'Crear borrador',
}: OpsQuoteFormProps) {
  return (
    <form action={action} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="font-semibold">{heading || title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="title"
          defaultValue={defaultTitle}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
        />
        <select name="serviceType" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="PWA">PWA</option>
          <option value="Web">Web</option>
          <option value="App">App</option>
          <option value="E-Shop">E-Shop</option>
          <option value="LMS">LMS</option>
          <option value="Pentesting">Pentesting</option>
        </select>
        <input
          name="projectState"
          defaultValue={DEFAULT_PROJECT_STATE}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        name="scope"
        placeholder="Alcance del servicio"
        rows={5}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        name="deliverables"
        placeholder="Entregables (uno por línea, puedes usar •)"
        rows={4}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        name="considerations"
        placeholder="Consideraciones"
        rows={3}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        name="optionalExtras"
        placeholder="Extras opcionales (no incluidos)"
        rows={3}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Módulos / estimación (JSON)</label>
        <textarea
          name="lineItems"
          defaultValue={DEFAULT_QUOTE_LINE_ITEMS}
          rows={6}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="totalAmount"
          type="number"
          step="0.01"
          placeholder="Monto total"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <select name="currency" defaultValue="MXN" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="MXN">MXN</option>
          <option value="USD">USD</option>
        </select>
        <input name="validUntil" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
        {submitLabel}
      </button>
    </form>
  );
}

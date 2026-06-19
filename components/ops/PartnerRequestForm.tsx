'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PartnerRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/partner-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar la solicitud.');
        return;
      }
      setSubmitted(true);
      form.reset();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">Solicitud recibida</h2>
        <p className="mt-2 text-sm text-emerald-800">
          Revisaremos tu solicitud y te contactaremos con una propuesta comercial.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-medium text-codiva-primary hover:underline"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-codiva-primary">
          Tus datos (intermediario)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nombre *</span>
            <input name="partnerName" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email *</span>
            <input name="partnerEmail" type="email" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Empresa / agencia *</span>
            <input name="partnerCompany" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Teléfono</span>
            <input name="phone" type="tel" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Cliente final (opcional)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nombre</span>
            <input name="endClientName" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Empresa</span>
            <input name="endClientCompany" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Proyecto a cotizar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo de solución</span>
            <select name="serviceType" className="w-full rounded-lg border border-zinc-300 px-3 py-2">
              <option value="Web">Sitio web</option>
              <option value="PWA">PWA / app web</option>
              <option value="App">Aplicación móvil</option>
              <option value="E-Shop">E-commerce</option>
              <option value="LMS">LMS / plataforma</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Entrega deseada</span>
            <input name="deliveryDate" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Alcance / necesidad *</span>
            <textarea
              name="need"
              required
              rows={5}
              placeholder="Describe qué necesita el cliente, funcionalidades clave, integraciones…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Presupuesto referencia (MXN)</span>
            <input name="budget" type="number" step="0.01" min="0" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Sitio de referencia</span>
            <input name="referenceSite" type="url" placeholder="https://" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-zinc-500">
          Al enviar aceptas que Codiva te contacte sobre esta solicitud.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-codiva-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Enviando…' : 'Solicitar cotización'}
        </button>
      </div>

      <p className="text-center text-sm text-zinc-500">
        ¿Eres cliente directo?{' '}
        <Link href="https://codiva.dev/cotiza" className="text-codiva-primary hover:underline">
          Cotiza en codiva.dev
        </Link>
      </p>
    </form>
  );
}

import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireAdminStaff } from '@/lib/ops/auth';
import { updatePersonnelOffer, updatePersonnelOfferStatus } from '@/lib/ops/actions';
import {
  OFFER_STATUS_LABELS,
  renderOfferLetterHtml,
  rowToOfferLetterData,
} from '@/lib/ops/offer-letter';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function TeamOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminStaff();

  const { data: offer } = await supabase
    .from('ops_personnel_offers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!offer) notFound();

  const html = renderOfferLetterHtml(rowToOfferLetterData(offer));

  async function onUpdate(formData: FormData) {
    'use server';
    await updatePersonnelOffer(id, formData);
  }

  async function onStatus(formData: FormData) {
    'use server';
    await updatePersonnelOfferStatus(id, formData);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <OpsPageHeader
        title={offer.full_name}
        description={`${offer.position_title} · ${OFFER_STATUS_LABELS[offer.status] ?? offer.status}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/ops/alta-personal/${id}/carta?format=pdf`}
              className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-medium text-white hover:bg-codiva-primary-dark"
            >
              Descargar PDF
            </a>
            <a
              href={`/api/ops/alta-personal/${id}/carta`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Abrir HTML
            </a>
            <Link
              href="/team?tab=ofertas"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Volver a Equipo
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <ToastForm
            success="Oferta actualizada"
            action={onUpdate}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold">Datos de la oferta</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="fullName"
                required
                defaultValue={offer.full_name}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="email"
                type="email"
                defaultValue={offer.email ?? ''}
                placeholder="correo@ejemplo.com"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="positionTitle"
                required
                defaultValue={offer.position_title}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select
                name="opsRole"
                defaultValue={offer.ops_role}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="pm">Project Manager</option>
                <option value="dev">Desarrollador</option>
                <option value="admin">Administrador</option>
              </select>
              <input
                name="monthlyCompensation"
                type="number"
                required
                min={1}
                step="0.01"
                defaultValue={Number(offer.monthly_compensation)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select
                name="currency"
                defaultValue={offer.currency || 'USD'}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </select>
              <select
                name="workModality"
                defaultValue={offer.work_modality}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
              <select
                name="status"
                defaultValue={offer.status}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="text-sm text-zinc-600">
                Inicio
                <input
                  name="startDate"
                  type="date"
                  defaultValue={offer.start_date ?? ''}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600">
                Vigencia
                <input
                  name="validUntil"
                  type="date"
                  defaultValue={offer.valid_until ?? ''}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Emisión
                <input
                  name="issuedAt"
                  type="date"
                  defaultValue={offer.issued_at ?? ''}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Responsabilidades
                <textarea
                  name="responsibilities"
                  rows={5}
                  defaultValue={offer.responsibilities ?? ''}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Condiciones
                <textarea
                  name="terms"
                  rows={4}
                  defaultValue={offer.terms ?? ''}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Notas internas
                <textarea
                  name="notesInternal"
                  rows={2}
                  defaultValue={offer.notes_internal ?? ''}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
              Guardar cambios
            </button>
          </ToastForm>

          <ToastForm
            success="Estado actualizado"
            action={onStatus}
            className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-4"
          >
            <label className="text-sm text-zinc-600">
              Cambio rápido de estado
              <select
                name="status"
                defaultValue={offer.status}
                className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
              Actualizar estado
            </button>
          </ToastForm>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          <iframe title="Vista previa carta oferta" srcDoc={html} className="h-[min(80vh,900px)] w-full bg-white" />
        </div>
      </div>
    </div>
  );
}

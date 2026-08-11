import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import { redirect } from 'next/navigation';
import { requirePortalAccess } from '@/lib/ops/auth';
import { acceptPortalLegalDocuments } from '@/lib/ops/actions';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { LEGAL_DOCS_VERSION, LEGAL_UPDATED_LABEL } from '@/lib/ops/legal/version';

export default async function PortalAcceptLegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await requirePortalAccess(slug);

  if (access.isStaffPreview) {
    redirect(`/p/${slug}`);
  }

  const status = getAcceptanceStatus(access.membership);
  if (status.complete) {
    redirect(`/p/${slug}`);
  }

  async function onAccept(formData: FormData) {
    'use server';
    await acceptPortalLegalDocuments(slug, formData);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Portal del proyecto</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{access.project.name}</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Antes de entrar, acepta los documentos legales vigentes
          (versión {LEGAL_DOCS_VERSION} · {LEGAL_UPDATED_LABEL}). La aceptación aplica a{' '}
          <strong>todos tus proyectos</strong> en el portal.
        </p>

        <ToastForm success="Aceptado" action={onAccept} className="mt-8 space-y-4">
          <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
            <input type="checkbox" name="acceptTerms" required className="mt-1" />
            <span>
              He leído y acepto los{' '}
              <Link href="/legal/terminos" target="_blank" className="font-medium text-codiva-primary hover:underline">
                Términos y Condiciones
              </Link>
              {!status.terms ? '' : ' (ya aceptados)'}
            </span>
          </label>

          <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
            <input type="checkbox" name="acceptPrivacy" required className="mt-1" />
            <span>
              He leído y acepto el{' '}
              <Link
                href="/legal/aviso-privacidad"
                target="_blank"
                className="font-medium text-codiva-primary hover:underline"
              >
                Aviso de Privacidad
              </Link>
            </span>
          </label>

          <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
            <input type="checkbox" name="acceptNda" required className="mt-1" />
            <span>
              He leído y acepto el{' '}
              <Link href="/legal/nda" target="_blank" className="font-medium text-codiva-primary hover:underline">
                Acuerdo de Confidencialidad (NDA)
              </Link>{' '}
              aplicable a este proyecto
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-codiva-primary px-4 py-3 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
          >
            Aceptar y continuar al portal
          </button>
        </ToastForm>

        <p className="mt-6 text-xs text-zinc-500">
          Si representas a tu empresa, confirmas tener facultades para vincularla respecto de
          estos documentos en el alcance del Portal.
        </p>
      </div>
    </div>
  );
}

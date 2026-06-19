import PartnerRequestForm from '@/components/ops/PartnerRequestForm';
import { marketingBaseUrl } from '@/lib/ops/host';

export const metadata = {
  title: 'Solicitar cotización — Partners Codiva',
  robots: { index: false, follow: false },
};

export default function PartnerRequestPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-codiva-primary">Codiva Partners</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">Solicitar cotización comercial</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Para agencias, consultores e intermediarios que necesitan una propuesta de Codiva para su cliente.
          </p>
        </header>

        <PartnerRequestForm />

        <footer className="mt-10 text-center text-xs text-zinc-500">
          <a href={marketingBaseUrl()} className="text-codiva-primary hover:underline">
            codiva.dev
          </a>
        </footer>
      </div>
    </div>
  );
}

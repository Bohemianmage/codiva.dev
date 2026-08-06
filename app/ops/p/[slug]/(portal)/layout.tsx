import PortalNav from '@/components/ops/PortalNav';
import StaffPortalPreviewBanner from '@/components/ops/StaffPortalPreviewBanner';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { getPortalVisibility } from '@/lib/ops/portal-visibility';
import Link from 'next/link';

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await requirePortalMemberWithAcceptances(slug);
  const { project, isStaffPreview } = access;
  const visibility = getPortalVisibility(project);

  return (
    <div className="min-h-screen bg-zinc-50">
      {isStaffPreview && (
        <StaffPortalPreviewBanner projectName={project.name} projectId={project.id} />
      )}
      <PortalNav slug={slug} projectName={project.name} visibility={visibility} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
        <p>Proyecto impulsado por Codiva</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/legal/terminos" className="hover:text-codiva-primary hover:underline">
            Términos
          </Link>
          <Link href="/legal/aviso-privacidad" className="hover:text-codiva-primary hover:underline">
            Aviso de privacidad
          </Link>
          <Link href="/legal/nda" className="hover:text-codiva-primary hover:underline">
            NDA
          </Link>
        </p>
      </footer>
    </div>
  );
}

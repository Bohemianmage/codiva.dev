import PortalNav from '@/components/ops/PortalNav';
import { requireProjectMember } from '@/lib/ops/auth';

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project } = await requireProjectMember(slug);

  return (
    <div className="min-h-screen bg-zinc-50">
      <PortalNav slug={slug} projectName={project.name} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500">
        Proyecto impulsado por Codiva
      </footer>
    </div>
  );
}

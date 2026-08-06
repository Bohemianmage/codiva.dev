import Link from 'next/link';

export default function StaffPortalPreviewBanner({
  projectName,
  projectId,
}: {
  projectName: string;
  projectId: string;
}) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-semibold">Vista previa staff</span>
          {' · '}
          Así ve el cliente el portal de <span className="font-medium">{projectName}</span>.
          No se registran aceptaciones legales en este modo.
        </p>
        <Link href={`/projects/${projectId}`} className="font-medium underline underline-offset-2 hover:no-underline">
          Volver al proyecto
        </Link>
      </div>
    </div>
  );
}

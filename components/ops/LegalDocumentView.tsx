import type { LegalDocument } from '@/lib/ops/legal/content';

export default function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3 border-b border-zinc-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Codiva.dev</p>
        <h1 className="text-2xl font-bold text-zinc-900">{doc.title}</h1>
        <p className="text-sm text-zinc-500">
          Versión {doc.versionCode} · Actualizado {doc.updated}
        </p>
        <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
          {doc.intro.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
        {doc.introLegalNote && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">{doc.introLegalNote}</p>
        )}
      </header>

      <div className="space-y-6">
        {doc.sections.map((section) => (
          <section key={section.id} className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">{section.title}</h2>
            {section.lead && <p className="text-sm text-zinc-700">{section.lead}</p>}
            {section.body && <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{section.body}</p>}
            {section.groups?.map((group) => (
              <div key={group.title} className="mt-3">
                <p className="text-sm font-medium text-zinc-800">{group.title}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            {section.items && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.closing && <p className="text-sm text-zinc-700">{section.closing}</p>}
            {section.legalNote && (
              <p className="text-xs text-zinc-500">Fundamento: {section.legalNote}</p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

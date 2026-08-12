import type { CareerPostingSection } from '@/lib/ops/careers';
import { careerSectionTitle } from '@/lib/ops/careers';
import type { Locale } from '@/i18n/config';

export default function CareerPostingBody({
  sections,
  fallbackTitle,
  locale,
}: {
  sections: CareerPostingSection[];
  fallbackTitle: string;
  locale: Locale;
}) {
  if (!sections.length) return null;

  const rendered =
    sections.length === 1 && !sections[0].title
      ? [{ title: fallbackTitle, blocks: sections[0].blocks }]
      : sections.map((section) => ({
          title: careerSectionTitle(section.title || fallbackTitle, locale),
          blocks: section.blocks,
        }));

  return (
    <div className="space-y-4">
      {rendered.map((section, i) => (
        <section
          key={`${section.title}-${i}`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {section.title ? (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-codiva-primary">
              {section.title}
            </h2>
          ) : null}
          <div className="space-y-3">
            {section.blocks.map((block, j) =>
              block.type === 'list' ? (
                <ul key={j} className="space-y-2">
                  {block.items.map((item, k) => (
                    <li
                      key={k}
                      className="flex gap-2.5 text-sm leading-relaxed text-zinc-700 sm:text-[15px]"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-codiva-primary"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  key={j}
                  className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 sm:text-[15px]"
                >
                  {block.text}
                </p>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

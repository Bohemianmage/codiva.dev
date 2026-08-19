import type { ReactNode } from 'react';

export default function HintTooltip({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <span className="group/tip relative z-10 inline-flex max-w-full hover:z-50 focus-within:z-50">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+4px)] left-0 z-50 hidden w-max max-w-[16rem] rounded-md bg-zinc-900 px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-white group-hover/tip:block group-focus-within/tip:block"
      >
        {hint}
      </span>
    </span>
  );
}

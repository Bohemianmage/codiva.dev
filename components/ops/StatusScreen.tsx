import Link from 'next/link';
import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type StatusScreenProps = {
  eyebrow: ReactNode;
  code?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

/** Pantalla de estado compartida (404 / error). */
export default function StatusScreen({
  eyebrow,
  code,
  title,
  description,
  actions,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: StatusScreenProps) {
  return (
    <div
      className={cn(
        'flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      <div className="flex justify-center">{eyebrow}</div>
      {code ? (
        <p className="mt-4 font-display text-6xl font-bold tracking-tight text-zinc-200 sm:text-7xl">
          {code}
        </p>
      ) : null}
      <h1 className="mt-4 max-w-md text-2xl font-bold text-zinc-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {actions ?? (
          <>
            {primaryHref && primaryLabel ? (
              <Button as={Link} href={primaryHref} size="sm">
                {primaryLabel}
              </Button>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <Button as={Link} href={secondaryHref} variant="secondary" size="sm">
                {secondaryLabel}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

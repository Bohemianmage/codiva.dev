import { cn } from '@/lib/cn';
import Link from 'next/link';
import type { ReactNode } from 'react';

type TabVariant = 'underline' | 'pills';

export function Tabs({
  variant = 'underline',
  children,
  className,
}: {
  variant?: TabVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        variant === 'underline' ? 'mb-8 flex gap-6 border-b border-zinc-200' : 'mb-6 flex flex-wrap gap-2',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabLink({
  href,
  active,
  variant = 'underline',
  children,
}: {
  href: string;
  active: boolean;
  variant?: TabVariant;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        variant === 'pills'
          ? cn(
              'rounded-full px-3 py-1 text-xs no-underline',
              active
                ? 'bg-codiva-primary font-semibold text-white hover:text-white'
                : 'border border-zinc-300 font-medium text-zinc-600 hover:bg-zinc-50 hover:no-underline'
            )
          : cn(
              'border-b-2 px-1 pb-2 text-sm no-underline',
              active
                ? 'border-codiva-primary font-semibold text-codiva-primary hover:no-underline'
                : 'border-transparent font-medium text-zinc-500 hover:text-zinc-800 hover:no-underline'
            )
      }
    >
      {children}
    </Link>
  );
}

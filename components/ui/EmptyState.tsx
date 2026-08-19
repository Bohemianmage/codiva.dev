import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export default function EmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn('text-sm text-zinc-500', className)}>{children}</p>;
}

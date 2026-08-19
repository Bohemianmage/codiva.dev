'use client';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export default function AuthCard({
  title,
  subtitle,
  message,
  messageTone = 'error',
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  message?: string | null;
  messageTone?: 'error' | 'success';
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card variant="raised" padding="lg" className="w-full max-w-md">
        <div className="flex items-start justify-between gap-3">
          <CodivaWordmarkMark size="sm" />
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
        {message ? (
          <p
            className={cn(
              'mt-4 rounded-lg px-3 py-2 text-sm',
              messageTone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            )}
          >
            {message}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-zinc-600">{footer}</div> : null}
      </Card>
    </div>
  );
}

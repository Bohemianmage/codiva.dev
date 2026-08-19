import { cn } from '@/lib/cn';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

const variants = {
  primary: 'bg-codiva-primary text-white hover:bg-codiva-primary-dark',
  secondary: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
  ghost: 'text-codiva-primary hover:bg-codiva-primary/10',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  dangerSolid: 'bg-red-700 text-white hover:bg-red-800',
};

const sizes = {
  xs: 'px-3 py-1.5 text-sm',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-3.5 text-base',
};

type ButtonProps<T extends ElementType = 'button'> = {
  as?: T;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export default function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps<T>) {
  const Tag = (as ?? 'button') as ElementType;
  return (
    <Tag
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium no-underline transition hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codiva-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

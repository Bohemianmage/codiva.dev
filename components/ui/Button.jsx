import clsx from 'clsx';

const variants = {
  primary: 'bg-codiva-primary text-white hover:bg-codiva-primary-dark',
  secondary: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
  ghost: 'text-codiva-primary hover:bg-codiva-primary/10',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-codiva-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none',
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

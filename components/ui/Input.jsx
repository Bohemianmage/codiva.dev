import clsx from 'clsx';

export default function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none transition focus:border-codiva-primary focus:ring-2 focus:ring-codiva-primary/20',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={clsx(
        'w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none transition focus:border-codiva-primary focus:ring-2 focus:ring-codiva-primary/20',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none transition focus:border-codiva-primary focus:ring-2 focus:ring-codiva-primary/20',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

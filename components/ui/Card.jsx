import clsx from 'clsx';

export default function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={clsx(
        'rounded-2xl border border-zinc-200 bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

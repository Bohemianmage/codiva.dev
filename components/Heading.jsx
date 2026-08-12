import React from 'react';
import clsx from 'clsx';

/**
 * Reusable Heading component
 * Applies font-display and allows flexibility in tag, size and className
 *
 * @param {{ as?: string, size?: string, className?: string, children?: import('react').ReactNode }} props
 */
export default function Heading({
  as = 'h1',
  size = 'text-4xl md:text-5xl',
  className = '',
  children,
}) {
  const Tag = as;
  return (
    <Tag
      className={clsx(
        'font-display font-bold tracking-tight leading-tight',
        size,
        className
      )}
    >
      {children}
    </Tag>
  );
}
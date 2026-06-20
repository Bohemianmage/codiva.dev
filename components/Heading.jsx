import React from 'react';
import clsx from 'clsx';

/**
 * Reusable Heading component
 * Applies font-display and allows flexibility in tag, size and className
 *
 * @param {string} as - HTML tag to render (default h1)
 * @param {string} size - tailwind text size class (e.g. "text-4xl")
 * @param {string} className - optional tailwind classes to append
 * @param {React.ReactNode} children - content inside heading
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
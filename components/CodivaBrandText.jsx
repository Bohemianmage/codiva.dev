import { Fragment } from 'react';
import CodivaWordmarkMark from './CodivaWordmarkMark';

const MARK = 'Codiva.dev';

/**
 * Pinta cada "Codiva.dev" de un texto con el wordmark oficial.
 */
export default function CodivaBrandText({ children, className = '' }) {
  const text = typeof children === 'string' ? children : null;
  if (text == null || !text.includes(MARK)) return children;

  const parts = text.split(MARK);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 ? (
        <CodivaWordmarkMark size="inline" variant="inline" className={className} />
      ) : null}
      {part}
    </Fragment>
  ));
}

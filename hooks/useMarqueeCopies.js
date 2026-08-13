import { useState, useRef, useLayoutEffect, useMemo } from 'react';

const MIN_COPIES = 2;
const MAX_COPIES = 24;

/**
 * Calcula cuántas veces repetir la lista para que el carrusel infinito
 * tenga material suficiente (≥ ~2× ancho del viewport respecto a una vuelta).
 * Evita el patrón fijo de “solo dos copias” cuando hay pocos ítems o viewport ancho.
 */
export default function useMarqueeCopies(items, measureGapClassName) {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [copyCount, setCopyCount] = useState(MIN_COPIES);

  useLayoutEffect(() => {
    if (!items?.length) {
      setCopyCount(MIN_COPIES);
      return;
    }

    const recompute = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;

      const cw = container.clientWidth;
      const sw = measure.scrollWidth;
      if (cw <= 0 || sw <= 0) return;

      const needed = Math.ceil((cw * 2) / sw);
      const n = Math.min(MAX_COPIES, Math.max(MIN_COPIES, needed));
      setCopyCount((prev) => (prev === n ? prev : n));
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    if (measureRef.current) ro.observe(measureRef.current);
    window.addEventListener('resize', recompute);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [items, measureGapClassName]);

  const flatWithKeys = useMemo(() => {
    if (!items?.length) return [];
    return Array.from({ length: copyCount }, (_, copyIdx) =>
      items.map((item, j) => ({
        item,
        copyIdx,
        key: `m-${copyIdx}-${j}-${typeof item === 'object' && item?.name ? item.name : String(item)}`,
      }))
    ).flat();
  }, [items, copyCount]);

  const marqueeStyle = {
    '--marquee-copies': String(copyCount),
  };

  return {
    containerRef,
    measureRef,
    copyCount,
    flatWithKeys,
    marqueeStyle,
  };
}

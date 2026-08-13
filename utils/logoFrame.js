/**
 * Logos muy horizontales se ven pequeños dentro de un cuadrado (object-contain).
 * `logoFrame: 'landscape'` usa una caja más ancha; el resto sigue en cuadrado.
 */
export const LOGO_FRAME = {
  square: { width: 108, height: 108 },
  /** Caben marcas tipo wordmark / lockup ancho */
  landscape: { width: 220, height: 110 },
};

export function getLogoFrame(meta) {
  return meta?.logoFrame === 'landscape' ? LOGO_FRAME.landscape : LOGO_FRAME.square;
}

export function isWideLogo(meta) {
  const frame = getLogoFrame(meta);
  return frame.width > frame.height;
}

/** Distancia centro → borde aproximada para líneas del grafo (media del rectángulo circunscrito). */
export function getLogoLineOffset(frame) {
  return Math.max(frame.width, frame.height) / 2;
}

/**
 * Decorative brand pattern derived from logo geometry.
 * Use as a subtle section background overlay.
 */
export default function BrandPattern({ className = '' }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="codiva-chevron" width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M8 40 L24 8 L40 40"
            fill="none"
            stroke="#104E4E"
            strokeWidth="1"
            strokeOpacity="0.07"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#codiva-chevron)" />
    </svg>
  );
}

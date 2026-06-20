/**
 * Scrolls so the section is vertically centered in the viewport.
 */
export function scrollToSectionCenter(id, behavior = 'smooth') {
  const el = document.getElementById(id);
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const top = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });
}

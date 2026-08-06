export type PortalVisibility = {
  showQuote: boolean;
  showCosts: boolean;
};

/** Defaults: todo visible (proyectos legacy). */
export function getPortalVisibility(project: {
  portal_show_quote?: boolean | null;
  portal_show_costs?: boolean | null;
}): PortalVisibility {
  return {
    showQuote: project.portal_show_quote !== false,
    showCosts: project.portal_show_costs !== false,
  };
}

/** Kinds de canvas que exponen precios / unit economics. */
export const COST_DELIVERABLE_KINDS = ['mvp', 'proposal'] as const;

export function filterClientCanvases<T extends { kind: string }>(
  items: T[],
  visibility: PortalVisibility
): T[] {
  if (visibility.showCosts) return items;
  return items.filter(
    (item) => !(COST_DELIVERABLE_KINDS as readonly string[]).includes(item.kind)
  );
}

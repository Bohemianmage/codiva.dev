export function isHuntDiscarded(row: { review_status?: string | null }): boolean {
  return row.review_status === 'discarded';
}

export function splitHuntReports<T extends { review_status?: string | null }>(rows: T[]): {
  active: T[];
  discarded: T[];
} {
  const active: T[] = [];
  const discarded: T[] = [];
  for (const row of rows) {
    if (isHuntDiscarded(row)) discarded.push(row);
    else active.push(row);
  }
  return { active, discarded };
}

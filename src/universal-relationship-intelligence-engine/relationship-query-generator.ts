/**
 * Universal Relationship Intelligence Engine V1 — related query helpers.
 */

export function generateRelationshipQueryHelpersSource(): string {
  return `/** Universal relationship query helpers */
export function filterByRelatedPresence<T extends { id: string }>(
  records: T[],
  relatedIds: Set<string>,
  mode: 'present' | 'missing',
): T[] {
  return records.filter((record) => (mode === 'present' ? relatedIds.has(record.id) : !relatedIds.has(record.id)));
}

export function filterByRelatedCount<T>(
  records: T[],
  countOf: (record: T) => number,
  minimum: number,
): T[] {
  return records.filter((record) => countOf(record) >= minimum);
}
`;
}

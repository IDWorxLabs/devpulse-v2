/**
 * Universal Relationship Intelligence Engine V1 — hierarchy helpers.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';

export function isHierarchyRelationship(descriptor: UniversalRelationshipDescriptor): boolean {
  return descriptor.cardinality === 'PARENT_CHILD' || descriptor.cardinality === 'SELF_REFERENTIAL';
}

export function hierarchyCycleGuardSource(): string {
  return `export function wouldCreateHierarchyCycle(
  nodeId: string,
  proposedParentId: string,
  parentOf: (id: string) => string | null,
): boolean {
  if (nodeId === proposedParentId) return true;
  let cursor: string | null = proposedParentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === nodeId) return true;
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = parentOf(cursor);
  }
  return false;
}
`;
}

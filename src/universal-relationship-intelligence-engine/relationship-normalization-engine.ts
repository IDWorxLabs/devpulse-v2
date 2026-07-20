/**
 * Universal Relationship Intelligence Engine V1 — relationship normalization.
 */

import type {
  RawApprovedRelationship,
  UniversalRelationshipCardinality,
  UniversalRelationshipOwnership,
} from './universal-relationship-types.js';

export interface NormalizedApprovedRelationship {
  readonly label: string;
  readonly sourceEntityLabel: string;
  readonly targetEntityLabel: string;
  readonly cardinality: UniversalRelationshipCardinality;
  readonly inverseCardinality: UniversalRelationshipCardinality;
  readonly ownership: UniversalRelationshipOwnership;
  readonly sourceOptional: boolean;
  readonly targetOptional: boolean;
  readonly ordered: boolean;
  readonly sourceEnvelopePath: string;
}

export function normalizeApprovedRelationship(raw: RawApprovedRelationship): NormalizedApprovedRelationship {
  const cardinality = raw.cardinalityHint;
  return {
    label: raw.label,
    sourceEntityLabel: raw.sourceEntityLabel,
    targetEntityLabel: raw.targetEntityLabel,
    cardinality,
    inverseCardinality: inverseCardinality(cardinality),
    ownership: inferOwnership(cardinality),
    sourceOptional: raw.sourceOptional,
    targetOptional: raw.targetOptional,
    ordered: raw.ordered,
    sourceEnvelopePath: raw.sourceEnvelopePath,
  };
}

export function normalizeApprovedRelationships(
  raw: readonly RawApprovedRelationship[],
): NormalizedApprovedRelationship[] {
  return raw.map(normalizeApprovedRelationship);
}

function inverseCardinality(cardinality: UniversalRelationshipCardinality): UniversalRelationshipCardinality {
  switch (cardinality) {
    case 'ONE_TO_MANY':
      return 'MANY_TO_ONE';
    case 'MANY_TO_ONE':
      return 'ONE_TO_MANY';
    case 'ONE_TO_ONE':
      return 'ONE_TO_ONE';
    case 'MANY_TO_MANY':
      return 'MANY_TO_MANY';
    case 'PARENT_CHILD':
      return 'PARENT_CHILD';
    case 'SELF_REFERENTIAL':
      return 'SELF_REFERENTIAL';
    default:
      return cardinality;
  }
}

function inferOwnership(cardinality: UniversalRelationshipCardinality): UniversalRelationshipOwnership {
  if (cardinality === 'PARENT_CHILD') return 'COMPOSITION';
  if (cardinality === 'ONE_TO_MANY') return 'SOURCE_OWNS_TARGET';
  if (cardinality === 'MANY_TO_ONE') return 'TARGET_OWNS_SOURCE';
  if (cardinality === 'ONE_TO_ONE') return 'SHARED_OWNERSHIP';
  if (cardinality === 'MANY_TO_MANY') return 'INDEPENDENT_ASSOCIATION';
  if (cardinality === 'SELF_REFERENTIAL') return 'NON_OWNING_REFERENCE';
  return 'INDEPENDENT_ASSOCIATION';
}

/**
 * Universal Relationship Intelligence Engine V1 — support classification.
 */

import type { NormalizedApprovedRelationship } from './relationship-normalization-engine.js';
import type { ResolvedRelationshipEndpoints } from './relationship-endpoint-resolver.js';
import type { UniversalRelationshipSupportClassification } from './universal-relationship-types.js';

export interface RelationshipSupportClassificationResult {
  readonly classification: UniversalRelationshipSupportClassification;
  readonly blockedReason?: string;
}

export function classifyRelationshipSupport(
  normalized: NormalizedApprovedRelationship,
  endpoints: ResolvedRelationshipEndpoints,
): RelationshipSupportClassificationResult {
  const label = `${normalized.label} ${normalized.sourceEntityLabel} ${normalized.targetEntityLabel}`.toLowerCase();
  if (/\bschedule|scheduling|calendar slot|appointment slot\b/i.test(label)) {
    return {
      classification: 'BLOCKED_BY_FUTURE_CAPABILITY',
      blockedReason: 'blocked_by_scheduling_capability',
    };
  }
  if (/\bdistributed transaction|external api sync\b/i.test(label)) {
    return {
      classification: 'BLOCKED_BY_FUTURE_CAPABILITY',
      blockedReason: 'blocked_by_external_integration_capability',
    };
  }
  if (!endpoints.resolved) {
    return {
      classification: 'INVALID_RELATIONSHIP_CONTRACT',
      blockedReason: endpoints.ambiguityReason ?? 'ambiguous_endpoint',
    };
  }
  switch (normalized.cardinality) {
    case 'ONE_TO_ONE':
      return { classification: 'ONE_TO_ONE_SUPPORTED' };
    case 'ONE_TO_MANY':
      return { classification: 'ONE_TO_MANY_SUPPORTED' };
    case 'MANY_TO_ONE':
      return { classification: 'MANY_TO_ONE_SUPPORTED' };
    case 'MANY_TO_MANY':
      return { classification: 'MANY_TO_MANY_SUPPORTED' };
    case 'PARENT_CHILD':
      return { classification: 'PARENT_CHILD_SUPPORTED' };
    case 'SELF_REFERENTIAL':
      return { classification: 'SELF_REFERENTIAL_SUPPORTED' };
    default:
      return { classification: 'FULLY_SUPPORTED' };
  }
}

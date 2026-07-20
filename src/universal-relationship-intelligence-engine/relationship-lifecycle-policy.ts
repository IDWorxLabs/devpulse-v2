/**
 * Universal Relationship Intelligence Engine V1 — lifecycle policies.
 */

import type { NormalizedApprovedRelationship } from './relationship-normalization-engine.js';
import type { UniversalLifecyclePolicy } from './universal-relationship-types.js';

export interface DerivedLifecyclePolicies {
  readonly onDeletePolicy: UniversalLifecyclePolicy;
  readonly orphanPolicy: UniversalLifecyclePolicy;
  readonly cascadePolicy: UniversalLifecyclePolicy;
}

export function deriveLifecyclePolicies(normalized: NormalizedApprovedRelationship): DerivedLifecyclePolicies {
  if (normalized.cardinality === 'PARENT_CHILD' || normalized.ownership === 'COMPOSITION') {
    return { onDeletePolicy: 'RESTRICT', orphanPolicy: 'RESTRICT', cascadePolicy: 'RESTRICT' };
  }
  if (normalized.cardinality === 'MANY_TO_MANY') {
    return { onDeletePolicy: 'DETACH', orphanPolicy: 'PRESERVE', cascadePolicy: 'DETACH' };
  }
  if (normalized.sourceOptional || normalized.targetOptional) {
    return { onDeletePolicy: 'SET_NULL', orphanPolicy: 'SET_NULL', cascadePolicy: 'RESTRICT' };
  }
  return { onDeletePolicy: 'RESTRICT', orphanPolicy: 'RESTRICT', cascadePolicy: 'RESTRICT' };
}

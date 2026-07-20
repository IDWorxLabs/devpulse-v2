/**
 * Universal Relationship Intelligence Engine V1 — relationship graph validation.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';

export interface RelationshipGraphValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export function validateRelationshipGraph(
  descriptors: readonly UniversalRelationshipDescriptor[],
): RelationshipGraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const active = descriptors.filter((d) => d.supportClassification !== 'INVALID_RELATIONSHIP_CONTRACT');

  for (const descriptor of active) {
    if (ids.has(descriptor.relationshipId)) {
      errors.push(`duplicate_relationship_id:${descriptor.relationshipId}`);
    }
    ids.add(descriptor.relationshipId);

    if (!descriptor.sourceEntityId) errors.push(`missing_source_entity:${descriptor.relationshipId}`);
    if (!descriptor.targetEntityId) errors.push(`missing_target_entity:${descriptor.relationshipId}`);
    if (descriptor.supportClassification === 'INVALID_RELATIONSHIP_CONTRACT') {
      errors.push(`invalid_relationship_contract:${descriptor.relationshipId}`);
    }
    if (descriptor.cardinality === 'MANY_TO_MANY' && !descriptor.junctionEntityId) {
      errors.push(`missing_junction_entity:${descriptor.relationshipId}`);
    }
    if (descriptor.cascadePolicy === 'CASCADE' && !descriptor.mutationOperations.includes('unlink')) {
      warnings.push(`unsafe_cascade_policy:${descriptor.relationshipId}`);
    }
    if (
      descriptor.cardinality === 'SELF_REFERENTIAL' &&
      descriptor.sourceModuleId !== descriptor.targetModuleId
    ) {
      errors.push(`invalid_self_reference:${descriptor.relationshipId}`);
    }
    if (!descriptor.onDeletePolicy) errors.push(`missing_lifecycle_policy:${descriptor.relationshipId}`);
  }

  detectHierarchyCycles(active, errors);

  return { valid: errors.length === 0, errors, warnings };
}

function detectHierarchyCycles(
  descriptors: readonly UniversalRelationshipDescriptor[],
  errors: string[],
): void {
  const hierarchy = descriptors.filter(
    (d) => d.cardinality === 'PARENT_CHILD' || d.cardinality === 'SELF_REFERENTIAL',
  );
  for (const rel of hierarchy) {
    if (rel.sourceModuleId === rel.targetModuleId && rel.ordered) {
      // self hierarchy — cycle prevention enforced at runtime
      continue;
    }
    const reverse = hierarchy.find(
      (other) =>
        other.relationshipId !== rel.relationshipId &&
        other.sourceModuleId === rel.targetModuleId &&
        other.targetModuleId === rel.sourceModuleId,
    );
    if (reverse && !rel.sourceOptional && !reverse.sourceOptional) {
      errors.push(`hierarchy_cycle:${rel.relationshipId}`);
    }
  }
}

export function validateSingleRelationshipGraph(
  descriptor: UniversalRelationshipDescriptor,
): RelationshipGraphValidationResult {
  return validateRelationshipGraph([descriptor]);
}

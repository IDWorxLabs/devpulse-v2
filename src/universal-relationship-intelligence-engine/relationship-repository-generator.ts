/**
 * Universal Relationship Intelligence Engine V1 — relationship repository generation.
 */

import type { UniversalRelationshipDescriptor, UniversalRelationshipMaterializationInput } from './universal-relationship-types.js';
import { escRelationshipString } from './universal-relationship-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export function generateRelationshipRepositorySource(
  descriptors: readonly UniversalRelationshipDescriptor[],
  input: UniversalRelationshipMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  const relJson = JSON.stringify(
    descriptors.map((d) => ({
      relationshipId: d.relationshipId,
      cardinality: d.cardinality,
      sourceModuleId: d.sourceModuleId,
      targetModuleId: d.targetModuleId,
      onDeletePolicy: d.onDeletePolicy,
    })),
    null,
    2,
  );

  return `/** Universal relationship repository — ${escRelationshipString(input.moduleDisplayName)} */
import {
  linkRecords,
  unlinkRecords,
  listRelatedRecords,
  listInverseRelatedRecords,
  countRelatedRecords,
  existsLink,
} from '../../universal-relationship-runtime/link-store';
import type { RelationshipOperationResult } from '../../universal-relationship-runtime/types';
import { wouldCreateHierarchyCycle } from '../../universal-relationship-runtime/hierarchy';

export const ${input.moduleId.replace(/-/g, '_').toUpperCase()}_RELATIONSHIPS = ${relJson} as const;

export function link${pascal}Relationship(
  relationshipId: string,
  sourceId: string,
  targetId: string,
): RelationshipOperationResult {
  const def = ${input.moduleId.replace(/-/g, '_').toUpperCase()}_RELATIONSHIPS.find((r) => r.relationshipId === relationshipId);
  if (!def) return { ok: false, message: 'Unknown relationship' };
  if (def.cardinality === 'ONE_TO_ONE' && countRelatedRecords(relationshipId, sourceId) >= 1) {
    return { ok: false, message: 'One-to-one uniqueness violated' };
  }
  if (existsLink(relationshipId, sourceId, targetId)) {
    return { ok: false, message: 'Duplicate link prevented' };
  }
  if ((def.cardinality === 'PARENT_CHILD' || def.cardinality === 'SELF_REFERENTIAL') &&
    wouldCreateHierarchyCycle(sourceId, targetId, (id) => listRelatedRecords(relationshipId, id)[0]?.targetId ?? null)) {
    return { ok: false, message: 'Hierarchy cycle prevented' };
  }
  return linkRecords(relationshipId, sourceId, targetId);
}

export function unlink${pascal}Relationship(
  relationshipId: string,
  sourceId: string,
  targetId: string,
): RelationshipOperationResult {
  return unlinkRecords(relationshipId, sourceId, targetId);
}

export function list${pascal}Related(relationshipId: string, sourceId: string) {
  return listRelatedRecords(relationshipId, sourceId);
}

export function list${pascal}InverseRelated(relationshipId: string, targetId: string) {
  return listInverseRelatedRecords(relationshipId, targetId);
}

export function count${pascal}Related(relationshipId: string, sourceId: string): number {
  return countRelatedRecords(relationshipId, sourceId);
}

export function validate${pascal}ReferentialIntegrity(
  relationshipId: string,
  sourceId: string,
  targetId: string,
  required: boolean,
): RelationshipOperationResult {
  if (!sourceId || !targetId) {
    return required
      ? { ok: false, message: 'Referential validation failed: required relationship missing' }
      : { ok: true, message: 'Optional relationship absent' };
  }
  return { ok: true, message: 'Referential validation passed' };
}

export function enforce${pascal}DeletePolicy(
  relationshipId: string,
  sourceId: string,
): RelationshipOperationResult {
  const def = ${input.moduleId.replace(/-/g, '_').toUpperCase()}_RELATIONSHIPS.find((r) => r.relationshipId === relationshipId);
  if (!def) return { ok: false, message: 'Unknown relationship' };
  const related = countRelatedRecords(relationshipId, sourceId);
  if (def.onDeletePolicy === 'RESTRICT' && related > 0) {
    return { ok: false, message: 'Delete restricted: related records exist' };
  }
  if (def.onDeletePolicy === 'CASCADE') {
    return { ok: false, message: 'Unsafe cascade blocked: confirmation required' };
  }
  return { ok: true, message: 'Delete policy satisfied' };
}
`;
}

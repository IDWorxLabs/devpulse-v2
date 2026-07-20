/**
 * Universal Relationship Intelligence Engine V1 — relationship service generation.
 */

import type { UniversalRelationshipDescriptor, UniversalRelationshipMaterializationInput } from './universal-relationship-types.js';
import { escRelationshipString } from './universal-relationship-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export function generateRelationshipServiceSource(
  descriptors: readonly UniversalRelationshipDescriptor[],
  input: UniversalRelationshipMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  return `/** Universal relationship service — ${escRelationshipString(input.moduleDisplayName)} */
import {
  link${pascal}Relationship,
  unlink${pascal}Relationship,
  list${pascal}Related,
  list${pascal}InverseRelated,
  count${pascal}Related,
  validate${pascal}ReferentialIntegrity,
  enforce${pascal}DeletePolicy,
} from './${input.moduleId}.relationship.repository';
import type { RelationshipOperationResult } from '../../universal-relationship-runtime/types';

export function ${input.moduleId.replace(/-/g, '_')}RelationshipService() {
  return {
    link(relationshipId: string, sourceId: string, targetId: string): RelationshipOperationResult {
      const validation = validate${pascal}ReferentialIntegrity(relationshipId, sourceId, targetId, true);
      if (!validation.ok) return validation;
      return link${pascal}Relationship(relationshipId, sourceId, targetId);
    },
    unlink(relationshipId: string, sourceId: string, targetId: string): RelationshipOperationResult {
      return unlink${pascal}Relationship(relationshipId, sourceId, targetId);
    },
    replaceLink(relationshipId: string, sourceId: string, oldTargetId: string, newTargetId: string): RelationshipOperationResult {
      const removed = unlink${pascal}Relationship(relationshipId, sourceId, oldTargetId);
      if (!removed.ok) return removed;
      return link${pascal}Relationship(relationshipId, sourceId, newTargetId);
    },
    listRelated: list${pascal}Related,
    listInverseRelated: list${pascal}InverseRelated,
    countRelated: count${pascal}Related,
    validateRelationship: validate${pascal}ReferentialIntegrity,
    validateReferentialIntegrity: validate${pascal}ReferentialIntegrity,
    enforceDeletePolicy: enforce${pascal}DeletePolicy,
    batchLink(relationshipId: string, sourceId: string, targetIds: string[]): RelationshipOperationResult {
      for (const targetId of targetIds) {
        const result = link${pascal}Relationship(relationshipId, sourceId, targetId);
        if (!result.ok) return result;
      }
      return { ok: true, message: 'Batch link completed' };
    },
    batchUnlink(relationshipId: string, sourceId: string, targetIds: string[]): RelationshipOperationResult {
      for (const targetId of targetIds) {
        unlink${pascal}Relationship(relationshipId, sourceId, targetId);
      }
      return { ok: true, message: 'Batch unlink completed' };
    },
  };
}
`;
}

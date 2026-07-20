/**
 * Universal Relationship Intelligence Engine V1 — descriptor builder.
 */

import type { NormalizedApprovedRelationship } from './relationship-normalization-engine.js';
import type { RelationshipSupportClassificationResult } from './relationship-support-classifier.js';
import type { ResolvedRelationshipEndpoints } from './relationship-endpoint-resolver.js';
import type {
  UniversalRelationshipDescriptor,
  UniversalRelationshipMaterializationInput,
} from './universal-relationship-types.js';
import { stableRelationshipId } from './universal-relationship-types.js';
import { deriveLifecyclePolicies } from './relationship-lifecycle-policy.js';
import { deriveWorkflowGuardIds } from './relationship-workflow-integration.js';

export function buildRelationshipDescriptors(
  normalized: readonly NormalizedApprovedRelationship[],
  classifications: readonly RelationshipSupportClassificationResult[],
  endpointsList: readonly ResolvedRelationshipEndpoints[],
  input: UniversalRelationshipMaterializationInput,
): UniversalRelationshipDescriptor[] {
  return normalized.map((item, index) => {
    const endpoints = endpointsList[index]!;
    const classification = classifications[index]!;
    const lifecycle = deriveLifecyclePolicies(item);
    const relationshipId = stableRelationshipId(
      endpoints.sourceModuleId,
      endpoints.targetModuleId,
      item.cardinality,
    );
    const sourceField = `${endpoints.targetModuleId.replace(/-/g, '_')}Id`;
    const targetField =
      item.cardinality === 'MANY_TO_MANY'
        ? null
        : item.cardinality === 'ONE_TO_MANY' || item.cardinality === 'MANY_TO_ONE'
          ? `${endpoints.sourceModuleId.replace(/-/g, '_')}Id`
          : `${endpoints.sourceModuleId.replace(/-/g, '_')}RefId`;

    return {
      relationshipId,
      label: item.label,
      description: `Universal relationship ${item.cardinality} between ${endpoints.sourceEntityId} and ${endpoints.targetEntityId}`,
      sourceEntityId: endpoints.sourceEntityId,
      targetEntityId: endpoints.targetEntityId,
      sourceModuleId: endpoints.sourceModuleId,
      targetModuleId: endpoints.targetModuleId,
      relationshipKind: item.cardinality.toLowerCase().replace(/_/g, '-'),
      cardinality: item.cardinality,
      inverseCardinality: item.inverseCardinality,
      ownership: item.ownership,
      sourceField,
      targetField: targetField ?? 'relatedIds',
      junctionEntityId:
        item.cardinality === 'MANY_TO_MANY'
          ? `${endpoints.sourceModuleId}__${endpoints.targetModuleId}__junction`
          : null,
      sourceOptional: item.sourceOptional,
      targetOptional: item.targetOptional,
      ordered: item.ordered,
      onDeletePolicy: lifecycle.onDeletePolicy,
      orphanPolicy: lifecycle.orphanPolicy,
      cascadePolicy: lifecycle.cascadePolicy,
      sourceEnvelopePaths: [item.sourceEnvelopePath],
      provenance: [item.sourceEnvelopePath],
      supportClassification: classification.classification,
      blockedReason: classification.blockedReason,
      sourceRoute: endpoints.sourceRoute,
      targetRoute: endpoints.targetRoute,
      mutationOperations: deriveMutationOperations(item.cardinality),
      workflowGuardIds: deriveWorkflowGuardIds(item),
    };
  });
}

function deriveMutationOperations(cardinality: NormalizedApprovedRelationship['cardinality']): string[] {
  const base = ['link', 'unlink', 'listRelated', 'listInverseRelated', 'validateRelationship'];
  if (cardinality === 'MANY_TO_MANY') return [...base, 'batchLink', 'batchUnlink'];
  if (cardinality === 'PARENT_CHILD' || cardinality === 'SELF_REFERENTIAL') {
    return [...base, 'setParent', 'clearParent', 'listChildren', 'moveNode'];
  }
  if (cardinality === 'ONE_TO_ONE') return [...base, 'replaceLink'];
  return base;
}

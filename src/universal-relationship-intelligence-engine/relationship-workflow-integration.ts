/**
 * Universal Relationship Intelligence Engine V1 — B3 workflow integration.
 */

import type { NormalizedApprovedRelationship } from './relationship-normalization-engine.js';
import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';

export function deriveWorkflowGuardIds(normalized: NormalizedApprovedRelationship): string[] {
  const guards = ['relationship_exists', 'related_count_at_least'];
  if (!normalized.sourceOptional) guards.push('required_parent_present');
  if (normalized.cardinality === 'MANY_TO_MANY') guards.push('target_not_already_linked');
  if (normalized.cardinality === 'ONE_TO_ONE') guards.push('target_not_already_linked');
  return guards;
}

export function generateWorkflowRelationshipGuardsSource(
  descriptors: readonly UniversalRelationshipDescriptor[],
): string {
  const guardIds = [...new Set(descriptors.flatMap((d) => d.workflowGuardIds))];
  return `/** Universal relationship workflow guards — B3 integration */
export const UNIVERSAL_RELATIONSHIP_WORKFLOW_GUARDS = ${JSON.stringify(guardIds, null, 2)} as const;

export function evaluateRelationshipWorkflowGuard(
  guardId: string,
  context: { relatedCount: number; hasLink: boolean; hasRequiredParent: boolean; duplicateLink: boolean },
): { ok: boolean; message: string } {
  switch (guardId) {
    case 'relationship_exists':
      return { ok: context.hasLink, message: context.hasLink ? 'ok' : 'Relationship required' };
    case 'related_count_at_least':
      return { ok: context.relatedCount >= 1, message: context.relatedCount >= 1 ? 'ok' : 'At least one related record required' };
    case 'required_parent_present':
      return { ok: context.hasRequiredParent, message: context.hasRequiredParent ? 'ok' : 'Required parent missing' };
    case 'target_not_already_linked':
      return { ok: !context.duplicateLink, message: context.duplicateLink ? 'Duplicate link' : 'ok' };
    default:
      return { ok: false, message: 'Unknown relationship guard' };
  }
}
`;
}

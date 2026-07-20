/**
 * Universal Relationship Intelligence Engine V1 — B2 action integration.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';

export function relationshipActionSemantic(operation: string): string {
  return `relationship:${operation}`;
}

export function generateRelationshipActionHandlersFragment(
  descriptors: readonly UniversalRelationshipDescriptor[],
): string {
  const ops = new Set<string>();
  for (const d of descriptors) {
    for (const op of d.mutationOperations) ops.add(op);
  }
  return [...ops]
    .map(
      (op) =>
        `    case '${relationshipActionSemantic(op)}': {
      const result = relationship.${op}(payload);
      if (!result.ok) {
        setRelationshipError(result.message ?? 'Relationship operation failed');
        return;
      }
      setRelationshipSuccess(result.message ?? '${op} succeeded');
      relationship.refreshRelated();
      break;
    }`,
    )
    .join('\n');
}

export function relationshipDispatchEventSnippet(eventType: string, payloadExpr: string): string {
  return `dispatchEvent({ type: '${eventType}', payload: ${payloadExpr} })`;
}

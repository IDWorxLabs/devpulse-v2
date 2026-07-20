/**
 * Universal Runtime State Engine V1 — support classification.
 */

import type { UniversalRuntimeSupportClassification } from './universal-runtime-types.js';

export function classifyRuntimeSupport(input: {
  kind: string;
  blocked: boolean;
  blockedReason?: string;
}): UniversalRuntimeSupportClassification {
  if (input.blocked) return 'BLOCKED_BY_FUTURE_CAPABILITY';
  switch (input.kind) {
    case 'entity-collection':
      return 'COLLECTION_STATE_SUPPORTED';
    case 'form-state':
      return 'FORM_STATE_SUPPORTED';
    case 'action-execution':
      return 'ACTION_STATE_SUPPORTED';
    case 'workflow-instance':
      return 'WORKFLOW_STATE_SUPPORTED';
    case 'relationship-query':
      return 'RELATIONSHIP_STATE_SUPPORTED';
    case 'navigation-context':
      return 'NAVIGATION_STATE_SUPPORTED';
    default:
      return 'FULLY_SUPPORTED';
  }
}

/**
 * Unified Failure Escalation Authority V1 — escalation strategy selector.
 */

import type {
  EscalationStrategy,
  FailureClassificationCategory,
  FailureSeverity,
  RootCauseType,
} from './unified-failure-escalation-v1-types.js';

export function selectEscalationStrategy(input: {
  classification: FailureClassificationCategory;
  severity: FailureSeverity;
  rootCause: RootCauseType;
  repeatCount: number;
}): EscalationStrategy {
  if (input.severity === 'BLOCKING' && input.classification === 'Production Failure') {
    return 'BLOCK_RELEASE';
  }
  if (input.rootCause === 'Unknown') return 'RESEARCH';
  if (input.repeatCount >= 3) {
    if (
      input.classification === 'Verification Failure' ||
      input.classification === 'Evolution Failure'
    ) {
      return 'CAPABILITY_EVOLUTION';
    }
    if (
      input.classification === 'Build Failure' ||
      input.classification === 'World2 Failure'
    ) {
      return 'WORLD2_EXPERIMENT';
    }
    return 'RESEARCH';
  }
  if (input.repeatCount === 2) return 'REPAIR';
  if (input.repeatCount === 1) return 'RETRY';

  switch (input.classification) {
    case 'Build Failure':
    case 'Preview Failure':
      return 'REPAIR';
    case 'Verification Failure':
      return 'REPAIR';
    case 'Production Failure':
      return 'BLOCK_RELEASE';
    case 'Architecture Failure':
      return 'RESEARCH';
    case 'Evolution Failure':
      return 'CAPABILITY_EVOLUTION';
    case 'Launch Failure':
      return 'OPERATOR_REVIEW';
    default:
      return input.severity === 'CRITICAL' || input.severity === 'BLOCKING'
        ? 'OPERATOR_REVIEW'
        : 'RETRY';
  }
}

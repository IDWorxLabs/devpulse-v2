/**
 * Unified Failure Escalation Authority V1 — three-failure rule.
 */

import type { EscalationStrategy } from './unified-failure-escalation-v1-types.js';
import { selectEscalationStrategy } from './escalation-strategy-selector.js';
import type {
  FailureClassificationCategory,
  RepeatedFailureAnalysis,
} from './unified-failure-escalation-v1-types.js';

export function applyRepeatedFailureEscalation(input: {
  fingerprint: string;
  classification: FailureClassificationCategory;
}): RepeatedFailureAnalysis {
  const firstStrategy = selectEscalationStrategy({
    classification: input.classification,
    severity: 'HIGH',
    rootCause: 'Implementation defect',
    repeatCount: 1,
  });
  const secondStrategy = selectEscalationStrategy({
    classification: input.classification,
    severity: 'HIGH',
    rootCause: 'Implementation defect',
    repeatCount: 2,
  });
  const thirdStrategy = selectEscalationStrategy({
    classification: input.classification,
    severity: 'HIGH',
    rootCause: 'Implementation defect',
    repeatCount: 3,
  });

  const threeFailureRuleEnforced =
    firstStrategy === 'RETRY' &&
    secondStrategy === 'REPAIR' &&
    (thirdStrategy === 'RESEARCH' ||
      thirdStrategy === 'WORLD2_EXPERIMENT' ||
      thirdStrategy === 'CAPABILITY_EVOLUTION');

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    fingerprint: input.fingerprint,
    failureCount: 3,
    firstStrategy,
    secondStrategy,
    thirdStrategy,
    threeFailureRuleEnforced,
  };
}

export function resolveRepeatCount(fingerprint: string, incidents: readonly { fingerprint?: string }[]): number {
  return incidents.filter((i) => (i as { fingerprint?: string }).fingerprint === fingerprint).length + 1;
}

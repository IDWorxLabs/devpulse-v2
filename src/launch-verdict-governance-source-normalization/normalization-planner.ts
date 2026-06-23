/**
 * Phase 27.06 — Launch verdict governance normalization planner (V1).
 */

import type {
  DegradedPathDetection,
  LaunchVerdictGovernanceNormalizationPlan,
  MissingArrayDetection,
} from './launch-verdict-governance-source-normalization-types.js';
import { LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS } from './launch-verdict-governance-source-normalization-registry.js';

export function planLaunchVerdictGovernanceNormalization(input: {
  missingArrayDetection: MissingArrayDetection;
  degradedPathDetection: DegradedPathDetection;
}): LaunchVerdictGovernanceNormalizationPlan {
  if (!input.missingArrayDetection.normalizationRequired) {
    return {
      readOnly: true,
      normalizationRequired: false,
      actions: ['governance-source-shape-satisfied'],
      fieldsToNormalize: [],
      upstreamProducer: input.degradedPathDetection.upstreamProducer,
      reason: null,
    };
  }

  const fieldsToNormalize =
    input.missingArrayDetection.missingGovernanceArrays.length > 0
      ? input.missingArrayDetection.missingGovernanceArrays
      : [...LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS];

  return {
    readOnly: true,
    normalizationRequired: true,
    actions: fieldsToNormalize.map((field) => `normalize-${field}-at-source`),
    fieldsToNormalize,
    upstreamProducer: input.degradedPathDetection.upstreamProducer,
    reason:
      input.degradedPathDetection.reason ??
      input.missingArrayDetection.reason ??
      'Governance arrays require source normalization',
  };
}

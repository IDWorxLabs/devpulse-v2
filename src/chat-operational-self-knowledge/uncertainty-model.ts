/**
 * Uncertainty model — KNOWN / LIKELY / UNVERIFIED / UNKNOWN from evidence.
 */

import type { UncertaintyAssessment, UncertaintyLevel } from './chat-operational-self-knowledge-types.js';

export function deriveUncertaintyLevel(input: {
  provenCount: number;
  notProvenCount: number;
  unknownCount: number;
  hasLiveEvidence: boolean;
}): UncertaintyAssessment {
  const total = input.provenCount + input.notProvenCount + input.unknownCount;
  const provenRatio = total === 0 ? 0 : input.provenCount / total;

  let level: UncertaintyLevel = 'UNKNOWN';
  let confidencePercent = 20;

  if (input.hasLiveEvidence && input.notProvenCount === 0 && input.unknownCount === 0) {
    level = 'KNOWN';
    confidencePercent = 92;
  } else if (input.hasLiveEvidence && provenRatio >= 0.6) {
    level = 'LIKELY';
    confidencePercent = 72;
  } else if (input.hasLiveEvidence) {
    level = 'UNVERIFIED';
    confidencePercent = 48;
  } else {
    level = 'UNKNOWN';
    confidencePercent = 18;
  }

  const rationale =
    level === 'KNOWN'
      ? 'Multiple capabilities are proven with connected evidence in this session.'
      : level === 'LIKELY'
        ? 'Some capabilities are proven, but downstream execution stages remain unverified.'
        : level === 'UNVERIFIED'
          ? 'Evidence exists but material gaps remain in the execution chain or proof authorities.'
          : 'Insufficient connected evidence to assert operational certainty.';

  return {
    readOnly: true,
    level,
    confidencePercent,
    rationale,
    evidenceSource: 'chat-operational-self-knowledge/uncertainty-model',
  };
}

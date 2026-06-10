/**
 * Founder Trust Validation — evidence visibility validator.
 */

import type { FounderTrustValidationInput, EvidenceVisibilityValidation } from './founder-trust-types.js';
import { EVIDENCE_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface EvidenceVisibilityUpstream {
  uvlRowCount: number;
  evidenceModelComplete: boolean;
  gapDisclosureScore: number;
  evidenceGapCount: number;
}

let validateCount = 0;

export function validateEvidenceVisibility(
  input: FounderTrustValidationInput,
  upstream: EvidenceVisibilityUpstream,
): EvidenceVisibilityValidation {
  const cacheKey = [input.requestId, upstream.gapDisclosureScore, input.evidenceHidden].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === EVIDENCE_TRUST_PASS) return cached as EvidenceVisibilityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const uvlBonus = upstream.uvlRowCount > 80 ? 8 : upstream.uvlRowCount > 40 ? 4 : 0;
  const baseScore = Math.round(
    upstream.gapDisclosureScore + uvlBonus - upstream.evidenceGapCount * 4,
  );

  if (input.evidenceHidden === true || input.missingEvidence === true || baseScore < 70) {
    detectionCodes.push('EVIDENCE_TRUST');
    gaps.push(createTrustGap({
      title: 'Evidence not sufficiently visible or traceable',
      description: 'Founder cannot see, trace, or evaluate evidence supporting conclusions',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'EVIDENCE_TRUST',
      sourceValidator: 'evidence-visibility-validator',
      trustContext: 'EVIDENCE_TRUST',
    }));
  }
  if (!upstream.evidenceModelComplete) {
    gaps.push(createTrustGap({
      title: 'Evidence model incomplete for trust evaluation',
      description: 'Acceptance framework evidence slots not fully established',
      severity: 'MINOR',
      detectionCode: 'EVIDENCE_TRUST_GAPS',
      sourceValidator: 'evidence-visibility-validator',
      trustContext: 'EVIDENCE_TRUST',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: EvidenceVisibilityValidation = {
    validatorType: 'EVIDENCE_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: EVIDENCE_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getEvidenceValidateCount(): number {
  return validateCount;
}

export function resetEvidenceVisibilityValidatorForTests(): void {
  validateCount = 0;
}

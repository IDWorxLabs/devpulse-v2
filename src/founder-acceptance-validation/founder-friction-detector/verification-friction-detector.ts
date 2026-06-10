/**
 * Founder Friction Detector — verification friction detector.
 */

import type { FounderFrictionDetectorInput, VerificationFrictionDetection } from './founder-friction-types.js';
import { VERIFICATION_FRICTION_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface VerificationFrictionUpstream {
  verificationIntegrityScore: number;
  uvlRowCount: number;
  authorityConflictCount: number;
  validationEvidenceScore: number;
}

let detectCount = 0;

export function detectVerificationFriction(
  input: FounderFrictionDetectorInput,
  upstream: VerificationFrictionUpstream,
): VerificationFrictionDetection {
  const cacheKey = [input.requestId, upstream.verificationIntegrityScore, input.verificationConfusing].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === VERIFICATION_FRICTION_PASS) return cached as VerificationFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const uvlBonus = upstream.uvlRowCount > 100 ? 5 : 0;
  const baseScore = Math.round(
    (upstream.verificationIntegrityScore + upstream.validationEvidenceScore) / 2 + uvlBonus
      - upstream.authorityConflictCount * 5,
  );

  if (input.verificationConfusing === true || baseScore < 68) {
    detectionCodes.push('VERIFICATION_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Verification friction blocks founder progress',
      description: 'Validation confusion, complexity, bottlenecks, or unclear outcomes create friction',
      severity: baseScore < 50 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'VERIFICATION_FRICTION',
      sourceDetector: 'verification-friction-detector',
      frictionContext: 'VERIFICATION_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: VerificationFrictionDetection = {
    detectorType: 'VERIFICATION_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: VERIFICATION_FRICTION_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getVerificationFrictionDetectCount(): number {
  return detectCount;
}

export function resetVerificationFrictionDetectorForTests(): void {
  detectCount = 0;
}

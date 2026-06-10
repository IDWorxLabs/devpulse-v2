/**
 * Founder Friction Detector — trust breakdown detector.
 */

import type { FounderFrictionDetectorInput, TrustBreakdownDetection } from './founder-friction-types.js';
import { TRUST_BREAKDOWN_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface TrustBreakdownUpstream {
  founderTrustScore: number;
  truthfulnessScore: number;
  transparencyScore: number;
  trustGapCount: number;
}

let detectCount = 0;

export function detectTrustBreakdown(
  input: FounderFrictionDetectorInput,
  upstream: TrustBreakdownUpstream,
): TrustBreakdownDetection {
  const cacheKey = [input.requestId, upstream.founderTrustScore, input.trustBreakdown].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === TRUST_BREAKDOWN_PASS) return cached as TrustBreakdownDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderTrustScore + upstream.truthfulnessScore + upstream.transparencyScore) / 3
      - upstream.trustGapCount * 3,
  );

  if (input.trustBreakdown === true || baseScore < 70) {
    detectionCodes.push('TRUST_BREAKDOWN_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Trust breakdown undermines founder effectiveness',
      description: 'Trust failures, transparency gaps, or evidence visibility failures block founder progress',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'TRUST_BREAKDOWN_FRICTION',
      sourceDetector: 'trust-breakdown-detector',
      frictionContext: 'TRUST_BREAKDOWN_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: TrustBreakdownDetection = {
    detectorType: 'TRUST_BREAKDOWN_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: TRUST_BREAKDOWN_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getTrustBreakdownDetectCount(): number {
  return detectCount;
}

export function resetTrustBreakdownDetectorForTests(): void {
  detectCount = 0;
}

/**
 * Founder Friction Detector — confidence breakdown detector.
 */

import type { FounderFrictionDetectorInput, ConfidenceBreakdownDetection } from './founder-friction-types.js';
import { CONFIDENCE_BREAKDOWN_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface ConfidenceBreakdownUpstream {
  founderConfidenceScore: number;
  progressTruthScore: number;
  reasoningVisibilityScore: number;
  confidenceGapCount: number;
}

let detectCount = 0;

export function detectConfidenceBreakdown(
  input: FounderFrictionDetectorInput,
  upstream: ConfidenceBreakdownUpstream,
): ConfidenceBreakdownDetection {
  const cacheKey = [input.requestId, upstream.founderConfidenceScore, input.confidenceBreakdown].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === CONFIDENCE_BREAKDOWN_PASS) return cached as ConfidenceBreakdownDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderConfidenceScore + upstream.progressTruthScore + upstream.reasoningVisibilityScore) / 3
      - upstream.confidenceGapCount * 3,
  );

  if (input.confidenceBreakdown === true || baseScore < 70) {
    detectionCodes.push('CONFIDENCE_BREAKDOWN_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Confidence breakdown reduces founder momentum',
      description: 'Reasoning visibility, progress truth, or uncertainty honesty failures create friction',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'CONFIDENCE_BREAKDOWN_FRICTION',
      sourceDetector: 'confidence-breakdown-detector',
      frictionContext: 'CONFIDENCE_BREAKDOWN_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ConfidenceBreakdownDetection = {
    detectorType: 'CONFIDENCE_BREAKDOWN_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: CONFIDENCE_BREAKDOWN_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getConfidenceBreakdownDetectCount(): number {
  return detectCount;
}

export function resetConfidenceBreakdownDetectorForTests(): void {
  detectCount = 0;
}

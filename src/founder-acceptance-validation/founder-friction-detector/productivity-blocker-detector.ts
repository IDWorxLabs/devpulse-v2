/**
 * Founder Friction Detector — productivity blocker detector.
 */

import type { FounderFrictionDetectorInput, ProductivityFrictionDetection } from './founder-friction-types.js';
import { PRODUCTIVITY_FRICTION_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface ProductivityBlockerUpstream {
  founderProductivityScore: number;
  throughputScore: number;
  workflowOverheadScore: number;
  productivityGapCount: number;
}

let detectCount = 0;

export function detectProductivityFriction(
  input: FounderFrictionDetectorInput,
  upstream: ProductivityBlockerUpstream,
): ProductivityFrictionDetection {
  const cacheKey = [input.requestId, upstream.founderProductivityScore, input.productivityBlocked].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === PRODUCTIVITY_FRICTION_PASS) return cached as ProductivityFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderProductivityScore + upstream.throughputScore + upstream.workflowOverheadScore) / 3
      - upstream.productivityGapCount * 3,
  );

  if (input.productivityBlocked === true || baseScore < 70) {
    detectionCodes.push('PRODUCTIVITY_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Productivity blockers slow founder progress',
      description: 'Workflow slowdown, manual work burden, or throughput reduction blocks founder effectiveness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'PRODUCTIVITY_FRICTION',
      sourceDetector: 'productivity-blocker-detector',
      frictionContext: 'PRODUCTIVITY_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ProductivityFrictionDetection = {
    detectorType: 'PRODUCTIVITY_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: PRODUCTIVITY_FRICTION_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getProductivityBlockerDetectCount(): number {
  return detectCount;
}

export function resetProductivityBlockerDetectorForTests(): void {
  detectCount = 0;
}

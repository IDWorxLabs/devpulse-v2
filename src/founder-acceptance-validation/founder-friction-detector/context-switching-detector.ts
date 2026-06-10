/**
 * Founder Friction Detector — context switching detector.
 */

import type { FounderFrictionDetectorInput, ContextSwitchingFrictionDetection } from './founder-friction-types.js';
import { CONTEXT_SWITCHING_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface ContextSwitchingUpstream {
  contextSwitchingScore: number;
  experienceContinuityScore: number;
  fragmentationRiskCount: number;
}

let detectCount = 0;

export function detectContextSwitchingFriction(
  input: FounderFrictionDetectorInput,
  upstream: ContextSwitchingUpstream,
): ContextSwitchingFrictionDetection {
  const cacheKey = [input.requestId, upstream.contextSwitchingScore, input.contextSwitchingHigh].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === CONTEXT_SWITCHING_PASS) return cached as ContextSwitchingFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.contextSwitchingScore + upstream.experienceContinuityScore) / 2
      - upstream.fragmentationRiskCount * 4,
  );

  if (input.contextSwitchingHigh === true || baseScore < 72) {
    detectionCodes.push('CONTEXT_SWITCHING_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Context switching fragments founder focus',
      description: 'Workflow fragmentation, context loss, or excessive navigation reduces effectiveness',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'CONTEXT_SWITCHING_FRICTION',
      sourceDetector: 'context-switching-detector',
      frictionContext: 'CONTEXT_SWITCHING_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ContextSwitchingFrictionDetection = {
    detectorType: 'CONTEXT_SWITCHING_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: CONTEXT_SWITCHING_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getContextSwitchDetectCount(): number {
  return detectCount;
}

export function resetContextSwitchingDetectorForTests(): void {
  detectCount = 0;
}

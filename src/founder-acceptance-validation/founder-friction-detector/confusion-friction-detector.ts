/**
 * Founder Friction Detector — confusion friction detector.
 */

import type { FounderFrictionDetectorInput, ConfusionFrictionDetection } from './founder-friction-types.js';
import { CONFUSION_FRICTION_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface ConfusionFrictionUpstream {
  navigationClarityScore: number;
  actionClarityScore: number;
  workflowClarityScore: number;
}

let detectCount = 0;

export function detectConfusionFriction(
  input: FounderFrictionDetectorInput,
  upstream: ConfusionFrictionUpstream,
): ConfusionFrictionDetection {
  const cacheKey = [input.requestId, upstream.navigationClarityScore, input.confusionHigh].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === CONFUSION_FRICTION_PASS) return cached as ConfusionFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.navigationClarityScore + upstream.actionClarityScore + upstream.workflowClarityScore) / 3,
  );

  if (input.confusionHigh === true || input.navigationConfusion === true || baseScore < 72) {
    detectionCodes.push('CONFUSION_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Unclear actions or next steps confuse founder',
      description: 'Founder cannot determine what to do, where to go, or what outcome is expected',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'CONFUSION_FRICTION',
      sourceDetector: 'confusion-friction-detector',
      frictionContext: 'CONFUSION_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: ConfusionFrictionDetection = {
    detectorType: 'CONFUSION_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: CONFUSION_FRICTION_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getConfusionDetectCount(): number {
  return detectCount;
}

export function resetConfusionFrictionDetectorForTests(): void {
  detectCount = 0;
}

/**
 * Founder Friction Detector — decision fatigue detector.
 */

import type { FounderFrictionDetectorInput, DecisionFatigueDetection } from './founder-friction-types.js';
import { DECISION_FATIGUE_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface DecisionFatigueUpstream {
  decisionReductionScore: number;
  decisionConfidenceScore: number;
  founderPriorityCount: number;
}

let detectCount = 0;

export function detectDecisionFatigue(
  input: FounderFrictionDetectorInput,
  upstream: DecisionFatigueUpstream,
): DecisionFatigueDetection {
  const cacheKey = [input.requestId, upstream.decisionReductionScore, input.decisionFatigueHigh].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === DECISION_FATIGUE_PASS) return cached as DecisionFatigueDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const priorityBonus = upstream.founderPriorityCount > 0 ? 5 : -10;
  const baseScore = Math.round(
    (upstream.decisionReductionScore + upstream.decisionConfidenceScore) / 2 + priorityBonus,
  );

  if (input.decisionFatigueHigh === true || baseScore < 70) {
    detectionCodes.push('DECISION_FATIGUE');
    gaps.push(createFrictionGap({
      title: 'Decision fatigue burdens founder effectiveness',
      description: 'Excessive or repeated decisions without clear prioritization or recommendations',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'DECISION_FATIGUE',
      sourceDetector: 'decision-fatigue-detector',
      frictionContext: 'DECISION_FATIGUE',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: DecisionFatigueDetection = {
    detectorType: 'DECISION_FATIGUE',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: DECISION_FATIGUE_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getDecisionFatigueDetectCount(): number {
  return detectCount;
}

export function resetDecisionFatigueDetectorForTests(): void {
  detectCount = 0;
}

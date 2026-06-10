/**
 * Founder Friction Detector — launch blocker friction detector.
 */

import type { FounderFrictionDetectorInput, LaunchFrictionDetection } from './founder-friction-types.js';
import { LAUNCH_FRICTION_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface LaunchFrictionUpstream {
  launchBlockerCount: number;
  releaseReadiness: string;
  productRealityScore: number;
  criticalBlockerCount: number;
}

let detectCount = 0;

export function detectLaunchFriction(
  input: FounderFrictionDetectorInput,
  upstream: LaunchFrictionUpstream,
): LaunchFrictionDetection {
  const cacheKey = [input.requestId, upstream.launchBlockerCount, input.launchBlocked].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === LAUNCH_FRICTION_PASS) return cached as LaunchFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const readinessPenalty = upstream.releaseReadiness === 'NOT_READY' ? 15 : upstream.releaseReadiness === 'PARTIALLY_READY' ? 6 : 0;
  const baseScore = Math.round(
    upstream.productRealityScore - upstream.launchBlockerCount * 5 - upstream.criticalBlockerCount * 8 - readinessPenalty,
  );

  if (input.launchBlocked === true || upstream.launchBlockerCount > 0 || baseScore < 65) {
    detectionCodes.push('LAUNCH_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Launch or readiness blockers impede founder',
      description: 'Launch blockers, readiness gaps, or release barriers actively block founder progress',
      severity: upstream.criticalBlockerCount > 0 || baseScore < 45 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'LAUNCH_FRICTION',
      sourceDetector: 'launch-blocker-friction-detector',
      frictionContext: 'LAUNCH_FRICTION',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: LaunchFrictionDetection = {
    detectorType: 'LAUNCH_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: LAUNCH_FRICTION_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getLaunchFrictionDetectCount(): number {
  return detectCount;
}

export function resetLaunchBlockerFrictionDetectorForTests(): void {
  detectCount = 0;
}

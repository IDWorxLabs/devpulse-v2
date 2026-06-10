/**
 * Product Experience Verification Engine — launch readiness continuity verifier.
 */

import type { LaunchReadinessContinuityVerification, LaunchReadinessLevel, ProductExperienceInput } from './product-experience-types.js';
import { LAUNCH_READINESS_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface LaunchReadinessContinuityUpstream {
  overallProductScore: number;
  autoPolishScore: number;
  firstImpressionLaunchScore: number;
  criticalGapCount: number;
  founderAlphaReady: boolean;
}

let verifyCount = 0;

function resolveReadinessLevel(score: number, criticalGaps: number): LaunchReadinessLevel {
  if (criticalGaps > 0 || score < 55) return 'FOUNDER_ALPHA';
  if (score < 70) return 'FOUNDER_BETA';
  if (score < 85) return 'PUBLIC_BETA';
  return 'PRODUCTION';
}

export function verifyLaunchReadinessContinuity(
  input: ProductExperienceInput,
  upstream: LaunchReadinessContinuityUpstream,
): LaunchReadinessContinuityVerification {
  const cacheKey = [input.requestId, upstream.overallProductScore, input.launchContinuityRisk].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === LAUNCH_READINESS_CONTINUITY_PASS) return cached as LaunchReadinessContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.overallProductScore + upstream.autoPolishScore + upstream.firstImpressionLaunchScore) / 3
      - upstream.criticalGapCount * 5,
  );

  if (input.launchContinuityRisk === true || baseScore < 75) {
    detectionCodes.push('LAUNCH_CONTINUITY_RISK');
    gaps.push(createExperienceGap({
      title: 'Launch continuity risk',
      description: 'Complete product experience may not support intended launch stage',
      severity: baseScore < 60 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'LAUNCH_CONTINUITY_RISK',
      sourceVerifier: 'launch-readiness-continuity-verifier',
      connectedSystems: ['Auto-Polish', 'First Impression', 'Product Experience'],
    }));
  }
  if (input.readinessMismatch === true) {
    detectionCodes.push('READINESS_MISMATCH');
    gaps.push(createExperienceGap({
      title: 'Readiness mismatch across systems',
      description: 'Different verification systems report conflicting launch readiness signals',
      severity: 'HIGH',
      detectionCode: 'READINESS_MISMATCH',
      sourceVerifier: 'launch-readiness-continuity-verifier',
      connectedSystems: ['UVL', 'Visual QA', 'Auto-Polish', 'Live Preview'],
    }));
  }
  if (!upstream.founderAlphaReady && baseScore < 70) {
    gaps.push(createExperienceGap({
      title: 'Founder Alpha readiness not met',
      description: 'Experience continuity insufficient for founder alpha launch',
      severity: 'MEDIUM',
      detectionCode: 'LAUNCH_CONTINUITY_RISK',
      sourceVerifier: 'launch-readiness-continuity-verifier',
      connectedSystems: ['Product Experience'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);
  const readinessLevel = resolveReadinessLevel(continuityScore, upstream.criticalGapCount);

  const result: LaunchReadinessContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: LAUNCH_READINESS_CONTINUITY_PASS,
    readinessLevel,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getLaunchReadinessVerifyCount(): number {
  return verifyCount;
}

export function resetLaunchReadinessContinuityVerifierForTests(): void {
  verifyCount = 0;
}

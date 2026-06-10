/**
 * Product Experience Verification Engine — founder experience verifier.
 */

import type { FounderExperienceVerification, ProductExperienceInput } from './product-experience-types.js';
import { FOUNDER_EXPERIENCE_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface FounderExperienceUpstream {
  founderUsabilityScore: number;
  actionReadinessScore: number;
  launchReadinessPerceptionScore: number;
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  founderFrictionRiskCount: number;
}

let verifyCount = 0;

export function verifyFounderExperience(
  input: ProductExperienceInput,
  upstream: FounderExperienceUpstream,
): FounderExperienceVerification {
  const cacheKey = [input.requestId, upstream.founderUsabilityScore, input.founderExperienceBreak].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === FOUNDER_EXPERIENCE_PASS) return cached as FounderExperienceVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.founderUsabilityScore + upstream.actionReadinessScore + upstream.launchReadinessPerceptionScore) / 3
      - upstream.founderFrictionRiskCount * 2,
  );

  if (input.founderExperienceBreak === true || baseScore < 78) {
    detectionCodes.push('FOUNDER_EXPERIENCE_BREAK');
    gaps.push(createExperienceGap({
      title: 'Founder experience break',
      description: 'Lungelo cannot consistently understand progress, readiness, or next actions',
      severity: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'FOUNDER_EXPERIENCE_BREAK',
      sourceVerifier: 'founder-experience-verifier',
      connectedSystems: ['Chat', 'Operator Feed', 'Reports', 'UVL'],
    }));
  }
  if (input.founderClarityGap === true) {
    detectionCodes.push('FOUNDER_CLARITY_GAP');
    gaps.push(createExperienceGap({
      title: 'Founder clarity gap',
      description: 'Progress and readiness signals are ambiguous or contradictory',
      severity: 'HIGH',
      detectionCode: 'FOUNDER_CLARITY_GAP',
      sourceVerifier: 'founder-experience-verifier',
      connectedSystems: ['Reports', 'Operator Feed'],
    }));
  }
  if (input.founderConfidenceRisk === true) {
    detectionCodes.push('FOUNDER_CONFIDENCE_RISK');
    gaps.push(createExperienceGap({
      title: 'Founder confidence risk',
      description: 'Recommendations or readiness claims may not earn founder trust',
      severity: 'HIGH',
      detectionCode: 'FOUNDER_CONFIDENCE_RISK',
      sourceVerifier: 'founder-experience-verifier',
      connectedSystems: ['Chat', 'Intelligence Console'],
    }));
  }
  if (!upstream.chatPresent) {
    gaps.push(createExperienceGap({
      title: 'Chat disconnected from founder workflow',
      description: 'Founder cannot direct work through chat as primary command surface',
      severity: 'MEDIUM',
      detectionCode: 'FOUNDER_EXPERIENCE_BREAK',
      sourceVerifier: 'founder-experience-verifier',
      connectedSystems: ['Chat'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: FounderExperienceVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: FOUNDER_EXPERIENCE_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getFounderExperienceVerifyCount(): number {
  return verifyCount;
}

export function resetFounderExperienceVerifierForTests(): void {
  verifyCount = 0;
}

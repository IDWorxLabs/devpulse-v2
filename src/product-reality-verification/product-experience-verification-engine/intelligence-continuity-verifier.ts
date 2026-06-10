/**
 * Product Experience Verification Engine — intelligence continuity verifier.
 */

import type { IntelligenceContinuityVerification, ProductExperienceInput } from './product-experience-types.js';
import { INTELLIGENCE_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface IntelligenceContinuityUpstream {
  intelligenceVisibilityScore: number;
  intelligencePerceptionScore: number;
  hiddenIntelligenceRiskCount: number;
  operatorFeedPresent: boolean;
  feedStreamPresent: boolean;
  recommendationsVisible: boolean;
}

let verifyCount = 0;

export function verifyIntelligenceContinuity(
  input: ProductExperienceInput,
  upstream: IntelligenceContinuityUpstream,
): IntelligenceContinuityVerification {
  const cacheKey = [input.requestId, upstream.intelligenceVisibilityScore, input.intelligenceFragmentation].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === INTELLIGENCE_CONTINUITY_PASS) return cached as IntelligenceContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.intelligenceVisibilityScore + upstream.intelligencePerceptionScore) / 2
      - upstream.hiddenIntelligenceRiskCount * 3,
  );

  if (input.intelligenceFragmentation === true || baseScore < 75) {
    detectionCodes.push('INTELLIGENCE_FRAGMENTATION');
    gaps.push(createExperienceGap({
      title: 'Intelligence fragmented across product',
      description: 'Recommendations, reasoning, risks, and next steps appear inconsistently',
      severity: baseScore < 60 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'INTELLIGENCE_FRAGMENTATION',
      sourceVerifier: 'intelligence-continuity-verifier',
      connectedSystems: ['Chat', 'Operator Feed', 'Reports', 'UVL'],
    }));
  }
  if (input.intelligenceVisibilityGaps === true || !upstream.recommendationsVisible) {
    detectionCodes.push('INTELLIGENCE_VISIBILITY_GAPS');
    gaps.push(createExperienceGap({
      title: 'Intelligence visibility gaps',
      description: 'Users cannot consistently see recommendations, reasoning, or detected risks',
      severity: 'HIGH',
      detectionCode: 'INTELLIGENCE_VISIBILITY_GAPS',
      sourceVerifier: 'intelligence-continuity-verifier',
      connectedSystems: ['Intelligence Console', 'Operator Feed'],
    }));
  }
  if (!upstream.operatorFeedPresent || !upstream.feedStreamPresent) {
    gaps.push(createExperienceGap({
      title: 'Operator feed intelligence disconnect',
      description: 'Intelligence outputs not continuously visible through operator feed',
      severity: 'MEDIUM',
      detectionCode: 'INTELLIGENCE_VISIBILITY_GAPS',
      sourceVerifier: 'intelligence-continuity-verifier',
      connectedSystems: ['Operator Feed', 'Chat'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: IntelligenceContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: INTELLIGENCE_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getIntelligenceContinuityVerifyCount(): number {
  return verifyCount;
}

export function resetIntelligenceContinuityVerifierForTests(): void {
  verifyCount = 0;
}

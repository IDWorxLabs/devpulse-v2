/**
 * Product Experience Verification Engine — trust continuity verifier.
 */

import type { ProductExperienceInput, TrustContinuityVerification } from './product-experience-types.js';
import { TRUST_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface TrustContinuityUpstream {
  trustworthinessScore: number;
  trustClarityScore: number;
  previewHonestyScore: number;
  trustRiskCount: number;
  evidenceVisibilityPresent: boolean;
}

let verifyCount = 0;

export function verifyTrustContinuity(
  input: ProductExperienceInput,
  upstream: TrustContinuityUpstream,
): TrustContinuityVerification {
  const cacheKey = [input.requestId, upstream.trustworthinessScore, input.trustFragmentation].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === TRUST_CONTINUITY_PASS) return cached as TrustContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.trustworthinessScore + upstream.trustClarityScore + upstream.previewHonestyScore) / 3
      - upstream.trustRiskCount * 3,
  );

  if (input.trustFragmentation === true || baseScore < 78) {
    detectionCodes.push('TRUST_FRAGMENTATION');
    gaps.push(createExperienceGap({
      title: 'Trust signals fragmented across experience',
      description: 'Honesty, consistency, evidence visibility, and completion clarity vary by surface',
      severity: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'TRUST_FRAGMENTATION',
      sourceVerifier: 'trust-continuity-verifier',
      connectedSystems: ['Reports', 'Preview', 'Operator Feed'],
    }));
  }
  if (input.trustGap === true) {
    detectionCodes.push('TRUST_GAP');
    gaps.push(createExperienceGap({
      title: 'Trust gap in product experience',
      description: 'Product overstates readiness or understates blocked states',
      severity: 'HIGH',
      detectionCode: 'TRUST_GAP',
      sourceVerifier: 'trust-continuity-verifier',
      connectedSystems: ['Live Preview', 'UVL', 'Reports'],
    }));
  }
  if (!upstream.evidenceVisibilityPresent) {
    gaps.push(createExperienceGap({
      title: 'Evidence visibility missing',
      description: 'Verification evidence not consistently visible throughout experience',
      severity: 'MEDIUM',
      detectionCode: 'TRUST_GAP',
      sourceVerifier: 'trust-continuity-verifier',
      connectedSystems: ['UVL', 'Reports'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: TrustContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: TRUST_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getTrustContinuityVerifyCount(): number {
  return verifyCount;
}

export function resetTrustContinuityVerifierForTests(): void {
  verifyCount = 0;
}

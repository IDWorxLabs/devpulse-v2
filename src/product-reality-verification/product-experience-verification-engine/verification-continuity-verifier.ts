/**
 * Product Experience Verification Engine — verification continuity verifier.
 */

import type { ProductExperienceInput, VerificationContinuityVerification } from './product-experience-types.js';
import { VERIFICATION_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface VerificationContinuityUpstream {
  visualQaScore: number;
  uxHeuristicScore: number;
  firstImpressionScore: number;
  livePreviewScore: number;
  autoPolishScore: number;
  uvlRowCount: number;
  previewReportConnectionScore: number;
}

let verifyCount = 0;

export function verifyVerificationContinuity(
  input: ProductExperienceInput,
  upstream: VerificationContinuityUpstream,
): VerificationContinuityVerification {
  const cacheKey = [input.requestId, upstream.visualQaScore, input.verificationSilo].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === VERIFICATION_CONTINUITY_PASS) return cached as VerificationContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.visualQaScore + upstream.uxHeuristicScore + upstream.firstImpressionScore
      + upstream.livePreviewScore + upstream.autoPolishScore) / 5,
  );

  if (input.verificationSilo === true || baseScore < 75) {
    detectionCodes.push('VERIFICATION_SILO');
    gaps.push(createExperienceGap({
      title: 'Verification systems operate in silos',
      description: 'UVL, Visual QA, UX Heuristics, First Impression, Preview, and Polish feel disconnected',
      severity: baseScore < 60 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'VERIFICATION_SILO',
      sourceVerifier: 'verification-continuity-verifier',
      connectedSystems: ['UVL', 'Visual QA', 'UX Heuristics', 'Live Preview', 'Auto-Polish'],
    }));
  }
  if (input.verificationDisconnection === true || upstream.previewReportConnectionScore < 70) {
    detectionCodes.push('VERIFICATION_DISCONNECTION');
    gaps.push(createExperienceGap({
      title: 'Preview disconnected from verification',
      description: 'Preview available but not connected to verification workflow or reports',
      severity: 'HIGH',
      detectionCode: 'VERIFICATION_DISCONNECTION',
      sourceVerifier: 'verification-continuity-verifier',
      connectedSystems: ['Live Preview', 'UVL', 'Reports'],
    }));
  }
  if (upstream.uvlRowCount < 50) {
    gaps.push(createExperienceGap({
      title: 'UVL verification surface incomplete',
      description: 'Unified Verification Lab does not fully represent verification chain',
      severity: 'MEDIUM',
      detectionCode: 'VERIFICATION_SILO',
      sourceVerifier: 'verification-continuity-verifier',
      connectedSystems: ['UVL'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: VerificationContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: VERIFICATION_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getVerificationContinuityVerifyCount(): number {
  return verifyCount;
}

export function resetVerificationContinuityVerifierForTests(): void {
  verifyCount = 0;
}

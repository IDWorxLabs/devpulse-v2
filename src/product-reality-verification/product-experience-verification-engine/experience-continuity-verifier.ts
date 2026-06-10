/**
 * Product Experience Verification Engine — experience continuity verifier.
 */

import type { ExperienceContinuityVerification, ProductExperienceInput } from './product-experience-types.js';
import { EXPERIENCE_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface ExperienceContinuityUpstream {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  notificationPresent: boolean;
  uvlDiscoverable: boolean;
  workflowContinuityScore: number;
  previewReportConnectionScore: number;
}

let verifyCount = 0;

export function verifyExperienceContinuity(
  input: ProductExperienceInput,
  upstream: ExperienceContinuityUpstream,
): ExperienceContinuityVerification {
  const cacheKey = [input.requestId, upstream.workflowContinuityScore, input.experienceBreak].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === EXPERIENCE_CONTINUITY_PASS) return cached as ExperienceContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const surfaceCount = [
    upstream.chatPresent,
    upstream.operatorFeedPresent,
    upstream.notificationPresent,
    upstream.uvlDiscoverable,
  ].filter(Boolean).length;
  const baseScore = Math.round((upstream.workflowContinuityScore + upstream.previewReportConnectionScore + surfaceCount * 20) / 3);

  if (input.experienceBreak === true || baseScore < 78) {
    detectionCodes.push('EXPERIENCE_BREAK');
    gaps.push(createExperienceGap({
      title: 'Experience break between product surfaces',
      description: 'Flow between chat, reports, preview, notifications, UVL, and operator feed has discontinuities',
      severity: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'EXPERIENCE_BREAK',
      sourceVerifier: 'experience-continuity-verifier',
      connectedSystems: ['Chat', 'Reports', 'Preview', 'Operator Feed'],
    }));
  }
  if (input.contextLoss === true) {
    detectionCodes.push('CONTEXT_LOSS');
    gaps.push(createExperienceGap({
      title: 'User context lost between transitions',
      description: 'Moving between surfaces drops prior task context or verification state',
      severity: 'HIGH',
      detectionCode: 'CONTEXT_LOSS',
      sourceVerifier: 'experience-continuity-verifier',
      connectedSystems: ['Navigation', 'UVL', 'Reports'],
    }));
  }
  if (input.journeyFragmentation === true) {
    detectionCodes.push('JOURNEY_FRAGMENTATION');
    gaps.push(createExperienceGap({
      title: 'User journey fragmented across systems',
      description: 'End-to-end journey feels like hopping between independent apps',
      severity: 'HIGH',
      detectionCode: 'JOURNEY_FRAGMENTATION',
      sourceVerifier: 'experience-continuity-verifier',
      connectedSystems: ['Chat', 'Verification', 'Preview', 'Reports'],
    }));
  }
  if (!upstream.chatPresent || !upstream.operatorFeedPresent) {
    gaps.push(createExperienceGap({
      title: 'Chat-to-feed continuity gap',
      description: 'Chat and operator feed must feel like one continuous intelligence stream',
      severity: 'MEDIUM',
      detectionCode: 'EXPERIENCE_BREAK',
      sourceVerifier: 'experience-continuity-verifier',
      connectedSystems: ['Chat', 'Operator Feed'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: ExperienceContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: EXPERIENCE_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getExperienceContinuityVerifyCount(): number {
  return verifyCount;
}

export function resetExperienceContinuityVerifierForTests(): void {
  verifyCount = 0;
}

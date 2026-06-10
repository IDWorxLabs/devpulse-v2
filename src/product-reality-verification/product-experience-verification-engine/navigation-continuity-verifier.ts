/**
 * Product Experience Verification Engine — navigation continuity verifier.
 */

import type { NavigationContinuityVerification, ProductExperienceInput } from './product-experience-types.js';
import { NAVIGATION_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface NavigationContinuityUpstream {
  navigationClarityScore: number;
  mobileNavPresent: boolean;
  mobileDrawerPresent: boolean;
  world2NavPresent: boolean;
  desktopRating: number;
  mobileRating: number;
  tabletRating: number;
}

let verifyCount = 0;

export function verifyNavigationContinuity(
  input: ProductExperienceInput,
  upstream: NavigationContinuityUpstream,
): NavigationContinuityVerification {
  const cacheKey = [input.requestId, upstream.navigationClarityScore, input.navigationFragmentation].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === NAVIGATION_CONTINUITY_PASS) return cached as NavigationContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const responsiveAvg = Math.round((upstream.desktopRating + upstream.mobileRating + upstream.tabletRating) / 3);
  const baseScore = Math.round((upstream.navigationClarityScore + responsiveAvg) / 2);

  if (input.navigationFragmentation === true || baseScore < 78) {
    detectionCodes.push('NAVIGATION_FRAGMENTATION');
    gaps.push(createExperienceGap({
      title: 'Navigation fragmented across surfaces',
      description: 'Desktop, tablet, mobile, World 2, and verification surfaces use inconsistent navigation patterns',
      severity: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'NAVIGATION_FRAGMENTATION',
      sourceVerifier: 'navigation-continuity-verifier',
      connectedSystems: ['Desktop', 'Mobile', 'World 2', 'UVL'],
    }));
  }
  if (input.navigationContextLoss === true) {
    detectionCodes.push('NAVIGATION_CONTEXT_LOSS');
    gaps.push(createExperienceGap({
      title: 'Navigation context lost on transition',
      description: 'User loses orientation when switching between product areas or viewports',
      severity: 'HIGH',
      detectionCode: 'NAVIGATION_CONTEXT_LOSS',
      sourceVerifier: 'navigation-continuity-verifier',
      connectedSystems: ['Navigation', 'World 2', 'Verification'],
    }));
  }
  if (!upstream.mobileNavPresent && upstream.mobileRating < 70) {
    gaps.push(createExperienceGap({
      title: 'Mobile navigation continuity gap',
      description: 'Mobile usage workflow lacks clear navigation continuity with desktop',
      severity: 'MEDIUM',
      detectionCode: 'NAVIGATION_FRAGMENTATION',
      sourceVerifier: 'navigation-continuity-verifier',
      connectedSystems: ['Mobile', 'Desktop'],
    }));
  }
  if (!upstream.world2NavPresent) {
    gaps.push(createExperienceGap({
      title: 'World 2 navigation disconnect',
      description: 'World 2 surfaces not clearly connected to main product navigation',
      severity: 'MEDIUM',
      detectionCode: 'NAVIGATION_CONTEXT_LOSS',
      sourceVerifier: 'navigation-continuity-verifier',
      connectedSystems: ['World 2', 'Command Center'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: NavigationContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: NAVIGATION_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getNavigationContinuityVerifyCount(): number {
  return verifyCount;
}

export function resetNavigationContinuityVerifierForTests(): void {
  verifyCount = 0;
}

/**
 * Product Experience Verification Engine — product identity continuity verifier.
 */

import type { ProductExperienceInput, ProductIdentityContinuityVerification } from './product-experience-types.js';
import { PRODUCT_IDENTITY_CONTINUITY_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface ProductIdentityContinuityUpstream {
  productIdentityScore: number;
  devPulseBrandingPresent: boolean;
  commandCenterSignalsPresent: boolean;
  intelligenceConsoleCapabilityCount: number;
}

let verifyCount = 0;

export function verifyProductIdentityContinuity(
  input: ProductExperienceInput,
  upstream: ProductIdentityContinuityUpstream,
): ProductIdentityContinuityVerification {
  const cacheKey = [input.requestId, upstream.productIdentityScore, input.productIdentityDrift].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === PRODUCT_IDENTITY_CONTINUITY_PASS) return cached as ProductIdentityContinuityVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const identitySignals = [
    upstream.devPulseBrandingPresent,
    upstream.commandCenterSignalsPresent,
    upstream.intelligenceConsoleCapabilityCount > 20,
  ].filter(Boolean).length;
  const baseScore = Math.round((upstream.productIdentityScore + identitySignals * 25) / 2);

  if (input.productIdentityDrift === true || baseScore < 78) {
    detectionCodes.push('PRODUCT_IDENTITY_DRIFT');
    gaps.push(createExperienceGap({
      title: 'Product identity drifts across areas',
      description: 'DevPulse does not consistently feel like an AI Development Command Center',
      severity: baseScore < 65 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'PRODUCT_IDENTITY_DRIFT',
      sourceVerifier: 'product-identity-continuity-verifier',
      connectedSystems: ['Founder Reality UI', 'World 2', 'Intelligence Console'],
    }));
  }
  if (input.genericToolFeel === true) {
    detectionCodes.push('GENERIC_TOOL_FEEL');
    gaps.push(createExperienceGap({
      title: 'Generic tool feel instead of command center',
      description: 'Product areas feel like disconnected generic utilities rather than unified command center',
      severity: 'HIGH',
      detectionCode: 'GENERIC_TOOL_FEEL',
      sourceVerifier: 'product-identity-continuity-verifier',
      connectedSystems: ['Chat', 'UVL', 'Verification'],
    }));
  }
  if (!upstream.devPulseBrandingPresent) {
    gaps.push(createExperienceGap({
      title: 'DevPulse branding not consistently visible',
      description: 'Product identity anchor missing from key surfaces',
      severity: 'MEDIUM',
      detectionCode: 'PRODUCT_IDENTITY_DRIFT',
      sourceVerifier: 'product-identity-continuity-verifier',
      connectedSystems: ['Founder Reality UI'],
    }));
  }

  const penalty = gaps.length * 4;
  const continuityScore = clampScore(baseScore - penalty);

  const result: ProductIdentityContinuityVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: PRODUCT_IDENTITY_CONTINUITY_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getProductIdentityVerifyCount(): number {
  return verifyCount;
}

export function resetProductIdentityContinuityVerifierForTests(): void {
  verifyCount = 0;
}

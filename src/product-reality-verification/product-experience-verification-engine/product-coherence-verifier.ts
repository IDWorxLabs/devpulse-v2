/**
 * Product Experience Verification Engine — product coherence verifier.
 */

import type { ProductCoherenceVerification, ProductExperienceInput } from './product-experience-types.js';
import { PRODUCT_COHERENCE_PASS, clampScore } from './product-experience-types.js';
import { boundGaps, createExperienceGap } from './experience-gap-model.js';
import { getCachedVerifierResult, setCachedVerifierResult } from './product-experience-cache.js';

export interface ProductCoherenceUpstream {
  visualQaScore: number;
  uxScore: number;
  firstImpressionScore: number;
  autoPolishCoherenceScore: number;
  devPulseBrandingPresent: boolean;
  capabilityCount: number;
}

let verifyCount = 0;

export function verifyProductCoherence(
  input: ProductExperienceInput,
  upstream: ProductCoherenceUpstream,
): ProductCoherenceVerification {
  const cacheKey = [input.requestId, upstream.visualQaScore, input.productFragmented].join('|');
  const cached = getCachedVerifierResult(cacheKey);
  if (cached && cached.passToken === PRODUCT_COHERENCE_PASS) return cached as ProductCoherenceVerification;

  verifyCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    (upstream.visualQaScore + upstream.uxScore + upstream.firstImpressionScore + upstream.autoPolishCoherenceScore) / 4,
  );

  if (input.productFragmented === true || baseScore < 75) {
    detectionCodes.push('PRODUCT_FRAGMENTATION');
    gaps.push(createExperienceGap({
      title: 'Product feels fragmented across surfaces',
      description: 'Visual QA, UX, and first-impression signals do not converge into one product feel',
      severity: baseScore < 60 ? 'CRITICAL' : 'HIGH',
      detectionCode: 'PRODUCT_FRAGMENTATION',
      sourceVerifier: 'product-coherence-verifier',
      connectedSystems: ['Visual QA', 'UX Heuristics', 'First Impression'],
    }));
  }
  if (input.disconnectedExperience === true) {
    detectionCodes.push('DISCONNECTED_EXPERIENCE');
    gaps.push(createExperienceGap({
      title: 'Disconnected experience between product areas',
      description: 'Chat, reports, preview, and verification feel like separate tools',
      severity: 'HIGH',
      detectionCode: 'DISCONNECTED_EXPERIENCE',
      sourceVerifier: 'product-coherence-verifier',
      connectedSystems: ['Chat', 'Reports', 'Preview', 'UVL'],
    }));
  }
  if (input.duplicatedConcepts === true || upstream.capabilityCount > 80) {
    detectionCodes.push('DUPLICATED_CONCEPTS');
    gaps.push(createExperienceGap({
      title: 'Duplicated concepts across product areas',
      description: 'Similar capabilities or labels appear in multiple disconnected places',
      severity: 'MEDIUM',
      detectionCode: 'DUPLICATED_CONCEPTS',
      sourceVerifier: 'product-coherence-verifier',
      connectedSystems: ['Intelligence Console', 'Find Panel', 'UVL'],
    }));
  }
  if (!upstream.devPulseBrandingPresent) {
    gaps.push(createExperienceGap({
      title: 'Weak product identity anchoring',
      description: 'DevPulse branding and command-center identity not consistently visible',
      severity: 'MEDIUM',
      detectionCode: 'PRODUCT_FRAGMENTATION',
      sourceVerifier: 'product-coherence-verifier',
      connectedSystems: ['Founder Reality UI'],
    }));
  }

  const penalty = gaps.length * 5;
  const continuityScore = clampScore(baseScore - penalty);

  const result: ProductCoherenceVerification = {
    continuityScore,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: PRODUCT_COHERENCE_PASS,
  };
  setCachedVerifierResult(cacheKey, result);
  return result;
}

export function getProductCoherenceVerifyCount(): number {
  return verifyCount;
}

export function resetProductCoherenceVerifierForTests(): void {
  verifyCount = 0;
}

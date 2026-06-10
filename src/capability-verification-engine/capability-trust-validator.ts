/**
 * Capability Verification Engine — trust validator.
 */

import type { CapabilityTrustValidation, CapabilityVerificationInput } from './capability-verification-types.js';
import { getCachedTrustValidation, setCachedTrustValidation } from './capability-verification-cache.js';

let trustValidationCount = 0;

export function validateCapabilityTrust(input: CapabilityVerificationInput): CapabilityTrustValidation {
  const cacheKey = [
    input.proposedCapability,
    input.trustImpact ?? false,
    input.world2Impact ?? false,
  ].join('|');

  const cached = getCachedTrustValidation(cacheKey);
  if (cached) return cached;

  trustValidationCount += 1;

  const trustFindings: string[] = [];
  let trustScore = 80;

  if (input.trustImpact) {
    trustScore -= 25;
    trustFindings.push('trust_impact_detected');
  }
  if (input.world2Impact) {
    trustScore -= 20;
    trustFindings.push('world2_governance_impact');
  }
  if (input.signals?.includes('governance:critical')) {
    trustScore -= 15;
    trustFindings.push('governance_impact');
  }
  if (input.signals?.includes('safety:critical')) {
    trustScore -= 20;
    trustFindings.push('safety_impact');
  }

  const requiresReview = input.trustImpact === true
    || input.world2Impact === true
    || trustScore < 60;

  const result: CapabilityTrustValidation = {
    trustScore: Math.max(0, Math.min(100, trustScore)),
    trustFindings,
    requiresReview,
  };

  setCachedTrustValidation(cacheKey, result);
  return result;
}

export function getTrustValidationCount(): number {
  return trustValidationCount;
}

export function resetTrustValidatorForTests(): void {
  trustValidationCount = 0;
}

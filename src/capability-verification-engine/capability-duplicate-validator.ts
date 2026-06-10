/**
 * Capability Verification Engine — duplicate validator.
 */

import { analyzeCapabilitySimilarity } from '../capability-research-engine/capability-similarity-analyzer.js';
import type { CapabilityDuplicateValidation, CapabilityVerificationInput } from './capability-verification-types.js';
import { getCachedDuplicateValidation, setCachedDuplicateValidation } from './capability-verification-cache.js';

let duplicateCheckCount = 0;

export function validateCapabilityDuplicates(input: CapabilityVerificationInput): CapabilityDuplicateValidation {
  const cacheKey = input.proposedCapability.toLowerCase();
  const cached = getCachedDuplicateValidation(cacheKey);
  if (cached) return cached;

  duplicateCheckCount += 1;

  const similarity = analyzeCapabilitySimilarity({ proposedCapability: input.proposedCapability });

  const result: CapabilityDuplicateValidation = {
    duplicateScore: similarity.similarityScore,
    duplicateCandidates: similarity.existingCandidates,
    duplicateRisk: similarity.duplicateRisk,
    isDuplicate: similarity.duplicateRisk === 'DUPLICATE' || similarity.duplicateRisk === 'HIGH',
  };

  setCachedDuplicateValidation(cacheKey, result);
  return result;
}

export function getDuplicateCheckCount(): number {
  return duplicateCheckCount;
}

export function resetDuplicateValidatorForTests(): void {
  duplicateCheckCount = 0;
}

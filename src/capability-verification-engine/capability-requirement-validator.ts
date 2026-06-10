/**
 * Capability Verification Engine — requirement validator.
 */

import type { CapabilityRequirementValidation, CapabilityVerificationInput } from './capability-verification-types.js';
import { getCachedRequirementValidation, setCachedRequirementValidation } from './capability-verification-cache.js';

let requirementValidationCount = 0;

const REQUIRED_CHECKS = [
  'scope_defined',
  'integrations_defined',
  'validation_coverage',
  'ownership_boundary',
] as const;

export function validateCapabilityRequirements(input: CapabilityVerificationInput): CapabilityRequirementValidation {
  const cacheKey = [
    input.proposedCapability,
    input.scopeCovered ?? false,
    (input.integrationPoints ?? []).length,
    (input.validationRequirements ?? []).length,
    input.coverageScore ?? -1,
  ].join('|');

  const cached = getCachedRequirementValidation(cacheKey);
  if (cached) return cached;

  requirementValidationCount += 1;

  const missingRequirements: string[] = [];
  let covered = 0;

  if (input.scopeCovered !== false && input.proposedCapability.length > 0) {
    covered += 1;
  } else {
    missingRequirements.push('scope_defined');
  }

  if ((input.integrationPoints ?? []).length > 0 || (input.signals ?? []).includes('integrations:complete')) {
    covered += 1;
  } else {
    missingRequirements.push('integrations_defined');
  }

  if ((input.validationRequirements ?? []).length > 0 || (input.signals ?? []).includes('validation:complete')) {
    covered += 1;
  } else {
    missingRequirements.push('validation_coverage');
  }

  if (input.signals?.includes('ownership:defined') || input.proposedCapability.length > 3) {
    covered += 1;
  } else {
    missingRequirements.push('ownership_boundary');
  }

  const coverageScore = input.coverageScore ?? Math.round((covered / REQUIRED_CHECKS.length) * 100);
  const complete = coverageScore >= 90 && missingRequirements.length === 0;

  const result: CapabilityRequirementValidation = {
    coverageScore,
    missingRequirements,
    complete,
  };

  setCachedRequirementValidation(cacheKey, result);
  return result;
}

export function getRequirementValidationCount(): number {
  return requirementValidationCount;
}

export function resetRequirementValidatorForTests(): void {
  requirementValidationCount = 0;
}

/**
 * Founder Trust Validation — governance compliance validator.
 */

import type { FounderTrustValidationInput, GovernanceComplianceValidation } from './founder-trust-types.js';
import { GOVERNANCE_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface GovernanceComplianceUpstream {
  userControlScore: number;
  readOnlyValidation: boolean;
  governanceBlocked: boolean;
  safetyControlScore: number;
}

let validateCount = 0;

export function validateGovernanceCompliance(
  input: FounderTrustValidationInput,
  upstream: GovernanceComplianceUpstream,
): GovernanceComplianceValidation {
  const cacheKey = [input.requestId, upstream.userControlScore, input.governanceViolation].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === GOVERNANCE_TRUST_PASS) return cached as GovernanceComplianceValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round((upstream.userControlScore + upstream.safetyControlScore) / 2);

  if (input.governanceViolation === true || input.governanceBlocked === true || baseScore < 70) {
    detectionCodes.push('GOVERNANCE_TRUST');
    gaps.push(createTrustGap({
      title: 'Governance boundaries may not be respected',
      description: 'Founder approvals, execution restrictions, or authority chains may be violated',
      severity: input.governanceBlocked ? 'CRITICAL' : baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'GOVERNANCE_TRUST',
      sourceValidator: 'governance-compliance-validator',
      trustContext: 'GOVERNANCE_TRUST',
    }));
  }
  if (!upstream.readOnlyValidation) {
    gaps.push(createTrustGap({
      title: 'Validation may not enforce read-only governance',
      description: 'Trust validation cannot guarantee no state mutation during evaluation',
      severity: 'CRITICAL',
      detectionCode: 'GOVERNANCE_TRUST_GAPS',
      sourceValidator: 'governance-compliance-validator',
      trustContext: 'GOVERNANCE_TRUST',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 6);
  const result: GovernanceComplianceValidation = {
    validatorType: 'GOVERNANCE_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: GOVERNANCE_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getGovernanceValidateCount(): number {
  return validateCount;
}

export function resetGovernanceComplianceValidatorForTests(): void {
  validateCount = 0;
}

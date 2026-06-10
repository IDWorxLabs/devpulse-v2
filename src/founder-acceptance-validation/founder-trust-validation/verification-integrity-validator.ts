/**
 * Founder Trust Validation — verification integrity validator.
 */

import type { FounderTrustValidationInput, VerificationIntegrityValidation } from './founder-trust-types.js';
import { VERIFICATION_TRUST_PASS, clampScore } from './founder-trust-types.js';
import { boundGaps, createTrustGap } from './trust-gap-model.js';
import { getCachedValidatorResult, setCachedValidatorResult } from './founder-trust-cache.js';

export interface VerificationIntegrityUpstream {
  uvlRowCount: number;
  authorityConflictCount: number;
  validationEvidenceScore: number;
  verificationSiloRisk: boolean;
}

let validateCount = 0;

export function validateVerificationIntegrity(
  input: FounderTrustValidationInput,
  upstream: VerificationIntegrityUpstream,
): VerificationIntegrityValidation {
  const cacheKey = [input.requestId, upstream.validationEvidenceScore, input.verificationIntegrityWeak].join('|');
  const cached = getCachedValidatorResult(cacheKey);
  if (cached && cached.passToken === VERIFICATION_TRUST_PASS) return cached as VerificationIntegrityValidation;

  validateCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const baseScore = Math.round(
    upstream.validationEvidenceScore - upstream.authorityConflictCount * 5
      + (upstream.uvlRowCount > 50 ? 5 : 0),
  );

  if (input.verificationIntegrityWeak === true || input.unsupportedPassClaims === true || baseScore < 70) {
    detectionCodes.push('VERIFICATION_TRUST');
    gaps.push(createTrustGap({
      title: 'Verification pass claims may lack integrity',
      description: 'Validation evidence missing, pass claims unsupported, or chain inconsistent',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'VERIFICATION_TRUST',
      sourceValidator: 'verification-integrity-validator',
      trustContext: 'VERIFICATION_TRUST',
    }));
  }
  if (upstream.authorityConflictCount > 0) {
    gaps.push(createTrustGap({
      title: 'Verification chain has authority conflicts',
      description: 'Conflicting authority signals undermine verification integrity',
      severity: 'MAJOR',
      detectionCode: 'VERIFICATION_TRUST_GAPS',
      sourceValidator: 'verification-integrity-validator',
      trustContext: 'VERIFICATION_TRUST',
    }));
  }
  if (upstream.verificationSiloRisk) {
    gaps.push(createTrustGap({
      title: 'Verification silo risk detected',
      description: 'Verification subsystems may not share consistent evidence',
      severity: 'MINOR',
      detectionCode: 'VERIFICATION_TRUST_GAPS',
      sourceValidator: 'verification-integrity-validator',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 5);
  const result: VerificationIntegrityValidation = {
    validatorType: 'VERIFICATION_TRUST',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: VERIFICATION_TRUST_PASS,
  };
  setCachedValidatorResult(cacheKey, result);
  return result;
}

export function getVerificationValidateCount(): number {
  return validateCount;
}

export function resetVerificationIntegrityValidatorForTests(): void {
  validateCount = 0;
}

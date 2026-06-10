/**
 * Reality Verification Expansion — claim validator.
 */

import type {
  ClaimSupportStatus,
  ClaimValidation,
  RawRealityClaimInput,
  RawRealityEvidenceInput,
  RealityClaimType,
  RealityRecord,
} from './reality-verification-types.js';
import { getCachedClaimValidation, setCachedClaimValidation } from './reality-verification-cache.js';

let claimValidationCount = 0;

function resolveClaimType(claimType: string): RealityClaimType {
  const normalized = claimType.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const types: RealityClaimType[] = [
    'build_completed', 'verification_passed', 'trust_established',
    'completion_verified', 'project_healthy', 'governance_approved',
  ];
  return types.includes(normalized as RealityClaimType) ? (normalized as RealityClaimType) : 'build_completed';
}

function evaluateClaimSupport(
  input: RawRealityClaimInput,
  evidence: RawRealityEvidenceInput[],
): { status: ClaimSupportStatus; confidence: number; reason: string } {
  const claimType = resolveClaimType(String(input.claimType));
  const strength = input.strength ?? 50;
  const trustLevel = input.trustLevel ?? 50;
  const verificationState = (input.verificationState ?? 'UNKNOWN').toString().toUpperCase();

  const relevantEvidence = evidence.filter((e) => {
    const claim = (e.claim ?? '').toLowerCase();
    return claim.includes(claimType.replace(/_/g, ' ').split(' ')[0]) || claim.includes(claimType);
  });

  const contradicting = relevantEvidence.some((e) => e.contradictsClaim === true)
    || relevantEvidence.some((e) => (e.strength ?? 50) < 25 && (e.trustworthiness ?? 50) < 25);

  if (contradicting) {
    return { status: 'CONTRADICTED', confidence: Math.max(0, 100 - strength), reason: 'Evidence contradicts claim' };
  }

  const supporting = relevantEvidence.filter((e) => e.supportsClaim !== false && (e.strength ?? 0) >= 50);

  switch (claimType) {
    case 'build_completed':
    case 'completion_verified':
      if (strength >= 80 && verificationState === 'VERIFIED' && supporting.length > 0) {
        return { status: 'SUPPORTED', confidence: strength, reason: 'Completion evidence verified' };
      }
      if (strength >= 50 || supporting.length > 0) {
        return { status: 'PARTIALLY_SUPPORTED', confidence: strength, reason: 'Partial completion evidence' };
      }
      return { status: 'UNSUPPORTED', confidence: strength, reason: 'Insufficient completion proof' };

    case 'verification_passed':
      if (verificationState === 'VERIFIED' && strength >= 70) {
        return { status: 'SUPPORTED', confidence: strength, reason: 'Verification state confirmed' };
      }
      if (verificationState === 'PARTIAL' || strength >= 45) {
        return { status: 'PARTIALLY_SUPPORTED', confidence: strength, reason: 'Partial verification support' };
      }
      return { status: 'UNSUPPORTED', confidence: strength, reason: 'Verification not substantiated' };

    case 'trust_established':
      if (trustLevel >= 75 && strength >= 60) {
        return { status: 'SUPPORTED', confidence: trustLevel, reason: 'Trust level established' };
      }
      if (trustLevel >= 45) {
        return { status: 'PARTIALLY_SUPPORTED', confidence: trustLevel, reason: 'Partial trust establishment' };
      }
      return { status: 'UNSUPPORTED', confidence: trustLevel, reason: 'Trust not established' };

    case 'project_healthy':
      if (input.monitoringHealthy === true && strength >= 65) {
        return { status: 'SUPPORTED', confidence: strength, reason: 'Monitoring confirms health' };
      }
      if (input.monitoringHealthy === false) {
        return { status: 'CONTRADICTED', confidence: 20, reason: 'Monitoring contradicts health claim' };
      }
      if (strength >= 40) {
        return { status: 'PARTIALLY_SUPPORTED', confidence: strength, reason: 'Limited health evidence' };
      }
      return { status: 'UNSUPPORTED', confidence: strength, reason: 'Health claim unsubstantiated' };

    case 'governance_approved':
      if (input.governanceApproved === true && strength >= 70) {
        return { status: 'SUPPORTED', confidence: strength, reason: 'Governance approval confirmed' };
      }
      if (input.governanceApproved === false) {
        return { status: 'CONTRADICTED', confidence: 15, reason: 'Governance rejected claim' };
      }
      if (strength >= 45) {
        return { status: 'PARTIALLY_SUPPORTED', confidence: strength, reason: 'Partial governance support' };
      }
      return { status: 'UNSUPPORTED', confidence: strength, reason: 'Governance approval missing' };

    default:
      if (strength >= 70) return { status: 'SUPPORTED', confidence: strength, reason: 'Claim supported by strength' };
      if (strength >= 40) return { status: 'PARTIALLY_SUPPORTED', confidence: strength, reason: 'Partial claim support' };
      return { status: 'UNSUPPORTED', confidence: strength, reason: 'Claim unsupported' };
  }
}

export function validateClaim(
  input: RawRealityClaimInput,
  evidence: RawRealityEvidenceInput[] = [],
): ClaimValidation {
  const cacheKey = [
    input.claimType,
    input.strength ?? 0,
    input.trustLevel ?? 0,
    input.verificationState ?? '',
    evidence.length,
  ].join('|');

  const cached = getCachedClaimValidation(cacheKey);
  if (cached) return cached;

  claimValidationCount += 1;
  const claimType = resolveClaimType(String(input.claimType));
  const result = evaluateClaimSupport(input, evidence);

  const validation: ClaimValidation = {
    claimType,
    supportStatus: result.status,
    confidence: result.confidence,
    reason: result.reason,
  };

  setCachedClaimValidation(cacheKey, validation);
  return validation;
}

export function validateClaims(
  inputs: RawRealityClaimInput[],
  evidence: RawRealityEvidenceInput[] = [],
): ClaimValidation[] {
  return inputs.map((input) => validateClaim(input, evidence));
}

export function validateClaimsFromRecords(
  records: RealityRecord[],
  evidence: RawRealityEvidenceInput[] = [],
): ClaimValidation[] {
  return records.map((record) => validateClaim({
    claimType: record.claimType,
    source: record.source,
    strength: record.strength,
    trustLevel: record.trustLevel,
    verificationState: record.verificationState,
    claim: record.claim,
  }, evidence));
}

export function getClaimValidationCount(): number {
  return claimValidationCount;
}

export function resetClaimValidatorForTests(): void {
  claimValidationCount = 0;
}

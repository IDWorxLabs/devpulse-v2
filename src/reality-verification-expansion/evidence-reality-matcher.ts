/**
 * Reality Verification Expansion — evidence-reality matcher.
 */

import type {
  RawRealityClaimInput,
  RawRealityEvidenceInput,
  RealityRecord,
} from './reality-verification-types.js';

let matchingCount = 0;

export interface RealityMatchResult {
  matched: boolean;
  mismatchType?: 'evidence' | 'trust' | 'verification' | 'monitoring' | 'completion' | 'governance';
  description: string;
  alignmentScore: number;
}

export function matchEvidenceToReality(
  claim: RawRealityClaimInput,
  evidence: RawRealityEvidenceInput[],
): RealityMatchResult {
  matchingCount += 1;

  const claimType = String(claim.claimType).toLowerCase();
  const relevant = evidence.filter((e) => {
    const ec = (e.claim ?? '').toLowerCase();
    return ec.includes(claimType.split('_')[0]) || ec.includes(claimType);
  });

  if (relevant.length === 0) {
    return { matched: false, mismatchType: 'evidence', description: 'No matching evidence found', alignmentScore: 0 };
  }

  const contradicting = relevant.filter((e) => e.contradictsClaim === true);
  if (contradicting.length > 0) {
    return { matched: false, mismatchType: 'evidence', description: 'Evidence contradicts claim', alignmentScore: 10 };
  }

  const avgStrength = relevant.reduce((s, e) => s + (e.strength ?? 50), 0) / relevant.length;
  const avgTrust = relevant.reduce((s, e) => s + (e.trustworthiness ?? 50), 0) / relevant.length;
  const claimStrength = claim.strength ?? 50;
  const claimTrust = claim.trustLevel ?? 50;

  const strengthDelta = Math.abs(avgStrength - claimStrength);
  const trustDelta = Math.abs(avgTrust - claimTrust);

  if (strengthDelta > 35) {
    return {
      matched: false,
      mismatchType: 'completion',
      description: 'Claim strength mismatches evidence',
      alignmentScore: Math.max(0, 100 - strengthDelta),
    };
  }

  if (trustDelta > 35) {
    return {
      matched: false,
      mismatchType: 'trust',
      description: 'Trust level mismatches evidence',
      alignmentScore: Math.max(0, 100 - trustDelta),
    };
  }

  const verificationState = (claim.verificationState ?? 'UNKNOWN').toString().toUpperCase();
  const supporting = relevant.filter((e) => e.supportsClaim !== false);
  if (verificationState === 'VERIFIED' && supporting.length === 0) {
    return {
      matched: false,
      mismatchType: 'verification',
      description: 'Verified claim lacks supporting evidence',
      alignmentScore: 25,
    };
  }

  if (claim.monitoringHealthy === false && avgStrength >= 70) {
    return {
      matched: false,
      mismatchType: 'monitoring',
      description: 'Monitoring state contradicts strong evidence',
      alignmentScore: 20,
    };
  }

  if (claim.governanceApproved === false && avgTrust >= 70) {
    return {
      matched: false,
      mismatchType: 'governance',
      description: 'Governance state contradicts trust evidence',
      alignmentScore: 15,
    };
  }

  const alignmentScore = Math.round(100 - strengthDelta * 0.6 - trustDelta * 0.4 + supporting.length * 8);
  const matched = strengthDelta <= 35 && trustDelta <= 35 && supporting.length > 0;
  return {
    matched,
    description: matched ? 'Claim aligns with evidence' : 'Claim partially aligns with evidence',
    alignmentScore: Math.max(0, Math.min(100, alignmentScore)),
  };
}

export function matchRecordsToEvidence(
  records: RealityRecord[],
  evidence: RawRealityEvidenceInput[],
): RealityMatchResult[] {
  return records.map((record) => matchEvidenceToReality({
    claimType: record.claimType,
    strength: record.strength,
    trustLevel: record.trustLevel,
    verificationState: record.verificationState,
    monitoringHealthy: record.category === 'MONITORING' ? record.strength >= 60 : undefined,
    governanceApproved: record.category === 'GOVERNANCE' ? record.strength >= 60 : undefined,
    claim: record.claim,
  }, evidence));
}

export function getMatchingCount(): number {
  return matchingCount;
}

export function resetEvidenceRealityMatcherForTests(): void {
  matchingCount = 0;
}

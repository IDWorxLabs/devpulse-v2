/**
 * Reality Verification Expansion — reality gap analyzer.
 */

import type { ClaimValidation, RealityGap, RealityRecord } from './reality-verification-types.js';

let gapAnalysisCount = 0;

const EXPECTED_CLAIMS = [
  'verification_passed',
  'completion_verified',
  'trust_established',
  'governance_approved',
] as const;

export function analyzeRealityGaps(
  records: RealityRecord[],
  validations: ClaimValidation[],
): RealityGap[] {
  gapAnalysisCount += 1;
  const gaps: RealityGap[] = [];

  const presentClaims = new Set(validations.map((v) => v.claimType));
  for (const claimType of EXPECTED_CLAIMS) {
    if (!presentClaims.has(claimType)) {
      gaps.push({
        gapType: 'missing_proof',
        claimType,
        description: `Missing proof for claim: ${claimType}`,
      });
    }
  }

  for (const validation of validations) {
    if (validation.supportStatus === 'UNSUPPORTED') {
      gaps.push({
        gapType: 'insufficient_proof',
        claimType: validation.claimType,
        description: validation.reason,
      });
    }
    if (validation.supportStatus === 'CONTRADICTED') {
      gaps.push({
        gapType: 'contradicted_proof',
        claimType: validation.claimType,
        description: validation.reason,
      });
    }
    if (validation.supportStatus === 'PARTIALLY_SUPPORTED') {
      gaps.push({
        gapType: 'insufficient_proof',
        claimType: validation.claimType,
        description: `Partial proof: ${validation.reason}`,
      });
    }
  }

  for (const record of records) {
    if (record.verificationState === 'UNVERIFIED') {
      gaps.push({
        gapType: 'unverified_claim',
        claimType: record.claimType,
        description: `Unverified claim from ${record.source}`,
      });
    }
    if (record.trustLevel < 30) {
      gaps.push({
        gapType: 'untrusted_claim',
        claimType: record.claimType,
        description: `Untrusted claim from ${record.source}`,
      });
    }
  }

  return gaps;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetRealityGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}

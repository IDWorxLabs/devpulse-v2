/**
 * Phase 26.71 — Truth reconciler (V1).
 * Maps consistency audit claims into reconciled truth claims with launch impact.
 */

import type { ConsistencyClaimAudit } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import { FOUNDER_TRUTH_MATRIX_RECONCILIATION_OPERATION } from './founder-truth-matrix-integration-registry.js';
import type {
  FounderTruthMatrixReconciliation,
  ReconciledTruthClaim,
  TruthMatrixLaunchImpact,
  TruthMatrixReconciliationRootCause,
} from './founder-truth-matrix-integration-types.js';

function mapRootCause(rootCause: ConsistencyClaimAudit['rootCause']): TruthMatrixReconciliationRootCause {
  return rootCause;
}

function deriveLaunchImpact(
  audit: ConsistencyClaimAudit,
): TruthMatrixLaunchImpact {
  if (audit.rootCause === 'SCORING_DEFECT' || audit.rootCause === 'STALE_EVIDENCE') {
    return 'NONE';
  }
  if (audit.rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {
    return audit.finalTruth === 'NOT_PROVEN' ? 'HIGH' : 'MEDIUM';
  }
  if (audit.rootCause === 'AUTHORITY_DISAGREEMENT') {
    if (audit.finalTruth === 'NOT_PROVEN') return 'MEDIUM';
    if (audit.finalTruth === 'PARTIAL') return 'LOW';
    return 'NONE';
  }
  if (audit.rootCause === 'REAL_PRODUCT_GAP') {
    if (audit.finalTruth === 'NOT_PROVEN') {
      return audit.claimId === 'LAUNCH_READINESS_VERDICT' || audit.claimId === 'IDEA_TO_LAUNCH'
        ? 'CRITICAL'
        : 'HIGH';
    }
    if (audit.finalTruth === 'PARTIAL') return 'MEDIUM';
    return 'LOW';
  }
  if (audit.finalTruth === 'NOT_PROVEN') return 'MEDIUM';
  if (audit.finalTruth === 'PARTIAL') return 'LOW';
  return 'NONE';
}

export function reconcileTruthClaims(
  claimAudits: ConsistencyClaimAudit[],
): ReconciledTruthClaim[] {
  return claimAudits.map((audit) => ({
    readOnly: true,
    claim: audit.claim,
    claimId: audit.claimId,
    authorityVerdicts: audit.authorityVerdicts.map((record) => ({
      authorityId: record.authorityId,
      displayName: record.displayName,
      verdict: record.verdict,
      detail: record.detail,
    })),
    truthMatrixVerdict: audit.finalTruth,
    rootCause: mapRootCause(audit.rootCause),
    launchImpact: deriveLaunchImpact(audit),
    contradictionDetected: audit.contradictionDetected,
    contradictionReason: audit.contradictionReason,
  }));
}

export function buildTruthMatrixReconciliation(
  claims: ReconciledTruthClaim[],
  preReconciliationVerdict: LaunchReadinessVerdict,
  postReconciliationVerdict: LaunchReadinessVerdict,
  overrideApplied: boolean,
  overrideReason: string | null,
  reconciliationId: string,
): FounderTruthMatrixReconciliation {
  const scoringDefectCount = claims.filter((c) => c.rootCause === 'SCORING_DEFECT').length;
  const authorityDisagreementCount = claims.filter((c) => c.rootCause === 'AUTHORITY_DISAGREEMENT').length;
  const propagationFailureCount = claims.filter(
    (c) => c.rootCause === 'EVIDENCE_PROPAGATION_FAILURE',
  ).length;
  const realProductGapCount = claims.filter((c) => c.rootCause === 'REAL_PRODUCT_GAP').length;
  const testingSystemDefectCount = scoringDefectCount + propagationFailureCount;

  const trustScoreBlocked = propagationFailureCount > 0;
  const productLaunchBlocked = claims.some(
    (c) => c.rootCause === 'REAL_PRODUCT_GAP' && c.truthMatrixVerdict === 'NOT_PROVEN',
  );

  return {
    readOnly: true,
    reconciliationId,
    generatedAt: new Date().toISOString(),
    operationId: FOUNDER_TRUTH_MATRIX_RECONCILIATION_OPERATION,
    claims,
    scoringDefectCount,
    authorityDisagreementCount,
    propagationFailureCount,
    realProductGapCount,
    testingSystemDefectCount,
    trustScoreBlocked,
    productLaunchBlocked,
    preReconciliationVerdict,
    postReconciliationVerdict,
    verdictOverrideApplied: overrideApplied,
    overrideReason,
  };
}

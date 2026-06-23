/**
 * Phase 26.71 — Founder Truth Matrix Integration types (V1).
 */

import type { FounderTestConsistencyAuditAssessment } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type {
  ConsistencyRootCause,
  ConsistencyVerdict,
} from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { FounderTestLaunchBlocker, FounderTestLaunchReadinessAssessment, LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';

export type TruthMatrixLaunchImpact = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TruthMatrixReconciliationRootCause =
  | 'SCORING_DEFECT'
  | 'AUTHORITY_DISAGREEMENT'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'REAL_PRODUCT_GAP'
  | 'STALE_EVIDENCE'
  | 'UNKNOWN';

export interface ReconciledTruthClaim {
  readOnly: true;
  claim: string;
  claimId: string;
  authorityVerdicts: Array<{
    authorityId: string;
    displayName: string;
    verdict: ConsistencyVerdict;
    detail: string;
  }>;
  truthMatrixVerdict: ConsistencyVerdict;
  rootCause: TruthMatrixReconciliationRootCause;
  launchImpact: TruthMatrixLaunchImpact;
  contradictionDetected: boolean;
  contradictionReason: string;
}

export interface FounderTruthMatrixReconciliation {
  readOnly: true;
  reconciliationId: string;
  generatedAt: string;
  operationId: 'FOUNDER_TRUTH_MATRIX_RECONCILIATION';
  claims: ReconciledTruthClaim[];
  scoringDefectCount: number;
  authorityDisagreementCount: number;
  propagationFailureCount: number;
  realProductGapCount: number;
  testingSystemDefectCount: number;
  trustScoreBlocked: boolean;
  productLaunchBlocked: boolean;
  preReconciliationVerdict: LaunchReadinessVerdict;
  postReconciliationVerdict: LaunchReadinessVerdict;
  verdictOverrideApplied: boolean;
  overrideReason: string | null;
}

export interface FounderTruthQuestionAnswer {
  readOnly: true;
  question: string;
  answer: ConsistencyVerdict;
  answerToken: 'TRUTH_MATRIX_FINAL_ANSWER';
  reason: string;
  rootCause: TruthMatrixReconciliationRootCause;
  launchImpact: TruthMatrixLaunchImpact;
}

export interface FounderTruthSummary {
  readOnly: true;
  sectionId: 'FOUNDER_TRUTH_SUMMARY';
  whatIsActuallyTrue: string[];
  whatIsActuallyBroken: string[];
  productGaps: string[];
  testingSystemGaps: string[];
  authorityDisagreements: string[];
  launchBlockingProductGaps: string[];
  nonBlockingTestingDefects: string[];
  launchBlockedByProduct: boolean;
  launchBlockedByTestingInfrastructure: boolean;
  founderQuestions: FounderTruthQuestionAnswer[];
}

export interface CategorizedLaunchBlockers {
  readOnly: true;
  launchBlockersProduct: FounderTestLaunchBlocker[];
  launchBlockersTesting: FounderTestLaunchBlocker[];
  launchBlockersAuthorityDisagreement: FounderTestLaunchBlocker[];
}

export interface FounderTruthMatrixIntegrationReport {
  readOnly: true;
  advisoryOnly: true;
  integrationId: string;
  generatedAt: string;
  coreQuestion: string;
  reconciliation: FounderTruthMatrixReconciliation;
  founderTruthSummary: FounderTruthSummary;
  categorizedBlockers: CategorizedLaunchBlockers;
  consistencyAuditCacheKey: string;
}

export interface FounderTruthMatrixIntegrationAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: FounderTruthMatrixIntegrationReport;
  cacheKey: string;
}

export interface AssessFounderTruthMatrixIntegrationInput {
  rootDir?: string;
  consistencyAudit?: FounderTestConsistencyAuditAssessment;
  preReconciliationVerdict?: LaunchReadinessVerdict;
  topBlockers?: FounderTestLaunchBlocker[];
  launchReadinessPreReconciliation?: FounderTestLaunchReadinessAssessment;
  skipConsistencyAudit?: boolean;
  skipHistoryRecording?: boolean;
}

export interface FounderTruthMatrixIntegrationHistoryEntry {
  readOnly: true;
  integrationId: string;
  generatedAt: string;
  productLaunchBlocked: boolean;
  testingSystemDefectCount: number;
  cacheKey: string;
}

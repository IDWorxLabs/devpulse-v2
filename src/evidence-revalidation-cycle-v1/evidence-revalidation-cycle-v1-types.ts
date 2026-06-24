/**
 * Evidence Revalidation Cycle V1 — types.
 */

export type EvidenceRevalidationStatus =
  | 'FRESH'
  | 'AGING'
  | 'STALE'
  | 'EXPIRED'
  | 'REVALIDATING'
  | 'REFRESHED';

export type RevalidationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RevalidationRecommendedAction =
  | 'No Action'
  | 'FAST Validation'
  | 'STANDARD Validation'
  | 'TARGETED Validation';

export interface EvidenceRevalidationRecord {
  readOnly: true;
  capabilityId: string;
  evidenceId: string;
  currentStatus: EvidenceRevalidationStatus;
  lastValidatedAt: string;
  expiresAt: string;
  priority: RevalidationPriority;
  recommendedAction: RevalidationRecommendedAction;
  revalidationResult: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
}

export interface RevalidationQueueEntry {
  readOnly: true;
  evidenceId: string;
  capabilityId: string;
  priority: RevalidationPriority;
  currentStatus: EvidenceRevalidationStatus;
  recommendedAction: RevalidationRecommendedAction;
  validatorsToRun: readonly string[];
  estimatedRuntimeSeconds: number;
  governancePlannerUsed: true;
}

export interface RevalidationResultEntry {
  readOnly: true;
  evidenceId: string;
  capabilityId: string;
  priorStatus: EvidenceRevalidationStatus;
  resultStatus: EvidenceRevalidationStatus;
  validatorsRun: readonly string[];
  refreshedAt: string;
  proofRefreshed: boolean;
  fullRerunAvoided: true;
}

export interface ConfidenceRecoveryEntry {
  readOnly: true;
  evidenceId: string;
  capabilityId: string;
  freshnessBefore: number;
  freshnessAfter: number;
  freshnessDelta: number;
  confidenceBefore: number;
  confidenceAfter: number;
  confidenceDelta: number;
  priorStatus: EvidenceRevalidationStatus;
  resultStatus: EvidenceRevalidationStatus;
}

export interface ConfidenceRecoveryAssessment {
  readOnly: true;
  generatedAt: string;
  expiredToRefreshed: number;
  staleToFresh: number;
  confidenceRecovered: number;
  overallFreshnessBefore: number;
  overallFreshnessAfter: number;
  freshnessDelta: number;
  entries: readonly ConfidenceRecoveryEntry[];
}

export interface FreshnessUpdateEntry {
  readOnly: true;
  evidenceId: string;
  capabilityId: string;
  priorStatus: EvidenceRevalidationStatus;
  updatedStatus: EvidenceRevalidationStatus;
  lastValidatedAt: string;
  freshnessScore: number;
  confidenceScore: number;
}

export interface EvidenceRevalidationFailure {
  readOnly: true;
  failureId: string;
  evidenceId: string;
  capabilityId: string;
  detail: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  unifiedFailureEscalationEligible: true;
}

export interface EvidenceRevalidationCycleAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Evidence Revalidation Cycle Authority V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  oefaConsumed: boolean;
  governancePlannerUsed: boolean;
  expiredDiscovered: number;
  agingDiscovered: number;
  staleDiscovered: number;
  revalidationScheduled: number;
  revalidationSucceeded: number;
  revalidationFailed: number;
  expiredRefreshed: number;
  confidenceRecoveryPoints: number;
  overallFreshnessBefore: number;
  overallFreshnessAfter: number;
  revalidationProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  registry: readonly EvidenceRevalidationRecord[];
  queue: readonly RevalidationQueueEntry[];
  results: readonly RevalidationResultEntry[];
  confidenceRecovery: ConfidenceRecoveryAssessment;
  freshnessUpdates: readonly FreshnessUpdateEntry[];
  failures: readonly EvidenceRevalidationFailure[];
  auditImpact: {
    readOnly: true;
    generatedAt: string;
    expiredEvidenceGapClosed: boolean;
    strategicRoadmapUpdated: boolean;
    capabilityAuditExtended: boolean;
    auditShouldReport: string;
  };
}

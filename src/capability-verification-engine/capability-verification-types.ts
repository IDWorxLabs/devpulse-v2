/**
 * Capability Verification Engine — types and models.
 * Verification only — no execution, no file modification.
 */

export const CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN = 'CAPABILITY_VERIFICATION_ENGINE_V1_PASS';
export const CAPABILITY_VERIFICATION_ENGINE_OWNER_MODULE = 'devpulse_v2_capability_verification_engine';
export const DEFAULT_MAX_VERIFICATION_HISTORY_SIZE = 128;

export type CapabilityVerificationDecision =
  | 'VERIFIED'
  | 'NEEDS_REVISION'
  | 'DUPLICATE_RISK'
  | 'TRUST_REVIEW_REQUIRED'
  | 'ROLLBACK_REQUIRED'
  | 'BLOCKED';

export type CapabilityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CapabilityReadinessState =
  | 'READY'
  | 'NOT_READY'
  | 'REQUIRES_REVIEW'
  | 'BLOCKED';

export interface CapabilityVerificationRecord {
  verificationId: string;
  decision: CapabilityVerificationDecision;
  confidence: number;
  duplicateRisk: number;
  trustScore: number;
  createdAt: number;
}

export interface CapabilityVerificationInput {
  projectId?: string;
  proposedCapability: string;
  capabilityDomain?: string;
  trustImpact?: boolean;
  world2Impact?: boolean;
  riskScore?: number;
  coverageScore?: number;
  hasProgressMonitoring?: boolean;
  hasStallHandling?: boolean;
  hasBottleneckRecovery?: boolean;
  rolloutStages?: string[];
  rollbackCheckpoints?: string[];
  recoveryPath?: string[];
  validationRequirements?: string[];
  integrationPoints?: string[];
  scopeCovered?: boolean;
  signals?: string[];
}

export interface CapabilityRequirementValidation {
  coverageScore: number;
  missingRequirements: string[];
  complete: boolean;
}

export interface CapabilityDuplicateValidation {
  duplicateScore: number;
  duplicateCandidates: string[];
  duplicateRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'DUPLICATE';
  isDuplicate: boolean;
}

export interface CapabilityRiskValidation {
  riskLevel: CapabilityRiskLevel;
  blastRadius: number;
  dependencyRisk: number;
  integrationRisk: number;
}

export interface CapabilityRolloutValidation {
  valid: boolean;
  unsafeRollout: boolean;
  missingRollback: boolean;
  findings: string[];
}

export interface CapabilityTrustValidation {
  trustScore: number;
  trustFindings: string[];
  requiresReview: boolean;
}

export interface CapabilityStallProtectionValidation {
  progressMonitoringPresent: boolean;
  stallHandlingPresent: boolean;
  bottleneckHandlingPresent: boolean;
  escalationIntegrated: boolean;
  complete: boolean;
}

export interface CapabilityReadinessEvaluation {
  state: CapabilityReadinessState;
  canProceed: boolean;
  reasons: string[];
}

export interface CapabilityVerificationReport {
  reportId: string;
  verificationId: string;
  decision: CapabilityVerificationDecision;
  confidence: number;
  requirements: CapabilityRequirementValidation;
  duplicates: CapabilityDuplicateValidation;
  risk: CapabilityRiskValidation;
  rollout: CapabilityRolloutValidation;
  trust: CapabilityTrustValidation;
  stallProtection: CapabilityStallProtectionValidation;
  readiness: CapabilityReadinessEvaluation;
  recommendedAction: string;
  generatedAt: number;
}

export interface CapabilityVerificationHistoryEntry {
  historyId: string;
  verificationId: string;
  decision: CapabilityVerificationDecision;
  readiness: CapabilityReadinessState;
  recordedAt: number;
}

export interface CapabilityVerificationRuntimeReport {
  requirementValidations: number;
  duplicateChecks: number;
  riskValidations: number;
  rolloutValidations: number;
  trustValidations: number;
  readinessEvaluations: number;
  verificationCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export interface CapabilityVerificationResult {
  record: CapabilityVerificationRecord;
  report: CapabilityVerificationReport;
}

export const VERIFICATION_QUESTION_SIGNALS = [
  'capability verification',
  'verify capability',
  'readiness evaluation',
  'duplicate risk',
  'stall protection',
] as const;

export function isCapabilityVerificationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

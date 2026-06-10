/**
 * Reality Verification Expansion — types and models.
 */

export const REALITY_VERIFICATION_EXPANSION_PASS_TOKEN = 'REALITY_VERIFICATION_EXPANSION_V1_PASS';
export const REALITY_VERIFICATION_EXPANSION_OWNER_MODULE = 'devpulse_v2_reality_verification_expansion';
export const DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE = 128;

export type RealitySourceId =
  | 'UNIFIED_TRUST_RUNTIME'
  | 'EVIDENCE_INTELLIGENCE'
  | 'AUTONOMOUS_VERIFICATION'
  | 'AUTONOMOUS_COMPLETION_ENGINE'
  | 'MULTI_PROJECT_VERIFICATION'
  | 'MULTI_PROJECT_MONITORING'
  | 'SELF_EVOLUTION_GOVERNANCE'
  | 'WORLD2'
  | 'TRUST_ENGINE';

export type RealityClaimType =
  | 'build_completed'
  | 'verification_passed'
  | 'trust_established'
  | 'completion_verified'
  | 'project_healthy'
  | 'governance_approved';

export type ClaimSupportStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'CONTRADICTED';

export type RealityCategory =
  | 'COMPLETION'
  | 'VERIFICATION'
  | 'TRUST'
  | 'GOVERNANCE'
  | 'MONITORING'
  | 'GENERAL';

export type RealityVerificationState = 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED' | 'CONFLICTED' | 'UNKNOWN';

export type RealityRecordStatus = 'ACTIVE' | 'STALE' | 'CONFLICTED' | 'UNKNOWN';

export interface RealitySourceRegistration {
  sourceId: RealitySourceId;
  label: string;
  registeredAt: number;
  active: boolean;
}

export interface RawRealityClaimInput {
  claimType: RealityClaimType | string;
  source?: RealitySourceId | string;
  project?: string;
  workspace?: string;
  strength?: number;
  trustLevel?: number;
  verificationState?: RealityVerificationState | string;
  monitoringHealthy?: boolean;
  governanceApproved?: boolean;
  claim?: string;
  timestamp?: number;
}

export interface RawRealityEvidenceInput {
  source?: RealitySourceId | string;
  claim?: string;
  strength?: number;
  trustworthiness?: number;
  supportsClaim?: boolean;
  contradictsClaim?: boolean;
}

export interface RealityRecord {
  recordId: string;
  source: RealitySourceId;
  project: string;
  workspace: string;
  category: RealityCategory;
  claimType: RealityClaimType;
  status: RealityRecordStatus;
  verificationState: RealityVerificationState;
  strength: number;
  trustLevel: number;
  claim: string;
  timestamp: number;
}

export interface ClaimValidation {
  claimType: RealityClaimType;
  supportStatus: ClaimSupportStatus;
  confidence: number;
  reason: string;
}

export interface RealityConsistencyScores {
  consistencyScore: number;
  stabilityScore: number;
  agreementScore: number;
  alignmentScore: number;
}

export interface RealityConflict {
  conflictType: 'claim' | 'evidence' | 'trust' | 'completion' | 'governance' | 'monitoring';
  sources: RealitySourceId[];
  description: string;
}

export interface RealityGap {
  gapType: 'missing_proof' | 'insufficient_proof' | 'contradicted_proof' | 'unverified_claim' | 'untrusted_claim';
  claimType: RealityClaimType;
  description: string;
}

export interface UnifiedRealityAuthority {
  authorityId: string;
  overallRealityState: ClaimSupportStatus;
  verificationReadiness: number;
  claimCount: number;
  supportedCount: number;
  contradictedCount: number;
  consistency: RealityConsistencyScores;
  conflictCount: number;
  gapCount: number;
  participatingSources: RealitySourceId[];
  createdAt: number;
}

export interface RealityVerificationEvaluation {
  realityConfidence: number;
  realityTrustworthiness: number;
  realityReadiness: number;
  realityStability: number;
  overallRealityState: ClaimSupportStatus;
}

export interface RealityVerificationRecord {
  recordId: string;
  authority: UnifiedRealityAuthority;
  evaluation: RealityVerificationEvaluation;
  claimValidations: ClaimValidation[];
  conflicts: RealityConflict[];
  gaps: RealityGap[];
  createdAt: number;
}

export interface RealityVerificationHistoryEntry {
  recordId: string;
  overallRealityState: ClaimSupportStatus;
  claimCount: number;
  consistencyScore: number;
  recordedAt: number;
}

export interface RealityVerificationReport {
  claimValidations: ClaimValidation[];
  supportStatus: ClaimSupportStatus;
  consistency: RealityConsistencyScores;
  conflicts: RealityConflict[];
  gaps: RealityGap[];
  readiness: number;
  authorityState: ClaimSupportStatus;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  evaluation: RealityVerificationEvaluation;
}

export interface RealityVerificationInput {
  requestId: string;
  project?: string;
  workspace?: string;
  claims: RawRealityClaimInput[];
  evidence?: RawRealityEvidenceInput[];
}

export interface RealityVerificationResult {
  record: RealityVerificationRecord;
  report: RealityVerificationReport;
}

export interface RealityVerificationRuntimeReport {
  claimValidationCount: number;
  matchingCount: number;
  consistencyAnalysisCount: number;
  conflictDetectionCount: number;
  gapAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const REALITY_VERIFICATION_QUESTION_SIGNALS = [
  'reality verification',
  'reality authority',
  'claim validation',
  'reality state',
  'reality confidence',
] as const;

export function isRealityVerificationExpansionQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return REALITY_VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

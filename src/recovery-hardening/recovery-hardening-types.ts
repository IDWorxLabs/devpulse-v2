/**
 * Recovery Hardening — types and models.
 */

export const RECOVERY_HARDENING_PASS_TOKEN = 'RECOVERY_HARDENING_V1_PASS';
export const RECOVERY_HARDENING_OWNER_MODULE = 'devpulse_v2_recovery_hardening';
export const DEFAULT_MAX_RECOVERY_HARDENING_HISTORY_SIZE = 128;

export type RecoveryRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RecoveryState =
  | 'READY'
  | 'ACCEPTABLE'
  | 'WATCH'
  | 'DEGRADED'
  | 'UNSAFE'
  | 'BLOCKED';

export interface RecoveryHardeningRecord {
  recoveryId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: RecoveryRiskLevel;
  state: RecoveryState;
  confidence: number;
  recoveryScore: number;
  rollbackReadinessScore: number;
  containmentScore: number;
  escalationReadinessScore: number;
  generatedAt: number;
}

export interface RollbackReadinessAnalysis {
  rollbackReadinessScore: number;
  rollbackRiskLevel: RecoveryRiskLevel;
  rollbackWarnings: string[];
  rollbackGaps: string[];
}

export interface FailureContainmentAnalysis {
  containmentScore: number;
  containmentRiskLevel: RecoveryRiskLevel;
  containmentWarnings: string[];
  containmentGaps: string[];
}

export interface ResetReadinessAnalysis {
  resetReadinessScore: number;
  resetRiskLevel: RecoveryRiskLevel;
  resetWarnings: string[];
  resetGaps: string[];
}

export interface EscalationReadinessAnalysis {
  escalationReadinessScore: number;
  escalationRiskLevel: RecoveryRiskLevel;
  escalationWarnings: string[];
  escalationGaps: string[];
}

export interface DisasterRecoveryReadinessAnalysis {
  disasterRecoveryScore: number;
  disasterRecoveryRiskLevel: RecoveryRiskLevel;
  disasterRecoveryWarnings: string[];
  disasterRecoveryGaps: string[];
}

export interface UnifiedRecoveryHardeningAuthority {
  authorityId: string;
  recoveryScore: number;
  rollbackReadinessScore: number;
  containmentScore: number;
  escalationReadinessScore: number;
  resetReadinessScore: number;
  disasterRecoveryScore: number;
  riskLevel: RecoveryRiskLevel;
  state: RecoveryState;
  confidence: number;
  createdAt: number;
}

export interface RecoveryHardeningEvaluation {
  recoveryScore: number;
  rollbackReadinessScore: number;
  containmentScore: number;
  escalationReadinessScore: number;
  resetReadinessScore: number;
  disasterRecoveryScore: number;
  state: RecoveryState;
  riskLevel: RecoveryRiskLevel;
  confidence: number;
  hardeningReadiness: number;
}

export interface RecoveryHardeningHistoryEntry {
  recoveryId: string;
  recoveryScore: number;
  state: RecoveryState;
  riskLevel: RecoveryRiskLevel;
  recordedAt: number;
}

export interface RecoveryHardeningReport {
  recoveryScore: number;
  rollbackReadinessScore: number;
  containmentScore: number;
  resetReadinessScore: number;
  escalationReadinessScore: number;
  disasterRecoveryScore: number;
  riskLevel: RecoveryRiskLevel;
  state: RecoveryState;
  confidence: number;
  rollbackGaps: string[];
  containmentGaps: string[];
  resetGaps: string[];
  escalationGaps: string[];
  disasterRecoveryGaps: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: RecoveryHardeningEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface RecoveryHardeningInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  missingGitCheckpoint?: boolean;
  missingCleanWorkingTreeSignal?: boolean;
  missingPhaseTagConvention?: boolean;
  missingLastKnownGoodCheckpoint?: boolean;
  missingFailureReport?: boolean;
  missingValidatorPassToken?: boolean;
  missingUvlCheckpointReport?: boolean;
  missingFounderApprovalCheckpoint?: boolean;
  missingRollbackGuidance?: boolean;
  missingRestorePathClarity?: boolean;
  world1World2SeparationWeak?: boolean;
  disposableWorkspaceIsolationWeak?: boolean;
  cloudWorkerBoundaryWeak?: boolean;
  projectWorkspaceBoundaryWeak?: boolean;
  generatedArtifactBoundaryWeak?: boolean;
  validationFailureContainmentWeak?: boolean;
  notificationFailureContainmentWeak?: boolean;
  operatorFeedFailureContainmentWeak?: boolean;
  selfEvolutionFailureContainmentWeak?: boolean;
  autonomousExecutionBoundaryWeak?: boolean;
  missingModuleResetFunctions?: boolean;
  missingCacheResetFunctions?: boolean;
  missingHistoryResetFunctions?: boolean;
  missingRegistryResetFunctions?: boolean;
  missingValidatorResetPatterns?: boolean;
  missingUvlResetReadiness?: boolean;
  missingTrustEngineResetReadiness?: boolean;
  missingHardeningLayerResetReadiness?: boolean;
  missingNotificationFeedResetReadiness?: boolean;
  repeatedRunIsolationWeak?: boolean;
  missingCapabilityEscalationWeak?: boolean;
  selfEvolutionGovernanceWeak?: boolean;
  threeFailureEscalationRuleWeak?: boolean;
  founderReviewEscalationWeak?: boolean;
  trustDegradationEscalationWeak?: boolean;
  securityPrivacyEscalationWeak?: boolean;
  recoveryRecommendationRoutingWeak?: boolean;
  notificationEscalationWeak?: boolean;
  operatorFeedEscalationWeak?: boolean;
  missingRepositoryCheckpointStrategy?: boolean;
  missingTagStrategy?: boolean;
  missingValidationCheckpointStrategy?: boolean;
  cloudWorkerRecoveryWeak?: boolean;
  mobileCommandRecoveryWeak?: boolean;
  projectExportImportRecoveryWeak?: boolean;
  backupReadinessWeak?: boolean;
  stateReconstructionWeak?: boolean;
  auditTrailPreservationWeak?: boolean;
  productionIncidentReadinessWeak?: boolean;
  reliabilityScore?: number;
  performanceScore?: number;
  securityScore?: number;
  privacyScore?: number;
  trustScore?: number;
  governanceBlocked?: boolean;
}

export interface RecoveryHardeningResult {
  record: RecoveryHardeningRecord;
  report: RecoveryHardeningReport;
}

export interface RecoveryHardeningRuntimeReport {
  rollbackAnalysisCount: number;
  containmentAnalysisCount: number;
  resetAnalysisCount: number;
  escalationAnalysisCount: number;
  disasterRecoveryAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const RECOVERY_HARDENING_QUESTION_SIGNALS = [
  'recovery hardening',
  'recovery',
  'rollback readiness',
  'failure containment',
  'reset readiness',
  'escalation readiness',
  'disaster recovery',
] as const;

export function isRecoveryHardeningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return RECOVERY_HARDENING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveRecoveryRiskLevel(score: number): RecoveryRiskLevel {
  if (score >= 81) return 'LOW';
  if (score >= 61) return 'MEDIUM';
  if (score >= 31) return 'HIGH';
  return 'CRITICAL';
}

export function resolveRecoveryState(score: number, blocked?: boolean): RecoveryState {
  if (blocked === true) return 'BLOCKED';
  if (score >= 90) return 'READY';
  if (score >= 75) return 'ACCEPTABLE';
  if (score >= 60) return 'WATCH';
  if (score >= 45) return 'DEGRADED';
  if (score >= 25) return 'UNSAFE';
  return 'BLOCKED';
}

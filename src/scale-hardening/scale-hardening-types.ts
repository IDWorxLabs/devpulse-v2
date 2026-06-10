/**
 * Scale Hardening — types and models.
 */

export const SCALE_HARDENING_PASS_TOKEN = 'SCALE_HARDENING_V1_PASS';
export const SCALE_HARDENING_OWNER_MODULE = 'devpulse_v2_scale_hardening';
export const DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE = 128;

export type ScaleRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ScaleState =
  | 'READY'
  | 'ACCEPTABLE'
  | 'WATCH'
  | 'STRAINED'
  | 'UNSAFE'
  | 'BLOCKED';

export interface ScaleHardeningRecord {
  scaleId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: ScaleRiskLevel;
  state: ScaleState;
  confidence: number;
  scaleScore: number;
  capacityScore: number;
  concurrencyScore: number;
  cloudUsageReadinessScore: number;
  generatedAt: number;
}

export interface CapacityReadinessAnalysis {
  capacityScore: number;
  capacityRiskLevel: ScaleRiskLevel;
  capacityWarnings: string[];
  capacityGaps: string[];
}

export interface ConcurrencyRiskAnalysis {
  concurrencyScore: number;
  concurrencyRiskLevel: ScaleRiskLevel;
  concurrencyWarnings: string[];
  concurrencyGaps: string[];
}

export interface CloudUsageReadinessAnalysis {
  cloudUsageReadinessScore: number;
  cloudUsageRiskLevel: ScaleRiskLevel;
  cloudUsageWarnings: string[];
  cloudUsageGaps: string[];
}

export interface QueueLoadAnalysis {
  queueLoadScore: number;
  queueLoadRiskLevel: ScaleRiskLevel;
  queueWarnings: string[];
  queueGaps: string[];
}

export interface MultiProjectScaleAnalysis {
  multiProjectScaleScore: number;
  multiProjectRiskLevel: ScaleRiskLevel;
  multiProjectWarnings: string[];
  multiProjectGaps: string[];
}

export interface UnifiedScaleHardeningAuthority {
  authorityId: string;
  scaleScore: number;
  capacityScore: number;
  concurrencyScore: number;
  cloudUsageReadinessScore: number;
  queueLoadScore: number;
  multiProjectScaleScore: number;
  riskLevel: ScaleRiskLevel;
  state: ScaleState;
  confidence: number;
  createdAt: number;
}

export interface ScaleHardeningEvaluation {
  scaleScore: number;
  capacityScore: number;
  concurrencyScore: number;
  cloudUsageReadinessScore: number;
  queueLoadScore: number;
  multiProjectScaleScore: number;
  state: ScaleState;
  riskLevel: ScaleRiskLevel;
  confidence: number;
  hardeningReadiness: number;
}

export interface ScaleHardeningHistoryEntry {
  scaleId: string;
  scaleScore: number;
  state: ScaleState;
  riskLevel: ScaleRiskLevel;
  recordedAt: number;
}

export interface ScaleHardeningReport {
  scaleScore: number;
  capacityScore: number;
  concurrencyScore: number;
  cloudUsageReadinessScore: number;
  queueLoadScore: number;
  multiProjectScaleScore: number;
  riskLevel: ScaleRiskLevel;
  state: ScaleState;
  confidence: number;
  capacityGaps: string[];
  concurrencyGaps: string[];
  cloudUsageGaps: string[];
  queueGaps: string[];
  multiProjectGaps: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: ScaleHardeningEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ScaleHardeningInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  largePromptRisk?: boolean;
  largeProjectContextRisk?: boolean;
  multiFileProjectRisk?: boolean;
  largeValidationReportRisk?: boolean;
  manyUvlRowsRisk?: boolean;
  manyOperatorFeedEntriesRisk?: boolean;
  manyNotificationsRisk?: boolean;
  manyProjectVaultRecordsRisk?: boolean;
  manyWorld2WorkspacesRisk?: boolean;
  manyCloudWorkerTasksRisk?: boolean;
  manyMobileCommandRequestsRisk?: boolean;
  manyFutureUsersRisk?: boolean;
  multipleProjectsActiveRisk?: boolean;
  multipleValidationRunsRisk?: boolean;
  multipleCloudTasksRisk?: boolean;
  multipleMobileCommandsRisk?: boolean;
  simultaneousOperatorFeedUpdatesRisk?: boolean;
  simultaneousNotificationWritesRisk?: boolean;
  simultaneousWorld2WorkspacesRisk?: boolean;
  simultaneousProjectImportExportRisk?: boolean;
  simultaneousAutonomousBuildersRisk?: boolean;
  futureMultiUserSessionsRisk?: boolean;
  futureOrganizationUsageRisk?: boolean;
  cloudBuildMinutesRisk?: boolean;
  aiRequestUsageRisk?: boolean;
  verificationUsageRisk?: boolean;
  storageUsageRisk?: boolean;
  executionRuntimeUsageRisk?: boolean;
  world2UsageRisk?: boolean;
  projectImportExportUsageRisk?: boolean;
  futurePackageQuotaRisk?: boolean;
  futureUsageMeteringRisk?: boolean;
  futureBillingIntegrationRisk?: boolean;
  founderUserUsageSeparationRisk?: boolean;
  accountWorkspaceQuotaRisk?: boolean;
  taskQueuePressureRisk?: boolean;
  validationQueuePressureRisk?: boolean;
  cloudWorkerQueuePressureRisk?: boolean;
  notificationQueuePressureRisk?: boolean;
  operatorFeedQueuePressureRisk?: boolean;
  projectBuildQueuePressureRisk?: boolean;
  world2ExecutionQueuePressureRisk?: boolean;
  selfEvolutionQueuePressureRisk?: boolean;
  retryQueuePressureRisk?: boolean;
  deadLetterQueuePressureRisk?: boolean;
  missingBackpressureSignals?: boolean;
  missingRateLimitSignals?: boolean;
  projectIsolationWeak?: boolean;
  projectRegistryGrowthRisk?: boolean;
  projectVaultGrowthRisk?: boolean;
  crossProjectVerificationRisk?: boolean;
  crossProjectMonitoringRisk?: boolean;
  crossProjectTrustScoringRisk?: boolean;
  crossProjectRecoveryRisk?: boolean;
  projectSwitchingRisk?: boolean;
  projectImportExportRisk?: boolean;
  projectOwnershipRisk?: boolean;
  futureTenantProjectMappingRisk?: boolean;
  reliabilityScore?: number;
  performanceScore?: number;
  securityScore?: number;
  privacyScore?: number;
  recoveryScore?: number;
  trustScore?: number;
  governanceBlocked?: boolean;
}

export interface ScaleHardeningResult {
  record: ScaleHardeningRecord;
  report: ScaleHardeningReport;
}

export interface ScaleHardeningRuntimeReport {
  capacityAnalysisCount: number;
  concurrencyAnalysisCount: number;
  cloudUsageAnalysisCount: number;
  queueLoadAnalysisCount: number;
  multiProjectAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const SCALE_HARDENING_QUESTION_SIGNALS = [
  'scale hardening',
  'scale',
  'capacity readiness',
  'concurrency risk',
  'cloud usage readiness',
  'queue load',
  'multi project scale',
] as const;

export function isScaleHardeningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return SCALE_HARDENING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveScaleRiskLevel(score: number): ScaleRiskLevel {
  if (score >= 81) return 'LOW';
  if (score >= 61) return 'MEDIUM';
  if (score >= 31) return 'HIGH';
  return 'CRITICAL';
}

export function resolveScaleState(score: number, blocked?: boolean): ScaleState {
  if (blocked === true) return 'BLOCKED';
  if (score >= 90) return 'READY';
  if (score >= 75) return 'ACCEPTABLE';
  if (score >= 60) return 'WATCH';
  if (score >= 45) return 'STRAINED';
  if (score >= 25) return 'UNSAFE';
  return 'BLOCKED';
}

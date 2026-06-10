/**
 * Reliability Hardening — types and models.
 */

export const RELIABILITY_HARDENING_PASS_TOKEN = 'RELIABILITY_HARDENING_V1_PASS';
export const RELIABILITY_HARDENING_OWNER_MODULE = 'devpulse_v2_reliability_hardening';
export const DEFAULT_MAX_RELIABILITY_HARDENING_HISTORY_SIZE = 128;

export type ReliabilityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReliabilityState =
  | 'STABLE'
  | 'WATCH'
  | 'DEGRADED'
  | 'UNSTABLE'
  | 'FAILURE_LIKELY'
  | 'BLOCKED';

export interface ReliabilityHardeningRecord {
  reliabilityId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: ReliabilityRiskLevel;
  state: ReliabilityState;
  confidence: number;
  reliabilityScore: number;
  stabilityScore: number;
  recoveryReadinessScore: number;
  generatedAt: number;
}

export type FailureSurfaceType =
  | 'startup_instability'
  | 'module_import_failures'
  | 'registry_drift'
  | 'export_drift'
  | 'uvl_row_drift'
  | 'validator_drift'
  | 'cache_growth_risk'
  | 'history_growth_risk'
  | 'duplicated_state_risk'
  | 'stale_signal_risk'
  | 'missing_reset_risk';

export interface FailureSurfaceAnalysis {
  failureSurfaces: FailureSurfaceType[];
  failureSurfaceScore: number;
  missingSignals: string[];
}

export interface RuntimeStabilityAnalysis {
  runtimeStabilityScore: number;
  runtimeStabilityState: ReliabilityState;
  runtimeWarnings: string[];
}

export interface ReliabilityBoundaryCheck {
  boundaryScore: number;
  boundaryViolations: string[];
  boundaryWarnings: string[];
}

export interface RecoveryReadinessAnalysis {
  recoveryReadinessScore: number;
  recoveryReadinessState: ReliabilityState;
  recoveryGaps: string[];
}

export interface ReliabilityConsistencyAnalysis {
  consistencyScore: number;
  consistencyWarnings: string[];
  consistencyGaps: string[];
}

export interface UnifiedReliabilityHardeningAuthority {
  authorityId: string;
  reliabilityScore: number;
  stabilityScore: number;
  recoveryReadinessScore: number;
  riskLevel: ReliabilityRiskLevel;
  state: ReliabilityState;
  confidence: number;
  createdAt: number;
}

export interface ReliabilityHardeningEvaluation {
  reliabilityScore: number;
  stabilityScore: number;
  recoveryReadinessScore: number;
  hardeningReadiness: number;
  state: ReliabilityState;
  riskLevel: ReliabilityRiskLevel;
  confidence: number;
}

export interface ReliabilityHardeningHistoryEntry {
  reliabilityId: string;
  reliabilityScore: number;
  state: ReliabilityState;
  riskLevel: ReliabilityRiskLevel;
  recordedAt: number;
}

export interface ReliabilityHardeningReport {
  reliabilityScore: number;
  stabilityScore: number;
  recoveryReadinessScore: number;
  riskLevel: ReliabilityRiskLevel;
  state: ReliabilityState;
  confidence: number;
  failureSurfaces: FailureSurfaceType[];
  boundaryViolations: string[];
  recoveryGaps: string[];
  consistencyGaps: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: ReliabilityHardeningEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ReliabilityHardeningInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  startupReadiness?: number;
  uvlReadiness?: number;
  trustEngineReadiness?: number;
  verificationReadiness?: number;
  monitoringReadiness?: number;
  operatorFeedReadiness?: number;
  notificationReadiness?: number;
  world2Readiness?: number;
  mobileCommandReadiness?: number;
  governanceStable?: boolean;
  escalationActive?: boolean;
  importFailureRisk?: boolean;
  registryDrift?: boolean;
  exportDrift?: boolean;
  uvlRowDrift?: boolean;
  validatorDrift?: boolean;
  cacheGrowthRisk?: boolean;
  historyGrowthRisk?: boolean;
  duplicatedStateRisk?: boolean;
  staleSignalRisk?: boolean;
  missingResetRisk?: boolean;
  unboundedLoopRisk?: boolean;
  repeatedBootstrapRisk?: boolean;
  repeatedHttpStartupRisk?: boolean;
  missingTimeoutGuard?: boolean;
  missingResetIsolation?: boolean;
  governanceBlocked?: boolean;
}

export interface ReliabilityHardeningResult {
  record: ReliabilityHardeningRecord;
  report: ReliabilityHardeningReport;
}

export interface ReliabilityHardeningRuntimeReport {
  failureSurfaceAnalysisCount: number;
  runtimeStabilityAnalysisCount: number;
  boundaryCheckCount: number;
  recoveryReadinessAnalysisCount: number;
  consistencyAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const RELIABILITY_HARDENING_QUESTION_SIGNALS = [
  'reliability hardening',
  'reliability',
  'stability',
  'runtime stability',
  'recovery readiness',
] as const;

export function isReliabilityHardeningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return RELIABILITY_HARDENING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveReliabilityRiskLevel(score: number): ReliabilityRiskLevel {
  if (score >= 81) return 'LOW';
  if (score >= 61) return 'MEDIUM';
  if (score >= 31) return 'HIGH';
  return 'CRITICAL';
}

export function resolveReliabilityState(score: number, blocked?: boolean): ReliabilityState {
  if (blocked === true) return 'BLOCKED';
  if (score >= 86) return 'STABLE';
  if (score >= 71) return 'WATCH';
  if (score >= 51) return 'DEGRADED';
  if (score >= 31) return 'UNSTABLE';
  return 'FAILURE_LIKELY';
}

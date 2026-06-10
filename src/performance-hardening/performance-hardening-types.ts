/**
 * Performance Hardening — types and models.
 */

export const PERFORMANCE_HARDENING_PASS_TOKEN = 'PERFORMANCE_HARDENING_V1_PASS';
export const PERFORMANCE_HARDENING_OWNER_MODULE = 'devpulse_v2_performance_hardening';
export const DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE = 128;

export type PerformanceRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PerformanceState =
  | 'FAST'
  | 'ACCEPTABLE'
  | 'WATCH'
  | 'SLOW'
  | 'DEGRADED'
  | 'BLOCKED';

export interface PerformanceHardeningRecord {
  performanceId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: PerformanceRiskLevel;
  state: PerformanceState;
  confidence: number;
  performanceScore: number;
  startupScore: number;
  validationScore: number;
  responsivenessScore: number;
  generatedAt: number;
}

export interface StartupPerformanceAnalysis {
  startupScore: number;
  startupRiskLevel: PerformanceRiskLevel;
  startupWarnings: string[];
  missingSignals: string[];
}

export interface ValidationPerformanceAnalysis {
  validationScore: number;
  validationRiskLevel: PerformanceRiskLevel;
  slowGroups: string[];
  validationWarnings: string[];
  missingSignals: string[];
}

export interface CacheEfficiencyAnalysis {
  cacheEfficiencyScore: number;
  cacheWarnings: string[];
  memoryGrowthWarnings: string[];
}

export interface UiResponsivenessAnalysis {
  responsivenessScore: number;
  responsivenessRiskLevel: PerformanceRiskLevel;
  responsivenessWarnings: string[];
  mobileWarnings: string[];
}

export type PerformanceBottleneckType =
  | 'startup_bottleneck'
  | 'validation_bottleneck'
  | 'cache_memory_bottleneck'
  | 'ui_render_bottleneck'
  | 'mobile_responsiveness_bottleneck'
  | 'registry_aggregation_bottleneck'
  | 'report_generation_bottleneck'
  | 'bridge_lookup_bottleneck';

export interface PerformanceBottleneckDetection {
  bottlenecks: PerformanceBottleneckType[];
  bottleneckScore: number;
  priorityOrder: PerformanceBottleneckType[];
}

export interface UnifiedPerformanceHardeningAuthority {
  authorityId: string;
  performanceScore: number;
  startupScore: number;
  validationScore: number;
  responsivenessScore: number;
  cacheEfficiencyScore: number;
  riskLevel: PerformanceRiskLevel;
  state: PerformanceState;
  confidence: number;
  createdAt: number;
}

export interface PerformanceHardeningEvaluation {
  performanceScore: number;
  startupScore: number;
  validationScore: number;
  responsivenessScore: number;
  state: PerformanceState;
  riskLevel: PerformanceRiskLevel;
  confidence: number;
  hardeningReadiness: number;
}

export interface PerformanceHardeningHistoryEntry {
  performanceId: string;
  performanceScore: number;
  state: PerformanceState;
  riskLevel: PerformanceRiskLevel;
  recordedAt: number;
}

export interface PerformanceHardeningReport {
  performanceScore: number;
  startupScore: number;
  validationScore: number;
  cacheEfficiencyScore: number;
  responsivenessScore: number;
  bottlenecks: PerformanceBottleneckType[];
  slowGroups: string[];
  riskLevel: PerformanceRiskLevel;
  state: PerformanceState;
  confidence: number;
  missingSignals: string[];
  recommendations: string[];
  evaluation: PerformanceHardeningEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface PerformanceHardeningInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  bootReadiness?: number;
  bootstrapWeight?: number;
  firstVisibleDelayMs?: number;
  firstClickableDelayMs?: number;
  chatUsableDelayMs?: number;
  mobileStartupPressure?: boolean;
  repeatedStartupLoopRisk?: boolean;
  lazyLoadFailureRisk?: boolean;
  duplicateInitializationRisk?: boolean;
  readinessDriftRisk?: boolean;
  slowValidationGroupRisk?: boolean;
  stressRuntimeGrowthRisk?: boolean;
  unboundedValidatorRisk?: boolean;
  repeatedBootstrapInValidators?: boolean;
  repeatedHttpStartupInValidators?: boolean;
  duplicateFixtureGeneration?: boolean;
  duplicateRegistryAggregation?: boolean;
  unboundedScenarioGeneration?: boolean;
  missingTimeoutGuard?: boolean;
  missingProgressLogging?: boolean;
  missingSlowGroupReporting?: boolean;
  cacheMaxSizeRisk?: boolean;
  missingEvictionTracking?: boolean;
  missingHitMissTracking?: boolean;
  historyMaxSizeRisk?: boolean;
  registryGrowthRisk?: boolean;
  repeatedLookupRisk?: boolean;
  unboundedCollectionRisk?: boolean;
  heavyRenderPressure?: boolean;
  reportPreviewRebuildRisk?: boolean;
  operatorFeedRenderRisk?: boolean;
  notificationDrawerDuplicationRisk?: boolean;
  uvlPanelRenderPressure?: boolean;
  largeReportCopyPressure?: boolean;
  mobileScreenOverflowRisk?: boolean;
  chatInputResponsivenessRisk?: boolean;
  loaderReadinessMismatch?: boolean;
  reliabilityScore?: number;
  governanceBlocked?: boolean;
}

export interface PerformanceHardeningResult {
  record: PerformanceHardeningRecord;
  report: PerformanceHardeningReport;
}

export interface PerformanceHardeningRuntimeReport {
  startupAnalysisCount: number;
  validationAnalysisCount: number;
  cacheAnalysisCount: number;
  responsivenessAnalysisCount: number;
  bottleneckDetectionCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const PERFORMANCE_HARDENING_QUESTION_SIGNALS = [
  'performance hardening',
  'performance',
  'startup performance',
  'validation performance',
  'ui responsiveness',
  'mobile responsiveness',
] as const;

export function isPerformanceHardeningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PERFORMANCE_HARDENING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolvePerformanceRiskLevel(score: number): PerformanceRiskLevel {
  if (score >= 81) return 'LOW';
  if (score >= 61) return 'MEDIUM';
  if (score >= 31) return 'HIGH';
  return 'CRITICAL';
}

export function resolvePerformanceState(score: number, blocked?: boolean): PerformanceState {
  if (blocked === true) return 'BLOCKED';
  if (score >= 90) return 'FAST';
  if (score >= 75) return 'ACCEPTABLE';
  if (score >= 60) return 'WATCH';
  if (score >= 45) return 'SLOW';
  if (score >= 25) return 'DEGRADED';
  return 'BLOCKED';
}

/**
 * Scale Hardening — public exports.
 */

import { resetScaleHardeningRegistryForTests } from './scale-hardening-registry.js';
import { resetScaleHardeningCacheForTests } from './scale-hardening-cache.js';
import { resetCapacityReadinessAnalyzerForTests } from './capacity-readiness-analyzer.js';
import { resetConcurrencyRiskAnalyzerForTests } from './concurrency-risk-analyzer.js';
import { resetCloudUsageReadinessAnalyzerForTests } from './cloud-usage-readiness-analyzer.js';
import { resetQueueLoadAnalyzerForTests } from './queue-load-analyzer.js';
import { resetMultiProjectScaleAnalyzerForTests } from './multi-project-scale-analyzer.js';
import { resetScaleAuthorityBuilderForTests } from './scale-authority-builder.js';
import { resetScaleHardeningEvaluatorForTests } from './scale-hardening-evaluator.js';
import { resetScaleHardeningHistoryForTests } from './scale-hardening-history.js';
import { resetScaleHardeningReportingForTests } from './scale-hardening-reporting.js';
import { resetScaleHardeningOrchestrationForTests } from './scale-hardening.js';

export {
  SCALE_HARDENING_PASS_TOKEN,
  SCALE_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE,
  SCALE_HARDENING_QUESTION_SIGNALS,
  isScaleHardeningQuestion,
  resolveScaleRiskLevel,
  resolveScaleState,
} from './scale-hardening-types.js';

export type {
  ScaleRiskLevel,
  ScaleState,
  ScaleHardeningRecord,
  CapacityReadinessAnalysis,
  ConcurrencyRiskAnalysis,
  CloudUsageReadinessAnalysis,
  QueueLoadAnalysis,
  MultiProjectScaleAnalysis,
  UnifiedScaleHardeningAuthority,
  ScaleHardeningEvaluation,
  ScaleHardeningHistoryEntry,
  ScaleHardeningReport,
  ScaleHardeningInput,
  ScaleHardeningResult,
  ScaleHardeningRuntimeReport,
} from './scale-hardening-types.js';

export { getScaleHardeningCacheStats, resetScaleHardeningCacheForTests } from './scale-hardening-cache.js';

export {
  registerScaleHardeningRecord,
  getScaleHardeningRecord,
  lookupScaleByProjectId,
  lookupScaleByWorkspaceId,
  lookupScaleByRiskLevel,
  lookupScaleByState,
  listScaleHardeningRecords,
  getScaleHardeningRecordCount,
  resetScaleHardeningRegistryForTests,
} from './scale-hardening-registry.js';

export {
  analyzeCapacityReadiness,
  getCapacityAnalysisCount,
  resetCapacityReadinessAnalyzerForTests,
} from './capacity-readiness-analyzer.js';

export {
  analyzeConcurrencyRisk,
  getConcurrencyAnalysisCount,
  resetConcurrencyRiskAnalyzerForTests,
} from './concurrency-risk-analyzer.js';

export {
  analyzeCloudUsageReadiness,
  getCloudUsageAnalysisCount,
  resetCloudUsageReadinessAnalyzerForTests,
} from './cloud-usage-readiness-analyzer.js';

export {
  analyzeQueueLoad,
  getQueueLoadAnalysisCount,
  resetQueueLoadAnalyzerForTests,
} from './queue-load-analyzer.js';

export {
  analyzeMultiProjectScale,
  getMultiProjectAnalysisCount,
  resetMultiProjectScaleAnalyzerForTests,
} from './multi-project-scale-analyzer.js';

export {
  buildUnifiedScaleHardeningAuthority,
  getAuthorityBuildCount,
  resetScaleAuthorityBuilderForTests,
} from './scale-authority-builder.js';

export {
  evaluateScaleHardening,
  getEvaluationCount,
  resetScaleHardeningEvaluatorForTests,
} from './scale-hardening-evaluator.js';

export {
  recordScaleHardeningHistory,
  getScaleHardeningHistory,
  getScaleHardeningHistorySize,
  clearScaleHardeningHistory,
  resetScaleHardeningHistoryForTests,
} from './scale-hardening-history.js';

export {
  generateScaleHardeningReport,
  getReportCount,
  resetScaleHardeningReportingForTests,
} from './scale-hardening-reporting.js';

export {
  getDevPulseV2ScaleHardening,
  registerScaleHardeningWithCentralBrain,
  registerScaleHardeningWithFoundation,
  registerScaleHardeningWithCapabilityRegistry,
  registerScaleHardeningWithFindPanel,
  registerScaleHardeningWithUvl,
  registerScaleHardeningWithUnifiedTrustScore,
  registerScaleHardeningWithTrustEngineCheckpoint,
  registerScaleHardeningWithUnifiedVerificationLab,
  registerScaleHardeningWithReliabilityHardening,
  registerScaleHardeningWithPerformanceHardening,
  registerScaleHardeningWithSecurityHardening,
  registerScaleHardeningWithPrivacyHardening,
  registerScaleHardeningWithRecoveryHardening,
  registerScaleHardeningWithAutonomousVerification,
  registerScaleHardeningWithAutonomousCompletion,
  registerScaleHardeningWithMultiProjectVerification,
  registerScaleHardeningWithMultiProjectMonitoring,
  registerScaleHardeningWithProjectVault,
  registerScaleHardeningWithCloudWorkerRuntime,
  registerScaleHardeningWithExecutionAuthority,
  registerScaleHardeningWithOperatorFeed,
  registerScaleHardeningWithNotificationVault,
  registerScaleHardeningWithNotificationDelivery,
  registerScaleHardeningWithWorld2,
  registerScaleHardeningWithMobileCommand,
  registerScaleHardeningWithSelfEvolutionGovernance,
  registerScaleHardeningWithMissingCapabilityEscalation,
  evaluateScaleHardeningEngine,
  getScaleHardeningRuntimeReport,
} from './scale-hardening.js';

export type { ScaleHardeningSystemSnapshot } from './scale-hardening.js';

export function resetScaleHardeningForTests(): void {
  resetScaleHardeningRegistryForTests();
  resetScaleHardeningCacheForTests();
  resetCapacityReadinessAnalyzerForTests();
  resetConcurrencyRiskAnalyzerForTests();
  resetCloudUsageReadinessAnalyzerForTests();
  resetQueueLoadAnalyzerForTests();
  resetMultiProjectScaleAnalyzerForTests();
  resetScaleAuthorityBuilderForTests();
  resetScaleHardeningEvaluatorForTests();
  resetScaleHardeningHistoryForTests();
  resetScaleHardeningReportingForTests();
  resetScaleHardeningOrchestrationForTests();
}

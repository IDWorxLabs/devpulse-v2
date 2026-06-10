/**
 * Performance Hardening — public exports.
 */

import { resetPerformanceHardeningRegistryForTests } from './performance-hardening-registry.js';
import { resetPerformanceHardeningCacheForTests } from './performance-hardening-cache.js';
import { resetStartupPerformanceAnalyzerForTests } from './startup-performance-analyzer.js';
import { resetValidationPerformanceAnalyzerForTests } from './validation-performance-analyzer.js';
import { resetCacheEfficiencyAnalyzerForTests } from './cache-efficiency-analyzer.js';
import { resetUiResponsivenessAnalyzerForTests } from './ui-responsiveness-analyzer.js';
import { resetPerformanceBottleneckDetectorForTests } from './performance-bottleneck-detector.js';
import { resetPerformanceAuthorityBuilderForTests } from './performance-authority-builder.js';
import { resetPerformanceHardeningEvaluatorForTests } from './performance-hardening-evaluator.js';
import { resetPerformanceHardeningHistoryForTests } from './performance-hardening-history.js';
import { resetPerformanceHardeningReportingForTests } from './performance-hardening-reporting.js';
import { resetPerformanceHardeningOrchestrationForTests } from './performance-hardening.js';

export {
  PERFORMANCE_HARDENING_PASS_TOKEN,
  PERFORMANCE_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE,
  PERFORMANCE_HARDENING_QUESTION_SIGNALS,
  isPerformanceHardeningQuestion,
  resolvePerformanceRiskLevel,
  resolvePerformanceState,
} from './performance-hardening-types.js';

export type {
  PerformanceRiskLevel,
  PerformanceState,
  PerformanceBottleneckType,
  PerformanceHardeningRecord,
  StartupPerformanceAnalysis,
  ValidationPerformanceAnalysis,
  CacheEfficiencyAnalysis,
  UiResponsivenessAnalysis,
  PerformanceBottleneckDetection,
  UnifiedPerformanceHardeningAuthority,
  PerformanceHardeningEvaluation,
  PerformanceHardeningHistoryEntry,
  PerformanceHardeningReport,
  PerformanceHardeningInput,
  PerformanceHardeningResult,
  PerformanceHardeningRuntimeReport,
} from './performance-hardening-types.js';

export { getPerformanceHardeningCacheStats, resetPerformanceHardeningCacheForTests } from './performance-hardening-cache.js';

export {
  registerPerformanceHardeningRecord,
  getPerformanceHardeningRecord,
  lookupPerformanceByProjectId,
  lookupPerformanceByWorkspaceId,
  lookupPerformanceByRiskLevel,
  lookupPerformanceByState,
  listPerformanceHardeningRecords,
  getPerformanceHardeningRecordCount,
  resetPerformanceHardeningRegistryForTests,
} from './performance-hardening-registry.js';

export {
  analyzeStartupPerformance,
  getStartupAnalysisCount,
  resetStartupPerformanceAnalyzerForTests,
} from './startup-performance-analyzer.js';

export {
  analyzeValidationPerformance,
  getValidationAnalysisCount,
  resetValidationPerformanceAnalyzerForTests,
} from './validation-performance-analyzer.js';

export {
  analyzeCacheEfficiency,
  getCacheAnalysisCount,
  resetCacheEfficiencyAnalyzerForTests,
} from './cache-efficiency-analyzer.js';

export {
  analyzeUiResponsiveness,
  getResponsivenessAnalysisCount,
  resetUiResponsivenessAnalyzerForTests,
} from './ui-responsiveness-analyzer.js';

export {
  detectPerformanceBottlenecks,
  getBottleneckDetectionCount,
  resetPerformanceBottleneckDetectorForTests,
} from './performance-bottleneck-detector.js';

export {
  buildUnifiedPerformanceHardeningAuthority,
  getAuthorityBuildCount,
  resetPerformanceAuthorityBuilderForTests,
} from './performance-authority-builder.js';

export {
  evaluatePerformanceHardening,
  getEvaluationCount,
  resetPerformanceHardeningEvaluatorForTests,
} from './performance-hardening-evaluator.js';

export {
  recordPerformanceHardeningHistory,
  getPerformanceHardeningHistory,
  getPerformanceHardeningHistorySize,
  clearPerformanceHardeningHistory,
  resetPerformanceHardeningHistoryForTests,
} from './performance-hardening-history.js';

export {
  generatePerformanceHardeningReport,
  getReportCount,
  resetPerformanceHardeningReportingForTests,
} from './performance-hardening-reporting.js';

export {
  getDevPulseV2PerformanceHardening,
  registerPerformanceHardeningWithCentralBrain,
  registerPerformanceHardeningWithFoundation,
  registerPerformanceHardeningWithCapabilityRegistry,
  registerPerformanceHardeningWithFindPanel,
  registerPerformanceHardeningWithUvl,
  registerPerformanceHardeningWithUnifiedTrustScore,
  registerPerformanceHardeningWithTrustEngineCheckpoint,
  registerPerformanceHardeningWithUnifiedVerificationLab,
  registerPerformanceHardeningWithReliabilityHardening,
  registerPerformanceHardeningWithExecutionAuthority,
  registerPerformanceHardeningWithTimelineIntelligence,
  registerPerformanceHardeningWithMobileValidationOptimizer,
  registerPerformanceHardeningWithOperatorFeed,
  registerPerformanceHardeningWithNotificationVault,
  registerPerformanceHardeningWithNotificationDelivery,
  registerPerformanceHardeningWithWorld2,
  registerPerformanceHardeningWithMobileCommand,
  registerPerformanceHardeningWithSelfEvolutionGovernance,
  registerPerformanceHardeningWithMissingCapabilityEscalation,
  evaluatePerformanceHardeningEngine,
  getPerformanceHardeningRuntimeReport,
} from './performance-hardening.js';

export type { PerformanceHardeningSystemSnapshot } from './performance-hardening.js';

export function resetPerformanceHardeningForTests(): void {
  resetPerformanceHardeningRegistryForTests();
  resetPerformanceHardeningCacheForTests();
  resetStartupPerformanceAnalyzerForTests();
  resetValidationPerformanceAnalyzerForTests();
  resetCacheEfficiencyAnalyzerForTests();
  resetUiResponsivenessAnalyzerForTests();
  resetPerformanceBottleneckDetectorForTests();
  resetPerformanceAuthorityBuilderForTests();
  resetPerformanceHardeningEvaluatorForTests();
  resetPerformanceHardeningHistoryForTests();
  resetPerformanceHardeningReportingForTests();
  resetPerformanceHardeningOrchestrationForTests();
}

/**
 * Reliability Hardening — public exports.
 */

import { resetReliabilityHardeningRegistryForTests } from './reliability-hardening-registry.js';
import { resetReliabilityHardeningCacheForTests } from './reliability-hardening-cache.js';
import { resetFailureSurfaceAnalyzerForTests } from './failure-surface-analyzer.js';
import { resetRuntimeStabilityAnalyzerForTests } from './runtime-stability-analyzer.js';
import { resetReliabilityBoundaryCheckerForTests } from './reliability-boundary-checker.js';
import { resetRecoveryReadinessAnalyzerForTests } from './reliability-recovery-readiness-analyzer.js';
import { resetReliabilityConsistencyAnalyzerForTests } from './reliability-consistency-analyzer.js';
import { resetReliabilityAuthorityBuilderForTests } from './reliability-authority-builder.js';
import { resetReliabilityHardeningEvaluatorForTests } from './reliability-hardening-evaluator.js';
import { resetReliabilityHardeningHistoryForTests } from './reliability-hardening-history.js';
import { resetReliabilityHardeningReportingForTests } from './reliability-hardening-reporting.js';
import { resetReliabilityHardeningOrchestrationForTests } from './reliability-hardening.js';

export {
  RELIABILITY_HARDENING_PASS_TOKEN,
  RELIABILITY_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_RELIABILITY_HARDENING_HISTORY_SIZE,
  RELIABILITY_HARDENING_QUESTION_SIGNALS,
  isReliabilityHardeningQuestion,
  resolveReliabilityRiskLevel,
  resolveReliabilityState,
} from './reliability-hardening-types.js';

export type {
  ReliabilityRiskLevel,
  ReliabilityState,
  FailureSurfaceType,
  ReliabilityHardeningRecord,
  FailureSurfaceAnalysis,
  RuntimeStabilityAnalysis,
  ReliabilityBoundaryCheck,
  RecoveryReadinessAnalysis,
  ReliabilityConsistencyAnalysis,
  UnifiedReliabilityHardeningAuthority,
  ReliabilityHardeningEvaluation,
  ReliabilityHardeningHistoryEntry,
  ReliabilityHardeningReport,
  ReliabilityHardeningInput,
  ReliabilityHardeningResult,
  ReliabilityHardeningRuntimeReport,
} from './reliability-hardening-types.js';

export { getReliabilityHardeningCacheStats, resetReliabilityHardeningCacheForTests } from './reliability-hardening-cache.js';

export {
  registerReliabilityHardeningRecord,
  getReliabilityHardeningRecord,
  lookupReliabilityByProjectId,
  lookupReliabilityByWorkspaceId,
  lookupReliabilityByRiskLevel,
  lookupReliabilityByState,
  listReliabilityHardeningRecords,
  getReliabilityHardeningRecordCount,
  resetReliabilityHardeningRegistryForTests,
} from './reliability-hardening-registry.js';

export {
  analyzeFailureSurfaces,
  getFailureSurfaceAnalysisCount,
  resetFailureSurfaceAnalyzerForTests,
} from './failure-surface-analyzer.js';

export {
  analyzeRuntimeStability,
  getRuntimeStabilityAnalysisCount,
  resetRuntimeStabilityAnalyzerForTests,
} from './runtime-stability-analyzer.js';

export {
  checkReliabilityBoundaries,
  getBoundaryCheckCount,
  resetReliabilityBoundaryCheckerForTests,
} from './reliability-boundary-checker.js';

export {
  analyzeRecoveryReadiness,
  getRecoveryReadinessAnalysisCount,
  resetRecoveryReadinessAnalyzerForTests,
  type RecoveryReadinessSignals,
} from './reliability-recovery-readiness-analyzer.js';

export {
  analyzeReliabilityConsistency,
  getConsistencyAnalysisCount,
  resetReliabilityConsistencyAnalyzerForTests,
  type ReliabilityConsistencySignals,
} from './reliability-consistency-analyzer.js';

export {
  buildUnifiedReliabilityHardeningAuthority,
  getAuthorityBuildCount,
  resetReliabilityAuthorityBuilderForTests,
} from './reliability-authority-builder.js';

export {
  evaluateReliabilityHardening,
  getEvaluationCount,
  resetReliabilityHardeningEvaluatorForTests,
} from './reliability-hardening-evaluator.js';

export {
  recordReliabilityHardeningHistory,
  getReliabilityHardeningHistory,
  getReliabilityHardeningHistorySize,
  clearReliabilityHardeningHistory,
  resetReliabilityHardeningHistoryForTests,
} from './reliability-hardening-history.js';

export {
  generateReliabilityHardeningReport,
  getReportCount,
  resetReliabilityHardeningReportingForTests,
} from './reliability-hardening-reporting.js';

export {
  getDevPulseV2ReliabilityHardening,
  registerReliabilityHardeningWithCentralBrain,
  registerReliabilityHardeningWithFoundation,
  registerReliabilityHardeningWithCapabilityRegistry,
  registerReliabilityHardeningWithFindPanel,
  registerReliabilityHardeningWithUvl,
  registerReliabilityHardeningWithUnifiedTrustScore,
  registerReliabilityHardeningWithTrustEngineCheckpoint,
  registerReliabilityHardeningWithUnifiedVerificationLab,
  registerReliabilityHardeningWithOperatorFeed,
  registerReliabilityHardeningWithNotificationVault,
  registerReliabilityHardeningWithNotificationDelivery,
  registerReliabilityHardeningWithWorld2,
  registerReliabilityHardeningWithMobileCommand,
  registerReliabilityHardeningWithSelfEvolutionGovernance,
  registerReliabilityHardeningWithMissingCapabilityEscalation,
  evaluateReliabilityHardeningEngine,
  getReliabilityHardeningRuntimeReport,
} from './reliability-hardening.js';

export type { ReliabilityHardeningSystemSnapshot } from './reliability-hardening.js';

export function resetReliabilityHardeningForTests(): void {
  resetReliabilityHardeningRegistryForTests();
  resetReliabilityHardeningCacheForTests();
  resetFailureSurfaceAnalyzerForTests();
  resetRuntimeStabilityAnalyzerForTests();
  resetReliabilityBoundaryCheckerForTests();
  resetRecoveryReadinessAnalyzerForTests();
  resetReliabilityConsistencyAnalyzerForTests();
  resetReliabilityAuthorityBuilderForTests();
  resetReliabilityHardeningEvaluatorForTests();
  resetReliabilityHardeningHistoryForTests();
  resetReliabilityHardeningReportingForTests();
  resetReliabilityHardeningOrchestrationForTests();
}

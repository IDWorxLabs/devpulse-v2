/**
 * Recovery Hardening — public exports.
 */

import { resetRecoveryHardeningRegistryForTests } from './recovery-hardening-registry.js';
import { resetRecoveryHardeningCacheForTests } from './recovery-hardening-cache.js';
import { resetRollbackReadinessAnalyzerForTests } from './rollback-readiness-analyzer.js';
import { resetFailureContainmentAnalyzerForTests } from './failure-containment-analyzer.js';
import { resetResetReadinessAnalyzerForTests } from './reset-readiness-analyzer.js';
import { resetEscalationReadinessAnalyzerForTests } from './escalation-readiness-analyzer.js';
import { resetDisasterRecoveryReadinessAnalyzerForTests } from './disaster-recovery-readiness-analyzer.js';
import { resetRecoveryAuthorityBuilderForTests } from './recovery-authority-builder.js';
import { resetRecoveryHardeningEvaluatorForTests } from './recovery-hardening-evaluator.js';
import { resetRecoveryHardeningHistoryForTests } from './recovery-hardening-history.js';
import { resetRecoveryHardeningReportingForTests } from './recovery-hardening-reporting.js';
import { resetRecoveryHardeningOrchestrationForTests } from './recovery-hardening.js';

export {
  RECOVERY_HARDENING_PASS_TOKEN,
  RECOVERY_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_RECOVERY_HARDENING_HISTORY_SIZE,
  RECOVERY_HARDENING_QUESTION_SIGNALS,
  isRecoveryHardeningQuestion,
  resolveRecoveryRiskLevel,
  resolveRecoveryState,
} from './recovery-hardening-types.js';

export type {
  RecoveryRiskLevel,
  RecoveryState,
  RecoveryHardeningRecord,
  RollbackReadinessAnalysis,
  FailureContainmentAnalysis,
  ResetReadinessAnalysis,
  EscalationReadinessAnalysis,
  DisasterRecoveryReadinessAnalysis,
  UnifiedRecoveryHardeningAuthority,
  RecoveryHardeningEvaluation,
  RecoveryHardeningHistoryEntry,
  RecoveryHardeningReport,
  RecoveryHardeningInput,
  RecoveryHardeningResult,
  RecoveryHardeningRuntimeReport,
} from './recovery-hardening-types.js';

export { getRecoveryHardeningCacheStats, resetRecoveryHardeningCacheForTests } from './recovery-hardening-cache.js';

export {
  registerRecoveryHardeningRecord,
  getRecoveryHardeningRecord,
  lookupRecoveryByProjectId,
  lookupRecoveryByWorkspaceId,
  lookupRecoveryByRiskLevel,
  lookupRecoveryByState,
  listRecoveryHardeningRecords,
  getRecoveryHardeningRecordCount,
  resetRecoveryHardeningRegistryForTests,
} from './recovery-hardening-registry.js';

export {
  analyzeRollbackReadiness,
  getRollbackAnalysisCount,
  resetRollbackReadinessAnalyzerForTests,
} from './rollback-readiness-analyzer.js';

export {
  analyzeFailureContainment,
  getContainmentAnalysisCount,
  resetFailureContainmentAnalyzerForTests,
} from './failure-containment-analyzer.js';

export {
  analyzeResetReadiness,
  getResetAnalysisCount,
  resetResetReadinessAnalyzerForTests,
} from './reset-readiness-analyzer.js';

export {
  analyzeEscalationReadiness,
  getEscalationAnalysisCount,
  resetEscalationReadinessAnalyzerForTests,
} from './escalation-readiness-analyzer.js';

export {
  analyzeDisasterRecoveryReadiness,
  getDisasterRecoveryAnalysisCount,
  resetDisasterRecoveryReadinessAnalyzerForTests,
} from './disaster-recovery-readiness-analyzer.js';

export {
  buildUnifiedRecoveryHardeningAuthority,
  getAuthorityBuildCount,
  resetRecoveryAuthorityBuilderForTests,
} from './recovery-authority-builder.js';

export {
  evaluateRecoveryHardening,
  getEvaluationCount,
  resetRecoveryHardeningEvaluatorForTests,
} from './recovery-hardening-evaluator.js';

export {
  recordRecoveryHardeningHistory,
  getRecoveryHardeningHistory,
  getRecoveryHardeningHistorySize,
  clearRecoveryHardeningHistory,
  resetRecoveryHardeningHistoryForTests,
} from './recovery-hardening-history.js';

export {
  generateRecoveryHardeningReport,
  getReportCount,
  resetRecoveryHardeningReportingForTests,
} from './recovery-hardening-reporting.js';

export {
  getDevPulseV2RecoveryHardening,
  registerRecoveryHardeningWithCentralBrain,
  registerRecoveryHardeningWithFoundation,
  registerRecoveryHardeningWithCapabilityRegistry,
  registerRecoveryHardeningWithFindPanel,
  registerRecoveryHardeningWithUvl,
  registerRecoveryHardeningWithUnifiedTrustScore,
  registerRecoveryHardeningWithTrustEngineCheckpoint,
  registerRecoveryHardeningWithUnifiedVerificationLab,
  registerRecoveryHardeningWithReliabilityHardening,
  registerRecoveryHardeningWithPerformanceHardening,
  registerRecoveryHardeningWithSecurityHardening,
  registerRecoveryHardeningWithPrivacyHardening,
  registerRecoveryHardeningWithAutonomousVerification,
  registerRecoveryHardeningWithAutonomousCompletion,
  registerRecoveryHardeningWithCloudWorkerRuntime,
  registerRecoveryHardeningWithExecutionAuthority,
  registerRecoveryHardeningWithOperatorFeed,
  registerRecoveryHardeningWithNotificationVault,
  registerRecoveryHardeningWithNotificationDelivery,
  registerRecoveryHardeningWithWorld2,
  registerRecoveryHardeningWithMobileCommand,
  registerRecoveryHardeningWithSelfEvolutionGovernance,
  registerRecoveryHardeningWithMissingCapabilityEscalation,
  evaluateRecoveryHardeningEngine,
  getRecoveryHardeningRuntimeReport,
} from './recovery-hardening.js';

export type { RecoveryHardeningSystemSnapshot } from './recovery-hardening.js';

export function resetRecoveryHardeningForTests(): void {
  resetRecoveryHardeningRegistryForTests();
  resetRecoveryHardeningCacheForTests();
  resetRollbackReadinessAnalyzerForTests();
  resetFailureContainmentAnalyzerForTests();
  resetResetReadinessAnalyzerForTests();
  resetEscalationReadinessAnalyzerForTests();
  resetDisasterRecoveryReadinessAnalyzerForTests();
  resetRecoveryAuthorityBuilderForTests();
  resetRecoveryHardeningEvaluatorForTests();
  resetRecoveryHardeningHistoryForTests();
  resetRecoveryHardeningReportingForTests();
  resetRecoveryHardeningOrchestrationForTests();
}

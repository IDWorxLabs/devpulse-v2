/**
 * Security Hardening — public exports.
 */

import { resetSecurityHardeningRegistryForTests } from './security-hardening-registry.js';
import { resetSecurityHardeningCacheForTests } from './security-hardening-cache.js';
import { resetSecurityBoundaryAnalyzerForTests } from './security-boundary-analyzer.js';
import { resetSecretExposureAnalyzerForTests } from './secret-exposure-analyzer.js';
import { resetUnsafeCapabilityDetectorForTests } from './unsafe-capability-detector.js';
import { resetAccessControlReadinessAnalyzerForTests } from './access-control-readiness-analyzer.js';
import { resetWorkspaceIsolationAnalyzerForTests } from './workspace-isolation-analyzer.js';
import { resetSecurityAuthorityBuilderForTests } from './security-authority-builder.js';
import { resetSecurityHardeningEvaluatorForTests } from './security-hardening-evaluator.js';
import { resetSecurityHardeningHistoryForTests } from './security-hardening-history.js';
import { resetSecurityHardeningReportingForTests } from './security-hardening-reporting.js';
import { resetSecurityHardeningOrchestrationForTests } from './security-hardening.js';

export {
  SECURITY_HARDENING_PASS_TOKEN,
  SECURITY_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE,
  SECURITY_HARDENING_QUESTION_SIGNALS,
  isSecurityHardeningQuestion,
  resolveSecurityRiskLevel,
  resolveSecurityState,
  redactSecretValue,
} from './security-hardening-types.js';

export type {
  SecurityRiskLevel,
  SecurityState,
  SecretExposureType,
  UnsafeCapabilityType,
  RedactedExposureFinding,
  SecurityHardeningRecord,
  SecurityBoundaryAnalysis,
  SecretExposureAnalysis,
  UnsafeCapabilityDetection,
  AccessControlReadinessAnalysis,
  WorkspaceIsolationAnalysis,
  UnifiedSecurityHardeningAuthority,
  SecurityHardeningEvaluation,
  SecurityHardeningHistoryEntry,
  SecurityHardeningReport,
  SecurityHardeningInput,
  SecurityHardeningResult,
  SecurityHardeningRuntimeReport,
} from './security-hardening-types.js';

export { getSecurityHardeningCacheStats, resetSecurityHardeningCacheForTests } from './security-hardening-cache.js';

export {
  registerSecurityHardeningRecord,
  getSecurityHardeningRecord,
  lookupSecurityByProjectId,
  lookupSecurityByWorkspaceId,
  lookupSecurityByRiskLevel,
  lookupSecurityByState,
  listSecurityHardeningRecords,
  getSecurityHardeningRecordCount,
  resetSecurityHardeningRegistryForTests,
} from './security-hardening-registry.js';

export {
  analyzeSecurityBoundaries,
  getBoundaryAnalysisCount,
  resetSecurityBoundaryAnalyzerForTests,
} from './security-boundary-analyzer.js';

export {
  analyzeSecretExposure,
  getExposureAnalysisCount,
  resetSecretExposureAnalyzerForTests,
} from './secret-exposure-analyzer.js';

export {
  detectUnsafeCapabilities,
  getUnsafeCapabilityDetectionCount,
  resetUnsafeCapabilityDetectorForTests,
} from './unsafe-capability-detector.js';

export {
  analyzeAccessControlReadiness,
  getAccessControlAnalysisCount,
  resetAccessControlReadinessAnalyzerForTests,
} from './access-control-readiness-analyzer.js';

export {
  analyzeWorkspaceIsolation,
  getIsolationAnalysisCount,
  resetWorkspaceIsolationAnalyzerForTests,
} from './workspace-isolation-analyzer.js';

export {
  buildUnifiedSecurityHardeningAuthority,
  getAuthorityBuildCount,
  resetSecurityAuthorityBuilderForTests,
} from './security-authority-builder.js';

export {
  evaluateSecurityHardening,
  getEvaluationCount,
  resetSecurityHardeningEvaluatorForTests,
} from './security-hardening-evaluator.js';

export {
  recordSecurityHardeningHistory,
  getSecurityHardeningHistory,
  getSecurityHardeningHistorySize,
  clearSecurityHardeningHistory,
  resetSecurityHardeningHistoryForTests,
} from './security-hardening-history.js';

export {
  generateSecurityHardeningReport,
  getReportCount,
  resetSecurityHardeningReportingForTests,
} from './security-hardening-reporting.js';

export {
  getDevPulseV2SecurityHardening,
  registerSecurityHardeningWithCentralBrain,
  registerSecurityHardeningWithFoundation,
  registerSecurityHardeningWithCapabilityRegistry,
  registerSecurityHardeningWithFindPanel,
  registerSecurityHardeningWithUvl,
  registerSecurityHardeningWithUnifiedTrustScore,
  registerSecurityHardeningWithTrustEngineCheckpoint,
  registerSecurityHardeningWithUnifiedVerificationLab,
  registerSecurityHardeningWithReliabilityHardening,
  registerSecurityHardeningWithPerformanceHardening,
  registerSecurityHardeningWithAutonomousVerification,
  registerSecurityHardeningWithAutonomousCompletion,
  registerSecurityHardeningWithCloudWorkerRuntime,
  registerSecurityHardeningWithExecutionAuthority,
  registerSecurityHardeningWithOperatorFeed,
  registerSecurityHardeningWithNotificationVault,
  registerSecurityHardeningWithNotificationDelivery,
  registerSecurityHardeningWithWorld2,
  registerSecurityHardeningWithMobileCommand,
  registerSecurityHardeningWithSelfEvolutionGovernance,
  registerSecurityHardeningWithMissingCapabilityEscalation,
  evaluateSecurityHardeningEngine,
  getSecurityHardeningRuntimeReport,
} from './security-hardening.js';

export type { SecurityHardeningSystemSnapshot } from './security-hardening.js';

export function resetSecurityHardeningForTests(): void {
  resetSecurityHardeningRegistryForTests();
  resetSecurityHardeningCacheForTests();
  resetSecurityBoundaryAnalyzerForTests();
  resetSecretExposureAnalyzerForTests();
  resetUnsafeCapabilityDetectorForTests();
  resetAccessControlReadinessAnalyzerForTests();
  resetWorkspaceIsolationAnalyzerForTests();
  resetSecurityAuthorityBuilderForTests();
  resetSecurityHardeningEvaluatorForTests();
  resetSecurityHardeningHistoryForTests();
  resetSecurityHardeningReportingForTests();
  resetSecurityHardeningOrchestrationForTests();
}

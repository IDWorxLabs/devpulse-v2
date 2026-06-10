/**
 * Privacy Hardening — public exports.
 */

import { resetPrivacyHardeningRegistryForTests } from './privacy-hardening-registry.js';
import { resetPrivacyHardeningCacheForTests } from './privacy-hardening-cache.js';
import { resetPersonalDataSurfaceAnalyzerForTests } from './personal-data-surface-analyzer.js';
import { resetProjectDataBoundaryAnalyzerForTests } from './project-data-boundary-analyzer.js';
import { resetRetentionRiskAnalyzerForTests } from './retention-risk-analyzer.js';
import { resetDisclosureRiskAnalyzerForTests } from './disclosure-risk-analyzer.js';
import { resetPrivacyRedactionReadinessAnalyzerForTests } from './privacy-redaction-readiness-analyzer.js';
import { resetPrivacyComplianceReadinessAnalyzerForTests } from './privacy-compliance-readiness-analyzer.js';
import { resetPrivacyAuthorityBuilderForTests } from './privacy-authority-builder.js';
import { resetPrivacyHardeningEvaluatorForTests } from './privacy-hardening-evaluator.js';
import { resetPrivacyHardeningHistoryForTests } from './privacy-hardening-history.js';
import { resetPrivacyHardeningReportingForTests } from './privacy-hardening-reporting.js';
import { resetPrivacyHardeningOrchestrationForTests } from './privacy-hardening.js';

export {
  PRIVACY_HARDENING_PASS_TOKEN,
  PRIVACY_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE,
  PRIVACY_HARDENING_QUESTION_SIGNALS,
  isPrivacyHardeningQuestion,
  resolvePrivacyRiskLevel,
  resolvePrivacyState,
  redactPrivateData,
} from './privacy-hardening-types.js';

export type {
  PrivacyRiskLevel,
  PrivacyState,
  PersonalDataSurfaceType,
  DisclosureChannelType,
  RedactedDisclosureFinding,
  PrivacyHardeningRecord,
  PersonalDataSurfaceAnalysis,
  ProjectDataBoundaryAnalysis,
  RetentionRiskAnalysis,
  DisclosureRiskAnalysis,
  RedactionReadinessAnalysis,
  ComplianceReadinessAnalysis,
  UnifiedPrivacyHardeningAuthority,
  PrivacyHardeningEvaluation,
  PrivacyHardeningHistoryEntry,
  PrivacyHardeningReport,
  PrivacyHardeningInput,
  PrivacyHardeningResult,
  PrivacyHardeningRuntimeReport,
} from './privacy-hardening-types.js';

export { getPrivacyHardeningCacheStats, resetPrivacyHardeningCacheForTests } from './privacy-hardening-cache.js';

export {
  registerPrivacyHardeningRecord,
  getPrivacyHardeningRecord,
  lookupPrivacyByProjectId,
  lookupPrivacyByWorkspaceId,
  lookupPrivacyByRiskLevel,
  lookupPrivacyByState,
  listPrivacyHardeningRecords,
  getPrivacyHardeningRecordCount,
  resetPrivacyHardeningRegistryForTests,
} from './privacy-hardening-registry.js';

export {
  analyzePersonalDataSurfaces,
  getPersonalDataSurfaceAnalysisCount,
  resetPersonalDataSurfaceAnalyzerForTests,
} from './personal-data-surface-analyzer.js';

export {
  analyzeProjectDataBoundaries,
  getDataBoundaryAnalysisCount,
  resetProjectDataBoundaryAnalyzerForTests,
} from './project-data-boundary-analyzer.js';

export {
  analyzeRetentionRisk,
  getRetentionAnalysisCount,
  resetRetentionRiskAnalyzerForTests,
} from './retention-risk-analyzer.js';

export {
  analyzeDisclosureRisk,
  getDisclosureAnalysisCount,
  resetDisclosureRiskAnalyzerForTests,
} from './disclosure-risk-analyzer.js';

export {
  analyzeRedactionReadiness,
  getRedactionReadinessAnalysisCount,
  resetPrivacyRedactionReadinessAnalyzerForTests,
} from './privacy-redaction-readiness-analyzer.js';

export {
  analyzeComplianceReadiness,
  getComplianceReadinessAnalysisCount,
  resetPrivacyComplianceReadinessAnalyzerForTests,
} from './privacy-compliance-readiness-analyzer.js';

export {
  buildUnifiedPrivacyHardeningAuthority,
  getAuthorityBuildCount,
  resetPrivacyAuthorityBuilderForTests,
} from './privacy-authority-builder.js';

export {
  evaluatePrivacyHardening,
  getEvaluationCount,
  resetPrivacyHardeningEvaluatorForTests,
} from './privacy-hardening-evaluator.js';

export {
  recordPrivacyHardeningHistory,
  getPrivacyHardeningHistory,
  getPrivacyHardeningHistorySize,
  clearPrivacyHardeningHistory,
  resetPrivacyHardeningHistoryForTests,
} from './privacy-hardening-history.js';

export {
  generatePrivacyHardeningReport,
  getReportCount,
  resetPrivacyHardeningReportingForTests,
} from './privacy-hardening-reporting.js';

export {
  getDevPulseV2PrivacyHardening,
  registerPrivacyHardeningWithCentralBrain,
  registerPrivacyHardeningWithFoundation,
  registerPrivacyHardeningWithCapabilityRegistry,
  registerPrivacyHardeningWithFindPanel,
  registerPrivacyHardeningWithUvl,
  registerPrivacyHardeningWithUnifiedTrustScore,
  registerPrivacyHardeningWithTrustEngineCheckpoint,
  registerPrivacyHardeningWithUnifiedVerificationLab,
  registerPrivacyHardeningWithReliabilityHardening,
  registerPrivacyHardeningWithPerformanceHardening,
  registerPrivacyHardeningWithSecurityHardening,
  registerPrivacyHardeningWithCloudWorkerRuntime,
  registerPrivacyHardeningWithExecutionAuthority,
  registerPrivacyHardeningWithOperatorFeed,
  registerPrivacyHardeningWithNotificationVault,
  registerPrivacyHardeningWithNotificationDelivery,
  registerPrivacyHardeningWithWorld2,
  registerPrivacyHardeningWithMobileCommand,
  registerPrivacyHardeningWithSelfEvolutionGovernance,
  registerPrivacyHardeningWithMissingCapabilityEscalation,
  evaluatePrivacyHardeningEngine,
  getPrivacyHardeningRuntimeReport,
} from './privacy-hardening.js';

export type { PrivacyHardeningSystemSnapshot } from './privacy-hardening.js';

export function resetPrivacyHardeningForTests(): void {
  resetPrivacyHardeningRegistryForTests();
  resetPrivacyHardeningCacheForTests();
  resetPersonalDataSurfaceAnalyzerForTests();
  resetProjectDataBoundaryAnalyzerForTests();
  resetRetentionRiskAnalyzerForTests();
  resetDisclosureRiskAnalyzerForTests();
  resetPrivacyRedactionReadinessAnalyzerForTests();
  resetPrivacyComplianceReadinessAnalyzerForTests();
  resetPrivacyAuthorityBuilderForTests();
  resetPrivacyHardeningEvaluatorForTests();
  resetPrivacyHardeningHistoryForTests();
  resetPrivacyHardeningReportingForTests();
  resetPrivacyHardeningOrchestrationForTests();
}

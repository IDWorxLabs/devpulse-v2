/**
 * Self Documentation — public exports.
 */

import { resetSelfDocumentationRegistryForTests } from './self-documentation-registry.js';
import { resetSelfDocumentationCacheForTests } from './self-documentation-cache.js';
import { resetCapabilityDocumentationAnalyzerForTests } from './capability-documentation-analyzer.js';
import { resetModuleDocumentationAnalyzerForTests } from './module-documentation-analyzer.js';
import { resetDependencyDocumentationAnalyzerForTests } from './dependency-documentation-analyzer.js';
import { resetAuthorityChainDocumentationAnalyzerForTests } from './authority-chain-documentation-analyzer.js';
import { resetValidationDocumentationAnalyzerForTests } from './validation-documentation-analyzer.js';
import { resetSelfDocumentationAuthorityBuilderForTests } from './self-documentation-authority-builder.js';
import { resetSelfDocumentationEvaluatorForTests } from './self-documentation-evaluator.js';
import { resetSelfDocumentationHistoryForTests } from './self-documentation-history.js';
import { resetSelfDocumentationReportingForTests } from './self-documentation-reporting.js';
import { resetSelfDocumentationOrchestrationForTests } from './self-documentation.js';

export {
  SELF_DOCUMENTATION_PASS_TOKEN,
  SELF_DOCUMENTATION_OWNER_MODULE,
  DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE,
  SELF_DOCUMENTATION_QUESTION_SIGNALS,
  isSelfDocumentationQuestion,
  resolveDocumentationCompletenessLevel,
  resolveDocumentationState,
} from './self-documentation-types.js';

export type {
  DocumentationCompletenessLevel,
  DocumentationState,
  SelfDocumentationRecord,
  CapabilityDocumentationAnalysis,
  ModuleDocumentationAnalysis,
  DependencyDocumentationAnalysis,
  AuthorityChainDocumentationAnalysis,
  ValidationDocumentationAnalysis,
  UnifiedSelfDocumentationAuthority,
  SelfDocumentationEvaluation,
  SelfDocumentationHistoryEntry,
  SelfDocumentationReport,
  SelfDocumentationInput,
  SelfDocumentationResult,
  SelfDocumentationRuntimeReport,
} from './self-documentation-types.js';

export { getSelfDocumentationCacheStats, resetSelfDocumentationCacheForTests } from './self-documentation-cache.js';

export {
  registerSelfDocumentationRecord,
  getSelfDocumentationRecord,
  lookupDocumentationByProjectId,
  lookupDocumentationByWorkspaceId,
  lookupDocumentationByCompletenessLevel,
  lookupDocumentationByState,
  listSelfDocumentationRecords,
  getSelfDocumentationRecordCount,
  resetSelfDocumentationRegistryForTests,
} from './self-documentation-registry.js';

export {
  analyzeCapabilityDocumentation,
  getCapabilityAnalysisCount,
  resetCapabilityDocumentationAnalyzerForTests,
} from './capability-documentation-analyzer.js';

export type { CapabilityDocumentationSnapshot } from './capability-documentation-analyzer.js';

export {
  analyzeModuleDocumentation,
  getModuleAnalysisCount,
  resetModuleDocumentationAnalyzerForTests,
} from './module-documentation-analyzer.js';

export type { ModuleDocumentationSnapshot } from './module-documentation-analyzer.js';

export {
  analyzeDependencyDocumentation,
  getDependencyAnalysisCount,
  listBaseDependencies,
  resetDependencyDocumentationAnalyzerForTests,
} from './dependency-documentation-analyzer.js';

export type { DependencyDocumentationSnapshot } from './dependency-documentation-analyzer.js';

export {
  analyzeAuthorityChainDocumentation,
  getAuthorityAnalysisCount,
  listBaseAuthorityChains,
  resetAuthorityChainDocumentationAnalyzerForTests,
} from './authority-chain-documentation-analyzer.js';

export type { AuthorityChainDocumentationSnapshot } from './authority-chain-documentation-analyzer.js';

export {
  analyzeValidationDocumentation,
  getValidationAnalysisCount,
  resetValidationDocumentationAnalyzerForTests,
} from './validation-documentation-analyzer.js';

export type { ValidationDocumentationSnapshot } from './validation-documentation-analyzer.js';

export {
  buildUnifiedSelfDocumentationAuthority,
  getAuthorityBuildCount,
  resetSelfDocumentationAuthorityBuilderForTests,
} from './self-documentation-authority-builder.js';

export {
  evaluateSelfDocumentation,
  getEvaluationCount,
  resetSelfDocumentationEvaluatorForTests,
} from './self-documentation-evaluator.js';

export {
  recordSelfDocumentationHistory,
  getSelfDocumentationHistory,
  getSelfDocumentationHistorySize,
  clearSelfDocumentationHistory,
  resetSelfDocumentationHistoryForTests,
} from './self-documentation-history.js';

export {
  generateSelfDocumentationReport,
  getReportCount,
  resetSelfDocumentationReportingForTests,
} from './self-documentation-reporting.js';

export {
  getDevPulseV2SelfDocumentation,
  registerSelfDocumentationWithCentralBrain,
  registerSelfDocumentationWithFoundation,
  registerSelfDocumentationWithCapabilityRegistry,
  registerSelfDocumentationWithFindPanel,
  registerSelfDocumentationWithUvl,
  registerSelfDocumentationWithUnifiedTrustScore,
  registerSelfDocumentationWithTrustEngineCheckpoint,
  registerSelfDocumentationWithProductHardeningCheckpoint,
  registerSelfDocumentationWithReliabilityHardening,
  registerSelfDocumentationWithPerformanceHardening,
  registerSelfDocumentationWithSecurityHardening,
  registerSelfDocumentationWithPrivacyHardening,
  registerSelfDocumentationWithRecoveryHardening,
  registerSelfDocumentationWithScaleHardening,
  registerSelfDocumentationWithProjectVault,
  registerSelfDocumentationWithWorld2,
  registerSelfDocumentationWithSelfEvolutionGovernance,
  registerSelfDocumentationWithMissingCapabilityEscalation,
  evaluateSelfDocumentationEngine,
  getSelfDocumentationRuntimeReport,
} from './self-documentation.js';

export type { SelfDocumentationSystemSnapshot } from './self-documentation.js';

export function resetSelfDocumentationForTests(): void {
  resetSelfDocumentationRegistryForTests();
  resetSelfDocumentationCacheForTests();
  resetCapabilityDocumentationAnalyzerForTests();
  resetModuleDocumentationAnalyzerForTests();
  resetDependencyDocumentationAnalyzerForTests();
  resetAuthorityChainDocumentationAnalyzerForTests();
  resetValidationDocumentationAnalyzerForTests();
  resetSelfDocumentationAuthorityBuilderForTests();
  resetSelfDocumentationEvaluatorForTests();
  resetSelfDocumentationHistoryForTests();
  resetSelfDocumentationReportingForTests();
  resetSelfDocumentationOrchestrationForTests();
}

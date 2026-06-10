/**
 * API Documentation — public exports.
 */

import { resetApiDocumentationRegistryForTests } from './api-documentation-registry.js';
import { resetApiDocumentationCacheForTests } from './api-documentation-cache.js';
import { resetApiSurfaceAnalyzerForTests } from './api-surface-analyzer.js';
import { resetInterfaceDocumentationAnalyzerForTests } from './interface-documentation-analyzer.js';
import { resetContractDocumentationAnalyzerForTests } from './contract-documentation-analyzer.js';
import { resetIntegrationApiAnalyzerForTests } from './integration-api-analyzer.js';
import { resetCommandSurfaceAnalyzerForTests } from './command-surface-analyzer.js';
import { resetApiDocumentationAuthorityBuilderForTests } from './api-documentation-authority-builder.js';
import { resetApiDocumentationEvaluatorForTests } from './api-documentation-evaluator.js';
import { resetApiDocumentationHistoryForTests } from './api-documentation-history.js';
import { resetApiDocumentationReportingForTests } from './api-documentation-reporting.js';
import { resetApiDocumentationOrchestrationForTests } from './api-documentation.js';

export {
  API_DOCUMENTATION_PASS_TOKEN,
  API_DOCUMENTATION_OWNER_MODULE,
  DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE,
  API_DOCUMENTATION_QUESTION_SIGNALS,
  isApiDocumentationQuestion,
  resolveApiCoverageLevel,
  resolveApiDocumentationState,
} from './api-documentation-types.js';

export type {
  ApiCoverageLevel,
  ApiDocumentationState,
  ApiDocumentationRecord,
  ApiSurfaceAnalysis,
  InterfaceDocumentationAnalysis,
  ContractDocumentationAnalysis,
  IntegrationApiAnalysis,
  CommandSurfaceAnalysis,
  UnifiedApiDocumentationAuthority,
  ApiDocumentationEvaluation,
  ApiDocumentationHistoryEntry,
  ApiDocumentationReport,
  ApiDocumentationInput,
  ApiDocumentationResult,
  ApiDocumentationRuntimeReport,
} from './api-documentation-types.js';

export {
  getApiDocumentationCacheStats,
  resetApiDocumentationCacheForTests,
} from './api-documentation-cache.js';

export {
  registerApiDocumentationRecord,
  getApiDocumentationRecord,
  lookupApiDocumentationByProjectId,
  lookupApiDocumentationByWorkspaceId,
  lookupApiDocumentationByCoverageLevel,
  lookupApiDocumentationByState,
  listApiDocumentationRecords,
  getApiDocumentationRecordCount,
  resetApiDocumentationRegistryForTests,
} from './api-documentation-registry.js';

export {
  analyzeApiSurface,
  getApiSurfaceAnalysisCount,
  listBaseApis,
  resetApiSurfaceAnalyzerForTests,
} from './api-surface-analyzer.js';

export type { ApiSurfaceSnapshot } from './api-surface-analyzer.js';

export {
  analyzeInterfaceDocumentation,
  getInterfaceAnalysisCount,
  listBaseInterfaces,
  resetInterfaceDocumentationAnalyzerForTests,
} from './interface-documentation-analyzer.js';

export type { InterfaceDocumentationSnapshot } from './interface-documentation-analyzer.js';

export {
  analyzeContractDocumentation,
  getContractAnalysisCount,
  listBaseContracts,
  resetContractDocumentationAnalyzerForTests,
} from './contract-documentation-analyzer.js';

export type { ContractDocumentationSnapshot } from './contract-documentation-analyzer.js';

export {
  analyzeIntegrationApis,
  getIntegrationAnalysisCount,
  listBaseIntegrationApis,
  resetIntegrationApiAnalyzerForTests,
} from './integration-api-analyzer.js';

export type { IntegrationApiSnapshot } from './integration-api-analyzer.js';

export {
  analyzeCommandSurface,
  getCommandAnalysisCount,
  listBaseCommands,
  resetCommandSurfaceAnalyzerForTests,
} from './command-surface-analyzer.js';

export type { CommandSurfaceSnapshot } from './command-surface-analyzer.js';

export {
  buildUnifiedApiDocumentationAuthority,
  getAuthorityBuildCount,
  resetApiDocumentationAuthorityBuilderForTests,
} from './api-documentation-authority-builder.js';

export {
  evaluateApiDocumentation,
  getEvaluationCount,
  resetApiDocumentationEvaluatorForTests,
} from './api-documentation-evaluator.js';

export {
  recordApiDocumentationHistory,
  getApiDocumentationHistory,
  getApiDocumentationHistorySize,
  clearApiDocumentationHistory,
  resetApiDocumentationHistoryForTests,
} from './api-documentation-history.js';

export {
  generateApiDocumentationReport,
  getReportCount,
  resetApiDocumentationReportingForTests,
} from './api-documentation-reporting.js';

export {
  getDevPulseV2ApiDocumentation,
  registerApiDocumentationWithCentralBrain,
  registerApiDocumentationWithSelfDocumentation,
  registerApiDocumentationWithFounderGuides,
  registerApiDocumentationWithUserGuides,
  registerApiDocumentationWithArchitectureDocumentation,
  registerApiDocumentationWithFoundation,
  registerApiDocumentationWithCapabilityRegistry,
  registerApiDocumentationWithFindPanel,
  registerApiDocumentationWithUvl,
  registerApiDocumentationWithTrustEngineCheckpoint,
  registerApiDocumentationWithProductHardeningCheckpoint,
  registerApiDocumentationWithWorld2,
  registerApiDocumentationWithMobileCommand,
  registerApiDocumentationWithCloudWorkerRuntime,
  registerApiDocumentationWithNotificationSystems,
  registerApiDocumentationWithSelfEvolutionGovernance,
  registerApiDocumentationWithMissingCapabilityEscalation,
  registerApiDocumentationWithProjectVault,
  evaluateApiDocumentationEngine,
  getApiDocumentationRuntimeReport,
} from './api-documentation.js';

export type { ApiDocumentationSystemSnapshot } from './api-documentation.js';

export function resetApiDocumentationForTests(): void {
  resetApiDocumentationRegistryForTests();
  resetApiDocumentationCacheForTests();
  resetApiSurfaceAnalyzerForTests();
  resetInterfaceDocumentationAnalyzerForTests();
  resetContractDocumentationAnalyzerForTests();
  resetIntegrationApiAnalyzerForTests();
  resetCommandSurfaceAnalyzerForTests();
  resetApiDocumentationAuthorityBuilderForTests();
  resetApiDocumentationEvaluatorForTests();
  resetApiDocumentationHistoryForTests();
  resetApiDocumentationReportingForTests();
  resetApiDocumentationOrchestrationForTests();
}

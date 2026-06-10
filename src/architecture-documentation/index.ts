/**
 * Architecture Documentation — public exports.
 */

import { resetArchitectureDocumentationRegistryForTests } from './architecture-documentation-registry.js';
import { resetArchitectureDocumentationCacheForTests } from './architecture-documentation-cache.js';
import { resetDomainArchitectureAnalyzerForTests } from './domain-architecture-analyzer.js';
import { resetDependencyGraphAnalyzerForTests } from './dependency-graph-analyzer.js';
import { resetIntegrationPointAnalyzerForTests } from './integration-point-analyzer.js';
import { resetArchitectureBoundaryAnalyzerForTests } from './architecture-boundary-analyzer.js';
import { resetAuthorityChainArchitectureAnalyzerForTests } from './authority-chain-architecture-analyzer.js';
import { resetArchitectureDocumentationAuthorityBuilderForTests } from './architecture-documentation-authority-builder.js';
import { resetArchitectureDocumentationEvaluatorForTests } from './architecture-documentation-evaluator.js';
import { resetArchitectureDocumentationHistoryForTests } from './architecture-documentation-history.js';
import { resetArchitectureDocumentationReportingForTests } from './architecture-documentation-reporting.js';
import { resetArchitectureDocumentationOrchestrationForTests } from './architecture-documentation.js';

export {
  ARCHITECTURE_DOCUMENTATION_PASS_TOKEN,
  ARCHITECTURE_DOCUMENTATION_OWNER_MODULE,
  DEFAULT_MAX_ARCHITECTURE_DOCUMENTATION_HISTORY_SIZE,
  ARCHITECTURE_DOCUMENTATION_QUESTION_SIGNALS,
  isArchitectureDocumentationQuestion,
  resolveArchitectureCoverageLevel,
  resolveArchitectureDocumentationState,
} from './architecture-documentation-types.js';

export type {
  ArchitectureCoverageLevel,
  ArchitectureDocumentationState,
  ArchitectureDocumentationRecord,
  DomainArchitectureAnalysis,
  DependencyGraphAnalysis,
  IntegrationPointAnalysis,
  ArchitectureBoundaryAnalysis,
  AuthorityChainArchitectureAnalysis,
  UnifiedArchitectureDocumentationAuthority,
  ArchitectureDocumentationEvaluation,
  ArchitectureDocumentationHistoryEntry,
  ArchitectureDocumentationReport,
  ArchitectureDocumentationInput,
  ArchitectureDocumentationResult,
  ArchitectureDocumentationRuntimeReport,
} from './architecture-documentation-types.js';

export {
  getArchitectureDocumentationCacheStats,
  resetArchitectureDocumentationCacheForTests,
} from './architecture-documentation-cache.js';

export {
  registerArchitectureDocumentationRecord,
  getArchitectureDocumentationRecord,
  lookupArchitectureDocumentationByProjectId,
  lookupArchitectureDocumentationByWorkspaceId,
  lookupArchitectureDocumentationByCoverageLevel,
  lookupArchitectureDocumentationByState,
  listArchitectureDocumentationRecords,
  getArchitectureDocumentationRecordCount,
  resetArchitectureDocumentationRegistryForTests,
} from './architecture-documentation-registry.js';

export {
  analyzeDomainArchitecture,
  getDomainAnalysisCount,
  listBaseDomainAreas,
  resetDomainArchitectureAnalyzerForTests,
} from './domain-architecture-analyzer.js';

export type { DomainArchitectureSnapshot } from './domain-architecture-analyzer.js';

export {
  analyzeDependencyGraph,
  getDependencyAnalysisCount,
  listBaseDependencies,
  resetDependencyGraphAnalyzerForTests,
} from './dependency-graph-analyzer.js';

export type { DependencyGraphSnapshot } from './dependency-graph-analyzer.js';

export {
  analyzeIntegrationPoints,
  getIntegrationAnalysisCount,
  listBaseIntegrations,
  resetIntegrationPointAnalyzerForTests,
} from './integration-point-analyzer.js';

export type { IntegrationPointSnapshot } from './integration-point-analyzer.js';

export {
  analyzeArchitectureBoundaries,
  getBoundaryAnalysisCount,
  listBaseBoundaries,
  resetArchitectureBoundaryAnalyzerForTests,
} from './architecture-boundary-analyzer.js';

export type { ArchitectureBoundarySnapshot } from './architecture-boundary-analyzer.js';

export {
  analyzeAuthorityChainArchitecture,
  getAuthorityAnalysisCount,
  listBaseAuthorityChains,
  resetAuthorityChainArchitectureAnalyzerForTests,
} from './authority-chain-architecture-analyzer.js';

export type { AuthorityChainArchitectureSnapshot } from './authority-chain-architecture-analyzer.js';

export {
  buildUnifiedArchitectureDocumentationAuthority,
  getAuthorityBuildCount,
  resetArchitectureDocumentationAuthorityBuilderForTests,
} from './architecture-documentation-authority-builder.js';

export {
  evaluateArchitectureDocumentation,
  getEvaluationCount,
  resetArchitectureDocumentationEvaluatorForTests,
} from './architecture-documentation-evaluator.js';

export {
  recordArchitectureDocumentationHistory,
  getArchitectureDocumentationHistory,
  getArchitectureDocumentationHistorySize,
  clearArchitectureDocumentationHistory,
  resetArchitectureDocumentationHistoryForTests,
} from './architecture-documentation-history.js';

export {
  generateArchitectureDocumentationReport,
  getReportCount,
  resetArchitectureDocumentationReportingForTests,
} from './architecture-documentation-reporting.js';

export {
  getDevPulseV2ArchitectureDocumentation,
  registerArchitectureDocumentationWithCentralBrain,
  registerArchitectureDocumentationWithSelfDocumentation,
  registerArchitectureDocumentationWithFounderGuides,
  registerArchitectureDocumentationWithUserGuides,
  registerArchitectureDocumentationWithFoundation,
  registerArchitectureDocumentationWithCapabilityRegistry,
  registerArchitectureDocumentationWithFindPanel,
  registerArchitectureDocumentationWithUvl,
  registerArchitectureDocumentationWithUnifiedTrustScore,
  registerArchitectureDocumentationWithTrustEngineCheckpoint,
  registerArchitectureDocumentationWithProductHardeningCheckpoint,
  registerArchitectureDocumentationWithWorld2,
  registerArchitectureDocumentationWithSelfEvolutionGovernance,
  registerArchitectureDocumentationWithMissingCapabilityEscalation,
  registerArchitectureDocumentationWithProjectVault,
  registerArchitectureDocumentationWithMobileCommand,
  registerArchitectureDocumentationWithCloudWorkerRuntime,
  evaluateArchitectureDocumentationEngine,
  getArchitectureDocumentationRuntimeReport,
} from './architecture-documentation.js';

export type { ArchitectureDocumentationSystemSnapshot } from './architecture-documentation.js';

export function resetArchitectureDocumentationForTests(): void {
  resetArchitectureDocumentationRegistryForTests();
  resetArchitectureDocumentationCacheForTests();
  resetDomainArchitectureAnalyzerForTests();
  resetDependencyGraphAnalyzerForTests();
  resetIntegrationPointAnalyzerForTests();
  resetArchitectureBoundaryAnalyzerForTests();
  resetAuthorityChainArchitectureAnalyzerForTests();
  resetArchitectureDocumentationAuthorityBuilderForTests();
  resetArchitectureDocumentationEvaluatorForTests();
  resetArchitectureDocumentationHistoryForTests();
  resetArchitectureDocumentationReportingForTests();
  resetArchitectureDocumentationOrchestrationForTests();
}

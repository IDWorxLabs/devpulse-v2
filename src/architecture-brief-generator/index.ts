/**
 * Architecture Brief Generator — public API (V1).
 */

export {
  ARCHITECTURE_BRIEF_GENERATOR_V1_PASS,
  ARCHITECTURE_BRIEF_GENERATOR_OWNER_MODULE,
  ARCHITECTURE_BRIEF_GENERATOR_PHASE,
  ARCHITECTURE_BRIEF_GENERATOR_REPORT_TITLE,
  MAX_ARCHITECTURE_BRIEF_HISTORY,
  ARCHITECTURE_BRIEF_QUALITY_LEVELS,
  ARCHITECTURE_BRIEF_READINESS_LEVELS,
  ARCHITECTURE_RISK_TYPES,
  ALLOWED_GATE_DECISIONS_FOR_ARCHITECTURE,
  SAFETY_GUARANTEES,
} from './architecture-brief-registry.js';

export type {
  ArchitectureBriefQuality,
  ArchitectureBriefReadiness,
  ArchitectureRiskType,
  ArchitectureRiskSeverity,
  ArchitectureBriefSystemOverview,
  ArchitectureFrontendSummary,
  ArchitectureBackendSummary,
  ArchitectureDataEntity,
  ArchitectureDataModelSummary,
  ArchitectureIntegrationItem,
  ArchitectureIntegrationSummary,
  ArchitectureSecuritySummary,
  ArchitectureRiskItem,
  ArchitectureRiskAnalysis,
  ArchitectureBrief,
  ArchitectureBriefHistoryEntry,
  ArchitectureBriefGeneratorReport,
  GenerateArchitectureBriefInput,
  ArchitectureBriefGeneration,
  ArchitectureEvidenceBundle,
} from './architecture-brief-types.js';

export {
  resetArchitectureBriefHistoryForTests,
  recordArchitectureBrief,
  getArchitectureBriefHistorySize,
  getArchitectureBriefHistory,
  getArchitectureBriefs,
  getLatestArchitectureBrief,
} from './architecture-brief-history.js';

export {
  generateArchitectureBrief,
  runArchitectureBriefGenerator,
  buildArchitectureBriefGeneratorArtifacts,
  resetArchitectureBriefGeneratorModuleForTests,
} from './architecture-brief-authority.js';

export {
  buildArchitectureBriefGeneratorReport,
  buildArchitectureBriefGeneratorReportMarkdown,
} from './architecture-brief-report-builder.js';

export {
  buildArchitectureBrief,
  buildArchitectureEvidenceBundle,
  buildSystemOverview,
  resetArchitectureBriefCounterForTests,
} from './architecture-brief-builder.js';

export { summarizeFrontendArchitecture } from './frontend-architecture-summarizer.js';
export { summarizeBackendArchitecture } from './backend-architecture-summarizer.js';
export { summarizeDataModel } from './data-model-summarizer.js';
export {
  summarizeIntegrationArchitecture,
  summarizeSecurityArchitecture,
} from './integration-architecture-summarizer.js';
export { detectArchitectureRisks } from './architecture-risk-detector.js';
export {
  validateArchitectureBrief,
  isArchitectureBriefStructurallyValid,
  mapArchitectureBriefQuality,
  mapArchitectureBriefReadiness,
} from './architecture-brief-validator.js';

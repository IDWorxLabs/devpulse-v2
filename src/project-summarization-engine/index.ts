/**
 * DevPulse V2 Phase 12.5 — Project Summarization Engine public API.
 */

export {
  PROJECT_SUMMARIZATION_ENGINE_PASS_TOKEN,
  PROJECT_SUMMARIZATION_ENGINE_OWNER_MODULE,
  SUMMARIZATION_QUESTION_SIGNALS,
  FORBIDDEN_SUMMARIZATION_DUPLICATES,
  isProjectSummarizationQuestion,
  resolveSummaryType,
  type SummaryType,
  type SummaryConfidence,
  type ProjectSummary,
  type SummarizationContext,
  type SummarizationResult,
  type ProjectSummarizationDiagnostics,
} from './project-summarization-types.js';

export { compressProjectContext, contextLines } from './project-context-compressor.js';
export { buildExecutiveSummary, buildFounderSummary, resetExecutiveSummaryCounterForTests } from './executive-summary-builder.js';
export { buildTechnicalSummary, resetTechnicalSummaryCounterForTests } from './technical-summary-builder.js';
export { buildProjectHealthSummary, buildRiskSummary, resetProjectHealthCounterForTests } from './project-health-builder.js';
export {
  buildProjectStatusSummary,
  buildMilestoneSummary,
  buildDependencySummary,
  buildWorkspaceSummary,
  buildAiOnboardingSummary,
  resetProjectStatusCounterForTests,
} from './project-status-builder.js';

export {
  getProjectSummarizationDiagnostics,
  updateProjectSummarizationDiagnostics,
  resetProjectSummarizationDiagnostics,
  projectSummarizationKey,
} from './project-summarization-diagnostics.js';

export {
  processProjectSummarizationRequest,
  getProjectSummarizationContext,
} from './project-summarization-engine.js';

export function getDevPulseV2ProjectSummarizationEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_project_summarization_engine',
    passToken: 'DEVPULSE_V2_PROJECT_SUMMARIZATION_ENGINE_FOUNDATION_V1_PASS',
    phase: 12.5,
  };
}

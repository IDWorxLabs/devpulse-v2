/**
 * Founder Workflow Validation — public exports.
 */

import { resetFounderWorkflowRegistryForTests } from './founder-workflow-registry.js';
import { resetFounderWorkflowCacheForTests } from './founder-workflow-cache.js';
import { resetWorkflowGapCounterForTests } from './workflow-gap-model.js';
import { resetWorkflowContextBuilderForTests } from './workflow-context-builder.js';
import { resetWorkflowClarityValidatorForTests } from './workflow-clarity-validator.js';
import { resetWorkflowDiscoverabilityValidatorForTests } from './workflow-discoverability-validator.js';
import { resetWorkflowContinuityValidatorForTests } from './workflow-continuity-validator.js';
import { resetWorkflowFrictionValidatorForTests } from './workflow-friction-validator.js';
import { resetWorkflowRecoveryValidatorForTests } from './workflow-recovery-validator.js';
import { resetWorkflowOutcomeValidatorForTests } from './workflow-outcome-validator.js';
import { resetWorkflowEfficiencyValidatorForTests } from './workflow-efficiency-validator.js';
import { resetWorkflowGapAnalyzerForTests } from './workflow-gap-analyzer.js';
import { resetWorkflowRoadmapBuilderForTests } from './workflow-roadmap-builder.js';
import { resetFounderWorkflowAuthorityBuilderForTests } from './founder-workflow-authority-builder.js';
import { resetFounderWorkflowEvaluatorForTests } from './founder-workflow-evaluator.js';
import { resetFounderWorkflowHistoryForTests } from './bounded-history.js';
import { resetFounderWorkflowReportBuilderForTests } from './founder-workflow-report-builder.js';
import { resetFounderWorkflowValidationOrchestrationForTests } from './founder-workflow-validation.js';

export {
  FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN,
  FOUNDER_WORKFLOW_VALIDATION_PASS,
  FOUNDER_WORKFLOW_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE,
  MAX_WORKFLOW_GAPS,
  WORKFLOW_CONTEXT_PASS,
  WORKFLOW_CLARITY_PASS,
  WORKFLOW_DISCOVERABILITY_PASS,
  WORKFLOW_CONTINUITY_PASS,
  WORKFLOW_FRICTION_PASS,
  WORKFLOW_RECOVERY_PASS,
  WORKFLOW_OUTCOME_PASS,
  WORKFLOW_EFFICIENCY_PASS,
  WORKFLOW_GAP_ANALYSIS_PASS,
  WORKFLOW_ROADMAP_PASS,
  FOUNDER_WORKFLOW_REPORTING_PASS,
  FOUNDER_WORKFLOW_QUESTION_SIGNALS,
  isFounderWorkflowQuestion,
  resolveFounderWorkflowResult,
  clampScore,
} from './founder-workflow-types.js';

export type {
  FounderWorkflowResult,
  WorkflowGapSeverity,
  WorkflowContextId,
  WorkflowContext,
  WorkflowGap,
  WorkflowValidatorResult,
  WorkflowClarityValidation,
  WorkflowDiscoverabilityValidation,
  WorkflowContinuityValidation,
  WorkflowFrictionValidation,
  WorkflowRecoveryValidation,
  WorkflowOutcomeValidation,
  WorkflowEfficiencyValidation,
  WorkflowGapAnalysis,
  FounderWorkflowRoadmap,
  FounderWorkflowAuthority,
  FounderWorkflowScore,
  FounderWorkflowRecord,
  FounderWorkflowEvaluation,
  FounderWorkflowReport,
  FounderWorkflowValidationInput,
  FounderWorkflowResultBundle,
  FounderWorkflowRuntimeReport,
} from './founder-workflow-types.js';

export {
  createWorkflowGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_VALIDATOR,
  resetWorkflowGapCounterForTests,
} from './workflow-gap-model.js';

export { getFounderWorkflowCacheStats, resetFounderWorkflowCacheForTests } from './founder-workflow-cache.js';

export {
  registerFounderWorkflowRecord,
  getFounderWorkflowRecord,
  lookupFounderWorkflowByProjectId,
  listFounderWorkflowRecords,
  getFounderWorkflowRecordCount,
  resetFounderWorkflowRegistryForTests,
} from './founder-workflow-registry.js';

export {
  buildWorkflowContext,
  buildAllWorkflowContexts,
  listWorkflowContextIds,
  getContextBuildCount,
  resetWorkflowContextBuilderForTests,
} from './workflow-context-builder.js';

export {
  validateWorkflowClarity,
  getClarityValidateCount,
  resetWorkflowClarityValidatorForTests,
} from './workflow-clarity-validator.js';
export type { WorkflowClarityUpstream } from './workflow-clarity-validator.js';

export {
  validateWorkflowDiscoverability,
  getDiscoverabilityValidateCount,
  resetWorkflowDiscoverabilityValidatorForTests,
} from './workflow-discoverability-validator.js';
export type { WorkflowDiscoverabilityUpstream } from './workflow-discoverability-validator.js';

export {
  validateWorkflowContinuity,
  getContinuityValidateCount,
  resetWorkflowContinuityValidatorForTests,
} from './workflow-continuity-validator.js';
export type { WorkflowContinuityUpstream } from './workflow-continuity-validator.js';

export {
  validateWorkflowFriction,
  getFrictionValidateCount,
  resetWorkflowFrictionValidatorForTests,
} from './workflow-friction-validator.js';
export type { WorkflowFrictionUpstream } from './workflow-friction-validator.js';

export {
  validateWorkflowRecovery,
  getRecoveryValidateCount,
  resetWorkflowRecoveryValidatorForTests,
} from './workflow-recovery-validator.js';
export type { WorkflowRecoveryUpstream } from './workflow-recovery-validator.js';

export {
  validateWorkflowOutcome,
  getOutcomeValidateCount,
  resetWorkflowOutcomeValidatorForTests,
} from './workflow-outcome-validator.js';
export type { WorkflowOutcomeUpstream } from './workflow-outcome-validator.js';

export {
  validateWorkflowEfficiency,
  getEfficiencyValidateCount,
  resetWorkflowEfficiencyValidatorForTests,
} from './workflow-efficiency-validator.js';
export type { WorkflowEfficiencyUpstream } from './workflow-efficiency-validator.js';

export {
  analyzeWorkflowGaps,
  getGapAnalysisCount,
  resetWorkflowGapAnalyzerForTests,
} from './workflow-gap-analyzer.js';

export {
  buildFounderWorkflowRoadmap,
  getRoadmapBuildCount,
  resetWorkflowRoadmapBuilderForTests,
} from './workflow-roadmap-builder.js';

export {
  buildFounderWorkflowAuthority,
  getAuthorityBuildCount,
  resetFounderWorkflowAuthorityBuilderForTests,
} from './founder-workflow-authority-builder.js';

export {
  buildFounderWorkflowScore,
  evaluateFounderWorkflow,
  getEvaluationCount,
  resetFounderWorkflowEvaluatorForTests,
} from './founder-workflow-evaluator.js';

export {
  recordFounderWorkflowHistory,
  getFounderWorkflowHistory,
  getFounderWorkflowHistorySize,
  clearFounderWorkflowHistory,
  resetFounderWorkflowHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderWorkflowReport,
  getReportCount,
  resetFounderWorkflowReportBuilderForTests,
} from './founder-workflow-report-builder.js';

export {
  getDevPulseV2FounderWorkflowValidation,
  registerFounderWorkflowValidationWithSurface,
  registerFounderWorkflowValidationWithFoundation,
  registerFounderWorkflowValidationWithCapabilityRegistry,
  registerFounderWorkflowValidationWithFindPanel,
  registerFounderWorkflowValidationWithUvl,
  registerFounderWorkflowValidationWithAcceptanceChain,
  evaluateFounderWorkflowValidation,
  getFounderWorkflowValidationRuntimeReport,
} from './founder-workflow-validation.js';

export type { FounderWorkflowSurfaceSnapshot } from './founder-workflow-validation.js';

export function resetFounderWorkflowValidationForTests(): void {
  resetFounderWorkflowRegistryForTests();
  resetFounderWorkflowCacheForTests();
  resetWorkflowGapCounterForTests();
  resetWorkflowContextBuilderForTests();
  resetWorkflowClarityValidatorForTests();
  resetWorkflowDiscoverabilityValidatorForTests();
  resetWorkflowContinuityValidatorForTests();
  resetWorkflowFrictionValidatorForTests();
  resetWorkflowRecoveryValidatorForTests();
  resetWorkflowOutcomeValidatorForTests();
  resetWorkflowEfficiencyValidatorForTests();
  resetWorkflowGapAnalyzerForTests();
  resetWorkflowRoadmapBuilderForTests();
  resetFounderWorkflowAuthorityBuilderForTests();
  resetFounderWorkflowEvaluatorForTests();
  resetFounderWorkflowHistoryForTests();
  resetFounderWorkflowReportBuilderForTests();
  resetFounderWorkflowValidationOrchestrationForTests();
}

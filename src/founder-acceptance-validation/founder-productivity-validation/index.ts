/**
 * Founder Productivity Validation — public exports.
 */

import { resetFounderProductivityRegistryForTests } from './founder-productivity-registry.js';
import { resetFounderProductivityCacheForTests } from './founder-productivity-cache.js';
import { resetProductivityGapCounterForTests } from './productivity-gap-model.js';
import { resetProductivityContextBuilderForTests } from './productivity-context-builder.js';
import { resetWorkflowAccelerationValidatorForTests } from './workflow-acceleration-validator.js';
import { resetManualWorkReductionValidatorForTests } from './manual-work-reduction-validator.js';
import { resetDecisionReductionValidatorForTests } from './decision-reduction-validator.js';
import { resetContextSwitchingValidatorForTests } from './context-switching-validator.js';
import { resetExecutionEfficiencyValidatorForTests } from './execution-efficiency-validator.js';
import { resetThroughputValidatorForTests } from './throughput-validator.js';
import { resetWorkflowOverheadValidatorForTests } from './workflow-overhead-validator.js';
import { resetProductivityGapAnalyzerForTests } from './productivity-gap-analyzer.js';
import { resetProductivityRoadmapBuilderForTests } from './productivity-roadmap-builder.js';
import { resetFounderProductivityAuthorityBuilderForTests } from './founder-productivity-authority-builder.js';
import { resetFounderProductivityEvaluatorForTests } from './founder-productivity-evaluator.js';
import { resetFounderProductivityHistoryForTests } from './bounded-history.js';
import { resetFounderProductivityReportBuilderForTests } from './founder-productivity-report-builder.js';
import { resetFounderProductivityValidationOrchestrationForTests } from './founder-productivity-validation.js';

export {
  FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN,
  FOUNDER_PRODUCTIVITY_VALIDATION_PASS,
  FOUNDER_PRODUCTIVITY_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE,
  MAX_PRODUCTIVITY_GAPS,
  PRODUCTIVITY_CONTEXT_PASS,
  WORKFLOW_ACCELERATION_PASS,
  MANUAL_WORK_REDUCTION_PASS,
  DECISION_REDUCTION_PASS,
  CONTEXT_SWITCHING_PASS,
  EXECUTION_EFFICIENCY_PASS,
  THROUGHPUT_PASS,
  WORKFLOW_OVERHEAD_PASS,
  PRODUCTIVITY_GAP_ANALYSIS_PASS,
  PRODUCTIVITY_ROADMAP_PASS,
  FOUNDER_PRODUCTIVITY_REPORTING_PASS,
  FOUNDER_PRODUCTIVITY_QUESTION_SIGNALS,
  isFounderProductivityQuestion,
  resolveFounderProductivityResult,
  clampScore,
} from './founder-productivity-types.js';

export type {
  FounderProductivityResult,
  ProductivityGapSeverity,
  ProductivityContextId,
  ProductivityContext,
  ProductivityGap,
  ProductivityValidatorResult,
  WorkflowAccelerationValidation,
  ManualWorkReductionValidation,
  DecisionReductionValidation,
  ContextSwitchingValidation,
  ExecutionEfficiencyValidation,
  ThroughputValidation,
  WorkflowOverheadValidation,
  ProductivityGapAnalysis,
  FounderProductivityRoadmap,
  FounderProductivityAuthority,
  FounderProductivityScore,
  FounderProductivityRecord,
  FounderProductivityEvaluation,
  FounderProductivityReport,
  FounderProductivityValidationInput,
  FounderProductivityResultBundle,
  FounderProductivityRuntimeReport,
} from './founder-productivity-types.js';

export {
  createProductivityGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_VALIDATOR,
  resetProductivityGapCounterForTests,
} from './productivity-gap-model.js';

export { getFounderProductivityCacheStats, resetFounderProductivityCacheForTests } from './founder-productivity-cache.js';

export {
  registerFounderProductivityRecord,
  getFounderProductivityRecord,
  lookupFounderProductivityByProjectId,
  listFounderProductivityRecords,
  getFounderProductivityRecordCount,
  resetFounderProductivityRegistryForTests,
} from './founder-productivity-registry.js';

export {
  buildProductivityContext,
  buildAllProductivityContexts,
  listProductivityContextIds,
  getContextBuildCount,
  resetProductivityContextBuilderForTests,
} from './productivity-context-builder.js';

export {
  validateWorkflowAcceleration,
  getAccelerationValidateCount,
  resetWorkflowAccelerationValidatorForTests,
} from './workflow-acceleration-validator.js';
export type { WorkflowAccelerationUpstream } from './workflow-acceleration-validator.js';

export {
  validateManualWorkReduction,
  getManualWorkValidateCount,
  resetManualWorkReductionValidatorForTests,
} from './manual-work-reduction-validator.js';
export type { ManualWorkReductionUpstream } from './manual-work-reduction-validator.js';

export {
  validateDecisionReduction,
  getDecisionValidateCount,
  resetDecisionReductionValidatorForTests,
} from './decision-reduction-validator.js';
export type { DecisionReductionUpstream } from './decision-reduction-validator.js';

export {
  validateContextSwitching,
  getContextSwitchValidateCount,
  resetContextSwitchingValidatorForTests,
} from './context-switching-validator.js';
export type { ContextSwitchingUpstream } from './context-switching-validator.js';

export {
  validateExecutionEfficiency,
  getExecutionValidateCount,
  resetExecutionEfficiencyValidatorForTests,
} from './execution-efficiency-validator.js';
export type { ExecutionEfficiencyUpstream } from './execution-efficiency-validator.js';

export {
  validateThroughput,
  getThroughputValidateCount,
  resetThroughputValidatorForTests,
} from './throughput-validator.js';
export type { ThroughputUpstream } from './throughput-validator.js';

export {
  validateWorkflowOverhead,
  getOverheadValidateCount,
  resetWorkflowOverheadValidatorForTests,
} from './workflow-overhead-validator.js';
export type { WorkflowOverheadUpstream } from './workflow-overhead-validator.js';

export {
  analyzeProductivityGaps,
  getGapAnalysisCount,
  resetProductivityGapAnalyzerForTests,
} from './productivity-gap-analyzer.js';

export {
  buildFounderProductivityRoadmap,
  getRoadmapBuildCount,
  resetProductivityRoadmapBuilderForTests,
} from './productivity-roadmap-builder.js';

export {
  buildFounderProductivityAuthority,
  getAuthorityBuildCount,
  resetFounderProductivityAuthorityBuilderForTests,
} from './founder-productivity-authority-builder.js';

export {
  buildFounderProductivityScore,
  evaluateFounderProductivity,
  getEvaluationCount,
  resetFounderProductivityEvaluatorForTests,
} from './founder-productivity-evaluator.js';

export {
  recordFounderProductivityHistory,
  getFounderProductivityHistory,
  getFounderProductivityHistorySize,
  clearFounderProductivityHistory,
  resetFounderProductivityHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderProductivityReport,
  getReportCount,
  resetFounderProductivityReportBuilderForTests,
} from './founder-productivity-report-builder.js';

export {
  getDevPulseV2FounderProductivityValidation,
  registerFounderProductivityValidationWithSurface,
  registerFounderProductivityValidationWithFoundation,
  registerFounderProductivityValidationWithCapabilityRegistry,
  registerFounderProductivityValidationWithFindPanel,
  registerFounderProductivityValidationWithUvl,
  registerFounderProductivityValidationWithAcceptanceChain,
  evaluateFounderProductivityValidation,
  getFounderProductivityValidationRuntimeReport,
} from './founder-productivity-validation.js';

export type { FounderProductivitySurfaceSnapshot } from './founder-productivity-validation.js';

export function resetFounderProductivityValidationForTests(): void {
  resetFounderProductivityRegistryForTests();
  resetFounderProductivityCacheForTests();
  resetProductivityGapCounterForTests();
  resetProductivityContextBuilderForTests();
  resetWorkflowAccelerationValidatorForTests();
  resetManualWorkReductionValidatorForTests();
  resetDecisionReductionValidatorForTests();
  resetContextSwitchingValidatorForTests();
  resetExecutionEfficiencyValidatorForTests();
  resetThroughputValidatorForTests();
  resetWorkflowOverheadValidatorForTests();
  resetProductivityGapAnalyzerForTests();
  resetProductivityRoadmapBuilderForTests();
  resetFounderProductivityAuthorityBuilderForTests();
  resetFounderProductivityEvaluatorForTests();
  resetFounderProductivityHistoryForTests();
  resetFounderProductivityReportBuilderForTests();
  resetFounderProductivityValidationOrchestrationForTests();
}

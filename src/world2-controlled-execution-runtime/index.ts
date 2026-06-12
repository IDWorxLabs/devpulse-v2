/**
 * World 2 Controlled Execution Runtime — public API.
 */

export {
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PASS_TOKEN,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_OWNER_MODULE,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_PHASE,
  WORLD2_CONTROLLED_EXECUTION_RUNTIME_REPORT_TITLE,
  WORLD2_CACHE_KEY_PREFIX,
  MAX_WORLD2_HISTORY,
  MAX_WORLD2_REASONS,
  WORLD2_CORE_QUESTION,
  WORLD2_EXECUTION_STATES,
  WORLD2_FORBIDDEN_ACTIONS,
  WORLD2_ALLOWED_ACTIONS,
  WORLD2_TERMINATION_CONDITIONS,
  REQUIRED_WORLD2_AUTHORITIES,
  MAX_RUNTIME_MS,
  MAX_ATTEMPTS,
  MAX_VALIDATIONS,
  MAX_REPAIRS,
  MAX_SANDBOX_FAILURES,
  isWorld2ExecutionState,
  buildWorld2ResourceLimits,
} from './world2-controlled-execution-runtime-registry.js';

export type {
  World2ExecutionState,
  World2TerminationDecision,
  World2ResourceLimits,
  World2ExecutionContract,
  World2TerminationAssessment,
  World2InputSnapshot,
  World2RuntimeAssessment,
  World2RuntimeReport,
  AssessWorld2ControlledExecutionRuntimeInput,
  World2RuntimeHistorySummary,
} from './world2-controlled-execution-runtime-types.js';

export {
  resetWorld2ControlledExecutionRuntimeHistoryForTests,
  recordWorld2RuntimeAssessment,
  getWorld2RuntimeHistorySize,
  getLatestWorld2RuntimeAssessment,
  getWorld2RuntimeHistory,
  buildWorld2RuntimeHistorySummary,
  countWorld2ExecutionState,
} from './world2-controlled-execution-runtime-history.js';

export {
  assessWorld2ControlledExecutionRuntime,
  deriveWorld2ExecutionState,
  deriveWorld2TerminationAssessment,
  buildWorld2ControlledExecutionRuntimeReport,
  buildWorld2ControlledExecutionRuntimeArtifacts,
  resetWorld2ControlledExecutionRuntimeCounterForTests,
  resetWorld2ControlledExecutionRuntimeModuleForTests,
} from './world2-controlled-execution-runtime-authority.js';

export type {
  World2ExecutionContext,
  World2TerminationContext,
} from './world2-controlled-execution-runtime-authority.js';

export { buildWorld2ControlledExecutionRuntimeReportMarkdown } from './world2-controlled-execution-runtime-report-builder.js';

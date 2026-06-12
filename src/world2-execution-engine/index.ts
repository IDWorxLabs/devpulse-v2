/**
 * World 2 Execution Engine — public API.
 */

export {
  WORLD2_EXECUTION_ENGINE_PASS_TOKEN,
  WORLD2_EXECUTION_ENGINE_OWNER_MODULE,
  WORLD2_EXECUTION_ENGINE_PHASE,
  WORLD2_EXECUTION_ENGINE_REPORT_TITLE,
  WORLD2_ENGINE_CACHE_KEY_PREFIX,
  MAX_ENGINE_HISTORY,
  MAX_ENGINE_REASONS,
  MAX_QUEUED_STEPS,
  MAX_SIMULATED_STEPS,
  MAX_RUN_DURATION_MS,
  MAX_AUDIT_TRAIL_ENTRIES,
  WORLD2_ENGINE_CORE_QUESTION,
  WORLD2_EXECUTION_MODES,
  WORLD2_FORBIDDEN_SCOPE,
  WORLD2_ALLOWED_SCOPE,
  REQUIRED_WORLD2_ENGINE_AUTHORITIES,
  isWorld2ExecutionMode,
  isWorld2EngineFinalState,
} from './world2-execution-engine-registry.js';

export type {
  World2ExecutionMode,
  World2ExecutionStepStatus,
  World2ExecutionStepActionType,
  World2EngineFinalState,
  World2ExecutionStep,
  World2ExecutionAuditEntry,
  World2ExecutionQueueSnapshot,
  World2EngineInputSnapshot,
  World2ExecutionEngineAssessment,
  World2ExecutionEngineReport,
  AssessWorld2ExecutionEngineInput,
  World2ExecutionEngineHistorySummary,
} from './world2-execution-engine-types.js';

export {
  resetWorld2ExecutionEngineQueueForTests,
  registerEngineRun,
  unregisterEngineRun,
  isRecursiveRunBlocked,
  enqueueWorld2ExecutionSteps,
  countSimulatedSteps,
  enforceSimulatedStepCap,
  buildWorld2ExecutionQueueSnapshot,
} from './world2-execution-engine-queue.js';

export {
  resetWorld2ExecutionEngineHistoryForTests,
  recordWorld2ExecutionEngineAssessment,
  getWorld2ExecutionEngineHistorySize,
  getLatestWorld2ExecutionEngineAssessment,
  getWorld2ExecutionEngineHistory,
  buildWorld2ExecutionEngineHistorySummary,
  countWorld2ExecutionMode,
} from './world2-execution-engine-history.js';

export {
  assessWorld2ExecutionEngine,
  deriveWorld2ExecutionMode,
  deriveWorld2EngineFinalState,
  buildWorld2ExecutionEngineReport,
  buildWorld2ExecutionEngineArtifacts,
  resetWorld2ExecutionEngineCounterForTests,
  resetWorld2ExecutionEngineModuleForTests,
} from './world2-execution-engine-authority.js';

export type { World2ExecutionModeContext } from './world2-execution-engine-authority.js';

export { buildWorld2ExecutionEngineReportMarkdown } from './world2-execution-engine-report-builder.js';

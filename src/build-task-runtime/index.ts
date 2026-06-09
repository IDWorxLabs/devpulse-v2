/**
 * DevPulse V2 Phase 14.2 — Build Task Runtime Foundation public API.
 */

export {
  BUILD_TASK_RUNTIME_FOUNDATION_PASS_TOKEN,
  BUILD_TASK_RUNTIME_OWNER_MODULE,
  BUILD_TASK_QUESTION_SIGNALS,
  BUILD_TASK_INPUT_SOURCES,
  FORBIDDEN_BUILD_TASK_RUNTIME_DUPLICATES,
  isBuildTaskRuntimeFoundationQuestion,
  isDuplicateBuildTaskBrainQuestion,
  isBuildTaskPlanningAdvisoryQuestion,
  type BuildTaskState,
  type BuildTaskConfidence,
  type BuildTaskRequest,
  type BuildTaskStep,
  type BuildTaskDependency,
  type BuildTaskSafetyGate,
  type BuildTaskVerificationPlan,
  type BuildTaskPlan,
  type BuildTaskRuntimeDiagnostics,
  type BuildTaskRuntimeResult,
} from './build-task-runtime-types.js';

export {
  parseBuildTaskRequest,
  resetBuildTaskRequestCounterForTests,
} from './build-task-request-parser.js';

export {
  buildTaskSteps,
  stepCountForPlan,
} from './build-task-step-model.js';

export {
  resolveBuildTaskDependencies,
  resetBuildTaskDependencyCounterForTests,
} from './build-task-dependency-resolver.js';

export {
  evaluateBuildTaskSafetyGates,
  resetBuildTaskSafetyGateCounterForTests,
} from './build-task-safety-gates.js';

export { createBuildTaskVerificationPlan } from './build-task-verification-plan.js';

export {
  buildBuildTaskPlan,
  resetBuildTaskPlanCounterForTests,
} from './build-task-plan-builder.js';

export {
  getBuildTaskRuntimeDiagnostics,
  updateBuildTaskRuntimeDiagnostics,
  resetBuildTaskRuntimeDiagnostics,
  buildTaskRuntimeKey,
} from './build-task-runtime-diagnostics.js';

export {
  processBuildTaskRuntimeRequest,
  getBuildTaskRuntimeContext,
} from './build-task-runtime.js';

export function getDevPulseV2BuildTaskRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_build_task_runtime',
    passToken: 'DEVPULSE_V2_BUILD_TASK_RUNTIME_FOUNDATION_V1_PASS',
    phase: 14.2,
  };
}

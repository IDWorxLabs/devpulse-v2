/**
 * Code Generation Engine V1 — public API.
 */

export {
  CODE_GENERATION_ENGINE_V1_PASS_TOKEN,
  CODE_GENERATION_ENGINE_OWNER_MODULE,
  CODE_GENERATION_ENGINE_PHASE,
  CODE_GENERATION_ENGINE_CORE_QUESTION,
  TASK_TRACKER_PROFILE_ID,
} from './code-generation-engine-registry.js';

export type {
  GeneratedAppProfile,
  TaskTrackerRequirements,
  GeneratedWorkspaceFile,
  CodeGenerationEngineResult,
  MaterializeGeneratedAppInput,
} from './code-generation-engine-types.js';

export {
  detectTaskTrackerIdea,
  extractTaskTrackerRequirements,
  resolveGeneratedAppProfile,
} from './task-tracker-detector.js';

export {
  buildTaskTrackerWorkspaceFiles,
  buildTaskTrackerAppTsx,
  buildTaskTrackerMainTsx,
  isTaskTrackerAppSource,
  isTaskTrackerMountEntry,
} from './task-tracker-generator.js';

export {
  materializeGeneratedApplication,
  usesViteReactRuntime,
} from './code-generation-engine-authority.js';

/**
 * One-Prompt Live Preview — public API.
 */

export {
  ONE_PROMPT_LIVE_PREVIEW_PROOF_PASS_TOKEN,
  ONE_PROMPT_LIVE_PREVIEW_OWNER_MODULE,
  ONE_PROMPT_LIVE_PREVIEW_PHASE,
  MULTI_PROJECT_WORKSPACE_TABS_PASS_TOKEN,
  BUILD_FROM_PROMPT_API_PATH,
  BUILD_LIVE_PREVIEW_STATUS_API_PATH,
} from './one-prompt-live-preview-registry.js';

export type {
  OnePromptBuildStatus,
  OnePromptLivePreviewBuildInput,
  OnePromptLivePreviewBuildResult,
  OnePromptLivePreviewPublicState,
} from './one-prompt-live-preview-types.js';

export {
  isOnePromptBuildRequest,
  classifyOnePromptBuildRequest,
} from './build-request-detector.js';

export {
  listGeneratedDevServers,
  getGeneratedDevServerForProject,
  stopAllGeneratedDevServers,
  resetGeneratedDevServerManagerForTests,
  stopActiveGeneratedDevServer,
  stopActiveGeneratedDevServerAsync,
  getActiveGeneratedDevServerState,
  startGeneratedAppDevServer,
} from './generated-dev-server-manager.js';

export {
  runNpmCommandSync,
  runNpmRunScriptSync,
  killChildProcessTree,
  settleEventLoop,
} from './child-process-teardown.js';

export {
  resetOnePromptLivePreviewForTests,
  getLastOnePromptLivePreviewBuildResult,
  runOnePromptLivePreviewBuild,
  getOnePromptLivePreviewPublicState,
  composeOnePromptBuildChatResponse,
} from './one-prompt-build-orchestrator.js';

export {
  buildOnePromptLivePreviewWorkspaceSync,
  resolveCanonicalLivePreviewState,
  type CanonicalLivePreviewBlock,
  type CanonicalLivePreviewContext,
  type CanonicalLivePreviewRuntimeInput,
  type CanonicalLivePreviewWorkspaceSlice,
} from './canonical-live-preview-state.js';

export {
  buildOnePromptOperatorFeedEvents,
  composeOnePromptBuildBrainApiPayload,
  composeOnePromptBuildFailurePayload,
} from './one-prompt-build-chat-response.js';

export { parseViteDevServerUrl, stripAnsi, summarizeDevServerStartupFailure } from './vite-dev-server-output.js';

export type { MultiProjectWorkspaceSession } from './workspace-tab-registry.js';

export {
  resetWorkspaceTabRegistryForTests,
  generateProjectId,
  resolveProjectContext,
  setActiveProjectId,
  registerProjectBuildResult,
  getActiveProjectId,
  getActiveProjectSession,
  getProjectSession,
  getBuildResultForProject,
  listMultiProjectWorkspaces,
  listProjectBuildResults,
} from './workspace-tab-registry.js';

/**
 * Project Session Continuity V1 — public API.
 */

export {
  PROJECT_SESSION_CONTINUITY_V1_PASS_TOKEN,
  PROJECT_SESSION_ACTIVE_POINTER_FILE,
  PROJECT_SESSION_STORE_DIR,
  PROJECT_SESSION_STORE_VERSION,
  type EnsureBuildProjectSessionInput,
  type EnsureBuildProjectSessionResult,
  type LivePreviewSessionBinding,
  type ProjectSessionActivePointer,
  type ProjectSessionChatMessage,
  type ProjectSessionChatRole,
  type ProjectSessionContext,
  type ProjectSessionRecord,
} from './project-session-continuity-types.js';

export {
  appendProjectSessionChatMessage,
  createProjectSessionRecord,
  findLatestActiveSessionForProject,
  listProjectSessionIds,
  readActiveSessionPointer,
  readProjectSessionRecord,
  resetProjectSessionStoreForTests,
  resolveActiveSessionPointerPath,
  resolveProjectSessionFilePath,
  resolveProjectSessionRootDir,
  updateProjectSessionRecord,
  writeActiveSessionPointer,
  writeProjectSessionRecordForTests,
} from './project-session-store.js';

export {
  mergeSessionPreviewIntoWorkspaceFields,
  resolveLivePreviewSessionBinding,
} from './project-session-live-preview-binding.js';

export {
  GENERIC_PROJECT_NAME,
  activateProjectSession,
  assertUserProjectCanBeActiveSession,
  buildProjectSessionContinuityApiPayload,
  chatHistoryHtmlFromSession,
  deriveProjectNameFromPrompt,
  ensureBuildProjectSession,
  ensureProjectSessionForProject,
  navigationWouldLoseChatWithoutSessionStore,
  persistProjectSessionChat,
  recordBuildOnProjectSession,
  resolveActiveProjectSessionContext,
  resolveProjectSessionContext,
} from './project-session-authority.js';

export const PROJECT_SESSION_API_PATHS = {
  active: '/api/project-sessions/active',
  messages: '/api/project-sessions/messages',
  ensureBuild: '/api/project-sessions/ensure-build',
  activate: '/api/project-sessions/activate',
} as const;

export const PROJECT_SESSION_CONTINUITY_TRACE = 'PROJECT_SESSION_CONTINUITY_HYDRATED' as const;

export {
  bootstrapProjectAndSessionForBuild,
  enrichBrainPayloadWithProjectSession,
  enrichBuildPayloadWithProjectSession,
  finalizeProjectSessionAfterBuild,
  type BootstrapProjectSessionResult,
} from './project-session-build-bridge.js';

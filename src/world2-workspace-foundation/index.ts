export {
  createDevPulseV2World2WorkspaceFoundation,
  DevPulseV2World2WorkspaceFoundation,
  getDevPulseV2World2WorkspaceFoundation,
  resetDevPulseV2World2WorkspaceFoundationForTests,
  isCommunicationAllowed,
  isCommunicationBlocked,
  boundaryOutputKey,
  evaluateWorkspaceIsolation,
  isolationOutputKey,
  assertFileOwnership,
  rejectOrphanFile,
  MAX_WORKSPACES,
  WORLD2_WORKSPACE_OWNER_MODULE,
  WORLD2_WORKSPACE_PASS_TOKEN,
} from './world2-workspace-foundation.js';
export { WorkspaceManager, lookupOutputKey } from './workspace-manager.js';
export {
  buildWorkspaceIdentity,
  identityKey,
  isValidWorkspaceId,
  normalizeProjectId,
  resetWorkspaceIdentityCounterForTests,
} from './workspace-identity.js';
export {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  checkWorkspaceTakeover,
} from './workspace-boundary-rules.js';
export {
  assertConstitutionReferenced,
  assertDistinctFromWorld2IsolationGate,
  assertGovernanceStackPresent,
  assertNoGovernanceBypassAttempt,
  assertWorld1FoundationProtected,
  getGovernanceBridgeSummary,
} from './world2-governance-bridge.js';
export { buildWorld2WorkspaceReport, formatWorld2WorkspaceReport } from './world2-report.js';
export type {
  IsolationVerdict,
  SourceWorld,
  Workspace,
  WorkspaceBoundaryCheck,
  WorkspaceCommunicationType,
  WorkspaceCreateInput,
  WorkspaceNotification,
  WorkspaceState,
  World2WorkspaceFoundationState,
  World2WorkspaceReport,
} from './types.js';
export {
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  WORLD1_PROTECTED_DOMAINS,
} from './types.js';

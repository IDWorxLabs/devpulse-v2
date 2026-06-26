/**
 * Workspace Navigation V1 — in-app back/forward surface history.
 */

export {
  WORKSPACE_NAVIGATION_PASS_TOKEN,
  type WorkspaceNavigationEntry,
  type WorkspaceNavigationState,
  type WorkspaceNavigationSnapshot,
} from './workspace-navigation-types.js';

export {
  createWorkspaceNavigationState,
  pushWorkspaceNavigationEntry,
  snapshotWorkspaceNavigation,
  workspaceNavigationBack,
  workspaceNavigationForward,
} from './workspace-navigation-history.js';

export {
  WorkspaceNavigationController,
} from './workspace-navigation-controller.js';

export {
  workspaceNavigationWouldRenderBlankProjectFiles,
  validateWorkspaceNavigationSequence,
  simulateProjectsToFilesNavigation,
} from './workspace-navigation-validator.js';

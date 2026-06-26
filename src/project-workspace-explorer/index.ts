/**
 * Project Workspace Explorer V1 — read-only multi-project source browser.
 */

export {
  PROJECT_WORKSPACE_EXPLORER_PASS_TOKEN,
  MAX_WORKSPACE_FILE_BYTES,
  MAX_WORKSPACE_SEARCH_RESULTS,
  MAX_WORKSPACE_FOLDER_CHILDREN,
  WORKSPACE_SKIP_DIRS,
  type WorkspaceFileLanguage,
  type ProjectWorkspaceContext,
  type ProjectWorkspaceFileEntry,
  type ProjectWorkspaceFolderEntry,
  type ProjectWorkspaceListing,
  type ProjectWorkspaceFileReadResult,
  type ProjectWorkspaceSearchMatch,
  type ProjectWorkspaceSearchResult,
  type ProjectWorkspaceInfo,
  type ProjectWorkspaceExplorerState,
  type ProjectWorkspaceMetadataShortcut,
  type ProjectWorkspaceUnavailableReason,
} from './project-workspace-types.js';

export {
  validateProjectId,
  sanitizeRelativeWorkspacePath,
  resolvePathWithinWorkspace,
  isReadOnlyExplorerOperation,
} from './project-workspace-validator.js';

export {
  loadProjectWorkspaceContext,
  listMetadataShortcuts,
} from './project-workspace-loader.js';

export {
  listWorkspaceFolder,
  buildWorkspaceRootTree,
  clearProjectWorkspaceFolderCache,
} from './project-workspace-tree.js';

export {
  readWorkspaceFile,
  detectWorkspaceFileLanguage,
} from './project-workspace-file-reader.js';

export { searchProjectWorkspace } from './project-workspace-search.js';

export {
  iconForFile,
  iconForFolder,
  iconClassFor,
} from './project-workspace-icons.js';

export {
  PROJECT_WORKSPACE_EXPLORER_STATE_KEY,
  createDefaultExplorerState,
  mergeExplorerState,
  parseExplorerStateStore,
  serializeExplorerStateStore,
} from './project-workspace-history.js';

export { assessProjectWorkspaceAvailability } from './project-workspace-availability.js';

export {
  getProjectWorkspaceListing,
  getProjectWorkspaceFile,
  getProjectWorkspaceSearch,
} from './project-workspace-controller.js';

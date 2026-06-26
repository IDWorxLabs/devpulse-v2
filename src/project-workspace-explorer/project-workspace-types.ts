/**
 * Project Workspace Explorer V1 — types.
 */

export const PROJECT_WORKSPACE_EXPLORER_PASS_TOKEN = 'PROJECT_WORKSPACE_EXPLORER_V1_PASS' as const;

export const MAX_WORKSPACE_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_WORKSPACE_SEARCH_RESULTS = 200;
export const MAX_WORKSPACE_FOLDER_CHILDREN = 500;
export const WORKSPACE_SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.cache']);

export type WorkspaceFileLanguage =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'jsx'
  | 'json'
  | 'css'
  | 'html'
  | 'markdown'
  | 'yaml'
  | 'text'
  | 'unknown';

export interface ProjectWorkspaceContext {
  readOnly: true;
  projectId: string;
  projectName: string;
  workspaceRootAbs: string;
  workspacePathRel: string;
  sourceRootAbs: string;
  sourceRootRel: string;
  aidevDirAbs: string;
}

export interface ProjectWorkspaceFileEntry {
  readOnly: true;
  name: string;
  relativePath: string;
  kind: 'file';
  size: number;
  modifiedAt: string;
  language: WorkspaceFileLanguage;
  icon: string;
}

export interface ProjectWorkspaceFolderEntry {
  readOnly: true;
  name: string;
  relativePath: string;
  kind: 'folder';
  childFileCount: number;
  childFolderCount: number;
  icon: string;
}

export type ProjectWorkspaceUnavailableReason =
  | 'PROJECT_NOT_FOUND'
  | 'WORKSPACE_NOT_PROMOTED'
  | 'SOURCE_ROOT_MISSING'
  | 'WORKSPACE_EMPTY';

export interface ProjectWorkspaceListing {
  readOnly: true;
  ok: boolean;
  projectId: string;
  projectName?: string;
  workspacePath: string;
  sourceRoot: string;
  relativePath: string;
  files: ProjectWorkspaceFileEntry[];
  folders: ProjectWorkspaceFolderEntry[];
  projectInfo: ProjectWorkspaceInfo | null;
  lazyLoaded: boolean;
  cached: boolean;
  reason?: ProjectWorkspaceUnavailableReason | null;
  expectedWorkspacePath?: string;
  expectedSourceRoot?: string;
  message?: string;
  endpointPath?: string;
  metadataShortcuts?: Array<{
    label: string;
    relativePath: string;
    category: 'manifest' | 'validation' | 'history' | 'trace';
  }>;
}

export interface ProjectWorkspaceFileReadResult {
  readOnly: true;
  ok: boolean;
  projectId: string;
  relativePath: string;
  contents: string;
  language: WorkspaceFileLanguage;
  modifiedAt: string;
  size: number;
  truncated: boolean;
}

export interface ProjectWorkspaceSearchMatch {
  readOnly: true;
  relativePath: string;
  name: string;
  matchType: 'filename' | 'folder' | 'symbol' | 'text';
  preview: string | null;
  lineNumber: number | null;
}

export interface ProjectWorkspaceSearchResult {
  readOnly: true;
  ok: boolean;
  projectId: string;
  query: string;
  matches: ProjectWorkspaceSearchMatch[];
  truncated: boolean;
}

export interface ProjectWorkspaceInfo {
  readOnly: true;
  projectName: string;
  projectId: string;
  workspacePath: string;
  sourceRoot: string;
  featureCount: number;
  generatedFiles: number;
  lastBuild: string | null;
  currentBuildProfile: string | null;
  materializationQuality: string | null;
  materializationQualityScore: number | null;
  workspaceReality: string | null;
  universalProductionProof: string | null;
}

export interface ProjectWorkspaceExplorerState {
  readOnly: true;
  projectId: string;
  expandedFolders: string[];
  scrollPosition: number;
  openedFiles: string[];
  selectedFile: string | null;
  searchQuery: string;
}

export interface ProjectWorkspaceMetadataShortcut {
  readOnly: true;
  label: string;
  relativePath: string;
  category: 'manifest' | 'validation' | 'history' | 'trace';
}

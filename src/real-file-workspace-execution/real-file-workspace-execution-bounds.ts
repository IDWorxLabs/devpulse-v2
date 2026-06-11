/**
 * Real File Workspace Execution — runtime bounds (Phase 24D).
 */

export const REAL_FILE_WORKSPACE_EXECUTION_PASS_TOKEN = 'REAL_FILE_WORKSPACE_EXECUTION_PASS';
export const REAL_FILE_WORKSPACE_EXECUTION_OWNER_MODULE =
  'aidevengine_real_file_workspace_execution';

export const GENERATED_BUILDER_WORKSPACES_DIR = '.generated-builder-workspaces';
export const MAX_REAL_FILE_SESSIONS = 32;
export const MAX_REAL_FILE_EVIDENCE = 512;
export const MAX_REAL_FILE_OPERATIONS = 128;

/** Never valid as execution targets at repository root. */
export const FORBIDDEN_REPO_ROOT_TARGETS = [
  'src',
  'public',
  'server',
  'scripts',
  'architecture',
] as const;

export const PHASE_24D_ALLOWED_OPERATIONS = [
  'CREATE_FOLDER',
  'CREATE_FILE',
  'MODIFY_FILE',
  'APPEND_FILE',
  'READ_FILE',
] as const;

export const PHASE_24D_BLOCKED_OPERATIONS = [
  'DELETE_FILE',
  'RUN_COMMAND',
  'INSTALL_DEPENDENCY',
  'MOVE_FILE_OUTSIDE_WORKSPACE',
] as const;

/** Future mobile project paths allowed inside isolated workspace roots only. */
export const FUTURE_MOBILE_PROJECT_PATH_PREFIXES = [
  'app/',
  'src/',
  'screens/',
  'components/',
  'android/',
  'ios/',
  'app.json',
  'package.json',
] as const;

export const PRODUCTION_WORKSPACE_MARKER = 'devpulse production';

/**
 * Generated Workspace Dependency Installation Executor — registry (Phase 26.79).
 */

export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS =
  'GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS';
export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_OWNER_MODULE =
  'devpulse_generated_workspace_dependency_installation_executor';
export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PHASE =
  'Phase 26.79 — Generated Workspace Dependency Installation Executor V1';
export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_REPORT_TITLE =
  'GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_REPORT';
export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_RESULT_REPORT_TITLE =
  'GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_RESULT';
export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CACHE_KEY_PREFIX =
  'generated-workspace-dependency-installation-executor-v1';

export const GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION =
  'Can generated workspace dependencies be installed safely and verified before runtime startup retry?';

export const ALLOWED_INSTALL_COMMANDS = [
  'npm install',
  'npm ci',
  'pnpm install',
  'yarn install',
] as const;

export const ALLOWED_INSTALL_EXTRA_ARGS = ['--frozen-lockfile'] as const;

export const DEPENDENCY_INSTALL_TIMEOUT_MS = 120_000;
export const MAX_INSTALL_LOG_LINES = 64;
export const MAX_INSTALL_OUTPUT_CHARS = 16_384;

export const SHELL_INJECTION_PATTERNS = [
  ';',
  '&',
  '|',
  '$',
  '`',
  '(',
  ')',
  '>',
  '<',
  '\n',
  '\r',
  '..',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve generated workspace and dependency materialization repair plan',
  'Validate install safety (path containment, package.json, command whitelist)',
  'DRY_RUN or EXECUTE bounded install process',
  'Re-scan dependencies after install',
  'Retry bounded runtime startup probe once when deps ready',
  'Feed result into Runtime Startup Proof Repair and Truth Bridge',
] as const;

export const SAFETY_GUARANTEES = [
  'Only operates inside .generated-builder-workspaces/',
  'Never installs in main AiDevEngine repo',
  'DRY_RUN by default — no mutation unless EXECUTE explicitly enabled',
  'Spawn package manager directly — no shell',
  'Strict timeout with process cleanup',
  'No nested validator chains',
] as const;

export const MAX_INSTALL_EXECUTOR_HISTORY = 32;

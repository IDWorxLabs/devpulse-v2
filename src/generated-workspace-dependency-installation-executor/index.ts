export {
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_OWNER_MODULE,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PHASE,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_REPORT_TITLE,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_RESULT_REPORT_TITLE,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CACHE_KEY_PREFIX,
  ALLOWED_INSTALL_COMMANDS,
  ALLOWED_INSTALL_EXTRA_ARGS,
  DEPENDENCY_INSTALL_TIMEOUT_MS,
  MAX_INSTALL_LOG_LINES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './generated-workspace-dependency-installation-executor-registry.js';

export type {
  DependencyInstallExecutionMode,
  InstallSafetyVerdict,
  InstallProcessCleanupStatus,
  WorkspaceInstallSafetyCheck,
  ParsedInstallCommand,
  DependencyInstallProcessResult,
  PostInstallDependencyVerification,
  GeneratedWorkspaceDependencyInstallationExecutorReport,
  GeneratedWorkspaceDependencyInstallationExecutorAssessment,
  ExecuteGeneratedWorkspaceDependencyInstallationInput,
  GeneratedWorkspaceDependencyInstallationExecutorHistoryEntry,
} from './generated-workspace-dependency-installation-executor-types.js';

export { validateWorkspaceInstallSafety } from './workspace-install-safety-guard.js';
export { buildParsedInstallCommand, resolveInstallSpawnTarget } from './dependency-install-command-builder.js';
export type { InstallSpawnTarget } from './dependency-install-command-builder.js';
export { runDependencyInstallProcess } from './dependency-install-process-runner.js';
export { verifyPostInstallDependencies } from './post-install-dependency-verifier.js';
export {
  buildDependencyInstallationExecutorReportMarkdown,
  buildDependencyInstallationResultMarkdown,
} from './dependency-installation-report-builder.js';
export {
  resetGeneratedWorkspaceDependencyInstallationExecutorHistoryForTests,
  recordGeneratedWorkspaceDependencyInstallationExecutorAssessment,
  getGeneratedWorkspaceDependencyInstallationExecutorHistorySize,
  getLatestGeneratedWorkspaceDependencyInstallationExecutorHistoryEntry,
  getGeneratedWorkspaceDependencyInstallationExecutorHistory,
} from './generated-workspace-dependency-installation-executor-history.js';
export {
  executeGeneratedWorkspaceDependencyInstallation,
  resetGeneratedWorkspaceDependencyInstallationExecutorCounterForTests,
  resetGeneratedWorkspaceDependencyInstallationExecutorModuleForTests,
} from './generated-workspace-dependency-installation-executor-authority.js';

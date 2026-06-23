/**
 * Generated Workspace Dependency Installation Executor — core models (Phase 26.79).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type {
  DependencyState,
  GeneratedWorkspaceDependencyMaterializationReport,
  PackageManagerId,
} from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type { RuntimeStartupProbeResult } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

export type DependencyInstallExecutionMode = 'DRY_RUN' | 'EXECUTE';

export type InstallSafetyVerdict = 'SAFE' | 'REFUSED';

export type InstallProcessCleanupStatus = 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';

export interface WorkspaceInstallSafetyCheck {
  readOnly: true;
  verdict: InstallSafetyVerdict;
  refusalReason: string | null;
  workspaceAbs: string;
  installCwd: string;
  installCommand: string;
  packageJsonExists: boolean;
  insideGeneratedWorkspace: boolean;
  mainRepoProtected: boolean;
}

export interface ParsedInstallCommand {
  readOnly: true;
  executable: string;
  args: readonly string[];
  packageManager: PackageManagerId;
  normalizedCommand: string;
}

export interface DependencyInstallProcessResult {
  readOnly: true;
  executed: boolean;
  dryRun: boolean;
  attemptedCommand: string;
  executable: string;
  args: readonly string[];
  cwd: string;
  exitCode: number | null;
  stdout: readonly string[];
  stderr: readonly string[];
  installLogs: readonly string[];
  elapsedMs: number;
  timedOut: boolean;
  cleanupStatus: InstallProcessCleanupStatus;
  processId: number | null;
  installSucceeded: boolean;
  failureReason: string | null;
}

export interface PostInstallDependencyVerification {
  readOnly: true;
  beforeState: DependencyState;
  afterState: DependencyState;
  dependenciesReady: boolean;
  nodeModulesExists: boolean;
  missingModulesAfterInstall: readonly string[];
  installSucceeded: boolean;
  verificationSucceeded: boolean;
  verificationReason: string;
  afterMaterialization: GeneratedWorkspaceDependencyMaterializationReport | null;
}

export interface GeneratedWorkspaceDependencyInstallationExecutorReport {
  readOnly: true;
  advisoryOnly: true;
  executionId: string;
  generatedAt: string;
  coreQuestion: string;
  executionMode: DependencyInstallExecutionMode;
  workspaceRoot: string;
  workspaceId: string;
  safetyCheck: WorkspaceInstallSafetyCheck;
  parsedCommand: ParsedInstallCommand | null;
  processResult: DependencyInstallProcessResult;
  postInstallVerification: PostInstallDependencyVerification;
  startupProbeAfterInstall: RuntimeStartupProbeResult | null;
  applicationBootsAfterInstall: boolean | null;
  connectedBuildProofLevel: string | null;
  recommendedNextAction: string;
  cacheKey: string;
}

export interface GeneratedWorkspaceDependencyInstallationExecutorAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'DEPENDENCY_INSTALLATION_EXECUTOR_COMPLETE';
  report: GeneratedWorkspaceDependencyInstallationExecutorReport;
  cacheKey: string;
}

export interface ExecuteGeneratedWorkspaceDependencyInstallationInput {
  rootDir?: string;
  workspacePath?: string | null;
  workspaceId?: string | null;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  dependencyMaterializationReport?: GeneratedWorkspaceDependencyMaterializationReport | null;
  executionMode?: DependencyInstallExecutionMode;
  skipPostInstallStartupProbe?: boolean;
  skipHistoryRecording?: boolean;
}

export interface GeneratedWorkspaceDependencyInstallationExecutorHistoryEntry {
  readOnly: true;
  executionId: string;
  generatedAt: string;
  executionMode: DependencyInstallExecutionMode;
  installSucceeded: boolean;
  verificationSucceeded: boolean;
  workspaceId: string;
  cacheKey: string;
}

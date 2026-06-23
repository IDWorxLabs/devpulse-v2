/**
 * Runtime Startup Proof Repair — core models (Phase 26.77).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { GeneratedWorkspaceDependencyMaterializationReport } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type {
  DependencyInstallExecutionMode,
  GeneratedWorkspaceDependencyInstallationExecutorReport,
} from '../generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.js';
import type { GeneratedRuntimeCrashDiagnosisReport } from '../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js';

export type RuntimeAppType =
  | 'VITE'
  | 'REACT'
  | 'NEXT'
  | 'EXPRESS'
  | 'EXPO'
  | 'NODE'
  | 'UNKNOWN';

export type StartupCommandEvidenceSource =
  | 'BUILD_MANIFEST'
  | 'PACKAGE_JSON_SCRIPT'
  | 'FRAMEWORK_DEFAULT'
  | 'SERVER_ENTRYPOINT_FALLBACK'
  | 'NO_COMMAND_FOUND';

export type StartupFailureClass =
  | 'NO_START_COMMAND'
  | 'WRONG_WORKSPACE_CWD'
  | 'MISSING_DEPENDENCIES'
  | 'PORT_CONFLICT'
  | 'COMPILE_ERROR'
  | 'RUNTIME_CRASH'
  | 'ENTRYPOINT_MISSING'
  | 'FRAMEWORK_MISMATCH'
  | 'STARTUP_TIMEOUT'
  | 'UNKNOWN_STARTUP_FAILURE'
  | 'NONE';

export interface RuntimeEntrypointCandidate {
  readOnly: true;
  appType: RuntimeAppType;
  workspaceRoot: string;
  workspaceId: string;
  startCommand: string | null;
  expectedPort: number;
  entryFile: string | null;
  confidence: number;
  missingPrerequisites: string[];
  discoverySources: string[];
}

export interface ResolvedStartupCommand {
  readOnly: true;
  command: string | null;
  cwd: string;
  expectedPort: number;
  entryFile: string | null;
  appType: RuntimeAppType;
  evidenceSource: StartupCommandEvidenceSource;
  evidenceDetail: string;
  confidence: number;
  resolved: boolean;
}

export interface RuntimeStartupProbeResult {
  readOnly: true;
  attemptedCommand: string | null;
  cwd: string;
  expectedPort: number;
  processStarted: boolean;
  portBound: boolean;
  firstResponseStatus: number | null;
  startupLogs: string[];
  fatalErrors: string[];
  elapsedMs: number;
  timedOut: boolean;
  cleanupStatus: 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';
  processId: string | null;
  healthResponded: boolean;
  applicationBoots: boolean;
}

export interface RuntimeStartupProofRepairReport {
  readOnly: true;
  advisoryOnly: true;
  repairId: string;
  generatedAt: string;
  coreQuestion: string;
  workspaceId: string;
  workspaceRoot: string;
  entrypoint: RuntimeEntrypointCandidate;
  resolvedCommand: ResolvedStartupCommand;
  probe: RuntimeStartupProbeResult;
  failureClass: StartupFailureClass;
  failureReason: string;
  recommendedFix: string;
  recommendedNextActions: string[];
  applicationBoots: boolean;
  connectedBuildProofLevel: string | null;
  dependencyMaterialization: GeneratedWorkspaceDependencyMaterializationReport | null;
  dependencyInstallationExecutor: GeneratedWorkspaceDependencyInstallationExecutorReport | null;
  crashDiagnosis: GeneratedRuntimeCrashDiagnosisReport | null;
  preciseCrashClass: string | null;
  cacheKey: string;
}

export interface RuntimeStartupProofRepairAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_STARTUP_PROOF_REPAIR_COMPLETE';
  report: RuntimeStartupProofRepairReport;
  cacheKey: string;
}

export interface AssessRuntimeStartupProofRepairInput {
  rootDir?: string;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  workspacePath?: string | null;
  workspaceId?: string | null;
  expectedPort?: number;
  skipProbe?: boolean;
  skipHistoryRecording?: boolean;
  allowAutoInstall?: boolean;
  dependencyMaterializationReport?: GeneratedWorkspaceDependencyMaterializationReport | null;
  dependencyInstallExecutionMode?: DependencyInstallExecutionMode | 'SKIP';
}

export interface RuntimeStartupProofRepairHistoryEntry {
  readOnly: true;
  repairId: string;
  generatedAt: string;
  applicationBoots: boolean;
  failureClass: StartupFailureClass;
  workspaceId: string;
  cacheKey: string;
}

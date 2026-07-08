/**
 * Autonomous Runtime Authority V1 — shared types.
 */

export const RUNTIME_AUTHORITY_V1_PASS_TOKEN = 'RUNTIME_AUTHORITY_V1_PASS' as const;
export const RUNTIME_AUTHORITY_V1_CONTRACT_VERSION = 'AUTONOMOUS_RUNTIME_AUTHORITY_V1' as const;

export type RuntimeAuthorityPhase =
  | 'IDLE'
  | 'DISCOVERING'
  | 'CONSOLIDATING'
  | 'PORT_RESOLVING'
  | 'LAUNCHING'
  | 'VERIFYING'
  | 'READY'
  | 'RECOVERING'
  | 'FAILED';

export type RuntimeProcessKind =
  | 'founder-reality-server'
  | 'dev-entry'
  | 'vite'
  | 'preview'
  | 'tsx'
  | 'node'
  | 'unknown';

export interface DiscoveredRuntimeProcess {
  readOnly: true;
  pid: number;
  port: number | null;
  commandLine: string;
  belongsToRepository: boolean;
  runtimeKind: RuntimeProcessKind;
  startedAt: string | null;
}

export interface RuntimeTruthProbe {
  readOnly: true;
  reachable: boolean;
  httpStatus: number;
  sourceFingerprint: string | null;
  gitCommit: string | null;
  runtimeId: string | null;
  startedAt: string | null;
  fresh: boolean;
  error: string | null;
}

export interface RuntimeHealthProbe {
  readOnly: true;
  name: string;
  path: string;
  method: 'GET' | 'POST';
  ok: boolean;
  status: number;
  error: string | null;
}

export interface RuntimeLaunchPlan {
  readOnly: true;
  contractVersion: typeof RUNTIME_AUTHORITY_V1_CONTRACT_VERSION;
  preferredPort: number;
  resolvedPort: number;
  portShifted: boolean;
  displacedForeignProcess: boolean;
  eliminatedPids: number[];
  eliminatedPorts: number[];
  discoveredRuntimes: DiscoveredRuntimeProcess[];
  recoveryActions: string[];
  repositoryRoot: string;
  preparedAt: string;
}

export interface RuntimeAuthorityState {
  readOnly: true;
  contractVersion: typeof RUNTIME_AUTHORITY_V1_CONTRACT_VERSION;
  phase: RuntimeAuthorityPhase;
  authoritativePid: number;
  port: number;
  baseUrl: string;
  health: 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  ageMs: number;
  gitCommit: string | null;
  sourceFingerprint: string | null;
  runtimeId: string | null;
  startedAt: string | null;
  restartCount: number;
  lastRecoveryAt: string | null;
  lastRecoveryReason: string | null;
  workspaceRoot: string;
  recoveryActions: string[];
  healthProbes: RuntimeHealthProbe[];
  truthProbe: RuntimeTruthProbe | null;
  ready: boolean;
  updatedAt: string;
}

export interface PrepareRuntimeLaunchInput {
  repositoryRoot: string;
  preferredPort: number;
  currentPid: number;
  portScanMax?: number;
  recovery?: boolean;
}

export interface VerifyLaunchedRuntimeInput {
  baseUrl: string;
  repositoryRoot: string;
  expectedSourceFingerprint?: string | null;
  timeoutMs?: number;
}

export interface VerifyLaunchedRuntimeResult {
  readOnly: true;
  ok: boolean;
  truthProbe: RuntimeTruthProbe;
  healthProbes: RuntimeHealthProbe[];
  errors: string[];
  warnings: string[];
}

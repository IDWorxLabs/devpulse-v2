/**
 * Runtime Proof Gap Activator — bounded real runtime activation (Phase 26.74).
 * Only activates under .generated-builder-workspaces/ with materialized runtime scripts.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import {
  DEFAULT_RUNTIME_ACTIVATION_PORT,
  RUNTIME_ACTIVATION_STARTUP_TIMEOUT_MS,
} from './connected-runtime-activation-proof-registry.js';
import type {
  RuntimeActivationEvidence,
  RuntimeProcessState,
  RuntimeProofLevel,
  RuntimeSessionEvidence,
} from './connected-runtime-activation-proof-types.js';
import { analyzeRuntimeLinkage } from './runtime-linkage-analyzer.js';
import { resolveRuntimeCommand } from './runtime-command-resolver.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

export const CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS =
  'CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS';

const PROBE_SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  'runtime-proof-gap-probe.mjs',
);

interface ProbeResult {
  workspaceId?: string;
  workspacePath?: string;
  runtimeCommand?: string | null;
  commandExists?: boolean;
  packageJsonDetected?: boolean;
  scriptDetected?: boolean;
  activationAttempted?: boolean;
  activationSucceeded?: boolean;
  processId?: string | null;
  observedStartTime?: string | null;
  processState?: RuntimeProcessState;
  exitCode?: number | null;
  expectedPort?: number;
  detectedPort?: number | null;
  portReachable?: boolean;
  portCheckedAt?: string | null;
  healthUrl?: string | null;
  healthChecked?: boolean;
  healthResponded?: boolean;
  responseCode?: number | null;
  healthCheckedAt?: string | null;
  logLines?: string[];
  error?: string;
}

function emptyActivationEvidence(input: {
  workspaceId: string;
  workspacePath: string;
  runtimeCommand: string | null;
  commandExists: boolean;
  packageJsonDetected: boolean;
  scriptDetected: boolean;
  activationAttempted: boolean;
  firstBrokenRuntimeLink: string | null;
}): RuntimeActivationEvidence {
  return {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath: input.workspacePath,
    runtimeCommand: input.runtimeCommand,
    commandExists: input.commandExists,
    packageJsonDetected: input.packageJsonDetected,
    scriptDetected: input.scriptDetected,
    activationAttempted: input.activationAttempted,
    activationSucceeded: false,
    generatedAt: new Date().toISOString(),
    processId: null,
    observedStartTime: null,
    processState: 'NOT_STARTED',
    exitCode: null,
    expectedPort: DEFAULT_RUNTIME_ACTIVATION_PORT,
    detectedPort: null,
    portReachable: false,
    portCheckedAt: null,
    healthUrl: null,
    healthChecked: false,
    healthResponded: false,
    responseCode: null,
    healthCheckedAt: null,
    proofLevel: 'NOT_PROVEN',
    firstBrokenRuntimeLink: input.firstBrokenRuntimeLink,
  };
}

function deriveProofLevelFromProbe(probe: ProbeResult): RuntimeProofLevel {
  if (
    probe.activationSucceeded &&
    probe.commandExists &&
    probe.processId &&
    probe.processState === 'STARTED' &&
    probe.portReachable &&
    probe.healthResponded
  ) {
    return 'PROVEN';
  }
  if (probe.activationAttempted || probe.commandExists || probe.scriptDetected) {
    return 'PARTIAL';
  }
  return 'NOT_PROVEN';
}

function probeResultToSessionEvidence(probe: ProbeResult, workspacePath: string): RuntimeSessionEvidence {
  const port = probe.detectedPort ?? DEFAULT_RUNTIME_ACTIVATION_PORT;
  const host = '127.0.0.1';
  const url = probe.healthUrl ?? `http://${host}:${port}`;
  return {
    runtimeSessionId: probe.processId ? `runtime-gap-${probe.processId}` : undefined,
    command: probe.runtimeCommand ?? undefined,
    workingDirectory: workspacePath,
    scriptName: probe.runtimeCommand?.replace(/^npm run /, '') ?? undefined,
    frameworkHint: 'NODE',
    executionObserved: probe.activationAttempted ?? false,
    processId: probe.processId ?? undefined,
    processState: probe.processState ?? 'NOT_STARTED',
    startTime: probe.observedStartTime ?? undefined,
    exitStatus: probe.exitCode ?? null,
    port,
    host,
    url,
    reachable: probe.portReachable ?? false,
    protocol: 'http',
    healthStatusCode: probe.responseCode ?? undefined,
    healthResponseType:
      probe.responseCode !== null && probe.responseCode !== undefined
        ? probe.healthResponded
          ? 'json'
          : 'text'
        : undefined,
    responseTimeMs: undefined,
    healthEndpoint: url,
    logLines: probe.logLines,
  };
}

function parseProbeStdout(stdout: string): ProbeResult | null {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]!) as ProbeResult;
    } catch {
      // try previous line
    }
  }
  return null;
}

export function activateRuntimeProofGap(input: {
  projectRootDir: string;
  workspacePath: string;
  workspaceId: string;
  buildMaterialization: ConnectedBuildExecutionReport;
  expectedPort?: number;
}): {
  sessionEvidence: RuntimeSessionEvidence | null;
  activationEvidence: RuntimeActivationEvidence;
} {
  const workspacePath = input.workspacePath.replace(/\\/g, '/');
  const workspaceAbs = resolve(input.projectRootDir, workspacePath);
  const port = input.expectedPort ?? DEFAULT_RUNTIME_ACTIVATION_PORT;

  if (!isPathUnderGeneratedBuilderWorkspaces(input.projectRootDir, workspaceAbs)) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        runtimeCommand: null,
        commandExists: false,
        packageJsonDetected: false,
        scriptDetected: false,
        activationAttempted: false,
        firstBrokenRuntimeLink: 'workspace→command',
      }),
    };
  }

  const commandAssessment = resolveRuntimeCommand({
    rootDir: input.projectRootDir,
    workspacePath,
  });

  if (!commandAssessment.runtimeCommandFound) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        runtimeCommand: null,
        commandExists: false,
        packageJsonDetected: existsSync(join(workspaceAbs, 'package.json')),
        scriptDetected: false,
        activationAttempted: false,
        firstBrokenRuntimeLink: 'workspace→command',
      }),
    };
  }

  if (!existsSync(PROBE_SCRIPT)) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        runtimeCommand: commandAssessment.command,
        commandExists: true,
        packageJsonDetected: true,
        scriptDetected: true,
        activationAttempted: false,
        firstBrokenRuntimeLink: 'command→process',
      }),
    };
  }

  const result = spawnSync(process.execPath, [PROBE_SCRIPT, workspaceAbs, '0', input.workspaceId], {
    encoding: 'utf8',
    timeout: RUNTIME_ACTIVATION_STARTUP_TIMEOUT_MS + 3000,
    windowsHide: true,
    env: {
      ...process.env,
      RUNTIME_PROBE_TIMEOUT_MS: String(RUNTIME_ACTIVATION_STARTUP_TIMEOUT_MS),
    },
  });

  const probe = parseProbeStdout(result.stdout ?? '');
  if (!probe) {
    return {
      sessionEvidence: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        runtimeCommand: commandAssessment.command,
        commandExists: true,
        packageJsonDetected: true,
        scriptDetected: true,
        activationAttempted: true,
        firstBrokenRuntimeLink: 'command→process',
      }),
    };
  }

  const sessionEvidence = probeResultToSessionEvidence(probe, workspacePath);
  const proofLevel = deriveProofLevelFromProbe(probe);

  const linkage = analyzeRuntimeLinkage({
    buildMaterialization: input.buildMaterialization,
    workspacePath,
    command: {
      readOnly: true,
      runtimeCommandFound: Boolean(probe.commandExists),
      command: probe.runtimeCommand ?? commandAssessment.command,
      workingDirectory: workspacePath,
      scriptName: commandAssessment.scriptName,
      frameworkHint: commandAssessment.frameworkHint,
      missingCommandReason: null,
      confidence: commandAssessment.confidence,
      executionObserved: probe.activationAttempted ?? false,
    },
    process: {
      readOnly: true,
      processState: probe.processState ?? 'NOT_STARTED',
      processId: probe.processId ?? null,
      commandUsed: probe.runtimeCommand ?? commandAssessment.command,
      workingDirectory: workspacePath,
      startTime: probe.observedStartTime ?? null,
      exitStatus: probe.exitCode ?? null,
      runtimeSessionId: sessionEvidence.runtimeSessionId ?? null,
      confidence: probe.processId ? 90 : 0,
    },
    port: {
      readOnly: true,
      portState: probe.portReachable ? 'REACHABLE' : probe.detectedPort ? 'UNREACHABLE' : 'NOT_OBSERVED',
      port: probe.detectedPort ?? null,
      host: '127.0.0.1',
      url: probe.healthUrl ?? null,
      reachable: probe.portReachable ?? false,
      protocol: 'http',
      sourceProcessSessionId: sessionEvidence.runtimeSessionId ?? null,
      confidence: probe.portReachable ? 90 : 0,
    },
    health: {
      readOnly: true,
      healthState:
        probe.healthResponded && probe.responseCode !== null && probe.responseCode < 400
          ? 'HEALTHY'
          : probe.healthChecked
            ? 'FAILED'
            : 'NOT_CHECKED',
      statusCode: probe.responseCode ?? null,
      responseType: probe.healthResponded ? 'json' : null,
      responseTimeMs: null,
      healthEndpoint: probe.healthUrl ?? null,
      confidence: probe.healthResponded ? 90 : 0,
    },
  });

  const activationEvidence: RuntimeActivationEvidence = {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath,
    runtimeCommand: probe.runtimeCommand ?? commandAssessment.command,
    commandExists: Boolean(probe.commandExists ?? commandAssessment.runtimeCommandFound),
    packageJsonDetected: probe.packageJsonDetected ?? true,
    scriptDetected: probe.scriptDetected ?? true,
    activationAttempted: probe.activationAttempted ?? true,
    activationSucceeded: probe.activationSucceeded ?? false,
    generatedAt: new Date().toISOString(),
    processId: probe.processId ?? null,
    observedStartTime: probe.observedStartTime ?? null,
    processState: probe.processState ?? 'NOT_STARTED',
    exitCode: probe.exitCode ?? null,
    expectedPort: probe.expectedPort ?? port,
    detectedPort: probe.detectedPort ?? null,
    portReachable: probe.portReachable ?? false,
    portCheckedAt: probe.portCheckedAt ?? null,
    healthUrl: probe.healthUrl ?? null,
    healthChecked: probe.healthChecked ?? false,
    healthResponded: probe.healthResponded ?? false,
    responseCode: probe.responseCode ?? null,
    healthCheckedAt: probe.healthCheckedAt ?? null,
    proofLevel,
    firstBrokenRuntimeLink: linkage.runtimeLinkageConnected ? null : linkage.firstBrokenRuntimeLink,
  };

  return {
    sessionEvidence: probe.activationSucceeded ? sessionEvidence : sessionEvidence,
    activationEvidence,
  };
}

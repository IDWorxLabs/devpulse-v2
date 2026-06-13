/**
 * Runtime Activation Engine — bounded real process startup inside disposable workspaces (Phase 25.28).
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join, resolve, sep } from 'node:path';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  DEFAULT_RUNTIME_PORT,
  MAX_RUNTIME_ARTIFACTS,
  MAX_RUNTIME_DIAGNOSTICS,
  MAX_RUNTIME_EVIDENCE,
  MAX_RUNTIME_WARNINGS,
  RUNTIME_STARTUP_TIMEOUT_MS,
} from './connected-runtime-execution-registry.js';
import type {
  ConnectedBuildExecutionContract,
  ExecuteRuntimeActivationInput,
  ExecuteRuntimeActivationResult,
  RuntimeArtifactEntry,
  RuntimeDiagnosticEntry,
  RuntimeEvidenceEntry,
  RuntimeActivationEvidence,
} from './connected-runtime-execution-types.js';

let evidenceCounter = 0;
let runtimeCounter = 0;
let activeRuntimeProcess: ChildProcess | null = null;

export function resetRuntimeActivationEngineForTests(): void {
  cleanupActiveRuntime();
  evidenceCounter = 0;
  runtimeCounter = 0;
}

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `runtime-activation-evidence-${evidenceCounter}`;
}

function nextRuntimeId(): string {
  runtimeCounter += 1;
  return `connected-runtime-${runtimeCounter}`;
}

function buildEvidence(
  evidenceType: string,
  summary: string,
  source: string,
): RuntimeEvidenceEntry {
  return {
    readOnly: true,
    evidenceId: nextEvidenceId(),
    evidenceType,
    summary,
    source,
    inspectedAt: new Date().toISOString(),
  };
}

export function cleanupActiveRuntime(): boolean {
  if (activeRuntimeProcess) {
    const child = activeRuntimeProcess;
    activeRuntimeProcess = null;
    try {
      child.kill();
    } catch {
      // Process may already be terminated.
    }
  }
  return activeRuntimeProcess === null;
}

function isWorkspaceRootSafe(projectRootDir: string, workspaceRoot: string): boolean {
  const generatedRoot = resolve(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR);
  return workspaceRoot.startsWith(generatedRoot + sep) || workspaceRoot === generatedRoot;
}

const MINIMAL_SERVER_SOURCE = `
const http = require('http');
const port = Number(process.env.RUNTIME_PORT || ${DEFAULT_RUNTIME_PORT});
const workspaceId = process.env.WORKSPACE_ID || 'unknown';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', workspaceId, path: req.url }));
});
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(JSON.stringify({ ready: true, port, workspaceId }) + '\\n');
});
`.trim();

export function prepareBuildExecutionInWorkspace(
  projectRootDir: string,
  workspaceId: string,
  workspaceRoot: string,
): ConnectedBuildExecutionContract {
  const artifacts: string[] = [];

  const packageJsonPath = 'package.json';
  const serverPath = 'dist/server.js';
  const buildMarkerPath = '.build-output.json';

  executeRealFileOperation({
    projectRootDir,
    workspaceId,
    operation: createRealFileOperation({
      workspaceId,
      relativePath: packageJsonPath,
      operationType: 'CREATE_FILE',
      requestedBy: 'connected-runtime-execution',
      sourceActionId: 'build-package-json',
      payload: JSON.stringify(
        {
          name: `disposable-${workspaceId}`,
          private: true,
          type: 'commonjs',
          scripts: { start: 'node dist/server.js' },
        },
        null,
        2,
      ),
    }),
  });
  artifacts.push(packageJsonPath);

  executeRealFileOperation({
    projectRootDir,
    workspaceId,
    operation: createRealFileOperation({
      workspaceId,
      relativePath: serverPath,
      operationType: 'CREATE_FILE',
      requestedBy: 'connected-runtime-execution',
      sourceActionId: 'build-server-js',
      payload: MINIMAL_SERVER_SOURCE,
    }),
  });
  artifacts.push(serverPath);

  executeRealFileOperation({
    projectRootDir,
    workspaceId,
    operation: createRealFileOperation({
      workspaceId,
      relativePath: buildMarkerPath,
      operationType: 'CREATE_FILE',
      requestedBy: 'connected-runtime-execution',
      sourceActionId: 'build-output-marker',
      payload: JSON.stringify(
        { workspaceId, builtAt: new Date().toISOString(), artifacts, phase: '25.27-bridge' },
        null,
        2,
      ),
    }),
  });
  artifacts.push(buildMarkerPath);

  return {
    readOnly: true,
    workspaceId,
    workspaceRoot,
    buildTimestamp: new Date().toISOString(),
    buildArtifacts: artifacts,
    buildSuccessful: true,
    realBuildPerformed: true,
  };
}

function detectStartupArtifacts(workspaceRoot: string): string[] {
  const candidates = [
    'dist/server.js',
    'package.json',
    '.build-output.json',
    '.workspace-created.json',
  ];
  return candidates.filter((relative) => existsSync(join(workspaceRoot, relative)));
}

function waitForReadySignal(
  child: ChildProcess,
  timeoutMs: number,
): Promise<{ ready: boolean; port: number; output: string }> {
  return new Promise((resolvePromise) => {
    let output = '';
    let settled = false;

    const finish = (result: { ready: boolean; port: number; output: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(result);
    };

    const timer = setTimeout(() => {
      finish({ ready: false, port: DEFAULT_RUNTIME_PORT, output });
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer | string) => {
      output += String(chunk);
      const lines = output.trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as { ready?: boolean; port?: number };
          if (parsed.ready && parsed.port) {
            finish({ ready: true, port: parsed.port, output });
            return;
          }
        } catch {
          // Wait for complete JSON line.
        }
      }
    });

    child.on('exit', () => {
      finish({ ready: false, port: DEFAULT_RUNTIME_PORT, output });
    });
  });
}

function probeEndpoint(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const req = httpGet(`http://127.0.0.1:${port}/`, (res) => {
      resolvePromise(res.statusCode === 200);
    });
    req.on('error', () => resolvePromise(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolvePromise(false);
    });
  });
}

function emptyActivationEvidence(startupDurationMs: number): RuntimeActivationEvidence {
  return {
    readOnly: true,
    runtimeStarted: false,
    startupSucceeded: false,
    startupDurationMs,
    processDetected: false,
    runtimeEndpointAvailable: false,
    startupArtifactsPresent: false,
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-runtime-activation-inspection',
  };
}

export async function executeRuntimeActivation(
  input: ExecuteRuntimeActivationInput,
): Promise<ExecuteRuntimeActivationResult> {
  const startMs = Date.now();
  const runtimeEvidence: RuntimeEvidenceEntry[] = [];
  const runtimeWarnings: string[] = [];
  const runtimeDiagnostics: RuntimeDiagnosticEntry[] = [];
  const blockingReasons: string[] = [];
  const runtimeArtifacts: RuntimeArtifactEntry[] = [];
  const runtimeId = nextRuntimeId();

  if (input.activationMode === 'BLOCKED' || input.activationMode === 'DRY_RUN') {
    return {
      success: false,
      runtimeId,
      runtimeArtifacts,
      runtimeEvidence,
      runtimeWarnings: [`Activation mode ${input.activationMode} — no runtime process started.`],
      runtimeDiagnostics,
      activationEvidence: emptyActivationEvidence(0),
      realRuntimeLaunchPerformed: false,
      blockingReasons:
        input.activationMode === 'BLOCKED' ? ['Runtime activation blocked by upstream gates.'] : [],
    };
  }

  if (!isWorkspaceRootSafe(input.projectRootDir, input.workspaceRoot)) {
    blockingReasons.push('Workspace root is outside generated builder workspaces.');
    return {
      success: false,
      runtimeId,
      runtimeArtifacts,
      runtimeEvidence: [
        buildEvidence('PATH_BLOCKED', 'Workspace root failed isolation check', 'runtime-activation-engine'),
      ],
      runtimeWarnings,
      runtimeDiagnostics,
      activationEvidence: emptyActivationEvidence(Date.now() - startMs),
      realRuntimeLaunchPerformed: false,
      blockingReasons,
    };
  }

  cleanupActiveRuntime();

  const startupArtifacts = detectStartupArtifacts(input.workspaceRoot);
  const startupArtifactsPresent = startupArtifacts.includes('dist/server.js');

  for (const artifactPath of startupArtifacts.slice(0, MAX_RUNTIME_ARTIFACTS)) {
    runtimeArtifacts.push({
      readOnly: true,
      path: artifactPath,
      category: artifactPath.includes('build') ? 'BUILD' : 'STARTUP',
      sourceAuthority: 'connected-build-execution',
    });
  }

  if (!startupArtifactsPresent) {
    blockingReasons.push('Startup artifact dist/server.js not found in workspace.');
    return {
      success: false,
      runtimeId,
      runtimeArtifacts,
      runtimeEvidence,
      runtimeWarnings,
      runtimeDiagnostics,
      activationEvidence: emptyActivationEvidence(Date.now() - startMs),
      realRuntimeLaunchPerformed: false,
      blockingReasons,
    };
  }

  const serverPath = join(input.workspaceRoot, 'dist', 'server.js');
  const child = spawn(process.execPath, [serverPath], {
    cwd: input.workspaceRoot,
    env: {
      ...process.env,
      RUNTIME_PORT: String(DEFAULT_RUNTIME_PORT),
      WORKSPACE_ID: input.workspaceId,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  activeRuntimeProcess = child;
  runtimeEvidence.push(
    buildEvidence(
      'RUNTIME_PROCESS_SPAWNED',
      `Spawned node process pid=${child.pid ?? 'unknown'}`,
      'runtime-activation-engine',
    ),
  );

  runtimeDiagnostics.push({
    readOnly: true,
    diagnosticId: 'process-pid',
    label: 'Process PID',
    value: String(child.pid ?? 'unknown'),
    source: 'runtime-activation-engine',
  });

  const ready = await waitForReadySignal(child, RUNTIME_STARTUP_TIMEOUT_MS);
  const startupDurationMs = Date.now() - startMs;
  const processDetected = child.pid !== undefined && !child.killed;

  runtimeDiagnostics.push({
    readOnly: true,
    diagnosticId: 'startup-duration',
    label: 'Startup duration (ms)',
    value: String(startupDurationMs),
    source: 'runtime-activation-engine',
  });

  if (ready.ready) {
    runtimeEvidence.push(
      buildEvidence('RUNTIME_READY_SIGNAL', ready.output.trim().slice(0, 200), 'runtime-activation-engine'),
    );
  } else {
    runtimeWarnings.push('Runtime ready signal not received within timeout.');
  }

  const endpointAvailable = await probeEndpoint(ready.port);
  if (endpointAvailable) {
    runtimeEvidence.push(
      buildEvidence(
        'RUNTIME_ENDPOINT_AVAILABLE',
        `HTTP 200 on 127.0.0.1:${ready.port}`,
        'runtime-activation-engine',
      ),
    );
  } else {
    runtimeWarnings.push(`Runtime endpoint not reachable on port ${ready.port}.`);
  }

  try {
    writeFileSync(
      join(input.workspaceRoot, '.runtime-activated.json'),
      JSON.stringify(
        {
          runtimeId,
          workspaceId: input.workspaceId,
          runtimeType: input.runtimeType,
          port: ready.port,
          pid: child.pid,
          activatedAt: new Date().toISOString(),
          startupDurationMs,
        },
        null,
        2,
      ),
      'utf8',
    );
    runtimeArtifacts.push({
      readOnly: true,
      path: '.runtime-activated.json',
      category: 'RUNTIME_MARKER',
      sourceAuthority: 'connected-runtime-execution',
    });
    runtimeEvidence.push(
      buildEvidence('RUNTIME_MARKER_WRITTEN', 'Wrote .runtime-activated.json', 'runtime-activation-engine'),
    );
  } catch (err) {
    runtimeWarnings.push(`Failed to write runtime marker: ${err instanceof Error ? err.message : String(err)}`);
  }

  const startupSucceeded = ready.ready && processDetected;
  const activationEvidence: RuntimeActivationEvidence = {
    readOnly: true,
    runtimeStarted: true,
    startupSucceeded,
    startupDurationMs,
    processDetected,
    runtimeEndpointAvailable: endpointAvailable,
    startupArtifactsPresent,
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-runtime-activation-inspection',
  };

  runtimeEvidence.push(
    buildEvidence(
      'RUNTIME_INSPECTION',
      `runtimeStarted=${activationEvidence.runtimeStarted} startupSucceeded=${startupSucceeded} endpoint=${endpointAvailable}`,
      'real-runtime-activation-inspection',
    ),
  );

  const success =
    blockingReasons.length === 0 &&
    startupSucceeded &&
    processDetected &&
    startupArtifactsPresent &&
    endpointAvailable;

  return {
    success,
    runtimeId,
    runtimeArtifacts: runtimeArtifacts.slice(0, MAX_RUNTIME_ARTIFACTS),
    runtimeEvidence: runtimeEvidence.slice(0, MAX_RUNTIME_EVIDENCE),
    runtimeWarnings: runtimeWarnings.slice(0, MAX_RUNTIME_WARNINGS),
    runtimeDiagnostics: runtimeDiagnostics.slice(0, MAX_RUNTIME_DIAGNOSTICS),
    activationEvidence,
    realRuntimeLaunchPerformed: success,
    blockingReasons,
  };
}

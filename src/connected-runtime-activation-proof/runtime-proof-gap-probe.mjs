/**
 * Bounded runtime activation probe — runs inside spawnSync from runtime-proof-gap-activator.
 * Starts materialized dev server, probes port/health, emits JSON result on stdout.
 */

import { spawn } from 'node:child_process';
import { killChildProcessTree } from '../windows-process-cleanup/kill-child-process-tree.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';

const [, , workspaceRoot, portStr, workspaceId] = process.argv;
const requestedPort = Number(portStr || 0);
const timeoutMs = Number(process.env.RUNTIME_PROBE_TIMEOUT_MS || 8000);

function readPackageJson() {
  const pkgPath = join(workspaceRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    return { packageJsonDetected: false, scriptDetected: false, runtimeCommand: null, scriptName: null };
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const scripts = pkg.scripts ?? {};
    for (const candidate of ['dev', 'start', 'serve', 'preview']) {
      if (scripts[candidate]) {
        return {
          packageJsonDetected: true,
          scriptDetected: true,
          runtimeCommand: `npm run ${candidate}`,
          scriptName: candidate,
        };
      }
    }
    const firstScript = Object.keys(scripts)[0];
    if (firstScript) {
      return {
        packageJsonDetected: true,
        scriptDetected: true,
        runtimeCommand: `npm run ${firstScript}`,
        scriptName: firstScript,
      };
    }
    return { packageJsonDetected: true, scriptDetected: false, runtimeCommand: null, scriptName: null };
  } catch {
    return { packageJsonDetected: true, scriptDetected: false, runtimeCommand: null, scriptName: null };
  }
}

function resolveServerEntry(scriptName) {
  const serverPath = join(workspaceRoot, 'runtime', 'dev-server.mjs');
  if (existsSync(serverPath)) return serverPath;
  if (scriptName === 'dev' || scriptName === 'start') {
    return serverPath;
  }
  return null;
}

function waitForReady(child, timeout) {
  return new Promise((resolve) => {
    let output = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ready: false, port: requestedPort, output }), timeout);
    child.stdout?.on('data', (chunk) => {
      output += String(chunk);
      for (const line of output.trim().split('\n')) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.ready && parsed.port) {
            finish({ ready: true, port: parsed.port, output });
            return;
          }
        } catch {
          // wait for complete JSON line
        }
      }
    });
    child.on('exit', (code) => finish({ ready: false, port: requestedPort, output, exitCode: code ?? null }));
  });
}

function probeEndpoint(port) {
  return new Promise((resolve) => {
    const url = `http://127.0.0.1:${port}/`;
    const startedAt = Date.now();
    const req = httpGet(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += String(chunk);
      });
      res.on('end', () => {
        resolve({
          portReachable: res.statusCode === 200,
          healthResponded: res.statusCode !== null && res.statusCode >= 200 && res.statusCode < 400,
          responseCode: res.statusCode ?? null,
          healthUrl: url,
          responseTimeMs: Date.now() - startedAt,
          responseType: (res.headers['content-type'] ?? '').includes('json') ? 'json' : 'text',
        });
      });
    });
    req.on('error', () =>
      resolve({
        portReachable: false,
        healthResponded: false,
        responseCode: null,
        healthUrl: url,
        responseTimeMs: Date.now() - startedAt,
        responseType: null,
      }),
    );
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({
        portReachable: false,
        healthResponded: false,
        responseCode: null,
        healthUrl: url,
        responseTimeMs: Date.now() - startedAt,
        responseType: null,
      });
    });
  });
}

async function main() {
  const pkg = readPackageJson();
  const serverPath = resolveServerEntry(pkg.scriptName);
  const base = {
    workspaceId: workspaceId ?? 'unknown',
    workspacePath: workspaceRoot.replace(/\\/g, '/'),
    runtimeCommand: pkg.runtimeCommand,
    commandExists: Boolean(pkg.runtimeCommand),
    packageJsonDetected: pkg.packageJsonDetected,
    scriptDetected: pkg.scriptDetected,
    activationAttempted: false,
    activationSucceeded: false,
    processId: null,
    observedStartTime: null,
    processState: 'NOT_STARTED',
    exitCode: null,
    expectedPort: requestedPort > 0 ? requestedPort : null,
    detectedPort: null,
    portReachable: false,
    portCheckedAt: null,
    healthUrl: null,
    healthChecked: false,
    healthResponded: false,
    responseCode: null,
    healthCheckedAt: null,
    logLines: [],
  };

  if (!pkg.scriptDetected || !serverPath || !existsSync(serverPath)) {
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  base.activationAttempted = true;
  const observedStartTime = new Date().toISOString();
  const child = spawn(process.execPath, [serverPath], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      RUNTIME_PORT: requestedPort > 0 ? String(requestedPort) : '0',
      WORKSPACE_ID: workspaceId ?? 'unknown',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  base.processId = child.pid !== undefined ? String(child.pid) : null;
  base.observedStartTime = observedStartTime;
  base.processState = 'STARTED';

  const ready = await waitForReady(child, timeoutMs);
  if (ready.output.trim()) {
    base.logLines = ready.output.trim().split('\n').slice(-4);
  }
  base.detectedPort = ready.port;
  base.exitCode = ready.exitCode ?? null;

  const probe = await probeEndpoint(ready.port);
  base.portReachable = probe.portReachable;
  base.portCheckedAt = new Date().toISOString();
  base.healthUrl = probe.healthUrl;
  base.healthChecked = true;
  base.healthResponded = probe.healthResponded;
  base.responseCode = probe.responseCode;
  base.healthCheckedAt = new Date().toISOString();

  base.activationSucceeded =
    Boolean(base.processId) &&
    base.processState === 'STARTED' &&
    ready.ready &&
    probe.portReachable &&
    probe.healthResponded;

  try {
    await killChildProcessTree(child);
  } catch {
    // process may already be terminated
  }

  process.stdout.write(`${JSON.stringify(base)}\n`);
}

main().catch((err) => {
  process.stdout.write(
    `${JSON.stringify({
      activationAttempted: true,
      activationSucceeded: false,
      error: err instanceof Error ? err.message : String(err),
    })}\n`,
  );
  process.exit(1);
});

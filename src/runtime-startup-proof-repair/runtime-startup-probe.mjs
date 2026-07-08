/**
 * Bounded runtime startup probe — isolated child process with guaranteed cleanup.
 * Args: workspaceAbs port workspaceId commandShell
 */

import { spawn } from 'node:child_process';
import { killChildProcessTree } from '../windows-process-cleanup/kill-child-process-tree.mjs';
import { existsSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';

const [, , workspaceRoot, portStr, workspaceId, commandShell] = process.argv;
const requestedPort = Number(portStr || 4173);
const timeoutMs = Number(process.env.RUNTIME_STARTUP_PROBE_TIMEOUT_MS || 8000);
const command = commandShell || '';

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
          portReachable: res.statusCode >= 200 && res.statusCode < 500,
          healthResponded: res.statusCode >= 200 && res.statusCode < 400,
          responseCode: res.statusCode ?? null,
          healthUrl: url,
          responseTimeMs: Date.now() - startedAt,
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
      });
    });
  });
}

function waitForReady(child, timeout, logLines) {
  return new Promise((resolve) => {
    let output = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ready: false, port: requestedPort, output, timedOut: true }), timeout);

    const onData = (chunk) => {
      output += String(chunk);
      const lines = output.trim().split('\n');
      logLines.push(...lines.slice(-4));
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.ready && parsed.port) {
            finish({ ready: true, port: parsed.port, output, timedOut: false });
            return;
          }
        } catch {
          // wait for JSON ready line from dev-server
        }
        if (/ready|listening|started|Local:/i.test(line)) {
          finish({ ready: true, port: requestedPort, output, timedOut: false });
        }
      }
    };

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', (code) =>
      finish({ ready: false, port: requestedPort, output, exitCode: code ?? null, timedOut: false }),
    );
  });
}

function parseCommand(cmd) {
  if (cmd.startsWith('npm run ')) {
    return { exec: process.platform === 'win32' ? 'npm.cmd' : 'npm', args: ['run', cmd.replace(/^npm run /, '')] };
  }
  if (cmd.startsWith('node ')) {
    return { exec: process.execPath, args: [cmd.replace(/^node /, '')] };
  }
  return { exec: process.platform === 'win32' ? 'cmd.exe' : 'sh', args: process.platform === 'win32' ? ['/c', cmd] : ['-c', cmd] };
}

async function main() {
  const startedAt = Date.now();
  const logLines = [];
  const fatalErrors = [];
  const base = {
    attemptedCommand: command || null,
    cwd: workspaceRoot.replace(/\\/g, '/'),
    expectedPort: requestedPort,
    processStarted: false,
    portBound: false,
    firstResponseStatus: null,
    startupLogs: [],
    fatalErrors: [],
    elapsedMs: 0,
    timedOut: false,
    cleanupStatus: 'NOT_STARTED',
    processId: null,
    healthResponded: false,
    applicationBoots: false,
  };

  if (!command || !existsSync(workspaceRoot)) {
    base.elapsedMs = Date.now() - startedAt;
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  const parsed = parseCommand(command);
  const entryPath = parsed.args[0] ? join(workspaceRoot, parsed.args[0]) : null;
  if (parsed.exec === process.execPath && entryPath && !existsSync(entryPath)) {
    fatalErrors.push(`ENTRYPOINT_MISSING: ${parsed.args[0]}`);
    base.fatalErrors = fatalErrors;
    base.elapsedMs = Date.now() - startedAt;
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  const child = spawn(parsed.exec, parsed.args, {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      PORT: String(requestedPort),
      RUNTIME_PORT: String(requestedPort),
      WORKSPACE_ID: workspaceId ?? 'unknown',
      BROWSER: 'none',
      CI: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  base.processId = child.pid !== undefined ? String(child.pid) : null;
  base.processStarted = base.processId !== null;

  const ready = await waitForReady(child, timeoutMs, logLines);
  base.timedOut = ready.timedOut === true;
  base.startupLogs = logLines.slice(-12);

  if (/EADDRINUSE|address already in use/i.test(ready.output || '')) {
    fatalErrors.push('PORT_CONFLICT detected in startup logs');
  }
  if (/Cannot find module|MODULE_NOT_FOUND|ENOENT.*node_modules/i.test(ready.output || '')) {
    fatalErrors.push('MISSING_DEPENDENCIES detected in startup logs');
  }
  if (/SyntaxError|TS\d+|compile error|Failed to compile/i.test(ready.output || '')) {
    fatalErrors.push('COMPILE_ERROR detected in startup logs');
  }
  const exitedNonZero = typeof ready.exitCode === 'number' && ready.exitCode !== 0;
  if (exitedNonZero) {
    fatalErrors.push(`RUNTIME_CRASH exitCode=${ready.exitCode}`);
  }

  const port = ready.port ?? requestedPort;
  const probe = await probeEndpoint(port);
  base.portBound = probe.portReachable;
  base.firstResponseStatus = probe.responseCode;
  base.healthResponded = probe.healthResponded;

  const healthSuccess =
    base.processStarted &&
    !base.timedOut &&
    probe.healthResponded &&
    probe.responseCode !== null &&
    probe.responseCode >= 200 &&
    probe.responseCode < 400;

  if (healthSuccess) {
    base.fatalErrors = fatalErrors.filter(
      (e) =>
        !e.includes('RUNTIME_CRASH') &&
        !e.startsWith('PORT_CONFLICT'),
    );
    base.applicationBoots = true;
  } else {
    base.fatalErrors = fatalErrors;
    base.applicationBoots =
      base.processStarted && !base.timedOut && probe.healthResponded && fatalErrors.length === 0;
  }

  let cleanupStatus = 'CLEANED';
  try {
    if (child.pid) {
      await killChildProcessTree(child);
    }
  } catch {
    cleanupStatus = 'CLEANUP_FAILED';
  }
  base.cleanupStatus = base.processStarted ? cleanupStatus : 'NOT_STARTED';
  base.elapsedMs = Date.now() - startedAt;

  process.stdout.write(`${JSON.stringify(base)}\n`);
}

main().catch((err) => {
  process.stdout.write(
    `${JSON.stringify({
      attemptedCommand: command,
      fatalErrors: [err instanceof Error ? err.message : String(err)],
      cleanupStatus: 'NOT_STARTED',
      applicationBoots: false,
    })}\n`,
  );
  process.exit(1);
});

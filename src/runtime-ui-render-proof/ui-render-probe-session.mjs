/**
 * Bounded UI render probe session — startup + multi-route HTTP fetch.
 * Args: workspaceAbs port workspaceId commandShell routesJson
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';

const [, , workspaceRoot, portStr, workspaceId, commandShell, routesJson] = process.argv;
const requestedPort = Number(portStr || 4173);
const timeoutMs = Number(process.env.UI_RENDER_PROBE_TIMEOUT_MS || 8000);
const requestTimeoutMs = Number(process.env.UI_RENDER_PROBE_REQUEST_TIMEOUT_MS || 2500);
const command = commandShell || '';
const routes = JSON.parse(routesJson || '[]');

function probeRoute(port, routePath) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const req = httpGet(
      {
        hostname: '127.0.0.1',
        port,
        path: routePath,
        timeout: requestTimeoutMs,
        headers: { Accept: 'text/html,application/json,*/*' },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          if (body.length < 1024) body += String(chunk);
        });
        res.on('end', () => {
          resolve({
            path: routePath,
            statusCode: res.statusCode ?? null,
            contentType: res.headers['content-type'] ?? null,
            bodyExcerpt: body.slice(0, 512) || null,
            elapsedMs: Date.now() - startedAt,
            responded: true,
          });
        });
      },
    );
    req.on('error', () =>
      resolve({
        path: routePath,
        statusCode: null,
        contentType: null,
        bodyExcerpt: null,
        elapsedMs: Date.now() - startedAt,
        responded: false,
      }),
    );
    req.setTimeout(requestTimeoutMs, () => {
      req.destroy();
      resolve({
        path: routePath,
        statusCode: null,
        contentType: null,
        bodyExcerpt: null,
        elapsedMs: Date.now() - startedAt,
        responded: false,
        timedOut: true,
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
          // wait
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
    baseUrl: null,
    port: null,
    probeResults: [],
    applicationBootsBeforeProbe: process.env.APPLICATION_BOOTS === 'true',
    routesReachableBeforeProbe: process.env.ROUTES_REACHABLE === 'true',
    probeSkipped: false,
    skipReason: null,
    cleanupStatus: 'NOT_STARTED',
    elapsedMs: 0,
    fatalErrors: [],
  };

  if (!command || !existsSync(workspaceRoot)) {
    base.skipReason = 'missing command or workspace';
    base.probeSkipped = true;
    base.elapsedMs = Date.now() - startedAt;
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  const parsed = parseCommand(command);
  const entryPath = parsed.args[0] ? join(workspaceRoot, parsed.args[0]) : null;
  if (parsed.exec === process.execPath && entryPath && !existsSync(entryPath)) {
    fatalErrors.push(`ENTRYPOINT_MISSING: ${parsed.args[0]}`);
    base.fatalErrors = fatalErrors;
    base.probeSkipped = true;
    base.skipReason = 'entrypoint missing';
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

  const ready = await waitForReady(child, timeoutMs, logLines);
  if (ready.timedOut) fatalErrors.push('UI_PROBE_STARTUP_TIMEOUT');
  if (!ready.ready) fatalErrors.push('UI_PROBE_SERVER_NOT_READY');

  const port = ready.port ?? requestedPort;
  base.port = port;
  base.baseUrl = `http://127.0.0.1:${port}`;

  const probeResults = [];
  for (const routePath of routes) {
    probeResults.push(await probeRoute(port, routePath));
  }
  base.probeResults = probeResults;

  let cleanupStatus = 'CLEANED';
  try {
    if (child.pid) {
      child.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 300));
      try {
        process.kill(child.pid, 0);
        child.kill('SIGKILL');
      } catch {
        // already dead
      }
    }
  } catch {
    cleanupStatus = 'CLEANUP_FAILED';
  }
  base.cleanupStatus = cleanupStatus;
  base.fatalErrors = fatalErrors;
  base.elapsedMs = Date.now() - startedAt;

  process.stdout.write(`${JSON.stringify(base)}\n`);
}

main().catch((err) => {
  process.stdout.write(
    `${JSON.stringify({
      baseUrl: null,
      port: null,
      probeResults: [],
      applicationBootsBeforeProbe: process.env.APPLICATION_BOOTS === 'true',
      routesReachableBeforeProbe: process.env.ROUTES_REACHABLE === 'true',
      probeSkipped: true,
      skipReason: err instanceof Error ? err.message : String(err),
      cleanupStatus: 'NOT_STARTED',
      elapsedMs: 0,
      fatalErrors: [err instanceof Error ? err.message : String(err)],
    })}\n`,
  );
  process.exit(1);
});

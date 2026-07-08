/**
 * Bounded route probe session — isolated child with startup + multi-route HTTP checks.
 * Args: workspaceAbs port workspaceId commandShell routesJson
 */

import { spawn } from 'node:child_process';
import { killChildProcessTree } from '../windows-process-cleanup/kill-child-process-tree.mjs';
import { existsSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';

const [, , workspaceRoot, portStr, workspaceId, commandShell, routesJson] = process.argv;
const requestedPort = Number(portStr || 4173);
const timeoutMs = Number(process.env.ROUTE_PROBE_TIMEOUT_MS || 8000);
const requestTimeoutMs = Number(process.env.ROUTE_PROBE_REQUEST_TIMEOUT_MS || 2500);
const command = commandShell || '';
const routes = JSON.parse(routesJson || '[]');

function classifyResponseType(contentType, body) {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('json') || (body.trim().startsWith('{') && body.trim().endsWith('}'))) return 'json';
  if (ct.includes('html')) return 'html';
  if (body.trim()) return 'text';
  return 'unknown';
}

function probeRoute(port, routePath) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const req = httpGet(
      {
        hostname: '127.0.0.1',
        port,
        path: routePath,
        timeout: requestTimeoutMs,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          if (body.length < 512) body += String(chunk);
        });
        res.on('end', () => {
          const statusCode = res.statusCode ?? null;
          const responseType = classifyResponseType(res.headers['content-type'], body);
          let verdict = 'NO_RESPONSE';
          if (statusCode === null) verdict = 'NO_RESPONSE';
          else if (statusCode >= 200 && statusCode < 400) verdict = 'SUCCESS';
          else if (statusCode === 404) verdict = 'NOT_FOUND';
          else if (statusCode >= 500) verdict = 'SERVER_ERROR';
          else verdict = 'NO_RESPONSE';
          resolve({
            routePath,
            statusCode,
            responded: true,
            responseType,
            bodyExcerpt: body.slice(0, 256) || null,
            elapsedMs: Date.now() - startedAt,
            verdict,
          });
        });
      },
    );
    req.on('error', () =>
      resolve({
        routePath,
        statusCode: null,
        responded: false,
        responseType: 'none',
        bodyExcerpt: null,
        elapsedMs: Date.now() - startedAt,
        verdict: 'NO_RESPONSE',
      }),
    );
    req.setTimeout(requestTimeoutMs, () => {
      req.destroy();
      resolve({
        routePath,
        statusCode: null,
        responded: false,
        responseType: 'none',
        bodyExcerpt: null,
        elapsedMs: Date.now() - startedAt,
        verdict: 'TIMEOUT',
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
    runtimeBootedBeforeProbe: process.env.APPLICATION_BOOTS === 'true',
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
  if (ready.timedOut) fatalErrors.push('ROUTE_PROBE_STARTUP_TIMEOUT');
  if (!ready.ready) fatalErrors.push('ROUTE_PROBE_SERVER_NOT_READY');

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
      await killChildProcessTree(child);
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
      runtimeBootedBeforeProbe: process.env.APPLICATION_BOOTS === 'true',
      probeSkipped: true,
      skipReason: err instanceof Error ? err.message : String(err),
      cleanupStatus: 'NOT_STARTED',
      elapsedMs: 0,
      fatalErrors: [err instanceof Error ? err.message : String(err)],
    })}\n`,
  );
  process.exit(1);
});

/**
 * Bounded verification execution probe — starts runtime, runs verify script, records results.
 */

import { spawn, spawnSync } from 'node:child_process';
import { killChildProcessTree } from '../windows-process-cleanup/kill-child-process-tree.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';

const [, , workspaceRoot, portStr, workspaceId] = process.argv;
const requestedPort = Number(portStr || 0);
const timeoutMs = Number(process.env.VERIFICATION_PROBE_TIMEOUT_MS || 12000);

function readVerifyCommand() {
  const pkgPath = join(workspaceRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    return { commandDetected: false, verificationCommand: null, scriptName: null };
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const scripts = pkg.scripts ?? {};
    for (const candidate of ['verify', 'test', 'validate']) {
      if (scripts[candidate]) {
        return {
          commandDetected: true,
          verificationCommand: `npm run ${candidate}`,
          scriptName: candidate,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { commandDetected: false, verificationCommand: null, scriptName: null };
}

function resolveServerEntry() {
  const serverPath = join(workspaceRoot, 'runtime', 'dev-server.mjs');
  return existsSync(serverPath) ? serverPath : null;
}

function resolveVerifyEntry() {
  const verifyPath = join(workspaceRoot, 'verification', 'run-verify.mjs');
  return existsSync(verifyPath) ? verifyPath : null;
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
          /* wait */
        }
      }
    });
    child.on('exit', () => finish({ ready: false, port: requestedPort, output }));
  });
}

async function main() {
  const cmd = readVerifyCommand();
  const base = {
    workspaceId: workspaceId ?? 'unknown',
    workspacePath: workspaceRoot.replace(/\\/g, '/'),
    verificationCommand: cmd.verificationCommand,
    commandDetected: cmd.commandDetected,
    generatedAt: new Date().toISOString(),
    executionAttempted: false,
    executionObserved: false,
    verificationSucceeded: false,
    exitCode: null,
    passCount: 0,
    failCount: 0,
    skippedCount: 0,
    testsExecuted: 0,
    checksExecuted: 0,
    executionStartedAt: null,
    executionCompletedAt: null,
    durationMs: null,
    previewUrl: null,
    proofLevel: 'NOT_PROVEN',
    firstBrokenVerificationLink: 'preview→command',
  };

  const verifyPath = resolveVerifyEntry();
  const serverPath = resolveServerEntry();
  if (!cmd.commandDetected || !verifyPath || !serverPath) {
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

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

  const ready = await waitForReady(child, timeoutMs);
  if (!ready.ready) {
    base.firstBrokenVerificationLink = 'preview→command';
    try {
      await killChildProcessTree(child);
    } catch {
      /* ignore */
    }
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  const previewUrl = `http://127.0.0.1:${ready.port}/`;
  base.previewUrl = previewUrl;
  base.executionAttempted = true;
  const executionStartedAt = new Date().toISOString();
  base.executionStartedAt = executionStartedAt;
  const startMs = Date.now();

  const verifyResult = spawnSync(process.execPath, [verifyPath], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      PREVIEW_URL: previewUrl,
      WORKSPACE_ID: workspaceId ?? 'unknown',
    },
    timeout: timeoutMs,
    windowsHide: true,
  });

  const executionCompletedAt = new Date().toISOString();
  base.executionCompletedAt = executionCompletedAt;
  base.durationMs = Date.now() - startMs;
  base.exitCode = verifyResult.status ?? 1;
  base.executionObserved = true;

  let parsedVerify = null;
  const stdout = (verifyResult.stdout ?? '').trim();
  for (const line of stdout.split('\n').filter(Boolean).reverse()) {
    try {
      parsedVerify = JSON.parse(line);
      break;
    } catch {
      /* try previous */
    }
  }

  if (parsedVerify) {
    base.passCount = parsedVerify.passCount ?? 0;
    base.failCount = parsedVerify.failCount ?? 0;
    base.skippedCount = parsedVerify.skippedCount ?? 0;
    base.testsExecuted = parsedVerify.testsExecuted ?? 0;
    base.checksExecuted = parsedVerify.checksExecuted ?? 0;
    base.verificationSucceeded =
      parsedVerify.verificationSucceeded === true && base.exitCode === 0;
  } else {
    base.failCount = 1;
    base.verificationSucceeded = false;
    base.firstBrokenVerificationLink = 'execution→results';
  }

  if (!base.commandDetected) base.firstBrokenVerificationLink = 'preview→command';
  else if (!base.executionObserved) base.firstBrokenVerificationLink = 'command→execution';
  else if (base.passCount === 0 && base.failCount === 0) base.firstBrokenVerificationLink = 'execution→results';
  else if (!base.verificationSucceeded) base.firstBrokenVerificationLink = 'results→success';
  else base.firstBrokenVerificationLink = null;

  if (base.verificationSucceeded && base.executionObserved && base.commandDetected) {
    base.proofLevel = 'PROVEN';
  } else if (base.executionAttempted) {
    base.proofLevel = 'PARTIAL';
  }

  try {
    await killChildProcessTree(child);
  } catch {
    /* ignore */
  }

  process.stdout.write(`${JSON.stringify(base)}\n`);
}

main().catch((err) => {
  process.stdout.write(
    `${JSON.stringify({
      executionAttempted: true,
      proofLevel: 'NOT_PROVEN',
      error: err instanceof Error ? err.message : String(err),
    })}\n`,
  );
  process.exit(1);
});

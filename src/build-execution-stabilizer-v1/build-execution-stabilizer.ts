/**
 * Build Execution Stabilizer V1 — stabilizer.
 *
 * The only two "engines" this module contains:
 *
 *  - runMonitoredCommand: spawn a child process (npm install, npm build, …), heartbeat on real
 *    stdout/stderr activity, detect a stall when no activity arrives within the configured
 *    window, and allow exactly one retry of the same command before failing.
 *
 *  - runMonitoredPoll: repeatedly call a host-provided readiness check (e.g. "is the preview
 *    server responding yet?"), heartbeat on each attempt, detect a stall when readiness never
 *    arrives within the configured window, and allow exactly one host-provided recovery action
 *    before failing.
 *
 * Both are intentionally small, bounded, and free of any planning/generation logic — they only
 * watch execution that is already happening.
 */

import type { ChildProcess } from 'node:child_process';
import { spawn as nodeSpawn } from 'node:child_process';

import type { BuildExecutionRecoveryAttempt, BuildExecutionStageName, BuildExecutionStageStallConfig } from './build-execution-types.js';
import type { BuildExecutionMonitor } from './build-execution-monitor.js';
import { resolveStageConfig } from './build-execution-timeouts.js';
import { deriveHeartbeatMessage } from './build-execution-heartbeat.js';
import { attemptStageRecovery, type BuildExecutionRecoveryHost } from './build-execution-recovery.js';

export interface MonitoredCommandResult {
  ok: boolean;
  detail: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  recovered: boolean;
  recoveryAttempt: BuildExecutionRecoveryAttempt | null;
}

type SpawnFn = (command: string, args: string[], options: { cwd: string }) => ChildProcess;

export interface MonitoredCommandInput {
  stage: BuildExecutionStageName;
  command: string;
  args: string[];
  cwd: string;
  monitor: BuildExecutionMonitor;
  stallConfig?: Partial<BuildExecutionStageStallConfig>;
  pollIntervalMs?: number;
  recoveryHost?: BuildExecutionRecoveryHost;
  spawnFn?: SpawnFn;
  maxOutputPreview?: number;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

async function attemptSpawn(
  input: MonitoredCommandInput,
  config: BuildExecutionStageStallConfig,
): Promise<{ ok: boolean; stalled: boolean; detail: string; stdout: string; stderr: string; exitCode: number | null }> {
  const spawnFn = input.spawnFn ?? (nodeSpawn as unknown as SpawnFn);
  const pollIntervalMs = input.pollIntervalMs ?? Math.max(10, Math.floor(config.stallTimeoutMs / 10));
  const maxOutputPreview = input.maxOutputPreview ?? 4000;

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let lastActivity = Date.now();
    let settled = false;
    let stdoutBuf = '';
    let stderrBuf = '';

    const child = spawnFn(input.command, input.args, { cwd: input.cwd });

    function onChunk(target: 'stdout' | 'stderr', chunk: Buffer | string) {
      const text = chunk.toString();
      if (target === 'stdout') stdoutBuf = truncate(stdoutBuf + text, maxOutputPreview);
      else stderrBuf = truncate(stderrBuf + text, maxOutputPreview);
      lastActivity = Date.now();
      input.monitor.heartbeat(input.stage, deriveHeartbeatMessage(input.stage, text, Date.now() - startedAt));
    }

    child.stdout?.on('data', (d: Buffer) => onChunk('stdout', d));
    child.stderr?.on('data', (d: Buffer) => onChunk('stderr', d));

    const poller = setInterval(() => {
      const now = Date.now();
      if (now - startedAt > config.totalTimeoutMs) {
        finish(false, true, `Exceeded the ${Math.round(config.totalTimeoutMs / 1000)}s time budget for this stage.`);
        return;
      }
      if (now - lastActivity > config.stallTimeoutMs) {
        finish(false, true, `No activity received for over ${Math.round(config.stallTimeoutMs / 1000)}s.`);
      }
    }, pollIntervalMs);

    child.on('exit', (code: number | null) => {
      finish(code === 0, false, code === 0 ? 'Command completed successfully.' : `Command exited with code ${code}.`);
    });
    child.on('error', (err: Error) => {
      finish(false, false, err.message);
    });

    function finish(ok: boolean, stalled: boolean, detail: string) {
      if (settled) return;
      settled = true;
      clearInterval(poller);
      if (stalled) {
        try {
          child.kill?.();
        } catch {
          /* best-effort */
        }
      }
      resolve({ ok, stalled, detail, stdout: stdoutBuf, stderr: stderrBuf, exitCode: null });
    }
  });
}

/**
 * Runs a command under observation. On stall or non-zero exit, attempts exactly one recovery
 * (re-running the same command once, or via a host-provided recovery callback for the stage).
 */
export async function runMonitoredCommand(input: MonitoredCommandInput): Promise<MonitoredCommandResult> {
  const config = resolveStageConfig(input.stage, input.stallConfig);
  input.monitor.startStage(input.stage, `${input.command} ${input.args.join(' ')}`.trim());

  const first = await attemptSpawn(input, config);
  if (first.ok) {
    input.monitor.completeStage(input.stage, first.detail);
    return { ok: true, detail: first.detail, stdout: first.stdout, stderr: first.stderr, exitCode: first.exitCode, recovered: false, recoveryAttempt: null };
  }

  if (first.stalled) {
    input.monitor.markStall(input.stage, first.detail);
  } else {
    input.monitor.failStage(input.stage, first.detail);
  }

  if (!input.recoveryHost || input.monitor.hasAttemptedRecovery(input.stage)) {
    return { ok: false, detail: first.detail, stdout: first.stdout, stderr: first.stderr, exitCode: first.exitCode, recovered: false, recoveryAttempt: null };
  }

  const recoveryAttempt = await attemptStageRecovery(input.stage, input.recoveryHost, input.monitor);
  if (!recoveryAttempt || !recoveryAttempt.succeeded) {
    return {
      ok: false,
      detail: recoveryAttempt ? recoveryAttempt.detail : first.detail,
      stdout: first.stdout,
      stderr: first.stderr,
      exitCode: first.exitCode,
      recovered: false,
      recoveryAttempt,
    };
  }

  input.monitor.startStage(input.stage, `${input.command} ${input.args.join(' ')} (retry after recovery)`.trim());
  const second = await attemptSpawn(input, config);
  if (second.ok) {
    input.monitor.completeStage(input.stage, second.detail);
  } else {
    input.monitor.failStage(input.stage, second.detail);
  }

  return {
    ok: second.ok,
    detail: second.detail,
    stdout: second.stdout,
    stderr: second.stderr,
    exitCode: second.exitCode,
    recovered: second.ok,
    recoveryAttempt,
  };
}

export interface MonitoredPollInput {
  stage: BuildExecutionStageName;
  monitor: BuildExecutionMonitor;
  stallConfig?: Partial<BuildExecutionStageStallConfig>;
  pollIntervalMs?: number;
  checkReady: () => Promise<{ ready: boolean; detail?: string }>;
  recoveryHost?: BuildExecutionRecoveryHost;
  recoveryActionKind?: 'RESTART_PREVIEW_SERVER' | 'RECREATE_PREVIEW_PROCESS' | 'RETRY_DEV_SERVER_STARTUP' | 'RETRY_FILESYSTEM_WATCHER';
}

export interface MonitoredPollResult {
  ok: boolean;
  detail: string;
  recovered: boolean;
  recoveryAttempt: BuildExecutionRecoveryAttempt | null;
}

async function pollOnce(input: MonitoredPollInput, config: BuildExecutionStageStallConfig): Promise<{ ok: boolean; detail: string }> {
  const pollIntervalMs = input.pollIntervalMs ?? Math.max(10, Math.floor(config.stallTimeoutMs / 10));
  const startedAt = Date.now();

  while (Date.now() - startedAt <= config.totalTimeoutMs) {
    const result = await input.checkReady();
    const elapsedMs = Date.now() - startedAt;
    input.monitor.heartbeat(input.stage, deriveHeartbeatMessage(input.stage, result.detail ?? null, elapsedMs));
    if (result.ready) {
      return { ok: true, detail: result.detail ?? 'Ready.' };
    }
    if (elapsedMs > config.stallTimeoutMs) {
      return { ok: false, detail: result.detail ?? `No readiness signal for over ${Math.round(config.stallTimeoutMs / 1000)}s.` };
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  return { ok: false, detail: `Exceeded the ${Math.round(config.totalTimeoutMs / 1000)}s time budget waiting for readiness.` };
}

/** Polls a host-provided readiness check (e.g. preview server up) with heartbeat + one recovery. */
export async function runMonitoredPoll(input: MonitoredPollInput): Promise<MonitoredPollResult> {
  const config = resolveStageConfig(input.stage, input.stallConfig);
  input.monitor.startStage(input.stage);

  const first = await pollOnce(input, config);
  if (first.ok) {
    input.monitor.completeStage(input.stage, first.detail);
    return { ok: true, detail: first.detail, recovered: false, recoveryAttempt: null };
  }

  input.monitor.markStall(input.stage, first.detail);

  if (!input.recoveryHost || input.monitor.hasAttemptedRecovery(input.stage)) {
    input.monitor.failStage(input.stage, first.detail);
    return { ok: false, detail: first.detail, recovered: false, recoveryAttempt: null };
  }

  const recoveryAttempt = await attemptStageRecovery(input.stage, input.recoveryHost, input.monitor, input.recoveryActionKind ?? 'RESTART_PREVIEW_SERVER');
  if (!recoveryAttempt || !recoveryAttempt.succeeded) {
    return { ok: false, detail: recoveryAttempt ? recoveryAttempt.detail : first.detail, recovered: false, recoveryAttempt };
  }

  input.monitor.startStage(input.stage, 'retry after recovery');
  const second = await pollOnce(input, config);
  if (second.ok) {
    input.monitor.completeStage(input.stage, second.detail);
  } else {
    input.monitor.failStage(input.stage, second.detail);
  }

  return { ok: second.ok, detail: second.detail, recovered: second.ok, recoveryAttempt };
}

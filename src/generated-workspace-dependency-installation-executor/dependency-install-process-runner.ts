/**
 * Dependency install process runner — bounded spawn, no shell (Phase 26.79).
 */

import { spawnSync } from 'node:child_process';
import {
  DEPENDENCY_INSTALL_TIMEOUT_MS,
  MAX_INSTALL_LOG_LINES,
  MAX_INSTALL_OUTPUT_CHARS,
} from './generated-workspace-dependency-installation-executor-registry.js';
import { resolveInstallSpawnTarget } from './dependency-install-command-builder.js';
import type {
  DependencyInstallProcessResult,
  ParsedInstallCommand,
} from './generated-workspace-dependency-installation-executor-types.js';

function truncateOutput(text: string): string {
  if (text.length <= MAX_INSTALL_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_INSTALL_OUTPUT_CHARS)}… [truncated]`;
}

function splitLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_INSTALL_LOG_LINES);
}

export function runDependencyInstallProcess(input: {
  parsed: ParsedInstallCommand;
  cwdAbs: string;
  dryRun: boolean;
}): DependencyInstallProcessResult {
  const attemptedCommand = `${input.parsed.packageManager} ${input.parsed.args.join(' ')}`.trim();

  if (input.dryRun) {
    const spawnTarget = resolveInstallSpawnTarget(input.parsed);
    return {
      readOnly: true,
      executed: false,
      dryRun: true,
      attemptedCommand,
      executable: spawnTarget.executable,
      args: spawnTarget.args,
      cwd: input.cwdAbs,
      exitCode: null,
      stdout: [],
      stderr: [],
      installLogs: [`DRY_RUN: would run ${spawnTarget.spawnDescription} in ${input.cwdAbs}`],
      elapsedMs: 0,
      timedOut: false,
      cleanupStatus: 'NOT_STARTED',
      processId: null,
      installSucceeded: false,
      failureReason: null,
    };
  }

  const spawnTarget = resolveInstallSpawnTarget(input.parsed);
  const startMs = Date.now();
  const result = spawnSync(spawnTarget.executable, [...spawnTarget.args], {
    cwd: input.cwdAbs,
    encoding: 'utf8',
    shell: false,
    timeout: DEPENDENCY_INSTALL_TIMEOUT_MS,
    windowsHide: true,
    maxBuffer: MAX_INSTALL_OUTPUT_CHARS * 2,
  });

  const elapsedMs = Date.now() - startMs;
  const timedOut = result.error?.message?.includes('ETIMEDOUT') ?? false;
  const stdoutText = truncateOutput(result.stdout ?? '');
  const stderrText = truncateOutput(result.stderr ?? '');
  const stdout = splitLines(stdoutText);
  const stderr = splitLines(stderrText);
  const installLogs = [...stdout, ...stderr].slice(0, MAX_INSTALL_LOG_LINES);
  const spawnFailed = Boolean(result.error);
  const exitCode = timedOut || spawnFailed ? null : (result.status ?? 1);
  const installSucceeded = !timedOut && !spawnFailed && result.status === 0;

  let failureReason: string | null = null;
  if (timedOut) {
    failureReason = `Install timed out after ${DEPENDENCY_INSTALL_TIMEOUT_MS}ms — process killed.`;
  } else if (result.error) {
    failureReason = result.error.message;
  } else if (result.status !== 0) {
    failureReason = stderr[stderr.length - 1] ?? stdout[stdout.length - 1] ?? `Install exited with code ${result.status}`;
  }

  return {
    readOnly: true,
    executed: true,
    dryRun: false,
    attemptedCommand,
    executable: spawnTarget.executable,
    args: spawnTarget.args,
    cwd: input.cwdAbs,
    exitCode,
    stdout,
    stderr,
    installLogs,
    elapsedMs,
    timedOut,
    cleanupStatus: timedOut ? 'CLEANED' : 'CLEANED',
    processId: result.pid ?? null,
    installSucceeded,
    failureReason,
  };
}

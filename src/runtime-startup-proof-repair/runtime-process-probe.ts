/**
 * Runtime process probe — bounded startup proof with cleanup (Phase 26.77).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import {
  MAX_STARTUP_LOG_LINES,
  RUNTIME_STARTUP_PROBE_TIMEOUT_MS,
} from './runtime-startup-proof-repair-registry.js';
import type { ResolvedStartupCommand, RuntimeStartupProbeResult } from './runtime-startup-proof-repair-types.js';

const PROBE_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'runtime-startup-probe.mjs');

interface RawProbeOutput {
  attemptedCommand?: string | null;
  cwd?: string;
  expectedPort?: number;
  processStarted?: boolean;
  portBound?: boolean;
  firstResponseStatus?: number | null;
  startupLogs?: string[];
  fatalErrors?: string[];
  elapsedMs?: number;
  timedOut?: boolean;
  cleanupStatus?: 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';
  processId?: string | null;
  healthResponded?: boolean;
  applicationBoots?: boolean;
}

function parseProbeStdout(stdout: string): RawProbeOutput | null {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return reconcileStartupProbeVerdict(JSON.parse(lines[i]!) as RawProbeOutput);
    } catch {
      // try previous
    }
  }
  return null;
}

export function isSuccessfulHealthResponse(firstResponseStatus: number | null | undefined): boolean {
  return (
    firstResponseStatus !== null &&
    firstResponseStatus !== undefined &&
    firstResponseStatus >= 200 &&
    firstResponseStatus < 400
  );
}

/** Health-success overrides false-positive RUNTIME_CRASH / PORT_CONFLICT after proof (Phase 26.82). */
export function reconcileStartupProbeVerdict(parsed: RawProbeOutput): RawProbeOutput {
  const healthSuccess =
    parsed.processStarted === true &&
    parsed.timedOut !== true &&
    parsed.healthResponded === true &&
    isSuccessfulHealthResponse(parsed.firstResponseStatus ?? null);

  if (!healthSuccess) {
    return parsed;
  }

  const fatalErrors = (parsed.fatalErrors ?? []).filter(
    (e) => !e.includes('RUNTIME_CRASH') && !e.startsWith('PORT_CONFLICT'),
  );

  return {
    ...parsed,
    fatalErrors,
    applicationBoots: true,
  };
}

export function probeRuntimeStartup(input: {
  rootDir: string;
  resolved: ResolvedStartupCommand;
  workspaceId: string;
  skipProbe?: boolean;
}): RuntimeStartupProbeResult {
  const empty: RuntimeStartupProbeResult = {
    readOnly: true,
    attemptedCommand: input.resolved.command,
    cwd: input.resolved.cwd,
    expectedPort: input.resolved.expectedPort,
    processStarted: false,
    portBound: false,
    firstResponseStatus: null,
    startupLogs: [],
    fatalErrors: input.resolved.resolved ? [] : ['NO_START_COMMAND: command not resolved'],
    elapsedMs: 0,
    timedOut: false,
    cleanupStatus: 'NOT_STARTED',
    processId: null,
    healthResponded: false,
    applicationBoots: false,
  };

  if (input.skipProbe || !input.resolved.resolved || !input.resolved.command) {
    return empty;
  }

  const cwdAbs = resolve(input.rootDir, input.resolved.cwd);
  if (!isPathUnderGeneratedBuilderWorkspaces(input.rootDir, cwdAbs)) {
    return {
      ...empty,
      fatalErrors: ['WRONG_WORKSPACE_CWD: probe refused outside .generated-builder-workspaces/'],
    };
  }

  if (!existsSync(PROBE_SCRIPT)) {
    return {
      ...empty,
      fatalErrors: ['probe script missing'],
    };
  }

  const result = spawnSync(
    process.execPath,
    [
      PROBE_SCRIPT,
      cwdAbs,
      String(input.resolved.expectedPort),
      input.workspaceId,
      input.resolved.command,
    ],
    {
      cwd: input.rootDir,
      env: {
        ...process.env,
        RUNTIME_STARTUP_PROBE_TIMEOUT_MS: String(RUNTIME_STARTUP_PROBE_TIMEOUT_MS),
      },
      encoding: 'utf8',
      timeout: RUNTIME_STARTUP_PROBE_TIMEOUT_MS + 4_000,
      windowsHide: true,
    },
  );

  const parsed = parseProbeStdout(result.stdout ?? '');
  if (!parsed) {
    return {
      ...empty,
      fatalErrors: [
        result.error?.message ?? 'probe produced no parseable output',
        ...(result.stderr ? [result.stderr.slice(0, 200)] : []),
      ],
      elapsedMs: RUNTIME_STARTUP_PROBE_TIMEOUT_MS,
      timedOut: result.error?.message?.includes('ETIMEDOUT') ?? false,
    };
  }

  return {
    readOnly: true,
    attemptedCommand: parsed.attemptedCommand ?? input.resolved.command,
    cwd: parsed.cwd ?? input.resolved.cwd,
    expectedPort: parsed.expectedPort ?? input.resolved.expectedPort,
    processStarted: parsed.processStarted ?? false,
    portBound: parsed.portBound ?? false,
    firstResponseStatus: parsed.firstResponseStatus ?? null,
    startupLogs: (parsed.startupLogs ?? []).slice(0, MAX_STARTUP_LOG_LINES),
    fatalErrors: parsed.fatalErrors ?? [],
    elapsedMs: parsed.elapsedMs ?? 0,
    timedOut: parsed.timedOut ?? false,
    cleanupStatus: parsed.cleanupStatus ?? 'NOT_STARTED',
    processId: parsed.processId ?? null,
    healthResponded: parsed.healthResponded ?? false,
    applicationBoots: parsed.applicationBoots ?? false,
  };
}

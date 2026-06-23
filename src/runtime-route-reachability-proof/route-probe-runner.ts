/**
 * Route probe runner — bounded HTTP route checks after startup proof (Phase 26.83).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import {
  ROUTE_PROBE_TIMEOUT_MS,
  ROUTE_PROBE_REQUEST_TIMEOUT_MS,
} from './runtime-route-reachability-proof-registry.js';
import type {
  DiscoveredRoute,
  RouteProbeResult,
  RouteProbeSessionResult,
  RouteProbeVerdict,
} from './runtime-route-reachability-proof-types.js';
import type { ResolvedStartupCommand } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

const SESSION_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'route-probe-session.mjs');

interface RawProbeResult {
  routePath?: string;
  statusCode?: number | null;
  responded?: boolean;
  responseType?: string;
  bodyExcerpt?: string | null;
  elapsedMs?: number;
  verdict?: string;
}

interface RawSessionOutput {
  baseUrl?: string | null;
  port?: number | null;
  probeResults?: RawProbeResult[];
  runtimeBootedBeforeProbe?: boolean;
  probeSkipped?: boolean;
  skipReason?: string | null;
  cleanupStatus?: 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';
  elapsedMs?: number;
  fatalErrors?: string[];
}

function normalizeVerdict(value: string | undefined): RouteProbeVerdict {
  switch (value) {
    case 'SUCCESS':
    case 'NOT_FOUND':
    case 'SERVER_ERROR':
    case 'TIMEOUT':
    case 'NO_RESPONSE':
    case 'SKIPPED':
      return value;
    default:
      return 'NO_RESPONSE';
  }
}

function normalizeProbeResult(raw: RawProbeResult): RouteProbeResult {
  return {
    readOnly: true,
    routePath: raw.routePath ?? '/',
    statusCode: raw.statusCode ?? null,
    responded: raw.responded === true,
    responseType:
      raw.responseType === 'json' ||
      raw.responseType === 'html' ||
      raw.responseType === 'text' ||
      raw.responseType === 'none'
        ? raw.responseType
        : 'unknown',
    bodyExcerpt: raw.bodyExcerpt ?? null,
    elapsedMs: raw.elapsedMs ?? 0,
    verdict: normalizeVerdict(raw.verdict),
  };
}

function parseSessionStdout(stdout: string): RawSessionOutput | null {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]!) as RawSessionOutput;
    } catch {
      // try previous
    }
  }
  return null;
}

function emptySession(input: {
  runtimeBootedBeforeProbe: boolean;
  skipReason: string;
}): RouteProbeSessionResult {
  return {
    readOnly: true,
    baseUrl: null,
    port: null,
    probeResults: [],
    runtimeBootedBeforeProbe: input.runtimeBootedBeforeProbe,
    probeSkipped: true,
    skipReason: input.skipReason,
    cleanupStatus: 'NOT_STARTED',
    elapsedMs: 0,
    fatalErrors: [input.skipReason],
  };
}

export function runRouteProbeSession(input: {
  rootDir: string;
  workspaceId: string;
  resolved: ResolvedStartupCommand;
  discoveredRoutes: readonly DiscoveredRoute[];
  applicationBootsBeforeProbe: boolean;
  skipProbe?: boolean;
}): RouteProbeSessionResult {
  if (!input.applicationBootsBeforeProbe) {
    return emptySession({
      runtimeBootedBeforeProbe: false,
      skipReason: 'RUNTIME_NOT_BOOTED: route probe refused until applicationBoots=true',
    });
  }

  if (input.skipProbe) {
    return emptySession({
      runtimeBootedBeforeProbe: true,
      skipReason: 'PROBE_SKIPPED_BY_CALLER',
    });
  }

  if (!input.resolved.resolved || !input.resolved.command) {
    return emptySession({
      runtimeBootedBeforeProbe: true,
      skipReason: 'NO_START_COMMAND',
    });
  }

  const cwdAbs = resolve(input.rootDir, input.resolved.cwd);
  if (!isPathUnderGeneratedBuilderWorkspaces(input.rootDir, cwdAbs)) {
    return emptySession({
      runtimeBootedBeforeProbe: true,
      skipReason: 'WRONG_WORKSPACE_CWD: route probe refused outside .generated-builder-workspaces/',
    });
  }

  if (!existsSync(SESSION_SCRIPT)) {
    return emptySession({
      runtimeBootedBeforeProbe: true,
      skipReason: 'route probe session script missing',
    });
  }

  const routePaths = [...new Set(input.discoveredRoutes.map((r) => r.path))];
  const result = spawnSync(
    process.execPath,
    [
      SESSION_SCRIPT,
      cwdAbs,
      String(input.resolved.expectedPort),
      input.workspaceId,
      input.resolved.command,
      JSON.stringify(routePaths),
    ],
    {
      encoding: 'utf8',
      timeout: ROUTE_PROBE_TIMEOUT_MS + 2000,
      env: {
        ...process.env,
        APPLICATION_BOOTS: 'true',
        ROUTE_PROBE_TIMEOUT_MS: String(ROUTE_PROBE_TIMEOUT_MS),
        ROUTE_PROBE_REQUEST_TIMEOUT_MS: String(ROUTE_PROBE_REQUEST_TIMEOUT_MS),
      },
      windowsHide: true,
    },
  );

  const parsed = parseSessionStdout(result.stdout ?? '');
  if (!parsed) {
    return {
      readOnly: true,
      baseUrl: null,
      port: null,
      probeResults: [],
      runtimeBootedBeforeProbe: true,
      probeSkipped: true,
      skipReason: result.error?.message ?? 'route probe session produced no output',
      cleanupStatus: 'NOT_STARTED',
      elapsedMs: 0,
      fatalErrors: [result.stderr?.trim() || 'route probe parse failure'],
    };
  }

  return {
    readOnly: true,
    baseUrl: parsed.baseUrl ?? null,
    port: parsed.port ?? null,
    probeResults: (parsed.probeResults ?? []).map(normalizeProbeResult),
    runtimeBootedBeforeProbe: parsed.runtimeBootedBeforeProbe === true,
    probeSkipped: parsed.probeSkipped === true,
    skipReason: parsed.skipReason ?? null,
    cleanupStatus: parsed.cleanupStatus ?? 'NOT_STARTED',
    elapsedMs: parsed.elapsedMs ?? 0,
    fatalErrors: parsed.fatalErrors ?? [],
  };
}

export function isSuccessfulRouteProbe(probe: RouteProbeResult): boolean {
  return (
    probe.verdict === 'SUCCESS' &&
    probe.statusCode !== null &&
    probe.statusCode >= 200 &&
    probe.statusCode < 400
  );
}

export function isJsonRouteResponse(probe: RouteProbeResult): boolean {
  return probe.responseType === 'json' || (probe.bodyExcerpt?.trim().startsWith('{') ?? false);
}

/**
 * UI render probe runner — bounded HTTP UI checks after route proof (Phase 26.84).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import { analyzeHtmlRender } from './html-render-analyzer.js';
import {
  UI_RENDER_PROBE_TIMEOUT_MS,
  UI_RENDER_PROBE_REQUEST_TIMEOUT_MS,
} from './runtime-ui-render-proof-registry.js';
import type {
  DiscoveredUiRoute,
  UiRenderProbeResult,
  UiRenderProbeSessionResult,
} from './runtime-ui-render-proof-types.js';
import type { ResolvedStartupCommand } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

const SESSION_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'ui-render-probe-session.mjs');

interface RawProbeResult {
  path?: string;
  statusCode?: number | null;
  contentType?: string | null;
  bodyExcerpt?: string | null;
  elapsedMs?: number;
  responded?: boolean;
  timedOut?: boolean;
}

interface RawSessionOutput {
  baseUrl?: string | null;
  port?: number | null;
  probeResults?: RawProbeResult[];
  applicationBootsBeforeProbe?: boolean;
  routesReachableBeforeProbe?: boolean;
  probeSkipped?: boolean;
  skipReason?: string | null;
  cleanupStatus?: 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';
  elapsedMs?: number;
  fatalErrors?: string[];
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
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  skipReason: string;
}): UiRenderProbeSessionResult {
  return {
    readOnly: true,
    baseUrl: null,
    port: null,
    probeResults: [],
    applicationBootsBeforeProbe: input.applicationBootsBeforeProbe,
    routesReachableBeforeProbe: input.routesReachableBeforeProbe,
    probeSkipped: true,
    skipReason: input.skipReason,
    cleanupStatus: 'NOT_STARTED',
    elapsedMs: 0,
    fatalErrors: [input.skipReason],
  };
}

function normalizeProbeResult(raw: RawProbeResult): UiRenderProbeResult {
  return analyzeHtmlRender({
    path: raw.path ?? '/',
    statusCode: raw.statusCode ?? null,
    contentType: raw.contentType ?? null,
    bodyExcerpt: raw.bodyExcerpt ?? null,
    elapsedMs: raw.elapsedMs ?? 0,
    responded: raw.responded !== false,
    timedOut: raw.timedOut === true,
  });
}

export function runUiRenderProbeSession(input: {
  rootDir: string;
  workspaceId: string;
  resolved: ResolvedStartupCommand;
  discoveredUiRoutes: readonly DiscoveredUiRoute[];
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  skipProbe?: boolean;
}): UiRenderProbeSessionResult {
  if (!input.applicationBootsBeforeProbe) {
    return emptySession({
      applicationBootsBeforeProbe: false,
      routesReachableBeforeProbe: input.routesReachableBeforeProbe,
      skipReason: 'RUNTIME_NOT_BOOTED: UI probe refused until applicationBoots=true',
    });
  }

  if (!input.routesReachableBeforeProbe) {
    return emptySession({
      applicationBootsBeforeProbe: true,
      routesReachableBeforeProbe: false,
      skipReason: 'RUNTIME_NOT_ROUTE_READY: UI probe refused until routesReachable=true',
    });
  }

  if (input.skipProbe) {
    return emptySession({
      applicationBootsBeforeProbe: true,
      routesReachableBeforeProbe: true,
      skipReason: 'PROBE_SKIPPED_BY_CALLER',
    });
  }

  if (!input.resolved.resolved || !input.resolved.command) {
    return emptySession({
      applicationBootsBeforeProbe: true,
      routesReachableBeforeProbe: true,
      skipReason: 'NO_START_COMMAND',
    });
  }

  const cwdAbs = resolve(input.rootDir, input.resolved.cwd);
  if (!isPathUnderGeneratedBuilderWorkspaces(input.rootDir, cwdAbs)) {
    return emptySession({
      applicationBootsBeforeProbe: true,
      routesReachableBeforeProbe: true,
      skipReason: 'WRONG_WORKSPACE_CWD: UI probe refused outside .generated-builder-workspaces/',
    });
  }

  if (!existsSync(SESSION_SCRIPT)) {
    return emptySession({
      applicationBootsBeforeProbe: true,
      routesReachableBeforeProbe: true,
      skipReason: 'UI render probe session script missing',
    });
  }

  const routePaths = [...new Set(input.discoveredUiRoutes.map((r) => r.path))];
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
      timeout: UI_RENDER_PROBE_TIMEOUT_MS + 2000,
      env: {
        ...process.env,
        APPLICATION_BOOTS: 'true',
        ROUTES_REACHABLE: 'true',
        UI_RENDER_PROBE_TIMEOUT_MS: String(UI_RENDER_PROBE_TIMEOUT_MS),
        UI_RENDER_PROBE_REQUEST_TIMEOUT_MS: String(UI_RENDER_PROBE_REQUEST_TIMEOUT_MS),
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
      applicationBootsBeforeProbe: true,
      routesReachableBeforeProbe: true,
      probeSkipped: true,
      skipReason: result.error?.message ?? 'UI render probe session produced no output',
      cleanupStatus: 'NOT_STARTED',
      elapsedMs: 0,
      fatalErrors: [result.stderr?.trim() || 'UI render probe parse failure'],
    };
  }

  return {
    readOnly: true,
    baseUrl: parsed.baseUrl ?? null,
    port: parsed.port ?? null,
    probeResults: (parsed.probeResults ?? []).map(normalizeProbeResult),
    applicationBootsBeforeProbe: parsed.applicationBootsBeforeProbe === true,
    routesReachableBeforeProbe: parsed.routesReachableBeforeProbe === true,
    probeSkipped: parsed.probeSkipped === true,
    skipReason: parsed.skipReason ?? null,
    cleanupStatus: parsed.cleanupStatus ?? 'NOT_STARTED',
    elapsedMs: parsed.elapsedMs ?? 0,
    fatalErrors: parsed.fatalErrors ?? [],
  };
}

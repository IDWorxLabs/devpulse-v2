/**
 * Manages long-running Vite dev servers for generated workspaces (multi-project).
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import {
  killChildProcessTree,
  killProcessesByPort,
  resolveViteDevSpawnTarget,
  settleEventLoop,
} from './child-process-teardown.js';
import { getActiveProjectId } from './workspace-tab-registry.js';
import { parseViteDevServerUrl, summarizeDevServerStartupFailure } from './vite-dev-server-output.js';
import { ensurePreviewReadinessHandshake } from '../end-to-end-build-reality-engine-v1/preview-readiness-contract.js';
import { stampPreviewWorkspaceIdentity } from '../end-to-end-build-reality-engine-v1/preview-workspace-identity.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';

/**
 * Resolve the workspace hash used for preview identity BEFORE Vite starts.
 * Must match `contract-expectation-extractor` hashing so FALSE_SUCCESS_SCAN does not
 * treat a working preview as stale. Never invent `pre-vite-*` placeholders — those
 * poison meta tags and fail hash alignment against the real expectation hash.
 */
function resolvePreviewWorkspaceHash(workspaceDir: string): string {
  try {
    const manifestPath = join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { workspaceHash?: string };
      const hash = typeof manifest.workspaceHash === 'string' ? manifest.workspaceHash.trim() : '';
      if (hash && !hash.startsWith('pre-vite-')) return hash;
    }
  } catch {
    // Fall through to path fingerprint.
  }
  return createHash('sha256').update(workspaceDir).digest('hex');
}

function ensureHandshakeBeforeVite(workspaceDir: string, projectId: string): void {
  const workspaceHash = resolvePreviewWorkspaceHash(workspaceDir);
  const stamped = stampPreviewWorkspaceIdentity({ workspaceDir, workspaceHash, projectId });
  if (!stamped) {
    ensurePreviewReadinessHandshake({ workspaceDir, projectId, workspaceHash });
  }
}

export interface GeneratedDevServerState {
  child: ChildProcess;
  port: number;
  url: string;
  projectId: string;
  workspaceDir: string;
  startedAt: number;
}

const devServers = new Map<string, GeneratedDevServerState>();
const pendingStartupByKey = new Map<string, ChildProcess>();
const stopInFlightByKey = new Map<string, Promise<void>>();

function serverKey(projectId: string, workspaceDir: string): string {
  return `${projectId}|${workspaceDir.replace(/\\/g, '/')}`;
}

function isChildRunning(child: ChildProcess | undefined): boolean {
  return Boolean(child && child.exitCode === null && child.signalCode === null);
}

export async function resetGeneratedDevServerManagerForTests(): Promise<void> {
  await stopAllGeneratedDevServers();
}

export function stopActiveGeneratedDevServer(): void {
  void stopAllGeneratedDevServers();
}

export async function stopActiveGeneratedDevServerAsync(): Promise<void> {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) {
    await stopAllGeneratedDevServers();
    return;
  }
  const keys = [...devServers.keys()].filter((key) => key.startsWith(`${activeProjectId}|`));
  await Promise.all(keys.map((key) => stopGeneratedDevServerByKey(key)));
}

export async function stopAllGeneratedDevServers(): Promise<void> {
  const keys = [...new Set([...devServers.keys(), ...pendingStartupByKey.keys()])];
  await Promise.all(keys.map((key) => stopGeneratedDevServerByKey(key)));
  await settleEventLoop();
}

export async function stopGeneratedDevServersForProject(projectId: string): Promise<number> {
  const keys = [...new Set([...devServers.keys(), ...pendingStartupByKey.keys()])].filter((key) =>
    key.startsWith(`${projectId}|`),
  );
  await Promise.all(keys.map((key) => stopGeneratedDevServerByKey(key)));
  return keys.length;
}

async function stopGeneratedDevServerByKey(key: string): Promise<void> {
  const inFlight = stopInFlightByKey.get(key);
  if (inFlight) {
    await inFlight;
    return;
  }

  const stopPromise = (async () => {
    const state = devServers.get(key);
    const pending = pendingStartupByKey.get(key);
    devServers.delete(key);
    pendingStartupByKey.delete(key);
    const child = state?.child ?? pending;
    if (child) {
      await killChildProcessTree(child);
      if (state?.port) {
        await killProcessesByPort(state.port);
      }
      await settleEventLoop();
    }
  })().finally(() => {
    stopInFlightByKey.delete(key);
  });

  stopInFlightByKey.set(key, stopPromise);
  await stopPromise;
}

export function getActiveGeneratedDevServerState(): GeneratedDevServerState | null {
  const activeProjectId = getActiveProjectId();
  if (activeProjectId) {
    for (const [key, state] of devServers) {
      if (key.startsWith(`${activeProjectId}|`) && isChildRunning(state.child)) {
        return state;
      }
    }
  }
  for (const state of devServers.values()) {
    if (isChildRunning(state.child)) return state;
  }
  return null;
}

export function getGeneratedDevServerForProject(
  projectId: string,
  workspaceDir: string,
): GeneratedDevServerState | null {
  const state = devServers.get(serverKey(projectId, workspaceDir));
  if (!state || !isChildRunning(state.child)) return null;
  return state;
}

export function listGeneratedDevServers(): GeneratedDevServerState[] {
  return [...devServers.values()].filter((state) => isChildRunning(state.child));
}

function tryResolveDevServerUrl(stdout: string, stderr: string): { port: number; url: string } | null {
  return parseViteDevServerUrl(`${stdout}\n${stderr}`);
}

function bindStartupListeners(input: {
  key: string;
  child: ChildProcess;
  workspaceDir: string;
  projectId: string;
  timeoutMs: number;
  resolve: (result: { ok: boolean; port?: number; url?: string; error?: string; reused?: boolean }) => void;
}): void {
  let stdout = '';
  let stderr = '';
  let settled = false;

  const finish = (result: { ok: boolean; port?: number; url?: string; error?: string; reused?: boolean }) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);

    if (result.ok) {
      const parsed =
        result.port && result.url
          ? { port: result.port, url: result.url }
          : tryResolveDevServerUrl(stdout, stderr);
      if (!parsed) {
        void cleanupFailedStartup(input.key, input.child).finally(() => {
          input.resolve({ ok: false, error: summarizeDevServerStartupFailure(stdout, stderr) });
        });
        return;
      }
      pendingStartupByKey.delete(input.key);
      devServers.set(input.key, {
        child: input.child,
        port: parsed.port,
        url: parsed.url,
        projectId: input.projectId,
        workspaceDir: input.workspaceDir,
        startedAt: Date.now(),
      });
      input.resolve({ ok: true, port: parsed.port, url: parsed.url, reused: result.reused });
      return;
    }

    void cleanupFailedStartup(input.key, input.child).finally(() => {
      input.resolve(result);
    });
  };

  const timer = setTimeout(() => {
    finish({
      ok: false,
      error: summarizeDevServerStartupFailure(stdout, stderr),
    });
  }, input.timeoutMs);

  const handleOutput = () => {
    const parsed = tryResolveDevServerUrl(stdout, stderr);
    if (!parsed) return;
    finish({ ok: true, port: parsed.port, url: parsed.url });
  };

  input.child.stdout?.on('data', (chunk) => {
    stdout += String(chunk);
    handleOutput();
  });

  input.child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
    handleOutput();
  });

  input.child.on('error', (err) => {
    finish({ ok: false, error: String(err) });
  });

  input.child.on('exit', (code) => {
    if (!settled && code !== 0) {
      finish({
        ok: false,
        error: summarizeDevServerStartupFailure(stdout, stderr),
      });
    }
  });
}

async function cleanupFailedStartup(key: string, child: ChildProcess): Promise<void> {
  pendingStartupByKey.delete(key);
  if (devServers.get(key)?.child === child) {
    devServers.delete(key);
  }
  await killChildProcessTree(child);
  await settleEventLoop();
}

export function startGeneratedAppDevServer(input: {
  workspaceDir: string;
  workspaceId: string;
  timeoutMs?: number;
}): Promise<{ ok: boolean; port?: number; url?: string; error?: string; reused?: boolean }> {
  const key = serverKey(input.workspaceId, input.workspaceDir);
  const existing = devServers.get(key);
  if (existing && isChildRunning(existing.child)) {
    return Promise.resolve({
      ok: true,
      port: existing.port,
      url: existing.url,
      reused: true,
    });
  }

  return new Promise((resolve) => {
    void (async () => {
      if (existing) {
        await stopGeneratedDevServerByKey(key);
      }

      // Stamp hydration handshake BEFORE Vite serves — PREVIEW_AUTHORITY must not race forensic
      // completion, which historically stamped readiness only after the audit already ran.
      ensureHandshakeBeforeVite(input.workspaceDir, input.workspaceId);

      const spawnTarget = resolveViteDevSpawnTarget(input.workspaceDir);
      if (!spawnTarget) {
        resolve({ ok: false, error: 'Generated workspace is missing node_modules/vite/bin/vite.js' });
        return;
      }

      const child = spawn(spawnTarget.executable, spawnTarget.args, {
        cwd: input.workspaceDir,
        env: { ...process.env, BROWSER: 'none' },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      pendingStartupByKey.set(key, child);

      bindStartupListeners({
        key,
        child,
        workspaceDir: input.workspaceDir,
        projectId: input.workspaceId,
        timeoutMs: input.timeoutMs ?? 45_000,
        resolve,
      });
    })();
  });
}

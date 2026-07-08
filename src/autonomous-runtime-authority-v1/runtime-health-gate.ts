/**
 * Autonomous Runtime Authority V1 — post-launch truth and health verification.
 */

import { computeSourceFingerprint } from '../runtime-truth-authority/source-fingerprint.js';
import type {
  RuntimeHealthProbe,
  RuntimeTruthProbe,
  VerifyLaunchedRuntimeInput,
  VerifyLaunchedRuntimeResult,
} from './runtime-authority-types.js';

const HEALTH_ENDPOINTS: ReadonlyArray<{ name: string; path: string; method: 'GET' | 'POST' }> = [
  { name: 'Command Center', path: '/', method: 'GET' },
  { name: 'Brain API', path: '/api/brain/health', method: 'GET' },
  { name: 'Runtime Truth', path: '/api/runtime/truth', method: 'GET' },
  { name: 'Project Registry', path: '/api/projects/registry', method: 'GET' },
  { name: 'Operator Feed Manifest', path: '/api/founder-reality.json', method: 'GET' },
  { name: 'Live Preview', path: '/api/build/live-preview', method: 'GET' },
];

async function probeEndpoint(
  baseUrl: string,
  endpoint: { name: string; path: string; method: 'GET' | 'POST' },
): Promise<RuntimeHealthProbe> {
  try {
    const res = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      cache: 'no-store',
    });
    const ok = res.status >= 200 && res.status < 500;
    return {
      readOnly: true,
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      ok,
      status: res.status,
      error: ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      readOnly: true,
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function probeRuntimeTruth(baseUrl: string): Promise<RuntimeTruthProbe> {
  try {
    const res = await fetch(`${baseUrl}/api/runtime/truth`, { method: 'GET', cache: 'no-store' });
    if (res.status !== 200 && res.status !== 503) {
      return {
        readOnly: true,
        reachable: false,
        httpStatus: res.status,
        sourceFingerprint: null,
        gitCommit: null,
        runtimeId: null,
        startedAt: null,
        fresh: false,
        error: `HTTP ${res.status}`,
      };
    }
    const body = (await res.json()) as {
      sourceFingerprint?: string;
      runtimeIdentity?: { gitCommit?: string | null; runtimeId?: string; startedAt?: string };
      freshness?: { status?: string };
      liveStatus?: { serverAlive?: boolean };
    };
    return {
      readOnly: true,
      reachable: true,
      httpStatus: res.status,
      sourceFingerprint: body.sourceFingerprint ?? null,
      gitCommit: body.runtimeIdentity?.gitCommit ?? null,
      runtimeId: body.runtimeIdentity?.runtimeId ?? null,
      startedAt: body.runtimeIdentity?.startedAt ?? null,
      fresh: body.freshness?.status === 'FRESH',
      error: null,
    };
  } catch (err) {
    return {
      readOnly: true,
      reachable: false,
      httpStatus: 0,
      sourceFingerprint: null,
      gitCommit: null,
      runtimeId: null,
      startedAt: null,
      fresh: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function verifyLaunchedRuntime(
  input: VerifyLaunchedRuntimeInput,
): Promise<VerifyLaunchedRuntimeResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const expectedFingerprint =
    input.expectedSourceFingerprint ?? computeSourceFingerprint(input.repositoryRoot);

  const truthProbe = await probeRuntimeTruth(input.baseUrl);
  if (!truthProbe.reachable) {
    errors.push(`Runtime truth unavailable: ${truthProbe.error ?? 'unreachable'}`);
  } else if (!truthProbe.fresh) {
    warnings.push('Runtime truth reports STALE freshness');
  }
  if (
    truthProbe.sourceFingerprint &&
    expectedFingerprint &&
    truthProbe.sourceFingerprint !== expectedFingerprint
  ) {
    warnings.push('Runtime source fingerprint differs from working tree');
  }

  const healthProbes: RuntimeHealthProbe[] = [];
  for (const endpoint of HEALTH_ENDPOINTS) {
    const probe = await probeEndpoint(input.baseUrl, endpoint);
    healthProbes.push(probe);
      if (!probe.ok) {
      if (endpoint.name === 'Live Preview' && (probe.status === 404 || probe.status === 500)) {
        warnings.push(`${endpoint.name} degraded (${probe.path}): ${probe.error ?? probe.status}`);
      } else {
        errors.push(`${endpoint.name} failed (${probe.path}): ${probe.error ?? probe.status}`);
      }
    }
  }

  const brainProbe = healthProbes.find((probe) => probe.path === '/api/brain/health');
  if (brainProbe?.ok) {
    try {
      const res = await fetch(`${input.baseUrl}/api/brain/health`, { cache: 'no-store' });
      const body = (await res.json()) as { runtimeReady?: boolean; registryLoaded?: boolean };
      if (!body.runtimeReady) errors.push('Brain health runtimeReady=false');
      if (!body.registryLoaded) errors.push('Brain health registryLoaded=false');
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    readOnly: true,
    ok: errors.length === 0,
    truthProbe,
    healthProbes,
    errors,
    warnings,
  };
}

export async function waitForRuntimeReady(
  input: VerifyLaunchedRuntimeInput & { pollIntervalMs?: number },
): Promise<VerifyLaunchedRuntimeResult> {
  const timeoutMs = input.timeoutMs ?? 30_000;
  const pollIntervalMs = input.pollIntervalMs ?? 500;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const result = await verifyLaunchedRuntime(input);
    if (result.ok) return result;
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return verifyLaunchedRuntime(input);
}

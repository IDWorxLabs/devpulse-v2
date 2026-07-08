/**
 * Runtime Truth Authority V1 — stale runtime detection.
 */

import { computeSourceFingerprint, resolveLatestSourceFingerprintTimestamp } from './source-fingerprint.js';
import { getMissingRequiredRouteContracts } from './route-contract-registry.js';
import { getRuntimeIdentity } from './runtime-identity.js';
import type { RuntimeFreshness, RuntimeTruthFreshness } from './rta-types.js';

export interface StaleRuntimeDetectionInput {
  rootDir: string;
  expectedGitCommit?: string | null;
  expectedSourceFingerprint?: string | null;
  browserRuntimeId?: string | null;
  browserContractVersion?: string | null;
  serverContractVersion: string;
}

export function detectStaleRuntime(input: StaleRuntimeDetectionInput): RuntimeTruthFreshness {
  const reasons: string[] = [];
  const identity = getRuntimeIdentity();
  const currentDiskFingerprint = computeSourceFingerprint(input.rootDir);
  const latestSourceMtime = resolveLatestSourceFingerprintTimestamp(input.rootDir);

  if (!identity) {
    return { status: 'UNKNOWN', reasons: ['runtime identity not initialized'] };
  }

  if (identity.sourceFingerprint !== currentDiskFingerprint) {
    reasons.push('runtime sourceFingerprint differs from current disk fingerprint');
  }

  if (input.expectedSourceFingerprint && identity.sourceFingerprint !== input.expectedSourceFingerprint) {
    reasons.push('runtime sourceFingerprint differs from expected validator fingerprint');
  }

  if (input.expectedGitCommit && identity.gitCommit && input.expectedGitCommit !== identity.gitCommit) {
    reasons.push('runtime gitCommit differs from current working tree commit');
  }

  const missingRoutes = getMissingRequiredRouteContracts();
  if (missingRoutes.length > 0) {
    reasons.push(
      `required route contracts missing at boot: ${missingRoutes
        .map((route) => `${route.method} ${route.path}`)
        .join(', ')}`,
    );
  }

  if (input.browserRuntimeId && input.browserRuntimeId !== identity.runtimeId) {
    reasons.push('browser runtimeId differs from current server runtimeId');
  }

  if (input.browserContractVersion && input.browserContractVersion !== input.serverContractVersion) {
    reasons.push('browser contract version differs from server contract version');
  }

  if (latestSourceMtime !== null) {
    const startedAtMs = Date.parse(identity.startedAt);
    if (!Number.isNaN(startedAtMs) && startedAtMs < latestSourceMtime) {
      reasons.push('server process started before latest authority source file modification');
    }
  }

  const status: RuntimeFreshness = reasons.length === 0 ? 'FRESH' : 'STALE';
  return { status, reasons };
}

export function isStaleRuntimeDetected(input: StaleRuntimeDetectionInput): boolean {
  return detectStaleRuntime(input).status === 'STALE';
}

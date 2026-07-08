/**
 * Runtime Truth Authority V1 — runtime identity created at server boot.
 */

import { randomUUID } from 'node:crypto';
import { computeSourceFingerprint } from './source-fingerprint.js';
import type { RuntimeIdentity } from './rta-types.js';

let currentRuntimeIdentity: RuntimeIdentity | null = null;

export function createRuntimeIdentity(input: {
  rootDir: string;
  port: number;
  packageVersion: string;
  gitCommit: string | null;
  startedAt?: string;
}): RuntimeIdentity {
  const identity: RuntimeIdentity = {
    runtimeId: randomUUID(),
    processPid: process.pid,
    startedAt: input.startedAt ?? new Date().toISOString(),
    port: input.port,
    gitCommit: input.gitCommit,
    sourceFingerprint: computeSourceFingerprint(input.rootDir),
    packageVersion: input.packageVersion,
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
  };
  currentRuntimeIdentity = identity;
  return identity;
}

export function getRuntimeIdentity(): RuntimeIdentity | null {
  return currentRuntimeIdentity ? { ...currentRuntimeIdentity } : null;
}

export function resetRuntimeIdentityForTests(): void {
  currentRuntimeIdentity = null;
}

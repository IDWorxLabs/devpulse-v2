/**
 * Validation Runtime Governance V1 — build output cache (dist / fingerprint).
 */

import { createHash } from 'node:crypto';

export interface BuildCacheEntry {
  workspaceKey: string;
  buildHash: string;
  workspaceFingerprint: string;
  distPath: string;
  cachedAt: number;
  hitCount: number;
}

const buildCache = new Map<string, BuildCacheEntry>();
let cacheHits = 0;
let cacheMisses = 0;

export function resetBuildOutputCacheForTests(): void {
  buildCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

export function computeWorkspaceFingerprint(input: {
  workspaceKey: string;
  inputHashes: readonly string[];
}): string {
  const payload = [input.workspaceKey, ...input.inputHashes].join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function computeBuildHash(distContents: string): string {
  return createHash('sha256').update(distContents).digest('hex').slice(0, 16);
}

export function getBuildOutputCacheStats(): {
  entries: number;
  hitPercent: number;
  hits: number;
  misses: number;
} {
  const total = cacheHits + cacheMisses;
  return {
    entries: buildCache.size,
    hitPercent: total === 0 ? 0 : Math.round((cacheHits / total) * 1000) / 10,
    hits: cacheHits,
    misses: cacheMisses,
  };
}

/**
 * Returns cached dist path when fingerprint matches; otherwise records miss.
 */
export function resolveBuildOutput(input: {
  workspaceKey: string;
  workspaceFingerprint: string;
  distPath: string;
  distContents?: string;
}): { hit: boolean; distPath: string; buildHash: string | null } {
  const key = input.workspaceKey.replace(/\\/g, '/');
  const existing = buildCache.get(key);

  if (existing && existing.workspaceFingerprint === input.workspaceFingerprint) {
    existing.hitCount += 1;
    cacheHits += 1;
    return { hit: true, distPath: existing.distPath, buildHash: existing.buildHash };
  }

  cacheMisses += 1;
  const buildHash = input.distContents
    ? computeBuildHash(input.distContents)
    : computeWorkspaceFingerprint({ workspaceKey: key, inputHashes: [input.workspaceFingerprint] });

  buildCache.set(key, {
    workspaceKey: key,
    buildHash,
    workspaceFingerprint: input.workspaceFingerprint,
    distPath: input.distPath,
    cachedAt: Date.now(),
    hitCount: 0,
  });

  return { hit: false, distPath: input.distPath, buildHash };
}

export function invalidateBuildOutput(workspaceKey: string): void {
  buildCache.delete(workspaceKey.replace(/\\/g, '/'));
}

export function shouldRebuild(input: {
  workspaceKey: string;
  currentFingerprint: string;
}): boolean {
  const key = input.workspaceKey.replace(/\\/g, '/');
  const existing = buildCache.get(key);
  if (!existing) return true;
  return existing.workspaceFingerprint !== input.currentFingerprint;
}

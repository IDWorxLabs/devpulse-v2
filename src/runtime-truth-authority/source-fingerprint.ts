/**
 * Runtime Truth Authority V1 — source fingerprint from authority files on disk.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const SOURCE_FINGERPRINT_FILE_PATHS = [
  'server/founder-reality-server.ts',
  'server/brain-api-handler.ts',
  'server/project-api-router.ts',
  'public/founder-reality/app.js',
  'public/founder-reality/index.html',
  'public/founder-reality/build-intent-route-parity.js',
  'public/founder-reality/chat-to-build-execution-bridge.js',
  'public/founder-reality/command-center-chat-execution-audit.js',
  'public/founder-reality/runtime-truth-authority.js',
  'package.json',
  'src/aidev-engine/index.ts',
  'src/autonomous-engineering-executive/index.ts',
  'src/autonomous-engineering-loop/index.ts',
  'src/engineering-intelligence-runtime/index.ts',
  'src/project-lifecycle-management-v1/index.ts',
  'src/aep-preview-gate-authority/index.ts',
  'src/adaptive-autofix-intelligence/index.ts',
  'src/build-intent-routing/index.ts',
  'src/chat-to-build-execution-bridge-v1/index.ts',
  'src/live-preview-runtime/index.ts',
  'src/missing-capability-evolution-engine/index.ts',
  'src/runtime-truth-authority/index.ts',
] as const;

export interface SourceFingerprintEntry {
  relativePath: string;
  exists: boolean;
  hash: string | null;
  mtimeMs: number | null;
}

export function computeSourceFingerprintEntries(rootDir: string): SourceFingerprintEntry[] {
  return SOURCE_FINGERPRINT_FILE_PATHS.map((relativePath) => {
    const absolutePath = join(rootDir, relativePath);
    if (!existsSync(absolutePath)) {
      return { relativePath, exists: false, hash: null, mtimeMs: null };
    }
    const content = readFileSync(absolutePath);
    const stat = statSync(absolutePath);
    return {
      relativePath,
      exists: true,
      hash: createHash('sha256').update(content).digest('hex').slice(0, 16),
      mtimeMs: stat.mtimeMs,
    };
  });
}

export function computeSourceFingerprint(rootDir: string): string {
  const entries = computeSourceFingerprintEntries(rootDir);
  const digest = createHash('sha256');
  for (const entry of entries) {
    digest.update(entry.relativePath);
    digest.update(entry.exists ? '1' : '0');
    digest.update(entry.hash ?? 'missing');
    digest.update(String(entry.mtimeMs ?? 0));
  }
  return digest.digest('hex').slice(0, 24);
}

export function resolveLatestSourceFingerprintTimestamp(rootDir: string): number | null {
  const entries = computeSourceFingerprintEntries(rootDir);
  const mtimes = entries.map((entry) => entry.mtimeMs).filter((value): value is number => value !== null);
  if (mtimes.length === 0) return null;
  return Math.max(...mtimes);
}

/**
 * World2 Real Instantiation V1 — World1 sentinel hashing for protection proof.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLD1_SENTINEL_PATHS } from './world2-real-instantiation-v1-bounds.js';

export function hashWorld1Sentinels(projectRootDir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const rel of WORLD1_SENTINEL_PATHS) {
    const path = join(projectRootDir, rel);
    if (!existsSync(path)) {
      hashes[rel] = 'MISSING';
      continue;
    }
    const content = readFileSync(path, 'utf8');
    hashes[rel] = createHash('sha256').update(content).digest('hex').slice(0, 16);
  }
  return hashes;
}

export function world1SentinelsUnchanged(
  before: Record<string, string>,
  after: Record<string, string>,
): boolean {
  for (const key of WORLD1_SENTINEL_PATHS) {
    if (before[key] !== after[key]) return false;
  }
  return true;
}

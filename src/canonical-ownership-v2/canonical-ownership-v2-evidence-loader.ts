/**
 * Canonical Ownership V2 Registration — evidence snapshot (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR,
  CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
} from './canonical-ownership-v2-bounds.js';
import type { CanonicalOwnershipV2Assessment } from './canonical-ownership-v2-types.js';

export function isCanonicalOwnershipV2Proven(projectRootDir: string): boolean {
  const path = join(projectRootDir, CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as CanonicalOwnershipV2Assessment;
    return data.passToken === CANONICAL_OWNERSHIP_V2_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadCanonicalOwnershipV2AssessmentFromDisk(
  projectRootDir: string,
): CanonicalOwnershipV2Assessment | null {
  const path = join(projectRootDir, CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as CanonicalOwnershipV2Assessment;
  } catch {
    return null;
  }
}

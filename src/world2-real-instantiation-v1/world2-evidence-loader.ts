/**
 * World2 Real Instantiation V1 — evidence snapshot (read-only, no execution).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
  WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN,
} from './world2-real-instantiation-v1-bounds.js';
import type { World2RealInstantiationAssessment } from './world2-real-instantiation-v1-types.js';

export function isWorld2RealInstantiationProven(projectRootDir: string): boolean {
  const summaryPath = join(
    projectRootDir,
    WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR,
    'world-execution-summary.json',
  );
  if (!existsSync(summaryPath)) return false;
  try {
    const data = JSON.parse(readFileSync(summaryPath, 'utf8')) as World2RealInstantiationAssessment;
    return data.passToken === WORLD2_REAL_INSTANTIATION_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadWorld2RealInstantiationAssessmentFromDisk(
  projectRootDir: string,
): World2RealInstantiationAssessment | null {
  const path = join(projectRootDir, WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as World2RealInstantiationAssessment;
  } catch {
    return null;
  }
}

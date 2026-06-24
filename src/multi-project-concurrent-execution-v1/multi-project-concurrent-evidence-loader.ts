/**
 * Multi-Project Concurrent Execution V1 — evidence snapshot (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR,
  MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN,
} from './multi-project-concurrent-execution-v1-bounds.js';
import type { MultiProjectConcurrentExecutionAssessment } from './multi-project-concurrent-execution-v1-types.js';

export function isMultiProjectConcurrentExecutionProven(projectRootDir: string): boolean {
  const path = join(
    projectRootDir,
    MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as MultiProjectConcurrentExecutionAssessment;
    return data.passToken === MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadMultiProjectConcurrentExecutionAssessmentFromDisk(
  projectRootDir: string,
): MultiProjectConcurrentExecutionAssessment | null {
  const path = join(
    projectRootDir,
    MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MultiProjectConcurrentExecutionAssessment;
  } catch {
    return null;
  }
}

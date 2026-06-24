/**
 * Self-Evolution Execution V1 — evidence snapshot (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR,
  SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
} from './self-evolution-execution-v1-bounds.js';
import type { SelfEvolutionExecutionAssessment } from './self-evolution-execution-v1-types.js';

export function isSelfEvolutionExecutionProven(projectRootDir: string): boolean {
  const path = join(projectRootDir, SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as SelfEvolutionExecutionAssessment;
    return data.passToken === SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadSelfEvolutionExecutionAssessmentFromDisk(
  projectRootDir: string,
): SelfEvolutionExecutionAssessment | null {
  const path = join(projectRootDir, SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as SelfEvolutionExecutionAssessment;
  } catch {
    return null;
  }
}

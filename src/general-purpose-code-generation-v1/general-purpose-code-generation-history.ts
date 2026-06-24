/**
 * General-Purpose Code Generation V1 — assessment history.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR } from './general-purpose-code-generation-v1-bounds.js';
import type { GeneralPurposeCodeGenerationV1Assessment } from './general-purpose-code-generation-v1-types.js';

let lastAssessment: GeneralPurposeCodeGenerationV1Assessment | null = null;

export function recordGeneralPurposeAssessment(
  assessment: GeneralPurposeCodeGenerationV1Assessment,
  projectRootDir?: string,
): void {
  lastAssessment = assessment;
  if (!projectRootDir) return;

  const dir = join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

export function getLastGeneralPurposeAssessment(): GeneralPurposeCodeGenerationV1Assessment | null {
  return lastAssessment;
}

export function loadGeneralPurposeAssessmentFromDisk(
  projectRootDir: string,
): GeneralPurposeCodeGenerationV1Assessment | null {
  const path = join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return lastAssessment;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as GeneralPurposeCodeGenerationV1Assessment;
  } catch {
    return lastAssessment;
  }
}

export function resetGeneralPurposeHistoryForTests(): void {
  lastAssessment = null;
}

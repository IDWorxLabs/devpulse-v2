/**
 * Mobile Runtime Validation at Scale V1 — evidence snapshot (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
} from './mobile-runtime-validation-v1-bounds.js';
import type {
  MobileCategoryResult,
  MobileRuntimeValidationAssessment,
} from './mobile-runtime-validation-v1-types.js';

export function isMobileRuntimeValidationProven(projectRootDir: string): boolean {
  const path = join(projectRootDir, MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as MobileRuntimeValidationAssessment;
    return data.passToken === MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadMobileRuntimeValidationAssessmentFromDisk(
  projectRootDir: string,
): MobileRuntimeValidationAssessment | null {
  const path = join(projectRootDir, MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MobileRuntimeValidationAssessment;
  } catch {
    return null;
  }
}

export function loadMobileCategoryResultsFromDisk(
  projectRootDir: string,
): readonly MobileCategoryResult[] {
  const path = join(
    projectRootDir,
    MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR,
    'mobile-category-results.json',
  );
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MobileCategoryResult[];
  } catch {
    return [];
  }
}

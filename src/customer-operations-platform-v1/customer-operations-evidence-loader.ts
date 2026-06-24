/**
 * Customer Operations Platform V1 — evidence loader.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR,
  CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
} from './customer-operations-platform-v1-bounds.js';
import type { CustomerOperationsPlatformAssessment } from './customer-operations-platform-v1-types.js';

export function isCustomerOperationsPlatformProven(projectRootDir: string): boolean {
  const path = join(
    projectRootDir,
    CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as CustomerOperationsPlatformAssessment;
    return data.passToken === CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadCustomerOperationsPlatformAssessmentFromDisk(
  projectRootDir: string,
): CustomerOperationsPlatformAssessment | null {
  const path = join(
    projectRootDir,
    CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as CustomerOperationsPlatformAssessment;
  } catch {
    return null;
  }
}

export function loadCommercializationImpactFromDisk(projectRootDir: string): {
  proven: boolean;
  projectedScore: number;
  priorScore: number;
} {
  const assessment = loadCustomerOperationsPlatformAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return { proven: false, projectedScore: 68, priorScore: 68 };
  }
  return {
    proven: assessment.passToken === CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
    projectedScore: assessment.commercializationImpact.projectedCommercializationScore,
    priorScore: assessment.commercializationImpact.priorCommercializationScore,
  };
}

/**
 * Unified Failure Escalation Authority V1 — evidence snapshot (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
} from './unified-failure-escalation-v1-bounds.js';
import type { UnifiedFailureEscalationAssessment } from './unified-failure-escalation-v1-types.js';

export function isUnifiedFailureEscalationProven(projectRootDir: string): boolean {
  const path = join(
    projectRootDir,
    UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as UnifiedFailureEscalationAssessment;
    return data.passToken === UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadUnifiedFailureEscalationAssessmentFromDisk(
  projectRootDir: string,
): UnifiedFailureEscalationAssessment | null {
  const path = join(
    projectRootDir,
    UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as UnifiedFailureEscalationAssessment;
  } catch {
    return null;
  }
}

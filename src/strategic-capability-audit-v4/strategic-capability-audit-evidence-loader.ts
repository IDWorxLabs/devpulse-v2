/**
 * Strategic Capability Audit V4 — evidence loader.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR,
  STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN,
} from './strategic-capability-audit-v4-bounds.js';
import type { StrategicCapabilityAuditV4Assessment } from './strategic-capability-audit-v4-types.js';

export function isStrategicCapabilityAuditV4Proven(projectRootDir: string): boolean {
  const path = join(projectRootDir, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as StrategicCapabilityAuditV4Assessment;
    return data.passToken === STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadStrategicCapabilityAuditV4FromDisk(
  projectRootDir: string,
): StrategicCapabilityAuditV4Assessment | null {
  const path = join(projectRootDir, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as StrategicCapabilityAuditV4Assessment;
  } catch {
    return null;
  }
}

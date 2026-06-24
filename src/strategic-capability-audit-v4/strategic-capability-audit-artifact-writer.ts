/**
 * Strategic Capability Audit V4 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR } from './strategic-capability-audit-v4-bounds.js';
import type { StrategicCapabilityAuditV4Assessment } from './strategic-capability-audit-v4-types.js';

export function writeStrategicCapabilityAuditV4Artifacts(
  projectRootDir: string,
  assessment: StrategicCapabilityAuditV4Assessment,
): void {
  const dir = join(projectRootDir, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(dir, 'roadmap-v4.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, priorities: assessment.roadmapV4, highestValueNextCapability: assessment.highestValueNextCapability }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'remaining-gaps.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, gaps: assessment.remainingGaps, noMajorGapsConclusion: assessment.noMajorGapsConclusion }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'factory-readiness.json'),
    `${JSON.stringify(assessment.factoryReadiness, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'autonomy-readiness.json'),
    `${JSON.stringify(assessment.autonomyReadiness, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'commercialization-readiness.json'),
    `${JSON.stringify(assessment.commercializationReadiness, null, 2)}\n`,
    'utf8',
  );
}

/**
 * Strategic Audit Roadmap Consistency Repair V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_ARTIFACT_DIR } from './strategic-audit-roadmap-consistency-repair-v1-bounds.js';
import type { StrategicAuditRoadmapConsistencyRepairAssessment } from './strategic-audit-roadmap-consistency-repair-v1-types.js';

export function writeStrategicAuditRoadmapConsistencyRepairArtifacts(
  projectRootDir: string,
  assessment: StrategicAuditRoadmapConsistencyRepairAssessment,
): void {
  const dir = join(projectRootDir, STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'consistency-analysis.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, items: assessment.consistencyAnalysis }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'roadmap-conflicts.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, conflicts: assessment.roadmapConflicts }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'resolved-priorities.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, priorities: assessment.resolvedPriorities }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

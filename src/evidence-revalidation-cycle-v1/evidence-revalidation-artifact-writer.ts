/**
 * Evidence Revalidation Cycle V1 — artifact writer.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR } from './evidence-revalidation-cycle-v1-bounds.js';
import type { EvidenceRevalidationCycleAssessment } from './evidence-revalidation-cycle-v1-types.js';
import { buildRevalidationFailureRegistry } from './revalidation-failure-bridge.js';

export function writeEvidenceRevalidationCycleArtifacts(
  projectRootDir: string,
  assessment: EvidenceRevalidationCycleAssessment,
): void {
  const dir = join(projectRootDir, EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, 'assessment.json'), JSON.stringify(assessment, null, 2), 'utf8');
  writeFileSync(join(dir, 'revalidation-registry.json'), JSON.stringify(assessment.registry, null, 2), 'utf8');
  writeFileSync(join(dir, 'revalidation-queue.json'), JSON.stringify(assessment.queue, null, 2), 'utf8');
  writeFileSync(join(dir, 'revalidation-results.json'), JSON.stringify(assessment.results, null, 2), 'utf8');
  writeFileSync(
    join(dir, 'confidence-recovery.json'),
    JSON.stringify(assessment.confidenceRecovery, null, 2),
    'utf8',
  );
  writeFileSync(
    join(dir, 'freshness-updates.json'),
    JSON.stringify(assessment.freshnessUpdates, null, 2),
    'utf8',
  );
  writeFileSync(join(dir, 'audit-impact.json'), JSON.stringify(assessment.auditImpact, null, 2), 'utf8');
  writeFileSync(
    join(dir, 'revalidation-failures.json'),
    JSON.stringify(buildRevalidationFailureRegistry(assessment.failures), null, 2),
    'utf8',
  );
}

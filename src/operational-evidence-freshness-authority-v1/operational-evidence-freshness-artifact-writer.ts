/**
 * Operational Evidence Freshness Authority V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR } from './operational-evidence-freshness-v1-bounds.js';
import type { OperationalEvidenceFreshnessAssessment } from './operational-evidence-freshness-v1-types.js';

export function writeOperationalEvidenceFreshnessArtifacts(
  projectRootDir: string,
  assessment: OperationalEvidenceFreshnessAssessment,
): void {
  const dir = join(projectRootDir, OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'freshness-registry.json'),
    `${JSON.stringify(assessment.registry, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'capability-freshness.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, capabilities: assessment.capabilityFreshness },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'confidence-decay.json'),
    `${JSON.stringify(assessment.confidenceDecay, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'revalidation-recommendations.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, recommendations: assessment.revalidationRecommendations },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'evidence-drift.json'),
    `${JSON.stringify(assessment.evidenceDrift, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'freshness-incidents.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, incidents: assessment.freshnessIncidents },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'audit-impact.json'),
    `${JSON.stringify(assessment.auditImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

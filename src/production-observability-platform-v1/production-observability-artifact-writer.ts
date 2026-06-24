/**
 * Production Observability Platform V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR } from './production-observability-platform-v1-bounds.js';
import type { ProductionObservabilityPlatformAssessment } from './production-observability-platform-v1-types.js';

export function writeProductionObservabilityPlatformArtifacts(
  projectRootDir: string,
  assessment: ProductionObservabilityPlatformAssessment,
): void {
  const dir = join(projectRootDir, PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'application-health.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, applications: assessment.applicationHealth }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'deployment-registry.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, deployments: assessment.deploymentRegistry }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'runtime-metrics.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, metrics: assessment.runtimeMetrics }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'availability-assessment.json'),
    `${JSON.stringify(assessment.availabilityAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'incident-registry.json'),
    `${JSON.stringify(assessment.incidentRegistry, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'recovery-recommendations.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, recommendations: assessment.recoveryRecommendations },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'commercialization-impact.json'),
    `${JSON.stringify(assessment.commercializationImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'audit-impact.json'),
    `${JSON.stringify(assessment.auditImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

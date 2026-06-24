/**
 * Continuous Deployment Pipeline V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR } from './continuous-deployment-pipeline-v1-bounds.js';
import type { ContinuousDeploymentPipelineAssessment } from './continuous-deployment-pipeline-v1-types.js';

export function writeContinuousDeploymentPipelineArtifacts(
  projectRootDir: string,
  assessment: ContinuousDeploymentPipelineAssessment,
): void {
  const dir = join(projectRootDir, CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'deployment-candidates.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, candidates: assessment.deploymentCandidates }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'deployment-lifecycle.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, lifecycle: assessment.deploymentLifecycle }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'promotion-decisions.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, decisions: assessment.promotionDecisions }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'deployment-history.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, history: assessment.deploymentHistory }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'rollback-recommendations.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, recommendations: assessment.rollbackRecommendations },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'deployment-health.json'),
    `${JSON.stringify(assessment.deploymentHealth, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'deployment-failures.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, failures: assessment.deploymentFailures }, null, 2)}\n`,
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

/**
 * Multi-Project Concurrent Execution V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR } from './multi-project-concurrent-execution-v1-bounds.js';
import type { MultiProjectConcurrentExecutionAssessment } from './multi-project-concurrent-execution-v1-types.js';

export function writeMultiProjectConcurrentExecutionArtifacts(
  projectRootDir: string,
  assessment: MultiProjectConcurrentExecutionAssessment,
): void {
  const dir = join(projectRootDir, MULTI_PROJECT_CONCURRENT_EXECUTION_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'concurrent-execution-results.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        projectResults: assessment.projectResults,
        concurrentPassRate: assessment.concurrentPassRate,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'resource-allocation.json'),
    `${JSON.stringify(assessment.resourceAllocation, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'contamination-assessment.json'),
    `${JSON.stringify(assessment.contaminationAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'failure-classification.json'),
    `${JSON.stringify(assessment.failureClassification, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'concurrent-build-proof.json'),
    `${JSON.stringify(assessment.buildProof, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'concurrent-verification-assessment.json'),
    `${JSON.stringify(assessment.verificationAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'world2-concurrent-results.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, results: assessment.world2ConcurrentResults },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

/**
 * World2 Real Instantiation V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR } from './world2-real-instantiation-v1-bounds.js';
import type { World2RealInstantiationAssessment } from './world2-real-instantiation-v1-types.js';

export function writeWorld2RealInstantiationArtifacts(
  projectRootDir: string,
  assessment: World2RealInstantiationAssessment,
): void {
  const dir = join(projectRootDir, WORLD2_REAL_INSTANTIATION_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'world-registry.json'),
    `${JSON.stringify(assessment.registry, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'isolation-proof.json'),
    `${JSON.stringify(assessment.isolationProof, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'promotion-proof.json'),
    `${JSON.stringify(assessment.promotionProofs, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'destruction-proof.json'),
    `${JSON.stringify(assessment.destructionProofs, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'multi-world-results.json'),
    `${JSON.stringify(assessment.multiWorldResults, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'world-execution-summary.json'),
    `${JSON.stringify(assessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'assessment.json'),
    `${JSON.stringify(assessment, null, 2)}\n`,
    'utf8',
  );
}

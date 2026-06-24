/**
 * Self-Evolution Execution V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR } from './self-evolution-execution-v1-bounds.js';
import type { SelfEvolutionExecutionAssessment } from './self-evolution-execution-v1-types.js';

export function writeSelfEvolutionExecutionArtifacts(
  projectRootDir: string,
  assessment: SelfEvolutionExecutionAssessment,
): void {
  const dir = join(projectRootDir, SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'gap-assessments.json'),
    `${JSON.stringify(assessment.gapAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'evolution-proposals.json'),
    `${JSON.stringify(assessment.proposals, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'experiment-results.json'),
    `${JSON.stringify(assessment.experimentResults, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'impact-assessments.json'),
    `${JSON.stringify(assessment.impactAssessments, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'approval-decisions.json'),
    `${JSON.stringify(assessment.approvalDecisions, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'evolution-registry.json'),
    `${JSON.stringify(assessment.registry, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'production-protection-proof.json'),
    `${JSON.stringify(assessment.productionProtection, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

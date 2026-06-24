/**
 * General-Purpose Code Generation Gap Investigation — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_ARTIFACT_DIR } from './general-purpose-code-generation-gap-investigation-bounds.js';
import type { GeneralPurposeCodeGenerationGapInvestigationAssessment } from './general-purpose-code-generation-gap-investigation-types.js';

export function writeGeneralPurposeCodeGenerationGapInvestigationArtifacts(
  projectRootDir: string,
  assessment: GeneralPurposeCodeGenerationGapInvestigationAssessment,
): void {
  const dir = join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_GAP_INVESTIGATION_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'evidence-analysis.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, entries: assessment.evidenceAnalysis }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'roadmap-consistency.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, findings: assessment.roadmapConsistency }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'remaining-codegen-gaps.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, gaps: assessment.remainingCodegenGaps }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

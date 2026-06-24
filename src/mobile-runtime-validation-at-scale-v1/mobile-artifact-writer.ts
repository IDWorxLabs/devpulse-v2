/**
 * Mobile Runtime Validation at Scale V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR } from './mobile-runtime-validation-v1-bounds.js';
import type { MobileRuntimeValidationAssessment } from './mobile-runtime-validation-v1-types.js';

export function writeMobileRuntimeValidationArtifacts(
  projectRootDir: string,
  assessment: MobileRuntimeValidationAssessment,
): void {
  const dir = join(projectRootDir, MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  const mobileProof = {
    readOnly: true,
    generatedAt: assessment.generatedAt,
    passToken: assessment.passToken,
    mobileProofStatus: assessment.mobileProofStatus,
    categoriesMobileProven: assessment.categoriesMobileProven,
    categoriesValidated: assessment.categoriesValidated,
    mobilePassRate: assessment.mobilePassRate,
    runtimeProfilesValidated: assessment.runtimeProfilesValidated,
    proofs: assessment.categoryResults.flatMap((c) => c.proofs),
  };

  writeFileSync(join(dir, 'mobile-proof.json'), `${JSON.stringify(mobileProof, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(dir, 'mobile-category-results.json'),
    `${JSON.stringify(assessment.categoryResults, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'mobile-navigation-assessment.json'),
    `${JSON.stringify(assessment.mobileNavigationAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'touch-interaction-assessment.json'),
    `${JSON.stringify(assessment.touchInteractionAssessment, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'mobile-performance-summary.json'),
    `${JSON.stringify(assessment.mobilePerformanceSummary, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'mobile-world2-results.json'),
    `${JSON.stringify(assessment.world2Results, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

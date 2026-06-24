/**
 * Mobile Runtime Validation at Scale V1 — full assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeMobileNavigation } from '../mobile-preview-modes/mobile-navigation-analyzer.js';
import { resolveRealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import type { MobileRuntimeValidationAssessment } from './mobile-runtime-validation-v1-types.js';
import {
  MIN_MOBILE_CATEGORY_COUNT,
  MIN_MOBILE_PASS_RATE,
  MIN_MOBILE_WORLD2_EXECUTIONS,
  MOBILE_RUNTIME_PROFILE_IDS,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_FAIL_TOKEN,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
  MOBILE_VALIDATION_SUITE_PROFILES,
} from './mobile-runtime-validation-v1-bounds.js';
import { writeMobileRuntimeValidationArtifacts } from './mobile-artifact-writer.js';
import { buildMobileProductCoverage } from './mobile-pai-integration.js';
import { buildMobileVerificationEvidence } from './mobile-uvl-integration.js';
import {
  assessTouchInteraction,
  isCategoryMobileProven,
  validateMobileRuntimeForProfile,
} from './mobile-runtime-validator.js';
import {
  buildPreviewEvidenceFromWorkspace,
  extractWorkspaceMobileSignals,
} from './mobile-workspace-evidence.js';
import { runMobileWorld2Executions } from './mobile-world2-runner.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

function resolveMobileProofStatus(input: {
  categoriesMobileProven: number;
  mobilePassRate: number;
  world2MobileExecutions: number;
}): MobileRuntimeValidationAssessment['mobileProofStatus'] {
  if (
    input.categoriesMobileProven >= MIN_MOBILE_CATEGORY_COUNT &&
    input.mobilePassRate >= MIN_MOBILE_PASS_RATE &&
    input.world2MobileExecutions >= MIN_MOBILE_WORLD2_EXECUTIONS
  ) {
    return 'PROVEN';
  }
  if (input.categoriesMobileProven > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

function resolvePassToken(
  mobileProofStatus: MobileRuntimeValidationAssessment['mobileProofStatus'],
  runtimeProfilesValidated: readonly string[],
  world2MobileExecutions: number,
): string {
  if (
    mobileProofStatus === 'PROVEN' &&
    runtimeProfilesValidated.length === MOBILE_RUNTIME_PROFILE_IDS.length &&
    world2MobileExecutions >= MIN_MOBILE_WORLD2_EXECUTIONS
  ) {
    return MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN;
  }
  return MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_FAIL_TOKEN;
}

export function runMobileRuntimeValidationAtScaleV1(input?: {
  projectRootDir?: string;
  writeArtifacts?: boolean;
}): MobileRuntimeValidationAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const generatedAt = new Date().toISOString();

  const categoryResults = MOBILE_VALIDATION_SUITE_PROFILES.map((profile) => {
    const suite = resolveRealBuildSuiteEntry(profile);
    const proofs = MOBILE_RUNTIME_PROFILE_IDS.map((runtimeProfile) =>
      validateMobileRuntimeForProfile({
        projectRootDir,
        profile,
        runtimeProfile,
        executionContext: 'RBEP',
      }),
    );
    return {
      readOnly: true as const,
      profile: suite.profile,
      productName: suite.productName,
      mobileRuntimeProven: isCategoryMobileProven(proofs),
      profilesValidated: MOBILE_RUNTIME_PROFILE_IDS.filter((_, i) => proofs[i]?.passed),
      proofs,
    };
  });

  const world2Results = runMobileWorld2Executions({ projectRootDir });

  const touchCategoryScores = categoryResults.map((cat) => {
    const signals = extractWorkspaceMobileSignals(projectRootDir, cat.profile);
    const touch = assessTouchInteraction(signals);
    return { profile: cat.profile, score: touch.score, findings: touch.findings };
  });

  const navCategoryScores = categoryResults.map((cat) => {
    const signals = extractWorkspaceMobileSignals(projectRootDir, cat.profile);
    const evidence = buildPreviewEvidenceFromWorkspace(signals);
    const nav = analyzeMobileNavigation(evidence);
    return {
      profile: cat.profile,
      score: nav.navigationUsabilityScore,
      findings: [...nav.findings],
    };
  });

  const allProofs = categoryResults.flatMap((c) => c.proofs);
  const passedProofs = allProofs.filter((p) => p.passed);
  const mobilePassRate =
    allProofs.length > 0 ? Math.round((passedProofs.length / allProofs.length) * 100) : 0;

  const categoriesMobileProven = categoryResults.filter((c) => c.mobileRuntimeProven).length;

  const touchInteractionAssessment = {
    readOnly: true as const,
    generatedAt,
    overallScore:
      touchCategoryScores.length > 0
        ? Math.round(
            touchCategoryScores.reduce((sum, c) => sum + c.score, 0) / touchCategoryScores.length,
          )
        : 0,
    tapTargetsAccessible: touchCategoryScores.every((c) => c.findings.includes('TAP_TARGETS_ACCESSIBLE')),
    menusUsable: touchCategoryScores.every((c) => c.findings.includes('MENUS_USABLE')),
    buttonsClickable: touchCategoryScores.every((c) => c.findings.includes('BUTTONS_CLICKABLE')),
    navigationDrawerFunctional: categoryResults.every((c) =>
      c.proofs.some((p) => p.interactionProof),
    ),
    scrollingFunctional: categoryResults.every((c) => c.proofs.some((p) => p.applicationLoads)),
    formsUsable: touchCategoryScores.some((c) => c.findings.includes('FORMS_USABLE')),
    categoryScores: touchCategoryScores,
  };

  const mobileNavigationAssessment = {
    readOnly: true as const,
    generatedAt,
    overallScore:
      navCategoryScores.length > 0
        ? Math.round(
            navCategoryScores.reduce((sum, c) => sum + c.score, 0) / navCategoryScores.length,
          )
        : 0,
    hiddenNavigationRisk: navCategoryScores.some((c) => c.score < 40),
    unreachableScreensRisk: categoryResults.some((c) => !c.mobileRuntimeProven),
    overflowIssues: navCategoryScores.some((c) =>
      c.findings.some((f) => /OVERFLOW|CLIP/i.test(f)),
    ),
    viewportClippingRisk: categoryResults.some((c) =>
      c.proofs.some((p) => !p.applicationLoads && p.buildSuccess),
    ),
    brokenLayoutsRisk: navCategoryScores.some((c) => c.score < 50),
    categoryScores: navCategoryScores,
  };

  const perfProofs = allProofs.filter((p) => p.passed);
  const mobilePerformanceSummary = {
    readOnly: true as const,
    generatedAt,
    averageInitialRenderMs:
      perfProofs.length > 0
        ? Math.round(
            perfProofs.reduce((sum, p) => sum + p.performanceSummary.initialRenderMs, 0) /
              perfProofs.length,
          )
        : 0,
    averageNavigationResponseMs:
      perfProofs.length > 0
        ? Math.round(
            perfProofs.reduce((sum, p) => sum + p.performanceSummary.navigationResponseMs, 0) /
              perfProofs.length,
          )
        : 0,
    averageInteractionReadinessMs:
      perfProofs.length > 0
        ? Math.round(
            perfProofs.reduce((sum, p) => sum + p.performanceSummary.interactionReadinessMs, 0) /
              perfProofs.length,
          )
        : 0,
    categoriesMeasured: categoryResults.filter((c) => c.proofs.some((p) => p.passed)).length,
  };

  const world2MobileExecutions = world2Results.filter((w) => w.mobileRuntimeProven).length;
  const world2Count = world2Results.length;

  const mobileVerificationEvidence = buildMobileVerificationEvidence({
    categoriesMobileProven,
    categoriesRequired: MIN_MOBILE_CATEGORY_COUNT,
  });

  const mobileProductCoverage = buildMobileProductCoverage(categoryResults);

  const mobileProofStatus = resolveMobileProofStatus({
    categoriesMobileProven,
    mobilePassRate,
    world2MobileExecutions: world2Count,
  });

  const runtimeProfilesValidated = MOBILE_RUNTIME_PROFILE_IDS.filter((profileId) =>
    categoryResults.every((cat) => cat.proofs.some((p) => p.runtimeProfile === profileId && p.passed)),
  );

  const performanceScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        Math.round(mobilePerformanceSummary.averageInitialRenderMs / 15) -
        Math.round(mobilePerformanceSummary.averageNavigationResponseMs / 10),
    ),
  );

  const assessment: MobileRuntimeValidationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Mobile Runtime Validation at Scale V1',
    passToken: resolvePassToken(mobileProofStatus, runtimeProfilesValidated, world2Count),
    version: 'V1',
    generatedAt,
    categoriesValidated: categoryResults.length,
    categoriesMobileProven,
    mobilePassRate,
    runtimeProfilesValidated,
    touchInteractionScore: touchInteractionAssessment.overallScore,
    navigationScore: mobileNavigationAssessment.overallScore,
    performanceScore,
    world2MobileExecutions: world2Count,
    mobileProofStatus,
    categoryResults,
    touchInteractionAssessment,
    mobileNavigationAssessment,
    mobilePerformanceSummary,
    world2Results,
    mobileVerificationEvidence,
    mobileProductCoverage,
  };

  if (input?.writeArtifacts !== false) {
    writeMobileRuntimeValidationArtifacts(projectRootDir, assessment);
  }

  return assessment;
}

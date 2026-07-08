/**
 * Universal Build Pipeline Verification V1 — assessment runner.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  UNIVERSAL_BUILD_PIPELINE_ARTIFACT_DIR,
  UNIVERSAL_BUILD_PIPELINE_OWNER_MODULE,
  UNIVERSAL_BUILD_PIPELINE_REPORT_JSON,
  UNIVERSAL_BUILD_PIPELINE_REPORT_MD,
  UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN,
} from './universal-build-pipeline-bounds.js';
import {
  UNIVERSAL_BUILD_PIPELINE_MATRIX,
  listUniversalBuildMatrixCategoryIds,
} from './universal-build-pipeline-matrix.js';
import type {
  ClassifiedBlocker,
  RunUniversalBuildPipelineInput,
  UniversalBuildCategoryResult,
  UniversalBuildPipelineAssessment,
} from './universal-build-pipeline-types.js';
import { traceUniversalBuildPipeline } from './pipeline-stage-tracer.js';
import { classifyBlocker, groupBlockersByClass, detectSystemicPatterns, buildRecommendedFixes } from './blocker-classifier.js';
import { resolveBuildOutcome } from './build-outcome-policy.js';
import { buildUniversalBuildPipelineReportMarkdown } from './universal-build-pipeline-report-builder.js';

let lastAssessment: UniversalBuildPipelineAssessment | null = null;

export function resetUniversalBuildPipelineForTests(): void {
  lastAssessment = null;
}

export function getLastUniversalBuildPipelineAssessment(): UniversalBuildPipelineAssessment | null {
  return lastAssessment;
}

function runCategory(
  categoryId: string,
  projectRootDir: string,
  leafMode: boolean,
): UniversalBuildCategoryResult {
  const entry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === categoryId)!;
  const trace = traceUniversalBuildPipeline({
    matrixEntry: entry,
    projectRootDir,
    leafMode,
  });

  const blockers: ClassifiedBlocker[] = trace.allBlockers.map((b) =>
    classifyBlocker({
      stage: b.stage,
      reason: b.reason,
      hasGeneratedSource: trace.workspaceMaterialized,
      hasWorkspaceModules: trace.buildPlan.modulePlan.approvedModuleIds.length > 0,
      selectedProfile: trace.profilePolicy.selectedProfile,
      expectedProfile: String(entry.expectedProfile),
      authInjectedWithoutPrompt:
        !/\b(login|sign[\s-]?in|accounts?|users?|roles?|sessions?)\b/i.test(entry.prompt) &&
        /auth|login|authentication/i.test(b.reason),
    }),
  );

  const blockedBeforeMaterialization =
    blockers.some(
      (b) =>
        b.legitimate &&
        ['PLAN_CONTRACT', 'MODULE_EXTRACTION', 'PROMPT_FAITHFULNESS', 'PROFILE_RESOLUTION'].includes(
          b.stage,
        ),
    ) && !trace.continuationPolicy.shouldContinueToBuild;

  const buildOutcome = resolveBuildOutcome({
    materialized: trace.workspaceMaterialized || trace.buildPlan.modulePlan.approvedModuleIds.length > 0,
    npmInstallOk: false,
    npmBuildOk: false,
    previewOk: false,
    previewDegraded: false,
    blockedBeforeMaterialization,
  });

  const reachedNpmInstall = trace.continuationPolicy.shouldContinueToBuild && !blockedBeforeMaterialization;
  const reachedNpmBuild = reachedNpmInstall;
  const reachedPreview = trace.continuationPolicy.shouldContinueToPreview && !blockedBeforeMaterialization;
  const reachedReport = true;

  return {
    readOnly: true,
    categoryId: entry.categoryId,
    categoryLabel: entry.categoryLabel,
    prompt: entry.prompt,
    selectedProfile: trace.profilePolicy.selectedProfile,
    stageTraces: trace.stageTraces,
    blockers,
    buildOutcome,
    reachedNpmInstall,
    reachedNpmBuild,
    reachedPreview,
    reachedReport,
    promptFaithfulnessPassed: trace.promptFaithfulnessPassed,
    workspaceMaterialized: trace.workspaceMaterialized,
    featureRealityStatus: trace.featureRealityStatus,
    livePreviewVerified: false,
    productionProofComplete: false,
  };
}

export function runUniversalBuildPipeline(
  input: RunUniversalBuildPipelineInput = {},
): UniversalBuildPipelineAssessment {
  const projectRootDir = input.projectRootDir ?? process.cwd();
  const leafMode = input.leafMode ?? true;
  const categoryIds = input.categories?.length
    ? input.categories
    : listUniversalBuildMatrixCategoryIds();

  const categoryResults = categoryIds.map((id) => runCategory(id, projectRootDir, leafMode));
  const allBlockers = categoryResults.flatMap((r) => r.blockers);
  const patterns = detectSystemicPatterns(allBlockers);

  const lisaIncluded = categoryResults.some((r) => r.categoryId === 'assistive-mobile-accessibility');
  const genericCustomProfileAccepted = categoryResults
    .filter((r) => r.selectedProfile === 'GENERIC_CUSTOM_APP_V1')
    .every((r) => !r.blockers.some((b) => b.blockerClass === 'PROFILE_MISROUTE_BLOCKER'));
  const featureRealityFallbackIsWarning = categoryResults.every(
    (r) =>
      r.featureRealityStatus !== 'FAIL' ||
      r.blockers.every((b) => b.blockerClass !== 'OVERSTRICT_BLOCKER'),
  );
  const expenseTrackerContaminationDetected = categoryResults.some((r) =>
    r.blockers.some((b) => b.blockerClass === 'PROFILE_MISROUTE_BLOCKER'),
  );

  const assessment: UniversalBuildPipelineAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: UNIVERSAL_BUILD_PIPELINE_OWNER_MODULE,
    passToken: UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN,
    generatedAt: new Date().toISOString(),
    promptsTested: categoryResults.length,
    categoryResults,
    blockersByClass: groupBlockersByClass(allBlockers),
    systemicBlockerPatterns: patterns.systemicBlockerPatterns,
    profileMisroutePatterns: patterns.profileMisroutePatterns,
    overstrictGatePatterns: patterns.overstrictGatePatterns,
    authInjectionBugs: patterns.authInjectionBugs,
    previewGateBugs: patterns.previewGateBugs,
    recommendedFixes: buildRecommendedFixes(patterns),
    lisaIncluded,
    genericCustomProfileAccepted,
    featureRealityFallbackIsWarning,
    expenseTrackerContaminationDetected,
  };

  const artifactDir = join(projectRootDir, UNIVERSAL_BUILD_PIPELINE_ARTIFACT_DIR);
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(
    join(artifactDir, UNIVERSAL_BUILD_PIPELINE_REPORT_JSON),
    JSON.stringify(assessment, null, 2),
    'utf8',
  );
  writeFileSync(
    join(artifactDir, UNIVERSAL_BUILD_PIPELINE_REPORT_MD),
    buildUniversalBuildPipelineReportMarkdown(assessment),
    'utf8',
  );

  lastAssessment = assessment;
  return assessment;
}

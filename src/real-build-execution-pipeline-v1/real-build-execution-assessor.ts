/**
 * Real Build Execution Pipeline V1 — assessment orchestrator.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MIN_REAL_BUILD_SUITE_COUNT,
  REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN,
} from './real-build-execution-pipeline-bounds.js';
import { buildExecutionFailureDistribution } from './real-build-execution-failure-classifier.js';
import { recordRealBuildExecutionAssessment } from './real-build-execution-history.js';
import { computeExecutionMetrics } from './real-build-execution-metrics.js';
import { runRealBuildForCategory } from './real-build-execution-runner.js';
import {
  REAL_BUILD_EXECUTION_SUITE,
  resolveRealBuildSuiteEntry,
} from './real-build-execution-suite-registry.js';
import { computeExecutionGeneralizationScore } from './real-build-generalization-score.js';
import type {
  RealBuildExecutionPipelineAssessment,
  RunRealBuildExecutionPipelineInput,
} from './real-build-execution-pipeline-types.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

const LEAF_MODE_BUILD_PROFILES = new Set([
  'TASK_TRACKER_WEB_V1',
  'CRM_WEB_V1',
  'PROJECT_MANAGEMENT_WEB_V1',
]);

export function runRealBuildExecutionPipeline(
  input: RunRealBuildExecutionPipelineInput = {},
): RealBuildExecutionPipelineAssessment {
  const projectRootDir = input.projectRootDir ?? DEFAULT_ROOT;
  const leafMode = input.leafMode ?? false;
  const skipNpmBuild = input.skipNpmBuild ?? false;

  const categories = input.profiles
    ? REAL_BUILD_EXECUTION_SUITE.filter((entry) => input.profiles!.includes(entry.profile))
    : REAL_BUILD_EXECUTION_SUITE;

  const categoryResults = categories.map((category) => {
    const runNpmBuild =
      !skipNpmBuild && (!leafMode || LEAF_MODE_BUILD_PROFILES.has(category.profile));
    return runRealBuildForCategory({
      category,
      projectRootDir,
      runNpmBuild,
    });
  });

  const metrics = computeExecutionMetrics(categoryResults);

  const buildAttempted = categoryResults.filter((r) =>
    leafMode ? LEAF_MODE_BUILD_PROFILES.has(r.profile) : !skipNpmBuild,
  );
  if (buildAttempted.length > 0) {
    const buildSuccessCount = buildAttempted.filter((r) => r.metrics.buildSuccess).length;
    metrics.buildSuccessRate = Math.round((buildSuccessCount / buildAttempted.length) * 100);
    const previewSuccessCount = buildAttempted.filter((r) => r.metrics.previewSuccess).length;
    metrics.previewSuccessRate = Math.round((previewSuccessCount / buildAttempted.length) * 100);
  }

  const failureDistribution = buildExecutionFailureDistribution(categoryResults);
  const executionGeneralizationScore = computeExecutionGeneralizationScore({
    metrics,
    categoriesTested: categoryResults.length,
    minCategories: MIN_REAL_BUILD_SUITE_COUNT,
  });

  const completeProofs = categoryResults.filter((r) => r.executionProof.proofComplete).length;
  const executionProofStatus: RealBuildExecutionPipelineAssessment['executionProofStatus'] =
    completeProofs === categoryResults.length && categoryResults.length > 0
      ? 'PROVEN'
      : completeProofs > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const assessment: RealBuildExecutionPipelineAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'AiDevEngine Real Build Execution Pipeline',
    passToken: REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN,
    generatedAt: new Date().toISOString(),
    categoriesTested: categoryResults.length,
    categoriesPassed: categoryResults.filter((r) => r.passed).length,
    metrics,
    executionGeneralizationScore,
    failureDistribution,
    categoryResults,
    recentBuilds: categoryResults.slice(0, 8).map((result) => ({
      profile: result.profile,
      productName: result.productName,
      passed: result.passed,
      buildSuccess: result.metrics.buildSuccess,
      previewSuccess: result.metrics.previewSuccess,
      aflaVerdict: result.executionProof.aflaVerdict,
      updatedAt: new Date().toISOString(),
    })),
    executionProofStatus,
  };

  recordRealBuildExecutionAssessment(assessment);
  return assessment;
}

export function resolveRealBuildExecutionCategory(profile?: string | null) {
  return resolveRealBuildSuiteEntry(profile);
}

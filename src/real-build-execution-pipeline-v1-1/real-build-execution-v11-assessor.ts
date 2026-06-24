/**
 * Real Build Execution Pipeline V1.1 — full 15/15 assessment orchestrator.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeExecutionMetrics } from '../real-build-execution-pipeline-v1/real-build-execution-metrics.js';
import { runRealBuildForCategory } from '../real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { REAL_BUILD_EXECUTION_SUITE } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { buildBuildProofRecords } from './build-proof-builder.js';
import { buildExecutionMatrix } from './execution-matrix-builder.js';
import {
  buildExecutionFailureIntelligence,
  buildFailureIntelligenceSummary,
} from './failure-intelligence.js';
import { computeExecutionGeneralizationScoreV2 } from './generalization-score-v2.js';
import { buildProofCoverageReport } from './proof-coverage.js';
import {
  MIN_FULL_PROOF_CATEGORIES,
  REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN,
} from './real-build-execution-pipeline-v11-bounds.js';
import type { RealBuildExecutionPipelineV11Assessment } from './real-build-execution-pipeline-v11-types.js';
import { recordRealBuildExecutionV11Assessment } from './real-build-execution-v11-history.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runRealBuildExecutionPipelineV11(input?: {
  projectRootDir?: string;
  profiles?: readonly string[];
}): RealBuildExecutionPipelineV11Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const categories = input?.profiles
    ? REAL_BUILD_EXECUTION_SUITE.filter((entry) => input.profiles!.includes(entry.profile))
    : REAL_BUILD_EXECUTION_SUITE;

  const categoryResults = categories.map((category) =>
    runRealBuildForCategory({
      category,
      projectRootDir,
      runNpmBuild: true,
      fullProofMode: true,
    }),
  );

  const metrics = computeExecutionMetrics(categoryResults);
  const buildProof = buildBuildProofRecords(categoryResults);
  const executionMatrix = buildExecutionMatrix(categoryResults);
  const failureIntelligence = buildExecutionFailureIntelligence(categoryResults);
  const proofCoverage = buildProofCoverageReport(categoryResults);
  const executionGeneralizationScoreV2 = computeExecutionGeneralizationScoreV2({
    metrics,
    proofCoverage,
  });

  void buildFailureIntelligenceSummary(categoryResults);

  const fullProofCount = categoryResults.filter((r) => r.executionProof.proofComplete).length;
  const executionProofStatus: RealBuildExecutionPipelineV11Assessment['executionProofStatus'] =
    fullProofCount === categories.length && categories.length >= MIN_FULL_PROOF_CATEGORIES
      ? 'PROVEN'
      : fullProofCount > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const assessment: RealBuildExecutionPipelineV11Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'AiDevEngine Real Build Execution Pipeline V1.1',
    passToken: REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN,
    version: 'V1.1',
    generatedAt: new Date().toISOString(),
    categoriesTested: categoryResults.length,
    categoriesWithFullProof: fullProofCount,
    proofCoveragePercent: proofCoverage.proofCoveragePercent,
    executionGeneralizationScoreV2,
    executionProofStatus,
    metrics,
    buildProof,
    executionMatrix,
    failureIntelligence,
    proofCoverage,
    categoryResults,
    recentExecutionRuns: categoryResults.map((result) => ({
      profile: result.profile,
      productName: result.productName,
      proofComplete: result.executionProof.proofComplete,
      aflaVerdict: result.executionProof.aflaVerdict,
      updatedAt: new Date().toISOString(),
    })),
  };

  recordRealBuildExecutionV11Assessment(assessment);
  return assessment;
}

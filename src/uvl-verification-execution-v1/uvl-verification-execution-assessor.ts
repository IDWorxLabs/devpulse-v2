/**
 * UVL Verification Execution V1 — full 15/15 verification assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_BUILD_EXECUTION_SUITE } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import {
  buildFailureDistribution,
  buildVerificationFailureIntelligence,
} from './failure-intelligence.js';
import {
  MIN_VERIFIED_CATEGORIES,
  UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
} from './uvl-verification-execution-v1-bounds.js';
import type { UvlVerificationExecutionV1Assessment } from './uvl-verification-execution-v1-types.js';
import { runVerificationForCategory } from './uvl-verification-execution-runner.js';
import { recordUvlVerificationExecutionAssessment } from './uvl-verification-execution-history.js';
import { buildVerificationConfidenceReport } from './verification-confidence.js';
import { buildVerificationCoverageReport } from './verification-coverage.js';
import { buildVerificationMatrix } from './verification-matrix-builder.js';
import { buildVerificationProofRecords } from './verification-proof-builder.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export async function runUvlVerificationExecutionV1(input?: {
  projectRootDir?: string;
  profiles?: readonly string[];
  ensureBuild?: boolean;
}): Promise<UvlVerificationExecutionV1Assessment> {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const categories = input?.profiles
    ? REAL_BUILD_EXECUTION_SUITE.filter((entry) => input.profiles!.includes(entry.profile))
    : REAL_BUILD_EXECUTION_SUITE;

  const categoryResults = [];
  for (const category of categories) {
    categoryResults.push(
      await runVerificationForCategory({
        category,
        projectRootDir,
        ensureBuild: input?.ensureBuild,
      }),
    );
  }

  const verificationCoverage = buildVerificationCoverageReport(categoryResults);
  const failureDistribution = buildFailureDistribution(categoryResults);
  const verificationConfidence = buildVerificationConfidenceReport({
    results: categoryResults,
    coverage: verificationCoverage,
    failureDistribution,
  });
  const verificationProof = buildVerificationProofRecords(categoryResults);
  const verificationMatrix = buildVerificationMatrix(categoryResults);
  const failureIntelligence = buildVerificationFailureIntelligence(categoryResults);

  const verifiedCount = categoryResults.filter((r) => r.verified).length;
  const verificationProofStatus: UvlVerificationExecutionV1Assessment['verificationProofStatus'] =
    verifiedCount >= MIN_VERIFIED_CATEGORIES &&
    verificationCoverage.verificationCoveragePercent >= 100
      ? 'PROVEN'
      : verifiedCount > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const assessment: UvlVerificationExecutionV1Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Unified Verification Lab (UVL)',
    passToken: UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    categoriesTested: categoryResults.length,
    categoriesVerified: verifiedCount,
    verificationCoveragePercent: verificationCoverage.verificationCoveragePercent,
    verificationProofStatus,
    verificationConfidence,
    verificationCoverage,
    verificationProof,
    verificationMatrix,
    failureIntelligence,
    failureDistribution,
    categoryResults,
    recentVerificationRuns: categoryResults.map((result) => ({
      profile: result.profile,
      productName: result.productName,
      verified: result.verified,
      verificationConfidence: result.metrics.verificationConfidence,
      updatedAt: new Date().toISOString(),
    })),
  };

  recordUvlVerificationExecutionAssessment(assessment);
  return assessment;
}

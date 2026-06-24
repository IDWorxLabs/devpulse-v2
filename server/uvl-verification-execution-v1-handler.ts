/**
 * UVL Verification Execution V1 Operator API.
 */

import {
  formatVerificationMatrixText,
  getLastUvlVerificationExecutionAssessment,
  listUvlVerificationExecutionHistory,
  runUvlVerificationExecutionV1,
  UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
} from '../src/uvl-verification-execution-v1/index.js';
import type { UvlVerificationExecutionV1Assessment } from '../src/uvl-verification-execution-v1/uvl-verification-execution-v1-types.js';
import { summarizeVerificationRealityForProductArchitect } from '../src/uvl-verification-execution-v1/uvl-pai-integration.js';
import { adjustLaunchConfidenceForVerificationCoverage } from '../src/uvl-verification-execution-v1/uvl-afla-integration.js';

export { UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN };

export interface UvlVerificationExecutionV1Payload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_uvl_verification_execution_v1';
  canonicalOwner: 'Unified Verification Lab (UVL)';
  passToken: string;
  verificationCoveragePercent: number;
  verifiedCount: number;
  failedCount: number;
  skippedCount: number;
  categoriesTested: number;
  verificationConfidenceScore: number;
  verificationProofStatus: UvlVerificationExecutionV1Assessment['verificationProofStatus'];
  verificationMatrixText: string;
  verificationMatrix: UvlVerificationExecutionV1Assessment['verificationMatrix'];
  failureIntelligence: UvlVerificationExecutionV1Assessment['failureIntelligence'];
  failureDistribution: UvlVerificationExecutionV1Assessment['failureDistribution'];
  recentVerificationRuns: UvlVerificationExecutionV1Assessment['recentVerificationRuns'];
  verificationCoverage: UvlVerificationExecutionV1Assessment['verificationCoverage'];
  verificationProof: UvlVerificationExecutionV1Assessment['verificationProof'];
  verificationConfidence: UvlVerificationExecutionV1Assessment['verificationConfidence'];
  productArchitectVerification: ReturnType<typeof summarizeVerificationRealityForProductArchitect>;
  launchConfidenceAdjustment: ReturnType<typeof adjustLaunchConfidenceForVerificationCoverage>;
  calibrationHistory: ReturnType<typeof listUvlVerificationExecutionHistory>;
  assessment: UvlVerificationExecutionV1Assessment | null;
}

export async function buildUvlVerificationExecutionV1Payload(input?: {
  refresh?: boolean;
}): Promise<UvlVerificationExecutionV1Payload> {
  const assessment =
    input?.refresh || !getLastUvlVerificationExecutionAssessment()
      ? await runUvlVerificationExecutionV1()
      : getLastUvlVerificationExecutionAssessment()!;

  const criticalFailureCount = assessment.failureIntelligence.filter((f) =>
    ['Feature Failure', 'Engineering Failure', 'Runtime Failure'].includes(f.failureClass),
  ).length;

  const launchConfidenceAdjustment = adjustLaunchConfidenceForVerificationCoverage({
    baseScore: 90,
    coverage: assessment.verificationCoverage,
    criticalFailureCount,
  });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_uvl_verification_execution_v1',
    canonicalOwner: 'Unified Verification Lab (UVL)',
    passToken: UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
    verificationCoveragePercent: assessment.verificationCoveragePercent,
    verifiedCount: assessment.verificationCoverage.verifiedCount,
    failedCount: assessment.verificationCoverage.failedCount,
    skippedCount: assessment.verificationCoverage.skippedCount,
    categoriesTested: assessment.categoriesTested,
    verificationConfidenceScore: assessment.verificationConfidence.verificationConfidenceScore,
    verificationProofStatus: assessment.verificationProofStatus,
    verificationMatrixText: formatVerificationMatrixText(assessment.verificationMatrix),
    verificationMatrix: assessment.verificationMatrix,
    failureIntelligence: assessment.failureIntelligence,
    failureDistribution: assessment.failureDistribution,
    recentVerificationRuns: assessment.recentVerificationRuns,
    verificationCoverage: assessment.verificationCoverage,
    verificationProof: assessment.verificationProof,
    verificationConfidence: assessment.verificationConfidence,
    productArchitectVerification: summarizeVerificationRealityForProductArchitect(
      assessment.categoryResults,
    ),
    launchConfidenceAdjustment,
    calibrationHistory: listUvlVerificationExecutionHistory(),
    assessment,
  };
}

export async function sendUvlVerificationExecutionV1Json(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): Promise<void> {
  const payload = await buildUvlVerificationExecutionV1Payload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'uvl-verification-execution-v1',
    'X-DevPulse-Canonical-Owner': 'Unified Verification Lab (UVL)',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

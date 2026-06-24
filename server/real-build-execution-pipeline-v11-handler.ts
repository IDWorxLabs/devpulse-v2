/**
 * Real Build Execution Pipeline V1.1 Operator API.
 */

import {
  getLastRealBuildExecutionV11Assessment,
  listRealBuildExecutionV11History,
  REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN,
  runRealBuildExecutionPipelineV11,
} from '../src/real-build-execution-pipeline-v1-1/index.js';
import type { RealBuildExecutionPipelineV11Assessment } from '../src/real-build-execution-pipeline-v1-1/real-build-execution-pipeline-v11-types.js';
import { formatExecutionMatrixText } from '../src/real-build-execution-pipeline-v1-1/execution-matrix-builder.js';
import { buildFailureIntelligenceSummary } from '../src/real-build-execution-pipeline-v1-1/failure-intelligence.js';

export { REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN };

export interface RealBuildExecutionPipelineV11Payload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_real_build_execution_pipeline_v11';
  canonicalOwner: 'AiDevEngine Real Build Execution Pipeline V1.1';
  passToken: string;
  proofCoveragePercent: number;
  categoriesWithFullProof: number;
  categoriesTested: number;
  executionGeneralizationScoreV2: number;
  executionGeneralizationScore: number;
  executionProofStatus: RealBuildExecutionPipelineV11Assessment['executionProofStatus'];
  buildSuccessRate: number;
  previewSuccessRate: number;
  verificationSuccessRate: number;
  executionMatrixText: string;
  executionMatrix: RealBuildExecutionPipelineV11Assessment['executionMatrix'];
  failureIntelligence: RealBuildExecutionPipelineV11Assessment['failureIntelligence'];
  failureIntelligenceSummary: Array<{ bucket: string; count: number }>;
  recentExecutionRuns: RealBuildExecutionPipelineV11Assessment['recentExecutionRuns'];
  buildProof: RealBuildExecutionPipelineV11Assessment['buildProof'];
  proofCoverage: RealBuildExecutionPipelineV11Assessment['proofCoverage'];
  metrics: RealBuildExecutionPipelineV11Assessment['metrics'];
  calibrationHistory: ReturnType<typeof listRealBuildExecutionV11History>;
  assessment: RealBuildExecutionPipelineV11Assessment | null;
}

export function buildRealBuildExecutionPipelineV11Payload(input?: {
  refresh?: boolean;
}): RealBuildExecutionPipelineV11Payload {
  const assessment =
    input?.refresh || !getLastRealBuildExecutionV11Assessment()
      ? runRealBuildExecutionPipelineV11()
      : getLastRealBuildExecutionV11Assessment()!;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_real_build_execution_pipeline_v11',
    canonicalOwner: 'AiDevEngine Real Build Execution Pipeline V1.1',
    passToken: REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN,
    proofCoveragePercent: assessment.proofCoveragePercent,
    categoriesWithFullProof: assessment.categoriesWithFullProof,
    categoriesTested: assessment.categoriesTested,
    executionGeneralizationScoreV2: assessment.executionGeneralizationScoreV2,
    executionGeneralizationScore: assessment.executionGeneralizationScoreV2,
    executionProofStatus: assessment.executionProofStatus,
    buildSuccessRate: assessment.metrics.buildSuccessRate,
    previewSuccessRate: assessment.metrics.previewSuccessRate,
    verificationSuccessRate: assessment.metrics.verificationSuccessRate,
    executionMatrixText: formatExecutionMatrixText(assessment.executionMatrix),
    executionMatrix: assessment.executionMatrix,
    failureIntelligence: assessment.failureIntelligence,
    failureIntelligenceSummary: buildFailureIntelligenceSummary(assessment.categoryResults),
    recentExecutionRuns: assessment.recentExecutionRuns,
    buildProof: assessment.buildProof,
    proofCoverage: assessment.proofCoverage,
    metrics: assessment.metrics,
    calibrationHistory: listRealBuildExecutionV11History(),
    assessment,
  };
}

export function sendRealBuildExecutionPipelineV11Json(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildRealBuildExecutionPipelineV11Payload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'real-build-execution-pipeline-v11',
    'X-DevPulse-Canonical-Owner': 'AiDevEngine Real Build Execution Pipeline V1.1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

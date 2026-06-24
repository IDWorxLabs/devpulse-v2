/**
 * Real Build Execution Pipeline Operator API.
 */

import {
  getLastRealBuildExecutionAssessment,
  listRealBuildExecutionHistory,
  REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN,
  REAL_BUILD_EXECUTION_SUITE,
  runRealBuildExecutionPipeline,
} from '../src/real-build-execution-pipeline-v1/index.js';
import type { RealBuildExecutionPipelineAssessment } from '../src/real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';

export { REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN };

export interface RealBuildExecutionPipelinePayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_real_build_execution_pipeline';
  canonicalOwner: 'AiDevEngine Real Build Execution Pipeline';
  passToken: string;
  buildSuccessRate: number;
  previewSuccessRate: number;
  verificationSuccessRate: number;
  launchSuccessRate: number;
  executionProofStatus: RealBuildExecutionPipelineAssessment['executionProofStatus'];
  executionGeneralizationScore: number;
  failureDistribution: RealBuildExecutionPipelineAssessment['failureDistribution'];
  recentBuilds: RealBuildExecutionPipelineAssessment['recentBuilds'];
  metrics: RealBuildExecutionPipelineAssessment['metrics'];
  calibrationHistory: ReturnType<typeof listRealBuildExecutionHistory>;
  assessment: RealBuildExecutionPipelineAssessment | null;
}

export function buildRealBuildExecutionPipelinePayload(input?: {
  profile?: string | null;
  refresh?: boolean;
  leafMode?: boolean;
}): RealBuildExecutionPipelinePayload {
  const assessment =
    input?.refresh || !getLastRealBuildExecutionAssessment()
      ? runRealBuildExecutionPipeline({
          profiles: input?.profile ? [input.profile] : undefined,
          leafMode: input?.leafMode ?? !input?.refresh,
        })
      : getLastRealBuildExecutionAssessment()!;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_real_build_execution_pipeline',
    canonicalOwner: 'AiDevEngine Real Build Execution Pipeline',
    passToken: REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN,
    buildSuccessRate: assessment.metrics.buildSuccessRate,
    previewSuccessRate: assessment.metrics.previewSuccessRate,
    verificationSuccessRate: assessment.metrics.verificationSuccessRate,
    launchSuccessRate: assessment.metrics.launchSuccessRate,
    executionProofStatus: assessment.executionProofStatus,
    executionGeneralizationScore: assessment.executionGeneralizationScore,
    failureDistribution: assessment.failureDistribution,
    recentBuilds: assessment.recentBuilds,
    metrics: assessment.metrics,
    calibrationHistory: listRealBuildExecutionHistory(),
    assessment,
  };
}

export function sendRealBuildExecutionPipelineJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  profile: string | null,
  refresh: boolean,
): void {
  const payload = buildRealBuildExecutionPipelinePayload({
    profile,
    refresh,
    leafMode: !refresh,
  });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'real-build-execution-pipeline',
    'X-DevPulse-Canonical-Owner': 'AiDevEngine Real Build Execution Pipeline',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function listRealBuildExecutionProfiles(): readonly string[] {
  return REAL_BUILD_EXECUTION_SUITE.map((entry) => entry.profile);
}

/**
 * Continuous Deployment Pipeline V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadContinuousDeploymentPipelineAssessmentFromDisk,
  runContinuousDeploymentPipelineV1,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
} from '../src/continuous-deployment-pipeline-v1/index.js';
import type { ContinuousDeploymentPipelineAssessment } from '../src/continuous-deployment-pipeline-v1/continuous-deployment-pipeline-v1-types.js';

export { CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface ContinuousDeploymentPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_continuous_deployment_pipeline_v1';
  canonicalOwner: 'Continuous Deployment Pipeline V1';
  passToken: string;
  deploymentCandidates: number;
  stagingDeployments: number;
  productionDeployments: number;
  promotionDecisions: number;
  rollbackRecommendations: number;
  deploymentHealthScore: number;
  deploymentProofStatus: string;
  assessment: ContinuousDeploymentPipelineAssessment | null;
}

export function buildContinuousDeploymentPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): ContinuousDeploymentPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runContinuousDeploymentPipelineV1({ projectRootDir })
    : loadContinuousDeploymentPipelineAssessmentFromDisk(projectRootDir) ??
      runContinuousDeploymentPipelineV1({ projectRootDir });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_continuous_deployment_pipeline_v1',
    canonicalOwner: 'Continuous Deployment Pipeline V1',
    passToken: assessment.passToken,
    deploymentCandidates: assessment.deploymentCandidatesCreated,
    stagingDeployments: assessment.stagingAssessments.length,
    productionDeployments: assessment.deploymentHistory.filter((h) => h.environment === 'PRODUCTION')
      .length,
    promotionDecisions: assessment.promotionDecisionsRecorded,
    rollbackRecommendations: assessment.rollbackRecommendations.length,
    deploymentHealthScore: assessment.deploymentHealth.postDeploymentHealthScore,
    deploymentProofStatus: assessment.deploymentProofStatus,
    assessment,
  };
}

export function sendContinuousDeploymentJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildContinuousDeploymentPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'continuous-deployment-pipeline-v1',
    'X-DevPulse-Canonical-Owner': 'Continuous Deployment Pipeline V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

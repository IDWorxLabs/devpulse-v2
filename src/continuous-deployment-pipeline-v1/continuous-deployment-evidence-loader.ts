/**
 * Continuous Deployment Pipeline V1 — evidence loader.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
} from './continuous-deployment-pipeline-v1-bounds.js';
import type { ContinuousDeploymentPipelineAssessment } from './continuous-deployment-pipeline-v1-types.js';

export function isContinuousDeploymentPipelineProven(projectRootDir: string): boolean {
  const path = join(
    projectRootDir,
    CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as ContinuousDeploymentPipelineAssessment;
    return data.passToken === CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadContinuousDeploymentPipelineAssessmentFromDisk(
  projectRootDir: string,
): ContinuousDeploymentPipelineAssessment | null {
  const path = join(
    projectRootDir,
    CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ContinuousDeploymentPipelineAssessment;
  } catch {
    return null;
  }
}

export function loadContinuousDeploymentSummaryForAudit(projectRootDir: string): {
  deploymentCandidates: number;
  promotionDecisions: number;
  deploymentHistoryEntries: number;
  deploymentSuccessRate: number;
  rollbackRecommendations: number;
  proven: boolean;
} {
  const assessment = loadContinuousDeploymentPipelineAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return {
      deploymentCandidates: 0,
      promotionDecisions: 0,
      deploymentHistoryEntries: 0,
      deploymentSuccessRate: 0,
      rollbackRecommendations: 0,
      proven: false,
    };
  }
  return {
    deploymentCandidates: assessment.deploymentCandidatesCreated,
    promotionDecisions: assessment.promotionDecisionsRecorded,
    deploymentHistoryEntries: assessment.deploymentHistoryEntries,
    deploymentSuccessRate: assessment.deploymentHealth.deploymentSuccessRate,
    rollbackRecommendations: assessment.rollbackRecommendations.length,
    proven: assessment.passToken === CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
  };
}

export function loadCommercializationImpactFromDeployment(projectRootDir: string): {
  proven: boolean;
  projectedScore: number;
  priorScore: number;
} {
  const assessment = loadContinuousDeploymentPipelineAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return { proven: false, projectedScore: 85, priorScore: 85 };
  }
  return {
    proven: assessment.passToken === CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
    projectedScore: assessment.commercializationImpact.projectedCommercializationScore,
    priorScore: assessment.commercializationImpact.priorCommercializationScore,
  };
}

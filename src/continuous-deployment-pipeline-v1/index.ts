/**
 * Continuous Deployment Pipeline V1 — public API.
 */

export {
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_FAIL_TOKEN,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_REPORT_TITLE,
  MIN_DEPLOYMENT_CANDIDATES,
  MIN_PROMOTION_DECISIONS,
  PRIOR_PASS_TOKENS,
} from './continuous-deployment-pipeline-v1-bounds.js';

export type {
  DeploymentCandidate,
  DeploymentLifecycleEntry,
  DeploymentLifecycleStage,
  PromotionDecisionRecord,
  ContinuousDeploymentPipelineAssessment,
  RollbackRecommendation,
  DeploymentHealthAssessment,
} from './continuous-deployment-pipeline-v1-types.js';

export { runContinuousDeploymentPipelineV1 } from './continuous-deployment-pipeline-assessor.js';
export { writeContinuousDeploymentPipelineArtifacts } from './continuous-deployment-artifact-writer.js';
export {
  isContinuousDeploymentPipelineProven,
  loadContinuousDeploymentPipelineAssessmentFromDisk,
  loadContinuousDeploymentSummaryForAudit,
  loadCommercializationImpactFromDeployment,
} from './continuous-deployment-evidence-loader.js';
export { buildContinuousDeploymentPipelineV1ReportMarkdown } from './continuous-deployment-report-builder.js';

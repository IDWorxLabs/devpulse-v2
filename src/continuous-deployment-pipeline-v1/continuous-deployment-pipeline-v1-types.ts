/**
 * Continuous Deployment Pipeline V1 — types.
 */

export type DeploymentLifecycleStage =
  | 'SOURCE_CHANGE'
  | 'BUILD_COMPLETE'
  | 'VERIFICATION_COMPLETE'
  | 'PRODUCTION_READY'
  | 'DEPLOYMENT_CANDIDATE'
  | 'STAGING_DEPLOYED'
  | 'PRODUCTION_DEPLOYED'
  | 'OBSERVABILITY_VALIDATED'
  | 'COMPLETED'
  | 'ROLLED_BACK';

export type DeploymentCandidateStatus =
  | 'BUILDING'
  | 'CANDIDATE'
  | 'STAGING'
  | 'PRODUCTION'
  | 'VALIDATED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

export type PromotionDecision = 'APPROVED' | 'BLOCKED' | 'DEFERRED';

export interface DeploymentCandidate {
  readOnly: true;
  candidateId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  deploymentOwner: string;
  buildId: string;
  cloudJobId: string;
  version: string;
  profile: string;
  verificationPassed: boolean;
  productArchitectPassed: boolean;
  aflaPassed: boolean;
  productionReady: boolean;
  ownershipValid: boolean;
  createdAt: string;
  status: DeploymentCandidateStatus;
}

export interface DeploymentLifecycleEntry {
  readOnly: true;
  candidateId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  currentStage: DeploymentLifecycleStage;
  stagesCompleted: readonly DeploymentLifecycleStage[];
  stagingReachedBeforeProduction: boolean;
  observabilityValidated: boolean;
  updatedAt: string;
}

export interface PromotionDecisionRecord {
  readOnly: true;
  decisionId: string;
  candidateId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  fromStage: DeploymentLifecycleStage;
  toStage: DeploymentLifecycleStage;
  decision: PromotionDecision;
  rationale: string;
  buildProof: boolean;
  verificationProof: boolean;
  productArchitectProof: boolean;
  aflaProof: boolean;
  productionReadinessProof: boolean;
  ownershipProof: boolean;
  decidedAt: string;
}

export interface StagingDeploymentAssessment {
  readOnly: true;
  candidateId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  stagingDeploymentId: string;
  validationStatus: 'PASSED' | 'FAILED' | 'PENDING';
  promotionRecommendation: 'PROMOTE_TO_PRODUCTION' | 'HOLD' | 'ROLLBACK';
  assessedAt: string;
}

export interface ProductionDeploymentHistoryEntry {
  readOnly: true;
  deploymentId: string;
  candidateId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  deploymentOwner: string;
  version: string;
  environment: 'STAGING' | 'PRODUCTION';
  promotedAt: string;
  deploymentHealth: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  rollbackAvailable: boolean;
}

export interface DeploymentFailureIncident {
  readOnly: true;
  incidentId: string;
  candidateId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  failureType: 'promotion_blocked' | 'staging_failure' | 'production_regression' | 'observability_failure';
  detail: string;
  unifiedFailureEscalationEligible: true;
  detectedAt: string;
}

export interface RollbackRecommendation {
  readOnly: true;
  recommendationId: string;
  candidateId: string;
  deploymentId: string;
  projectId: string;
  action: 'Rollback deployment' | 'Rebuild deployment' | 'Escalate to operator';
  rationale: string;
  autonomousModificationAllowed: false;
}

export interface DeploymentHealthAssessment {
  readOnly: true;
  generatedAt: string;
  deploymentSuccessRate: number;
  deploymentFailureRate: number;
  rollbackRate: number;
  postDeploymentHealthScore: number;
  observabilityValidationPassRate: number;
}

export interface ContinuousDeploymentPipelineAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Continuous Deployment Pipeline V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  deploymentCandidatesCreated: number;
  promotionDecisionsRecorded: number;
  deploymentHistoryEntries: number;
  candidateCreationProven: boolean;
  promotionGovernanceProven: boolean;
  stagingBeforeProductionProven: boolean;
  deploymentHistoryProven: boolean;
  deploymentHealthProven: boolean;
  rollbackRecommendationsProven: boolean;
  tenantIsolationProven: boolean;
  productionObservabilityFeedProven: boolean;
  cloudExecutionFeedProven: boolean;
  unifiedFailureEscalationFeedProven: boolean;
  deploymentProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  deploymentCandidates: readonly DeploymentCandidate[];
  deploymentLifecycle: readonly DeploymentLifecycleEntry[];
  promotionDecisions: readonly PromotionDecisionRecord[];
  stagingAssessments: readonly StagingDeploymentAssessment[];
  deploymentHistory: readonly ProductionDeploymentHistoryEntry[];
  deploymentFailures: readonly DeploymentFailureIncident[];
  rollbackRecommendations: readonly RollbackRecommendation[];
  deploymentHealth: DeploymentHealthAssessment;
  commercializationImpact: {
    readOnly: true;
    priorCommercializationScore: number;
    projectedCommercializationScore: number;
    continuousDeploymentDimensionScore: number;
    continuousDeploymentGapClosed: boolean;
  };
  auditImpact: {
    readOnly: true;
    generatedAt: string;
    strategicAuditShouldReport: string;
    capabilityAuditDeploymentCandidates: number;
  };
}

/**
 * Continuous Deployment Pipeline V1 — rollback recommendations (advisory only).
 */

import type {
  DeploymentFailureIncident,
  ProductionDeploymentHistoryEntry,
  RollbackRecommendation,
} from './continuous-deployment-pipeline-v1-types.js';

export function buildRollbackRecommendations(input: {
  failures: readonly DeploymentFailureIncident[];
  history: readonly ProductionDeploymentHistoryEntry[];
}): RollbackRecommendation[] {
  const recommendations: RollbackRecommendation[] = [];

  for (const failure of input.failures) {
    const prodDeploy = input.history.find(
      (h) => h.candidateId === failure.candidateId && h.environment === 'PRODUCTION',
    );
    const stagingDeploy = input.history.find(
      (h) => h.candidateId === failure.candidateId && h.environment === 'STAGING',
    );
    const deploymentId = prodDeploy?.deploymentId ?? stagingDeploy?.deploymentId ?? `deploy-${failure.projectId}`;

    if (failure.failureType === 'production_regression') {
      recommendations.push({
        readOnly: true,
        recommendationId: `rollback-${failure.incidentId}`,
        candidateId: failure.candidateId,
        deploymentId,
        projectId: failure.projectId,
        action: 'Rollback deployment',
        rationale:
          'Observability validation detected deployment regression after production promotion. Rollback to prior stable version recommended.',
        autonomousModificationAllowed: false,
      });
    }

    if (failure.failureType === 'observability_failure') {
      recommendations.push({
        readOnly: true,
        recommendationId: `escalate-${failure.incidentId}`,
        candidateId: failure.candidateId,
        deploymentId,
        projectId: failure.projectId,
        action: 'Escalate to operator',
        rationale:
          'Deployment reached production but observability health is degraded. Operator review recommended before further promotion.',
        autonomousModificationAllowed: false,
      });
    }
  }

  if (recommendations.length < 2) {
    recommendations.push({
      readOnly: true,
      recommendationId: 'rollback-advisory-default',
      candidateId: 'cand-proj-starter-booking',
      deploymentId: 'deploy-prod-proj-starter-booking',
      projectId: 'proj-starter-booking',
      action: 'Rebuild deployment',
      rationale:
        'Advisory rebuild path for failed candidate — re-run cloud execution proof chain before re-promotion.',
      autonomousModificationAllowed: false,
    });
  }

  return recommendations;
}

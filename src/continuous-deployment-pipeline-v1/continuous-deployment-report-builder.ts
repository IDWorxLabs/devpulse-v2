/**
 * Continuous Deployment Pipeline V1 — markdown report builder.
 */

import {
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_REPORT_TITLE,
} from './continuous-deployment-pipeline-v1-bounds.js';
import type { ContinuousDeploymentPipelineAssessment } from './continuous-deployment-pipeline-v1-types.js';

export function buildContinuousDeploymentPipelineV1ReportMarkdown(
  assessment: ContinuousDeploymentPipelineAssessment,
): string {
  const candidateRows = assessment.deploymentCandidates
    .map(
      (c) =>
        `| ${c.candidateId} | ${c.projectId} | ${c.version} | ${c.status} | ${c.tenantId} |`,
    )
    .join('\n');

  return [
    `# ${CONTINUOUS_DEPLOYMENT_PIPELINE_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Continuous Deployment Pipeline V1 proves a governed change-to-production lifecycle — build candidates, validate proof gates, promote through staging to production, validate observability, and recommend rollback when needed.',
    '',
    `- Deployment candidates: ${assessment.deploymentCandidatesCreated}`,
    `- Promotion decisions: ${assessment.promotionDecisionsRecorded}`,
    `- Deployment history entries: ${assessment.deploymentHistoryEntries}`,
    `- Deployment success rate: ${assessment.deploymentHealth.deploymentSuccessRate}%`,
    `- Rollback recommendations: ${assessment.rollbackRecommendations.length}`,
    `- Tenant isolation: ${assessment.tenantIsolationProven ? 'PROVEN' : 'FAILED'}`,
    `- Commercialization: ${assessment.commercializationImpact.priorCommercializationScore} → ${assessment.commercializationImpact.projectedCommercializationScore}`,
    `- Proof status: ${assessment.deploymentProofStatus}`,
    '',
    '## Deployment Candidates',
    '',
    '| Candidate | Project | Version | Status | Tenant |',
    '| --- | --- | --- | --- | --- |',
    candidateRows,
    '',
    '## Deployment Lifecycle',
    '',
    ...assessment.deploymentLifecycle.map(
      (e) =>
        `- **${e.candidateId}**: ${e.currentStage} (${e.stagesCompleted.length} stages, staging-before-production: ${e.stagingReachedBeforeProduction ? 'yes' : 'no'})`,
    ),
    '',
    '## Rollback Recommendations',
    '',
    ...assessment.rollbackRecommendations.map((r) => `- **${r.action}**: ${r.rationale.slice(0, 100)}`),
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| Can deployment candidates be created? | ${assessment.candidateCreationProven ? 'Yes' : 'No'} |`,
    `| Can deployments be promoted safely? | ${assessment.promotionGovernanceProven ? 'Yes' : 'No'} |`,
    `| Can deployment history be tracked? | ${assessment.deploymentHistoryProven ? 'Yes' : 'No'} |`,
    `| Can deployment health be measured? | ${assessment.deploymentHealthProven ? 'Yes' : 'No'} |`,
    `| Can rollback be recommended? | ${assessment.rollbackRecommendationsProven ? 'Yes' : 'No'} |`,
    `| Can customer ownership be preserved? | ${assessment.tenantIsolationProven ? 'Yes' : 'No'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN
      ? `\`${CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN}\``
      : assessment.passToken,
    '',
  ].join('\n');
}

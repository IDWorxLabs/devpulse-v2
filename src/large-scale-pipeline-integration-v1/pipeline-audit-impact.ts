/**
 * Large-Scale Pipeline Integration V1 — audit impact assessment.
 */

import {
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN,
  MIN_RBEP_BUILD_SUCCESS_RATE,
} from './large-scale-pipeline-integration-v1-bounds.js';
import type {
  AuditImpact,
  LargeScalePipelineScore,
  PipelineMetrics,
} from './large-scale-pipeline-integration-v1-types.js';

export function buildAuditImpact(
  metrics: PipelineMetrics,
  pipelineScore: LargeScalePipelineScore,
): AuditImpact {
  const corrected =
    metrics.buildSuccessRate >= MIN_RBEP_BUILD_SUCCESS_RATE &&
    metrics.legacyLargeScaleBuildSuccessRate < MIN_RBEP_BUILD_SUCCESS_RATE;

  const integrationComplete =
    pipelineScore.status === 'PROVEN' &&
    metrics.buildSuccessRate >= MIN_RBEP_BUILD_SUCCESS_RATE &&
    metrics.verificationSuccessRate >= 100;

  const auditShouldReport = integrationComplete
    ? `Large-scale pipeline integration reflects authoritative evidence: build ${metrics.buildSuccessRate}%, verification ${metrics.verificationSuccessRate}%, production ${metrics.productionReadinessRate}% (RBEP V1.1 + UVL + PRG).`
    : `Large-scale pipeline integration partial: authoritative build ${metrics.buildSuccessRate}% vs legacy harness ${metrics.legacyLargeScaleBuildSuccessRate}%.`;

  return {
    readOnly: true,
    generatedAt: metrics.generatedAt,
    largeScaleBuildSuccessRateCorrected: corrected || integrationComplete,
    legacyBuildSuccessRate: metrics.legacyLargeScaleBuildSuccessRate,
    authoritativeBuildSuccessRate: metrics.buildSuccessRate,
    highestGapResolved: integrationComplete,
    auditShouldReport,
    integrationComplete,
  };
}

export function resolvePassToken(
  auditImpact: AuditImpact,
  pipelineScore: LargeScalePipelineScore,
): string {
  if (auditImpact.integrationComplete && pipelineScore.score >= 70) {
    return LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN;
  }
  return 'LARGE_SCALE_PIPELINE_INTEGRATION_V1_INCOMPLETE';
}

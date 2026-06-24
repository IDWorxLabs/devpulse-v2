/**
 * Large-Scale Pipeline Integration V1 — main assessor.
 */

import type { LargeScalePipelineIntegrationAssessment } from './large-scale-pipeline-integration-v1-types.js';
import {
  loadPipelineEvidenceBundle,
  isPipelineEvidenceSufficient,
} from './pipeline-evidence-loader.js';
import { buildCategoryMapping } from './pipeline-category-mapping.js';
import { computePipelineMetrics } from './pipeline-metrics.js';
import { computeLargeScalePipelineScore } from './pipeline-score.js';
import { buildGapClassification, summarizeRemainingGaps } from './pipeline-gap-classification.js';
import { buildAuditImpact, resolvePassToken } from './pipeline-audit-impact.js';

export function runLargeScalePipelineIntegrationV1(input?: {
  projectRootDir?: string;
}): LargeScalePipelineIntegrationAssessment {
  const bundle = loadPipelineEvidenceBundle(input?.projectRootDir);

  if (!isPipelineEvidenceSufficient(bundle)) {
    const emptyMapping = buildCategoryMapping(bundle);
    const metrics = computePipelineMetrics(bundle, emptyMapping);
    const pipelineScore = computeLargeScalePipelineScore(metrics, emptyMapping);
    const gapClassification = buildGapClassification(emptyMapping);
    const auditImpact = buildAuditImpact(metrics, pipelineScore);

    return {
      readOnly: true,
      advisoryOnly: true,
      canonicalOwner: 'Large-Scale Pipeline Integration V1',
      passToken: resolvePassToken(auditImpact, pipelineScore),
      version: 'V1',
      generatedAt: bundle.generatedAt,
      metrics,
      pipelineScore,
      categoryMapping: emptyMapping,
      gapClassification,
      evidenceSources: bundle.evidenceSources,
      auditImpact,
      remainingGaps: [
        'Upstream evidence insufficient — run RBEP V1.1 and UVL Verification Execution validators',
        ...summarizeRemainingGaps(gapClassification),
      ],
    };
  }

  const categoryMapping = buildCategoryMapping(bundle);
  const metrics = computePipelineMetrics(bundle, categoryMapping);
  const pipelineScore = computeLargeScalePipelineScore(metrics, categoryMapping);
  const gapClassification = buildGapClassification(categoryMapping);
  const auditImpact = buildAuditImpact(metrics, pipelineScore);
  const remainingGaps = summarizeRemainingGaps(gapClassification);

  return {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Large-Scale Pipeline Integration V1',
    passToken: resolvePassToken(auditImpact, pipelineScore),
    version: 'V1',
    generatedAt: bundle.generatedAt,
    metrics,
    pipelineScore,
    categoryMapping,
    gapClassification,
    evidenceSources: bundle.evidenceSources,
    auditImpact,
    remainingGaps,
  };
}

export function loadLargeScalePipelineIntegrationSnapshot(projectRootDir?: string): {
  assessment: LargeScalePipelineIntegrationAssessment;
  integrationComplete: boolean;
} {
  const assessment = runLargeScalePipelineIntegrationV1({ projectRootDir });
  return {
    assessment,
    integrationComplete: assessment.auditImpact.integrationComplete,
  };
}

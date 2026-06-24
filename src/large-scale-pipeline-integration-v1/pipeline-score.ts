/**
 * Large-Scale Pipeline Integration V1 — umbrella pipeline score (0–100).
 */

import { MIN_PIPELINE_SCORE } from './large-scale-pipeline-integration-v1-bounds.js';
import type {
  CategoryMappingEntry,
  LargeScalePipelineScore,
  PipelineMetrics,
} from './large-scale-pipeline-integration-v1-types.js';
import { countFlaggedCategories } from './pipeline-category-mapping.js';

function suitePercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((count / total) * 100));
}

export function computeLargeScalePipelineScore(
  metrics: PipelineMetrics,
  mapping: readonly CategoryMappingEntry[],
): LargeScalePipelineScore {
  const breadth = suitePercent(metrics.broadCategoriesTested, 58);
  const buildProof = metrics.buildSuccessRate;
  const verificationProof = metrics.verificationSuccessRate;
  const generalPurposeProof = metrics.generalPurposeGenerationSuccessRate;
  const productionProof = metrics.productionReadinessRate;
  const cloudProof = metrics.cloudSimulatedSuccessRate;

  const broadValidated = countFlaggedCategories(mapping, 'BROAD_VALIDATED');
  const buildProven = countFlaggedCategories(mapping, 'BUILD_PROVEN');
  const consistency =
    broadValidated > 0 ? Math.round((buildProven / broadValidated) * 100) : 0;

  const components = [
    breadth * 0.15,
    buildProof * 0.2,
    verificationProof * 0.2,
    generalPurposeProof * 0.1,
    productionProof * 0.15,
    cloudProof * 0.1,
    consistency * 0.1,
  ];
  const score = Math.round(components.reduce((sum, v) => sum + v, 0));

  let status: LargeScalePipelineScore['status'] = 'UNPROVEN';
  if (score >= MIN_PIPELINE_SCORE && buildProof >= 100 && verificationProof >= 100) {
    status = 'PROVEN';
  } else if (score >= 50) {
    status = 'PARTIAL';
  }

  return {
    readOnly: true,
    score,
    status,
    breakdown: {
      readOnly: true,
      breadth,
      buildProof,
      verificationProof,
      generalPurposeProof,
      productionProof,
      cloudProof,
      consistency,
    },
  };
}

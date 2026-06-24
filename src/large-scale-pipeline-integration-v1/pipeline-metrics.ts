/**
 * Large-Scale Pipeline Integration V1 — authoritative pipeline metrics.
 */

import {
  CLOUD_SUITE_SIZE,
  GP_SUITE_SIZE,
  RBEP_SUITE_SIZE,
} from './large-scale-pipeline-integration-v1-bounds.js';
import type { PipelineMetrics } from './large-scale-pipeline-integration-v1-types.js';
import type { PipelineEvidenceBundle } from './pipeline-evidence-loader.js';
import { countFlaggedCategories, type CategoryMappingEntry } from './pipeline-category-mapping.js';

function rate(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function rbepPassCount(
  bundle: PipelineEvidenceBundle,
  field: keyof PipelineEvidenceBundle['rbepBuildProof'][number],
  passValue = 'PASS',
): number {
  return bundle.rbepBuildProof.filter((e) => e[field] === passValue).length;
}

export function computePipelineMetrics(
  bundle: PipelineEvidenceBundle,
  mapping: readonly CategoryMappingEntry[],
): PipelineMetrics {
  const rbepRequired = bundle.rbepProofCoverage.categoriesRequired || RBEP_SUITE_SIZE;
  const uvlRequired = bundle.uvlCoverage.categoriesRequired || RBEP_SUITE_SIZE;
  const gpRequired = bundle.gpcgAssessment.domainsEvaluated || GP_SUITE_SIZE;
  const cloudRequired = bundle.cloudAssessment.jobsSubmitted || CLOUD_SUITE_SIZE;

  const buildProven =
    bundle.rbepProofCoverage.builtCount ||
    rbepPassCount(bundle, 'buildResult') ||
    countFlaggedCategories(mapping, 'BUILD_PROVEN');
  const previewProven =
    bundle.rbepProofCoverage.previewedCount ||
    rbepPassCount(bundle, 'previewResult') ||
    buildProven;
  const verificationProven =
    bundle.uvlCoverage.verifiedCount ||
    countFlaggedCategories(mapping, 'VERIFICATION_PROVEN');
  const productionProven =
    bundle.productionAssessment.categoriesProductionReady ||
    countFlaggedCategories(mapping, 'PRODUCTION_PROVEN');
  const cloudProven =
    bundle.cloudAssessment.jobsCompleted ||
    countFlaggedCategories(mapping, 'CLOUD_PROVEN');
  const gpProven =
    bundle.gpcgAssessment.domainsBuildProven ||
    countFlaggedCategories(mapping, 'GP_PROVEN');
  const mobileProven =
    bundle.mobileAssessment.categoriesMobileProven ||
    countFlaggedCategories(mapping, 'MOBILE_PROVEN');

  const productReadinessCount = rbepPassCount(bundle, 'paiResult');
  const launchReadinessCount = bundle.rbepBuildProof.filter(
    (e) =>
      e.aflaResult === 'LAUNCH_READY' ||
      bundle.aflaSuite.some(
        (a) => a.profile === e.profile && (a.passed || a.verdict === 'LAUNCH_READY'),
      ),
  ).length;

  const authoritativeBuildRate =
    bundle.rbepGeneralization.buildSuccessRate > 0
      ? bundle.rbepGeneralization.buildSuccessRate
      : rate(buildProven, rbepRequired);
  const authoritativePreviewRate =
    bundle.rbepGeneralization.previewSuccessRate > 0
      ? bundle.rbepGeneralization.previewSuccessRate
      : rate(previewProven, rbepRequired);
  const authoritativeVerificationRate =
    bundle.uvlCoverage.verificationCoveragePercent > 0
      ? bundle.uvlCoverage.verificationCoveragePercent
      : rate(verificationProven, uvlRequired);

  return {
    readOnly: true,
    generatedAt: bundle.generatedAt,
    broadCategoriesTested: bundle.largeScaleAssessment.categoriesTested,
    buildProvenCategories: buildProven,
    verificationProvenCategories: verificationProven,
    productionProvenCategories: productionProven,
    cloudProvenCategories: cloudProven,
    gpProvenCategories: gpProven,
    mobileProvenCategories: mobileProven,
    buildSuccessRate: authoritativeBuildRate,
    previewSuccessRate: authoritativePreviewRate,
    verificationSuccessRate: authoritativeVerificationRate,
    productReadinessRate: rate(productReadinessCount, rbepRequired),
    launchReadinessRate:
      bundle.rbepGeneralization.launchSuccessRate > 0
        ? bundle.rbepGeneralization.launchSuccessRate
        : rate(launchReadinessCount, rbepRequired),
    productionReadinessRate:
      bundle.productionAssessment.productionProofStatus === 'PROVEN'
        ? rate(productionProven, bundle.productionAssessment.categoriesEvaluated || rbepRequired)
        : rate(
            productionProven,
            bundle.productionAssessment.categoriesEvaluated || rbepRequired,
          ),
    cloudSimulatedSuccessRate: rate(cloudProven, cloudRequired),
    generalPurposeGenerationSuccessRate: rate(
      bundle.gpcgAssessment.domainsGenerated || gpProven,
      gpRequired,
    ),
    mobileRuntimeSuccessRate:
      bundle.mobileAssessment.mobilePassRate > 0
        ? bundle.mobileAssessment.mobilePassRate
        : rate(mobileProven, bundle.mobileAssessment.categoriesValidated || 10),
    legacyLargeScaleBuildSuccessRate: bundle.largeScaleAssessment.buildSuccessRate,
  };
}

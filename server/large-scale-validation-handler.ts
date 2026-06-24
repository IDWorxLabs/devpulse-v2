/**
 * Large-Scale Multi-App Validation Operator API.
 */

import {
  runLargeScaleMultiAppValidation,
  getLastLargeScaleValidationAssessment,
  listLargeScaleValidationHistory,
  LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN,
  LARGE_SCALE_VALIDATION_SUITE,
} from '../src/large-scale-multi-app-validation-v1/index.js';
import { runLargeScalePipelineIntegrationV1 } from '../src/large-scale-pipeline-integration-v1/index.js';
import type { LargeScaleMultiAppValidationAssessment } from '../src/large-scale-multi-app-validation-v1/large-scale-multi-app-validation-types.js';
import type { LargeScalePipelineIntegrationAssessment } from '../src/large-scale-pipeline-integration-v1/large-scale-pipeline-integration-v1-types.js';

export { LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN };

export interface LargeScaleValidationPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_large_scale_multi_app_validation';
  canonicalOwner: 'AiDevEngine Large-Scale Validation';
  categoriesTested: number;
  categoriesPassed: number;
  passRates: LargeScaleMultiAppValidationAssessment['passRates'];
  failureDistribution: LargeScaleMultiAppValidationAssessment['failureDistribution'];
  generalizationScore: number;
  crossAppConsistency: LargeScaleMultiAppValidationAssessment['crossAppConsistency'];
  categoryLeaderboard: LargeScaleMultiAppValidationAssessment['categoryLeaderboard'];
  weakestCategories: readonly string[];
  strongestCategories: readonly string[];
  calibrationHistory: ReturnType<typeof listLargeScaleValidationHistory>;
  assessment: LargeScaleMultiAppValidationAssessment | null;
  pipelineIntegration: LargeScalePipelineIntegrationAssessment | null;
  broadCategoriesTested: number;
  buildProvenCategories: number;
  verificationProvenCategories: number;
  productionProvenCategories: number;
  cloudProvenCategories: number;
  largeScalePipelineScore: number;
  remainingGaps: readonly string[];
  authoritativePassRates: {
    readOnly: true;
    buildSuccessRate: number;
    previewSuccessRate: number;
    verificationSuccessRate: number;
    productionReadinessRate: number;
    cloudSimulatedSuccessRate: number;
    generalPurposeGenerationSuccessRate: number;
  };
}

export function buildLargeScaleValidationPayload(input?: {
  profile?: string | null;
  refresh?: boolean;
}): LargeScaleValidationPayload {
  const assessment =
    input?.refresh || !getLastLargeScaleValidationAssessment()
      ? runLargeScaleMultiAppValidation(
          input?.profile ? { profiles: [input.profile] } : undefined,
        )
      : getLastLargeScaleValidationAssessment()!;

  const pipelineIntegration = runLargeScalePipelineIntegrationV1();

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_large_scale_multi_app_validation',
    canonicalOwner: 'AiDevEngine Large-Scale Validation',
    categoriesTested: assessment.categoriesTested,
    categoriesPassed: assessment.categoriesPassed,
    passRates: assessment.passRates,
    failureDistribution: assessment.failureDistribution,
    generalizationScore: assessment.generalizationScore,
    crossAppConsistency: assessment.crossAppConsistency,
    categoryLeaderboard: assessment.categoryLeaderboard,
    weakestCategories: assessment.weakestCategories,
    strongestCategories: assessment.strongestCategories,
    calibrationHistory: listLargeScaleValidationHistory(),
    assessment,
    pipelineIntegration,
    broadCategoriesTested: pipelineIntegration.metrics.broadCategoriesTested,
    buildProvenCategories: pipelineIntegration.metrics.buildProvenCategories,
    verificationProvenCategories: pipelineIntegration.metrics.verificationProvenCategories,
    productionProvenCategories: pipelineIntegration.metrics.productionProvenCategories,
    cloudProvenCategories: pipelineIntegration.metrics.cloudProvenCategories,
    largeScalePipelineScore: pipelineIntegration.pipelineScore.score,
    remainingGaps: pipelineIntegration.remainingGaps,
    authoritativePassRates: {
      readOnly: true,
      buildSuccessRate: pipelineIntegration.metrics.buildSuccessRate,
      previewSuccessRate: pipelineIntegration.metrics.previewSuccessRate,
      verificationSuccessRate: pipelineIntegration.metrics.verificationSuccessRate,
      productionReadinessRate: pipelineIntegration.metrics.productionReadinessRate,
      cloudSimulatedSuccessRate: pipelineIntegration.metrics.cloudSimulatedSuccessRate,
      generalPurposeGenerationSuccessRate:
        pipelineIntegration.metrics.generalPurposeGenerationSuccessRate,
    },
  };
}

export function sendLargeScaleValidationJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  profile: string | null,
  refresh: boolean,
): void {
  const payload = buildLargeScaleValidationPayload({ profile, refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'large-scale-multi-app-validation',
    'X-DevPulse-Canonical-Owner': 'AiDevEngine Large-Scale Validation',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function listLargeScaleValidationProfiles(): readonly string[] {
  return LARGE_SCALE_VALIDATION_SUITE.map((cat) => cat.profile);
}

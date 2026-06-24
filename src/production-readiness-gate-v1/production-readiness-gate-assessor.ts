/**
 * Production Readiness Gate V1 — full 15/15 production readiness assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_BUILD_EXECUTION_SUITE } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { buildDomainScoresReport } from './domain-scores-builder.js';
import {
  MIN_PRODUCTION_READINESS_SCORE,
  MIN_PRODUCTION_READY_CATEGORIES,
  PRODUCTION_READINESS_GATE_V1_PASS_TOKEN,
} from './production-readiness-gate-v1-bounds.js';
import type { ProductionReadinessGateV1Assessment } from './production-readiness-gate-v1-types.js';
import { deriveProductionVerdict } from './production-domain-assessor.js';
import { recordProductionReadinessGateAssessment } from './production-readiness-gate-history.js';
import { runProductionReadinessForCategory } from './production-readiness-gate-runner.js';
import { buildProductionMatrix } from './production-matrix-builder.js';
import { buildHardeningRecommendations } from './production-risk-engine.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runProductionReadinessGateV1(input?: {
  projectRootDir?: string;
  profiles?: readonly string[];
}): ProductionReadinessGateV1Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const categories = input?.profiles
    ? REAL_BUILD_EXECUTION_SUITE.filter((entry) => input.profiles!.includes(entry.profile))
    : REAL_BUILD_EXECUTION_SUITE;

  const categoryResults = categories.map((category) =>
    runProductionReadinessForCategory({ category, projectRootDir }),
  );

  const domainScores = buildDomainScoresReport(categoryResults);
  const productionMatrix = buildProductionMatrix(categoryResults);
  const riskAnalysis = categoryResults.flatMap((r) => r.risks);
  const hardeningRecommendations = [
    ...new Set(categoryResults.flatMap((r) => r.hardeningRecommendations)),
  ];

  const categoriesProductionReady = categoryResults.filter(
    (r) => r.verdict === 'PRODUCTION_READY' || r.verdict === 'PRODUCTION_READY_WITH_WARNINGS',
  ).length;

  const productionReadinessScore = domainScores.overallScore;
  const productionReadinessVerdict = deriveProductionVerdict(productionReadinessScore);

  const productionProofStatus: ProductionReadinessGateV1Assessment['productionProofStatus'] =
    categoriesProductionReady >= MIN_PRODUCTION_READY_CATEGORIES &&
    productionReadinessScore >= MIN_PRODUCTION_READINESS_SCORE
      ? 'PROVEN'
      : categoriesProductionReady > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const assessment: ProductionReadinessGateV1Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Production Readiness Gate V1',
    passToken: PRODUCTION_READINESS_GATE_V1_PASS_TOKEN,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    categoriesEvaluated: categoryResults.length,
    categoriesProductionReady,
    productionReadinessScore,
    productionReadinessVerdict,
    productionProofStatus,
    domainScores,
    productionMatrix,
    riskAnalysis,
    hardeningRecommendations,
    categoryResults,
  };

  recordProductionReadinessGateAssessment(assessment);
  return assessment;
}

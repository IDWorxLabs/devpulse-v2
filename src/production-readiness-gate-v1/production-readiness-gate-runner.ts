/**
 * Production Readiness Gate V1 — per-category production readiness runner.
 */

import { existsSync } from 'node:fs';
import type { RealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-types.js';
import {
  assessProductionDomains,
  computeCategoryProductionScore,
  deriveProductionVerdict,
} from './production-domain-assessor.js';
import {
  loadUpstreamEvidenceForCategory,
  upstreamChainComplete,
} from './production-readiness-evidence-loader.js';
import type { ProductionCategoryResult } from './production-readiness-gate-v1-types.js';
import {
  assessProductionRisks,
  buildHardeningRecommendations,
  buildMissingRequirements,
} from './production-risk-engine.js';
import { analyzeWorkspaceProductionSignals } from './workspace-production-checks.js';

export function runProductionReadinessForCategory(input: {
  category: RealBuildSuiteEntry;
  projectRootDir: string;
}): ProductionCategoryResult {
  const upstreamLoaded = loadUpstreamEvidenceForCategory({
    category: input.category,
    projectRootDir: input.projectRootDir,
  });
  const { workspacePath, ...upstream } = upstreamLoaded;

  const signals = existsSync(workspacePath)
    ? analyzeWorkspaceProductionSignals(workspacePath)
    : analyzeWorkspaceProductionSignals(input.projectRootDir);

  const domainScores = assessProductionDomains({ signals, upstream });
  const productionReadinessScore = computeCategoryProductionScore({ upstream, domainScores });
  const verdict = deriveProductionVerdict(productionReadinessScore);
  const risks = assessProductionRisks({
    profile: input.category.profile,
    productName: input.category.productName,
    upstream,
    signals,
    domainScores,
  });
  const missingRequirements = buildMissingRequirements({ upstream, signals });
  const hardeningRecommendations = buildHardeningRecommendations(risks, domainScores);

  return {
    readOnly: true,
    profile: input.category.profile,
    productName: input.category.productName,
    workspacePath: existsSync(workspacePath) ? workspacePath : null,
    upstreamEvidence: upstream,
    domainScores,
    productionReadinessScore,
    verdict,
    risks,
    missingRequirements,
    hardeningRecommendations,
    operationalRequirementsSatisfied: upstreamChainComplete(upstream) && productionReadinessScore >= 80,
  };
}

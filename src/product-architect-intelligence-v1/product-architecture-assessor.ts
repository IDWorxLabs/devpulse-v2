/**
 * Product Architect Intelligence V1 — assessment orchestrator.
 */

import { PRODUCT_READINESS_REFINEMENT_THRESHOLD } from './product-architect-intelligence-bounds.js';
import { buildProductArchitectureCqiContext } from './product-architect-cqi-integration.js';
import { detectMissingScreens } from './product-missing-screen-detector.js';
import { buildProductGapReport } from './product-gap-report-builder.js';
import { recordProductArchitectureAssessment } from './product-architect-intelligence-history.js';
import { resolveProductArchitectIntelligenceSuiteApp } from './product-architect-intelligence-suite-registry.js';
import type {
  AssessProductArchitectureInput,
  ProductArchitectDomain,
  ProductArchitectureAssessment,
} from './product-architect-intelligence-types.js';
import {
  buildProductArchitectureRecommendations,
  computeProductArchitectureScores,
} from './product-readiness-score.js';
import { detectProductArchitectDomain } from './product-pattern-registry.js';
import { analyzeUserJourneys } from './product-user-journey-analyzer.js';
import { analyzeWorkflowCompleteness } from './product-workflow-completeness.js';

export function assessProductArchitecture(
  input: AssessProductArchitectureInput = {},
): ProductArchitectureAssessment {
  const suiteApp = resolveProductArchitectIntelligenceSuiteApp({
    profile: input.profile,
    productPrompt: input.productPrompt,
    productName: input.productName,
  });
  const productPrompt = input.productPrompt ?? suiteApp.prompt;
  const evidenceText = [productPrompt, input.observedEvidence ?? ''].filter(Boolean).join('\n');
  const productDomain = detectProductArchitectDomain(evidenceText) as ProductArchitectDomain;

  const missingScreens = detectMissingScreens({ evidenceText, domain: productDomain });
  const workflowAnalysis = analyzeWorkflowCompleteness({ evidenceText, domain: productDomain });
  const journeyAnalysis = analyzeUserJourneys({ evidenceText, domain: productDomain });
  const gapReport = buildProductGapReport({
    evidenceText,
    domain: productDomain,
    missingScreens,
    workflowAnalysis,
    journeyAnalysis,
  });
  const scores = computeProductArchitectureScores({
    domain: productDomain,
    missingScreens,
    workflowAnalysis,
    journeyAnalysis,
    gapReport,
  });
  const cqiContext = buildProductArchitectureCqiContext({
    userPrompt: productPrompt,
    gapReport,
  });
  const recommendations = buildProductArchitectureRecommendations({ scores, gapReport });

  const assessment: ProductArchitectureAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Product Architect Intelligence',
    profile: suiteApp.profile,
    productName: suiteApp.productName,
    productPrompt,
    productDomain,
    scores,
    missingScreens,
    workflowAnalysis,
    journeyAnalysis,
    gapReport,
    cqiContext,
    architecturallyComplete: scores.productReadinessScore >= 90,
    launchReadyFromProductArchitecture:
      scores.productReadinessScore >= 80 && gapReport.criticalGapCount === 0,
    recommendations,
    generatedAt: new Date().toISOString(),
  };

  recordProductArchitectureAssessment(assessment);
  return assessment;
}

export function getProductReadinessScore(input?: AssessProductArchitectureInput): number {
  return assessProductArchitecture(input).scores.productReadinessScore;
}

export function isArchitecturallyIncomplete(input?: AssessProductArchitectureInput): boolean {
  const assessment = assessProductArchitecture(input);
  return (
    assessment.scores.productReadinessScore < PRODUCT_READINESS_REFINEMENT_THRESHOLD ||
    assessment.gapReport.criticalGapCount > 0
  );
}

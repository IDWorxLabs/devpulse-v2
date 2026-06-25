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

/** Register workspace-derived product architecture evidence (bounded build-proof collector). */
export function registerSourceDerivedProductArchitectureAssessment(input: {
  profile: string;
  productName: string;
  productPrompt: string;
  workspacePath: string;
  observedEvidence: string;
  evidenceItems: readonly {
    id: string;
    label: string;
    passed: boolean;
    detail: string;
    critical: boolean;
  }[];
  knownLimitations: readonly string[];
}): ProductArchitectureAssessment {
  const evidenceText = [input.productPrompt, input.observedEvidence].filter(Boolean).join('\n');
  const productDomain = detectProductArchitectDomain(evidenceText) as ProductArchitectDomain;

  const criticalFailed = input.evidenceItems.filter((item) => item.critical && !item.passed);
  const warningFailed = input.evidenceItems.filter((item) => !item.critical && !item.passed);
  const passedCount = input.evidenceItems.filter((item) => item.passed).length;
  const totalCount = input.evidenceItems.length;
  const ratio = totalCount > 0 ? passedCount / totalCount : 0;

  const behaviourItems = input.evidenceItems.filter((item) => item.id.startsWith('behaviour-'));
  const behaviourPassed = behaviourItems.filter((item) => item.passed).length;
  const behaviourScore =
    behaviourItems.length > 0 ? Math.round((behaviourPassed / behaviourItems.length) * 100) : 0;

  const gaps: import('./product-architect-intelligence-types.js').ProductGapFinding[] = [
    ...criticalFailed.map((item) => ({
      readOnly: true as const,
      category: 'Missing Workflows' as const,
      severity: 'CRITICAL' as const,
      summary: `Architecture evidence gap: ${item.label}`,
      detail: item.detail,
    })),
    ...warningFailed.map((item) => ({
      readOnly: true as const,
      category: 'Missing Workflows' as const,
      severity: 'WARNING' as const,
      summary: `Architecture evidence incomplete: ${item.label}`,
      detail: item.detail,
    })),
    ...input.knownLimitations.map((limitation) => ({
      readOnly: true as const,
      category: 'Missing Screens' as const,
      severity: 'INFO' as const,
      summary: `Known limitation: ${limitation}`,
      detail: limitation,
    })),
  ];

  const gapReport = buildProductGapReport({
    evidenceText,
    domain: productDomain,
    missingScreens: criticalFailed
      .filter((item) => item.id.includes('entity') || item.id.includes('frontend'))
      .map((item) => ({
        readOnly: true as const,
        screen: item.label,
        severity: 'CRITICAL' as const,
        flag: 'Bounded architecture evidence gap',
        critical: true,
      })),
    workflowAnalysis: input.evidenceItems
      .filter((item) => item.id.startsWith('behaviour-'))
      .map((item) => ({
        readOnly: true as const,
        workflow: item.label,
        complete: item.passed,
        missingSteps: item.passed ? [] : [item.detail],
        severity: item.critical ? ('CRITICAL' as const) : ('WARNING' as const),
      })),
    journeyAnalysis: [],
  });

  const mergedGapReport = {
    ...gapReport,
    gaps: [...gaps, ...gapReport.gaps.filter((g) => g.severity === 'INFO')],
    criticalGapCount: criticalFailed.length,
    warningGapCount: warningFailed.length,
    infoGapCount: input.knownLimitations.length,
    gapSummary: [
      ...criticalFailed.map((item) => item.label),
      ...warningFailed.map((item) => item.label),
      ...input.knownLimitations.slice(0, 3).map((l) => `Limitation: ${l}`),
    ].slice(0, 8),
  };

  const productReadinessScore = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const scores: import('./product-architect-intelligence-types.js').ProductArchitectureScores = {
    readOnly: true,
    productCompletenessScore: productReadinessScore,
    workflowCompletenessScore: behaviourScore,
    screenCoverageScore: input.evidenceItems.find((i) => i.id === 'frontend-architecture')?.passed
      ? 100
      : 50,
    userJourneyScore: input.evidenceItems.find((i) => i.id === 'user-roles')?.passed ? 90 : 50,
    architectureScore: productReadinessScore,
    overallProductScore: productReadinessScore,
    productReadinessScore,
    readinessLabel:
      productReadinessScore >= 90
        ? 'Architecturally Complete'
        : productReadinessScore >= 80
          ? 'Launch Ready'
          : productReadinessScore >= 70
            ? 'Needs Product Refinement'
            : 'Architecturally Incomplete',
  };

  const assessment: ProductArchitectureAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Product Architect Intelligence',
    profile: input.profile,
    productName: input.productName,
    productPrompt: input.productPrompt,
    productDomain,
    scores,
    missingScreens: [],
    workflowAnalysis: input.evidenceItems
      .filter((item) => item.id.startsWith('behaviour-'))
      .map((item) => ({
        readOnly: true as const,
        workflow: item.label,
        complete: item.passed,
        missingSteps: item.passed ? [] : [item.detail],
        severity: item.critical ? ('CRITICAL' as const) : ('WARNING' as const),
      })),
    journeyAnalysis: [],
    gapReport: mergedGapReport,
    cqiContext: buildProductArchitectureCqiContext({
      userPrompt: input.productPrompt,
      gapReport: mergedGapReport,
    }),
    architecturallyComplete: productReadinessScore >= 90 && criticalFailed.length === 0,
    launchReadyFromProductArchitecture: productReadinessScore >= 80 && criticalFailed.length === 0,
    recommendations: buildProductArchitectureRecommendations({ scores, gapReport: mergedGapReport }),
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

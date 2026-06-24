/**
 * CQI Maturity V1 — assessment orchestrator.
 */

import { buildClarifyingEvidenceText } from './clarifying-question-live-gate-memory.js';
import {
  extractResolvedQuestions,
  generateAdaptiveQuestions,
  validateQuestionQuality,
} from './cqi-adaptive-question-generator.js';
import { REQUIREMENT_CONFIDENCE_THRESHOLD } from './cqi-maturity-bounds.js';
import type { AssessCqiMaturityInput, CqiMaturityAssessment } from './cqi-maturity-types.js';
import {
  buildCategoryScores,
  detectRequirementGaps,
} from './cqi-requirement-gap-detector.js';
import {
  buildRequirementCoverageMatrix,
  computeRequirementConfidenceScore,
} from './cqi-coverage-matrix.js';
import { detectCqiProductDomain } from './cqi-domain-registry.js';
import { recordCqiMaturityAssessment } from './cqi-maturity-history.js';

export function shouldStopQuestioning(assessment: Pick<
  CqiMaturityAssessment,
  'requirementConfidenceScore' | 'criticalGapCount' | 'openQuestions'
>): { stop: boolean; reason: string } {
  if (assessment.requirementConfidenceScore >= REQUIREMENT_CONFIDENCE_THRESHOLD && assessment.criticalGapCount === 0) {
    return {
      stop: true,
      reason: 'Requirement confidence threshold met and no critical requirement gaps remain.',
    };
  }
  if (assessment.openQuestions.length === 0 && assessment.criticalGapCount === 0) {
    return {
      stop: true,
      reason: 'No meaningful questions remain and no critical gaps exist.',
    };
  }
  return {
    stop: false,
    reason: 'Additional requirement discovery is needed before planning.',
  };
}

export function assessCqiMaturity(input: AssessCqiMaturityInput): CqiMaturityAssessment {
  const evidenceText = buildClarifyingEvidenceText({
    userPrompt: input.userPrompt,
    requestId: input.requestId,
    projectId: input.projectId,
    supplementalEvidence: [
      input.supplementalEvidence ?? '',
      ...(input.resolvedAnswers ?? []),
    ]
      .filter(Boolean)
      .join('\n'),
  });

  const productDomain = detectCqiProductDomain(evidenceText);
  const categoryScores = buildCategoryScores(evidenceText);
  const requirementConfidenceScore = computeRequirementConfidenceScore(categoryScores);
  const coverageMatrix = buildRequirementCoverageMatrix(evidenceText);
  const gaps = detectRequirementGaps({ evidenceText, domain: productDomain });
  const criticalGapCount = gaps.filter((gap) => gap.severity === 'CRITICAL' || gap.critical).length;
  const openQuestions = generateAdaptiveQuestions({ domain: productDomain, gaps, evidenceText });
  validateQuestionQuality(openQuestions);
  const resolvedQuestions = [
    ...extractResolvedQuestions(evidenceText, productDomain),
    ...(input.resolvedAnswers ?? []),
  ];
  const stop = shouldStopQuestioning({
    requirementConfidenceScore,
    criticalGapCount,
    openQuestions,
  });

  const assessment: CqiMaturityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Clarifying Question Intelligence',
    productDomain,
    userPrompt: input.userPrompt,
    requirementConfidenceScore,
    categoryScores,
    coverageMatrix,
    gaps,
    gapSummary: gaps.slice(0, 8).map((gap) => `${gap.category}: ${gap.summary}`),
    openQuestions,
    resolvedQuestions,
    criticalGapCount,
    questioningRequired: !stop.stop,
    canProceedToPlanning: stop.stop,
    stopQuestioningReason: stop.reason,
    generatedAt: new Date().toISOString(),
  };

  recordCqiMaturityAssessment(assessment);
  return assessment;
}

export function canProceedToPlanningMaturity(input: AssessCqiMaturityInput): boolean {
  return assessCqiMaturity(input).canProceedToPlanning;
}

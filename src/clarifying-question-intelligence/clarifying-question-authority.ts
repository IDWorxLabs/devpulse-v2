/**
 * Clarifying Question Intelligence — deterministic requirement gap analysis.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithUiReviewer } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  ASSUMPTION_PREVENTION_BY_CATEGORY,
  REQUIREMENT_CATEGORY_DEFINITIONS,
} from './clarifying-question-categories.js';
import {
  CLARIFYING_QUESTION_CACHE_KEY_PREFIX,
  COMPLETENESS_CANNOT_PROCEED,
  COMPLETENESS_CLARIFICATION_REQUIRED,
  COMPLETENESS_FULLY_UNDERSTOOD,
  COMPLETENESS_MOSTLY_UNDERSTOOD,
  MAX_ASSUMPTIONS_PREVENTED,
  MAX_RECOMMENDED_QUESTIONS,
} from './clarifying-question-bounds.js';
import { recordClarifyingQuestionAssessment } from './clarifying-question-history.js';
import { buildClarifyingQuestionReportMarkdown } from './clarifying-question-report-builder.js';
import type {
  ClarifyingQuestionAssessment,
  ClarifyingQuestionDefinition,
  ClarifyingQuestionReadinessState,
  RequirementCategoryId,
} from './clarifying-question-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function collectRequirementEvidenceText(report: FounderTestV4ReportWithUiReviewer): string {
  return [
    ...report.ideaToAppResults.map((result) => `${result.prompt} ${result.responsePreview}`),
    ...report.promiseFulfillment.promiseAssessments.map(
      (assessment) => `${assessment.promise} ${assessment.status} ${assessment.supportingEvidence.join(' ')}`,
    ),
    ...report.gapDetectionAuthority.detectedGaps.map(
      (gap) => `${gap.title} ${gap.description} ${gap.evidence.join(' ')}`,
    ),
    ...report.userSuccessAuthority.findings,
    ...report.firstTimeUserRealityAuthority.findings,
    ...report.firstTimeUserRealityAuthority.confusionPoints,
    report.launchReadinessAuthority.rationale,
    report.verdict,
    ...report.recommendedFixOrder,
  ]
    .join('\n')
    .toLowerCase();
}

export function detectRequirementCategories(
  report: FounderTestV4ReportWithUiReviewer,
): {
  detected: RequirementCategoryId[];
  missing: RequirementCategoryId[];
} {
  const evidence = collectRequirementEvidenceText(report);
  const detected: RequirementCategoryId[] = [];
  const missing: RequirementCategoryId[] = [];

  for (const category of REQUIREMENT_CATEGORY_DEFINITIONS) {
    const found = category.detectionPatterns.some((pattern) => pattern.test(evidence));
    if (found) {
      detected.push(category.id);
    } else {
      missing.push(category.id);
    }
  }

  if (
    report.ideaToAppResults.some((result) => /\bbuild (?:me )?(?:a|an|the)\b/i.test(result.prompt)) &&
    !detected.includes('FEATURES')
  ) {
    detected.push('FEATURES');
    const missingIndex = missing.indexOf('FEATURES');
    if (missingIndex >= 0) missing.splice(missingIndex, 1);
  }

  if (
    report.firstTimeUserRealityAuthority.scenarioResults.find((scenario) => scenario.id === 'product-understanding')
      ?.passed
  ) {
    if (!detected.includes('PRODUCT_PURPOSE')) detected.push('PRODUCT_PURPOSE');
    const missingIndex = missing.indexOf('PRODUCT_PURPOSE');
    if (missingIndex >= 0) missing.splice(missingIndex, 1);
  }

  return { detected, missing };
}

export function generateRecommendedQuestions(
  missing: RequirementCategoryId[],
): ClarifyingQuestionDefinition[] {
  const questions: ClarifyingQuestionDefinition[] = [];

  for (const category of REQUIREMENT_CATEGORY_DEFINITIONS.filter((entry) => entry.critical)) {
    if (!missing.includes(category.id)) continue;
    if (questions.filter((item) => item.priority === 'CRITICAL').length >= 4) break;
    questions.push(category.sampleQuestion);
  }

  for (const category of REQUIREMENT_CATEGORY_DEFINITIONS.filter((entry) => !entry.critical)) {
    if (!missing.includes(category.id)) continue;
    if (questions.length >= MAX_RECOMMENDED_QUESTIONS) break;
    questions.push(category.sampleQuestion);
  }

  return questions.slice(0, MAX_RECOMMENDED_QUESTIONS);
}

function deriveReadinessState(input: {
  requirementCompletenessScore: number;
  criticalMissingRequirementCount: number;
  clarificationRequired: boolean;
}): ClarifyingQuestionReadinessState {
  if (input.criticalMissingRequirementCount >= 3 && input.requirementCompletenessScore < COMPLETENESS_CANNOT_PROCEED) {
    return 'CANNOT_PROCEED';
  }
  if (input.criticalMissingRequirementCount > 0) return 'CRITICAL_INFORMATION_MISSING';
  if (input.clarificationRequired) return 'CLARIFICATION_REQUIRED';
  if (input.requirementCompletenessScore >= COMPLETENESS_FULLY_UNDERSTOOD) return 'FULLY_UNDERSTOOD';
  if (input.requirementCompletenessScore >= COMPLETENESS_MOSTLY_UNDERSTOOD) return 'MOSTLY_UNDERSTOOD';
  return 'CLARIFICATION_REQUIRED';
}

function stableCacheKey(report: FounderTestV4ReportWithUiReviewer, score: number): string {
  const digest = createHash('sha256')
    .update(
      [
        report.uiReviewerAuthority.cacheKey,
        report.userSuccessAuthority.cacheKey,
        report.gapDetectionAuthority.cacheKey,
        report.ideaToAppResults.length,
        score,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${CLARIFYING_QUESTION_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessClarifyingQuestionIntelligence(
  report: FounderTestV4ReportWithUiReviewer,
): ClarifyingQuestionAssessment {
  const { detected, missing } = detectRequirementCategories(report);
  const criticalMissing = missing.filter(
    (id) => REQUIREMENT_CATEGORY_DEFINITIONS.find((category) => category.id === id)?.critical,
  );
  const requirementCompletenessScore = clamp((detected.length / REQUIREMENT_CATEGORY_DEFINITIONS.length) * 100);
  const confidenceToProceed = clamp(
    requirementCompletenessScore * 0.55 +
      report.userSuccessAuthority.userSuccessScore * 0.15 +
      report.firstTimeUserRealityAuthority.firstTimeUserScore * 0.15 +
      (100 - report.gapDetectionAuthority.criticalGapCount * 12) * 0.15,
  );
  const clarificationRequired =
    criticalMissing.length > 0 || requirementCompletenessScore < COMPLETENESS_CLARIFICATION_REQUIRED;
  const recommendedQuestions = generateRecommendedQuestions(missing);
  const assumptionsPrevented = missing
    .map((id) => ASSUMPTION_PREVENTION_BY_CATEGORY[id])
    .filter(Boolean)
    .slice(0, MAX_ASSUMPTIONS_PREVENTED);

  const readinessState = deriveReadinessState({
    requirementCompletenessScore,
    criticalMissingRequirementCount: criticalMissing.length,
    clarificationRequired,
  });

  const assessment: ClarifyingQuestionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    requirementCompletenessScore,
    confidenceToProceed,
    missingRequirementCount: missing.length,
    criticalMissingRequirementCount: criticalMissing.length,
    clarificationRequired,
    recommendedQuestions,
    detectedRequirementCategories: detected,
    missingRequirementCategories: missing,
    assumptionsPrevented,
    readinessState,
    cacheKey: stableCacheKey(report, requirementCompletenessScore),
  };

  recordClarifyingQuestionAssessment(assessment);
  return assessment;
}

export function buildClarifyingQuestionIntelligenceArtifacts(
  report: FounderTestV4ReportWithUiReviewer,
): {
  clarifyingQuestionIntelligence: ClarifyingQuestionAssessment;
  clarifyingQuestionIntelligenceReportMarkdown: string;
} {
  const clarifyingQuestionIntelligence = assessClarifyingQuestionIntelligence(report);
  return {
    clarifyingQuestionIntelligence,
    clarifyingQuestionIntelligenceReportMarkdown: buildClarifyingQuestionReportMarkdown(
      clarifyingQuestionIntelligence,
    ),
  };
}

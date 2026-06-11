/**
 * Clarifying Question Intelligence Validator — bounded integrity checks.
 */

import { MAX_REQUIREMENT_CATEGORIES } from './clarifying-question-categories.js';
import { CLARIFYING_QUESTION_REPORT_TITLE } from './clarifying-question-bounds.js';
import type { ClarifyingQuestionAssessment } from './clarifying-question-types.js';

export function validateRequirementCategoryCount(): { passed: boolean; detail: string } {
  return { passed: MAX_REQUIREMENT_CATEGORIES === 10, detail: `count=${MAX_REQUIREMENT_CATEGORIES}` };
}

export function validateCategoryDetection(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.detectedRequirementCategories.length + assessment.missingRequirementCategories.length ===
      MAX_REQUIREMENT_CATEGORIES,
    detail: `detected=${assessment.detectedRequirementCategories.length}; missing=${assessment.missingRequirementCategories.length}`,
  };
}

export function validateMissingRequirementDetection(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.missingRequirementCount === assessment.missingRequirementCategories.length,
    detail: String(assessment.missingRequirementCount),
  };
}

export function validateCriticalRequirementDetection(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.criticalMissingRequirementCount >= 0 &&
      (assessment.clarificationRequired || assessment.criticalMissingRequirementCount === 0),
    detail: String(assessment.criticalMissingRequirementCount),
  };
}

export function validateQuestionGeneration(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  const validQuestions = assessment.recommendedQuestions.every(
    (item) => item.question.length > 0 && item.whyItMatters.length > 0 && item.consequenceIfAssumed.length > 0,
  );
  return {
    passed: validQuestions,
    detail: String(assessment.recommendedQuestions.length),
  };
}

export function validatePriorityClassification(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  const priorities = new Set(assessment.recommendedQuestions.map((item) => item.priority));
  return {
    passed:
      assessment.recommendedQuestions.every((item) =>
        ['CRITICAL', 'IMPORTANT', 'OPTIONAL'].includes(item.priority),
      ) && (priorities.size > 0 || assessment.missingRequirementCount === 0),
    detail: [...priorities].join(','),
  };
}

export function validateCompletenessScoring(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.requirementCompletenessScore >= 0 &&
      assessment.requirementCompletenessScore <= 100 &&
      assessment.confidenceToProceed >= 0 &&
      assessment.confidenceToProceed <= 100,
    detail: `${assessment.requirementCompletenessScore}/${assessment.confidenceToProceed}`,
  };
}

export function validateClarifyingDeterministicScoring(
  first: ClarifyingQuestionAssessment,
  second: ClarifyingQuestionAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.requirementCompletenessScore === second.requirementCompletenessScore &&
      first.clarificationRequired === second.clarificationRequired &&
      first.readinessState === second.readinessState &&
      first.cacheKey === second.cacheKey,
    detail: first.cacheKey,
  };
}

export function validateClarifyingAdvisoryOnly(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.readOnly === true && assessment.advisoryOnly === true,
    detail: String(assessment.advisoryOnly),
  };
}

export function validateClarifyingReportGeneration(markdown: string): { passed: boolean; detail: string } {
  return {
    passed:
      markdown.includes(`# ${CLARIFYING_QUESTION_REPORT_TITLE}`) &&
      markdown.includes('# Recommended Questions') &&
      markdown.includes('# Assumptions Prevented') &&
      markdown.includes('# Readiness To Plan'),
    detail: 'markdown sections',
  };
}

export function validateCriticalBlocksClarification(assessment: ClarifyingQuestionAssessment): {
  passed: boolean;
  detail: string;
} {
  if (assessment.criticalMissingRequirementCount > 0) {
    return {
      passed: assessment.clarificationRequired === true,
      detail: String(assessment.clarificationRequired),
    };
  }
  return { passed: true, detail: 'no critical missing' };
}

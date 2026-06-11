/**
 * Clarifying Question Intelligence — markdown report builder.
 */

import { CLARIFYING_QUESTION_REPORT_TITLE } from './clarifying-question-bounds.js';
import { REQUIREMENT_CATEGORY_DEFINITIONS } from './clarifying-question-categories.js';
import type { ClarifyingQuestionAssessment } from './clarifying-question-types.js';

export function buildClarifyingQuestionReportMarkdown(
  assessment: ClarifyingQuestionAssessment,
): string {
  const detectedLabels = assessment.detectedRequirementCategories
    .map((id) => REQUIREMENT_CATEGORY_DEFINITIONS.find((category) => category.id === id)?.label ?? id)
    .join(', ');
  const missingLabels = assessment.missingRequirementCategories
    .map((id) => REQUIREMENT_CATEGORY_DEFINITIONS.find((category) => category.id === id)?.label ?? id)
    .join(', ');

  const questionLines = assessment.recommendedQuestions
    .map(
      (item, index) =>
        `${index + 1}. **[${item.priority}] ${item.question}**\n   - Why: ${item.whyItMatters}\n   - If assumed: ${item.consequenceIfAssumed}`,
    )
    .join('\n\n');

  return `# ${CLARIFYING_QUESTION_REPORT_TITLE}

## Requirement Summary

Detected categories: ${detectedLabels || 'None'}

Missing categories: ${missingLabels || 'None'}

Readiness state: **${assessment.readinessState}**

Clarification required: **${assessment.clarificationRequired ? 'Yes' : 'No'}**

## Requirement Completeness

Requirement completeness score: **${assessment.requirementCompletenessScore}/100**

Confidence to proceed: **${assessment.confidenceToProceed}/100**

Missing requirements: **${assessment.missingRequirementCount}**

Critical missing requirements: **${assessment.criticalMissingRequirementCount}**

## Missing Categories

${assessment.missingRequirementCategories.length ? assessment.missingRequirementCategories.map((id) => `- ${id}`).join('\n') : '- None detected in bounded analysis.'}

## Critical Missing Information

${assessment.recommendedQuestions.filter((item) => item.priority === 'CRITICAL').length ? assessment.recommendedQuestions.filter((item) => item.priority === 'CRITICAL').map((item) => `- ${item.question}`).join('\n') : '- No critical gaps beyond bounded founder-test evidence.'}

## Recommended Questions

${questionLines || '1. No additional clarifying questions required from bounded evidence.'}

What should AiDevEngine ask before building?

## Assumptions Prevented

${assessment.assumptionsPrevented.length ? assessment.assumptionsPrevented.map((item) => `- ${item}`).join('\n') : '- None — requirement evidence appears sufficient for bounded categories.'}

What assumptions would have been dangerous?

## Readiness To Plan

${assessment.clarificationRequired ? 'Do not proceed to planning until critical clarifying questions are answered.' : 'Bounded requirement evidence supports proceeding with explicit user confirmation.'}

A question asked before building is cheaper than a rebuild after building.
`;
}

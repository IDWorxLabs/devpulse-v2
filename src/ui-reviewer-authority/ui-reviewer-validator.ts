/**
 * UI Reviewer Authority Validator — bounded integrity checks.
 */

import {
  UI_DISCOVERABILITY_BLOCK_SCORE,
  UI_NAVIGATION_BLOCK_SCORE,
  UI_REVIEW_BLOCK_SCORE,
} from './ui-reviewer-bounds.js';
import { MAX_UI_REVIEWER_CATEGORIES } from './ui-reviewer-scenarios.js';
import type { UIReviewerAssessment } from './ui-reviewer-types.js';

export function validateUIReviewerCategoryCount(): { passed: boolean; detail: string } {
  return { passed: MAX_UI_REVIEWER_CATEGORIES === 6, detail: `count=${MAX_UI_REVIEWER_CATEGORIES}` };
}

export function validateUIReviewerScoreCalculation(assessment: UIReviewerAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.uiReviewScore >= 0 &&
      assessment.uiReviewScore <= 100 &&
      assessment.navigationScore >= 0 &&
      assessment.discoverabilityScore <= 100,
    detail: String(assessment.uiReviewScore),
  };
}

export function validateNavigationReview(assessment: UIReviewerAssessment): { passed: boolean; detail: string } {
  const result = assessment.scenarioResults.find((entry) => entry.id === 'navigation-review');
  return {
    passed: Boolean(result) && assessment.navigationScore === result!.score,
    detail: String(assessment.navigationScore),
  };
}

export function validateDiscoverabilityReview(assessment: UIReviewerAssessment): {
  passed: boolean;
  detail: string;
} {
  const result = assessment.scenarioResults.find((entry) => entry.id === 'feature-discoverability');
  return {
    passed: Boolean(result) && assessment.discoverabilityScore === result!.score,
    detail: String(assessment.discoverabilityScore),
  };
}

export function validateHierarchyReview(assessment: UIReviewerAssessment): { passed: boolean; detail: string } {
  const result = assessment.scenarioResults.find((entry) => entry.id === 'layout-hierarchy');
  return {
    passed: Boolean(result) && assessment.hierarchyScore === result!.score,
    detail: String(assessment.hierarchyScore),
  };
}

export function validateWorkflowReview(assessment: UIReviewerAssessment): { passed: boolean; detail: string } {
  return {
    passed: assessment.scenarioResults.some((entry) => entry.id === 'workflow-review'),
    detail: String(assessment.usabilityScore),
  };
}

export function validateMissingScreenDetection(assessment: UIReviewerAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.scenarioResults.some((entry) => entry.id === 'missing-screen-review'),
    detail: String(assessment.scenarioResults.find((entry) => entry.id === 'missing-screen-review')?.findings.length ?? 0),
  };
}

export function validateUIReviewerLaunchBlocking(assessment: UIReviewerAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock =
    assessment.criticalUiFailures > 0 ||
    assessment.uiReviewScore < UI_REVIEW_BLOCK_SCORE ||
    assessment.navigationScore < UI_NAVIGATION_BLOCK_SCORE ||
    assessment.discoverabilityScore < UI_DISCOVERABILITY_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validateUIReviewerDeterministicScoring(
  first: UIReviewerAssessment,
  second: UIReviewerAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.uiReviewScore === second.uiReviewScore &&
      first.navigationScore === second.navigationScore &&
      first.discoverabilityScore === second.discoverabilityScore &&
      first.cacheKey === second.cacheKey,
    detail: `${first.uiReviewScore}/${second.uiReviewScore}`,
  };
}

export function validateUIReviewerAdvisoryOnly(assessment: UIReviewerAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.readOnly === true && assessment.advisoryOnly === true,
    detail: String(assessment.advisoryOnly),
  };
}

export function validateUIReviewerReportGeneration(markdown: string): { passed: boolean; detail: string } {
  return {
    passed:
      markdown.includes('# UI_REVIEWER_REPORT') &&
      markdown.includes('## Navigation Review') &&
      markdown.includes('## Missing Screens') &&
      markdown.includes('# Recommendations'),
    detail: 'markdown sections',
  };
}

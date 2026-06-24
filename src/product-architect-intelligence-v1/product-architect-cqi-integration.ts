/**
 * Product Architect Intelligence V1 — CQI integration.
 */

import {
  assessCqiMaturity,
  getLastCqiMaturityAssessment,
} from '../clarifying-question-intelligence/index.js';
import type {
  ProductArchitectureCqiContext,
  ProductArchitectureRootCause,
  ProductGapReport,
} from './product-architect-intelligence-types.js';

function deriveRootCause(input: {
  requirementConfidenceScore: number;
  criticalRequirementGapCount: number;
  criticalProductGapCount: number;
}): { rootCause: ProductArchitectureRootCause; detail: string } {
  const poorRequirements =
    input.requirementConfidenceScore < 75 || input.criticalRequirementGapCount > 0;
  const poorGeneration =
    input.requirementConfidenceScore >= 75 &&
    input.criticalRequirementGapCount === 0 &&
    input.criticalProductGapCount > 0;

  if (poorRequirements && poorGeneration) {
    return {
      rootCause: 'Mixed',
      detail: 'Both requirement gaps and generation/planning gaps contribute to missing architecture.',
    };
  }
  if (poorRequirements) {
    return {
      rootCause: 'Poor Requirements',
      detail: 'Missing architecture likely stems from incomplete requirement discovery.',
    };
  }
  if (poorGeneration) {
    return {
      rootCause: 'Poor Generation',
      detail: 'Requirements appear sufficient — missing architecture likely stems from planning or generation.',
    };
  }
  if (input.criticalProductGapCount > 0) {
    return {
      rootCause: 'Poor Planning',
      detail: 'Requirements are adequate but product structure planning appears incomplete.',
    };
  }
  return {
    rootCause: 'Unknown',
    detail: 'No major architecture gaps detected relative to requirement confidence.',
  };
}

export function buildProductArchitectureCqiContext(input: {
  userPrompt: string;
  gapReport: ProductGapReport;
}): ProductArchitectureCqiContext {
  const cqi = assessCqiMaturity({ userPrompt: input.userPrompt });
  const { rootCause, detail } = deriveRootCause({
    requirementConfidenceScore: cqi.requirementConfidenceScore,
    criticalRequirementGapCount: cqi.criticalGapCount,
    criticalProductGapCount: input.gapReport.criticalGapCount,
  });

  return {
    readOnly: true,
    requirementConfidenceScore: cqi.requirementConfidenceScore,
    criticalRequirementGapCount: cqi.criticalGapCount,
    coverageMatrixSummary: cqi.coverageMatrix.map(
      (row) => `${row.category}: ${row.status}`,
    ),
    rootCause,
    rootCauseDetail: detail,
  };
}

export function getLastProductArchitectureCqiContext(): ProductArchitectureCqiContext | null {
  const cqi = getLastCqiMaturityAssessment();
  if (!cqi) return null;
  return {
    readOnly: true,
    requirementConfidenceScore: cqi.requirementConfidenceScore,
    criticalRequirementGapCount: cqi.criticalGapCount,
    coverageMatrixSummary: cqi.coverageMatrix.map(
      (row) => `${row.category}: ${row.status}`,
    ),
    rootCause: 'Unknown',
    rootCauseDetail: 'CQI context loaded from history without product gap correlation.',
  };
}

/**
 * Completeness Score Engine — scoring, readiness, and risk assessment (V1).
 */

import type {
  CompletenessCategory,
  DomainAnalysisResult,
  ProjectRequirementReadiness,
  RequirementGap,
  RequirementRiskLevel,
} from './requirement-completeness-types.js';
import type { ProjectScopeAnalysis } from './project-scope-analyzer.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeCompletenessScore(domainResults: readonly DomainAnalysisResult[]): number {
  if (domainResults.length === 0) return 0;
  const total = domainResults.reduce((sum, d) => sum + d.score, 0);
  return clamp(total / domainResults.length);
}

export function mapCompletenessCategory(score: number): CompletenessCategory {
  if (score >= 90) return 'READY';
  if (score >= 70) return 'READY_WITH_GAPS';
  if (score >= 40) return 'PARTIAL';
  return 'INSUFFICIENT';
}

export function computeReadinessScore(input: {
  completenessScore: number;
  scope: ProjectScopeAnalysis;
  gaps: readonly RequirementGap[];
  confidenceScore: number;
}): number {
  let score = input.completenessScore;

  if (input.scope.hasMultiSourceEvidence) score += 5;
  if (input.scope.hasProductIntent) score += 3;
  score -= input.gaps.filter((g) => g.severity === 'CRITICAL').length * 8;
  score -= input.gaps.filter((g) => g.severity === 'HIGH').length * 4;
  score += Math.min(5, Math.floor(input.confidenceScore / 20));

  return clamp(score);
}

export function determineProjectRequirementReadiness(input: {
  completenessScore: number;
  readinessScore: number;
  criticalGapCount: number;
  clarifyingQuestionCount: number;
}): ProjectRequirementReadiness {
  if (input.completenessScore >= 90 && input.criticalGapCount === 0) {
    return 'READY_FOR_PLANNING';
  }
  if (input.readinessScore >= 70) {
    return 'READY_WITH_GAPS';
  }
  if (input.completenessScore >= 40 || input.clarifyingQuestionCount > 0) {
    return 'NEEDS_CLARIFICATION';
  }
  return 'NOT_READY';
}

export function assessRiskLevel(gaps: readonly RequirementGap[]): RequirementRiskLevel {
  if (gaps.some((g) => g.severity === 'CRITICAL')) return 'CRITICAL';
  if (gaps.filter((g) => g.severity === 'HIGH').length >= 3) return 'HIGH';
  if (gaps.some((g) => g.severity === 'HIGH')) return 'MEDIUM';
  return 'LOW';
}

export function computeConfidenceScore(input: {
  sourceCount: number;
  domainResults: readonly DomainAnalysisResult[];
  scope: ProjectScopeAnalysis;
}): number {
  let confidence = 35;
  confidence += Math.min(20, input.sourceCount * 8);
  confidence += Math.min(20, input.domainResults.filter((d) => d.covered.length > 0).length * 3);
  if (input.scope.hasMultiSourceEvidence) confidence += 10;
  if (input.scope.workflowCount >= 2) confidence += 5;
  if (input.scope.screenCount >= 2) confidence += 5;
  return clamp(confidence);
}

export function determineSafeToProceed(input: {
  projectRequirementReadiness: ProjectRequirementReadiness;
  riskLevel: RequirementRiskLevel;
}): boolean {
  return (
    input.projectRequirementReadiness === 'READY_FOR_PLANNING' ||
    (input.projectRequirementReadiness === 'READY_WITH_GAPS' && input.riskLevel !== 'CRITICAL')
  );
}

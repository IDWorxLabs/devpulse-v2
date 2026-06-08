/**
 * Complexity score report — founder-readable complexity reports.
 * Reporting only. No modification.
 */

import type {
  ComplexityAnalysisInput,
  ComplexityScoreFoundationState,
  ComplexityScoreReport,
  ComplexityScoreReportOutput,
  ComplexityScoreResult,
} from './types.js';
import { COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE } from './types.js';
import { countCriticalFactors, countHighFactors } from './factor-score-engine.js';

export function buildComplexityScoreReportOutput(
  input: ComplexityAnalysisInput,
  result: ComplexityScoreResult,
): ComplexityScoreReportOutput {
  return {
    reportId: `report-${result.complexityScoreId}`,
    complexityScoreId: result.complexityScoreId,
    complexityAnalysisId: result.complexityAnalysisId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    analysisSource: result.analysisSource,
    systemArea: result.systemArea,
    complexityScore: result.complexityScore,
    riskBand: result.riskBand,
    confidenceScore: result.confidenceScore,
    factorCount: result.factorScores.length,
    highFactorCount: countHighFactors(result.factorScores),
    criticalFactorCount: countCriticalFactors(result.factorScores),
    affectedSystemCount: result.affectedSystems.length,
    reviewRecommendationCount: result.recommendations.length,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: result.confirmation,
  };
}

export function buildComplexityScoreReport(
  state: ComplexityScoreFoundationState,
  result: ComplexityScoreResult,
  output: ComplexityScoreReportOutput,
): ComplexityScoreReport {
  return {
    ownerModule: COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
    reportId: output.reportId,
    complexityScoreId: output.complexityScoreId,
    complexityAnalysisId: output.complexityAnalysisId,
    workspaceId: output.workspaceId,
    projectId: output.projectId,
    analysisSource: output.analysisSource,
    systemArea: output.systemArea,
    complexityScore: output.complexityScore,
    riskBand: output.riskBand,
    confidenceScore: output.confidenceScore,
    factorCount: output.factorCount,
    highFactorCount: output.highFactorCount,
    criticalFactorCount: output.criticalFactorCount,
    affectedSystemCount: output.affectedSystemCount,
    reviewRecommendationCount: output.reviewRecommendationCount,
    governanceGateCount: output.governanceGateCount,
    ownershipGateCount: output.ownershipGateCount,
    securityWarningCount: output.securityWarningCount,
    recommendationCount: output.recommendationCount,
    confirmation: output.confirmation,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation: 'Complexity scoring measurement only — human review required, no auto-fix performed.',
  };
}

export function formatComplexityScoreReport(
  state: ComplexityScoreFoundationState,
  result: ComplexityScoreResult,
  input: ComplexityAnalysisInput,
): string {
  const output = buildComplexityScoreReportOutput(input, result);
  const lines = [
    '=== DevPulse V2 Complexity Score Report ===',
    'Phase 9.5 — Complexity Score Foundation V1',
    '',
    `Score ID: ${output.complexityScoreId}`,
    `Analysis ID: ${output.complexityAnalysisId}`,
    `Workspace: ${output.workspaceId}`,
    `Project: ${output.projectId}`,
    `Source: ${output.analysisSource}`,
    `System Area: ${output.systemArea}`,
    `Complexity Score: ${output.complexityScore}/100`,
    `Risk Band: ${output.riskBand}`,
    `Confidence: ${output.confidenceScore}`,
    '',
    `Factor Count: ${output.factorCount}`,
    `High Factors: ${output.highFactorCount}`,
    `Critical Factors: ${output.criticalFactorCount}`,
    `Affected Systems: ${output.affectedSystemCount}`,
    '',
    '--- Confirmations ---',
    'No execution performed: CONFIRMED',
    'No commands executed: CONFIRMED',
    'No files modified: CONFIRMED',
    'No code generated: CONFIRMED',
    'No deployment performed: CONFIRMED',
    'No architecture modified: CONFIRMED',
    'No governance modified: CONFIRMED',
    'No ownership registry modified: CONFIRMED',
    'No auto-fix performed: CONFIRMED',
    'Complexity scoring only: CONFIRMED',
    '',
    `Pressure: ${result.pressureInterpretation.slice(0, 120)}...`,
    `Review: ${result.reviewRecommendation}`,
    '',
    `Foundation ID: ${state.foundationId}`,
  ];
  return lines.join('\n');
}

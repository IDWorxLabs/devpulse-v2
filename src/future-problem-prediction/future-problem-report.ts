/**
 * Future problem prediction report — founder-readable prediction reports.
 * Reporting only. No execution.
 */

import type {
  FutureProblemPredictionState,
  PredictionAnalysisInput,
  PredictionReport,
  PredictionReportOutput,
  PredictionResult,
} from './types.js';
import { FUTURE_PROBLEM_PREDICTION_OWNER_MODULE } from './types.js';
import { countCriticalRiskForecasts, countHighRiskForecasts } from './risk-forecast-engine.js';
import { scorePredictionConfidence } from './confidence-scoring-engine.js';

export function buildPredictionReportOutput(
  input: PredictionAnalysisInput,
  result: PredictionResult,
): PredictionReportOutput {
  const highRiskCount = countHighRiskForecasts(result.riskForecasts);
  const criticalRiskCount = countCriticalRiskForecasts(result.riskForecasts);

  return {
    reportId: `report-${result.predictionId}`,
    predictionAnalysisId: result.predictionAnalysisId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    analysisSource: result.analysisSource,
    systemArea: result.systemArea,
    predictionCount: result.predictions.length,
    highRiskCount,
    criticalRiskCount,
    affectedSystemCount: result.affectedSystems.length,
    recommendationCount: result.recommendations.length,
    overallFutureRisk: result.overallFutureRisk,
    confidenceScore: scorePredictionConfidence(
      result.predictions,
      result.predictions.reduce((sum, p) => sum + p.predictionEvidence.length, 0),
      result.riskForecasts,
    ),
    topPredictions: result.topPredictions,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    confirmation: result.confirmation,
  };
}

export function buildPredictionReport(
  state: FutureProblemPredictionState,
  result: PredictionResult,
  output: PredictionReportOutput,
): PredictionReport {
  const primary = result.predictions[0];

  return {
    ownerModule: FUTURE_PROBLEM_PREDICTION_OWNER_MODULE,
    reportId: output.reportId,
    predictionAnalysisId: result.predictionAnalysisId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    analysisSource: result.analysisSource,
    systemArea: result.systemArea,
    predictionType: primary?.predictionType ?? 'UNKNOWN',
    riskLevel: primary?.riskLevel ?? 'LOW',
    confidenceLevel: primary?.confidenceLevel ?? 'LOW',
    overallFutureRisk: result.overallFutureRisk,
    affectedSystemCount: output.affectedSystemCount,
    highRiskCount: output.highRiskCount,
    criticalRiskCount: output.criticalRiskCount,
    governanceGateCount: output.governanceGateCount,
    ownershipGateCount: output.ownershipGateCount,
    securityWarningCount: output.securityWarningCount,
    recommendationCount: output.recommendationCount,
    confirmation: output.confirmation,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation: result.preventionRecommendation,
  };
}

export function formatPredictionReport(
  state: FutureProblemPredictionState,
  result: PredictionResult,
  input: PredictionAnalysisInput,
): string {
  const output = buildPredictionReportOutput(input, result);
  const lines = [
    '=== DevPulse V2 Phase 9.6 Future Problem Prediction Report ===',
    `Phase 9.6 | Owner: ${FUTURE_PROBLEM_PREDICTION_OWNER_MODULE}`,
    `Foundation: ${state.foundationId}`,
    '',
    `Report ID: ${output.reportId}`,
    `Prediction Analysis ID: ${output.predictionAnalysisId}`,
    `Workspace: ${output.workspaceId}`,
    `Project: ${output.projectId}`,
    `Analysis Source: ${output.analysisSource}`,
    `System Area: ${output.systemArea}`,
    '',
    `Overall Future Risk: ${output.overallFutureRisk}`,
    `Confidence Score: ${output.confidenceScore}`,
    `Prediction Count: ${output.predictionCount}`,
    `High Risk Count: ${output.highRiskCount}`,
    `Critical Risk Count: ${output.criticalRiskCount}`,
    `Affected Systems: ${output.affectedSystemCount}`,
    '',
    'Top Predictions:',
    ...output.topPredictions.map(
      (p) => `  - ${p.predictionType} (${p.riskLevel}, ${p.forecastTimeframe}): ${p.predictionReason}`,
    ),
    '',
    `Prevention Recommendation: ${result.preventionRecommendation}`,
    '',
    '=== Safety Confirmations ===',
    `No execution performed: CONFIRMED`,
    `No commands executed: CONFIRMED`,
    `No files modified: CONFIRMED`,
    `No code generated: CONFIRMED`,
    `No deployment performed: CONFIRMED`,
    `No architecture modified: CONFIRMED`,
    `No governance modified: CONFIRMED`,
    `No ownership registry modified: CONFIRMED`,
    `No auto-fix performed: CONFIRMED`,
    `Future prediction only: CONFIRMED`,
    '',
    `Recommendations: ${output.recommendationCount}`,
  ];

  return lines.join('\n');
}

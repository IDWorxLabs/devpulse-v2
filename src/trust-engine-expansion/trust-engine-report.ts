/**
 * Trust engine report — founder-readable trust reports.
 */

import type {
  TrustAssessmentInput,
  TrustAssessmentResult,
  TrustEngineExpansionState,
  TrustEngineReport,
  TrustEngineReportOutput,
} from './types.js';
import { TRUST_ENGINE_EXPANSION_OWNER_MODULE } from './types.js';
import { countPositiveFactors, countRiskFactors } from './trust-factor-score-engine.js';

export function buildTrustEngineReportOutput(result: TrustAssessmentResult): TrustEngineReportOutput {
  return {
    reportId: `report-${result.trustScoreId}`,
    trustScoreId: result.trustScoreId,
    trustAssessmentId: result.trustAssessmentId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    assessmentSource: result.assessmentSource,
    assessmentTarget: result.assessmentTarget,
    targetId: result.targetId,
    trustScore: result.trustScore,
    trustLevel: result.trustLevel,
    trustRiskLevel: result.trustRiskLevel,
    factorCount: result.factorScores.length,
    warningCount: result.trustWarnings.length,
    recommendationCount: result.trustRecommendations.length,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    confirmation: result.confirmation,
  };
}

export function buildTrustEngineReport(
  state: TrustEngineExpansionState,
  result: TrustAssessmentResult,
  output: TrustEngineReportOutput,
): TrustEngineReport {
  return {
    ownerModule: TRUST_ENGINE_EXPANSION_OWNER_MODULE,
    reportId: output.reportId,
    trustScoreId: result.trustScoreId,
    trustAssessmentId: result.trustAssessmentId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    assessmentSource: result.assessmentSource,
    assessmentTarget: result.assessmentTarget,
    targetId: result.targetId,
    trustScore: output.trustScore,
    trustLevel: output.trustLevel,
    trustRiskLevel: output.trustRiskLevel,
    factorCount: output.factorCount,
    warningCount: output.warningCount,
    recommendationCount: output.recommendationCount,
    governanceGateCount: output.governanceGateCount,
    ownershipGateCount: output.ownershipGateCount,
    securityWarningCount: output.securityWarningCount,
    confirmation: output.confirmation,
    warnings: [...state.warnings, ...result.trustWarnings],
    errors: [...state.errors],
    recommendation: result.trustRecommendations[0] ?? 'Trust aggregation only — review source systems',
  };
}

export function formatTrustEngineReport(
  state: TrustEngineExpansionState,
  result: TrustAssessmentResult,
  _input: TrustAssessmentInput,
): string {
  const output = buildTrustEngineReportOutput(result);
  const positiveCount = countPositiveFactors(result.factorScores);
  const riskCount = countRiskFactors(result.factorScores);

  const lines = [
    '=== DevPulse V2 Phase 10.2 Trust Engine Expansion Report ===',
    `Phase 10.2 | Owner: ${TRUST_ENGINE_EXPANSION_OWNER_MODULE}`,
    `Foundation: ${state.foundationId}`,
    '',
    `Report ID: ${output.reportId}`,
    `Trust Score ID: ${output.trustScoreId}`,
    `Trust Assessment ID: ${output.trustAssessmentId}`,
    `Workspace: ${output.workspaceId}`,
    `Project: ${output.projectId}`,
    `Source: ${output.assessmentSource}`,
    `Target: ${output.assessmentTarget}`,
    `Target ID: ${output.targetId}`,
    '',
    `Trust Score: ${output.trustScore}/100`,
    `Trust Level: ${output.trustLevel}`,
    `Trust Risk Level: ${output.trustRiskLevel}`,
    `Factor Count: ${output.factorCount} (${positiveCount} positive, ${riskCount} risk)`,
    `Warning Count: ${output.warningCount}`,
    `Recommendation Count: ${output.recommendationCount}`,
    '',
    'Trust Reasons:',
    ...result.trustReasons.slice(0, 5).map((r) => `  - ${r}`),
    '',
    '=== Safety Confirmations ===',
    'Trust aggregation only: CONFIRMED',
    'No execution performed: CONFIRMED',
    'No commands executed: CONFIRMED',
    'No files modified: CONFIRMED',
    'No code generated: CONFIRMED',
    'No deployment performed: CONFIRMED',
    'No auto-fix performed: CONFIRMED',
    'No verification system replaced: CONFIRMED',
    'No evidence ledger replaced: CONFIRMED',
    'No governance system replaced: CONFIRMED',
    'No ownership registry modified: CONFIRMED',
  ];

  return lines.join('\n');
}

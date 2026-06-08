/**
 * Architecture drift report — founder-readable drift reports.
 * Reporting only. No architecture modification.
 */

import type {
  ArchitectureDriftDetectionState,
  ArchitectureDriftReport,
  ArchitectureDriftReportOutput,
  ArchitectureDriftResult,
  DriftAnalysisInput,
} from './types.js';
import { ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE } from './types.js';
import { countBySeverity } from './drift-severity-engine.js';

export function buildArchitectureDriftReportOutput(
  input: DriftAnalysisInput,
  result: ArchitectureDriftResult,
): ArchitectureDriftReportOutput {
  const affectedSystems = new Set<string>();
  for (const f of result.driftFindings) {
    for (const s of f.affectedSystems) affectedSystems.add(s);
  }

  return {
    reportId: `report-${result.architectureDriftId}`,
    driftAnalysisId: result.driftAnalysisId,
    architectureDriftId: result.architectureDriftId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    analysisSource: result.analysisSource,
    driftType: result.driftType,
    driftSeverity: result.driftSeverity,
    driftConfidence: result.driftConfidence,
    overallDriftRisk: result.overallDriftRisk,
    driftCount: result.driftFindings.length,
    highSeverityCount: countBySeverity(result.driftFindings, 'HIGH'),
    criticalSeverityCount: countBySeverity(result.driftFindings, 'CRITICAL'),
    affectedSystemCount: affectedSystems.size,
    reviewRecommendationCount: result.driftFindings.length || 1,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    topDrifts: result.driftFindings.slice(0, 5),
    confirmation: result.confirmation,
  };
}

export function buildArchitectureDriftReport(
  state: ArchitectureDriftDetectionState,
  result: ArchitectureDriftResult,
  output: ArchitectureDriftReportOutput,
): ArchitectureDriftReport {
  return {
    ownerModule: ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE,
    reportId: output.reportId,
    driftAnalysisId: output.driftAnalysisId,
    architectureDriftId: output.architectureDriftId,
    workspaceId: output.workspaceId,
    projectId: output.projectId,
    analysisSource: output.analysisSource,
    driftType: output.driftType,
    driftSeverity: output.driftSeverity,
    driftConfidence: output.driftConfidence,
    overallDriftRisk: output.overallDriftRisk,
    driftCount: output.driftCount,
    highSeverityCount: output.highSeverityCount,
    criticalSeverityCount: output.criticalSeverityCount,
    affectedSystemCount: output.affectedSystemCount,
    reviewRecommendationCount: output.reviewRecommendationCount,
    governanceGateCount: output.governanceGateCount,
    ownershipGateCount: output.ownershipGateCount,
    securityWarningCount: output.securityWarningCount,
    recommendationCount: output.recommendationCount,
    topDrifts: output.topDrifts.map((d) => ({ ...d, driftEvidence: [...d.driftEvidence], affectedSystems: [...d.affectedSystems] })),
    confirmation: output.confirmation,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation: 'Architecture drift detection observer only — human review required, no auto-fix performed.',
  };
}

export function formatArchitectureDriftReport(
  state: ArchitectureDriftDetectionState,
  result: ArchitectureDriftResult,
  input: DriftAnalysisInput,
): string {
  const output = buildArchitectureDriftReportOutput(input, result);
  const lines = [
    '=== DevPulse V2 Architecture Drift Detection Report ===',
    'Phase 9.4 — Architecture Drift Detection Foundation V1',
    '',
    `Drift ID: ${output.architectureDriftId}`,
    `Analysis ID: ${output.driftAnalysisId}`,
    `Workspace: ${output.workspaceId}`,
    `Project: ${output.projectId}`,
    `Source: ${output.analysisSource}`,
    `Primary Drift: ${output.driftType}`,
    `Severity: ${output.driftSeverity}`,
    `Confidence: ${output.driftConfidence}`,
    `Overall Risk: ${output.overallDriftRisk}`,
    '',
    `Drift Count: ${output.driftCount}`,
    `High Severity: ${output.highSeverityCount}`,
    `Critical Severity: ${output.criticalSeverityCount}`,
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
    'Architecture drift detection only: CONFIRMED',
    '',
    `Review: ${result.recommendedReview}`,
    '',
    `Foundation ID: ${state.foundationId}`,
  ];
  return lines.join('\n');
}

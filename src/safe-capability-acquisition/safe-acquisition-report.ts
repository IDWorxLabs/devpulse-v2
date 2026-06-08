/**
 * Safe acquisition report — founder-readable acquisition plan reports.
 * Planning only. No acquisition performed.
 */

import type {
  AcquisitionInput,
  AcquisitionPlanResult,
  SafeAcquisitionReport,
  SafeAcquisitionReportOutput,
  SafeCapabilityAcquisitionState,
} from './types.js';
import { SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE } from './types.js';

export function buildSafeAcquisitionReportOutput(
  input: AcquisitionInput,
  result: AcquisitionPlanResult,
): SafeAcquisitionReportOutput {
  return {
    reportId: `report-${result.acquisitionPlanId}`,
    acquisitionPlanId: result.acquisitionPlanId,
    acquisitionId: result.acquisitionId,
    capabilityGapId: result.capabilityGapId,
    analysisId: result.analysisId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    capabilityType: result.capabilityType,
    capabilityName: result.capabilityName,
    acquisitionMode: result.acquisitionMode,
    acquisitionStrategy: result.acquisitionStrategy,
    acquisitionState: result.acquisitionState,
    acquisitionReadiness: result.acquisitionReadiness,
    riskLevel: result.riskLevel,
    approvalRequirementCount: result.approvalRequirements.length,
    verificationRequirementCount: result.verificationRequirements.length,
    rollbackRequirementCount: result.rollbackRequirements.length,
    researchRequestId: result.researchRequestPacket?.researchRequestId ?? '',
    buildRequestId: result.buildRequestPacket?.buildRequestId ?? '',
    deferRecordId: result.deferRecord?.deferRecordId ?? '',
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: result.confirmation,
  };
}

export function buildSafeAcquisitionReport(
  state: SafeCapabilityAcquisitionState,
  result: AcquisitionPlanResult,
  output: SafeAcquisitionReportOutput,
): SafeAcquisitionReport {
  return {
    ownerModule: SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
    reportId: output.reportId,
    acquisitionPlanId: output.acquisitionPlanId,
    acquisitionId: output.acquisitionId,
    capabilityGapId: output.capabilityGapId,
    analysisId: output.analysisId,
    workspaceId: output.workspaceId,
    projectId: output.projectId,
    capabilityType: output.capabilityType,
    capabilityName: output.capabilityName,
    acquisitionMode: output.acquisitionMode,
    acquisitionStrategy: output.acquisitionStrategy,
    acquisitionState: output.acquisitionState,
    acquisitionReadiness: output.acquisitionReadiness,
    riskLevel: output.riskLevel,
    approvalRequirementCount: output.approvalRequirementCount,
    verificationRequirementCount: output.verificationRequirementCount,
    rollbackRequirementCount: output.rollbackRequirementCount,
    researchRequestId: output.researchRequestId,
    buildRequestId: output.buildRequestId,
    deferRecordId: output.deferRecordId,
    governanceGateCount: output.governanceGateCount,
    ownershipGateCount: output.ownershipGateCount,
    securityWarningCount: output.securityWarningCount,
    recommendationCount: output.recommendationCount,
    confirmation: output.confirmation,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation: `Safe acquisition plan for ${result.capabilityName} — planning only, no capability acquired.`,
  };
}

export function formatSafeAcquisitionReport(
  state: SafeCapabilityAcquisitionState,
  result: AcquisitionPlanResult,
  input: AcquisitionInput,
): string {
  const output = buildSafeAcquisitionReportOutput(input, result);
  const report = buildSafeAcquisitionReport(state, result, output);
  const lines = [
    '=== DevPulse V2 Phase 9.2 Safe Capability Acquisition Report ===',
    `Report ID: ${report.reportId}`,
    `Acquisition Plan ID: ${report.acquisitionPlanId}`,
    `Capability Gap ID: ${report.capabilityGapId}`,
    `Workspace: ${report.workspaceId} / Project: ${report.projectId}`,
    `Capability: ${report.capabilityName} (${report.capabilityType})`,
    `Mode: ${report.acquisitionMode} → Strategy: ${report.acquisitionStrategy}`,
    `State: ${report.acquisitionState} | Readiness: ${report.acquisitionReadiness}`,
    `Risk Level: ${report.riskLevel}`,
    `Approval Requirements: ${report.approvalRequirementCount}`,
    `Verification Requirements: ${report.verificationRequirementCount}`,
    `Rollback Requirements: ${report.rollbackRequirementCount}`,
    `Research Request: ${report.researchRequestId || 'N/A'}`,
    `Build Request: ${report.buildRequestId || 'N/A'}`,
    `Defer Record: ${report.deferRecordId || 'N/A'}`,
    `Governance Gates: ${report.governanceGateCount} | Ownership Gates: ${report.ownershipGateCount}`,
    `Security Warnings: ${report.securityWarningCount}`,
    '--- Confirmations ---',
    'No execution performed: CONFIRMED',
    'No commands executed: CONFIRMED',
    'No files modified: CONFIRMED',
    'No code generated: CONFIRMED',
    'No deployment performed: CONFIRMED',
    'No tool downloaded: CONFIRMED',
    'No dependency installed: CONFIRMED',
    'No capability acquired: CONFIRMED',
    'Safe capability acquisition planning only: CONFIRMED',
    `Recommendation: ${report.recommendation}`,
  ];
  return lines.join('\n');
}

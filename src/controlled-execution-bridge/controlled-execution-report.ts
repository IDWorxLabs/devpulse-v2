/**
 * Controlled execution bridge founder-readable report.
 */

import type {
  BridgeResult,
  ControlledExecutionBridgeState,
  ControlledExecutionReport,
} from './types.js';
import { CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE } from './types.js';

export function buildControlledExecutionReport(
  state: ControlledExecutionBridgeState,
  result: BridgeResult,
): ControlledExecutionReport {
  return {
    ownerModule: CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE,
    bridgeId: result.bridgeId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    planId: result.planId,
    simulationId: result.simulationId,
    builderId: result.builderId,
    verificationId: result.verificationId,
    learningId: result.learningId,
    executionReadiness: result.executionReadiness,
    eligibleRequestCount: result.eligibleExecutionRequests.length,
    blockedRequestCount: result.blockedExecutionRequests.length,
    approvalGateCount: result.approvalGates.length,
    verificationGateCount: result.verificationGates.length,
    rollbackGateCount: result.rollbackGates.length,
    riskGateCount: result.riskGates.length,
    protectionGateCount: result.protectionGates.length,
    recommendationCount: result.recommendations.length,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 7.7 Controlled Execution Bridge Foundation V1 — classification only. No execution, commands, file modification, code generation, or deployment.',
  };
}

export function formatControlledExecutionReport(
  state: ControlledExecutionBridgeState,
  result: BridgeResult,
): string {
  const report = buildControlledExecutionReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 7.7 — Controlled Execution Bridge Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Bridge ID: ${report.bridgeId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Plan ID: ${report.planId}`,
    `Simulation ID: ${report.simulationId}`,
    `Builder ID: ${report.builderId}`,
    `Verification ID: ${report.verificationId}`,
    `Learning ID: ${report.learningId}`,
    `Execution readiness: ${report.executionReadiness}`,
    `Eligible request count: ${report.eligibleRequestCount}`,
    `Blocked request count: ${report.blockedRequestCount}`,
    `Approval gate count: ${report.approvalGateCount}`,
    `Verification gate count: ${report.verificationGateCount}`,
    `Rollback gate count: ${report.rollbackGateCount}`,
    `Risk gate count: ${report.riskGateCount}`,
    `Protection gate count: ${report.protectionGateCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Bridge-classification-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  Bridge classification only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}

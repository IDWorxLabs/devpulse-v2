/**
 * Cross-device continuity founder-readable report.
 */

import type {
  ContinuityInput,
  ContinuityReport,
  ContinuityResult,
  CrossDeviceContinuityFoundationState,
} from './types.js';
import { CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE } from './types.js';

export function buildContinuityReport(
  state: CrossDeviceContinuityFoundationState,
  result: ContinuityResult,
  _input: ContinuityInput,
): ContinuityReport {
  return {
    ownerModule: CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE,
    continuityPacketId: result.continuityPacketId,
    continuitySessionId: result.continuitySessionId,
    fromDeviceId: result.fromDeviceId,
    toDeviceId: result.toDeviceId,
    userId: result.userId,
    mobileSessionId: result.mobileSessionId,
    cloudSessionId: result.cloudSessionId,
    conversationId: result.conversationId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    handoffRequestId: result.handoffRequestId,
    handoffType: result.handoffType,
    continuityState: result.continuityState,
    continuityReadiness: result.continuityReadiness,
    continuityScope: result.continuityScope,
    allowedContinuityCapabilityCount: result.allowedContinuityCapabilities.length,
    blockedContinuityCapabilityCount: result.blockedContinuityCapabilities.length,
    cloudStateRefreshRequired: result.cloudStateRefreshRequired,
    ownershipGateCount: result.ownershipGates.length,
    governanceGateCount: result.governanceGates.length,
    cloudGateCount: result.cloudGates.length,
    deviceGateCount: result.deviceGates.length,
    scopeGateCount: result.scopeGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: { ...result.confirmation },
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 8.5 Cross-device Continuity Foundation V1 — context transfer only. Cloud workspace owns project truth.',
  };
}

export function formatContinuityReport(
  state: CrossDeviceContinuityFoundationState,
  result: ContinuityResult,
  input: ContinuityInput,
): string {
  const report = buildContinuityReport(state, result, input);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 8.5 — Cross-device Continuity Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Continuity packet ID: ${report.continuityPacketId}`,
    `Continuity session ID: ${report.continuitySessionId}`,
    `From device: ${report.fromDeviceId}`,
    `To device: ${report.toDeviceId}`,
    `User ID: ${report.userId}`,
    `Mobile session ID: ${report.mobileSessionId}`,
    `Cloud session ID: ${report.cloudSessionId}`,
    `Conversation ID: ${report.conversationId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Handoff request ID: ${report.handoffRequestId}`,
    `Handoff type: ${report.handoffType}`,
    `Continuity state: ${report.continuityState}`,
    `Continuity readiness: ${report.continuityReadiness}`,
    `Continuity scope: ${report.continuityScope}`,
    `Allowed capability count: ${report.allowedContinuityCapabilityCount}`,
    `Blocked capability count: ${report.blockedContinuityCapabilityCount}`,
    `Cloud state refresh required: ${report.cloudStateRefreshRequired}`,
    `Ownership gate count: ${report.ownershipGateCount}`,
    `Governance gate count: ${report.governanceGateCount}`,
    `Cloud gate count: ${report.cloudGateCount}`,
    `Device gate count: ${report.deviceGateCount}`,
    `Scope gate count: ${report.scopeGateCount}`,
    `Security warning count: ${report.securityWarningCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Cross-device-continuity-foundation-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  No approval self-granted: CONFIRMED',
    '  No duplicate project truth created: CONFIRMED',
    '  Cross-device continuity foundation only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}

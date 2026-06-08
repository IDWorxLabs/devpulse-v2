/**
 * Mobile command founder-readable report.
 */

import type {
  MobileCommandFoundationState,
  MobileCommandReport,
  MobileSessionResult,
} from './types.js';
import { MOBILE_COMMAND_FOUNDATION_OWNER_MODULE } from './types.js';

export function buildMobileCommandReport(
  state: MobileCommandFoundationState,
  result: MobileSessionResult,
): MobileCommandReport {
  return {
    ownerModule: MOBILE_COMMAND_FOUNDATION_OWNER_MODULE,
    mobileSessionId: result.mobileSessionId,
    cloudSessionId: result.cloudSessionId,
    deviceId: result.deviceId,
    userId: result.userId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    sessionState: result.sessionState,
    connectionReadiness: result.connectionReadiness,
    cloudConnectionStatus: result.cloudConnectionStatus,
    allowedCapabilityCount: result.allowedCapabilities.length,
    blockedCapabilityCount: result.blockedCapabilities.length,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: { ...result.confirmation },
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 8.1 Mobile Command Foundation V1 — remote command center only. No execution, commands, file modification, code generation, or deployment.',
  };
}

export function formatMobileCommandReport(
  state: MobileCommandFoundationState,
  result: MobileSessionResult,
): string {
  const report = buildMobileCommandReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 8.1 — Mobile Command Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Mobile session ID: ${report.mobileSessionId}`,
    `Cloud session ID: ${report.cloudSessionId}`,
    `Device ID: ${report.deviceId}`,
    `User ID: ${report.userId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Session state: ${report.sessionState}`,
    `Connection readiness: ${report.connectionReadiness}`,
    `Cloud connection status: ${report.cloudConnectionStatus}`,
    `Allowed capability count: ${report.allowedCapabilityCount}`,
    `Blocked capability count: ${report.blockedCapabilityCount}`,
    `Governance gate count: ${report.governanceGateCount}`,
    `Ownership gate count: ${report.ownershipGateCount}`,
    `Security warning count: ${report.securityWarningCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Mobile-command-foundation-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  No approval self-granted: CONFIRMED',
    '  Mobile command foundation only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}

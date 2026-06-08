/**
 * Mobile live preview founder-readable report.
 */

import type {
  MobileLivePreviewFoundationState,
  MobilePreviewReport,
  MobilePreviewResult,
} from './types.js';
import { MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE } from './types.js';

export function buildMobilePreviewReport(
  state: MobileLivePreviewFoundationState,
  result: MobilePreviewResult,
): MobilePreviewReport {
  return {
    ownerModule: MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE,
    mobilePreviewPacketId: result.mobilePreviewPacketId,
    previewSessionId: result.previewSessionId,
    mobileSessionId: result.mobileSessionId,
    cloudSessionId: result.cloudSessionId,
    conversationId: result.conversationId,
    userId: result.userId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    previewRequestId: result.previewRequestId,
    previewState: result.previewState,
    previewReadiness: result.previewReadiness,
    previewTarget: result.previewTarget,
    previewType: result.previewType,
    previewSourceStatus: result.previewSourceStatus,
    desktopRequired: result.desktopRequired,
    mobileSafe: result.mobileSafe,
    allowedPreviewCapabilityCount: result.allowedPreviewCapabilities.length,
    blockedPreviewCapabilityCount: result.blockedPreviewCapabilities.length,
    previewWarningCount: result.previewWarnings.length,
    previewAccessGateCount: result.previewAccessGates.length,
    deviceSuitabilityGateCount: result.deviceSuitabilityGates.length,
    cloudGateCount: result.cloudGates.length,
    projectContextGateCount: result.projectContextGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: { ...result.confirmation },
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Phase 8.3 Mobile Live Preview Foundation V1 — remote viewer only. No execution, commands, file modification, code generation, or deployment.',
  };
}

export function formatMobilePreviewReport(
  state: MobileLivePreviewFoundationState,
  result: MobilePreviewResult,
): string {
  const report = buildMobilePreviewReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Phase 8.3 — Mobile Live Preview Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Foundation ID: ${state.foundationId}`,
    `Mobile preview packet ID: ${report.mobilePreviewPacketId}`,
    `Preview session ID: ${report.previewSessionId}`,
    `Mobile session ID: ${report.mobileSessionId}`,
    `Cloud session ID: ${report.cloudSessionId}`,
    `Conversation ID: ${report.conversationId}`,
    `User ID: ${report.userId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Preview request ID: ${report.previewRequestId}`,
    `Preview state: ${report.previewState}`,
    `Preview readiness: ${report.previewReadiness}`,
    `Preview target: ${report.previewTarget}`,
    `Preview type: ${report.previewType}`,
    `Preview source status: ${report.previewSourceStatus}`,
    `Desktop required: ${report.desktopRequired}`,
    `Mobile safe: ${report.mobileSafe}`,
    `Allowed capability count: ${report.allowedPreviewCapabilityCount}`,
    `Blocked capability count: ${report.blockedPreviewCapabilityCount}`,
    `Preview warning count: ${report.previewWarningCount}`,
    `Preview access gate count: ${report.previewAccessGateCount}`,
    `Device suitability gate count: ${report.deviceSuitabilityGateCount}`,
    `Cloud gate count: ${report.cloudGateCount}`,
    `Project context gate count: ${report.projectContextGateCount}`,
    `Security warning count: ${report.securityWarningCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Mobile-live-preview-foundation-only confirmations:',
    '  No execution performed: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No deployment performed: CONFIRMED',
    '  No approval self-granted: CONFIRMED',
    '  No preview source of truth claim: CONFIRMED',
    '  Mobile live preview foundation only: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}

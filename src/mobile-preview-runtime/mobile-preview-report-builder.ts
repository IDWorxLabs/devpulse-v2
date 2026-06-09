/**
 * Mobile Preview Runtime Foundation — report builder.
 */

import {
  listStoredMobilePreviewSessions,
  listStoredMobilePreviewTrackedSessions,
  listStoredMobilePreviewLifecycleEvents,
} from './mobile-preview-store.js';
import { listPreviewLinks } from './mobile-preview-link-manager.js';
import { listDesktopRecommendations } from './mobile-preview-desktop-recommendation.js';
import { getMobilePreviewHistory } from './mobile-preview-history.js';
import { getMobilePreviewDiagnostics, runMobilePreviewDiagnosticsScan } from './mobile-preview-diagnostics.js';
import { detectMobilePreviewCommandMismatch } from './mobile-preview-command-bridge.js';
import { detectMobilePreviewChatMismatch } from './mobile-preview-chat-bridge.js';
import { detectMobilePreviewCloudMismatch } from './mobile-preview-cloud-bridge.js';
import { detectMobilePreviewWorkspaceMismatch } from './mobile-preview-workspace-bridge.js';
import { detectMobilePreviewBuildMismatch } from './mobile-preview-build-bridge.js';
import { detectMobilePreviewVerificationMismatch } from './mobile-preview-verification-bridge.js';
import { isMobilePreviewRuntimeFoundationQuestion } from './mobile-preview-types.js';
import type { MobilePreviewReport, MobilePreviewReportType } from './mobile-preview-types.js';

let reportCounter = 0;

export function resetMobilePreviewReportCounterForTests(): void {
  reportCounter = 0;
}

function buildReport(reportType: MobilePreviewReportType, summary: string, findings: string[]): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const tracked = listStoredMobilePreviewTrackedSessions();
  const links = listPreviewLinks();
  return {
    reportId: `mpvrpt-${(++reportCounter).toString().padStart(4, '0')}`,
    reportType,
    generatedAt: Date.now(),
    mobilePreviewCount: sessions.length,
    previewLinkCount: links.length,
    sessionCount: tracked.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildMobilePreviewInventoryReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId} — ${s.mobilePreviewMetadata.previewName} (${s.mobilePreviewType}) state=${s.mobilePreviewState}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_INVENTORY_REPORT',
    `Mobile preview inventory — ${sessions.length} sessions`,
    findings.length ? findings : ['No sessions'],
  );
}

export function buildMobilePreviewOwnershipReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: command=${s.mobilePreviewOwner.mobileCommandSessionId} chat=${s.mobilePreviewOwner.mobileChatSessionId} project=${s.mobilePreviewOwner.projectId}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_OWNERSHIP_REPORT',
    `Ownership — ${sessions.length} records`,
    findings.length ? findings : ['No ownership records'],
  );
}

export function buildMobilePreviewLifecycleReport(): MobilePreviewReport {
  const events = listStoredMobilePreviewLifecycleEvents();
  const findings = events.map((e) => `${e.mobilePreviewId}: ${e.eventType}`);
  return buildReport(
    'MOBILE_PREVIEW_LIFECYCLE_REPORT',
    `Lifecycle — ${events.length} events`,
    findings.length ? findings : ['No events'],
  );
}

export function buildMobilePreviewStateReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map((s) => `${s.mobilePreviewId}: ${s.mobilePreviewState}`);
  return buildReport(
    'MOBILE_PREVIEW_STATE_REPORT',
    `State — ${sessions.length} records`,
    findings.length ? findings : ['No state records'],
  );
}

export function buildMobilePreviewContextReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map((s) => `${s.mobilePreviewId}: ${s.mobilePreviewContext.contextSummary}`);
  return buildReport(
    'MOBILE_PREVIEW_CONTEXT_REPORT',
    `Context — ${sessions.length} records`,
    findings.length ? findings : ['No context'],
  );
}

export function buildMobilePreviewEligibilityReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions
    .filter((s) => s.mobilePreviewEligibility)
    .map((s) => `${s.mobilePreviewId}: ${s.mobilePreviewEligibility!.result} — ${s.mobilePreviewEligibility!.eligibilityReason}`);
  return buildReport(
    'MOBILE_PREVIEW_ELIGIBILITY_REPORT',
    `Eligibility — ${findings.length} records`,
    findings.length ? findings : ['No eligibility records'],
  );
}

export function buildMobilePreviewSafetyReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions
    .filter((s) => s.mobilePreviewSafety)
    .map((s) => `${s.mobilePreviewId}: ${s.mobilePreviewSafety!.result} — ${s.mobilePreviewSafety!.reason}`);
  return buildReport(
    'MOBILE_PREVIEW_SAFETY_REPORT',
    `Safety — ${findings.length} records`,
    findings.length ? findings : ['No safety records'],
  );
}

export function buildMobilePreviewDevicePolicyReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions
    .filter((s) => s.mobilePreviewDevicePolicy)
    .map((s) => `${s.mobilePreviewId}: ${s.mobilePreviewDevicePolicy!.mobilePreviewPolicy}`);
  return buildReport(
    'MOBILE_PREVIEW_DEVICE_POLICY_REPORT',
    `Device policy — ${findings.length} records`,
    findings.length ? findings : ['No device policy records'],
  );
}

export function buildMobilePreviewDesktopRecommendationReport(): MobilePreviewReport {
  const recommendations = listDesktopRecommendations();
  const findings = recommendations.map((r) => `${r.mobilePreviewId}: ${r.level} — ${r.reason}`);
  return buildReport(
    'MOBILE_PREVIEW_DESKTOP_RECOMMENDATION_REPORT',
    `Desktop recommendations — ${recommendations.length} records`,
    findings.length ? findings : ['No desktop recommendations'],
  );
}

export function buildMobilePreviewLinkReport(): MobilePreviewReport {
  const links = listPreviewLinks();
  const findings = links.map((l) => `${l.linkId}: ${l.mobilePreviewId} [${l.linkType}] ${l.urlMetadata}`);
  return buildReport(
    'MOBILE_PREVIEW_LINK_REPORT',
    `Preview links — ${links.length} records`,
    findings.length ? findings : ['No preview links'],
  );
}

export function buildMobilePreviewCommandLinkReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: command=${s.mobilePreviewCommandLink.mobileCommandId} mismatch=${detectMobilePreviewCommandMismatch(s.mobilePreviewId)}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_COMMAND_LINK_REPORT',
    `Command links — ${sessions.length}`,
    findings.length ? findings : ['No command links'],
  );
}

export function buildMobilePreviewChatLinkReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: chat=${s.mobilePreviewChatLink.mobileChatId} mismatch=${detectMobilePreviewChatMismatch(s.mobilePreviewId)}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_CHAT_LINK_REPORT',
    `Chat links — ${sessions.length}`,
    findings.length ? findings : ['No chat links'],
  );
}

export function buildMobilePreviewCloudLinkReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: runtime=${s.mobilePreviewCloudLink.runtimeId} mismatch=${detectMobilePreviewCloudMismatch(s.mobilePreviewId)}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_CLOUD_LINK_REPORT',
    `Cloud links — ${sessions.length}`,
    findings.length ? findings : ['No cloud links'],
  );
}

export function buildMobilePreviewWorkspaceLinkReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: workspace=${s.mobilePreviewWorkspaceLink.workspaceId} mismatch=${detectMobilePreviewWorkspaceMismatch(s.mobilePreviewId)}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_WORKSPACE_LINK_REPORT',
    `Workspace links — ${sessions.length}`,
    findings.length ? findings : ['No workspace links'],
  );
}

export function buildMobilePreviewBuildLinkReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: build=${s.mobilePreviewBuildLink.persistentBuildId} mismatch=${detectMobilePreviewBuildMismatch(s.mobilePreviewId)}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_BUILD_LINK_REPORT',
    `Build links — ${sessions.length}`,
    findings.length ? findings : ['No build links'],
  );
}

export function buildMobilePreviewVerificationLinkReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: verification=${s.mobilePreviewVerificationLink.verificationId} mismatch=${detectMobilePreviewVerificationMismatch(s.mobilePreviewId)}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_VERIFICATION_LINK_REPORT',
    `Verification links — ${sessions.length}`,
    findings.length ? findings : ['No verification links'],
  );
}

export function buildMobilePreviewOperatorFeedReport(): MobilePreviewReport {
  const sessions = listStoredMobilePreviewSessions();
  const findings = sessions.map(
    (s) =>
      `${s.mobilePreviewId}: feed=${s.mobilePreviewOperatorFeedLink.feedAuthorityId} mismatch=${s.mobilePreviewOperatorFeedLink.mismatchDetected}`,
  );
  return buildReport(
    'MOBILE_PREVIEW_OPERATOR_FEED_REPORT',
    `Operator feed links — ${sessions.length}`,
    findings.length ? findings : ['No operator feed links'],
  );
}

export function buildMobilePreviewHistoryReport(): MobilePreviewReport {
  const history = getMobilePreviewHistory();
  const findings = history.slice(-20).map((e) => `${e.mobilePreviewId} [${e.category}]: ${e.summary}`);
  return buildReport(
    'MOBILE_PREVIEW_HISTORY_REPORT',
    `History — ${history.length} entries`,
    findings.length ? findings : ['No history'],
  );
}

export function buildMobilePreviewDiagnosticsReport(): MobilePreviewReport {
  const diag = getMobilePreviewDiagnostics();
  const scan = runMobilePreviewDiagnosticsScan();
  const findings = [
    `Authority active: ${diag.mobilePreviewAuthorityActive}`,
    `Registered previews: ${diag.registeredMobilePreviewCount}`,
    `Preview links: ${diag.registeredPreviewLinkCount}`,
    `Command mismatches: ${diag.commandMismatchCount}`,
    `Chat mismatches: ${diag.chatMismatchCount}`,
    `Operator feed mismatches tracked via diagnostics`,
    ...scan.slice(0, 10),
  ];
  return buildReport(
    'MOBILE_PREVIEW_DIAGNOSTICS_REPORT',
    'Diagnostics — authority validation only',
    findings,
  );
}

export function buildAllMobilePreviewReports(): MobilePreviewReport[] {
  return [
    buildMobilePreviewInventoryReport(),
    buildMobilePreviewOwnershipReport(),
    buildMobilePreviewLifecycleReport(),
    buildMobilePreviewStateReport(),
    buildMobilePreviewContextReport(),
    buildMobilePreviewEligibilityReport(),
    buildMobilePreviewSafetyReport(),
    buildMobilePreviewDevicePolicyReport(),
    buildMobilePreviewDesktopRecommendationReport(),
    buildMobilePreviewLinkReport(),
    buildMobilePreviewCommandLinkReport(),
    buildMobilePreviewChatLinkReport(),
    buildMobilePreviewCloudLinkReport(),
    buildMobilePreviewWorkspaceLinkReport(),
    buildMobilePreviewBuildLinkReport(),
    buildMobilePreviewVerificationLinkReport(),
    buildMobilePreviewOperatorFeedReport(),
    buildMobilePreviewHistoryReport(),
    buildMobilePreviewDiagnosticsReport(),
  ];
}

export function composeMobilePreviewResponse(
  query: string,
  session: import('./mobile-preview-types.js').MobilePreviewSession | null,
  trackedSession: import('./mobile-preview-types.js').MobilePreviewTrackedSession | null,
  reports: MobilePreviewReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Mobile Preview Runtime Foundation: BLOCKED' : 'Mobile Preview Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  if (session) {
    lines.push(`Preview: ${session.mobilePreviewId} — ${session.mobilePreviewMetadata.previewName}`);
    lines.push(`State: ${session.mobilePreviewState}`);
    lines.push(`Links: ${session.mobilePreviewLinks.length}`);
  }
  if (trackedSession) lines.push(`Session: ${trackedSession.sessionId}`);
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Authority only — no mobile UI, preview streaming, or preview rendering.');
  return lines.join('\n');
}

export function buildMobilePreviewFailureContext(
  query: string,
): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isMobilePreviewRuntimeFoundationQuestion(query)) return [];
  return [
    {
      title: 'Mobile preview session blocked',
      description:
        'Registration rejected due to missing upstream links or duplicate mobile preview authority risk.',
      sourceSystem: 'mobile_preview_runtime_foundation',
    },
    {
      title: 'Mobile preview eligibility blocked',
      description: 'Eligibility evaluation blocked mobile preview — inspect command and chat upstream metadata.',
      sourceSystem: 'mobile_preview_runtime_foundation',
    },
    {
      title: 'Mobile preview safety blocked',
      description: 'Safety evaluation flagged elevated risk — desktop may be required.',
      sourceSystem: 'mobile_preview_runtime_foundation',
    },
    {
      title: 'Parallel mobile preview authority risk',
      description: 'Duplicate mobile preview authority detected — use Mobile Preview Runtime Foundation.',
      sourceSystem: 'mobile_preview_runtime_foundation',
    },
  ];
}

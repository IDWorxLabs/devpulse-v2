/**
 * Mobile Chat Runtime Foundation — report builder.
 */

import {
  listStoredMobileChatSessions,
  listStoredMobileChatTrackedSessions,
  listStoredMobileChatLifecycleEvents,
  listStoredMobileChatMessages,
} from './mobile-chat-store.js';
import { getMobileChatHistory } from './mobile-chat-history.js';
import { getMobileChatDiagnostics, runMobileChatDiagnosticsScan } from './mobile-chat-diagnostics.js';
import { detectMobileChatCloudMismatch } from './mobile-chat-cloud-bridge.js';
import { detectMobileChatWorkspaceMismatch } from './mobile-chat-workspace-bridge.js';
import { detectMobileChatBuildMismatch } from './mobile-chat-build-bridge.js';
import { detectMobileChatVerificationMismatch } from './mobile-chat-verification-bridge.js';
import { detectMobileChatMonitoringMismatch } from './mobile-chat-monitoring-bridge.js';
import { detectMobileChatCommandMismatch } from './mobile-chat-command-bridge.js';
import { detectMobileChatOperatorFeedMismatch } from './mobile-chat-operator-feed-bridge.js';
import { detectMobileChatProjectVaultMismatch } from './mobile-chat-project-vault-bridge.js';
import { isMobileChatRuntimeFoundationQuestion } from './mobile-chat-types.js';
import type { MobileChatReport, MobileChatReportType } from './mobile-chat-types.js';

let reportCounter = 0;

export function resetMobileChatReportCounterForTests(): void {
  reportCounter = 0;
}

function buildReport(reportType: MobileChatReportType, summary: string, findings: string[]): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const tracked = listStoredMobileChatTrackedSessions();
  const messages = listStoredMobileChatMessages();
  return {
    reportId: `mchrpt-${(++reportCounter).toString().padStart(4, '0')}`,
    reportType,
    generatedAt: Date.now(),
    mobileChatCount: sessions.length,
    messageCount: messages.length,
    sessionCount: tracked.length,
    summary,
    findings,
    managementOnly: true,
  };
}

export function buildMobileChatInventoryReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map(
    (s) => `${s.mobileChatId} — ${s.mobileChatMetadata.chatName} (${s.mobileChatType}) state=${s.mobileChatState}`,
  );
  return buildReport('MOBILE_CHAT_INVENTORY_REPORT', `Mobile chat inventory — ${sessions.length} sessions`, findings.length ? findings : ['No sessions']);
}

export function buildMobileChatOwnershipReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: command=${s.mobileChatOwner.mobileCommandSessionId} project=${s.mobileChatOwner.projectId}`);
  return buildReport('MOBILE_CHAT_OWNERSHIP_REPORT', `Ownership — ${sessions.length} records`, findings.length ? findings : ['No ownership records']);
}

export function buildMobileChatLifecycleReport(): MobileChatReport {
  const events = listStoredMobileChatLifecycleEvents();
  const findings = events.map((e) => `${e.mobileChatId}: ${e.eventType}`);
  return buildReport('MOBILE_CHAT_LIFECYCLE_REPORT', `Lifecycle — ${events.length} events`, findings.length ? findings : ['No events']);
}

export function buildMobileChatStateReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: ${s.mobileChatState}`);
  return buildReport('MOBILE_CHAT_STATE_REPORT', `State — ${sessions.length} records`, findings.length ? findings : ['No state records']);
}

export function buildMobileChatContextReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: ${s.mobileChatContext.contextSummary}`);
  return buildReport('MOBILE_CHAT_CONTEXT_REPORT', `Context — ${sessions.length} records`, findings.length ? findings : ['No context']);
}

export function buildMobileChatMessageReport(): MobileChatReport {
  const messages = listStoredMobileChatMessages();
  const findings = messages.map((m) => `${m.messageId}: ${m.mobileChatId} [${m.messageRole}]`);
  return buildReport('MOBILE_CHAT_MESSAGE_REPORT', `Messages — ${messages.length} records`, findings.length ? findings : ['No messages']);
}

export function buildMobileChatPromptReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.flatMap((s) => s.mobileChatPrompts.map((p) => `${s.mobileChatId}: ${p.promptId} giant=${p.giantPromptFlag}`));
  return buildReport('MOBILE_CHAT_PROMPT_REPORT', `Prompts — ${findings.length} records`, findings.length ? findings : ['No prompts']);
}

export function buildMobileChatResponseStateReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions
    .filter((s) => s.mobileChatResponseState)
    .map((s) => `${s.mobileChatId}: ${s.mobileChatResponseState!.responseStatus} — ${s.mobileChatResponseState!.responseSummary}`);
  return buildReport('MOBILE_CHAT_RESPONSE_STATE_REPORT', `Response state — ${findings.length} records`, findings.length ? findings : ['No response state']);
}

export function buildMobileChatCommandRoutingReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.flatMap((s) => s.mobileChatCommandRoutes.map((r) => `${s.mobileChatId}: → ${r.targetSystem}`));
  return buildReport('MOBILE_CHAT_COMMAND_ROUTING_REPORT', `Routing — ${findings.length} routes`, findings.length ? findings : ['No routes']);
}

export function buildMobileChatActionGateReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.flatMap((s) => s.mobileChatActionGateResults.map((g) => `${s.mobileChatId}: ${g.actionName} → ${g.result}`));
  return buildReport('MOBILE_CHAT_ACTION_GATE_REPORT', `Action gate — ${findings.length} results`, findings.length ? findings : ['No gate results']);
}

export function buildMobileChatCloudLinkReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: runtime=${s.mobileChatCloudLink.runtimeId} mismatch=${detectMobileChatCloudMismatch(s.mobileChatId)}`);
  return buildReport('MOBILE_CHAT_CLOUD_LINK_REPORT', `Cloud links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatWorkspaceLinkReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: workspace=${s.mobileChatWorkspaceLink.workspaceId} mismatch=${detectMobileChatWorkspaceMismatch(s.mobileChatId)}`);
  return buildReport('MOBILE_CHAT_WORKSPACE_LINK_REPORT', `Workspace links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatBuildLinkReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: build=${s.mobileChatBuildLink.persistentBuildId} mismatch=${detectMobileChatBuildMismatch(s.mobileChatId)}`);
  return buildReport('MOBILE_CHAT_BUILD_LINK_REPORT', `Build links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatVerificationLinkReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: verification=${s.mobileChatVerificationLink.verificationId}`);
  return buildReport('MOBILE_CHAT_VERIFICATION_LINK_REPORT', `Verification links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatMonitoringLinkReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: monitoring=${s.mobileChatMonitoringLink.monitoringId}`);
  return buildReport('MOBILE_CHAT_MONITORING_LINK_REPORT', `Monitoring links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatOperatorFeedReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: feed=${s.mobileChatOperatorFeedLink.feedAuthorityId} mismatch=${detectMobileChatOperatorFeedMismatch(s.mobileChatId)}`);
  return buildReport('MOBILE_CHAT_OPERATOR_FEED_REPORT', `Operator feed links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatProjectVaultReport(): MobileChatReport {
  const sessions = listStoredMobileChatSessions();
  const findings = sessions.map((s) => `${s.mobileChatId}: vault=${s.mobileChatProjectVaultLink.vaultProjectId} mismatch=${detectMobileChatProjectVaultMismatch(s.mobileChatId)}`);
  return buildReport('MOBILE_CHAT_PROJECT_VAULT_REPORT', `Project vault links — ${sessions.length}`, findings.length ? findings : ['No links']);
}

export function buildMobileChatHistoryReport(): MobileChatReport {
  const history = getMobileChatHistory();
  const findings = history.slice(-20).map((e) => `${e.mobileChatId} [${e.category}]: ${e.summary}`);
  return buildReport('MOBILE_CHAT_HISTORY_REPORT', `History — ${history.length} entries`, findings.length ? findings : ['No history']);
}

export function buildMobileChatDiagnosticsReport(): MobileChatReport {
  const diag = getMobileChatDiagnostics();
  const scan = runMobileChatDiagnosticsScan();
  const findings = [
    `Authority active: ${diag.mobileChatAuthorityActive}`,
    `Registered chats: ${diag.registeredMobileChatCount}`,
    `Messages: ${diag.registeredMessageCount}`,
    `Command mismatches: ${diag.commandMismatchCount}`,
    ...scan.slice(0, 10),
  ];
  return buildReport('MOBILE_CHAT_DIAGNOSTICS_REPORT', 'Diagnostics — authority validation only', findings);
}

export function buildAllMobileChatReports(): MobileChatReport[] {
  return [
    buildMobileChatInventoryReport(),
    buildMobileChatOwnershipReport(),
    buildMobileChatLifecycleReport(),
    buildMobileChatStateReport(),
    buildMobileChatContextReport(),
    buildMobileChatMessageReport(),
    buildMobileChatPromptReport(),
    buildMobileChatResponseStateReport(),
    buildMobileChatCommandRoutingReport(),
    buildMobileChatActionGateReport(),
    buildMobileChatCloudLinkReport(),
    buildMobileChatWorkspaceLinkReport(),
    buildMobileChatBuildLinkReport(),
    buildMobileChatVerificationLinkReport(),
    buildMobileChatMonitoringLinkReport(),
    buildMobileChatOperatorFeedReport(),
    buildMobileChatProjectVaultReport(),
    buildMobileChatHistoryReport(),
    buildMobileChatDiagnosticsReport(),
  ];
}

export function composeMobileChatResponse(
  query: string,
  session: import('./mobile-chat-types.js').MobileChatSession | null,
  trackedSession: import('./mobile-chat-types.js').MobileChatTrackedSession | null,
  reports: MobileChatReport[],
  blocked: boolean,
): string {
  const lines: string[] = [];
  lines.push(blocked ? 'Mobile Chat Runtime Foundation: BLOCKED' : 'Mobile Chat Runtime Foundation: READY');
  lines.push(`Query: ${query}`);
  if (session) {
    lines.push(`Chat: ${session.mobileChatId} — ${session.mobileChatMetadata.chatName}`);
    lines.push(`State: ${session.mobileChatState}`);
    lines.push(`Prompts: ${session.mobileChatPrompts.length}`);
  }
  if (trackedSession) lines.push(`Session: ${trackedSession.sessionId}`);
  lines.push('Reports:');
  for (const r of reports) lines.push(`  ${r.reportType}: ${r.summary}`);
  lines.push('Authority only — no mobile UI, LLM execution, or cloud execution.');
  return lines.join('\n');
}

export function buildMobileChatFailureContext(query: string): Array<{ title: string; description: string; sourceSystem: string }> {
  if (!isMobileChatRuntimeFoundationQuestion(query)) return [];
  return [
    { title: 'Mobile chat session blocked', description: 'Registration rejected due to missing upstream links or duplicate chat authority risk.', sourceSystem: 'mobile_chat_runtime_foundation' },
    { title: 'Mobile chat action blocked', description: 'Action gate blocked mobile chat intent — inspect permissions metadata.', sourceSystem: 'mobile_chat_runtime_foundation' },
    { title: 'Mobile chat context required', description: 'Chat action requires context preparation before routing.', sourceSystem: 'mobile_chat_runtime_foundation' },
    { title: 'Parallel mobile chat authority risk', description: 'Duplicate mobile chat authority detected — use Mobile Chat Runtime Foundation.', sourceSystem: 'mobile_chat_runtime_foundation' },
  ];
}

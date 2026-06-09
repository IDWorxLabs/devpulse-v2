/**
 * Founder Inbox Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForFounderInbox } from './read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { listNotificationsAll } from '../founder-notification-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries } from './founder-inbox-store.js';
import { resolveNotificationForInboxRegistration } from './founder-inbox-notification-bridge.js';
import { detectInboxCrossDeviceMismatch } from './founder-inbox-cross-device-bridge.js';
import { detectInboxCloudMismatch } from './founder-inbox-cloud-bridge.js';
import { detectInboxCommandMismatch } from './founder-inbox-command-bridge.js';
import { detectInboxChatMismatch } from './founder-inbox-chat-bridge.js';
import { detectInboxPreviewMismatch } from './founder-inbox-preview-bridge.js';
import { detectInboxApprovalMismatch } from './founder-inbox-approval-bridge.js';
import {
  validateInboxContext,
  detectInboxContextMismatch,
} from './founder-inbox-context.js';
import type {
  FounderInboxEntry,
  InboxValidationResult,
  DuplicateInboxRiskContext,
  RegisterInboxEntryInput,
} from './founder-inbox-types.js';
import {
  FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
  DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX,
  FORBIDDEN_INBOX_DUPLICATES,
  INBOX_COMPANION_DOMAINS,
  validateInboxState,
} from './founder-inbox-types.js';

export function buildDuplicateInboxRiskContext(
  inboxEntryName: string,
  inboxCategory: RegisterInboxEntryInput['inboxCategory'] = 'GENERAL_INBOX',
): DuplicateInboxRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('inbox') || (desc.includes('notification') && !desc.includes('founder_notification'));
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('inbox');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    inboxEntryName,
    inboxCategory: inboxCategory ?? 'GENERAL_INBOX',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForFounderInbox().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    notificationSummaries: listNotificationsAll().map(
      (n) => `${n.notificationId} ${n.notificationMetadata.notificationName}`,
    ),
    crossDeviceSummaries: listCrossDeviceSessionsAll().map(
      (d) => `${d.crossDeviceId} ${d.crossDeviceMetadata.crossDeviceName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
  };
}

export function evaluateDuplicateInboxRisk(context: DuplicateInboxRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(INBOX_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('inbox') && domain !== 'founder_inbox_foundation') {
      risks.push(
        `${DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX}: ownership domain "${domain}" overlaps inbox visualization authority`,
      );
    }
  }

  for (const term of FORBIDDEN_INBOX_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX}: parallel inbox authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateInboxRegistration(input: RegisterInboxEntryInput): InboxValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.projectId?.trim()) blockers.push('Missing project');
  if (!input.runtimeId?.trim()) blockers.push('Missing runtime link');
  if (!input.workspaceId?.trim()) blockers.push('Missing workspace link');
  if (!input.persistentBuildId?.trim()) blockers.push('Missing build link');
  if (!input.deviceId?.trim()) blockers.push('Missing device id');
  if (!input.crossDeviceSessionId?.trim()) blockers.push('Missing cross device session link');
  if (!input.approvalId?.trim()) blockers.push('Missing approval link');
  if (!input.previewId?.trim()) blockers.push('Missing preview link');
  if (!input.commandSessionId?.trim()) blockers.push('Missing command link');
  if (!input.chatSessionId?.trim()) blockers.push('Missing chat link');
  if (!input.notificationId?.trim()) blockers.push('Missing notification reference');
  if (!input.inboxEntryName?.trim()) blockers.push('Missing inbox entry name');

  if (!resolveNotificationForInboxRegistration(input.notificationId).exists) {
    blockers.push('Broken notification reference — Founder Notification Runtime is notification authority');
  }
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const riskContext = buildDuplicateInboxRiskContext(input.inboxEntryName, input.inboxCategory);
  const duplicateRisks = evaluateDuplicateInboxRisk(riskContext);
  if (duplicateRisks.length > 0 && !input.allowDuplicate) {
    warnings.push(...duplicateRisks);
  }

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    duplicateRisks,
  };
}

export function validateInboxRecord(entry: FounderInboxEntry | null): InboxValidationResult {
  if (!entry) {
    return { valid: false, blockers: ['Missing inbox entry'], warnings: [], duplicateRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validateInboxState(entry.inboxState)) {
    blockers.push(`Invalid state: ${entry.inboxState}`);
  }

  if (!validateInboxContext(entry.inboxContext)) {
    warnings.push('Invalid inbox context');
  }

  if (detectInboxContextMismatch(entry.inboxEntryId)) {
    warnings.push('Context mismatch detected');
  }

  if (entry.inboxOwnership.ownerModule !== FOUNDER_INBOX_FOUNDATION_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  if (!resolveNotificationForInboxRegistration(entry.notificationId).exists) {
    blockers.push('Broken notification reference');
  }

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export { validateInboxState };

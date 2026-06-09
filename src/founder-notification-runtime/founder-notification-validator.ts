/**
 * Founder Notification Runtime Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForFounderNotification } from './read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { listMobileChatSessionsAll } from '../mobile-chat-runtime/index.js';
import { listMobilePreviewSessionsAll } from '../mobile-preview-runtime/index.js';
import { listMobileApprovalSessionsAll } from '../mobile-approval-runtime/index.js';
import { listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredNotification, listStoredNotifications } from './founder-notification-store.js';
import { resolveCommandForNotificationRegistration } from './founder-notification-command-bridge.js';
import { resolveChatForNotificationRegistration } from './founder-notification-chat-bridge.js';
import { resolvePreviewForNotificationRegistration } from './founder-notification-preview-bridge.js';
import { resolveApprovalForNotificationRegistration } from './founder-notification-approval-bridge.js';
import { resolveRuntimeForNotificationRegistration } from './founder-notification-cloud-bridge.js';
import { resolveCrossDeviceForNotificationRegistration } from './founder-notification-cross-device-bridge.js';
import { resolveMobileForNotificationRegistration } from './founder-notification-mobile-bridge.js';
import {
  validateNotificationContext,
  detectNotificationContextMismatch,
} from './founder-notification-context.js';
import type {
  FounderNotification,
  NotificationValidationResult,
  DuplicateNotificationRiskContext,
  RegisterNotificationInput,
} from './founder-notification-types.js';
import {
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
  DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX,
  FORBIDDEN_NOTIFICATION_DUPLICATES,
  NOTIFICATION_COMPANION_DOMAINS,
  validateNotificationState,
} from './founder-notification-types.js';

export function buildDuplicateNotificationRiskContext(
  notificationName: string,
  notificationCategory: RegisterNotificationInput['notificationCategory'] = 'GENERAL_NOTIFICATION',
): DuplicateNotificationRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('notification');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('notification');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    notificationName,
    notificationCategory: notificationCategory ?? 'GENERAL_NOTIFICATION',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForFounderNotification().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    mobileCommandSummaries: listMobileCommandSessionsAll().map(
      (c) => `${c.mobileCommandId} ${c.mobileCommandMetadata.commandName}`,
    ),
    mobileChatSummaries: listMobileChatSessionsAll().map(
      (c) => `${c.mobileChatId} ${c.mobileChatMetadata.chatName}`,
    ),
    mobilePreviewSummaries: listMobilePreviewSessionsAll().map(
      (p) => `${p.mobilePreviewId} ${p.mobilePreviewMetadata.previewName}`,
    ),
    mobileApprovalSummaries: listMobileApprovalSessionsAll().map(
      (a) => `${a.mobileApprovalId} ${a.mobileApprovalMetadata.approvalName}`,
    ),
    crossDeviceSummaries: listCrossDeviceSessionsAll().map(
      (d) => `${d.crossDeviceId} ${d.crossDeviceMetadata.crossDeviceName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
  };
}

export function evaluateDuplicateNotificationRisk(context: DuplicateNotificationRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(NOTIFICATION_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('notification')) {
      risks.push(
        `${DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX}: ownership domain "${domain}" overlaps notification authority`,
      );
    }
  }

  for (const term of FORBIDDEN_NOTIFICATION_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX}: parallel notification authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateNotificationRegistration(input: RegisterNotificationInput): NotificationValidationResult {
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
  if (!input.notificationName?.trim()) blockers.push('Missing notification name');

  if (!resolveCommandForNotificationRegistration(input.commandSessionId).exists) {
    blockers.push('Broken mobile command reference');
  }
  if (!resolveChatForNotificationRegistration(input.chatSessionId).exists) {
    blockers.push('Broken mobile chat reference');
  }
  if (!resolvePreviewForNotificationRegistration(input.previewId).exists) {
    blockers.push('Broken mobile preview reference');
  }
  if (!resolveApprovalForNotificationRegistration(input.approvalId).exists) {
    blockers.push('Broken mobile approval reference');
  }
  if (!resolveRuntimeForNotificationRegistration(input.runtimeId).exists) blockers.push('Broken runtime reference');
  if (!resolveCrossDeviceForNotificationRegistration(input.crossDeviceSessionId).exists) {
    blockers.push('Broken cross device reference');
  }
  if (!resolveMobileForNotificationRegistration(input.crossDeviceSessionId).exists) {
    blockers.push('Broken mobile cross device reference');
  }
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const riskContext = buildDuplicateNotificationRiskContext(input.notificationName, input.notificationCategory);
  const duplicateRisks = evaluateDuplicateNotificationRisk(riskContext);
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

export function validateNotificationRecord(notification: FounderNotification | null): NotificationValidationResult {
  if (!notification) {
    return { valid: false, blockers: ['Missing notification'], warnings: [], duplicateRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validateNotificationState(notification.notificationState)) {
    blockers.push(`Invalid state: ${notification.notificationState}`);
  }

  const contextIssues = validateNotificationContext(notification.notificationContext);
  warnings.push(...contextIssues);

  if (detectNotificationContextMismatch(notification.notificationId)) {
    warnings.push('Context mismatch detected');
  }

  if (notification.notificationOwnership.ownerModule !== FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export { validateNotificationState };

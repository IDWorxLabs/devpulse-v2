/**
 * Notification Delivery Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForNotificationDelivery } from './read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { listNotificationsAll } from '../founder-notification-runtime/index.js';
import { listInboxEntriesAll } from '../founder-inbox/index.js';
import { getStoredDeliveryRecord, listStoredDeliveryRecords } from './notification-delivery-store.js';
import { resolveNotificationForDeliveryRegistration } from './notification-delivery-notification-bridge.js';
import { resolveInboxForDeliveryRegistration } from './notification-delivery-inbox-bridge.js';
import { detectDeliveryCrossDeviceMismatch } from './notification-delivery-cross-device-bridge.js';
import { detectDeliveryCloudMismatch } from './notification-delivery-cloud-bridge.js';
import { detectDeliveryCommandMismatch } from './notification-delivery-command-bridge.js';
import { detectDeliveryChatMismatch } from './notification-delivery-chat-bridge.js';
import { detectDeliveryPreviewMismatch } from './notification-delivery-preview-bridge.js';
import { detectDeliveryApprovalMismatch } from './notification-delivery-approval-bridge.js';
import {
  validateDeliveryContext,
  detectDeliveryContextMismatch,
} from './notification-delivery-context.js';
import type {
  NotificationDeliveryRecord,
  DeliveryValidationResult,
  DuplicateDeliveryRiskContext,
  RegisterDeliveryRecordInput,
} from './notification-delivery-types.js';
import {
  NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
  DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX,
  FORBIDDEN_DELIVERY_DUPLICATES,
  DELIVERY_COMPANION_DOMAINS,
  validateDeliveryState,
} from './notification-delivery-types.js';

export function buildDuplicateDeliveryRiskContext(
  deliveryName: string,
  deliveryCategory: RegisterDeliveryRecordInput['deliveryCategory'] = 'GENERAL_DELIVERY',
): DuplicateDeliveryRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('delivery') || desc.includes('push') || desc.includes('email') || desc.includes('sms');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('delivery');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    deliveryName,
    deliveryCategory: deliveryCategory ?? 'GENERAL_DELIVERY',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForNotificationDelivery().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    notificationSummaries: listNotificationsAll().map(
      (n) => `${n.notificationId} ${n.notificationMetadata.notificationName}`,
    ),
    inboxSummaries: listInboxEntriesAll().map(
      (e) => `${e.inboxEntryId} ${e.inboxMetadata.inboxEntryName}`,
    ),
    crossDeviceSummaries: listCrossDeviceSessionsAll().map(
      (d) => `${d.crossDeviceId} ${d.crossDeviceMetadata.crossDeviceName}`,
    ),
    runtimeSummaries: listRuntimes().map((r) => `${r.runtimeId} ${r.runtimeMetadata.runtimeName}`),
    workspaceSummaries: listWorkspaces().map((w) => `${w.workspaceId} ${w.workspaceMetadata.workspaceName}`),
    persistentBuildSummaries: listPersistentBuilds().map((b) => `${b.buildId} ${b.buildMetadata.buildName}`),
  };
}

export function evaluateDuplicateDeliveryRisk(context: DuplicateDeliveryRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(DELIVERY_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('delivery') && domain !== 'notification_delivery_foundation') {
      risks.push(
        `${DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX}: ownership domain "${domain}" overlaps delivery planning authority`,
      );
    }
  }

  for (const term of FORBIDDEN_DELIVERY_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX}: parallel delivery authority "${term}" registered`);
    }
  }

  return risks;
}

export function validateDeliveryRegistration(input: RegisterDeliveryRecordInput): DeliveryValidationResult {
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
  if (!input.inboxEntryId?.trim()) blockers.push('Missing inbox entry reference');
  if (!input.deliveryName?.trim()) blockers.push('Missing delivery name');

  if (!resolveNotificationForDeliveryRegistration(input.notificationId).exists) {
    blockers.push('Broken notification reference — Founder Notification Runtime is notification authority');
  }
  if (!resolveInboxForDeliveryRegistration(input.inboxEntryId).exists) {
    blockers.push('Broken inbox reference — Founder Inbox is visualization authority');
  }
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const riskContext = buildDuplicateDeliveryRiskContext(input.deliveryName, input.deliveryCategory);
  const duplicateRisks = evaluateDuplicateDeliveryRisk(riskContext);
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

export function validateDeliveryRecord(record: NotificationDeliveryRecord | null): DeliveryValidationResult {
  if (!record) {
    return { valid: false, blockers: ['Missing delivery record'], warnings: [], duplicateRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!validateDeliveryState(record.deliveryState)) {
    blockers.push(`Invalid state: ${record.deliveryState}`);
  }

  if (!validateDeliveryContext(record.deliveryContext)) {
    warnings.push('Invalid delivery context');
  }

  if (detectDeliveryContextMismatch(record.deliveryId)) {
    warnings.push('Context mismatch detected');
  }

  if (record.deliveryOwnership.ownerModule !== NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  if (!resolveNotificationForDeliveryRegistration(record.notificationId).exists) {
    blockers.push('Broken notification reference');
  }

  if (!resolveInboxForDeliveryRegistration(record.inboxEntryId).exists) {
    blockers.push('Broken inbox reference');
  }

  if (detectDeliveryCrossDeviceMismatch(record.deliveryId)) warnings.push('Cross device mismatch');
  if (detectDeliveryCloudMismatch(record.deliveryId)) warnings.push('Cloud mismatch');
  if (detectDeliveryCommandMismatch(record.deliveryId)) warnings.push('Command mismatch');
  if (detectDeliveryChatMismatch(record.deliveryId)) warnings.push('Chat mismatch');
  if (detectDeliveryPreviewMismatch(record.deliveryId)) warnings.push('Preview mismatch');
  if (detectDeliveryApprovalMismatch(record.deliveryId)) warnings.push('Approval mismatch');

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [] };
}

export { validateDeliveryState };

/**
 * Mobile Push Foundation — validation and duplicate risk safeguards.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForMobilePush } from './read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { listRuntimes } from '../cloud-runtime/index.js';
import { listWorkspaces } from '../workspace-hosting/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { listDeliveryRecordsAll } from '../notification-delivery/index.js';
import { listNotificationsAll } from '../founder-notification-runtime/index.js';
import { listInboxEntriesAll } from '../founder-inbox/index.js';
import { getStoredPushRecord, listStoredPushRecords } from './mobile-push-store.js';
import { resolveDeliveryForPushRegistration } from './mobile-push-delivery-bridge.js';
import { resolveNotificationForPushRegistration } from './mobile-push-notification-bridge.js';
import { resolveInboxForPushRegistration } from './mobile-push-inbox-bridge.js';
import { detectPushCrossDeviceMismatch } from './mobile-push-cross-device-bridge.js';
import { detectPushCloudMismatch } from './mobile-push-cloud-bridge.js';
import { detectPushCommandMismatch } from './mobile-push-command-bridge.js';
import { detectPushChatMismatch } from './mobile-push-chat-bridge.js';
import { detectPushPreviewMismatch } from './mobile-push-preview-bridge.js';
import { detectPushApprovalMismatch } from './mobile-push-approval-bridge.js';
import { detectPushDeliveryMismatch } from './mobile-push-delivery-bridge.js';
import {
  validatePushContext,
  detectPushContextMismatch,
} from './mobile-push-context.js';
import type {
  MobilePushRecord,
  PushValidationResult,
  DuplicateMobilePushRiskContext,
  RegisterPushRecordInput,
} from './mobile-push-types.js';
import {
  MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
  DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX,
  FORBIDDEN_MOBILE_PUSH_DUPLICATES,
  MOBILE_PUSH_COMPANION_DOMAINS,
  validatePushState,
  detectRawTokenRisk,
} from './mobile-push-types.js';

export function buildDuplicateMobilePushRiskContext(
  pushName: string,
  pushCategory: RegisterPushRecordInput['pushCategory'] = 'GENERAL_PUSH',
): DuplicateMobilePushRiskContext {
  const ownershipDomains = listDevPulseV2Owners()
    .filter((o) => {
      const desc = `${o.domain} ${o.description} ${o.ownerModule}`.toLowerCase();
      return desc.includes('push') || desc.includes('fcm') || desc.includes('apns');
    })
    .map((o) => o.domain);

  const capabilityIds = INTELLIGENCE_CONSOLE_CAPABILITIES.filter((c) => {
    const label = `${c.capabilityId} ${c.label}`.toLowerCase();
    return label.includes('push') || label.includes('mobile push');
  }).map((c) => c.capabilityId);

  const vault = getDevPulseV2ProjectVaultAuthority();
  const feedDiag = getOperatorFeedDiagnostics();

  return {
    pushName,
    pushCategory: pushCategory ?? 'GENERAL_PUSH',
    ownershipDomains,
    capabilityIds,
    vaultSummaries: vault.listProjects().map((p) => `${p.projectId} ${p.name} ${p.summary}`),
    brainSummaries: readSystemSummariesForMobilePush().map((s) => `${s.systemId}: ${s.summary}`),
    operatorFeedSummaries: [`active=${feedDiag.operatorFeedActive} events=${feedDiag.eventCount}`],
    deliverySummaries: listDeliveryRecordsAll().map(
      (d) => `${d.deliveryId} ${d.deliveryMetadata.deliveryName}`,
    ),
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

export function evaluateDuplicateMobilePushRisk(context: DuplicateMobilePushRiskContext): string[] {
  const risks: string[] = [];
  const companionDomains = new Set<string>(MOBILE_PUSH_COMPANION_DOMAINS);

  for (const domain of context.ownershipDomains) {
    if (companionDomains.has(domain)) continue;
    if (domain.includes('push') && domain !== 'mobile_push_foundation') {
      risks.push(
        `${DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX}: ownership domain "${domain}" overlaps mobile push planning authority`,
      );
    }
  }

  for (const term of FORBIDDEN_MOBILE_PUSH_DUPLICATES) {
    const normalized = term.replace(/_/g, '').toLowerCase();
    if (
      context.ownershipDomains.some((d) => d.replace(/_/g, '').toLowerCase().includes(normalized)) ||
      context.capabilityIds.some((c) => c.replace(/_/g, '').toLowerCase().includes(normalized))
    ) {
      risks.push(`${DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX}: parallel mobile push authority "${term}" registered`);
    }
  }

  return risks;
}

export function detectRawTokenRisksInInput(input: RegisterPushRecordInput): string[] {
  const risks: string[] = [];
  if (input.tokenAlias && detectRawTokenRisk(input.tokenAlias)) {
    risks.push(`${DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX}: raw token risk in tokenAlias`);
  }
  if (input.tokenFingerprint && detectRawTokenRisk(input.tokenFingerprint)) {
    risks.push(`${DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX}: raw token risk in tokenFingerprint`);
  }
  return risks;
}

export function validatePushRegistration(input: RegisterPushRecordInput): PushValidationResult {
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
  if (!input.deliveryId?.trim()) blockers.push('Missing delivery reference');
  if (!input.notificationId?.trim()) blockers.push('Missing notification reference');
  if (!input.inboxEntryId?.trim()) blockers.push('Missing inbox entry reference');
  if (!input.pushName?.trim()) blockers.push('Missing push name');

  if (!resolveDeliveryForPushRegistration(input.deliveryId).exists) {
    blockers.push('Broken delivery reference — Notification Delivery Foundation is delivery authority');
  }
  if (!resolveNotificationForPushRegistration(input.notificationId).exists) {
    blockers.push('Broken notification reference — Founder Notification Runtime is notification authority');
  }
  if (!resolveInboxForPushRegistration(input.inboxEntryId).exists) {
    blockers.push('Broken inbox reference — Founder Inbox is visualization authority');
  }
  if (!getWorkspace(input.workspaceId)) blockers.push('Broken workspace reference');
  if (!getPersistentBuild(input.persistentBuildId)) blockers.push('Broken build reference');

  const rawTokenRisks = detectRawTokenRisksInInput(input);
  if (rawTokenRisks.length > 0) {
    blockers.push(...rawTokenRisks);
  }

  const riskContext = buildDuplicateMobilePushRiskContext(input.pushName, input.pushCategory);
  const duplicateRisks = evaluateDuplicateMobilePushRisk(riskContext);
  if (duplicateRisks.length > 0 && !input.allowDuplicate) {
    warnings.push(...duplicateRisks);
  }

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    duplicateRisks,
    rawTokenRisks,
  };
}

export function validatePushRecord(record: MobilePushRecord | null): PushValidationResult {
  if (!record) {
    return { valid: false, blockers: ['Missing push record'], warnings: [], duplicateRisks: [], rawTokenRisks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  const rawTokenRisks: string[] = [];

  if (!validatePushState(record.pushState)) {
    blockers.push(`Invalid state: ${record.pushState}`);
  }

  if (!validatePushContext(record.pushContext)) {
    warnings.push('Invalid push context');
  }

  if (detectPushContextMismatch(record.pushId)) {
    warnings.push('Context mismatch detected');
  }

  if (record.pushOwnership.ownerModule !== MOBILE_PUSH_FOUNDATION_OWNER_MODULE) {
    blockers.push('Invalid owner module');
  }

  if (!resolveDeliveryForPushRegistration(record.deliveryId).exists) {
    blockers.push('Broken delivery reference');
  }

  if (!resolveNotificationForPushRegistration(record.notificationId).exists) {
    blockers.push('Broken notification reference');
  }

  if (!resolveInboxForPushRegistration(record.inboxEntryId).exists) {
    blockers.push('Broken inbox reference');
  }

  if (record.pushTokenMetadata) {
    if (detectRawTokenRisk(record.pushTokenMetadata.tokenAlias)) {
      rawTokenRisks.push('Raw token risk in tokenAlias');
    }
    if (detectRawTokenRisk(record.pushTokenMetadata.tokenFingerprint)) {
      rawTokenRisks.push('Raw token risk in tokenFingerprint');
    }
  }

  if (detectPushDeliveryMismatch(record.pushId)) warnings.push('Delivery mismatch');
  if (detectPushCrossDeviceMismatch(record.pushId)) warnings.push('Cross device mismatch');
  if (detectPushCloudMismatch(record.pushId)) warnings.push('Cloud mismatch');
  if (detectPushCommandMismatch(record.pushId)) warnings.push('Command mismatch');
  if (detectPushChatMismatch(record.pushId)) warnings.push('Chat mismatch');
  if (detectPushPreviewMismatch(record.pushId)) warnings.push('Preview mismatch');
  if (detectPushApprovalMismatch(record.pushId)) warnings.push('Approval mismatch');

  if (rawTokenRisks.length > 0) {
    warnings.push(...rawTokenRisks);
  }

  return { valid: blockers.length === 0, blockers, warnings, duplicateRisks: [], rawTokenRisks };
}

export { validatePushState };

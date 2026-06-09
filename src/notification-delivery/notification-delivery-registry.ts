/**
 * Notification Delivery Foundation — registry and orchestrator.
 * Delivery planning/routing/targeting/eligibility only — no real delivery.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processMobileCommandRequest, listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { processMobileChatRequest, listMobileChatSessionsAll } from '../mobile-chat-runtime/index.js';
import { processMobilePreviewRequest, listMobilePreviewSessionsAll } from '../mobile-preview-runtime/index.js';
import { processMobileApprovalRequest, listMobileApprovalSessionsAll } from '../mobile-approval-runtime/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCrossDeviceRequest, listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { processFounderNotificationRequest, listNotificationsAll } from '../founder-notification-runtime/index.js';
import {
  processFounderInboxRequest,
  listInboxEntriesAll,
  getInboxEntry,
} from '../founder-inbox/index.js';
import { publishNotificationDeliveryFeedStages } from '../operator-feed/notification-delivery-feed-bridge.js';
import {
  nextDeliveryId,
  getStoredDeliveryRecord,
  listStoredDeliveryRecords,
  storeDeliveryRecord,
} from './notification-delivery-store.js';
import { buildDeliveryOwnership, recordDeliveryOwnershipHistory } from './notification-delivery-ownership.js';
import { buildDefaultDeliveryContext, refreshDeliveryContext } from './notification-delivery-context.js';
import { buildDefaultDeliveryVisibility, registerDeliveryVisibility } from './notification-delivery-visibility.js';
import { buildDefaultDeliveryPriority } from './notification-delivery-priority.js';
import { linkDeliveryToNotification } from './notification-delivery-notification-bridge.js';
import { linkDeliveryToInbox, findInboxEntryByName } from './notification-delivery-inbox-bridge.js';
import { linkDeliveryToCrossDevice } from './notification-delivery-cross-device-bridge.js';
import { linkDeliveryToCloud } from './notification-delivery-cloud-bridge.js';
import { linkDeliveryToCommand } from './notification-delivery-command-bridge.js';
import { linkDeliveryToChat } from './notification-delivery-chat-bridge.js';
import { linkDeliveryToPreview } from './notification-delivery-preview-bridge.js';
import { linkDeliveryToApproval } from './notification-delivery-approval-bridge.js';
import { linkDeliveryToOperatorFeed } from './notification-delivery-operator-feed-bridge.js';
import { linkDeliveryToProjectVault } from './notification-delivery-project-vault-bridge.js';
import {
  createDeliveryRecord,
  runDeliveryPlanningPipeline,
} from './notification-delivery-manager.js';
import { recordDeliveryHistoryEntry } from './notification-delivery-history.js';
import { validateDeliveryRegistration, validateDeliveryRecord } from './notification-delivery-validator.js';
import { updateDeliveryDiagnostics, getDeliveryDiagnostics } from './notification-delivery-diagnostics.js';
import { buildAllDeliveryReports, composeDeliveryResponse } from './notification-delivery-report-builder.js';
import { queryDeliveryRecords, listDeliveryRecordsAll } from './notification-delivery-query.js';
import { listDeliveriesByPriority } from './notification-delivery-priority.js';
import { listDeliveriesByChannel } from './notification-delivery-routing.js';
import type {
  NotificationDeliveryRecord,
  DeliveryCategory,
  DeliveryPriority,
  DeliveryChannel,
  DeliveryValidationResult,
  DeliveryOwnership,
  DeliveryVisibility,
  PrepareNotificationDeliveryFoundationInput,
  PrepareNotificationDeliveryFoundationResult,
  RegisterDeliveryRecordInput,
  RegisterDeliveryRecordResult,
} from './notification-delivery-types.js';
import {
  NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
  isDuplicateDeliveryExecutorQuestion,
  resolveDefaultChannelForCategory,
} from './notification-delivery-types.js';

const BOOTSTRAP_DELIVERY_RECORDS: Array<{
  inboxEntryNameMatch: string;
  deliveryName: string;
  category: DeliveryCategory;
  description: string;
  priority: DeliveryPriority;
  channel: DeliveryChannel;
}> = [
  { inboxEntryNameMatch: 'General Inbox Entry', deliveryName: 'General Delivery Record', category: 'GENERAL_DELIVERY', description: 'General delivery planning record', priority: 'NORMAL', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'General Inbox Entry', deliveryName: 'Founder Alert Delivery Record', category: 'FOUNDER_ALERT_DELIVERY', description: 'Founder alert delivery planning', priority: 'CRITICAL', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'Project Inbox Entry', deliveryName: 'Project Delivery Record', category: 'PROJECT_DELIVERY', description: 'Project delivery planning record', priority: 'HIGH', channel: 'OPERATOR_FEED' },
  { inboxEntryNameMatch: 'Mobile Inbox Entry', deliveryName: 'Mobile Delivery Record', category: 'MOBILE_DELIVERY', description: 'Mobile delivery planning record', priority: 'HIGH', channel: 'MOBILE' },
  { inboxEntryNameMatch: 'General Inbox Entry', deliveryName: 'Inbox Delivery Record', category: 'INBOX_DELIVERY', description: 'Inbox channel delivery planning', priority: 'NORMAL', channel: 'FOUNDER_INBOX' },
  { inboxEntryNameMatch: 'Cloud Inbox Entry', deliveryName: 'Cloud Delivery Record', category: 'CLOUD_DELIVERY', description: 'Cloud delivery planning record', priority: 'NORMAL', channel: 'OPERATOR_FEED' },
  { inboxEntryNameMatch: 'World 2 Inbox Entry', deliveryName: 'World 2 Delivery Record', category: 'WORLD2_DELIVERY', description: 'World 2 delivery planning record', priority: 'HIGH', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'Autonomous Builder Inbox Entry', deliveryName: 'Autonomous Builder Delivery Record', category: 'AUTONOMOUS_BUILDER_DELIVERY', description: 'Autonomous builder delivery planning', priority: 'NORMAL', channel: 'OPERATOR_FEED' },
  { inboxEntryNameMatch: 'AiDev Inbox Entry', deliveryName: 'AiDev Delivery Record', category: 'AIDEV_DELIVERY', description: 'AiDev delivery planning record', priority: 'NORMAL', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'Approval Inbox Entry', deliveryName: 'Approval Delivery Record', category: 'APPROVAL_DELIVERY', description: 'Approval delivery planning record', priority: 'HIGH', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'Preview Inbox Entry', deliveryName: 'Preview Delivery Record', category: 'PREVIEW_DELIVERY', description: 'Preview delivery planning record', priority: 'NORMAL', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'Command Inbox Entry', deliveryName: 'Command Delivery Record', category: 'COMMAND_DELIVERY', description: 'Command delivery planning record', priority: 'HIGH', channel: 'OPERATOR_FEED' },
  { inboxEntryNameMatch: 'Chat Inbox Entry', deliveryName: 'Chat Delivery Record', category: 'CHAT_DELIVERY', description: 'Chat delivery planning record', priority: 'NORMAL', channel: 'IN_APP' },
  { inboxEntryNameMatch: 'System Inbox Entry', deliveryName: 'System Delivery Record', category: 'SYSTEM_DELIVERY', description: 'System delivery planning record', priority: 'INFORMATIONAL', channel: 'PROJECT_VAULT' },
];

let bootstrapped = false;

export function resetNotificationDeliveryBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  if (
    listRuntimes().length > 0 &&
    listMobileCommandSessionsAll().length > 0 &&
    listMobileChatSessionsAll().length > 0 &&
    listMobilePreviewSessionsAll().length > 0 &&
    listMobileApprovalSessionsAll().length > 0 &&
    listCrossDeviceSessionsAll().length > 0 &&
    listNotificationsAll().length > 0 &&
    listInboxEntriesAll().length > 0
  ) {
    return;
  }
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processMobileCommandRequest('Show mobile command inventory');
  processMobileChatRequest('Show mobile chat inventory');
  processMobilePreviewRequest('Show mobile preview inventory');
  processMobileApprovalRequest('Show mobile approval inventory');
  processCrossDeviceRequest('Show cross device inventory');
  processFounderNotificationRequest('Show founder notification inventory');
  processFounderInboxRequest('Show founder inbox inventory');
}

function resolveLinksFromInbox(inboxEntryId: string): {
  notificationId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
} | null {
  const inbox = getInboxEntry(inboxEntryId);
  if (!inbox) return null;
  const owner = inbox.inboxOwnership;
  const ctx = inbox.inboxContext;
  return {
    notificationId: inbox.notificationId,
    projectId: owner.projectId,
    runtimeId: owner.runtimeId,
    workspaceId: owner.workspaceId,
    persistentBuildId: owner.persistentBuildId,
    deviceId: owner.deviceId,
    crossDeviceSessionId: owner.crossDeviceSessionId,
    approvalId: ctx.approvalId,
    previewId: ctx.previewId,
    commandSessionId: ctx.commandSessionId,
    chatSessionId: ctx.chatSessionId,
  };
}

function bootstrapDeliveryRecords(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_DELIVERY_RECORDS) {
    const inboxEntryId = findInboxEntryByName(seed.inboxEntryNameMatch);
    if (!inboxEntryId) continue;
    const links = resolveLinksFromInbox(inboxEntryId);
    if (!links) continue;
    registerDeliveryRecord({
      deliveryName: seed.deliveryName,
      notificationId: links.notificationId,
      inboxEntryId,
      deliveryCategory: seed.category,
      projectId: links.projectId || projectId,
      runtimeId: links.runtimeId,
      workspaceId: links.workspaceId,
      persistentBuildId: links.persistentBuildId,
      deviceId: links.deviceId,
      crossDeviceSessionId: links.crossDeviceSessionId,
      approvalId: links.approvalId,
      previewId: links.previewId,
      commandSessionId: links.commandSessionId,
      chatSessionId: links.chatSessionId,
      priority: seed.priority,
      channel: seed.channel,
      deliveryDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerDeliveryRecord(input: RegisterDeliveryRecordInput): RegisterDeliveryRecordResult {
  const category = input.deliveryCategory ?? 'GENERAL_DELIVERY';
  const channel = input.channel ?? resolveDefaultChannelForCategory(category);
  const existing = listStoredDeliveryRecords().find(
    (r) =>
      r.deliveryMetadata.deliveryName === input.deliveryName &&
      r.deliveryOwnership.projectId === input.projectId &&
      r.notificationId === input.notificationId &&
      r.inboxEntryId === input.inboxEntryId &&
      r.deliveryCategory === category,
  );
  if (existing && !input.allowDuplicate) {
    return { record: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateDeliveryRegistration(input);
  if (!validation.valid) {
    return { record: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const deliveryId = nextDeliveryId();

  const ownership = buildDeliveryOwnership({
    deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
  });

  const emptyLink = {
    linkedAt: now,
    linkAuthority: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  const record: NotificationDeliveryRecord = {
    deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    deliveryCategory: category,
    deliveryState: 'CREATED',
    deliveryStatus: 'UNKNOWN',
    deliveryOwnership: ownership,
    deliveryVisibility: input.visibility ?? buildDefaultDeliveryVisibility(category),
    deliveryContext: buildDefaultDeliveryContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      approvalId: input.approvalId,
      previewId: input.previewId,
      commandSessionId: input.commandSessionId,
      chatSessionId: input.chatSessionId,
      crossDeviceSessionId: input.crossDeviceSessionId,
    }),
    deliveryPriority: buildDefaultDeliveryPriority(category, input.priority ?? 'NORMAL'),
    deliveryMetadata: {
      deliveryName: input.deliveryName,
      deliveryDescription: input.deliveryDescription ?? '',
      tags: [category, channel],
      monitorable: true,
    },
    deliveryProvenance: {
      sourceSystem: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
      registeredBy: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    deliveryIntent: null,
    deliveryTarget: null,
    deliveryRoute: null,
    deliveryEligibility: null,
    deliveryPolicy: null,
    deliveryBlocking: null,
    deliveryDeferral: null,
    deliveryNotificationLink: { notificationId: input.notificationId, ...emptyLink },
    deliveryInboxLink: { inboxEntryId: input.inboxEntryId, ...emptyLink },
    deliveryCrossDeviceLink: { crossDeviceSessionId: input.crossDeviceSessionId, ...emptyLink },
    deliveryCloudLink: { runtimeId: input.runtimeId, ...emptyLink },
    deliveryCommandLink: { commandSessionId: input.commandSessionId, ...emptyLink },
    deliveryChatLink: { chatSessionId: input.chatSessionId, ...emptyLink },
    deliveryPreviewLink: { previewId: input.previewId, ...emptyLink },
    deliveryApprovalLink: { approvalId: input.approvalId, ...emptyLink },
    deliveryOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      ...emptyLink,
    },
    deliveryProjectVaultLink: { vaultProjectId: input.projectId, ...emptyLink },
    createdAt: now,
    updatedAt: now,
  };

  createDeliveryRecord(record);
  linkDeliveryToNotification(deliveryId, input.notificationId);
  linkDeliveryToInbox(deliveryId, input.inboxEntryId);
  linkDeliveryToCrossDevice(deliveryId, input.crossDeviceSessionId);
  linkDeliveryToCloud(deliveryId, input.runtimeId);
  linkDeliveryToCommand(deliveryId, input.commandSessionId);
  linkDeliveryToChat(deliveryId, input.chatSessionId);
  linkDeliveryToPreview(deliveryId, input.previewId);
  linkDeliveryToApproval(deliveryId, input.approvalId);
  linkDeliveryToProjectVault(deliveryId, input.projectId);
  linkDeliveryToOperatorFeed(deliveryId);
  recordDeliveryOwnershipHistory(deliveryId, `Delivery ownership assigned to ${ownership.ownerModule}`);
  recordDeliveryHistoryEntry({
    deliveryId,
    category: 'DELIVERY',
    summary: `Delivery record ${deliveryId} registered: ${input.deliveryName} (notification=${input.notificationId}, inbox=${input.inboxEntryId})`,
    scopeUsed: input.projectId,
  });

  return {
    record: getStoredDeliveryRecord(deliveryId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function registerDeliveryOwnershipRecord(
  deliveryId: string,
  ownership: DeliveryOwnership,
): DeliveryOwnership | null {
  const record = getStoredDeliveryRecord(deliveryId);
  if (!record) return null;
  storeDeliveryRecord({ ...record, deliveryOwnership: ownership, updatedAt: Date.now() });
  recordDeliveryOwnershipHistory(deliveryId, `Ownership updated for ${ownership.ownerModule}`);
  return ownership;
}

export { registerDeliveryVisibility } from './notification-delivery-visibility.js';
export { registerDeliveryIntent } from './notification-delivery-intent.js';
export { registerDeliveryRoute } from './notification-delivery-routing.js';
export { registerDeliveryTarget } from './notification-delivery-targeting.js';
export { registerDeliveryEligibility } from './notification-delivery-channel-eligibility.js';
export { registerDeliveryPolicy } from './notification-delivery-policy.js';
export { registerDeliveryBlocking } from './notification-delivery-blocking.js';
export { registerDeliveryDeferral } from './notification-delivery-deferral.js';

export {
  queryDeliveryRecords,
  listDeliveryRecordsAll as listDeliveryRecords,
  listDeliveriesByNotification,
  listDeliveriesByInboxEntry,
  listDeliveriesByProject,
  listDeliveriesByRuntime,
  listDeliveriesByWorkspace,
  listDeliveriesByPersistentBuild,
  listDeliveriesByDevice,
  listDeliveriesByCrossDeviceSession,
  listDeliveriesByState,
} from './notification-delivery-query.js';
export { listDeliveriesByPriority, listDeliveriesByChannel };

export function getDeliveryRecord(deliveryId: string): NotificationDeliveryRecord | null {
  return getStoredDeliveryRecord(deliveryId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareNotificationDeliveryFoundationInput> = {},
): PrepareNotificationDeliveryFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('notification_delivery_foundation');
  const crossDevice = listCrossDeviceSessionsAll()[0];
  const approval = listMobileApprovalSessionsAll()[0];
  const preview = listMobilePreviewSessionsAll()[0];
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];
  const notification = listNotificationsAll()[0];
  const inbox = listInboxEntriesAll()[0];

  return {
    query,
    projectId: project.projectId,
    runtimeId:
      crossDevice?.crossDeviceOwner.runtimeId ??
      approval?.mobileApprovalOwner.runtimeId ??
      listRuntimes()[0]?.runtimeId ??
      'crrt-0001',
    workspaceId:
      crossDevice?.crossDeviceOwner.workspaceId ??
      approval?.mobileApprovalOwner.workspaceId ??
      build?.buildOwner.workspaceId ??
      'hws-0001',
    persistentBuildId:
      crossDevice?.crossDeviceOwner.persistentBuildId ??
      approval?.mobileApprovalOwner.persistentBuildId ??
      build?.buildId ??
      'pbuild-0001',
    deviceId: crossDevice?.crossDeviceOwner.deviceId ?? `dev-${approval?.mobileApprovalId.replace('mappr-', '') ?? '0001'}`,
    crossDeviceSessionId: crossDevice?.crossDeviceId ?? 'mxdev-0001',
    approvalId: crossDevice?.crossDeviceOwner.mobileApprovalSessionId ?? approval?.mobileApprovalId ?? 'mappr-0001',
    previewId: crossDevice?.crossDeviceOwner.mobilePreviewSessionId ?? preview?.mobilePreviewId ?? 'mprev-0001',
    commandSessionId:
      crossDevice?.crossDeviceOwner.mobileCommandSessionId ?? command?.mobileCommandId ?? 'mcmd-0001',
    chatSessionId: crossDevice?.crossDeviceOwner.mobileChatSessionId ?? chat?.mobileChatId ?? 'mchat-0001',
    notificationId: notification?.notificationId ?? 'fnotif-0001',
    inboxEntryId: inbox?.inboxEntryId ?? 'finbox-0001',
    deliveryName: 'DevPulse Notification Delivery Record',
    deliveryCategory: 'GENERAL_DELIVERY',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    chatSessionExists: listMobileChatSessionsAll().length > 0,
    previewSessionExists: listMobilePreviewSessionsAll().length > 0,
    approvalSessionExists: listMobileApprovalSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: listCrossDeviceSessionsAll().length > 0,
    notificationExists: listNotificationsAll().length > 0,
    inboxEntryExists: listInboxEntriesAll().length > 0,
    ownershipValid: owner.ownerModule === NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestrateDeliveryPipeline(deliveryId: string): {
  record: NotificationDeliveryRecord | null;
  rejected: boolean;
} {
  refreshDeliveryContext(deliveryId);

  const before = getStoredDeliveryRecord(deliveryId);
  if (!before) return { record: null, rejected: true };

  const pipelineRecord = runDeliveryPlanningPipeline(deliveryId);

  return {
    record: pipelineRecord,
    rejected: before.deliveryCategory === 'SYSTEM_DELIVERY' && before.deliveryState === 'FAILED',
  };
}

export function prepareNotificationDeliveryFoundation(
  input: PrepareNotificationDeliveryFoundationInput,
): PrepareNotificationDeliveryFoundationResult {
  const query = input.query ?? 'Show notification delivery inventory';

  if (isDuplicateDeliveryExecutorQuestion(query)) {
    publishNotificationDeliveryFeedStages(query, false);
    updateDeliveryDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllDeliveryReports(),
      diagnostics: getDeliveryDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate delivery executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create delivery_executor or parallel delivery authorities.',
      planningOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.commandSessionExists ||
    !input.chatSessionExists ||
    !input.previewSessionExists ||
    !input.approvalSessionExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.crossDeviceSessionExists ||
    !input.notificationExists ||
    !input.inboxEntryExists
  ) {
    publishNotificationDeliveryFeedStages(query, false);
    updateDeliveryDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllDeliveryReports(),
      diagnostics: getDeliveryDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeDeliveryResponse(query, null, buildAllDeliveryReports(), true),
      planningOnly: true,
    };
  }

  bootstrapDeliveryRecords(input.projectId);

  const registration = registerDeliveryRecord({
    deliveryName: input.deliveryName ?? 'DevPulse Notification Delivery Record',
    notificationId: input.notificationId ?? listNotificationsAll()[0]!.notificationId,
    inboxEntryId: input.inboxEntryId ?? listInboxEntriesAll()[0]!.inboxEntryId,
    deliveryCategory: input.deliveryCategory ?? 'GENERAL_DELIVERY',
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    approvalId: input.approvalId,
    previewId: input.previewId,
    commandSessionId: input.commandSessionId,
    chatSessionId: input.chatSessionId,
    deliveryDescription: 'Notification delivery planning session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let record = registration.record;
  let validation: DeliveryValidationResult = {
    valid: !registration.blocked && record !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && record) {
    validation.warnings.push(`Using existing delivery record: ${record.deliveryId}`);
  }

  let rejected = false;

  if (record && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateDeliveryPipeline(record.deliveryId);
    record = pipeline.record;
    rejected = pipeline.rejected;
  }

  if (record && !registration.duplicate) {
    record = getStoredDeliveryRecord(record.deliveryId);
    validation = validateDeliveryRecord(record);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllDeliveryReports();
  const finalState = record?.deliveryState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishNotificationDeliveryFeedStages(query, !blocked, record?.deliveryId, blocked);
  if (record) linkDeliveryToOperatorFeed(record.deliveryId);
  updateDeliveryDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    record,
    reports,
    diagnostics: getDeliveryDiagnostics(),
    validation,
    responseText: composeDeliveryResponse(query, record, reports, blocked),
    planningOnly: true,
  };
}

export function processNotificationDeliveryRequest(
  query: string,
): PrepareNotificationDeliveryFoundationResult {
  return prepareNotificationDeliveryFoundation(resolveInputFromQuery(query));
}

export function getNotificationDeliveryContext(
  query: string,
): PrepareNotificationDeliveryFoundationResult {
  return processNotificationDeliveryRequest(query);
}

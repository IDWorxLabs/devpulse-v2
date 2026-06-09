/**
 * Mobile Push Foundation — registry and orchestrator.
 * Push planning/routing/targeting/eligibility only — no real push.
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
} from '../founder-inbox/index.js';
import {
  processNotificationDeliveryRequest,
  listDeliveryRecordsAll,
  getDeliveryRecord,
} from '../notification-delivery/index.js';
import { publishMobilePushFeedStages } from '../operator-feed/mobile-push-feed-bridge.js';
import {
  nextPushId,
  getStoredPushRecord,
  listStoredPushRecords,
  storePushRecord,
} from './mobile-push-store.js';
import { buildPushOwnership, recordPushOwnershipHistory } from './mobile-push-ownership.js';
import { buildDefaultPushContext, refreshPushContext } from './mobile-push-context.js';
import { buildDefaultPushVisibility, registerPushVisibility } from './mobile-push-visibility.js';
import { linkPushToDelivery, findDeliveryByName } from './mobile-push-delivery-bridge.js';
import { linkPushToNotification } from './mobile-push-notification-bridge.js';
import { linkPushToInbox } from './mobile-push-inbox-bridge.js';
import { linkPushToCrossDevice } from './mobile-push-cross-device-bridge.js';
import { linkPushToCloud } from './mobile-push-cloud-bridge.js';
import { linkPushToCommand } from './mobile-push-command-bridge.js';
import { linkPushToChat } from './mobile-push-chat-bridge.js';
import { linkPushToPreview } from './mobile-push-preview-bridge.js';
import { linkPushToApproval } from './mobile-push-approval-bridge.js';
import { linkPushToOperatorFeed } from './mobile-push-operator-feed-bridge.js';
import { linkPushToProjectVault } from './mobile-push-project-vault-bridge.js';
import {
  createPushRecord,
  runPushPlanningPipeline,
} from './mobile-push-manager.js';
import { registerPushTokenMetadata } from './mobile-push-token.js';
import { recordPushHistoryEntry } from './mobile-push-history.js';
import { validatePushRegistration, validatePushRecord } from './mobile-push-validator.js';
import { updatePushDiagnostics, getPushDiagnostics } from './mobile-push-diagnostics.js';
import { buildAllMobilePushReports, composeMobilePushResponse } from './mobile-push-report-builder.js';
import { queryPushRecords, listPushRecordsAll } from './mobile-push-query.js';
import { listPushesByPlatformRoute } from './mobile-push-routing.js';
import type {
  MobilePushRecord,
  PushCategory,
  PushPlatform,
  PushValidationResult,
  PushOwnership,
  PushVisibility,
  PrepareMobilePushFoundationInput,
  PrepareMobilePushFoundationResult,
  RegisterPushRecordInput,
  RegisterPushRecordResult,
} from './mobile-push-types.js';
import {
  MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
  isDuplicateMobilePushExecutorQuestion,
  resolveDefaultPlatformForCategory,
} from './mobile-push-types.js';

const BOOTSTRAP_PUSH_RECORDS: Array<{
  deliveryNameMatch: string;
  pushName: string;
  category: PushCategory;
  description: string;
  platform: PushPlatform;
}> = [
  { deliveryNameMatch: 'General Delivery Record', pushName: 'General Push Record', category: 'GENERAL_PUSH', description: 'General push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Founder Alert Delivery Record', pushName: 'Founder Alert Push Record', category: 'FOUNDER_ALERT_PUSH', description: 'Founder alert push planning', platform: 'IOS' },
  { deliveryNameMatch: 'Project Delivery Record', pushName: 'Project Push Record', category: 'PROJECT_PUSH', description: 'Project push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Mobile Delivery Record', pushName: 'Mobile Runtime Push Record', category: 'MOBILE_RUNTIME_PUSH', description: 'Mobile runtime push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Inbox Delivery Record', pushName: 'Inbox Push Record', category: 'GENERAL_PUSH', description: 'Inbox-linked push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Cloud Delivery Record', pushName: 'Cloud Push Record', category: 'CLOUD_PUSH', description: 'Cloud push planning record', platform: 'WEB' },
  { deliveryNameMatch: 'World 2 Delivery Record', pushName: 'World 2 Push Record', category: 'WORLD2_PUSH', description: 'World 2 push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Autonomous Builder Delivery Record', pushName: 'Autonomous Builder Push Record', category: 'AUTONOMOUS_BUILDER_PUSH', description: 'Autonomous builder push planning', platform: 'ANDROID' },
  { deliveryNameMatch: 'AiDev Delivery Record', pushName: 'AiDev Push Record', category: 'AIDEV_PUSH', description: 'AiDev push planning record', platform: 'WEB' },
  { deliveryNameMatch: 'Approval Delivery Record', pushName: 'Approval Push Record', category: 'APPROVAL_PUSH', description: 'Approval push planning record', platform: 'IOS' },
  { deliveryNameMatch: 'Preview Delivery Record', pushName: 'Preview Push Record', category: 'PREVIEW_PUSH', description: 'Preview push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Command Delivery Record', pushName: 'Command Push Record', category: 'COMMAND_PUSH', description: 'Command push planning record', platform: 'ANDROID' },
  { deliveryNameMatch: 'Chat Delivery Record', pushName: 'Chat Push Record', category: 'CHAT_PUSH', description: 'Chat push planning record', platform: 'IOS' },
  { deliveryNameMatch: 'System Delivery Record', pushName: 'System Push Record', category: 'SYSTEM_PUSH', description: 'System push planning record', platform: 'UNKNOWN_PLATFORM' },
];

let bootstrapped = false;

export function resetMobilePushBootstrapForTests(): void {
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
    listInboxEntriesAll().length > 0 &&
    listDeliveryRecordsAll().length > 0
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
  processNotificationDeliveryRequest('Show notification delivery inventory');
}

function resolveLinksFromDelivery(deliveryId: string): {
  notificationId: string;
  inboxEntryId: string;
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
  const delivery = getDeliveryRecord(deliveryId);
  if (!delivery) return null;
  const owner = delivery.deliveryOwnership;
  const ctx = delivery.deliveryContext;
  return {
    notificationId: delivery.notificationId,
    inboxEntryId: delivery.inboxEntryId,
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

function bootstrapPushRecords(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_PUSH_RECORDS) {
    const deliveryId = findDeliveryByName(seed.deliveryNameMatch);
    if (!deliveryId) continue;
    const links = resolveLinksFromDelivery(deliveryId);
    if (!links) continue;
    registerPushRecord({
      pushName: seed.pushName,
      deliveryId,
      notificationId: links.notificationId,
      inboxEntryId: links.inboxEntryId,
      pushCategory: seed.category,
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
      platform: seed.platform,
      tokenAlias: `alias-${seed.pushName.replace(/\s+/g, '-').toLowerCase()}`,
      tokenFingerprint: `fingerprint-${seed.pushName.replace(/\s+/g, '-').toLowerCase()}`,
      pushDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerPushRecord(input: RegisterPushRecordInput): RegisterPushRecordResult {
  const category = input.pushCategory ?? 'GENERAL_PUSH';
  const platform = input.platform ?? resolveDefaultPlatformForCategory(category);
  const existing = listStoredPushRecords().find(
    (r) =>
      r.pushMetadata.pushName === input.pushName &&
      r.pushOwnership.projectId === input.projectId &&
      r.deliveryId === input.deliveryId &&
      r.notificationId === input.notificationId &&
      r.pushCategory === category,
  );
  if (existing && !input.allowDuplicate) {
    return { record: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validatePushRegistration(input);
  if (!validation.valid) {
    return { record: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const pushId = nextPushId();

  const ownership = buildPushOwnership({
    pushId,
    deliveryId: input.deliveryId,
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
    linkAuthority: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  const record: MobilePushRecord = {
    pushId,
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    pushCategory: category,
    pushState: 'CREATED',
    pushStatus: 'UNKNOWN',
    pushOwnership: ownership,
    pushVisibility: input.visibility ?? buildDefaultPushVisibility(category),
    pushContext: buildDefaultPushContext({
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
    pushMetadata: {
      pushName: input.pushName,
      pushDescription: input.pushDescription ?? '',
      tags: [category, platform],
      monitorable: true,
    },
    pushProvenance: {
      sourceSystem: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
      registeredBy: MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    pushTokenMetadata: null,
    pushPlatform: null,
    pushPayload: null,
    pushDeviceTarget: null,
    pushRoute: null,
    pushEligibility: null,
    pushPolicy: null,
    pushBlocking: null,
    pushDeferral: null,
    pushDeliveryLink: { deliveryId: input.deliveryId, ...emptyLink },
    pushNotificationLink: { notificationId: input.notificationId, ...emptyLink },
    pushInboxLink: { inboxEntryId: input.inboxEntryId, ...emptyLink },
    pushCrossDeviceLink: { crossDeviceSessionId: input.crossDeviceSessionId, ...emptyLink },
    pushCloudLink: { runtimeId: input.runtimeId, ...emptyLink },
    pushCommandLink: { commandSessionId: input.commandSessionId, ...emptyLink },
    pushChatLink: { chatSessionId: input.chatSessionId, ...emptyLink },
    pushPreviewLink: { previewId: input.previewId, ...emptyLink },
    pushApprovalLink: { approvalId: input.approvalId, ...emptyLink },
    pushOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      ...emptyLink,
    },
    pushProjectVaultLink: { vaultProjectId: input.projectId, ...emptyLink },
    createdAt: now,
    updatedAt: now,
  };

  createPushRecord(record);

  if (input.tokenAlias && input.tokenFingerprint) {
    registerPushTokenMetadata({
      pushId,
      tokenAlias: input.tokenAlias,
      tokenFingerprint: input.tokenFingerprint,
      platform,
    });
  }

  linkPushToDelivery(pushId, input.deliveryId);
  linkPushToNotification(pushId, input.notificationId);
  linkPushToInbox(pushId, input.inboxEntryId);
  linkPushToCrossDevice(pushId, input.crossDeviceSessionId);
  linkPushToCloud(pushId, input.runtimeId);
  linkPushToCommand(pushId, input.commandSessionId);
  linkPushToChat(pushId, input.chatSessionId);
  linkPushToPreview(pushId, input.previewId);
  linkPushToApproval(pushId, input.approvalId);
  linkPushToProjectVault(pushId, input.projectId);
  linkPushToOperatorFeed(pushId);
  recordPushOwnershipHistory(pushId, `Push ownership assigned to ${ownership.ownerModule}`);
  recordPushHistoryEntry({
    pushId,
    category: 'PUSH',
    summary: `Push record ${pushId} registered: ${input.pushName} (delivery=${input.deliveryId}, notification=${input.notificationId})`,
    scopeUsed: input.projectId,
  });

  return {
    record: getStoredPushRecord(pushId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function registerPushOwnershipRecord(
  pushId: string,
  ownership: PushOwnership,
): PushOwnership | null {
  const record = getStoredPushRecord(pushId);
  if (!record) return null;
  storePushRecord({ ...record, pushOwnership: ownership, updatedAt: Date.now() });
  recordPushOwnershipHistory(pushId, `Ownership updated for ${ownership.ownerModule}`);
  return ownership;
}

export { registerPushVisibility } from './mobile-push-visibility.js';

export {
  queryPushRecords,
  listPushRecordsAll as listPushRecords,
  listPushesByDelivery,
  listPushesByNotification,
  listPushesByInboxEntry,
  listPushesByProject,
  listPushesByRuntime,
  listPushesByWorkspace,
  listPushesByPersistentBuild,
  listPushesByDevice,
  listPushesByCrossDeviceSession,
  listPushesByState,
  listPushesByPlatformQuery,
} from './mobile-push-query.js';
export { listPushesByPlatformRoute };

export function getPushRecord(pushId: string): MobilePushRecord | null {
  return getStoredPushRecord(pushId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareMobilePushFoundationInput> = {},
): PrepareMobilePushFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('mobile_push_foundation');
  const crossDevice = listCrossDeviceSessionsAll()[0];
  const approval = listMobileApprovalSessionsAll()[0];
  const preview = listMobilePreviewSessionsAll()[0];
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];
  const notification = listNotificationsAll()[0];
  const inbox = listInboxEntriesAll()[0];
  const delivery = listDeliveryRecordsAll()[0];

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
    deliveryId: delivery?.deliveryId ?? 'ndeliv-0001',
    notificationId: notification?.notificationId ?? 'fnotif-0001',
    inboxEntryId: inbox?.inboxEntryId ?? 'finbox-0001',
    pushName: 'DevPulse Mobile Push Record',
    pushCategory: 'GENERAL_PUSH',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    chatSessionExists: listMobileChatSessionsAll().length > 0,
    previewSessionExists: listMobilePreviewSessionsAll().length > 0,
    approvalSessionExists: listMobileApprovalSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: listCrossDeviceSessionsAll().length > 0,
    deliveryExists: listDeliveryRecordsAll().length > 0,
    notificationExists: listNotificationsAll().length > 0,
    inboxEntryExists: listInboxEntriesAll().length > 0,
    ownershipValid: owner.ownerModule === MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestratePushPipeline(pushId: string): {
  record: MobilePushRecord | null;
  rejected: boolean;
} {
  refreshPushContext(pushId);

  const before = getStoredPushRecord(pushId);
  if (!before) return { record: null, rejected: true };

  const pipelineRecord = runPushPlanningPipeline(pushId);

  return {
    record: pipelineRecord,
    rejected: before.pushCategory === 'SYSTEM_PUSH' && before.pushState === 'FAILED',
  };
}

export function prepareMobilePushFoundation(
  input: PrepareMobilePushFoundationInput,
): PrepareMobilePushFoundationResult {
  const query = input.query ?? 'Show mobile push inventory';

  if (isDuplicateMobilePushExecutorQuestion(query)) {
    publishMobilePushFeedStages(query, false);
    updatePushDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllMobilePushReports(),
      diagnostics: getPushDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate mobile push executor rejected'],
        warnings: [],
        duplicateRisks: [],
        rawTokenRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create mobile_push_executor or parallel mobile push authorities.',
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
    !input.deliveryExists ||
    !input.notificationExists ||
    !input.inboxEntryExists
  ) {
    publishMobilePushFeedStages(query, false);
    updatePushDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllMobilePushReports(),
      diagnostics: getPushDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [], rawTokenRisks: [] },
      responseText: composeMobilePushResponse(query, null, buildAllMobilePushReports(), true),
      planningOnly: true,
    };
  }

  bootstrapPushRecords(input.projectId);

  const registration = registerPushRecord({
    pushName: input.pushName ?? 'DevPulse Mobile Push Record',
    deliveryId: input.deliveryId ?? listDeliveryRecordsAll()[0]!.deliveryId,
    notificationId: input.notificationId ?? listNotificationsAll()[0]!.notificationId,
    inboxEntryId: input.inboxEntryId ?? listInboxEntriesAll()[0]!.inboxEntryId,
    pushCategory: input.pushCategory ?? 'GENERAL_PUSH',
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
    pushDescription: 'Mobile push planning session',
    tokenAlias: `alias-${input.pushName?.replace(/\s+/g, '-').toLowerCase() ?? 'devpulse'}`,
    tokenFingerprint: `fingerprint-${input.pushName?.replace(/\s+/g, '-').toLowerCase() ?? 'devpulse'}`,
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let record = registration.record;
  let validation: PushValidationResult = {
    valid: !registration.blocked && record !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
    rawTokenRisks: [],
  };

  if (registration.duplicate && record) {
    validation.warnings.push(`Using existing push record: ${record.pushId}`);
  }

  let rejected = false;

  if (record && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestratePushPipeline(record.pushId);
    record = pipeline.record;
    rejected = pipeline.rejected;
  }

  if (record && !registration.duplicate) {
    record = getStoredPushRecord(record.pushId);
    validation = validatePushRecord(record);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllMobilePushReports();
  const finalState = record?.pushState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishMobilePushFeedStages(query, !blocked, record?.pushId, blocked);
  if (record) linkPushToOperatorFeed(record.pushId);
  updatePushDiagnostics(query, finalState, registration.duplicateRisks.length, validation.rawTokenRisks.length);

  return {
    record,
    reports,
    diagnostics: getPushDiagnostics(),
    validation,
    responseText: composeMobilePushResponse(query, record, reports, blocked),
    planningOnly: true,
  };
}

export function processMobilePushRequest(
  query: string,
): PrepareMobilePushFoundationResult {
  return prepareMobilePushFoundation(resolveInputFromQuery(query));
}

export function getMobilePushContext(
  query: string,
): PrepareMobilePushFoundationResult {
  return processMobilePushRequest(query);
}

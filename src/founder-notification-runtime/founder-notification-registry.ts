/**
 * Founder Notification Runtime Foundation — registry and orchestrator.
 * Authority only — no real delivery, push, email, or SMS.
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
import {
  processCrossDeviceRequest,
  listCrossDeviceSessionsAll,
  getCrossDeviceSession,
} from '../cross-device-runtime/index.js';
import { publishFounderNotificationFeedStages } from '../operator-feed/founder-notification-feed-bridge.js';
import {
  nextNotificationId,
  storeNotification,
  getStoredNotification,
  listStoredNotifications,
} from './founder-notification-store.js';
import { buildNotificationOwnership, recordNotificationOwnershipHistory } from './founder-notification-ownership.js';
import { buildDefaultNotificationContext, refreshNotificationContext } from './founder-notification-context.js';
import { buildDefaultNotificationVisibility, registerNotificationVisibility } from './founder-notification-visibility.js';
import { buildDefaultNotificationPriority, registerNotificationPriority } from './founder-notification-priority.js';
import { buildDefaultNotificationChannel, registerNotificationChannel } from './founder-notification-channel.js';
import { registerNotificationRouting } from './founder-notification-routing.js';
import { linkNotificationToMobile } from './founder-notification-mobile-bridge.js';
import { linkNotificationToCrossDevice } from './founder-notification-cross-device-bridge.js';
import { linkNotificationToCloud } from './founder-notification-cloud-bridge.js';
import { linkNotificationToCommand } from './founder-notification-command-bridge.js';
import { linkNotificationToChat } from './founder-notification-chat-bridge.js';
import { linkNotificationToPreview } from './founder-notification-preview-bridge.js';
import { linkNotificationToApproval } from './founder-notification-approval-bridge.js';
import { linkNotificationToOperatorFeed } from './founder-notification-operator-feed-bridge.js';
import { linkNotificationToProjectVault } from './founder-notification-project-vault-bridge.js';
import { createNotification } from './founder-notification-manager.js';
import {
  recordNotificationLifecycleEvent,
  initializeNotification,
  routeNotification,
  makeNotificationVisible,
  markNotificationViewed,
  acknowledgeNotification,
} from './founder-notification-lifecycle.js';
import { recordNotificationHistoryEntry } from './founder-notification-history.js';
import { validateNotificationRegistration, validateNotificationRecord } from './founder-notification-validator.js';
import { updateNotificationDiagnostics, getNotificationDiagnostics } from './founder-notification-diagnostics.js';
import { buildAllNotificationReports, composeNotificationResponse } from './founder-notification-report-builder.js';
import { queryNotifications, listNotificationsAll } from './founder-notification-query.js';
import { listNotificationsByPriority } from './founder-notification-priority.js';
import { listNotificationsByChannel } from './founder-notification-channel.js';
import type {
  FounderNotification,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationValidationResult,
  NotificationVisibility,
  NotificationRouting,
  NotificationOwnership,
  PrepareFounderNotificationRuntimeFoundationInput,
  PrepareFounderNotificationRuntimeFoundationResult,
  RegisterNotificationInput,
  RegisterNotificationResult,
} from './founder-notification-types.js';
import {
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicateNotificationExecutorQuestion,
} from './founder-notification-types.js';

const BOOTSTRAP_NOTIFICATIONS: Array<{
  crossDeviceNameMatch: string;
  notificationName: string;
  category: NotificationCategory;
  description: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
}> = [
  {
    crossDeviceNameMatch: 'General Cross Device',
    notificationName: 'General Notification',
    category: 'GENERAL_NOTIFICATION',
    description: 'General founder notification authority',
    priority: 'NORMAL',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'Founder Cross Device',
    notificationName: 'Founder Alert Notification',
    category: 'FOUNDER_ALERT',
    description: 'Founder alert notification authority',
    priority: 'CRITICAL',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'Desktop To Mobile Cross Device',
    notificationName: 'Project Notification',
    category: 'PROJECT_NOTIFICATION',
    description: 'Project notification authority',
    priority: 'HIGH',
    channel: 'OPERATOR_FEED',
  },
  {
    crossDeviceNameMatch: 'Mobile To Desktop Cross Device',
    notificationName: 'Mobile Notification',
    category: 'MOBILE_NOTIFICATION',
    description: 'Mobile notification authority',
    priority: 'HIGH',
    channel: 'MOBILE',
  },
  {
    crossDeviceNameMatch: 'Mobile To Cloud Cross Device',
    notificationName: 'Cloud Notification',
    category: 'CLOUD_NOTIFICATION',
    description: 'Cloud notification authority',
    priority: 'NORMAL',
    channel: 'OPERATOR_FEED',
  },
  {
    crossDeviceNameMatch: 'World 2 Cross Device',
    notificationName: 'World 2 Notification',
    category: 'WORLD2_NOTIFICATION',
    description: 'World 2 notification authority',
    priority: 'HIGH',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'Autonomous Cross Device',
    notificationName: 'Autonomous Builder Notification',
    category: 'AUTONOMOUS_BUILDER_NOTIFICATION',
    description: 'Autonomous builder notification authority',
    priority: 'NORMAL',
    channel: 'OPERATOR_FEED',
  },
  {
    crossDeviceNameMatch: 'AiDev Cross Device',
    notificationName: 'AiDev Notification',
    category: 'AIDEV_NOTIFICATION',
    description: 'AiDev notification authority',
    priority: 'NORMAL',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'General Cross Device',
    notificationName: 'Approval Notification',
    category: 'APPROVAL_NOTIFICATION',
    description: 'Approval notification authority',
    priority: 'HIGH',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'Desktop To Cloud Cross Device',
    notificationName: 'Preview Notification',
    category: 'PREVIEW_NOTIFICATION',
    description: 'Preview notification authority',
    priority: 'NORMAL',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'Mobile To Cloud Cross Device',
    notificationName: 'Command Notification',
    category: 'COMMAND_NOTIFICATION',
    description: 'Command notification authority',
    priority: 'HIGH',
    channel: 'OPERATOR_FEED',
  },
  {
    crossDeviceNameMatch: 'Mobile To Desktop Cross Device',
    notificationName: 'Chat Notification',
    category: 'CHAT_NOTIFICATION',
    description: 'Chat notification authority',
    priority: 'NORMAL',
    channel: 'IN_APP',
  },
  {
    crossDeviceNameMatch: 'Founder Cross Device',
    notificationName: 'System Notification',
    category: 'SYSTEM_NOTIFICATION',
    description: 'System notification authority',
    priority: 'INFORMATIONAL',
    channel: 'UNKNOWN_CHANNEL',
  },
];

let bootstrapped = false;

export function resetFounderNotificationBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  if (
    listRuntimes().length > 0 &&
    listMobileCommandSessionsAll().length > 0 &&
    listMobileChatSessionsAll().length > 0 &&
    listMobilePreviewSessionsAll().length > 0 &&
    listMobileApprovalSessionsAll().length > 0 &&
    listCrossDeviceSessionsAll().length > 0
  ) {
    return;
  }
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processMobileCommandRequest('Show mobile command inventory');
  processMobileChatRequest('Show mobile chat inventory');
  processMobilePreviewRequest('Show mobile preview inventory');
  processMobileApprovalRequest('Show mobile approval inventory');
  processCrossDeviceRequest('Show cross device inventory');
}

function resolveLinksFromCrossDevice(crossDeviceNameMatch: string): {
  crossDeviceSessionId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  projectId: string;
  deviceId: string;
} | null {
  const crossDevice =
    listCrossDeviceSessionsAll().find((d) => d.crossDeviceMetadata.crossDeviceName === crossDeviceNameMatch) ??
    listCrossDeviceSessionsAll().find((d) =>
      d.crossDeviceMetadata.crossDeviceName.includes(crossDeviceNameMatch.replace(' Cross Device', '')),
    );
  if (!crossDevice) return null;
  return {
    crossDeviceSessionId: crossDevice.crossDeviceId,
    approvalId: crossDevice.crossDeviceOwner.mobileApprovalSessionId,
    previewId: crossDevice.crossDeviceOwner.mobilePreviewSessionId,
    commandSessionId: crossDevice.crossDeviceOwner.mobileCommandSessionId,
    chatSessionId: crossDevice.crossDeviceOwner.mobileChatSessionId,
    runtimeId: crossDevice.crossDeviceOwner.runtimeId,
    workspaceId: crossDevice.crossDeviceOwner.workspaceId,
    persistentBuildId: crossDevice.crossDeviceOwner.persistentBuildId,
    projectId: crossDevice.crossDeviceOwner.projectId,
    deviceId: crossDevice.crossDeviceOwner.deviceId,
  };
}

function bootstrapNotifications(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_NOTIFICATIONS) {
    const links = resolveLinksFromCrossDevice(seed.crossDeviceNameMatch);
    if (!links) continue;
    registerNotification({
      notificationName: seed.notificationName,
      notificationCategory: seed.category,
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
      notificationDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerNotification(input: RegisterNotificationInput): RegisterNotificationResult {
  const category = input.notificationCategory ?? 'GENERAL_NOTIFICATION';
  const existing = listStoredNotifications().find(
    (n) =>
      n.notificationMetadata.notificationName === input.notificationName &&
      n.notificationOwnership.projectId === input.projectId &&
      n.notificationOwnership.crossDeviceSessionId === input.crossDeviceSessionId &&
      n.notificationCategory === category,
  );
  if (existing && !input.allowDuplicate) {
    return { notification: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateNotificationRegistration(input);
  if (!validation.valid) {
    return { notification: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const notificationId = nextNotificationId();

  const ownership = buildNotificationOwnership({
    notificationId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    createdBy: input.createdBy,
  });

  const emptyLink = {
    linkedAt: now,
    linkAuthority: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  const notification: FounderNotification = {
    notificationId,
    notificationCategory: category,
    notificationState: 'CREATED',
    notificationStatus: 'UNKNOWN',
    notificationOwnership: ownership,
    notificationVisibility: input.visibility ?? buildDefaultNotificationVisibility(category),
    notificationRoutings: [],
    notificationContext: buildDefaultNotificationContext({
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
    notificationPriority: buildDefaultNotificationPriority(category, input.priority ?? 'NORMAL'),
    notificationChannel: buildDefaultNotificationChannel(input.channel ?? 'IN_APP'),
    notificationMetadata: {
      notificationName: input.notificationName,
      notificationDescription: input.notificationDescription ?? '',
      tags: [category],
      monitorable: true,
    },
    notificationProvenance: {
      sourceSystem: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    notificationMobileLink: {
      crossDeviceSessionId: input.crossDeviceSessionId,
      deviceId: input.deviceId,
      ...emptyLink,
    },
    notificationCrossDeviceLink: {
      crossDeviceSessionId: input.crossDeviceSessionId,
      ...emptyLink,
    },
    notificationCloudLink: { runtimeId: input.runtimeId, ...emptyLink },
    notificationCommandLink: { commandSessionId: input.commandSessionId, ...emptyLink },
    notificationChatLink: { chatSessionId: input.chatSessionId, ...emptyLink },
    notificationPreviewLink: { previewId: input.previewId, ...emptyLink },
    notificationApprovalLink: { approvalId: input.approvalId, ...emptyLink },
    notificationOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      ...emptyLink,
    },
    notificationProjectVaultLink: { vaultProjectId: input.projectId, ...emptyLink },
    createdAt: now,
    updatedAt: now,
  };

  createNotification(notification);
  recordNotificationLifecycleEvent(notificationId, 'NOTIFICATION_CREATED', `Registered ${input.notificationName}`);
  linkNotificationToMobile(notificationId, input.crossDeviceSessionId);
  linkNotificationToCrossDevice(notificationId, input.crossDeviceSessionId);
  linkNotificationToCloud(notificationId, input.runtimeId);
  linkNotificationToCommand(notificationId, input.commandSessionId);
  linkNotificationToChat(notificationId, input.chatSessionId);
  linkNotificationToPreview(notificationId, input.previewId);
  linkNotificationToApproval(notificationId, input.approvalId);
  linkNotificationToProjectVault(notificationId, input.projectId);
  linkNotificationToOperatorFeed(notificationId);
  recordNotificationOwnershipHistory(notificationId, `Ownership assigned to ${ownership.ownerModule}`);
  recordNotificationHistoryEntry({
    notificationId,
    category: 'NOTIFICATION',
    summary: `Notification ${notificationId} registered: ${input.notificationName}`,
    scopeUsed: input.projectId,
  });

  return {
    notification: getStoredNotification(notificationId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function registerNotificationOwnershipRecord(
  notificationId: string,
  ownership: NotificationOwnership,
): NotificationOwnership | null {
  const notification = getStoredNotification(notificationId);
  if (!notification) return null;
  storeNotification({ ...notification, notificationOwnership: ownership, updatedAt: Date.now() });
  recordNotificationOwnershipHistory(notificationId, `Ownership updated for ${ownership.ownerModule}`);
  return ownership;
}

export function getNotification(notificationId: string): FounderNotification | null {
  return getStoredNotification(notificationId);
}

export {
  queryNotifications,
  listNotificationsAll as listNotifications,
  listNotificationsByProject,
  listNotificationsByRuntime,
  listNotificationsByWorkspace,
  listNotificationsByPersistentBuild,
  listNotificationsByDevice,
  listNotificationsByCrossDeviceSession,
  listNotificationsByCategory,
} from './founder-notification-query.js';
export { listNotificationsByPriority } from './founder-notification-priority.js';
export { listNotificationsByChannel } from './founder-notification-channel.js';
export { registerNotificationVisibility } from './founder-notification-visibility.js';
export { registerNotificationRouting } from './founder-notification-routing.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareFounderNotificationRuntimeFoundationInput> = {},
): PrepareFounderNotificationRuntimeFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('founder_notification_runtime_foundation');
  const crossDevice = listCrossDeviceSessionsAll()[0];
  const approval = listMobileApprovalSessionsAll()[0];
  const preview = listMobilePreviewSessionsAll()[0];
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];

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
    notificationName: 'DevPulse Founder Notification',
    notificationCategory: 'GENERAL_NOTIFICATION',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    chatSessionExists: listMobileChatSessionsAll().length > 0,
    previewSessionExists: listMobilePreviewSessionsAll().length > 0,
    approvalSessionExists: listMobileApprovalSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: listCrossDeviceSessionsAll().length > 0,
    ownershipValid: owner.ownerModule === FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestrateNotificationPipeline(notificationId: string): {
  notification: FounderNotification | null;
  rejected: boolean;
} {
  initializeNotification(notificationId);
  refreshNotificationContext(notificationId);

  const before = getStoredNotification(notificationId);
  if (!before) return { notification: null, rejected: true };

  registerNotificationRouting({
    notificationId,
    targetChannel: before.notificationChannel.primaryChannel,
    targetDevice: before.notificationOwnership.deviceId,
  });
  routeNotification(notificationId);
  makeNotificationVisible(notificationId);
  markNotificationViewed(notificationId);
  acknowledgeNotification(notificationId);

  return {
    notification: getStoredNotification(notificationId),
    rejected: before.notificationCategory === 'SYSTEM_NOTIFICATION',
  };
}

export function prepareFounderNotificationRuntimeFoundation(
  input: PrepareFounderNotificationRuntimeFoundationInput,
): PrepareFounderNotificationRuntimeFoundationResult {
  const query = input.query ?? 'Show founder notification inventory';

  if (isDuplicateNotificationExecutorQuestion(query)) {
    publishFounderNotificationFeedStages(query, false);
    updateNotificationDiagnostics(query, 'FAILED');
    return {
      notification: null,
      reports: buildAllNotificationReports(),
      diagnostics: getNotificationDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate notification executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create notification_executor or parallel notification authorities.',
      authorityOnly: true,
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
    !input.crossDeviceSessionExists
  ) {
    publishFounderNotificationFeedStages(query, false);
    updateNotificationDiagnostics(query, 'FAILED');
    return {
      notification: null,
      reports: buildAllNotificationReports(),
      diagnostics: getNotificationDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeNotificationResponse(query, null, buildAllNotificationReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapNotifications(input.projectId);

  const registration = registerNotification({
    notificationName: input.notificationName ?? 'DevPulse Founder Notification',
    notificationCategory: input.notificationCategory ?? 'GENERAL_NOTIFICATION',
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
    notificationDescription: 'Founder notification authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let notification = registration.notification;
  let validation: NotificationValidationResult = {
    valid: !registration.blocked && notification !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && notification) {
    validation.warnings.push(`Using existing notification: ${notification.notificationId}`);
  }

  let rejected = false;

  if (notification && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateNotificationPipeline(notification.notificationId);
    notification = pipeline.notification;
    rejected = pipeline.rejected;
  }

  if (notification && !registration.duplicate) {
    notification = getStoredNotification(notification.notificationId);
    validation = validateNotificationRecord(notification);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllNotificationReports();
  const finalState = notification?.notificationState ?? (blocked ? 'FAILED' : 'ACKNOWLEDGED');

  publishFounderNotificationFeedStages(query, !blocked, notification?.notificationId, blocked);
  if (notification) linkNotificationToOperatorFeed(notification.notificationId);
  updateNotificationDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    notification,
    reports,
    diagnostics: getNotificationDiagnostics(),
    validation,
    responseText: composeNotificationResponse(query, notification, reports, blocked),
    authorityOnly: true,
  };
}

export function processFounderNotificationRequest(
  query: string,
): PrepareFounderNotificationRuntimeFoundationResult {
  return prepareFounderNotificationRuntimeFoundation(resolveInputFromQuery(query));
}

export function getFounderNotificationContext(
  query: string,
): PrepareFounderNotificationRuntimeFoundationResult {
  return processFounderNotificationRequest(query);
}

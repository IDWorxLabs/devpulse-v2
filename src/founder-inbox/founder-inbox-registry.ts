/**
 * Founder Inbox Foundation — registry and orchestrator.
 * Visualization only — references Founder Notification Runtime; no notification authority.
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
} from '../cross-device-runtime/index.js';
import {
  processFounderNotificationRequest,
  listNotificationsAll,
  getNotification,
} from '../founder-notification-runtime/index.js';
import { publishFounderInboxFeedStages } from '../operator-feed/founder-inbox-feed-bridge.js';
import {
  nextInboxEntryId,
  storeInboxEntry,
  getStoredInboxEntry,
  listStoredInboxEntries,
  nextInboxLifecycleEventId,
  storeInboxLifecycleEvent,
} from './founder-inbox-store.js';
import { buildInboxOwnership, recordInboxOwnershipHistory } from './founder-inbox-ownership.js';
import { buildDefaultInboxContext, refreshInboxContext } from './founder-inbox-context.js';
import { buildDefaultInboxVisibility } from './founder-inbox-visibility.js';
import { buildDefaultInboxPriority, registerInboxPriority } from './founder-inbox-priority.js';
import { linkInboxToNotification, findNotificationByName } from './founder-inbox-notification-bridge.js';
import { linkInboxToCrossDevice } from './founder-inbox-cross-device-bridge.js';
import { linkInboxToCloud } from './founder-inbox-cloud-bridge.js';
import { linkInboxToCommand } from './founder-inbox-command-bridge.js';
import { linkInboxToChat } from './founder-inbox-chat-bridge.js';
import { linkInboxToPreview } from './founder-inbox-preview-bridge.js';
import { linkInboxToApproval } from './founder-inbox-approval-bridge.js';
import { linkInboxToOperatorFeed } from './founder-inbox-operator-feed-bridge.js';
import { linkInboxToProjectVault } from './founder-inbox-project-vault-bridge.js';
import { createInboxEntry } from './founder-inbox-manager.js';
import { setInboxState } from './founder-inbox-state-manager.js';
import { acknowledgeInboxEntry } from './founder-inbox-acknowledgement.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import { validateInboxRegistration, validateInboxRecord } from './founder-inbox-validator.js';
import { updateInboxDiagnostics, getInboxDiagnostics } from './founder-inbox-diagnostics.js';
import { buildAllInboxReports, composeInboxResponse } from './founder-inbox-report-builder.js';
import { queryInboxEntries, listInboxEntriesAll } from './founder-inbox-query.js';
import { listInboxEntriesByPriority } from './founder-inbox-priority.js';
import type {
  FounderInboxEntry,
  InboxCategory,
  InboxPriority,
  InboxValidationResult,
  InboxOwnership,
  PrepareFounderInboxFoundationInput,
  PrepareFounderInboxFoundationResult,
  RegisterInboxEntryInput,
  RegisterInboxEntryResult,
  InboxLifecycleEventType,
} from './founder-inbox-types.js';
import {
  FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
  isDuplicateInboxExecutorQuestion,
} from './founder-inbox-types.js';

const BOOTSTRAP_INBOX_ENTRIES: Array<{
  notificationNameMatch: string;
  inboxEntryName: string;
  category: InboxCategory;
  description: string;
  priority: InboxPriority;
}> = [
  {
    notificationNameMatch: 'General Notification',
    inboxEntryName: 'General Inbox Entry',
    category: 'GENERAL_INBOX',
    description: 'General founder inbox visualization entry',
    priority: 'NORMAL',
  },
  {
    notificationNameMatch: 'Project Notification',
    inboxEntryName: 'Project Inbox Entry',
    category: 'PROJECT_INBOX',
    description: 'Project inbox visualization entry',
    priority: 'HIGH',
  },
  {
    notificationNameMatch: 'Mobile Notification',
    inboxEntryName: 'Mobile Inbox Entry',
    category: 'MOBILE_INBOX',
    description: 'Mobile inbox visualization entry',
    priority: 'HIGH',
  },
  {
    notificationNameMatch: 'Cloud Notification',
    inboxEntryName: 'Cloud Inbox Entry',
    category: 'CLOUD_INBOX',
    description: 'Cloud inbox visualization entry',
    priority: 'NORMAL',
  },
  {
    notificationNameMatch: 'World 2 Notification',
    inboxEntryName: 'World 2 Inbox Entry',
    category: 'WORLD2_INBOX',
    description: 'World 2 inbox visualization entry',
    priority: 'HIGH',
  },
  {
    notificationNameMatch: 'Autonomous Builder Notification',
    inboxEntryName: 'Autonomous Builder Inbox Entry',
    category: 'AUTONOMOUS_BUILDER_INBOX',
    description: 'Autonomous builder inbox visualization entry',
    priority: 'NORMAL',
  },
  {
    notificationNameMatch: 'AiDev Notification',
    inboxEntryName: 'AiDev Inbox Entry',
    category: 'AIDEV_INBOX',
    description: 'AiDev inbox visualization entry',
    priority: 'NORMAL',
  },
  {
    notificationNameMatch: 'Approval Notification',
    inboxEntryName: 'Approval Inbox Entry',
    category: 'APPROVAL_INBOX',
    description: 'Approval inbox visualization entry',
    priority: 'HIGH',
  },
  {
    notificationNameMatch: 'Preview Notification',
    inboxEntryName: 'Preview Inbox Entry',
    category: 'PREVIEW_INBOX',
    description: 'Preview inbox visualization entry',
    priority: 'NORMAL',
  },
  {
    notificationNameMatch: 'Command Notification',
    inboxEntryName: 'Command Inbox Entry',
    category: 'COMMAND_INBOX',
    description: 'Command inbox visualization entry',
    priority: 'HIGH',
  },
  {
    notificationNameMatch: 'Chat Notification',
    inboxEntryName: 'Chat Inbox Entry',
    category: 'CHAT_INBOX',
    description: 'Chat inbox visualization entry',
    priority: 'NORMAL',
  },
  {
    notificationNameMatch: 'System Notification',
    inboxEntryName: 'System Inbox Entry',
    category: 'SYSTEM_INBOX',
    description: 'System inbox visualization entry',
    priority: 'INFORMATIONAL',
  },
];

let bootstrapped = false;

export function resetFounderInboxBootstrapForTests(): void {
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
    listNotificationsAll().length > 0
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
}

function resolveLinksFromNotification(notificationId: string): {
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
  const notification = getNotification(notificationId);
  if (!notification) return null;
  const owner = notification.notificationOwnership;
  const ctx = notification.notificationContext;
  return {
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

function bootstrapInboxEntries(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_INBOX_ENTRIES) {
    const notificationId = findNotificationByName(seed.notificationNameMatch);
    if (!notificationId) continue;
    const links = resolveLinksFromNotification(notificationId);
    if (!links) continue;
    registerInboxEntry({
      inboxEntryName: seed.inboxEntryName,
      notificationId,
      inboxCategory: seed.category,
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
      inboxEntryDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

function recordInboxLifecycleEvent(
  inboxEntryId: string,
  eventType: InboxLifecycleEventType,
  notes = '',
): void {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return;

  const stateMap: Record<InboxLifecycleEventType, import('./founder-inbox-types.js').InboxState> = {
    INBOX_ENTRY_CREATED: 'CREATED',
    INBOX_ENTRY_VISIBLE: 'VISIBLE',
    INBOX_ENTRY_READ: 'READ',
    INBOX_ENTRY_ACKNOWLEDGED: 'ACKNOWLEDGED',
    INBOX_ENTRY_ARCHIVED: 'ARCHIVED',
    INBOX_ENTRY_RESTORED: 'VISIBLE',
    INBOX_ENTRY_FAILED: 'FAILED',
  };

  const targetState = stateMap[eventType];
  storeInboxLifecycleEvent({
    eventId: nextInboxLifecycleEventId(),
    inboxEntryId,
    eventType,
    previousState: entry.inboxState,
    newState: targetState,
    timestamp: Date.now(),
    sourceModule: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    notes,
  });

  if (entry.inboxState !== targetState) {
    setInboxState(inboxEntryId, targetState, eventType === 'INBOX_ENTRY_CREATED');
  }
}

export function registerInboxEntry(input: RegisterInboxEntryInput): RegisterInboxEntryResult {
  const category = input.inboxCategory ?? 'GENERAL_INBOX';
  const existing = listStoredInboxEntries().find(
    (e) =>
      e.inboxMetadata.inboxEntryName === input.inboxEntryName &&
      e.inboxOwnership.projectId === input.projectId &&
      e.notificationId === input.notificationId &&
      e.inboxCategory === category,
  );
  if (existing && !input.allowDuplicate) {
    return { entry: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateInboxRegistration(input);
  if (!validation.valid) {
    return { entry: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const inboxEntryId = nextInboxEntryId();

  const ownership = buildInboxOwnership({
    inboxEntryId,
    notificationId: input.notificationId,
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
  });

  const emptyLink = {
    linkedAt: now,
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  const entry: FounderInboxEntry = {
    inboxEntryId,
    notificationId: input.notificationId,
    inboxCategory: category,
    inboxState: 'CREATED',
    inboxStatus: 'UNKNOWN',
    inboxOwnership: ownership,
    inboxVisibility: input.visibility ?? buildDefaultInboxVisibility(category),
    inboxContext: buildDefaultInboxContext({
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
    inboxPriority: buildDefaultInboxPriority(category, input.priority ?? 'NORMAL'),
    inboxMetadata: {
      inboxEntryName: input.inboxEntryName,
      inboxEntryDescription: input.inboxEntryDescription ?? '',
      tags: [category],
      monitorable: true,
    },
    inboxProvenance: {
      sourceSystem: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
      registeredBy: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    inboxArchive: null,
    inboxAcknowledgement: null,
    inboxNotificationLink: { notificationId: input.notificationId, ...emptyLink },
    inboxCrossDeviceLink: { crossDeviceSessionId: input.crossDeviceSessionId, ...emptyLink },
    inboxCloudLink: { runtimeId: input.runtimeId, ...emptyLink },
    inboxCommandLink: { commandSessionId: input.commandSessionId, ...emptyLink },
    inboxChatLink: { chatSessionId: input.chatSessionId, ...emptyLink },
    inboxPreviewLink: { previewId: input.previewId, ...emptyLink },
    inboxApprovalLink: { approvalId: input.approvalId, ...emptyLink },
    inboxOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      ...emptyLink,
    },
    inboxProjectVaultLink: { vaultProjectId: input.projectId, ...emptyLink },
    createdAt: now,
    updatedAt: now,
  };

  createInboxEntry(entry);
  recordInboxLifecycleEvent(inboxEntryId, 'INBOX_ENTRY_CREATED', `Registered ${input.inboxEntryName}`);
  linkInboxToNotification(inboxEntryId, input.notificationId);
  linkInboxToCrossDevice(inboxEntryId, input.crossDeviceSessionId);
  linkInboxToCloud(inboxEntryId, input.runtimeId);
  linkInboxToCommand(inboxEntryId, input.commandSessionId);
  linkInboxToChat(inboxEntryId, input.chatSessionId);
  linkInboxToPreview(inboxEntryId, input.previewId);
  linkInboxToApproval(inboxEntryId, input.approvalId);
  linkInboxToProjectVault(inboxEntryId, input.projectId);
  linkInboxToOperatorFeed(inboxEntryId);
  recordInboxOwnershipHistory(inboxEntryId, `Inbox ownership assigned to ${ownership.ownerModule}`);
  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'INBOX',
    summary: `Inbox entry ${inboxEntryId} registered: ${input.inboxEntryName} (notification=${input.notificationId})`,
    scopeUsed: input.projectId,
  });

  return {
    entry: getStoredInboxEntry(inboxEntryId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function registerInboxOwnershipRecord(
  inboxEntryId: string,
  ownership: InboxOwnership,
): InboxOwnership | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;
  storeInboxEntry({ ...entry, inboxOwnership: ownership, updatedAt: Date.now() });
  recordInboxOwnershipHistory(inboxEntryId, `Ownership updated for ${ownership.ownerModule}`);
  return ownership;
}

export { registerInboxVisibility } from './founder-inbox-visibility.js';

export {
  queryInboxEntries,
  listInboxEntriesAll as listInboxEntries,
  listInboxEntriesByProject,
  listInboxEntriesByRuntime,
  listInboxEntriesByWorkspace,
  listInboxEntriesByPersistentBuild,
  listInboxEntriesByDevice,
  listInboxEntriesByCrossDeviceSession,
  listInboxEntriesByCategory,
} from './founder-inbox-query.js';
export { listInboxEntriesByPriority } from './founder-inbox-priority.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareFounderInboxFoundationInput> = {},
): PrepareFounderInboxFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('founder_inbox_foundation');
  const crossDevice = listCrossDeviceSessionsAll()[0];
  const approval = listMobileApprovalSessionsAll()[0];
  const preview = listMobilePreviewSessionsAll()[0];
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];
  const notification = listNotificationsAll()[0];

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
    inboxEntryName: 'DevPulse Founder Inbox Entry',
    inboxCategory: 'GENERAL_INBOX',
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
    ownershipValid: owner.ownerModule === FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestrateInboxPipeline(inboxEntryId: string): {
  entry: FounderInboxEntry | null;
  rejected: boolean;
} {
  refreshInboxContext(inboxEntryId);

  const before = getStoredInboxEntry(inboxEntryId);
  if (!before) return { entry: null, rejected: true };

  recordInboxLifecycleEvent(inboxEntryId, 'INBOX_ENTRY_VISIBLE', 'Inbox entry visible');
  setInboxState(inboxEntryId, 'UNREAD', true);
  recordInboxLifecycleEvent(inboxEntryId, 'INBOX_ENTRY_READ', 'Inbox entry read');
  acknowledgeInboxEntry(inboxEntryId);

  return {
    entry: getStoredInboxEntry(inboxEntryId),
    rejected: before.inboxCategory === 'SYSTEM_INBOX',
  };
}

export function prepareFounderInboxFoundation(
  input: PrepareFounderInboxFoundationInput,
): PrepareFounderInboxFoundationResult {
  const query = input.query ?? 'Show founder inbox inventory';

  if (isDuplicateInboxExecutorQuestion(query)) {
    publishFounderInboxFeedStages(query, false);
    updateInboxDiagnostics(query, 'FAILED');
    return {
      entry: null,
      reports: buildAllInboxReports(),
      diagnostics: getInboxDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate inbox executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create inbox_executor or parallel inbox authorities.',
      visualizationOnly: true,
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
    !input.notificationExists
  ) {
    publishFounderInboxFeedStages(query, false);
    updateInboxDiagnostics(query, 'FAILED');
    return {
      entry: null,
      reports: buildAllInboxReports(),
      diagnostics: getInboxDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeInboxResponse(query, null, buildAllInboxReports(), true),
      visualizationOnly: true,
    };
  }

  bootstrapInboxEntries(input.projectId);

  const registration = registerInboxEntry({
    inboxEntryName: input.inboxEntryName ?? 'DevPulse Founder Inbox Entry',
    notificationId: input.notificationId ?? listNotificationsAll()[0]!.notificationId,
    inboxCategory: input.inboxCategory ?? 'GENERAL_INBOX',
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
    inboxEntryDescription: 'Founder inbox visualization session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let entry = registration.entry;
  let validation: InboxValidationResult = {
    valid: !registration.blocked && entry !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && entry) {
    validation.warnings.push(`Using existing inbox entry: ${entry.inboxEntryId}`);
  }

  let rejected = false;

  if (entry && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateInboxPipeline(entry.inboxEntryId);
    entry = pipeline.entry;
    rejected = pipeline.rejected;
  }

  if (entry && !registration.duplicate) {
    entry = getStoredInboxEntry(entry.inboxEntryId);
    validation = validateInboxRecord(entry);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllInboxReports();
  const finalState = entry?.inboxState ?? (blocked ? 'FAILED' : 'ACKNOWLEDGED');

  publishFounderInboxFeedStages(query, !blocked, entry?.inboxEntryId, blocked);
  if (entry) linkInboxToOperatorFeed(entry.inboxEntryId);
  updateInboxDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    entry,
    reports,
    diagnostics: getInboxDiagnostics(),
    validation,
    responseText: composeInboxResponse(query, entry, reports, blocked),
    visualizationOnly: true,
  };
}

export function processFounderInboxRequest(query: string): PrepareFounderInboxFoundationResult {
  return prepareFounderInboxFoundation(resolveInputFromQuery(query));
}

export function getFounderInboxContext(query: string): PrepareFounderInboxFoundationResult {
  return processFounderInboxRequest(query);
}

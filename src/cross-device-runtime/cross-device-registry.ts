/**
 * Cross Device Runtime Foundation — registry and orchestrator.
 * Authority only — no real sync, connections, or device pairing.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processMobileCommandRequest, listMobileCommandSessionsAll } from '../mobile-command-runtime/index.js';
import { processMobileChatRequest, listMobileChatSessionsAll } from '../mobile-chat-runtime/index.js';
import { processMobilePreviewRequest, listMobilePreviewSessionsAll } from '../mobile-preview-runtime/index.js';
import {
  processMobileApprovalRequest,
  listMobileApprovalSessionsAll,
} from '../mobile-approval-runtime/index.js';
import { publishCrossDeviceFeedStages } from '../operator-feed/cross-device-feed-bridge.js';
import {
  nextCrossDeviceId,
  nextDeviceRecordId,
  storeCrossDeviceSession,
  getStoredCrossDeviceSession,
  listStoredCrossDeviceSessions,
  storeDeviceRecord,
} from './cross-device-store.js';
import { buildCrossDeviceOwnership, recordCrossDeviceOwnershipHistory } from './cross-device-ownership.js';
import { buildDefaultCrossDeviceContext, refreshCrossDeviceContext } from './cross-device-context.js';
import { buildDefaultDeviceVisibility } from './cross-device-visibility.js';
import { linkCrossDeviceToCommandSession } from './cross-device-command-bridge.js';
import { linkCrossDeviceToChatSession } from './cross-device-chat-bridge.js';
import { linkCrossDeviceToPreviewSession } from './cross-device-preview-bridge.js';
import { linkCrossDeviceToApprovalSession } from './cross-device-approval-bridge.js';
import { linkCrossDeviceToCloud } from './cross-device-cloud-bridge.js';
import { linkCrossDeviceToWorkspace } from './cross-device-workspace-bridge.js';
import { linkCrossDeviceToBuild } from './cross-device-build-bridge.js';
import { linkCrossDeviceToProjectVault } from './cross-device-project-vault-bridge.js';
import { linkCrossDeviceToOperatorFeed } from './cross-device-operator-feed-bridge.js';
import { registerDeviceLink } from './cross-device-device-link.js';
import { registerDeviceHandoff } from './cross-device-handoff.js';
import { createCrossDeviceSession as createTrackedCrossDeviceSession } from './cross-device-session-manager.js';
import {
  recordCrossDeviceLifecycleEvent,
  initializeCrossDevice,
  markCrossDeviceReady,
  registerDeviceLifecycle,
  linkDeviceLifecycle,
  markHandoffAvailable,
  requestHandoffLifecycle,
  markHandoffReady,
  completeHandoffLifecycle,
  updateVisibilityLifecycle,
  completeCrossDevice,
} from './cross-device-lifecycle.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import { validateCrossDeviceRegistration, validateCrossDeviceRecord } from './cross-device-validator.js';
import { updateCrossDeviceDiagnostics, getCrossDeviceDiagnostics } from './cross-device-diagnostics.js';
import { buildAllCrossDeviceReports, composeCrossDeviceResponse } from './cross-device-report-builder.js';
import type {
  CrossDeviceSession,
  CrossDeviceCategory,
  CrossDeviceType,
  CrossDeviceValidationResult,
  DeviceRecord,
  DeviceLink,
  DeviceHandoff,
  PrepareCrossDeviceRuntimeFoundationInput,
  PrepareCrossDeviceRuntimeFoundationResult,
  RegisterCrossDeviceInput,
  RegisterCrossDeviceResult,
} from './cross-device-types.js';
import {
  CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicateCrossDeviceExecutorQuestion,
} from './cross-device-types.js';

const BOOTSTRAP_CROSS_DEVICES: Array<{
  approvalNameMatch: string;
  crossDeviceName: string;
  type: CrossDeviceCategory;
  description: string;
}> = [
  {
    approvalNameMatch: 'General Mobile Approval',
    crossDeviceName: 'General Cross Device',
    type: 'GENERAL_CROSS_DEVICE',
    description: 'General cross device authority',
  },
  {
    approvalNameMatch: 'Project Mobile Approval',
    crossDeviceName: 'Mobile To Desktop Cross Device',
    type: 'MOBILE_TO_DESKTOP',
    description: 'Mobile to desktop cross device authority',
  },
  {
    approvalNameMatch: 'World 2 Mobile Approval',
    crossDeviceName: 'Desktop To Mobile Cross Device',
    type: 'DESKTOP_TO_MOBILE',
    description: 'Desktop to mobile cross device authority',
  },
  {
    approvalNameMatch: 'AiDev Mobile Approval',
    crossDeviceName: 'Mobile To Cloud Cross Device',
    type: 'MOBILE_TO_CLOUD',
    description: 'Mobile to cloud cross device authority',
  },
  {
    approvalNameMatch: 'Autonomous Mobile Approval',
    crossDeviceName: 'Desktop To Cloud Cross Device',
    type: 'DESKTOP_TO_CLOUD',
    description: 'Desktop to cloud cross device authority',
  },
  {
    approvalNameMatch: 'Founder Mobile Approval',
    crossDeviceName: 'World 2 Cross Device',
    type: 'WORLD2_CROSS_DEVICE',
    description: 'World 2 cross device authority',
  },
  {
    approvalNameMatch: 'Cloud Mobile Approval',
    crossDeviceName: 'AiDev Cross Device',
    type: 'AIDEV_CROSS_DEVICE',
    description: 'AiDev cross device authority',
  },
  {
    approvalNameMatch: 'Build Mobile Approval',
    crossDeviceName: 'Autonomous Cross Device',
    type: 'AUTONOMOUS_CROSS_DEVICE',
    description: 'Autonomous cross device authority',
  },
  {
    approvalNameMatch: 'Self Evolution Mobile Approval',
    crossDeviceName: 'Founder Cross Device',
    type: 'FOUNDER_CROSS_DEVICE',
    description: 'Founder cross device authority',
  },
];

let bootstrapped = false;

export function resetCrossDeviceBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  if (
    listRuntimes().length > 0 &&
    listMobileCommandSessionsAll().length > 0 &&
    listMobileChatSessionsAll().length > 0 &&
    listMobilePreviewSessionsAll().length > 0 &&
    listMobileApprovalSessionsAll().length > 0
  ) {
    return;
  }
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processMobileCommandRequest('Show mobile command inventory');
  processMobileChatRequest('Show mobile chat inventory');
  processMobilePreviewRequest('Show mobile preview inventory');
  processMobileApprovalRequest('Show mobile approval inventory');
}

function resolveDeviceTypes(category: CrossDeviceCategory): { source: CrossDeviceType; target: CrossDeviceType } {
  switch (category) {
    case 'MOBILE_TO_DESKTOP':
      return { source: 'MOBILE', target: 'DESKTOP' };
    case 'DESKTOP_TO_MOBILE':
      return { source: 'DESKTOP', target: 'MOBILE' };
    case 'MOBILE_TO_CLOUD':
      return { source: 'MOBILE', target: 'CLOUD_RUNTIME' };
    case 'DESKTOP_TO_CLOUD':
      return { source: 'DESKTOP', target: 'CLOUD_RUNTIME' };
    default:
      return { source: 'MOBILE', target: 'DESKTOP' };
  }
}

function resolveLinksFromApproval(approvalNameMatch: string): {
  mobileApprovalSessionId: string;
  mobilePreviewSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  projectId: string;
  deviceId: string;
} | null {
  const approval =
    listMobileApprovalSessionsAll().find((a) => a.mobileApprovalMetadata.approvalName === approvalNameMatch) ??
    listMobileApprovalSessionsAll().find((a) =>
      a.mobileApprovalMetadata.approvalName.includes(approvalNameMatch.replace(' Mobile Approval', '')),
    );
  if (!approval) return null;
  return {
    mobileApprovalSessionId: approval.mobileApprovalId,
    mobilePreviewSessionId: approval.mobileApprovalOwner.mobilePreviewSessionId,
    mobileCommandSessionId: approval.mobileApprovalOwner.mobileCommandSessionId,
    mobileChatSessionId: approval.mobileApprovalOwner.mobileChatSessionId,
    runtimeId: approval.mobileApprovalOwner.runtimeId,
    workspaceId: approval.mobileApprovalOwner.workspaceId,
    persistentBuildId: approval.mobileApprovalOwner.persistentBuildId,
    projectId: approval.mobileApprovalOwner.projectId,
    deviceId: `dev-${approval.mobileApprovalId.replace('mappr-', '')}`,
  };
}

function bootstrapCrossDevices(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_CROSS_DEVICES) {
    const links = resolveLinksFromApproval(seed.approvalNameMatch);
    if (!links) continue;
    registerCrossDeviceSession({
      crossDeviceName: seed.crossDeviceName,
      crossDeviceType: seed.type,
      projectId: links.projectId || projectId,
      deviceId: links.deviceId,
      deviceSessionId: `dsess-${links.deviceId}`,
      mobileCommandSessionId: links.mobileCommandSessionId,
      mobileChatSessionId: links.mobileChatSessionId,
      mobilePreviewSessionId: links.mobilePreviewSessionId,
      mobileApprovalSessionId: links.mobileApprovalSessionId,
      runtimeId: links.runtimeId,
      workspaceId: links.workspaceId,
      persistentBuildId: links.persistentBuildId,
      crossDeviceDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerDeviceRecord(input: {
  crossDeviceId: string;
  deviceId: string;
  deviceType: CrossDeviceType;
  deviceSessionId: string;
  projectId: string;
  registeredBy?: string;
}): DeviceRecord | null {
  const session = getStoredCrossDeviceSession(input.crossDeviceId);
  if (!session) return null;

  const record: DeviceRecord = {
    deviceRecordId: nextDeviceRecordId(),
    crossDeviceId: input.crossDeviceId,
    deviceId: input.deviceId,
    deviceType: input.deviceType,
    deviceSessionId: input.deviceSessionId,
    projectId: input.projectId,
    registeredAt: Date.now(),
    registeredBy: input.registeredBy ?? CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    metadataOnly: true,
  };

  storeDeviceRecord(record);
  storeCrossDeviceSession({
    ...session,
    deviceRecords: [...session.deviceRecords, record],
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId: input.crossDeviceId,
    category: 'DEVICE',
    summary: `Device record ${record.deviceRecordId} registered: ${input.deviceId}`,
    scopeUsed: record.deviceRecordId,
  });

  return record;
}

export function getDeviceRecord(deviceRecordId: string): DeviceRecord | null {
  const session = listStoredCrossDeviceSessions().find((s) =>
    s.deviceRecords.some((r) => r.deviceRecordId === deviceRecordId),
  );
  return session?.deviceRecords.find((r) => r.deviceRecordId === deviceRecordId) ?? null;
}

export function registerCrossDeviceSession(input: RegisterCrossDeviceInput): RegisterCrossDeviceResult {
  const crossDeviceType = input.crossDeviceType ?? 'GENERAL_CROSS_DEVICE';
  const existing = listStoredCrossDeviceSessions().find(
    (s) =>
      s.crossDeviceMetadata.crossDeviceName === input.crossDeviceName &&
      s.crossDeviceOwner.projectId === input.projectId &&
      s.crossDeviceOwner.mobileApprovalSessionId === input.mobileApprovalSessionId &&
      s.crossDeviceType === crossDeviceType,
  );
  if (existing && !input.allowDuplicate) {
    return { session: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateCrossDeviceRegistration(input);
  if (!validation.valid) {
    return { session: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const crossDeviceId = nextCrossDeviceId();

  const ownership = buildCrossDeviceOwnership({
    projectId: input.projectId,
    deviceId: input.deviceId,
    deviceSessionId: input.deviceSessionId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    mobileApprovalSessionId: input.mobileApprovalSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    createdBy: input.createdBy,
  });

  const session: CrossDeviceSession = {
    crossDeviceId,
    crossDeviceType,
    crossDeviceOwner: ownership,
    crossDeviceState: 'CREATED',
    crossDeviceStatus: 'UNKNOWN',
    crossDeviceMetadata: {
      crossDeviceName: input.crossDeviceName,
      crossDeviceDescription: input.crossDeviceDescription ?? '',
      tags: [crossDeviceType],
      monitorable: true,
    },
    crossDeviceVisibility: input.visibility ?? buildDefaultDeviceVisibility(crossDeviceType),
    crossDeviceProvenance: {
      sourceSystem: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    crossDeviceContext: buildDefaultCrossDeviceContext({
      projectId: input.projectId,
      deviceId: input.deviceId,
      mobileCommandSessionId: input.mobileCommandSessionId,
      mobileChatSessionId: input.mobileChatSessionId,
      mobilePreviewSessionId: input.mobilePreviewSessionId,
      mobileApprovalSessionId: input.mobileApprovalSessionId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      crossDeviceType,
    }),
    deviceRecords: [],
    deviceLinks: [],
    deviceHandoffs: [],
    crossDeviceCommandLink: {
      mobileCommandId: input.mobileCommandSessionId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceChatLink: {
      mobileChatId: input.mobileChatSessionId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDevicePreviewLink: {
      mobilePreviewId: input.mobilePreviewSessionId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceApprovalLink: {
      mobileApprovalId: input.mobileApprovalSessionId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceCloudLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    crossDeviceProjectVaultLink: {
      vaultProjectId: input.projectId,
      linkedAt: now,
      linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  storeCrossDeviceSession(session);
  recordCrossDeviceLifecycleEvent(crossDeviceId, 'CROSS_DEVICE_CREATED', `Registered ${input.crossDeviceName}`);
  linkCrossDeviceToCommandSession(crossDeviceId, input.mobileCommandSessionId);
  linkCrossDeviceToChatSession(crossDeviceId, input.mobileChatSessionId);
  linkCrossDeviceToPreviewSession(crossDeviceId, input.mobilePreviewSessionId);
  linkCrossDeviceToApprovalSession(crossDeviceId, input.mobileApprovalSessionId);
  linkCrossDeviceToCloud(crossDeviceId, input.runtimeId);
  linkCrossDeviceToWorkspace(crossDeviceId, input.workspaceId);
  linkCrossDeviceToBuild(crossDeviceId, input.persistentBuildId);
  linkCrossDeviceToProjectVault(crossDeviceId, input.projectId);
  linkCrossDeviceToOperatorFeed(crossDeviceId);
  recordCrossDeviceOwnershipHistory(crossDeviceId, `Ownership assigned to ${ownership.ownerModule}`);
  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'CROSS_DEVICE',
    summary: `Cross device ${crossDeviceId} registered: ${input.crossDeviceName}`,
    scopeUsed: input.projectId,
  });

  return {
    session: getStoredCrossDeviceSession(crossDeviceId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getCrossDeviceSession(crossDeviceId: string): CrossDeviceSession | null {
  return getStoredCrossDeviceSession(crossDeviceId);
}

export { registerDeviceLink, getDeviceLink, listDeviceLinks } from './cross-device-device-link.js';
export { registerDeviceHandoff, getDeviceHandoff, listDeviceHandoffs } from './cross-device-handoff.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareCrossDeviceRuntimeFoundationInput> = {},
): PrepareCrossDeviceRuntimeFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('cross_device_runtime_foundation');
  const approval = listMobileApprovalSessionsAll()[0];
  const preview = listMobilePreviewSessionsAll()[0];
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];

  return {
    query,
    projectId: project.projectId,
    deviceId: approval ? `dev-${approval.mobileApprovalId.replace('mappr-', '')}` : 'dev-0001',
    deviceSessionId: approval ? `dsess-${approval.mobileApprovalId}` : 'dsess-0001',
    mobileCommandSessionId:
      approval?.mobileApprovalOwner.mobileCommandSessionId ??
      preview?.mobilePreviewOwner.mobileCommandSessionId ??
      command?.mobileCommandId ??
      'mcmd-0001',
    mobileChatSessionId:
      approval?.mobileApprovalOwner.mobileChatSessionId ??
      preview?.mobilePreviewOwner.mobileChatSessionId ??
      chat?.mobileChatId ??
      'mchat-0001',
    mobilePreviewSessionId:
      approval?.mobileApprovalOwner.mobilePreviewSessionId ?? preview?.mobilePreviewId ?? 'mprev-0001',
    mobileApprovalSessionId: approval?.mobileApprovalId ?? 'mappr-0001',
    runtimeId:
      approval?.mobileApprovalOwner.runtimeId ??
      preview?.mobilePreviewOwner.runtimeId ??
      listRuntimes()[0]?.runtimeId ??
      'crrt-0001',
    workspaceId:
      approval?.mobileApprovalOwner.workspaceId ??
      preview?.mobilePreviewOwner.workspaceId ??
      build?.buildOwner.workspaceId ??
      'hws-0001',
    persistentBuildId:
      approval?.mobileApprovalOwner.persistentBuildId ??
      preview?.mobilePreviewOwner.persistentBuildId ??
      build?.buildId ??
      'pbuild-0001',
    crossDeviceName: 'DevPulse Cross Device',
    crossDeviceType: 'GENERAL_CROSS_DEVICE',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    chatSessionExists: listMobileChatSessionsAll().length > 0,
    previewSessionExists: listMobilePreviewSessionsAll().length > 0,
    approvalSessionExists: listMobileApprovalSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: listPersistentBuilds().length > 0,
    ownershipValid: owner.ownerModule === CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestrateCrossDevicePipeline(crossDeviceId: string): {
  session: CrossDeviceSession | null;
  rejected: boolean;
} {
  initializeCrossDevice(crossDeviceId);
  markCrossDeviceReady(crossDeviceId);
  refreshCrossDeviceContext(crossDeviceId);

  const sessionBefore = getStoredCrossDeviceSession(crossDeviceId);
  if (!sessionBefore) return { session: null, rejected: true };

  const types = resolveDeviceTypes(sessionBefore.crossDeviceType);
  registerDeviceRecord({
    crossDeviceId,
    deviceId: sessionBefore.crossDeviceOwner.deviceId,
    deviceType: types.source,
    deviceSessionId: sessionBefore.crossDeviceOwner.deviceSessionId,
    projectId: sessionBefore.crossDeviceOwner.projectId,
  });
  registerDeviceLifecycle(crossDeviceId);

  const tracked = createTrackedCrossDeviceSession({
    crossDeviceId,
    projectId: sessionBefore.crossDeviceOwner.projectId,
    deviceId: sessionBefore.crossDeviceOwner.deviceId,
    deviceSessionId: sessionBefore.crossDeviceOwner.deviceSessionId,
    mobileCommandSessionId: sessionBefore.crossDeviceOwner.mobileCommandSessionId,
    mobileChatSessionId: sessionBefore.crossDeviceOwner.mobileChatSessionId,
    mobilePreviewSessionId: sessionBefore.crossDeviceOwner.mobilePreviewSessionId,
    mobileApprovalSessionId: sessionBefore.crossDeviceOwner.mobileApprovalSessionId,
    runtimeId: sessionBefore.crossDeviceOwner.runtimeId,
    workspaceId: sessionBefore.crossDeviceOwner.workspaceId,
    persistentBuildId: sessionBefore.crossDeviceOwner.persistentBuildId,
  });

  registerDeviceLink({
    crossDeviceId,
    sourceDeviceId: sessionBefore.crossDeviceOwner.deviceId,
    targetDeviceId: `${sessionBefore.crossDeviceOwner.deviceId}-target`,
    sourceDeviceType: types.source,
    targetDeviceType: types.target,
    projectId: sessionBefore.crossDeviceOwner.projectId,
    sessionId: tracked?.sessionId ?? sessionBefore.crossDeviceOwner.deviceSessionId,
  });
  linkDeviceLifecycle(crossDeviceId);

  registerDeviceHandoff({
    crossDeviceId,
    handoffType: sessionBefore.crossDeviceType,
    sourceDeviceId: sessionBefore.crossDeviceOwner.deviceId,
    targetDeviceId: `${sessionBefore.crossDeviceOwner.deviceId}-target`,
    projectId: sessionBefore.crossDeviceOwner.projectId,
  });
  markHandoffAvailable(crossDeviceId);
  requestHandoffLifecycle(crossDeviceId);
  markHandoffReady(crossDeviceId);
  completeHandoffLifecycle(crossDeviceId);
  updateVisibilityLifecycle(crossDeviceId);
  completeCrossDevice(crossDeviceId);

  return {
    session: getStoredCrossDeviceSession(crossDeviceId),
    rejected: sessionBefore.crossDeviceType === 'FOUNDER_CROSS_DEVICE',
  };
}

export function prepareCrossDeviceRuntimeFoundation(
  input: PrepareCrossDeviceRuntimeFoundationInput,
): PrepareCrossDeviceRuntimeFoundationResult {
  const query = input.query ?? 'Show cross device inventory';

  if (isDuplicateCrossDeviceExecutorQuestion(query)) {
    publishCrossDeviceFeedStages(query, false);
    updateCrossDeviceDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllCrossDeviceReports(),
      diagnostics: getCrossDeviceDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate cross device executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create cross_device_executor or parallel cross device authorities.',
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
    !input.persistentBuildExists
  ) {
    publishCrossDeviceFeedStages(query, false);
    updateCrossDeviceDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllCrossDeviceReports(),
      diagnostics: getCrossDeviceDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeCrossDeviceResponse(query, null, null, buildAllCrossDeviceReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapCrossDevices(input.projectId);

  const registration = registerCrossDeviceSession({
    crossDeviceName: input.crossDeviceName ?? 'DevPulse Cross Device',
    crossDeviceType: input.crossDeviceType ?? 'GENERAL_CROSS_DEVICE',
    projectId: input.projectId,
    deviceId: input.deviceId,
    deviceSessionId: input.deviceSessionId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    mobileApprovalSessionId: input.mobileApprovalSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    crossDeviceDescription: 'Cross device authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let session = registration.session;
  let validation: CrossDeviceValidationResult = {
    valid: !registration.blocked && session !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && session) {
    validation.warnings.push(`Using existing cross device session: ${session.crossDeviceId}`);
  }

  let rejected = false;

  if (session && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateCrossDevicePipeline(session.crossDeviceId);
    session = pipeline.session;
    rejected = pipeline.rejected;
  }

  const trackedSession = session
    ? createTrackedCrossDeviceSession({
        crossDeviceId: session.crossDeviceId,
        projectId: input.projectId,
        deviceId: input.deviceId,
        deviceSessionId: input.deviceSessionId,
        mobileCommandSessionId: input.mobileCommandSessionId,
        mobileChatSessionId: input.mobileChatSessionId,
        mobilePreviewSessionId: input.mobilePreviewSessionId,
        mobileApprovalSessionId: input.mobileApprovalSessionId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
      })
    : null;

  if (session && trackedSession && !registration.duplicate) {
    session = getStoredCrossDeviceSession(session.crossDeviceId);
    validation = validateCrossDeviceRecord(session);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllCrossDeviceReports();
  const finalState = session?.crossDeviceState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishCrossDeviceFeedStages(query, !blocked, session?.crossDeviceId, blocked);
  if (session) linkCrossDeviceToOperatorFeed(session.crossDeviceId);
  updateCrossDeviceDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    session,
    trackedSession,
    reports,
    diagnostics: getCrossDeviceDiagnostics(),
    validation,
    responseText: composeCrossDeviceResponse(query, session, trackedSession, reports, blocked),
    authorityOnly: true,
  };
}

export function processCrossDeviceRequest(query: string): PrepareCrossDeviceRuntimeFoundationResult {
  return prepareCrossDeviceRuntimeFoundation(resolveInputFromQuery(query));
}

export function getCrossDeviceContext(query: string): PrepareCrossDeviceRuntimeFoundationResult {
  return processCrossDeviceRequest(query);
}

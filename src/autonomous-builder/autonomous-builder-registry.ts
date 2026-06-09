/**
 * Autonomous Builder Foundation — registry and orchestrator.
 * Build planning/goal/plan/stage/readiness only — no code execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCrossDeviceRequest, listCrossDeviceSessionsAll } from '../cross-device-runtime/index.js';
import { processFounderNotificationRequest, listNotificationsAll } from '../founder-notification-runtime/index.js';
import { processFounderInboxRequest, listInboxEntriesAll } from '../founder-inbox/index.js';
import {
  processNotificationDeliveryRequest,
  listDeliveryRecordsAll,
} from '../notification-delivery/index.js';
import {
  processMobilePushRequest,
  listPushRecordsAll,
  getPushRecord,
} from '../mobile-push/index.js';
import { publishAutonomousBuilderFeedStages } from '../operator-feed/autonomous-builder-feed-bridge.js';
import {
  nextAutonomousBuildId,
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { buildAutonomousBuildOwnership, recordAutonomousBuildOwnershipHistory } from './autonomous-builder-ownership.js';
import { buildDefaultAutonomousBuildContext, refreshAutonomousBuildContext } from './autonomous-builder-context.js';
import { linkAutonomousBuildToPush, findPushByName } from './autonomous-builder-push-bridge.js';
import { linkAutonomousBuildToDelivery } from './autonomous-builder-delivery-bridge.js';
import { linkAutonomousBuildToNotification } from './autonomous-builder-notification-bridge.js';
import { linkAutonomousBuildToInbox } from './autonomous-builder-inbox-bridge.js';
import { linkAutonomousBuildToCloud } from './autonomous-builder-cloud-bridge.js';
import { linkAutonomousBuildToWorld2 } from './autonomous-builder-world2-bridge.js';
import { linkAutonomousBuildToAiDev } from './autonomous-builder-aidev-bridge.js';
import { linkAutonomousBuildToOperatorFeed } from './autonomous-builder-operator-feed-bridge.js';
import { linkAutonomousBuildToProjectVault } from './autonomous-builder-project-vault-bridge.js';
import {
  createAutonomousBuild,
  runAutonomousBuildPlanningPipeline,
} from './autonomous-builder-manager.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import { validateAutonomousBuildRegistration, validateAutonomousBuildRecord } from './autonomous-builder-validator.js';
import { updateAutonomousBuildDiagnostics, getAutonomousBuildDiagnostics } from './autonomous-builder-diagnostics.js';
import { buildAllAutonomousBuilderReports, composeAutonomousBuilderResponse } from './autonomous-builder-report-builder.js';
import { queryAutonomousBuildRecords, listAutonomousBuildRecordsAll } from './autonomous-builder-query.js';
import type {
  AutonomousBuildSession,
  AutonomousBuildCategory,
  AutonomousBuildValidationResult,
  AutonomousBuildOwnership,
  PrepareAutonomousBuilderFoundationInput,
  PrepareAutonomousBuilderFoundationResult,
  RegisterAutonomousBuildInput,
  RegisterAutonomousBuildResult,
} from './autonomous-builder-types.js';
import {
  AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
  isDuplicateAutonomousBuilderExecutorQuestion,
} from './autonomous-builder-types.js';

const BOOTSTRAP_AUTONOMOUS_BUILDS: Array<{
  pushNameMatch: string;
  buildName: string;
  category: AutonomousBuildCategory;
  description: string;
}> = [
  { pushNameMatch: 'General Push Record', buildName: 'General Autonomous Build', category: 'GENERAL_AUTONOMOUS_BUILD', description: 'General autonomous build planning record' },
  { pushNameMatch: 'Project Push Record', buildName: 'Project Autonomous Build', category: 'PROJECT_AUTONOMOUS_BUILD', description: 'Project autonomous build planning record' },
  { pushNameMatch: 'World 2 Push Record', buildName: 'World 2 Autonomous Build', category: 'WORLD2_AUTONOMOUS_BUILD', description: 'World 2 autonomous build planning record' },
  { pushNameMatch: 'Cloud Push Record', buildName: 'Cloud Autonomous Build', category: 'CLOUD_AUTONOMOUS_BUILD', description: 'Cloud autonomous build planning record' },
  { pushNameMatch: 'AiDev Push Record', buildName: 'AiDev Autonomous Build', category: 'AIDEV_AUTONOMOUS_BUILD', description: 'AiDev autonomous build planning record' },
  { pushNameMatch: 'Founder Alert Push Record', buildName: 'Founder Autonomous Build', category: 'FOUNDER_AUTONOMOUS_BUILD', description: 'Founder autonomous build planning record' },
  { pushNameMatch: 'Autonomous Builder Push Record', buildName: 'Self Evolution Autonomous Build', category: 'SELF_EVOLUTION_AUTONOMOUS_BUILD', description: 'Self evolution autonomous build planning record' },
  { pushNameMatch: 'Approval Push Record', buildName: 'Verification Autonomous Build', category: 'VERIFICATION_AUTONOMOUS_BUILD', description: 'Verification autonomous build planning record' },
  { pushNameMatch: 'Preview Push Record', buildName: 'Testing Autonomous Build', category: 'TESTING_AUTONOMOUS_BUILD', description: 'Testing autonomous build planning record' },
  { pushNameMatch: 'Command Push Record', buildName: 'Fixing Autonomous Build', category: 'FIXING_AUTONOMOUS_BUILD', description: 'Fixing autonomous build planning record' },
];

let bootstrapped = false;

export function resetAutonomousBuilderBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  if (
    listRuntimes().length > 0 &&
    listCrossDeviceSessionsAll().length > 0 &&
    listNotificationsAll().length > 0 &&
    listInboxEntriesAll().length > 0 &&
    listDeliveryRecordsAll().length > 0 &&
    listPushRecordsAll().length > 0
  ) {
    return;
  }
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processCrossDeviceRequest('Show cross device inventory');
  processFounderNotificationRequest('Show founder notification inventory');
  processFounderInboxRequest('Show founder inbox inventory');
  processNotificationDeliveryRequest('Show notification delivery inventory');
  processMobilePushRequest('Show mobile push inventory');
}

function resolveLinksFromPush(pushId: string): {
  deliveryId: string;
  notificationId: string;
  inboxEntryId: string;
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  deviceId: string;
  crossDeviceSessionId: string;
} | null {
  const push = getPushRecord(pushId);
  if (!push) return null;
  const owner = push.pushOwnership;
  return {
    deliveryId: push.deliveryId,
    notificationId: push.notificationId,
    inboxEntryId: push.inboxEntryId,
    projectId: owner.projectId,
    runtimeId: owner.runtimeId,
    workspaceId: owner.workspaceId,
    persistentBuildId: owner.persistentBuildId,
    deviceId: owner.deviceId,
    crossDeviceSessionId: owner.crossDeviceSessionId,
  };
}

function bootstrapAutonomousBuildRecords(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_AUTONOMOUS_BUILDS) {
    const pushId = findPushByName(seed.pushNameMatch);
    if (!pushId) continue;
    const links = resolveLinksFromPush(pushId);
    if (!links) continue;
    registerAutonomousBuild({
      buildName: seed.buildName,
      pushId,
      deliveryId: links.deliveryId,
      notificationId: links.notificationId,
      inboxEntryId: links.inboxEntryId,
      buildCategory: seed.category,
      projectId: links.projectId || projectId,
      runtimeId: links.runtimeId,
      workspaceId: links.workspaceId,
      persistentBuildId: links.persistentBuildId,
      deviceId: links.deviceId,
      crossDeviceSessionId: links.crossDeviceSessionId,
      buildDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerAutonomousBuild(input: RegisterAutonomousBuildInput): RegisterAutonomousBuildResult {
  const category = input.buildCategory ?? 'GENERAL_AUTONOMOUS_BUILD';
  const existing = listStoredAutonomousBuildRecords().find(
    (r) =>
      r.buildMetadata.buildName === input.buildName &&
      r.buildOwnership.projectId === input.projectId &&
      r.pushId === input.pushId &&
      r.deliveryId === input.deliveryId &&
      r.buildCategory === category,
  );
  if (existing && !input.allowDuplicate) {
    return { record: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateAutonomousBuildRegistration(input);
  if (!validation.valid) {
    return { record: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const autonomousBuildId = nextAutonomousBuildId();

  const ownership = buildAutonomousBuildOwnership({
    autonomousBuildId,
    pushId: input.pushId,
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
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  const record: AutonomousBuildSession = {
    autonomousBuildId,
    pushId: input.pushId,
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    buildCategory: category,
    buildState: 'CREATED',
    buildStatus: 'UNKNOWN',
    buildOwnership: ownership,
    buildContext: buildDefaultAutonomousBuildContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      pushId: input.pushId,
      deliveryId: input.deliveryId,
      notificationId: input.notificationId,
      inboxEntryId: input.inboxEntryId,
      crossDeviceSessionId: input.crossDeviceSessionId,
    }),
    buildMetadata: {
      buildName: input.buildName,
      buildDescription: input.buildDescription ?? '',
      tags: [category],
      monitorable: true,
    },
    buildProvenance: {
      sourceSystem: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
      registeredBy: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    buildGoal: null,
    buildPlan: null,
    buildStages: [],
    buildReadiness: null,
    buildConstraints: [],
    buildCapabilities: [],
    buildDeliveryLink: { deliveryId: input.deliveryId, ...emptyLink },
    buildPushLink: { pushId: input.pushId, ...emptyLink },
    buildNotificationLink: { notificationId: input.notificationId, ...emptyLink },
    buildInboxLink: { inboxEntryId: input.inboxEntryId, ...emptyLink },
    buildCloudLink: { runtimeId: input.runtimeId, ...emptyLink },
    buildWorld2Link: { world2OperationId: '', ...emptyLink },
    buildAiDevLink: { aidevOperationId: '', ...emptyLink },
    buildOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      ...emptyLink,
    },
    buildProjectVaultLink: { vaultProjectId: input.projectId, ...emptyLink },
    createdAt: now,
    updatedAt: now,
  };

  createAutonomousBuild(record);

  linkAutonomousBuildToPush(autonomousBuildId, input.pushId);
  linkAutonomousBuildToDelivery(autonomousBuildId, input.deliveryId);
  linkAutonomousBuildToNotification(autonomousBuildId, input.notificationId);
  linkAutonomousBuildToInbox(autonomousBuildId, input.inboxEntryId);
  linkAutonomousBuildToCloud(autonomousBuildId, input.runtimeId);
  linkAutonomousBuildToWorld2(autonomousBuildId, 'world2');
  linkAutonomousBuildToAiDev(autonomousBuildId, 'aidev');
  linkAutonomousBuildToProjectVault(autonomousBuildId, input.projectId);
  linkAutonomousBuildToOperatorFeed(autonomousBuildId);
  recordAutonomousBuildOwnershipHistory(autonomousBuildId, `Build ownership assigned to ${ownership.ownerModule}`);
  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'BUILD',
    summary: `Build record ${autonomousBuildId} registered: ${input.buildName} (push=${input.pushId}, delivery=${input.deliveryId})`,
    scopeUsed: input.projectId,
  });

  return {
    record: getStoredAutonomousBuildRecord(autonomousBuildId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function registerAutonomousBuildOwnershipRecord(
  autonomousBuildId: string,
  ownership: AutonomousBuildOwnership,
): AutonomousBuildOwnership | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;
  storeAutonomousBuildRecord({ ...record, buildOwnership: ownership, updatedAt: Date.now() });
  recordAutonomousBuildOwnershipHistory(autonomousBuildId, `Ownership updated for ${ownership.ownerModule}`);
  return ownership;
}

export {
  queryAutonomousBuildRecords,
  listAutonomousBuildRecordsAll as listAutonomousBuilds,
  listAutonomousBuildsByPush,
  listAutonomousBuildsByDelivery,
  listAutonomousBuildsByNotification,
  listAutonomousBuildsByInbox,
  listAutonomousBuildsByProject,
  listAutonomousBuildsByRuntime,
  listAutonomousBuildsByState,
} from './autonomous-builder-query.js';

export function getAutonomousBuildRecord(autonomousBuildId: string): AutonomousBuildSession | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareAutonomousBuilderFoundationInput> = {},
): PrepareAutonomousBuilderFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const crossDevice = listCrossDeviceSessionsAll()[0];
  const build = listPersistentBuilds()[0];
  const notification = listNotificationsAll()[0];
  const inbox = listInboxEntriesAll()[0];
  const delivery = listDeliveryRecordsAll()[0];
  const push = listPushRecordsAll()[0];

  return {
    query,
    projectId: project.projectId,
    runtimeId:
      crossDevice?.crossDeviceOwner.runtimeId ??
      listRuntimes()[0]?.runtimeId ??
      'crrt-0001',
    workspaceId:
      crossDevice?.crossDeviceOwner.workspaceId ??
      build?.buildOwner.workspaceId ??
      'hws-0001',
    persistentBuildId:
      crossDevice?.crossDeviceOwner.persistentBuildId ??
      build?.buildId ??
      'pbuild-0001',
    deviceId: crossDevice?.crossDeviceOwner.deviceId ?? 'dev-0001',
    crossDeviceSessionId: crossDevice?.crossDeviceId ?? 'mxdev-0001',
    pushId: push?.pushId ?? 'mpush-0001',
    deliveryId: delivery?.deliveryId ?? push?.deliveryId ?? 'ndeliv-0001',
    notificationId: notification?.notificationId ?? push?.notificationId ?? 'fnotif-0001',
    inboxEntryId: inbox?.inboxEntryId ?? push?.inboxEntryId ?? 'finbox-0001',
    buildName: 'DevPulse Autonomous Build Record',
    buildCategory: 'GENERAL_AUTONOMOUS_BUILD',
    projectExists: project.projectId !== 'none',
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: listCrossDeviceSessionsAll().length > 0,
    pushExists: listPushRecordsAll().length > 0,
    deliveryExists: listDeliveryRecordsAll().length > 0,
    notificationExists: listNotificationsAll().length > 0,
    inboxEntryExists: listInboxEntriesAll().length > 0,
    ownershipValid: true,
    ...overrides,
  };
}

function orchestrateBuildPipeline(autonomousBuildId: string): {
  record: AutonomousBuildSession | null;
  rejected: boolean;
} {
  refreshAutonomousBuildContext(autonomousBuildId);

  const before = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!before) return { record: null, rejected: true };

  const pipelineRecord = runAutonomousBuildPlanningPipeline(autonomousBuildId);

  return {
    record: pipelineRecord,
    rejected: before.buildCategory === 'FIXING_AUTONOMOUS_BUILD' && before.buildState === 'FAILED',
  };
}

export function prepareAutonomousBuilderFoundation(
  input: PrepareAutonomousBuilderFoundationInput,
): PrepareAutonomousBuilderFoundationResult {
  const query = input.query ?? 'Show autonomous build inventory';

  if (isDuplicateAutonomousBuilderExecutorQuestion(query)) {
    publishAutonomousBuilderFeedStages(query, false);
    updateAutonomousBuildDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllAutonomousBuilderReports(),
      diagnostics: getAutonomousBuildDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate autonomous builder executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create autonomous_builder_executor or parallel autonomous builder authorities.',
      planningOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.crossDeviceSessionExists ||
    !input.pushExists ||
    !input.deliveryExists ||
    !input.notificationExists ||
    !input.inboxEntryExists
  ) {
    publishAutonomousBuilderFeedStages(query, false);
    updateAutonomousBuildDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllAutonomousBuilderReports(),
      diagnostics: getAutonomousBuildDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeAutonomousBuilderResponse(query, null, buildAllAutonomousBuilderReports(), true),
      planningOnly: true,
    };
  }

  bootstrapAutonomousBuildRecords(input.projectId);

  const registration = registerAutonomousBuild({
    buildName: input.buildName ?? 'DevPulse Autonomous Build Record',
    pushId: input.pushId ?? listPushRecordsAll()[0]!.pushId,
    deliveryId: input.deliveryId ?? listDeliveryRecordsAll()[0]!.deliveryId,
    notificationId: input.notificationId ?? listNotificationsAll()[0]!.notificationId,
    inboxEntryId: input.inboxEntryId ?? listInboxEntriesAll()[0]!.inboxEntryId,
    buildCategory: input.buildCategory ?? 'GENERAL_AUTONOMOUS_BUILD',
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    buildDescription: 'Autonomous build planning session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let record = registration.record;
  let validation: AutonomousBuildValidationResult = {
    valid: !registration.blocked && record !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && record) {
    validation.warnings.push(`Using existing build record: ${record.autonomousBuildId}`);
  }

  let rejected = false;

  if (record && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateBuildPipeline(record.autonomousBuildId);
    record = pipeline.record;
    rejected = pipeline.rejected;
  }

  if (record && !registration.duplicate) {
    record = getStoredAutonomousBuildRecord(record.autonomousBuildId);
    validation = validateAutonomousBuildRecord(record);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllAutonomousBuilderReports();
  const finalState = record?.buildState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishAutonomousBuilderFeedStages(query, !blocked, record?.autonomousBuildId, blocked);
  if (record) linkAutonomousBuildToOperatorFeed(record.autonomousBuildId);
  updateAutonomousBuildDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    record,
    reports,
    diagnostics: getAutonomousBuildDiagnostics(),
    validation,
    responseText: composeAutonomousBuilderResponse(query, record, reports, blocked),
    planningOnly: true,
  };
}

export function processAutonomousBuilderRequest(
  query: string,
): PrepareAutonomousBuilderFoundationResult {
  return prepareAutonomousBuilderFoundation(resolveInputFromQuery(query));
}

export function getAutonomousBuilderContext(
  query: string,
): PrepareAutonomousBuilderFoundationResult {
  return processAutonomousBuilderRequest(query);
}

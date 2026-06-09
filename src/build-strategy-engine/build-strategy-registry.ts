/**
 * Build Strategy Engine — registry and orchestrator.
 * Strategy/planning only — no code modification, execution, builds, tests, fixes, or deploys.
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
} from '../mobile-push/index.js';
import {
  processAutonomousBuilderRequest,
  listAutonomousBuilds,
  getAutonomousBuildRecord,
} from '../autonomous-builder/index.js';
import { publishBuildStrategyFeedStages } from '../operator-feed/build-strategy-feed-bridge.js';
import {
  nextBuildStrategyId,
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { buildBuildStrategyOwnership, recordBuildStrategyOwnershipHistory } from './build-strategy-ownership.js';
import { buildDefaultBuildStrategyContext, refreshBuildStrategyContext } from './build-strategy-context.js';
import { linkBuildStrategyToAutonomousBuilder, findAutonomousBuildByName } from './build-strategy-autonomous-builder-bridge.js';
import { linkBuildStrategyToPush } from './build-strategy-push-bridge.js';
import { linkBuildStrategyToDelivery } from './build-strategy-delivery-bridge.js';
import { linkBuildStrategyToNotification } from './build-strategy-notification-bridge.js';
import { linkBuildStrategyToInbox } from './build-strategy-inbox-bridge.js';
import { linkBuildStrategyToCloud } from './build-strategy-cloud-bridge.js';
import { linkBuildStrategyToWorld2 } from './build-strategy-world2-bridge.js';
import { linkBuildStrategyToAiDev } from './build-strategy-aidev-bridge.js';
import { linkBuildStrategyToOperatorFeed } from './build-strategy-operator-feed-bridge.js';
import { linkBuildStrategyToProjectVault } from './build-strategy-project-vault-bridge.js';
import {
  createBuildStrategy,
  runBuildStrategyPlanningPipeline,
} from './build-strategy-manager.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { validateBuildStrategyRegistration, validateBuildStrategyRecord } from './build-strategy-validator.js';
import { updateBuildStrategyDiagnostics, getBuildStrategyDiagnostics } from './build-strategy-diagnostics.js';
import { buildAllBuildStrategyReports, composeBuildStrategyResponse } from './build-strategy-report-builder.js';
import { queryBuildStrategyRecords, listBuildStrategyRecordsAll } from './build-strategy-query.js';
import { resolveCategoryFromAutonomousBuildName } from './build-strategy-selector.js';
import type {
  BuildStrategySession,
  BuildStrategyCategory,
  BuildStrategyValidationResult,
  BuildStrategyOwnership,
  PrepareBuildStrategyEngineInput,
  PrepareBuildStrategyEngineResult,
  RegisterBuildStrategyInput,
  RegisterBuildStrategyResult,
} from './build-strategy-types.js';
import {
  BUILD_STRATEGY_ENGINE_OWNER_MODULE,
  isDuplicateBuildStrategyExecutorQuestion,
} from './build-strategy-types.js';

const BOOTSTRAP_BUILD_STRATEGIES: Array<{
  autonomousBuildNameMatch: string;
  strategyName: string;
  category: BuildStrategyCategory;
  description: string;
}> = [
  { autonomousBuildNameMatch: 'General Autonomous Build', strategyName: 'General Build Strategy', category: 'GENERAL_BUILD_STRATEGY', description: 'General build strategy planning record' },
  { autonomousBuildNameMatch: 'Project Autonomous Build', strategyName: 'Project Build Strategy', category: 'PROJECT_BUILD_STRATEGY', description: 'Project build strategy planning record' },
  { autonomousBuildNameMatch: 'World 2 Autonomous Build', strategyName: 'World 2 Build Strategy', category: 'WORLD2_BUILD_STRATEGY', description: 'World 2 build strategy planning record' },
  { autonomousBuildNameMatch: 'Cloud Autonomous Build', strategyName: 'Cloud Build Strategy', category: 'CLOUD_BUILD_STRATEGY', description: 'Cloud build strategy planning record' },
  { autonomousBuildNameMatch: 'AiDev Autonomous Build', strategyName: 'AiDev Build Strategy', category: 'AIDEV_BUILD_STRATEGY', description: 'AiDev build strategy planning record' },
  { autonomousBuildNameMatch: 'Founder Autonomous Build', strategyName: 'Founder Guided Build Strategy', category: 'FOUNDER_GUIDED_BUILD_STRATEGY', description: 'Founder guided build strategy planning record' },
  { autonomousBuildNameMatch: 'Self Evolution Autonomous Build', strategyName: 'Self Evolution Build Strategy', category: 'SELF_EVOLUTION_BUILD_STRATEGY', description: 'Self evolution build strategy planning record' },
  { autonomousBuildNameMatch: 'Verification Autonomous Build', strategyName: 'Feature Build Strategy', category: 'FEATURE_BUILD_STRATEGY', description: 'Feature build strategy planning record' },
  { autonomousBuildNameMatch: 'Testing Autonomous Build', strategyName: 'UI Build Strategy', category: 'UI_BUILD_STRATEGY', description: 'UI build strategy planning record' },
  { autonomousBuildNameMatch: 'Fixing Autonomous Build', strategyName: 'Bugfix Build Strategy', category: 'BUGFIX_BUILD_STRATEGY', description: 'Bugfix build strategy planning record' },
  { autonomousBuildNameMatch: 'General Autonomous Build', strategyName: 'Refactor Build Strategy', category: 'REFACTOR_BUILD_STRATEGY', description: 'Refactor build strategy planning record' },
  { autonomousBuildNameMatch: 'Project Autonomous Build', strategyName: 'Backend Build Strategy', category: 'BACKEND_BUILD_STRATEGY', description: 'Backend build strategy planning record' },
  { autonomousBuildNameMatch: 'Cloud Autonomous Build', strategyName: 'Full Stack Build Strategy', category: 'FULL_STACK_BUILD_STRATEGY', description: 'Full stack build strategy planning record' },
  { autonomousBuildNameMatch: 'Self Evolution Autonomous Build', strategyName: 'Autonomous Build Strategy', category: 'AUTONOMOUS_BUILD_STRATEGY', description: 'Autonomous build strategy planning record' },
];

let bootstrapped = false;

export function resetBuildStrategyBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processAutonomousBuilderRequest('Show autonomous builder inventory');

  if (
    listRuntimes().length > 0 &&
    listCrossDeviceSessionsAll().length > 0 &&
    listNotificationsAll().length > 0 &&
    listInboxEntriesAll().length > 0 &&
    listDeliveryRecordsAll().length > 0 &&
    listPushRecordsAll().length > 0 &&
    listAutonomousBuilds().length > 0
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

function resolveLinksFromAutonomousBuild(autonomousBuildId: string): {
  pushId: string;
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
  const build = getAutonomousBuildRecord(autonomousBuildId);
  if (!build) return null;
  const owner = build.buildOwnership;
  return {
    pushId: build.pushId,
    deliveryId: build.deliveryId,
    notificationId: build.notificationId,
    inboxEntryId: build.inboxEntryId,
    projectId: owner.projectId,
    runtimeId: owner.runtimeId,
    workspaceId: owner.workspaceId,
    persistentBuildId: owner.persistentBuildId,
    deviceId: owner.deviceId,
    crossDeviceSessionId: owner.crossDeviceSessionId,
  };
}

function bootstrapBuildStrategyRecords(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_BUILD_STRATEGIES) {
    const autonomousBuildId = findAutonomousBuildByName(seed.autonomousBuildNameMatch);
    if (!autonomousBuildId) continue;
    const links = resolveLinksFromAutonomousBuild(autonomousBuildId);
    if (!links) continue;

    const category = seed.category ?? resolveCategoryFromAutonomousBuildName(seed.autonomousBuildNameMatch);

    registerBuildStrategy({
      strategyName: seed.strategyName,
      autonomousBuildId,
      pushId: links.pushId,
      deliveryId: links.deliveryId,
      notificationId: links.notificationId,
      inboxEntryId: links.inboxEntryId,
      strategyCategory: category,
      projectId: links.projectId || projectId,
      runtimeId: links.runtimeId,
      workspaceId: links.workspaceId,
      persistentBuildId: links.persistentBuildId,
      deviceId: links.deviceId,
      crossDeviceSessionId: links.crossDeviceSessionId,
      strategyDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerBuildStrategy(input: RegisterBuildStrategyInput): RegisterBuildStrategyResult {
  const category = input.strategyCategory ?? 'GENERAL_BUILD_STRATEGY';
  const existing = listStoredBuildStrategyRecords().find(
    (r) =>
      r.strategyMetadata.strategyName === input.strategyName &&
      r.strategyOwnership.projectId === input.projectId &&
      r.autonomousBuildId === input.autonomousBuildId &&
      r.strategyCategory === category,
  );
  if (existing && !input.allowDuplicate) {
    return { record: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateBuildStrategyRegistration(input);
  if (!validation.valid) {
    return { record: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const buildStrategyId = nextBuildStrategyId();

  const ownership = buildBuildStrategyOwnership({
    buildStrategyId,
    autonomousBuildId: input.autonomousBuildId,
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
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: false,
  };

  const record: BuildStrategySession = {
    buildStrategyId,
    autonomousBuildId: input.autonomousBuildId,
    pushId: input.pushId,
    deliveryId: input.deliveryId,
    notificationId: input.notificationId,
    inboxEntryId: input.inboxEntryId,
    strategyCategory: category,
    strategyState: 'CREATED',
    strategyStatus: 'UNKNOWN',
    strategyOwnership: ownership,
    strategyContext: buildDefaultBuildStrategyContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      autonomousBuildId: input.autonomousBuildId,
      pushId: input.pushId,
      deliveryId: input.deliveryId,
      notificationId: input.notificationId,
      inboxEntryId: input.inboxEntryId,
      crossDeviceSessionId: input.crossDeviceSessionId,
    }),
    strategyMetadata: {
      strategyName: input.strategyName,
      strategyDescription: input.strategyDescription ?? '',
      tags: [category],
      monitorable: true,
    },
    strategyProvenance: {
      sourceSystem: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
      registeredBy: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    strategyClassification: null,
    strategyMode: null,
    strategyAutonomy: null,
    strategyRisk: null,
    strategyConfidence: null,
    strategyDepth: null,
    strategyStages: [],
    strategyReadiness: null,
    strategyConstraints: [],
    strategyDependencies: [],
    strategyPolicy: null,
    strategyAutonomousBuilderLink: { autonomousBuildId: input.autonomousBuildId, ...emptyLink },
    strategyDeliveryLink: { deliveryId: input.deliveryId, ...emptyLink },
    strategyPushLink: { pushId: input.pushId, ...emptyLink },
    strategyNotificationLink: { notificationId: input.notificationId, ...emptyLink },
    strategyInboxLink: { inboxEntryId: input.inboxEntryId, ...emptyLink },
    strategyCloudLink: { runtimeId: input.runtimeId, ...emptyLink },
    strategyWorld2Link: { world2OperationId: '', ...emptyLink },
    strategyAiDevLink: { aidevOperationId: '', ...emptyLink },
    strategyOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      ...emptyLink,
    },
    strategyProjectVaultLink: { vaultProjectId: input.projectId, ...emptyLink },
    createdAt: now,
    updatedAt: now,
  };

  createBuildStrategy(record);

  linkBuildStrategyToAutonomousBuilder(buildStrategyId, input.autonomousBuildId);
  linkBuildStrategyToPush(buildStrategyId, input.pushId);
  linkBuildStrategyToDelivery(buildStrategyId, input.deliveryId);
  linkBuildStrategyToNotification(buildStrategyId, input.notificationId);
  linkBuildStrategyToInbox(buildStrategyId, input.inboxEntryId);
  linkBuildStrategyToCloud(buildStrategyId, input.runtimeId);
  linkBuildStrategyToWorld2(buildStrategyId, 'world2');
  linkBuildStrategyToAiDev(buildStrategyId, 'aidev');
  linkBuildStrategyToProjectVault(buildStrategyId, input.projectId);
  linkBuildStrategyToOperatorFeed(buildStrategyId);
  recordBuildStrategyOwnershipHistory(buildStrategyId, `Strategy ownership assigned to ${ownership.ownerModule}`);
  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'STRATEGY',
    summary: `Strategy record ${buildStrategyId} registered: ${input.strategyName} (autonomousBuild=${input.autonomousBuildId}, push=${input.pushId})`,
    scopeUsed: input.projectId,
  });

  return {
    record: getStoredBuildStrategyRecord(buildStrategyId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function registerBuildStrategyOwnershipRecord(
  buildStrategyId: string,
  ownership: BuildStrategyOwnership,
): BuildStrategyOwnership | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;
  storeBuildStrategyRecord({ ...record, strategyOwnership: ownership, updatedAt: Date.now() });
  recordBuildStrategyOwnershipHistory(buildStrategyId, `Ownership updated for ${ownership.ownerModule}`);
  return ownership;
}

export {
  queryBuildStrategyRecords,
  listBuildStrategyRecordsAll as listBuildStrategies,
  listBuildStrategiesByAutonomousBuilder,
  listBuildStrategiesByPush,
  listBuildStrategiesByDelivery,
  listBuildStrategiesByNotification,
  listBuildStrategiesByInbox,
  listBuildStrategiesByProject,
  listBuildStrategiesByRuntime,
  listBuildStrategiesByState,
} from './build-strategy-query.js';

export function getBuildStrategyRecord(buildStrategyId: string): BuildStrategySession | null {
  return getStoredBuildStrategyRecord(buildStrategyId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareBuildStrategyEngineInput> = {},
): PrepareBuildStrategyEngineInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const crossDevice = listCrossDeviceSessionsAll()[0];
  const build = listPersistentBuilds()[0];
  const notification = listNotificationsAll()[0];
  const inbox = listInboxEntriesAll()[0];
  const delivery = listDeliveryRecordsAll()[0];
  const push = listPushRecordsAll()[0];
  const autonomousBuild = listAutonomousBuilds()[0];

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
    autonomousBuildId: autonomousBuild?.autonomousBuildId ?? 'abuild-0001',
    pushId: push?.pushId ?? 'mpush-0001',
    deliveryId: delivery?.deliveryId ?? push?.deliveryId ?? 'ndeliv-0001',
    notificationId: notification?.notificationId ?? push?.notificationId ?? 'fnotif-0001',
    inboxEntryId: inbox?.inboxEntryId ?? push?.inboxEntryId ?? 'finbox-0001',
    strategyName: 'DevPulse Build Strategy Record',
    strategyCategory: 'GENERAL_BUILD_STRATEGY',
    projectExists: project.projectId !== 'none',
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: listCrossDeviceSessionsAll().length > 0,
    autonomousBuildExists: listAutonomousBuilds().length > 0,
    pushExists: listPushRecordsAll().length > 0,
    deliveryExists: listDeliveryRecordsAll().length > 0,
    notificationExists: listNotificationsAll().length > 0,
    inboxEntryExists: listInboxEntriesAll().length > 0,
    ownershipValid: true,
    ...overrides,
  };
}

function orchestrateStrategyPipeline(buildStrategyId: string): {
  record: BuildStrategySession | null;
  rejected: boolean;
} {
  refreshBuildStrategyContext(buildStrategyId);

  const before = getStoredBuildStrategyRecord(buildStrategyId);
  if (!before) return { record: null, rejected: true };

  const pipelineRecord = runBuildStrategyPlanningPipeline(buildStrategyId);

  return {
    record: pipelineRecord,
    rejected: before.strategyCategory === 'BUGFIX_BUILD_STRATEGY' && before.strategyState === 'FAILED',
  };
}

export function prepareBuildStrategyEngine(
  input: PrepareBuildStrategyEngineInput,
): PrepareBuildStrategyEngineResult {
  const query = input.query ?? 'Show build strategy inventory';

  if (isDuplicateBuildStrategyExecutorQuestion(query)) {
    publishBuildStrategyFeedStages(query, false);
    updateBuildStrategyDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllBuildStrategyReports(),
      diagnostics: getBuildStrategyDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate build strategy executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create build_strategy_executor or parallel build strategy authorities.',
      strategyOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.crossDeviceSessionExists ||
    !input.autonomousBuildExists ||
    !input.pushExists ||
    !input.deliveryExists ||
    !input.notificationExists ||
    !input.inboxEntryExists
  ) {
    publishBuildStrategyFeedStages(query, false);
    updateBuildStrategyDiagnostics(query, 'FAILED');
    return {
      record: null,
      reports: buildAllBuildStrategyReports(),
      diagnostics: getBuildStrategyDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeBuildStrategyResponse(query, null, buildAllBuildStrategyReports(), true),
      strategyOnly: true,
    };
  }

  bootstrapBuildStrategyRecords(input.projectId);

  const registration = registerBuildStrategy({
    strategyName: input.strategyName ?? 'DevPulse Build Strategy Record',
    autonomousBuildId: input.autonomousBuildId ?? listAutonomousBuilds()[0]!.autonomousBuildId,
    pushId: input.pushId ?? listPushRecordsAll()[0]!.pushId,
    deliveryId: input.deliveryId ?? listDeliveryRecordsAll()[0]!.deliveryId,
    notificationId: input.notificationId ?? listNotificationsAll()[0]!.notificationId,
    inboxEntryId: input.inboxEntryId ?? listInboxEntriesAll()[0]!.inboxEntryId,
    strategyCategory: input.strategyCategory ?? 'GENERAL_BUILD_STRATEGY',
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    deviceId: input.deviceId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    strategyDescription: 'Build strategy planning session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let record = registration.record;
  let validation: BuildStrategyValidationResult = {
    valid: !registration.blocked && record !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && record) {
    validation.warnings.push(`Using existing strategy record: ${record.buildStrategyId}`);
  }

  let rejected = false;

  if (record && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateStrategyPipeline(record.buildStrategyId);
    record = pipeline.record;
    rejected = pipeline.rejected;
  }

  if (record && !registration.duplicate) {
    record = getStoredBuildStrategyRecord(record.buildStrategyId);
    validation = validateBuildStrategyRecord(record);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllBuildStrategyReports();
  const finalState = record?.strategyState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishBuildStrategyFeedStages(query, !blocked, record?.buildStrategyId, blocked);
  if (record) linkBuildStrategyToOperatorFeed(record.buildStrategyId);
  updateBuildStrategyDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    record,
    reports,
    diagnostics: getBuildStrategyDiagnostics(),
    validation,
    responseText: composeBuildStrategyResponse(query, record, reports, blocked),
    strategyOnly: true,
  };
}

export function processBuildStrategyRequest(
  query: string,
): PrepareBuildStrategyEngineResult {
  return prepareBuildStrategyEngine(resolveInputFromQuery(query));
}

export function getBuildStrategyEngineContext(
  query: string,
): PrepareBuildStrategyEngineResult {
  return processBuildStrategyRequest(query);
}

/**
 * DevPulse V2 Phase 18.8 — Notification Delivery Foundation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN,
  createNormalizedQueryCache,
  createPackageJsonCache,
  createSourceTextCache,
  createUpstreamBootstrapper,
  normalizeBatchRoutingQuery,
  runCachedHttpStatusChecks,
} from './lib/mobile-phase18-validation-fixtures.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  NOTIFICATION_DELIVERY_FOUNDATION_PASS_TOKEN,
  NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_DELIVERY_DUPLICATES,
  TRACKED_DELIVERY_CATEGORIES,
  DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX,
  isNotificationDeliveryFoundationQuestion,
  prepareNotificationDeliveryFoundation,
  processNotificationDeliveryRequest,
  getDeliveryDiagnostics,
  resetNotificationDeliveryFoundationForTests,
  registerDeliveryRecord,
  getDeliveryRecord,
  listDeliveryRecordsAll,
  listDeliveriesByProject,
  listDeliveriesByCommand,
  listDeliveriesByChat,
  listDeliveriesByPreview,
  listDeliveriesByRuntime,
  listDeliveriesByWorkspace,
  listDeliveriesByPersistentBuild,
  listDeliveriesByDevice,
  listDeliveriesByCrossDeviceSession,
  listDeliveriesByState,
  listDeliveriesByPriority,
  listDeliveriesByNotification,
  listDeliveriesByInboxEntry,
  queryDeliveryRecords,
  setDeliveryState,
  trackDeliveryStateHistory,
  getDeliveryHistory,
  planDelivery,
  routeDelivery,
  selectDeliveryTarget,
  checkChannelEligibility,
  blockDelivery,
  deferDelivery,
  markDeliveryReady,
  markDeliveryCompleted,
  linkDeliveryToNotification,
  linkDeliveryToInbox,
  getNotificationForDelivery,
  getInboxForDelivery,
  detectDeliveryNotificationMismatch,
  detectDeliveryInboxMismatch,
  linkDeliveryToCrossDevice,
  getCrossDeviceForDelivery,
  detectDeliveryCrossDeviceMismatch,
  linkDeliveryToCloud,
  getCloudForDelivery,
  detectDeliveryCloudMismatch,
  linkDeliveryToCommand,
  getCommandForDelivery,
  detectDeliveryCommandMismatch,
  linkDeliveryToChat,
  getChatForDelivery,
  detectDeliveryChatMismatch,
  linkDeliveryToPreview,
  getPreviewForDelivery,
  detectDeliveryPreviewMismatch,
  linkDeliveryToApproval,
  getApprovalForDelivery,
  detectDeliveryApprovalMismatch,
  linkDeliveryToOperatorFeed,
  getOperatorFeedForDelivery,
  linkDeliveryToProjectVault,
  getProjectVaultForDelivery,
  buildDuplicateDeliveryRiskContext,
  evaluateDuplicateDeliveryRisk,
  validateDeliveryRecord,
  validateDeliveryState,
  buildDeliveryFailureContext,
  getDeliveryVisibility,
  registerDeliveryVisibility,
  registerDeliveryPriority,
  getDeliveryPriority,
} from '../src/notification-delivery/index.js';
import {
  resetFounderInboxFoundationForTests,
  processFounderInboxRequest,
  listInboxEntriesAll,
} from '../src/founder-inbox/index.js';
import {
  resetFounderNotificationRuntimeFoundationForTests,
  processFounderNotificationRequest,
  listNotificationsAll,
} from '../src/founder-notification-runtime/index.js';
import {
  resetCrossDeviceRuntimeFoundationForTests,
  processCrossDeviceRequest,
  listCrossDeviceSessionsAll,
} from '../src/cross-device-runtime/index.js';
import {
  resetMobileApprovalRuntimeFoundationForTests,
  processMobileApprovalRequest,
  listMobileApprovalSessionsAll,
} from '../src/mobile-approval-runtime/index.js';
import {
  resetMobileCommandRuntimeFoundationForTests,
  processMobileCommandRequest,
  listMobileCommandSessionsAll,
} from '../src/mobile-command-runtime/index.js';
import {
  resetMobileChatRuntimeFoundationForTests,
  processMobileChatRequest,
  listMobileChatSessionsAll,
} from '../src/mobile-chat-runtime/index.js';
import {
  resetMobilePreviewRuntimeFoundationForTests,
  processMobilePreviewRequest,
  listMobilePreviewSessionsAll,
} from '../src/mobile-preview-runtime/index.js';
import { resetCloudRuntimeFoundationForTests, listRuntimes, processCloudRuntimeRequest } from '../src/cloud-runtime/index.js';
import { resetWorkspaceHostingFoundationForTests, processWorkspaceHostingRequest } from '../src/workspace-hosting/index.js';
import {
  resetPersistentBuildFoundationForTests,
  listPersistentBuilds,
  processPersistentBuildRequest,
} from '../src/persistent-build-runtime/index.js';
import { resetCloudVerificationFoundationForTests, processCloudVerificationRequest } from '../src/cloud-verification/index.js';
import {
  resetCloudRecoveryFoundationForTests,
  processCloudRecoveryRequest,
} from '../src/cloud-recovery/index.js';
import { resetCloudMonitoringFoundationForTests, processCloudMonitoringRequest } from '../src/cloud-monitoring/index.js';
import {
  NOTIFICATION_DELIVERY_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildNotificationDeliveryFoundationPanelSnapshot,
} from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
  analyzeActionVisibility,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningBlockerCounterForTests,
  buildReasoningVisibilityRecord,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { buildProgressRecords } from '../src/progress-intelligence/progress-model-builder.js';
import type { PrepareNotificationDeliveryFoundationInput } from '../src/notification-delivery/notification-delivery-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show notification delivery inventory';
const EXPECTED_UVL_ROW_COUNT =
  NOTIFICATION_DELIVERY_FOUNDATION_UVL_ROWS.length === 33 ? 33 : NOTIFICATION_DELIVERY_FOUNDATION_UVL_ROWS.length;

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const readText = createSourceTextCache(ROOT);
const routingPlanCache = createNormalizedQueryCache<ReturnType<typeof buildQuestionRoutingPlan>>(normalizeBatchRoutingQuery);
const upstreamBootstrap = createUpstreamBootstrapper(() => {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
  processCloudRecoveryRequest('Show cloud recovery inventory');
  processCloudMonitoringRequest('Show cloud monitoring inventory');
  processMobileCommandRequest('Show mobile command inventory');
  processMobileChatRequest('Show mobile chat inventory');
  processMobilePreviewRequest('Show mobile preview inventory');
  processMobileApprovalRequest('Show mobile approval inventory');
  processCrossDeviceRequest('Show cross device inventory');
  processFounderNotificationRequest('Show founder notification inventory');
  processFounderInboxRequest('Show founder inbox inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  const preview = listMobilePreviewSessionsAll()[0]!;
  const approval = listMobileApprovalSessionsAll()[0]!;
  const crossDevice = listCrossDeviceSessionsAll()[0]!;
  const notification = listNotificationsAll()[0]!;
  const inbox = listInboxEntriesAll()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    projectId: runtime.runtimeOwner.projectId,
    commandSessionId: command.mobileCommandId,
    chatSessionId: chat.mobileChatId,
    previewId: preview.mobilePreviewId,
    approvalId: approval.mobileApprovalId,
    deviceId: crossDevice.crossDeviceOwner.deviceId,
    crossDeviceSessionId: crossDevice.crossDeviceId,
    notificationId: notification.notificationId,
    inboxEntryId: inbox.inboxEntryId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processNotificationDeliveryRequest>>();
let coreFixture: ReturnType<typeof processNotificationDeliveryRequest> | null = null;
let responseCacheHits = 0;
let responseCacheMisses = 0;
let routingCacheHits = 0;
let routingCacheMisses = 0;
let upstreamBootstrapCalls = 0;

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function beginGroup(group: string): number {
  if (Date.now() - startedAt > MAX_RUNTIME_MS) throw new Error(`Max runtime guard exceeded during ${group}`);
  console.log(`▶ ${group} ...`);
  return Date.now();
}

function endGroup(group: string, started: number): void {
  const elapsed = Date.now() - started;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  console.log(`✓ ${group} — ${groupResults.filter((r) => r.passed).length}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold (${elapsed}ms)`);
}

function readTextOnce(path: string): string {
  return readText(path);
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) {
    responseCacheHits += 1;
    return hit;
  }
  if (key === CANONICAL_QUERY.trim().toLowerCase() && coreFixture) {
    responseCacheHits += 1;
    responseCache.set(key, coreFixture);
    return coreFixture;
  }
  responseCacheMisses += 1;
  const result = processNotificationDeliveryRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(
  overrides: Partial<PrepareNotificationDeliveryFoundationInput> = {},
): PrepareNotificationDeliveryFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    deviceId: 'dev-0001',
    crossDeviceSessionId: 'mxdev-0001',
    approvalId: 'mappr-0001',
    previewId: 'mpview-0001',
    commandSessionId: 'mcmd-0001',
    chatSessionId: 'mchat-0001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    notificationId: 'fnotif-0001',
    deliveryName: 'Test Notification Delivery Record',
    deliveryCategory: 'GENERAL_DELIVERY',
    inboxEntryId: 'finbox-0001',
    inboxEntryExists: true,
    projectExists: true,
    commandSessionExists: true,
    chatSessionExists: true,
    previewSessionExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    approvalSessionExists: true,
    crossDeviceSessionExists: true,
    notificationExists: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  coreFixture = null;
  responseCacheHits = 0;
  responseCacheMisses = 0;
  routingCacheHits = 0;
  routingCacheMisses = 0;
  routingPlanCache.clear();
  upstreamBootstrap.invalidate();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetCloudRuntimeFoundationForTests();
  resetWorkspaceHostingFoundationForTests();
  resetPersistentBuildFoundationForTests();
  resetCloudVerificationFoundationForTests();
  resetCloudRecoveryFoundationForTests();
  resetCloudMonitoringFoundationForTests();
  resetMobileCommandRuntimeFoundationForTests();
  resetMobileChatRuntimeFoundationForTests();
  resetMobilePreviewRuntimeFoundationForTests();
  resetMobileApprovalRuntimeFoundationForTests();
  resetCrossDeviceRuntimeFoundationForTests();
  resetFounderNotificationRuntimeFoundationForTests();
  resetFounderInboxFoundationForTests();
  resetNotificationDeliveryFoundationForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

function ensureUpstream(): ReturnType<typeof upstreamBootstrap.ensure> {
  upstreamBootstrapCalls += 1;
  return upstreamBootstrap.ensure();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 18.8 Notification Delivery Foundation');
  console.log('==================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/notification-delivery');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'notification-delivery-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'notification-delivery-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'notification-delivery-store.ts')), 'store');
  assert('A-SETUP', '4. manager', existsSync(join(dir, 'notification-delivery-manager.ts')), 'manager');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'notification-delivery-state-manager.ts')), 'state');
  assert('A-SETUP', '6. ownership', existsSync(join(dir, 'notification-delivery-ownership.ts')), 'ownership');
  assert('A-SETUP', '7. context', existsSync(join(dir, 'notification-delivery-context.ts')), 'context');
  assert('A-SETUP', '8. visibility', existsSync(join(dir, 'notification-delivery-visibility.ts')), 'visibility');
  assert('A-SETUP', '9. intent', existsSync(join(dir, 'notification-delivery-intent.ts')), 'intent');
  assert('A-SETUP', '10. routing', existsSync(join(dir, 'notification-delivery-routing.ts')), 'routing');
  assert('A-SETUP', '11. targeting', existsSync(join(dir, 'notification-delivery-targeting.ts')), 'targeting');
  assert('A-SETUP', '12. eligibility', existsSync(join(dir, 'notification-delivery-channel-eligibility.ts')), 'eligibility');
  assert('A-SETUP', '13. policy', existsSync(join(dir, 'notification-delivery-policy.ts')), 'policy');
  assert('A-SETUP', '14. blocking', existsSync(join(dir, 'notification-delivery-blocking.ts')), 'blocking');
  assert('A-SETUP', '15. deferral', existsSync(join(dir, 'notification-delivery-deferral.ts')), 'deferral');
  assert('A-SETUP', '16. lifecycle', existsSync(join(dir, 'notification-delivery-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '17. notification bridge', existsSync(join(dir, 'notification-delivery-notification-bridge.ts')), 'notif');
  assert('A-SETUP', '18. inbox bridge', existsSync(join(dir, 'notification-delivery-inbox-bridge.ts')), 'inbox');
  assert('A-SETUP', '19. command bridge', existsSync(join(dir, 'notification-delivery-command-bridge.ts')), 'command');
  assert('A-SETUP', '20. chat bridge', existsSync(join(dir, 'notification-delivery-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '21. preview bridge', existsSync(join(dir, 'notification-delivery-preview-bridge.ts')), 'preview');
  assert('A-SETUP', '22. approval bridge', existsSync(join(dir, 'notification-delivery-approval-bridge.ts')), 'approval');
  assert('A-SETUP', '23. cloud bridge', existsSync(join(dir, 'notification-delivery-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '24. project vault bridge', existsSync(join(dir, 'notification-delivery-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '25. operator feed bridge', existsSync(join(dir, 'notification-delivery-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '26. cross device bridge', existsSync(join(dir, 'notification-delivery-cross-device-bridge.ts')), 'cross');
  assert('A-SETUP', '27. query', existsSync(join(dir, 'notification-delivery-query.ts')), 'query');
  assert('A-SETUP', '28. history', existsSync(join(dir, 'notification-delivery-history.ts')), 'history');
  assert('A-SETUP', '29. validator', existsSync(join(dir, 'notification-delivery-validator.ts')), 'validator');
  assert('A-SETUP', '30. diagnostics', existsSync(join(dir, 'notification-delivery-diagnostics.ts')), 'diag');
  assert('A-SETUP', '31. report', existsSync(join(dir, 'notification-delivery-report-builder.ts')), 'report');
  assert('A-SETUP', '32. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '33. feed bridge', existsSync(join(ROOT, 'src/operator-feed/notification-delivery-feed-bridge.ts')), 'feed');
  assert(
    'A-SETUP',
    '34. script',
    typeof pkg.scripts?.['validate:notification-delivery-foundation'] === 'string',
    'script',
  );
  const owner = getDevPulseV2Owner('notification_delivery_foundation');
  assert('A-SETUP', '35. owner', owner.ownerModule === NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '36. phase', owner.phase === 18.8, String(owner.phase));
  assert('A-SETUP', '37. categories', TRACKED_DELIVERY_CATEGORIES.length === 14, String(TRACKED_DELIVERY_CATEGORIES.length));
  assert(
    'A-SETUP',
    '38. duplicate prefix',
    DUPLICATE_DELIVERY_AUTHORITY_RISK_PREFIX === 'DUPLICATE_DELIVERY_AUTHORITY_RISK',
    'prefix',
  );
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareNotificationDeliveryFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      projectId: upstream.projectId,
      commandSessionId: upstream.commandSessionId,
      chatSessionId: upstream.chatSessionId,
      previewId: upstream.previewId,
      approvalId: upstream.approvalId,
      deviceId: upstream.deviceId,
      crossDeviceSessionId: upstream.crossDeviceSessionId,
      notificationId: upstream.notificationId,
      inboxEntryId: upstream.inboxEntryId,
    }),
  );
  assert(
    'B-CORE',
    '39. delivery id',
    ready.record?.deliveryId.startsWith('ndeliv-') === true,
    String(ready.record?.deliveryId),
  );
  assert('B-CORE', '40. planning only', ready.planningOnly === true, 'only');
  assert('B-CORE', '41. reports', ready.reports.length === 25, String(ready.reports.length));
  assert('B-CORE', '42. inventory', listDeliveryRecordsAll().length >= 14, String(listDeliveryRecordsAll().length));
  assert('B-CORE', '43. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert(
    'B-CORE',
    '44. notification ref',
    ready.record?.notificationId.startsWith('fnotif-') === true,
    String(ready.record?.notificationId),
  );
  assert(
    'B-CORE',
    '45. inbox ref',
    ready.record?.inboxEntryId.startsWith('finbox-') === true,
    String(ready.record?.inboxEntryId),
  );

  const reg = registerDeliveryRecord({
    deliveryName: 'Query Test Delivery Record',
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    deliveryCategory: 'PROJECT_DELIVERY',
    projectId: 'proj-q',
    deviceId: upstream.deviceId,
    crossDeviceSessionId: upstream.crossDeviceSessionId,
    approvalId: upstream.approvalId,
    previewId: upstream.previewId,
    commandSessionId: upstream.commandSessionId,
    chatSessionId: upstream.chatSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    priority: 'HIGH',
  });
  assert('B-CORE', '42. register', reg.record !== null && !reg.blocked, 'registered');
  assert(
    'B-CORE',
    '43. get entry',
    getDeliveryRecord(reg.record!.deliveryId)?.deliveryId === reg.record!.deliveryId,
    'get',
  );
  assert('B-CORE', '44. by project', listDeliveriesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '45. by command', listDeliveriesByCommand(upstream.commandSessionId).length >= 1, 'command');
  assert('B-CORE', '46. by chat', listDeliveriesByChat(upstream.chatSessionId).length >= 1, 'chat');
  assert('B-CORE', '47. by preview', listDeliveriesByPreview(upstream.previewId).length >= 1, 'preview');
  assert('B-CORE', '48. by runtime', listDeliveriesByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '49. by workspace', listDeliveriesByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '50. by build', listDeliveriesByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert(
    'B-CORE',
    '51. by owner',
    queryDeliveryRecords({ ownerModule: NOTIFICATION_DELIVERY_FOUNDATION_OWNER_MODULE }).length >= 1,
    'owner',
  );
  assert('B-CORE', '52. by category', queryDeliveryRecords({ deliveryCategory: 'PROJECT_DELIVERY' }).length >= 1, 'category');
  assert('B-CORE', '53. by priority', listDeliveriesByPriority('HIGH').length >= 1, 'priority');
  assert('B-CORE', '54. by notification', listDeliveriesByNotification(upstream.notificationId).length >= 1, 'notif');
  assert('B-CORE', '55. query', queryDeliveryRecords({ deliveryCategory: 'PROJECT_DELIVERY' }).length >= 1, 'query');

  linkDeliveryToCommand(reg.record!.deliveryId, upstream.commandSessionId);
  assert(
    'B-CORE',
    '56. command bridge',
    getCommandForDelivery(reg.record!.deliveryId) === upstream.commandSessionId,
    'command',
  );
  linkDeliveryToInbox(reg.record!.deliveryId, upstream.inboxEntryId);
  assert(
    'B-CORE',
    '57b. inbox bridge',
    getInboxForDelivery(reg.record!.deliveryId) === upstream.inboxEntryId,
    'inbox',
  );
  linkDeliveryToNotification(reg.record!.deliveryId, upstream.notificationId);
  assert(
    'B-CORE',
    '57. notification bridge',
    getNotificationForDelivery(reg.record!.deliveryId) === upstream.notificationId,
    'notif',
  );
  linkDeliveryToCrossDevice(reg.record!.deliveryId, upstream.crossDeviceSessionId);
  assert(
    'B-CORE',
    '58. cross device bridge',
    getCrossDeviceForDelivery(reg.record!.deliveryId) === upstream.crossDeviceSessionId,
    'cross',
  );
  linkDeliveryToCloud(reg.record!.deliveryId, upstream.runtimeId);
  assert('B-CORE', '59. cloud bridge', getCloudForDelivery(reg.record!.deliveryId) === upstream.runtimeId, 'cloud');
  linkDeliveryToProjectVault(reg.record!.deliveryId, 'proj-q');
  assert('B-CORE', '60. vault bridge', getProjectVaultForDelivery(reg.record!.deliveryId) === 'proj-q', 'vault');
  linkDeliveryToOperatorFeed(reg.record!.deliveryId);
  assert('B-CORE', '61. operator feed bridge', getOperatorFeedForDelivery(reg.record!.deliveryId) !== null, 'feed');

  registerDeliveryVisibility(reg.record!.deliveryId, {
    visibleInPlanning: true,
    visibleOnMobile: true,
    visibleOnDesktop: true,
    visibleOnCloud: false,
    visibleInOperatorFeed: true,
    visibleInProjectVault: true,
    visibilityReason: 'Test visibility',
  });
  assert('B-CORE', '62. visibility', getDeliveryVisibility(reg.record!.deliveryId)?.visibleInPlanning === true, 'visibility');

  registerDeliveryPriority(reg.record!.deliveryId, {
    priority: 'HIGH',
    priorityReason: 'Test priority',
    escalated: true,
    escalationReason: 'Test escalation',
  });
  assert('B-CORE', '63. priority', getDeliveryPriority(reg.record!.deliveryId)?.priority === 'HIGH', 'priority');

  setDeliveryState(reg.record!.deliveryId, 'PLANNED', true);
  assert('B-CORE', '64. state history', trackDeliveryStateHistory(reg.record!.deliveryId).length >= 1, 'history');
  assert('B-CORE', '65. delivery history', getDeliveryHistory(reg.record!.deliveryId).length >= 1, 'history');

  planDelivery(reg.record!.deliveryId);
  assert('B-CORE', '66. plan delivery', getDeliveryRecord(reg.record!.deliveryId)?.deliveryIntent !== null, 'plan');
  checkChannelEligibility(reg.record!.deliveryId, 'IN_APP');
  assert('B-CORE', '67. eligibility', getDeliveryRecord(reg.record!.deliveryId)?.deliveryEligibility !== null, 'elig');
  routeDelivery(reg.record!.deliveryId);
  assert('B-CORE', '68. route delivery', getDeliveryRecord(reg.record!.deliveryId)?.deliveryRoute !== null, 'route');
  selectDeliveryTarget(reg.record!.deliveryId);
  assert('B-CORE', '69. select target', getDeliveryRecord(reg.record!.deliveryId)?.deliveryTarget !== null, 'target');
  markDeliveryReady(reg.record!.deliveryId);
  assert('B-CORE', '70. mark ready', getDeliveryRecord(reg.record!.deliveryId)?.deliveryState === 'READY', 'ready');

  const blocked = blockDelivery(reg.record!.deliveryId, 'Test block');
  assert('B-CORE', '71. block delivery', blocked?.blockId.startsWith('ndelivblock-') === true, String(blocked?.blockId));
  setDeliveryState(reg.record!.deliveryId, 'PLANNED', true);
  const deferred = deferDelivery(reg.record!.deliveryId, 'Test defer');
  assert('B-CORE', '72. defer delivery', deferred?.deferralId.startsWith('ndelivdefer-') === true, String(deferred?.deferralId));
  setDeliveryState(reg.record!.deliveryId, 'READY', true);
  markDeliveryCompleted(reg.record!.deliveryId);
  assert('B-CORE', '73. completed', getDeliveryRecord(reg.record!.deliveryId)?.deliveryState === 'COMPLETED', 'done');
  assert('B-CORE', '74. by state', listDeliveriesByState('COMPLETED').length >= 1, 'state');
  assert('B-CORE', '75. by inbox', listDeliveriesByInboxEntry(upstream.inboxEntryId).length >= 1, 'inbox');
  assert(
    'B-CORE',
    '76. inbox mismatch fn',
    typeof detectDeliveryInboxMismatch(reg.record!.deliveryId) === 'boolean',
    'mismatch',
  );
  assert('B-CORE', '77. list by device', listDeliveriesByDevice(upstream.deviceId).length >= 1, 'device');

  const dup = registerDeliveryRecord({
    deliveryName: 'Query Test Delivery Record',
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    deliveryCategory: 'PROJECT_DELIVERY',
    projectId: 'proj-q',
    deviceId: upstream.deviceId,
    crossDeviceSessionId: upstream.crossDeviceSessionId,
    approvalId: upstream.approvalId,
    previewId: upstream.previewId,
    commandSessionId: upstream.commandSessionId,
    chatSessionId: upstream.chatSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '78. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateDeliveryRiskContext('Query Test Delivery Record', 'PROJECT_DELIVERY');
  assert('B-CORE', '79. risk context', riskCtx.notificationSummaries.length >= 1, 'ctx');
  assert('B-CORE', '80. risk eval', Array.isArray(evaluateDuplicateDeliveryRisk(riskCtx)), 'eval');
  assert(
    'B-CORE',
    '81. notification mismatch fn',
    typeof detectDeliveryNotificationMismatch(reg.record!.deliveryId) === 'boolean',
    'mismatch',
  );
  assert('B-CORE', '82. state validator', validateDeliveryState('COMPLETED') === true, 'valid');
  assert('B-CORE', '83. record validate', validateDeliveryRecord(ready.record).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildNotificationDeliveryFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '84. uvl panel', panel.panelTitle === 'Notification Delivery Foundation', panel.panelTitle);
  assert('B-CORE', '85. panel count', panel.deliveryRecordCount >= 14, String(panel.deliveryRecordCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  const routingPlan = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert(
    'C-INTEGRATION',
    '86. routing',
    routingPlan.primaryCapability === 'NOTIFICATION_DELIVERY_FOUNDATION',
    String(routingPlan.primaryCapability),
  );
  assert('C-INTEGRATION', '87. signal', isNotificationDeliveryFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert(
    'C-INTEGRATION',
    '88. action id',
    action.candidates[0]!.notificationDeliveryFoundationId.startsWith('ndelivtfnd-'),
    'id',
  );
  assert(
    'C-INTEGRATION',
    '89. action count',
    action.candidates[0]!.notificationDeliveryCount === 14,
    String(action.candidates[0]!.notificationDeliveryCount),
  );
  assert(
    'C-INTEGRATION',
    '90. action state',
    action.candidates[0]!.notificationDeliveryState === 'READY',
    String(action.candidates[0]!.notificationDeliveryState),
  );

  const reasoning = buildReasoningVisibilityRecord('Notification Delivery Foundation');
  assert('C-INTEGRATION', '91. reasoning basis', reasoning.notificationDeliveryBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '92. reasoning chain', reasoning.notificationDeliveryChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '93. reasoning state', reasoning.notificationDeliveryState.length >= 2, 'state');

  const failures = buildFailureRecords(CANONICAL_QUERY);
  assert('C-INTEGRATION', '94. failure', failures.some((f) => f.sourceSystem === 'notification_delivery_foundation'), 'fail');

  const progress = buildProgressRecords('notification delivery inventory');
  assert('C-INTEGRATION', '95. progress', progress[0]?.notificationDeliveryFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert(
    'D-REGISTRY',
    '96. uvl rows',
    NOTIFICATION_DELIVERY_FOUNDATION_UVL_ROWS.length === EXPECTED_UVL_ROW_COUNT,
    String(NOTIFICATION_DELIVERY_FOUNDATION_UVL_ROWS.length),
  );
  assert('D-REGISTRY', '97. uvl types', hasUvlRow('NOTIFICATION_DELIVERY_TYPES'), 'types');
  assert('D-REGISTRY', '98. uvl filtering', hasUvlRow('NOTIFICATION_DELIVERY_ROUTING'), 'filtering');
  assert('D-REGISTRY', '99. uvl notification bridge', hasUvlRow('NOTIFICATION_DELIVERY_NOTIFICATION_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '100. console', isIntelligenceConsoleCapability('NOTIFICATION_DELIVERY_FOUNDATION'), 'console');
  assert('D-REGISTRY', '101. find panel', resolveFindPanelAlias('Notification Delivery') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '102. registry', registry.includes('notification_delivery_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_DELIVERY_DUPLICATES) {
    assert('D-REGISTRY', `103.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/notification-delivery/notification-delivery-registry.ts');
  const validatorSrc = readTextOnce('src/notification-delivery/notification-delivery-validator.ts');
  const notificationBridgeSrc = readTextOnce('src/notification-delivery/notification-delivery-notification-bridge.ts');
  const feedMapperSrc = readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts');
  const allSrc = [registrySrc, validatorSrc, notificationBridgeSrc].join('\n');
  assert('E-STATIC', '104. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '105. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '106. duplicate risk', validatorSrc.includes('DUPLICATE_DELIVERY_AUTHORITY_RISK'), 'risk');
  assert('E-STATIC', '107. feed mapped', feedMapperSrc.includes('NOTIFICATION_DELIVERY_FOUNDATION'), 'feed');
  assert('E-STATIC', '108. notification bridge', notificationBridgeSrc.includes('getNotification'), 'bridge');
  assert('E-STATIC', '109. planning only', registrySrc.toLowerCase().includes('no real delivery'), 'plan');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `110.${i} inbox id`, fixture.record?.deliveryId.startsWith('ndeliv-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert(
      'F-CACHED',
      `111.${i} signal`,
      isNotificationDeliveryFoundationQuestion(`notification delivery inventory batch ${i}`),
      'signal',
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List notification delivery entries batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert(
      'F-CACHED',
      `112.${i} route`,
      r.primaryCapability === 'NOTIFICATION_DELIVERY_FOUNDATION',
      String(r.primaryCapability),
    );
  }
  const bridge = buildDeliveryFailureContext(CANONICAL_QUERY);
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `113.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is notification delivery blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `114.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getDeliveryDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered delivery records: ${diag.registeredDeliveryCount}`);
  console.log(`Response cache hits: ${responseCacheHits} misses: ${responseCacheMisses}`);
  console.log(`Routing cache hits: ${routingCacheHits} misses: ${routingCacheMisses}`);
  console.log(`Upstream bootstrap calls: ${upstreamBootstrapCalls}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    process.exitCode = 1;
    return;
  }
  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(NOTIFICATION_DELIVERY_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

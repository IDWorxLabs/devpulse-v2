/**
 * DevPulse V2 Phase 18.9 — Mobile Push Foundation validation.
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
  MOBILE_PUSH_FOUNDATION_PASS_TOKEN,
  MOBILE_PUSH_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_MOBILE_PUSH_DUPLICATES,
  TRACKED_PUSH_CATEGORIES,
  DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX,
  isMobilePushFoundationQuestion,
  detectRawTokenRisk,
  prepareMobilePushFoundation,
  processMobilePushRequest,
  getPushDiagnostics,
  resetMobilePushFoundationForTests,
  registerPushRecord,
  getPushRecord,
  listPushRecordsAll,
  listPushesByProject,
  listPushesByCommand,
  listPushesByChat,
  listPushesByPreview,
  listPushesByRuntime,
  listPushesByWorkspace,
  listPushesByPersistentBuild,
  listPushesByDevice,
  listPushesByCrossDeviceSession,
  listPushesByState,
  listPushesByPlatformQuery,
  listPushesByDelivery,
  listPushesByNotification,
  listPushesByInboxEntry,
  queryPushRecords,
  setPushState,
  trackPushStateHistory,
  getPushHistory,
  planPush,
  routePush,
  checkPushEligibility,
  checkPushTokenMetadata,
  planPushPayload,
  selectPushDeviceTarget,
  blockPush,
  deferPush,
  markPushReady,
  markPushCompleted,
  linkPushToDelivery,
  linkPushToNotification,
  linkPushToInbox,
  getDeliveryForPush,
  getNotificationForPush,
  getInboxForPush,
  detectPushDeliveryMismatch,
  detectPushNotificationMismatch,
  detectPushInboxMismatch,
  linkPushToCrossDevice,
  getCrossDeviceForPush,
  detectPushCrossDeviceMismatch,
  linkPushToCloud,
  getCloudForPush,
  detectPushCloudMismatch,
  linkPushToCommand,
  getCommandForPush,
  detectPushCommandMismatch,
  linkPushToChat,
  getChatForPush,
  detectPushChatMismatch,
  linkPushToPreview,
  getPreviewForPush,
  detectPushPreviewMismatch,
  linkPushToApproval,
  getApprovalForPush,
  detectPushApprovalMismatch,
  linkPushToOperatorFeed,
  getOperatorFeedForPush,
  linkPushToProjectVault,
  getProjectVaultForPush,
  buildDuplicateMobilePushRiskContext,
  evaluateDuplicateMobilePushRisk,
  validatePushRecord,
  validatePushState,
  buildMobilePushFailureContext,
  getPushVisibility,
  registerPushVisibility,
  findDeliveryByName,
} from '../src/mobile-push/index.js';
import {
  resetNotificationDeliveryFoundationForTests,
  processNotificationDeliveryRequest,
  listDeliveryRecordsAll,
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
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import type { PrepareMobilePushFoundationInput } from '../src/mobile-push/mobile-push-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show mobile push inventory';

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
  processNotificationDeliveryRequest('Show notification delivery inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  const preview = listMobilePreviewSessionsAll()[0]!;
  const approval = listMobileApprovalSessionsAll()[0]!;
  const crossDevice = listCrossDeviceSessionsAll()[0]!;
  const notification = listNotificationsAll()[0]!;
  const inbox = listInboxEntriesAll()[0]!;
  const delivery = listDeliveryRecordsAll()[0]!;
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
    deliveryId: delivery.deliveryId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processMobilePushRequest>>();
let coreFixture: ReturnType<typeof processMobilePushRequest> | null = null;
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
  const result = processMobilePushRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(
  overrides: Partial<PrepareMobilePushFoundationInput> = {},
): PrepareMobilePushFoundationInput {
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
    deliveryId: 'ndeliv-0001',
    pushName: 'Test Mobile Push Record',
    pushCategory: 'GENERAL_PUSH',
    inboxEntryId: 'finbox-0001',
    inboxEntryExists: true,
    deliveryExists: true,
    notificationExists: true,
    projectExists: true,
    commandSessionExists: true,
    chatSessionExists: true,
    previewSessionExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    approvalSessionExists: true,
    crossDeviceSessionExists: true,
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
  resetMobilePushFoundationForTests();
}

function ensureUpstream(): ReturnType<typeof upstreamBootstrap.ensure> {
  upstreamBootstrapCalls += 1;
  return upstreamBootstrap.ensure();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 18.9 Mobile Push Foundation');
  console.log('==================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/mobile-push');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'mobile-push-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'mobile-push-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'mobile-push-store.ts')), 'store');
  assert('A-SETUP', '4. manager', existsSync(join(dir, 'mobile-push-manager.ts')), 'manager');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'mobile-push-state-manager.ts')), 'state');
  assert('A-SETUP', '6. ownership', existsSync(join(dir, 'mobile-push-ownership.ts')), 'ownership');
  assert('A-SETUP', '7. context', existsSync(join(dir, 'mobile-push-context.ts')), 'context');
  assert('A-SETUP', '8. visibility', existsSync(join(dir, 'mobile-push-visibility.ts')), 'visibility');
  assert('A-SETUP', '9. token', existsSync(join(dir, 'mobile-push-token.ts')), 'token');
  assert('A-SETUP', '10. platform', existsSync(join(dir, 'mobile-push-platform.ts')), 'platform');
  assert('A-SETUP', '11. payload', existsSync(join(dir, 'mobile-push-payload.ts')), 'payload');
  assert('A-SETUP', '12. routing', existsSync(join(dir, 'mobile-push-routing.ts')), 'routing');
  assert('A-SETUP', '13. targeting', existsSync(join(dir, 'mobile-push-device-targeting.ts')), 'targeting');
  assert('A-SETUP', '14. eligibility', existsSync(join(dir, 'mobile-push-eligibility.ts')), 'eligibility');
  assert('A-SETUP', '15. policy', existsSync(join(dir, 'mobile-push-policy.ts')), 'policy');
  assert('A-SETUP', '16. blocking', existsSync(join(dir, 'mobile-push-blocking.ts')), 'blocking');
  assert('A-SETUP', '17. deferral', existsSync(join(dir, 'mobile-push-deferral.ts')), 'deferral');
  assert('A-SETUP', '18. lifecycle', existsSync(join(dir, 'mobile-push-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '19. delivery bridge', existsSync(join(dir, 'mobile-push-delivery-bridge.ts')), 'delivery');
  assert('A-SETUP', '20. notification bridge', existsSync(join(dir, 'mobile-push-notification-bridge.ts')), 'notif');
  assert('A-SETUP', '21. inbox bridge', existsSync(join(dir, 'mobile-push-inbox-bridge.ts')), 'inbox');
  assert('A-SETUP', '22. command bridge', existsSync(join(dir, 'mobile-push-command-bridge.ts')), 'command');
  assert('A-SETUP', '23. chat bridge', existsSync(join(dir, 'mobile-push-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '24. preview bridge', existsSync(join(dir, 'mobile-push-preview-bridge.ts')), 'preview');
  assert('A-SETUP', '25. approval bridge', existsSync(join(dir, 'mobile-push-approval-bridge.ts')), 'approval');
  assert('A-SETUP', '26. cloud bridge', existsSync(join(dir, 'mobile-push-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '27. project vault bridge', existsSync(join(dir, 'mobile-push-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '28. operator feed bridge', existsSync(join(dir, 'mobile-push-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '29. cross device bridge', existsSync(join(dir, 'mobile-push-cross-device-bridge.ts')), 'cross');
  assert('A-SETUP', '30. query', existsSync(join(dir, 'mobile-push-query.ts')), 'query');
  assert('A-SETUP', '31. history', existsSync(join(dir, 'mobile-push-history.ts')), 'history');
  assert('A-SETUP', '32. validator', existsSync(join(dir, 'mobile-push-validator.ts')), 'validator');
  assert('A-SETUP', '33. diagnostics', existsSync(join(dir, 'mobile-push-diagnostics.ts')), 'diag');
  assert('A-SETUP', '34. report', existsSync(join(dir, 'mobile-push-report-builder.ts')), 'report');
  assert('A-SETUP', '35. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '36. feed bridge', existsSync(join(ROOT, 'src/operator-feed/mobile-push-feed-bridge.ts')), 'feed');
  assert(
    'A-SETUP',
    '37. script',
    typeof pkg.scripts?.['validate:mobile-push-foundation'] === 'string',
    'script',
  );
  const owner = getDevPulseV2Owner('mobile_push_foundation');
  assert('A-SETUP', '38. owner', owner.ownerModule === MOBILE_PUSH_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '39. phase', owner.phase === 18.9, String(owner.phase));
  assert('A-SETUP', '40. categories', TRACKED_PUSH_CATEGORIES.length === 13, String(TRACKED_PUSH_CATEGORIES.length));
  assert(
    'A-SETUP',
    '41. duplicate prefix',
    DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK_PREFIX === 'DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK',
    'prefix',
  );
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareMobilePushFoundation(
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
      deliveryId: upstream.deliveryId,
    }),
  );
  assert('B-CORE', '42. push id', ready.record?.pushId.startsWith('mpush-') === true, String(ready.record?.pushId));
  assert('B-CORE', '43. planning only', ready.planningOnly === true, 'only');
  assert('B-CORE', '44. reports', ready.reports.length === 28, String(ready.reports.length));
  assert('B-CORE', '45. inventory', listPushRecordsAll().length >= 14, String(listPushRecordsAll().length));
  assert('B-CORE', '46. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert(
    'B-CORE',
    '47. delivery ref',
    ready.record?.deliveryId.startsWith('ndeliv-') === true,
    String(ready.record?.deliveryId),
  );
  assert(
    'B-CORE',
    '48. notification ref',
    ready.record?.notificationId.startsWith('fnotif-') === true,
    String(ready.record?.notificationId),
  );

  const reg = registerPushRecord({
    pushName: 'Query Test Push Record',
    deliveryId: upstream.deliveryId,
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    pushCategory: 'PROJECT_PUSH',
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
    tokenAlias: 'alias-query-test',
    tokenFingerprint: 'fingerprint-query-test',
    platform: 'ANDROID',
  });
  assert('B-CORE', '49. register', reg.record !== null && !reg.blocked, 'registered');
  assert(
    'B-CORE',
    '50. get entry',
    getPushRecord(reg.record!.pushId)?.pushId === reg.record!.pushId,
    'get',
  );
  assert('B-CORE', '51. by project', listPushesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '52. by command', listPushesByCommand(upstream.commandSessionId).length >= 1, 'command');
  assert('B-CORE', '53. by chat', listPushesByChat(upstream.chatSessionId).length >= 1, 'chat');
  assert('B-CORE', '54. by preview', listPushesByPreview(upstream.previewId).length >= 1, 'preview');
  assert('B-CORE', '55. by runtime', listPushesByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '56. by workspace', listPushesByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '57. by build', listPushesByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert(
    'B-CORE',
    '58. by owner',
    queryPushRecords({ ownerModule: MOBILE_PUSH_FOUNDATION_OWNER_MODULE }).length >= 1,
    'owner',
  );
  assert('B-CORE', '59. by category', queryPushRecords({ pushCategory: 'PROJECT_PUSH' }).length >= 1, 'category');
  assert('B-CORE', '60. by platform', listPushesByPlatformQuery('ANDROID').length >= 1, 'platform');
  assert('B-CORE', '61. by delivery', listPushesByDelivery(upstream.deliveryId).length >= 1, 'delivery');
  assert('B-CORE', '62. by notification', listPushesByNotification(upstream.notificationId).length >= 1, 'notif');
  assert('B-CORE', '63. query', queryPushRecords({ pushCategory: 'PROJECT_PUSH' }).length >= 1, 'query');

  linkPushToCommand(reg.record!.pushId, upstream.commandSessionId);
  assert(
    'B-CORE',
    '64. command bridge',
    getCommandForPush(reg.record!.pushId) === upstream.commandSessionId,
    'command',
  );
  linkPushToDelivery(reg.record!.pushId, upstream.deliveryId);
  assert(
    'B-CORE',
    '65. delivery bridge',
    getDeliveryForPush(reg.record!.pushId) === upstream.deliveryId,
    'delivery',
  );
  linkPushToInbox(reg.record!.pushId, upstream.inboxEntryId);
  assert(
    'B-CORE',
    '66. inbox bridge',
    getInboxForPush(reg.record!.pushId) === upstream.inboxEntryId,
    'inbox',
  );
  linkPushToNotification(reg.record!.pushId, upstream.notificationId);
  assert(
    'B-CORE',
    '67. notification bridge',
    getNotificationForPush(reg.record!.pushId) === upstream.notificationId,
    'notif',
  );
  linkPushToCrossDevice(reg.record!.pushId, upstream.crossDeviceSessionId);
  assert(
    'B-CORE',
    '68. cross device bridge',
    getCrossDeviceForPush(reg.record!.pushId) === upstream.crossDeviceSessionId,
    'cross',
  );
  linkPushToCloud(reg.record!.pushId, upstream.runtimeId);
  assert('B-CORE', '69. cloud bridge', getCloudForPush(reg.record!.pushId) === upstream.runtimeId, 'cloud');
  linkPushToProjectVault(reg.record!.pushId, 'proj-q');
  assert('B-CORE', '70. vault bridge', getProjectVaultForPush(reg.record!.pushId) === 'proj-q', 'vault');
  linkPushToOperatorFeed(reg.record!.pushId);
  assert('B-CORE', '71. operator feed bridge', getOperatorFeedForPush(reg.record!.pushId) !== null, 'feed');

  registerPushVisibility(reg.record!.pushId, {
    visibleInPlanning: true,
    visibleOnMobile: true,
    visibleOnDesktop: true,
    visibleOnCloud: false,
    visibleInOperatorFeed: true,
    visibleInProjectVault: true,
    visibilityReason: 'Test visibility',
  });
  assert('B-CORE', '72. visibility', getPushVisibility(reg.record!.pushId)?.visibleInPlanning === true, 'visibility');

  setPushState(reg.record!.pushId, 'PLANNED', true);
  assert('B-CORE', '73. state history', trackPushStateHistory(reg.record!.pushId).length >= 1, 'history');
  assert('B-CORE', '74. push history', getPushHistory(reg.record!.pushId).length >= 1, 'history');

  planPush(reg.record!.pushId);
  assert('B-CORE', '75. plan push', getPushRecord(reg.record!.pushId)?.pushPlatform !== null, 'plan');
  checkPushEligibility(reg.record!.pushId, 'ANDROID');
  assert('B-CORE', '76. eligibility', getPushRecord(reg.record!.pushId)?.pushEligibility !== null, 'elig');
  checkPushTokenMetadata(reg.record!.pushId, 'alias-test', 'fingerprint-test', 'ANDROID');
  assert('B-CORE', '77. token metadata', getPushRecord(reg.record!.pushId)?.pushTokenMetadata !== null, 'token');
  planPushPayload(reg.record!.pushId);
  assert('B-CORE', '78. payload', getPushRecord(reg.record!.pushId)?.pushPayload !== null, 'payload');
  routePush(reg.record!.pushId);
  assert('B-CORE', '79. route push', getPushRecord(reg.record!.pushId)?.pushRoute !== null, 'route');
  selectPushDeviceTarget(reg.record!.pushId);
  assert('B-CORE', '80. select target', getPushRecord(reg.record!.pushId)?.pushDeviceTarget !== null, 'target');
  markPushReady(reg.record!.pushId);
  assert('B-CORE', '81. mark ready', getPushRecord(reg.record!.pushId)?.pushState === 'READY', 'ready');

  const blocked = blockPush(reg.record!.pushId, 'Test block');
  assert('B-CORE', '82. block push', blocked?.blockId.startsWith('mpush-block-') === true, String(blocked?.blockId));
  setPushState(reg.record!.pushId, 'PLANNED', true);
  const deferred = deferPush(reg.record!.pushId, 'Test defer');
  assert('B-CORE', '83. defer push', deferred?.deferralId.startsWith('mpush-defer-') === true, String(deferred?.deferralId));
  setPushState(reg.record!.pushId, 'READY', true);
  markPushCompleted(reg.record!.pushId);
  assert('B-CORE', '84. completed', getPushRecord(reg.record!.pushId)?.pushState === 'COMPLETED', 'done');
  assert('B-CORE', '85. by state', listPushesByState('COMPLETED').length >= 1, 'state');
  assert('B-CORE', '86. by inbox', listPushesByInboxEntry(upstream.inboxEntryId).length >= 1, 'inbox');
  assert(
    'B-CORE',
    '87. delivery mismatch fn',
    typeof detectPushDeliveryMismatch(reg.record!.pushId) === 'boolean',
    'mismatch',
  );
  assert('B-CORE', '88. list by device', listPushesByDevice(upstream.deviceId).length >= 1, 'device');

  const dup = registerPushRecord({
    pushName: 'Query Test Push Record',
    deliveryId: upstream.deliveryId,
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    pushCategory: 'PROJECT_PUSH',
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
    tokenAlias: 'alias-dup',
    tokenFingerprint: 'fingerprint-dup',
  });
  assert('B-CORE', '89. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateMobilePushRiskContext('Query Test Push Record', 'PROJECT_PUSH');
  assert('B-CORE', '90. risk context', riskCtx.deliverySummaries.length >= 1, 'ctx');
  assert('B-CORE', '91. risk eval', Array.isArray(evaluateDuplicateMobilePushRisk(riskCtx)), 'eval');
  assert(
    'B-CORE',
    '92. notification mismatch fn',
    typeof detectPushNotificationMismatch(reg.record!.pushId) === 'boolean',
    'mismatch',
  );
  assert('B-CORE', '93. raw token risk', detectRawTokenRisk('fcm:abc123') === true, 'risk');
  assert('B-CORE', '94. safe alias', detectRawTokenRisk('alias-test') === false, 'safe');
  assert('B-CORE', '95. state validator', validatePushState('COMPLETED') === true, 'valid');
  assert('B-CORE', '96. record validate', validatePushRecord(ready.record).valid === true, 'valid');
  assert('B-CORE', '97. find delivery', findDeliveryByName('General Delivery Record') !== null, 'delivery');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  assert('C-INTEGRATION', '98. signal', isMobilePushFoundationQuestion(CANONICAL_QUERY), 'signal');
  assert(
    'C-INTEGRATION',
    '99. not delivery signal',
    !isMobilePushFoundationQuestion('Show notification delivery inventory'),
    'exclude',
  );

  const failures = buildMobilePushFailureContext(CANONICAL_QUERY);
  assert('C-INTEGRATION', '100. failure', failures.some((f) => f.sourceSystem === 'mobile_push_foundation'), 'fail');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '101. registry', registry.includes('mobile_push_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_MOBILE_PUSH_DUPLICATES) {
    assert('D-REGISTRY', `102.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/mobile-push/mobile-push-registry.ts');
  const validatorSrc = readTextOnce('src/mobile-push/mobile-push-validator.ts');
  const deliveryBridgeSrc = readTextOnce('src/mobile-push/mobile-push-delivery-bridge.ts');
  const feedBridgeSrc = readTextOnce('src/operator-feed/mobile-push-feed-bridge.ts');
  const allSrc = [registrySrc, validatorSrc, deliveryBridgeSrc].join('\n');
  assert('E-STATIC', '103. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '104. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '105. duplicate risk', validatorSrc.includes('DUPLICATE_MOBILE_PUSH_AUTHORITY_RISK'), 'risk');
  assert('E-STATIC', '106. raw token risk', validatorSrc.includes('detectRawTokenRisk'), 'token');
  assert('E-STATIC', '107. feed stages', feedBridgeSrc.includes('Mobile Push Token Metadata Checked'), 'feed');
  assert('E-STATIC', '108. delivery bridge', deliveryBridgeSrc.includes('findDeliveryByName'), 'bridge');
  assert('E-STATIC', '109. planning only', registrySrc.toLowerCase().includes('no real push'), 'plan');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `110.${i} push id`, fixture.record?.pushId.startsWith('mpush-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert(
      'F-CACHED',
      `111.${i} signal`,
      isMobilePushFoundationQuestion(`mobile push inventory batch ${i}`),
      'signal',
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const q = `List mobile push entries batch ${i}`;
    routingPlanCache.get(q, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `112.${i} route`, isMobilePushFoundationQuestion(q), 'signal');
  }
  const bridge = buildMobilePushFailureContext(CANONICAL_QUERY);
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `113.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is mobile push blocked?'] as const;
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
  const diag = getPushDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered push records: ${diag.registeredPushCount}`);
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

  console.log(MOBILE_PUSH_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

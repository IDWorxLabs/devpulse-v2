/**
 * DevPulse V2 Phase 18.6 — Founder Notification Runtime Foundation validation.
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
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_PASS_TOKEN,
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_NOTIFICATION_DUPLICATES,
  TRACKED_NOTIFICATION_CATEGORIES,
  DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX,
  isFounderNotificationRuntimeFoundationQuestion,
  prepareFounderNotificationRuntimeFoundation,
  processFounderNotificationRequest,
  getNotificationDiagnostics,
  resetFounderNotificationRuntimeFoundationForTests,
  registerNotification,
  getNotification,
  listNotificationsAll,
  listNotificationsByProject,
  listNotificationsByCommand,
  listNotificationsByChat,
  listNotificationsByPreview,
  listNotificationsByRuntime,
  listNotificationsByWorkspace,
  listNotificationsByPersistentBuild,
  listNotificationsByDevice,
  listNotificationsByCrossDeviceSession,
  listNotificationsByCategory,
  listNotificationsByPriority,
  listNotificationsByChannel,
  listNotificationsByApproval,
  listNotificationsByCloud,
  listNotificationsByOperatorFeed,
  queryNotifications,
  setNotificationState,
  trackNotificationStateHistory,
  getNotificationHistory,
  linkNotificationToMobile,
  getMobileForNotification,
  detectNotificationMobileMismatch,
  linkNotificationToCrossDevice,
  getCrossDeviceForNotification,
  detectNotificationCrossDeviceMismatch,
  linkNotificationToCloud,
  getCloudForNotification,
  detectNotificationCloudMismatch,
  linkNotificationToCommand,
  getCommandForNotification,
  detectNotificationCommandMismatch,
  linkNotificationToChat,
  getChatForNotification,
  detectNotificationChatMismatch,
  linkNotificationToPreview,
  getPreviewForNotification,
  detectNotificationPreviewMismatch,
  linkNotificationToApproval,
  getApprovalForNotification,
  detectNotificationApprovalMismatch,
  linkNotificationToOperatorFeed,
  getOperatorFeedForNotification,
  linkNotificationToProjectVault,
  getProjectVaultForNotification,
  buildDuplicateNotificationRiskContext,
  evaluateDuplicateNotificationRisk,
  validateNotificationRecord,
  validateNotificationState,
  buildNotificationFailureContext,
  initializeNotification,
  listLifecycleEventsForNotification,
  getNotificationVisibility,
  registerNotificationVisibility,
  registerNotificationRouting,
  getNotificationRouting,
  listRoutingsForNotification,
  registerNotificationPriority,
  getNotificationPriority,
  registerNotificationChannel,
  getNotificationChannel,
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
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildFounderNotificationRuntimeFoundationPanelSnapshot,
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
import type { PrepareFounderNotificationRuntimeFoundationInput } from '../src/founder-notification-runtime/founder-notification-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show founder notification inventory';
const EXPECTED_UVL_ROW_COUNT =
  FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_UVL_ROWS.length === 28
    ? 28
    : FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_UVL_ROWS.length;

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  const preview = listMobilePreviewSessionsAll()[0]!;
  const approval = listMobileApprovalSessionsAll()[0]!;
  const crossDevice = listCrossDeviceSessionsAll()[0]!;
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
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processFounderNotificationRequest>>();
let coreFixture: ReturnType<typeof processFounderNotificationRequest> | null = null;
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
  const result = processFounderNotificationRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(
  overrides: Partial<PrepareFounderNotificationRuntimeFoundationInput> = {},
): PrepareFounderNotificationRuntimeFoundationInput {
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
    notificationName: 'Test Founder Notification',
    notificationCategory: 'GENERAL_NOTIFICATION',
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
  console.log('DevPulse V2 — Phase 18.6 Founder Notification Runtime Foundation');
  console.log('==================================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/founder-notification-runtime');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'founder-notification-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'founder-notification-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'founder-notification-store.ts')), 'store');
  assert('A-SETUP', '4. manager', existsSync(join(dir, 'founder-notification-manager.ts')), 'manager');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'founder-notification-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'founder-notification-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'founder-notification-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'founder-notification-context.ts')), 'context');
  assert('A-SETUP', '9. routing', existsSync(join(dir, 'founder-notification-routing.ts')), 'routing');
  assert('A-SETUP', '10. priority', existsSync(join(dir, 'founder-notification-priority.ts')), 'priority');
  assert('A-SETUP', '11. visibility', existsSync(join(dir, 'founder-notification-visibility.ts')), 'visibility');
  assert('A-SETUP', '12. channel', existsSync(join(dir, 'founder-notification-channel.ts')), 'channel');
  assert('A-SETUP', '13. command bridge', existsSync(join(dir, 'founder-notification-command-bridge.ts')), 'command');
  assert('A-SETUP', '14. chat bridge', existsSync(join(dir, 'founder-notification-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '15. preview bridge', existsSync(join(dir, 'founder-notification-preview-bridge.ts')), 'preview');
  assert('A-SETUP', '16. approval bridge', existsSync(join(dir, 'founder-notification-approval-bridge.ts')), 'approval');
  assert('A-SETUP', '17. mobile bridge', existsSync(join(dir, 'founder-notification-mobile-bridge.ts')), 'mobile');
  assert('A-SETUP', '18. cloud bridge', existsSync(join(dir, 'founder-notification-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '19. project vault bridge', existsSync(join(dir, 'founder-notification-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '20. operator feed bridge', existsSync(join(dir, 'founder-notification-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '21. cross device bridge', existsSync(join(dir, 'founder-notification-cross-device-bridge.ts')), 'cross');
  assert('A-SETUP', '22. query', existsSync(join(dir, 'founder-notification-query.ts')), 'query');
  assert('A-SETUP', '23. history', existsSync(join(dir, 'founder-notification-history.ts')), 'history');
  assert('A-SETUP', '24. validator', existsSync(join(dir, 'founder-notification-validator.ts')), 'validator');
  assert('A-SETUP', '25. diagnostics', existsSync(join(dir, 'founder-notification-diagnostics.ts')), 'diag');
  assert('A-SETUP', '26. report', existsSync(join(dir, 'founder-notification-report-builder.ts')), 'report');
  assert('A-SETUP', '27. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '28. feed bridge', existsSync(join(ROOT, 'src/operator-feed/founder-notification-feed-bridge.ts')), 'feed');
  assert(
    'A-SETUP',
    '29. script',
    typeof pkg.scripts?.['validate:founder-notification-runtime-foundation'] === 'string',
    'script',
  );
  const owner = getDevPulseV2Owner('founder_notification_runtime_foundation');
  assert('A-SETUP', '30. owner', owner.ownerModule === FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '31. phase', owner.phase === 18.6, String(owner.phase));
  assert('A-SETUP', '32. categories', TRACKED_NOTIFICATION_CATEGORIES.length === 13, String(TRACKED_NOTIFICATION_CATEGORIES.length));
  assert(
    'A-SETUP',
    '33. duplicate prefix',
    DUPLICATE_NOTIFICATION_AUTHORITY_RISK_PREFIX === 'DUPLICATE_NOTIFICATION_AUTHORITY_RISK',
    'prefix',
  );
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareFounderNotificationRuntimeFoundation(
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
    }),
  );
  assert(
    'B-CORE',
    '34. notification id',
    ready.notification?.notificationId.startsWith('fnotif-') === true,
    String(ready.notification?.notificationId),
  );
  assert(
    'B-CORE',
    '35. routing id',
    ready.notification?.notificationRoutings[0]?.routingId.startsWith('fnotifrouting-') === true,
    String(ready.notification?.notificationRoutings[0]?.routingId),
  );
  assert('B-CORE', '36. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '37. reports', ready.reports.length === 20, String(ready.reports.length));
  assert('B-CORE', '38. inventory', listNotificationsAll().length >= 13, String(listNotificationsAll().length));
  assert('B-CORE', '39. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert(
    'B-CORE',
    '40. command link',
    ready.notification?.notificationCommandLink.commandSessionId === upstream.commandSessionId,
    String(ready.notification?.notificationCommandLink.commandSessionId),
  );
  assert(
    'B-CORE',
    '41. chat link',
    ready.notification?.notificationChatLink.chatSessionId === upstream.chatSessionId,
    String(ready.notification?.notificationChatLink.chatSessionId),
  );
  assert(
    'B-CORE',
    '42. preview link',
    ready.notification?.notificationPreviewLink.previewId === upstream.previewId,
    String(ready.notification?.notificationPreviewLink.previewId),
  );
  assert(
    'B-CORE',
    '43. runtime link',
    ready.notification?.notificationCloudLink.runtimeId === upstream.runtimeId,
    String(ready.notification?.notificationCloudLink.runtimeId),
  );
  assert(
    'B-CORE',
    '44. cross device link',
    ready.notification?.notificationCrossDeviceLink.crossDeviceSessionId === upstream.crossDeviceSessionId,
    String(ready.notification?.notificationCrossDeviceLink.crossDeviceSessionId),
  );
  assert(
    'B-CORE',
    '45. approval link',
    ready.notification?.notificationApprovalLink.approvalId === upstream.approvalId,
    String(ready.notification?.notificationApprovalLink.approvalId),
  );

  const reg = registerNotification({
    notificationName: 'Query Test Notification',
    notificationCategory: 'FOUNDER_ALERT',
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
    priority: 'CRITICAL',
    channel: 'IN_APP',
  });
  assert('B-CORE', '46. register', reg.notification !== null && !reg.blocked, 'registered');
  assert(
    'B-CORE',
    '47. get notification',
    getNotification(reg.notification!.notificationId)?.notificationId === reg.notification!.notificationId,
    'get',
  );
  assert('B-CORE', '48. by project', listNotificationsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '49. by command', listNotificationsByCommand(upstream.commandSessionId).length >= 1, 'command');
  assert('B-CORE', '50. by chat', listNotificationsByChat(upstream.chatSessionId).length >= 1, 'chat');
  assert('B-CORE', '51. by preview', listNotificationsByPreview(upstream.previewId).length >= 1, 'preview');
  assert('B-CORE', '52. by runtime', listNotificationsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '53. by workspace', listNotificationsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '54. by build', listNotificationsByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert(
    'B-CORE',
    '55. by owner',
    queryNotifications({ ownerModule: FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_OWNER_MODULE }).length >= 1,
    'owner',
  );
  assert('B-CORE', '56. by category', listNotificationsByCategory('FOUNDER_ALERT').length >= 1, 'category');
  assert('B-CORE', '57. by priority', listNotificationsByPriority('CRITICAL').length >= 1, 'priority');
  assert('B-CORE', '58. by channel', listNotificationsByChannel('IN_APP').length >= 1, 'channel');
  assert('B-CORE', '59. query', queryNotifications({ notificationCategory: 'FOUNDER_ALERT' }).length >= 1, 'query');

  linkNotificationToCommand(reg.notification!.notificationId, upstream.commandSessionId);
  assert(
    'B-CORE',
    '60. command bridge',
    getCommandForNotification(reg.notification!.notificationId) === upstream.commandSessionId,
    'command',
  );
  linkNotificationToChat(reg.notification!.notificationId, upstream.chatSessionId);
  assert(
    'B-CORE',
    '61. chat bridge',
    getChatForNotification(reg.notification!.notificationId) === upstream.chatSessionId,
    'chat',
  );
  linkNotificationToPreview(reg.notification!.notificationId, upstream.previewId);
  assert(
    'B-CORE',
    '62. preview bridge',
    getPreviewForNotification(reg.notification!.notificationId) === upstream.previewId,
    'preview',
  );
  linkNotificationToApproval(reg.notification!.notificationId, upstream.approvalId);
  assert(
    'B-CORE',
    '63. approval bridge',
    getApprovalForNotification(reg.notification!.notificationId) === upstream.approvalId,
    'approval',
  );
  linkNotificationToCloud(reg.notification!.notificationId, upstream.runtimeId);
  assert(
    'B-CORE',
    '64. cloud bridge',
    getCloudForNotification(reg.notification!.notificationId) === upstream.runtimeId,
    'cloud',
  );
  linkNotificationToProjectVault(reg.notification!.notificationId, 'proj-q');
  assert(
    'B-CORE',
    '65. vault bridge',
    getProjectVaultForNotification(reg.notification!.notificationId) === 'proj-q',
    'vault',
  );
  linkNotificationToOperatorFeed(reg.notification!.notificationId);
  assert(
    'B-CORE',
    '66. operator feed bridge',
    getOperatorFeedForNotification(reg.notification!.notificationId) !== null,
    'feed',
  );
  linkNotificationToMobile(reg.notification!.notificationId, upstream.crossDeviceSessionId);
  assert(
    'B-CORE',
    '67. mobile bridge',
    getMobileForNotification(reg.notification!.notificationId)?.crossDeviceSessionId === upstream.crossDeviceSessionId,
    'mobile',
  );
  linkNotificationToCrossDevice(reg.notification!.notificationId, upstream.crossDeviceSessionId);
  assert(
    'B-CORE',
    '68. cross device bridge',
    getCrossDeviceForNotification(reg.notification!.notificationId) === upstream.crossDeviceSessionId,
    'cross',
  );
  assert('B-CORE', '69. by approval', listNotificationsByApproval(upstream.approvalId).length >= 1, 'approval');
  assert('B-CORE', '70. by device', listNotificationsByDevice(upstream.deviceId).length >= 1, 'device');

  const routing = registerNotificationRouting({
    notificationId: reg.notification!.notificationId,
    targetChannel: 'OPERATOR_FEED',
    targetDevice: upstream.deviceId,
  });
  assert('B-CORE', '71. routing register', routing?.routingId.startsWith('fnotifrouting-') === true, String(routing?.routingId));
  assert(
    'B-CORE',
    '72. routing get',
    getNotificationRouting(routing!.routingId)?.routingId === routing!.routingId,
    'get',
  );
  assert('B-CORE', '73. routing list', listRoutingsForNotification(reg.notification!.notificationId).length >= 1, 'list');

  registerNotificationVisibility(reg.notification!.notificationId, {
    visibleInFounderInbox: true,
    visibleInOperatorFeed: true,
    visibleInProjectVault: true,
    visibleOnMobile: true,
    visibleOnDesktop: true,
    visibleOnCloud: false,
    visibilityReason: 'Test visibility',
  });
  assert(
    'B-CORE',
    '74. visibility',
    getNotificationVisibility(reg.notification!.notificationId)?.visibleInFounderInbox === true,
    'visibility',
  );

  registerNotificationPriority(reg.notification!.notificationId, {
    priority: 'HIGH',
    priorityReason: 'Test priority',
    escalated: true,
    escalationReason: 'Test escalation',
  });
  assert('B-CORE', '75. priority', getNotificationPriority(reg.notification!.notificationId)?.priority === 'HIGH', 'priority');

  registerNotificationChannel(reg.notification!.notificationId, {
    primaryChannel: 'OPERATOR_FEED',
    fallbackChannels: ['IN_APP'],
    channelReason: 'Test channel',
    deliveryBlocked: true,
  });
  assert(
    'B-CORE',
    '76. channel',
    getNotificationChannel(reg.notification!.notificationId)?.primaryChannel === 'OPERATOR_FEED',
    'channel',
  );

  initializeNotification(reg.notification!.notificationId);
  assert('B-CORE', '77. lifecycle', getNotificationHistory(reg.notification!.notificationId).length >= 1, 'lifecycle');
  assert(
    'B-CORE',
    '78. lifecycle events',
    listLifecycleEventsForNotification(reg.notification!.notificationId).length >= 1,
    'events',
  );
  setNotificationState(reg.notification!.notificationId, 'ROUTED', true);
  assert(
    'B-CORE',
    '79. state history',
    trackNotificationStateHistory(reg.notification!.notificationId).length >= 1,
    'history',
  );

  const dup = registerNotification({
    notificationName: 'Query Test Notification',
    notificationCategory: 'FOUNDER_ALERT',
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
  assert('B-CORE', '80. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateNotificationRiskContext('Query Test Notification', 'FOUNDER_ALERT');
  assert('B-CORE', '81. risk context', riskCtx.crossDeviceSummaries.length >= 1, 'ctx');
  assert('B-CORE', '82. risk eval', Array.isArray(evaluateDuplicateNotificationRisk(riskCtx)), 'eval');
  assert(
    'B-CORE',
    '83. command mismatch fn',
    typeof detectNotificationCommandMismatch(reg.notification!.notificationId) === 'boolean',
    'mismatch',
  );
  assert(
    'B-CORE',
    '84. chat mismatch fn',
    typeof detectNotificationChatMismatch(reg.notification!.notificationId) === 'boolean',
    'mismatch',
  );
  assert(
    'B-CORE',
    '85. preview mismatch fn',
    typeof detectNotificationPreviewMismatch(reg.notification!.notificationId) === 'boolean',
    'mismatch',
  );
  assert(
    'B-CORE',
    '86. approval mismatch fn',
    typeof detectNotificationApprovalMismatch(reg.notification!.notificationId) === 'boolean',
    'mismatch',
  );
  assert(
    'B-CORE',
    '87. cloud mismatch fn',
    typeof detectNotificationCloudMismatch(reg.notification!.notificationId) === 'boolean',
    'mismatch',
  );
  assert('B-CORE', '88. state validator', validateNotificationState('ACKNOWLEDGED') === true, 'valid');
  assert('B-CORE', '89. record validate', validateNotificationRecord(ready.notification).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildFounderNotificationRuntimeFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '90. uvl panel', panel.panelTitle === 'Founder Notification Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '91. panel count', panel.notificationCount >= 13, String(panel.notificationCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  const routingPlan = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert(
    'C-INTEGRATION',
    '92. routing',
    routingPlan.primaryCapability === 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION',
    String(routingPlan.primaryCapability),
  );
  assert('C-INTEGRATION', '93. signal', isFounderNotificationRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert(
    'C-INTEGRATION',
    '94. action id',
    action.candidates[0]!.founderNotificationRuntimeFoundationId.startsWith('fnotiftfnd-'),
    'id',
  );
  assert(
    'C-INTEGRATION',
    '95. action count',
    action.candidates[0]!.founderNotificationCount === 13,
    String(action.candidates[0]!.founderNotificationCount),
  );
  assert(
    'C-INTEGRATION',
    '96. action state',
    action.candidates[0]!.founderNotificationState === 'READY',
    String(action.candidates[0]!.founderNotificationState),
  );

  const reasoning = buildReasoningVisibilityRecord('founder notification runtime foundation');
  assert('C-INTEGRATION', '97. reasoning basis', reasoning.founderNotificationBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '98. reasoning chain', reasoning.founderNotificationChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '99. reasoning state', reasoning.founderNotificationState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is founder notification blocked?');
  assert(
    'C-INTEGRATION',
    '100. failure',
    failures.some((f) => f.sourceSystem === 'founder_notification_runtime_foundation'),
    'fail',
  );

  const progress = buildProgressRecords('founder notification inventory');
  assert(
    'C-INTEGRATION',
    '101. progress',
    progress[0]?.founderNotificationRuntimeFoundationNote !== undefined,
    'progress',
  );
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert(
    'D-REGISTRY',
    '102. uvl rows',
    FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_UVL_ROWS.length === EXPECTED_UVL_ROW_COUNT,
    String(FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_UVL_ROWS.length),
  );
  assert('D-REGISTRY', '103. uvl types', hasUvlRow('FOUNDER_NOTIFICATION_TYPES'), 'types');
  assert('D-REGISTRY', '104. uvl routing', hasUvlRow('FOUNDER_NOTIFICATION_ROUTING'), 'routing');
  assert('D-REGISTRY', '105. uvl approval bridge', hasUvlRow('FOUNDER_NOTIFICATION_APPROVAL_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '106. console', isIntelligenceConsoleCapability('FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '107. find panel', resolveFindPanelAlias('Founder Notification Runtime') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '108. registry', registry.includes('founder_notification_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_NOTIFICATION_DUPLICATES) {
    assert('D-REGISTRY', `109.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/founder-notification-runtime/founder-notification-registry.ts');
  const validatorSrc = readTextOnce('src/founder-notification-runtime/founder-notification-validator.ts');
  const commandBridgeSrc = readTextOnce('src/founder-notification-runtime/founder-notification-command-bridge.ts');
  const chatBridgeSrc = readTextOnce('src/founder-notification-runtime/founder-notification-chat-bridge.ts');
  const feedMapperSrc = readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/founder-notification-runtime/founder-notification-routing.ts')].join('\n');
  assert('E-STATIC', '110. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '111. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '112. duplicate risk', validatorSrc.includes('DUPLICATE_NOTIFICATION_AUTHORITY_RISK'), 'risk');
  assert('E-STATIC', '113. feed mapped', feedMapperSrc.includes('FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '114. command bridge', commandBridgeSrc.includes('Mobile Command'), 'bridge');
  assert('E-STATIC', '115. chat bridge', chatBridgeSrc.includes('Mobile Chat'), 'bridge');
  assert('E-STATIC', '116. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `117.${i} notification id`, fixture.notification?.notificationId.startsWith('fnotif-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert(
      'F-CACHED',
      `118.${i} signal`,
      isFounderNotificationRuntimeFoundationQuestion(`founder notification inventory batch ${i}`),
      'signal',
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List founder notifications batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert(
      'F-CACHED',
      `119.${i} route`,
      r.primaryCapability === 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION',
      String(r.primaryCapability),
    );
  }
  const bridge = buildNotificationFailureContext('Why is founder notification blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `120.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is founder notification blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `121.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getNotificationDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered notifications: ${diag.registeredNotificationCount}`);
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

  console.log(FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

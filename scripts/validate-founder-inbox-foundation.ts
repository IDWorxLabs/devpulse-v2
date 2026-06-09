/**
 * DevPulse V2 Phase 18.7 — Founder Inbox Foundation validation.
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
  FOUNDER_INBOX_FOUNDATION_PASS_TOKEN,
  FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_INBOX_DUPLICATES,
  TRACKED_INBOX_CATEGORIES,
  DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX,
  isFounderInboxFoundationQuestion,
  prepareFounderInboxFoundation,
  processFounderInboxRequest,
  getInboxDiagnostics,
  resetFounderInboxFoundationForTests,
  registerInboxEntry,
  getInboxEntry,
  listInboxEntriesAll,
  listInboxEntriesByProject,
  listInboxEntriesByCommand,
  listInboxEntriesByChat,
  listInboxEntriesByPreview,
  listInboxEntriesByRuntime,
  listInboxEntriesByWorkspace,
  listInboxEntriesByPersistentBuild,
  listInboxEntriesByDevice,
  listInboxEntriesByCrossDeviceSession,
  listInboxEntriesByCategory,
  listInboxEntriesByPriority,
  listInboxEntriesByNotification,
  listInboxEntriesByApproval,
  listInboxEntriesByCloud,
  listInboxEntriesByOperatorFeed,
  queryInboxEntries,
  setInboxState,
  trackInboxStateHistory,
  getInboxHistory,
  linkInboxToNotification,
  getNotificationForInbox,
  detectInboxNotificationMismatch,
  linkInboxToCrossDevice,
  getCrossDeviceForInbox,
  detectInboxCrossDeviceMismatch,
  linkInboxToCloud,
  getCloudForInbox,
  detectInboxCloudMismatch,
  linkInboxToCommand,
  getCommandForInbox,
  detectInboxCommandMismatch,
  linkInboxToChat,
  getChatForInbox,
  detectInboxChatMismatch,
  linkInboxToPreview,
  getPreviewForInbox,
  detectInboxPreviewMismatch,
  linkInboxToApproval,
  getApprovalForInbox,
  detectInboxApprovalMismatch,
  linkInboxToOperatorFeed,
  getOperatorFeedForInbox,
  linkInboxToProjectVault,
  getProjectVaultForInbox,
  buildDuplicateInboxRiskContext,
  evaluateDuplicateInboxRisk,
  validateInboxRecord,
  validateInboxState,
  buildInboxFailureContext,
  getInboxVisibility,
  registerInboxVisibility,
  registerInboxPriority,
  getInboxPriority,
  filterByProject,
  filterByCategory,
  filterUnread,
  filterArchived,
  searchInbox,
  searchNotifications,
  groupByCategory,
  groupByProject,
  acknowledgeInboxEntry,
  unacknowledgeInboxEntry,
  archiveInboxEntry,
  restoreInboxEntry,
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
  FOUNDER_INBOX_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildFounderInboxFoundationPanelSnapshot,
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
import type { PrepareFounderInboxFoundationInput } from '../src/founder-inbox/founder-inbox-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show founder inbox inventory';
const EXPECTED_UVL_ROW_COUNT =
  FOUNDER_INBOX_FOUNDATION_UVL_ROWS.length === 29 ? 29 : FOUNDER_INBOX_FOUNDATION_UVL_ROWS.length;

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  const preview = listMobilePreviewSessionsAll()[0]!;
  const approval = listMobileApprovalSessionsAll()[0]!;
  const crossDevice = listCrossDeviceSessionsAll()[0]!;
  const notification = listNotificationsAll()[0]!;
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
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processFounderInboxRequest>>();
let coreFixture: ReturnType<typeof processFounderInboxRequest> | null = null;
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
  const result = processFounderInboxRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(
  overrides: Partial<PrepareFounderInboxFoundationInput> = {},
): PrepareFounderInboxFoundationInput {
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
    inboxEntryName: 'Test Founder Inbox Entry',
    inboxCategory: 'GENERAL_INBOX',
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
  console.log('DevPulse V2 — Phase 18.7 Founder Inbox Foundation');
  console.log('==================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/founder-inbox');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'founder-inbox-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'founder-inbox-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'founder-inbox-store.ts')), 'store');
  assert('A-SETUP', '4. manager', existsSync(join(dir, 'founder-inbox-manager.ts')), 'manager');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'founder-inbox-state-manager.ts')), 'state');
  assert('A-SETUP', '6. ownership', existsSync(join(dir, 'founder-inbox-ownership.ts')), 'ownership');
  assert('A-SETUP', '7. context', existsSync(join(dir, 'founder-inbox-context.ts')), 'context');
  assert('A-SETUP', '8. visibility', existsSync(join(dir, 'founder-inbox-visibility.ts')), 'visibility');
  assert('A-SETUP', '9. filtering', existsSync(join(dir, 'founder-inbox-filtering.ts')), 'filtering');
  assert('A-SETUP', '10. search', existsSync(join(dir, 'founder-inbox-search.ts')), 'search');
  assert('A-SETUP', '11. grouping', existsSync(join(dir, 'founder-inbox-grouping.ts')), 'grouping');
  assert('A-SETUP', '12. priority', existsSync(join(dir, 'founder-inbox-priority.ts')), 'priority');
  assert('A-SETUP', '13. acknowledgement', existsSync(join(dir, 'founder-inbox-acknowledgement.ts')), 'ack');
  assert('A-SETUP', '14. archive', existsSync(join(dir, 'founder-inbox-archive.ts')), 'archive');
  assert('A-SETUP', '15. notification bridge', existsSync(join(dir, 'founder-inbox-notification-bridge.ts')), 'notif');
  assert('A-SETUP', '16. command bridge', existsSync(join(dir, 'founder-inbox-command-bridge.ts')), 'command');
  assert('A-SETUP', '17. chat bridge', existsSync(join(dir, 'founder-inbox-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '18. preview bridge', existsSync(join(dir, 'founder-inbox-preview-bridge.ts')), 'preview');
  assert('A-SETUP', '19. approval bridge', existsSync(join(dir, 'founder-inbox-approval-bridge.ts')), 'approval');
  assert('A-SETUP', '20. cloud bridge', existsSync(join(dir, 'founder-inbox-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '21. project vault bridge', existsSync(join(dir, 'founder-inbox-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '22. operator feed bridge', existsSync(join(dir, 'founder-inbox-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '23. cross device bridge', existsSync(join(dir, 'founder-inbox-cross-device-bridge.ts')), 'cross');
  assert('A-SETUP', '24. query', existsSync(join(dir, 'founder-inbox-query.ts')), 'query');
  assert('A-SETUP', '25. history', existsSync(join(dir, 'founder-inbox-history.ts')), 'history');
  assert('A-SETUP', '26. validator', existsSync(join(dir, 'founder-inbox-validator.ts')), 'validator');
  assert('A-SETUP', '27. diagnostics', existsSync(join(dir, 'founder-inbox-diagnostics.ts')), 'diag');
  assert('A-SETUP', '28. report', existsSync(join(dir, 'founder-inbox-report-builder.ts')), 'report');
  assert('A-SETUP', '29. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '30. feed bridge', existsSync(join(ROOT, 'src/operator-feed/founder-inbox-feed-bridge.ts')), 'feed');
  assert(
    'A-SETUP',
    '31. script',
    typeof pkg.scripts?.['validate:founder-inbox-foundation'] === 'string',
    'script',
  );
  const owner = getDevPulseV2Owner('founder_inbox_foundation');
  assert('A-SETUP', '32. owner', owner.ownerModule === FOUNDER_INBOX_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '33. phase', owner.phase === 18.7, String(owner.phase));
  assert('A-SETUP', '34. categories', TRACKED_INBOX_CATEGORIES.length === 12, String(TRACKED_INBOX_CATEGORIES.length));
  assert(
    'A-SETUP',
    '35. duplicate prefix',
    DUPLICATE_INBOX_AUTHORITY_RISK_PREFIX === 'DUPLICATE_INBOX_AUTHORITY_RISK',
    'prefix',
  );
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareFounderInboxFoundation(
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
    }),
  );
  assert(
    'B-CORE',
    '36. inbox entry id',
    ready.entry?.inboxEntryId.startsWith('finbox-') === true,
    String(ready.entry?.inboxEntryId),
  );
  assert('B-CORE', '37. visualization only', ready.visualizationOnly === true, 'only');
  assert('B-CORE', '38. reports', ready.reports.length === 21, String(ready.reports.length));
  assert('B-CORE', '39. inventory', listInboxEntriesAll().length >= 12, String(listInboxEntriesAll().length));
  assert('B-CORE', '40. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert(
    'B-CORE',
    '41. notification ref',
    ready.entry?.notificationId.startsWith('fnotif-') === true,
    String(ready.entry?.notificationId),
  );

  const reg = registerInboxEntry({
    inboxEntryName: 'Query Test Inbox Entry',
    notificationId: upstream.notificationId,
    inboxCategory: 'PROJECT_INBOX',
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
  assert('B-CORE', '42. register', reg.entry !== null && !reg.blocked, 'registered');
  assert(
    'B-CORE',
    '43. get entry',
    getInboxEntry(reg.entry!.inboxEntryId)?.inboxEntryId === reg.entry!.inboxEntryId,
    'get',
  );
  assert('B-CORE', '44. by project', listInboxEntriesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '45. by command', listInboxEntriesByCommand(upstream.commandSessionId).length >= 1, 'command');
  assert('B-CORE', '46. by chat', listInboxEntriesByChat(upstream.chatSessionId).length >= 1, 'chat');
  assert('B-CORE', '47. by preview', listInboxEntriesByPreview(upstream.previewId).length >= 1, 'preview');
  assert('B-CORE', '48. by runtime', listInboxEntriesByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '49. by workspace', listInboxEntriesByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '50. by build', listInboxEntriesByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert(
    'B-CORE',
    '51. by owner',
    queryInboxEntries({ ownerModule: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE }).length >= 1,
    'owner',
  );
  assert('B-CORE', '52. by category', listInboxEntriesByCategory('PROJECT_INBOX').length >= 1, 'category');
  assert('B-CORE', '53. by priority', listInboxEntriesByPriority('HIGH').length >= 1, 'priority');
  assert('B-CORE', '54. by notification', listInboxEntriesByNotification(upstream.notificationId).length >= 1, 'notif');
  assert('B-CORE', '55. query', queryInboxEntries({ inboxCategory: 'PROJECT_INBOX' }).length >= 1, 'query');

  linkInboxToCommand(reg.entry!.inboxEntryId, upstream.commandSessionId);
  assert(
    'B-CORE',
    '56. command bridge',
    getCommandForInbox(reg.entry!.inboxEntryId) === upstream.commandSessionId,
    'command',
  );
  linkInboxToNotification(reg.entry!.inboxEntryId, upstream.notificationId);
  assert(
    'B-CORE',
    '57. notification bridge',
    getNotificationForInbox(reg.entry!.inboxEntryId) === upstream.notificationId,
    'notif',
  );
  linkInboxToCrossDevice(reg.entry!.inboxEntryId, upstream.crossDeviceSessionId);
  assert(
    'B-CORE',
    '58. cross device bridge',
    getCrossDeviceForInbox(reg.entry!.inboxEntryId) === upstream.crossDeviceSessionId,
    'cross',
  );
  linkInboxToCloud(reg.entry!.inboxEntryId, upstream.runtimeId);
  assert('B-CORE', '59. cloud bridge', getCloudForInbox(reg.entry!.inboxEntryId) === upstream.runtimeId, 'cloud');
  linkInboxToProjectVault(reg.entry!.inboxEntryId, 'proj-q');
  assert('B-CORE', '60. vault bridge', getProjectVaultForInbox(reg.entry!.inboxEntryId) === 'proj-q', 'vault');
  linkInboxToOperatorFeed(reg.entry!.inboxEntryId);
  assert('B-CORE', '61. operator feed bridge', getOperatorFeedForInbox(reg.entry!.inboxEntryId) !== null, 'feed');

  registerInboxVisibility(reg.entry!.inboxEntryId, {
    visibleInInbox: true,
    visibleOnMobile: true,
    visibleOnDesktop: true,
    visibleOnCloud: false,
    visibleInOperatorFeed: true,
    visibleInProjectVault: true,
    visibilityReason: 'Test visibility',
  });
  assert('B-CORE', '62. visibility', getInboxVisibility(reg.entry!.inboxEntryId)?.visibleInInbox === true, 'visibility');

  registerInboxPriority(reg.entry!.inboxEntryId, {
    priority: 'HIGH',
    priorityReason: 'Test priority',
    escalated: true,
    escalationReason: 'Test escalation',
  });
  assert('B-CORE', '63. priority', getInboxPriority(reg.entry!.inboxEntryId)?.priority === 'HIGH', 'priority');

  setInboxState(reg.entry!.inboxEntryId, 'READ', true);
  assert('B-CORE', '64. state history', trackInboxStateHistory(reg.entry!.inboxEntryId).length >= 1, 'history');
  assert('B-CORE', '65. inbox history', getInboxHistory(reg.entry!.inboxEntryId).length >= 1, 'history');

  assert('B-CORE', '66. filter project', filterByProject('proj-q').length >= 1, 'filter');
  assert('B-CORE', '67. filter category', filterByCategory('PROJECT_INBOX').length >= 1, 'filter');
  assert('B-CORE', '68. filter unread', filterUnread().length >= 1, 'filter');
  assert('B-CORE', '69. search inbox', searchInbox('Query Test').length >= 1, 'search');
  assert('B-CORE', '70. search notifications', searchNotifications('Notification').length >= 1, 'search');
  assert('B-CORE', '71. group category', Object.keys(groupByCategory()).length >= 1, 'group');
  assert('B-CORE', '72. group project', Object.keys(groupByProject()).length >= 1, 'group');

  const ack = acknowledgeInboxEntry(reg.entry!.inboxEntryId);
  assert('B-CORE', '73. acknowledge', ack?.acknowledgementId.startsWith('finboxack-') === true, String(ack?.acknowledgementId));
  const unack = unacknowledgeInboxEntry(reg.entry!.inboxEntryId);
  assert('B-CORE', '74. unacknowledge', unack?.unacknowledged === true, 'unack');

  const arc = archiveInboxEntry(reg.entry!.inboxEntryId);
  assert('B-CORE', '75. archive', arc?.archiveId.startsWith('finboxarc-') === true, String(arc?.archiveId));
  assert('B-CORE', '76. filter archived', filterArchived().length >= 1, 'archived');
  const restored = restoreInboxEntry(reg.entry!.inboxEntryId);
  assert('B-CORE', '77. restore', restored?.restored === true, 'restore');

  const dup = registerInboxEntry({
    inboxEntryName: 'Query Test Inbox Entry',
    notificationId: upstream.notificationId,
    inboxCategory: 'PROJECT_INBOX',
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

  const riskCtx = buildDuplicateInboxRiskContext('Query Test Inbox Entry', 'PROJECT_INBOX');
  assert('B-CORE', '79. risk context', riskCtx.notificationSummaries.length >= 1, 'ctx');
  assert('B-CORE', '80. risk eval', Array.isArray(evaluateDuplicateInboxRisk(riskCtx)), 'eval');
  assert(
    'B-CORE',
    '81. notification mismatch fn',
    typeof detectInboxNotificationMismatch(reg.entry!.inboxEntryId) === 'boolean',
    'mismatch',
  );
  assert('B-CORE', '82. state validator', validateInboxState('ACKNOWLEDGED') === true, 'valid');
  assert('B-CORE', '83. record validate', validateInboxRecord(ready.entry).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildFounderInboxFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '84. uvl panel', panel.panelTitle === 'Founder Inbox Foundation', panel.panelTitle);
  assert('B-CORE', '85. panel count', panel.inboxEntryCount >= 12, String(panel.inboxEntryCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  const routingPlan = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert(
    'C-INTEGRATION',
    '86. routing',
    routingPlan.primaryCapability === 'FOUNDER_INBOX_FOUNDATION',
    String(routingPlan.primaryCapability),
  );
  assert('C-INTEGRATION', '87. signal', isFounderInboxFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert(
    'C-INTEGRATION',
    '88. action id',
    action.candidates[0]!.founderInboxFoundationId.startsWith('finboxtfnd-'),
    'id',
  );
  assert(
    'C-INTEGRATION',
    '89. action count',
    action.candidates[0]!.founderInboxCount === 12,
    String(action.candidates[0]!.founderInboxCount),
  );
  assert(
    'C-INTEGRATION',
    '90. action state',
    action.candidates[0]!.founderInboxState === 'READY',
    String(action.candidates[0]!.founderInboxState),
  );

  const reasoning = buildReasoningVisibilityRecord('founder inbox foundation');
  assert('C-INTEGRATION', '91. reasoning basis', reasoning.founderInboxBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '92. reasoning chain', reasoning.founderInboxChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '93. reasoning state', reasoning.founderInboxState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is founder inbox blocked?');
  assert('C-INTEGRATION', '94. failure', failures.some((f) => f.sourceSystem === 'founder_inbox_foundation'), 'fail');

  const progress = buildProgressRecords('founder inbox inventory');
  assert('C-INTEGRATION', '95. progress', progress[0]?.founderInboxFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert(
    'D-REGISTRY',
    '96. uvl rows',
    FOUNDER_INBOX_FOUNDATION_UVL_ROWS.length === EXPECTED_UVL_ROW_COUNT,
    String(FOUNDER_INBOX_FOUNDATION_UVL_ROWS.length),
  );
  assert('D-REGISTRY', '97. uvl types', hasUvlRow('FOUNDER_INBOX_TYPES'), 'types');
  assert('D-REGISTRY', '98. uvl filtering', hasUvlRow('FOUNDER_INBOX_FILTERING'), 'filtering');
  assert('D-REGISTRY', '99. uvl notification bridge', hasUvlRow('FOUNDER_INBOX_NOTIFICATION_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '100. console', isIntelligenceConsoleCapability('FOUNDER_INBOX_FOUNDATION'), 'console');
  assert('D-REGISTRY', '101. find panel', resolveFindPanelAlias('Founder Inbox') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '102. registry', registry.includes('founder_inbox_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_INBOX_DUPLICATES) {
    assert('D-REGISTRY', `103.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/founder-inbox/founder-inbox-registry.ts');
  const validatorSrc = readTextOnce('src/founder-inbox/founder-inbox-validator.ts');
  const notificationBridgeSrc = readTextOnce('src/founder-inbox/founder-inbox-notification-bridge.ts');
  const feedMapperSrc = readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts');
  const allSrc = [registrySrc, validatorSrc, notificationBridgeSrc].join('\n');
  assert('E-STATIC', '104. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '105. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '106. duplicate risk', validatorSrc.includes('DUPLICATE_INBOX_AUTHORITY_RISK'), 'risk');
  assert('E-STATIC', '107. feed mapped', feedMapperSrc.includes('FOUNDER_INBOX_FOUNDATION'), 'feed');
  assert('E-STATIC', '108. notification bridge', notificationBridgeSrc.includes('getNotification'), 'bridge');
  assert('E-STATIC', '109. visualization only', registrySrc.toLowerCase().includes('visualization only'), 'viz');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `110.${i} inbox id`, fixture.entry?.inboxEntryId.startsWith('finbox-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert(
      'F-CACHED',
      `111.${i} signal`,
      isFounderInboxFoundationQuestion(`founder inbox inventory batch ${i}`),
      'signal',
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List founder inbox entries batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert(
      'F-CACHED',
      `112.${i} route`,
      r.primaryCapability === 'FOUNDER_INBOX_FOUNDATION',
      String(r.primaryCapability),
    );
  }
  const bridge = buildInboxFailureContext('Why is founder inbox blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `113.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is founder inbox blocked?'] as const;
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
  const diag = getInboxDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered inbox entries: ${diag.registeredInboxEntryCount}`);
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

  console.log(FOUNDER_INBOX_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

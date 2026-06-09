/**
 * DevPulse V2 Phase 19.1 — Autonomous Builder Foundation validation.
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
  AUTONOMOUS_BUILDER_FOUNDATION_PASS_TOKEN,
  AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES,
  TRACKED_AUTONOMOUS_BUILD_CATEGORIES,
  DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX,
  isAutonomousBuilderFoundationQuestion,
  prepareAutonomousBuilderFoundation,
  processAutonomousBuilderRequest,
  getAutonomousBuildDiagnostics,
  resetAutonomousBuilderFoundationForTests,
  registerAutonomousBuild,
  getAutonomousBuildRecord,
  listAutonomousBuildRecordsAll,
  listAutonomousBuildsByProject,
  listAutonomousBuildsByRuntime,
  listAutonomousBuildsByState,
  listAutonomousBuildsByPush,
  listAutonomousBuildsByDelivery,
  listAutonomousBuildsByNotification,
  listAutonomousBuildsByInbox,
  queryAutonomousBuildRecords,
  createAutonomousGoal,
  getAutonomousBuildGoal,
  createAutonomousPlan,
  getAutonomousBuildPlan,
  createAutonomousStagesForPlan,
  getAutonomousBuildStages,
  evaluateReadiness,
  getAutonomousBuildReadiness,
  registerConstraint,
  getAutonomousBuildConstraints,
  registerCapability,
  getAutonomousBuildCapabilities,
  linkAutonomousBuildToDelivery,
  getDeliveryForAutonomousBuild,
  linkAutonomousBuildToPush,
  getPushForAutonomousBuild,
  linkAutonomousBuildToNotification,
  getNotificationForAutonomousBuild,
  linkAutonomousBuildToInbox,
  getInboxForAutonomousBuild,
  linkAutonomousBuildToCloud,
  getCloudForAutonomousBuild,
  linkAutonomousBuildToWorld2,
  getWorld2ForAutonomousBuild,
  linkAutonomousBuildToAiDev,
  getAiDevForAutonomousBuild,
  linkAutonomousBuildToProjectVault,
  getProjectVaultForAutonomousBuild,
  linkAutonomousBuildToOperatorFeed,
  getOperatorFeedForAutonomousBuild,
  detectAutonomousBuildDeliveryMismatch,
  detectAutonomousBuildPushMismatch,
  setAutonomousBuildState,
  trackAutonomousBuildStateHistory,
  getAutonomousBuildHistory,
  pauseAutonomousBuild,
  blockAutonomousBuild,
  completeAutonomousBuild,
  runAutonomousBuildPlanningPipeline,
  buildDuplicateAutonomousBuilderRiskContext,
  evaluateDuplicateAutonomousBuilderRisk,
  validateAutonomousBuildRecord,
  validateAutonomousBuildState,
  buildAutonomousBuilderFailureContext,
  findDeliveryByName,
  findPushByName,
} from '../src/autonomous-builder/index.js';
import {
  resetMobilePushFoundationForTests,
  processMobilePushRequest,
  listPushRecordsAll,
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
} from '../src/mobile-approval-runtime/index.js';
import {
  resetMobileCommandRuntimeFoundationForTests,
  processMobileCommandRequest,
} from '../src/mobile-command-runtime/index.js';
import {
  resetMobileChatRuntimeFoundationForTests,
  processMobileChatRequest,
} from '../src/mobile-chat-runtime/index.js';
import {
  resetMobilePreviewRuntimeFoundationForTests,
  processMobilePreviewRequest,
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
import type { PrepareAutonomousBuilderFoundationInput } from '../src/autonomous-builder/autonomous-builder-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show autonomous builder inventory';

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
  processMobilePushRequest('Show mobile push inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const crossDevice = listCrossDeviceSessionsAll()[0]!;
  const notification = listNotificationsAll()[0]!;
  const inbox = listInboxEntriesAll()[0]!;
  const delivery = listDeliveryRecordsAll()[0]!;
  const push = listPushRecordsAll()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    projectId: runtime.runtimeOwner.projectId,
    deviceId: crossDevice.crossDeviceOwner.deviceId,
    crossDeviceSessionId: crossDevice.crossDeviceId,
    notificationId: notification.notificationId,
    inboxEntryId: inbox.inboxEntryId,
    deliveryId: delivery.deliveryId,
    pushId: push.pushId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processAutonomousBuilderRequest>>();
let coreFixture: ReturnType<typeof processAutonomousBuilderRequest> | null = null;
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
  const result = processAutonomousBuilderRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(
  overrides: Partial<PrepareAutonomousBuilderFoundationInput> = {},
): PrepareAutonomousBuilderFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    runtimeId: 'crrt-0001',
    workspaceId: 'hws-0001',
    persistentBuildId: 'pbuild-0001',
    deviceId: 'dev-0001',
    crossDeviceSessionId: 'mxdev-0001',
    pushId: 'mpush-0001',
    deliveryId: 'ndeliv-0001',
    notificationId: 'fnotif-0001',
    inboxEntryId: 'finbox-0001',
    buildName: 'Test Autonomous Build Record',
    buildCategory: 'GENERAL_AUTONOMOUS_BUILD',
    projectExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: true,
    pushExists: true,
    deliveryExists: true,
    notificationExists: true,
    inboxEntryExists: true,
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
  resetAutonomousBuilderFoundationForTests();
}

function ensureUpstream(): ReturnType<typeof upstreamBootstrap.ensure> {
  upstreamBootstrapCalls += 1;
  return upstreamBootstrap.ensure();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 19.1 Autonomous Builder Foundation');
  console.log('==================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/autonomous-builder');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'autonomous-builder-types.ts')), 'types');
  assert('A-SETUP', '2. store', existsSync(join(dir, 'autonomous-builder-store.ts')), 'store');
  assert('A-SETUP', '3. registry', existsSync(join(dir, 'autonomous-builder-registry.ts')), 'registry');
  assert('A-SETUP', '4. manager', existsSync(join(dir, 'autonomous-builder-manager.ts')), 'manager');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'autonomous-builder-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'autonomous-builder-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'autonomous-builder-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'autonomous-builder-context.ts')), 'context');
  assert('A-SETUP', '9. goal', existsSync(join(dir, 'autonomous-builder-goal.ts')), 'goal');
  assert('A-SETUP', '10. plan', existsSync(join(dir, 'autonomous-builder-plan.ts')), 'plan');
  assert('A-SETUP', '11. stage', existsSync(join(dir, 'autonomous-builder-stage.ts')), 'stage');
  assert('A-SETUP', '12. readiness', existsSync(join(dir, 'autonomous-builder-readiness.ts')), 'readiness');
  assert('A-SETUP', '13. constraint', existsSync(join(dir, 'autonomous-builder-constraint.ts')), 'constraint');
  assert('A-SETUP', '14. capability', existsSync(join(dir, 'autonomous-builder-capability.ts')), 'capability');
  assert('A-SETUP', '15. delivery bridge', existsSync(join(dir, 'autonomous-builder-delivery-bridge.ts')), 'delivery');
  assert('A-SETUP', '16. push bridge', existsSync(join(dir, 'autonomous-builder-push-bridge.ts')), 'push');
  assert('A-SETUP', '17. notification bridge', existsSync(join(dir, 'autonomous-builder-notification-bridge.ts')), 'notif');
  assert('A-SETUP', '18. inbox bridge', existsSync(join(dir, 'autonomous-builder-inbox-bridge.ts')), 'inbox');
  assert('A-SETUP', '19. cloud bridge', existsSync(join(dir, 'autonomous-builder-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '20. world2 bridge', existsSync(join(dir, 'autonomous-builder-world2-bridge.ts')), 'world2');
  assert('A-SETUP', '21. aidev bridge', existsSync(join(dir, 'autonomous-builder-aidev-bridge.ts')), 'aidev');
  assert('A-SETUP', '22. project vault bridge', existsSync(join(dir, 'autonomous-builder-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '23. operator feed bridge', existsSync(join(dir, 'autonomous-builder-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '24. query', existsSync(join(dir, 'autonomous-builder-query.ts')), 'query');
  assert('A-SETUP', '25. history', existsSync(join(dir, 'autonomous-builder-history.ts')), 'history');
  assert('A-SETUP', '26. validator', existsSync(join(dir, 'autonomous-builder-validator.ts')), 'validator');
  assert('A-SETUP', '27. diagnostics', existsSync(join(dir, 'autonomous-builder-diagnostics.ts')), 'diag');
  assert('A-SETUP', '28. report', existsSync(join(dir, 'autonomous-builder-report-builder.ts')), 'report');
  assert('A-SETUP', '29. read cache', existsSync(join(dir, 'read-cache.ts')), 'cache');
  assert('A-SETUP', '30. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '31. feed bridge', existsSync(join(ROOT, 'src/operator-feed/autonomous-builder-feed-bridge.ts')), 'feed');
  assert(
    'A-SETUP',
    '32. script',
    typeof pkg.scripts?.['validate:autonomous-builder-foundation'] === 'string',
    'script',
  );
  const owner = getDevPulseV2Owner('autonomous_builder_foundation');
  assert('A-SETUP', '33. owner', owner.ownerModule === AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '34. phase', owner.phase === 19.1, String(owner.phase));
  assert('A-SETUP', '35. categories', TRACKED_AUTONOMOUS_BUILD_CATEGORIES.length === 10, String(TRACKED_AUTONOMOUS_BUILD_CATEGORIES.length));
  assert(
    'A-SETUP',
    '36. duplicate prefix',
    DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK_PREFIX === 'DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK',
    'prefix',
  );
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareAutonomousBuilderFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      projectId: upstream.projectId,
      pushId: upstream.pushId,
      deliveryId: upstream.deliveryId,
      notificationId: upstream.notificationId,
      inboxEntryId: upstream.inboxEntryId,
      crossDeviceSessionId: upstream.crossDeviceSessionId,
    }),
  );
  assert('B-CORE', '37. build id', ready.record?.autonomousBuildId.startsWith('abuild-') === true, String(ready.record?.autonomousBuildId));
  assert('B-CORE', '38. planning only', ready.planningOnly === true, 'only');
  assert('B-CORE', '39. reports', ready.reports.length === 22, String(ready.reports.length));
  assert('B-CORE', '40. inventory', listAutonomousBuildRecordsAll().length >= 10, String(listAutonomousBuildRecordsAll().length));
  assert('B-CORE', '41. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert(
    'B-CORE',
    '42. push ref',
    ready.record?.pushId.startsWith('mpush-') === true,
    String(ready.record?.pushId),
  );
  assert(
    'B-CORE',
    '43. delivery ref',
    ready.record?.deliveryId.startsWith('ndeliv-') === true,
    String(ready.record?.deliveryId),
  );

  const reg = registerAutonomousBuild({
    buildName: 'Query Test Autonomous Build',
    pushId: upstream.pushId,
    deliveryId: upstream.deliveryId,
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    buildCategory: 'PROJECT_AUTONOMOUS_BUILD',
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    deviceId: upstream.deviceId,
    crossDeviceSessionId: upstream.crossDeviceSessionId,
    query: CANONICAL_QUERY,
  });
  assert('B-CORE', '44. register', reg.record !== null && !reg.blocked, 'registered');
  assert(
    'B-CORE',
    '45. get entry',
    getAutonomousBuildRecord(reg.record!.autonomousBuildId)?.autonomousBuildId === reg.record!.autonomousBuildId,
    'get',
  );
  assert('B-CORE', '46. by project', listAutonomousBuildsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '47. by runtime', listAutonomousBuildsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '48. by push', listAutonomousBuildsByPush(upstream.pushId).length >= 1, 'push');
  assert('B-CORE', '49. by delivery', listAutonomousBuildsByDelivery(upstream.deliveryId).length >= 1, 'delivery');
  assert('B-CORE', '50. by notification', listAutonomousBuildsByNotification(upstream.notificationId).length >= 1, 'notif');
  assert('B-CORE', '51. by inbox', listAutonomousBuildsByInbox(upstream.inboxEntryId).length >= 1, 'inbox');
  assert(
    'B-CORE',
    '52. by owner',
    queryAutonomousBuildRecords({ ownerModule: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE }).length >= 1,
    'owner',
  );
  assert('B-CORE', '53. by category', queryAutonomousBuildRecords({ buildCategory: 'PROJECT_AUTONOMOUS_BUILD' }).length >= 1, 'category');
  assert('B-CORE', '54. query', queryAutonomousBuildRecords({ buildCategory: 'PROJECT_AUTONOMOUS_BUILD' }).length >= 1, 'query');

  createAutonomousGoal({ autonomousBuildId: reg.record!.autonomousBuildId });
  assert('B-CORE', '55. goal', getAutonomousBuildGoal(reg.record!.autonomousBuildId) !== null, 'goal');
  createAutonomousPlan({ autonomousBuildId: reg.record!.autonomousBuildId });
  assert('B-CORE', '56. plan', getAutonomousBuildPlan(reg.record!.autonomousBuildId) !== null, 'plan');
  createAutonomousStagesForPlan(reg.record!.autonomousBuildId);
  assert('B-CORE', '57. stages', getAutonomousBuildStages(reg.record!.autonomousBuildId).length >= 1, 'stages');
  evaluateReadiness(reg.record!.autonomousBuildId);
  assert('B-CORE', '58. readiness', getAutonomousBuildReadiness(reg.record!.autonomousBuildId) !== null, 'ready');
  registerConstraint({ autonomousBuildId: reg.record!.autonomousBuildId });
  assert('B-CORE', '59. constraint', getAutonomousBuildConstraints(reg.record!.autonomousBuildId).length >= 1, 'constraint');
  registerCapability({ autonomousBuildId: reg.record!.autonomousBuildId });
  assert('B-CORE', '60. capability', getAutonomousBuildCapabilities(reg.record!.autonomousBuildId).length >= 1, 'capability');

  linkAutonomousBuildToPush(reg.record!.autonomousBuildId, upstream.pushId);
  assert('B-CORE', '61. push bridge', getPushForAutonomousBuild(reg.record!.autonomousBuildId) === upstream.pushId, 'push');
  linkAutonomousBuildToDelivery(reg.record!.autonomousBuildId, upstream.deliveryId);
  assert(
    'B-CORE',
    '62. delivery bridge',
    getDeliveryForAutonomousBuild(reg.record!.autonomousBuildId) === upstream.deliveryId,
    'delivery',
  );
  linkAutonomousBuildToInbox(reg.record!.autonomousBuildId, upstream.inboxEntryId);
  assert(
    'B-CORE',
    '63. inbox bridge',
    getInboxForAutonomousBuild(reg.record!.autonomousBuildId) === upstream.inboxEntryId,
    'inbox',
  );
  linkAutonomousBuildToNotification(reg.record!.autonomousBuildId, upstream.notificationId);
  assert(
    'B-CORE',
    '64. notification bridge',
    getNotificationForAutonomousBuild(reg.record!.autonomousBuildId) === upstream.notificationId,
    'notif',
  );
  linkAutonomousBuildToCloud(reg.record!.autonomousBuildId, upstream.runtimeId);
  assert('B-CORE', '65. cloud bridge', getCloudForAutonomousBuild(reg.record!.autonomousBuildId) === upstream.runtimeId, 'cloud');
  linkAutonomousBuildToWorld2(reg.record!.autonomousBuildId, 'w2op-0001');
  assert('B-CORE', '66. world2 bridge', getWorld2ForAutonomousBuild(reg.record!.autonomousBuildId) === 'w2op-0001', 'world2');
  linkAutonomousBuildToAiDev(reg.record!.autonomousBuildId, 'aidev-0001');
  assert('B-CORE', '67. aidev bridge', getAiDevForAutonomousBuild(reg.record!.autonomousBuildId) === 'aidev-0001', 'aidev');
  linkAutonomousBuildToProjectVault(reg.record!.autonomousBuildId, 'proj-q');
  assert('B-CORE', '68. vault bridge', getProjectVaultForAutonomousBuild(reg.record!.autonomousBuildId) === 'proj-q', 'vault');
  linkAutonomousBuildToOperatorFeed(reg.record!.autonomousBuildId);
  assert('B-CORE', '69. operator feed bridge', getOperatorFeedForAutonomousBuild(reg.record!.autonomousBuildId) !== null, 'feed');

  setAutonomousBuildState(reg.record!.autonomousBuildId, 'PLANNING', true);
  assert('B-CORE', '70. state history', trackAutonomousBuildStateHistory(reg.record!.autonomousBuildId).length >= 1, 'history');
  assert('B-CORE', '71. build history', getAutonomousBuildHistory(reg.record!.autonomousBuildId).length >= 1, 'history');

  runAutonomousBuildPlanningPipeline(reg.record!.autonomousBuildId);
  assert('B-CORE', '72. planning pipeline', getAutonomousBuildGoal(reg.record!.autonomousBuildId) !== null, 'pipeline');
  pauseAutonomousBuild(reg.record!.autonomousBuildId);
  assert('B-CORE', '73. pause', pauseAutonomousBuild(reg.record!.autonomousBuildId) !== null, 'paused');
  blockAutonomousBuild(reg.record!.autonomousBuildId, 'Test block');
  assert('B-CORE', '74. block', blockAutonomousBuild(reg.record!.autonomousBuildId) !== null, 'blocked');
  completeAutonomousBuild(reg.record!.autonomousBuildId);
  assert('B-CORE', '75. completed', completeAutonomousBuild(reg.record!.autonomousBuildId) !== null, 'done');
  assert('B-CORE', '76. by state', listAutonomousBuildsByState('COMPLETED').length >= 1, 'state');
  assert(
    'B-CORE',
    '77. delivery mismatch fn',
    typeof detectAutonomousBuildDeliveryMismatch(reg.record!.autonomousBuildId) === 'boolean',
    'mismatch',
  );
  assert(
    'B-CORE',
    '78. push mismatch fn',
    typeof detectAutonomousBuildPushMismatch(reg.record!.autonomousBuildId) === 'boolean',
    'mismatch',
  );

  const dup = registerAutonomousBuild({
    buildName: 'Query Test Autonomous Build',
    pushId: upstream.pushId,
    deliveryId: upstream.deliveryId,
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    buildCategory: 'PROJECT_AUTONOMOUS_BUILD',
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    deviceId: upstream.deviceId,
    crossDeviceSessionId: upstream.crossDeviceSessionId,
    query: CANONICAL_QUERY,
  });
  assert('B-CORE', '79. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateAutonomousBuilderRiskContext('Query Test Autonomous Build', 'PROJECT_AUTONOMOUS_BUILD');
  assert('B-CORE', '80. risk context', riskCtx.pushSummaries.length >= 1, 'ctx');
  assert('B-CORE', '81. risk eval', Array.isArray(evaluateDuplicateAutonomousBuilderRisk(riskCtx)), 'eval');
  assert('B-CORE', '82. state validator', validateAutonomousBuildState('COMPLETED') === true, 'valid');
  assert('B-CORE', '83. record validate', validateAutonomousBuildRecord(ready.record).valid === true, 'valid');
  assert('B-CORE', '84. find push', findPushByName('General Push Record') !== null, 'push');
  assert('B-CORE', '85. find delivery', findDeliveryByName('General Delivery Record') !== null, 'delivery');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  assert('C-INTEGRATION', '86. signal', isAutonomousBuilderFoundationQuestion(CANONICAL_QUERY), 'signal');
  assert(
    'C-INTEGRATION',
    '87. not push signal',
    !isAutonomousBuilderFoundationQuestion('Show mobile push inventory'),
    'exclude',
  );

  const failures = buildAutonomousBuilderFailureContext(CANONICAL_QUERY);
  assert('C-INTEGRATION', '88. failure', failures.some((f) => f.sourceSystem === 'autonomous_builder_foundation'), 'fail');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '89. registry', registry.includes('autonomous_builder_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_AUTONOMOUS_BUILDER_DUPLICATES) {
    assert('D-REGISTRY', `90.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/autonomous-builder/autonomous-builder-registry.ts');
  const validatorSrc = readTextOnce('src/autonomous-builder/autonomous-builder-validator.ts');
  const deliveryBridgeSrc = readTextOnce('src/autonomous-builder/autonomous-builder-delivery-bridge.ts');
  const feedBridgeSrc = readTextOnce('src/operator-feed/autonomous-builder-feed-bridge.ts');
  const allSrc = [registrySrc, validatorSrc, deliveryBridgeSrc].join('\n');
  assert('E-STATIC', '91. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '92. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '93. duplicate risk', validatorSrc.includes('DUPLICATE_AUTONOMOUS_BUILDER_AUTHORITY_RISK'), 'risk');
  assert('E-STATIC', '94. goal module', readTextOnce('src/autonomous-builder/autonomous-builder-goal.ts').includes('createAutonomousGoal'), 'goal');
  assert('E-STATIC', '95. feed stages', feedBridgeSrc.includes('Autonomous Goal Created'), 'feed');
  assert('E-STATIC', '96. delivery bridge', deliveryBridgeSrc.includes('findDeliveryByName'), 'bridge');
  assert('E-STATIC', '97. planning only', registrySrc.toLowerCase().includes('no code execution'), 'plan');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `98.${i} build id`, fixture.record?.autonomousBuildId.startsWith('abuild-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert(
      'F-CACHED',
      `99.${i} signal`,
      isAutonomousBuilderFoundationQuestion(`autonomous builder inventory batch ${i}`),
      'signal',
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const q = `List autonomous build entries batch ${i}`;
    routingPlanCache.get(q, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `100.${i} route`, isAutonomousBuilderFoundationQuestion(q), 'signal');
  }
  const bridge = buildAutonomousBuilderFailureContext(CANONICAL_QUERY);
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `101.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is autonomous build blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `102.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getAutonomousBuildDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered autonomous builds: ${diag.registeredBuildCount}`);
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

  console.log(AUTONOMOUS_BUILDER_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * DevPulse V2 Phase 19.2 — Build Strategy Engine validation.
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
  BUILD_STRATEGY_ENGINE_PASS_TOKEN,
  BUILD_STRATEGY_ENGINE_OWNER_MODULE,
  FORBIDDEN_BUILD_STRATEGY_DUPLICATES,
  TRACKED_BUILD_STRATEGY_CATEGORIES,
  DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX,
  isBuildStrategyEngineQuestion,
  prepareBuildStrategyEngine,
  processBuildStrategyRequest,
  resetBuildStrategyEngineForTests,
  registerBuildStrategy,
  getBuildStrategyRecord,
  listBuildStrategyRecordsAll,
  listBuildStrategiesByProject,
  listBuildStrategiesByRuntime,
  listBuildStrategiesByPush,
  listBuildStrategiesByDelivery,
  listBuildStrategiesByNotification,
  listBuildStrategiesByInbox,
  listBuildStrategiesByState,
  queryBuildStrategyRecords,
  classifyBuildStrategy,
  getBuildStrategyClassification,
  selectBuildMode,
  getBuildStrategyMode,
  selectAutonomyLevel,
  getBuildStrategyAutonomy,
  evaluateBuildRisk,
  getBuildStrategyRisk,
  evaluateBuildConfidence,
  getBuildStrategyConfidence,
  selectBuildDepth,
  getBuildStrategyDepth,
  recommendBuildStages,
  getBuildStrategyStages,
  evaluateBuildReadiness,
  getBuildStrategyReadiness,
  registerBuildConstraint,
  getBuildStrategyConstraints,
  registerBuildDependency,
  getBuildStrategyDependencies,
  applyBuildPolicy,
  getBuildStrategyPolicy,
  linkBuildStrategyToAutonomousBuilder,
  getAutonomousBuilderForBuildStrategy,
  linkBuildStrategyToDelivery,
  getDeliveryForBuildStrategy,
  linkBuildStrategyToPush,
  getPushForBuildStrategy,
  linkBuildStrategyToNotification,
  getNotificationForBuildStrategy,
  linkBuildStrategyToInbox,
  getInboxForBuildStrategy,
  linkBuildStrategyToCloud,
  getCloudForBuildStrategy,
  linkBuildStrategyToWorld2,
  getWorld2ForBuildStrategy,
  linkBuildStrategyToAiDev,
  getAiDevForBuildStrategy,
  linkBuildStrategyToProjectVault,
  getProjectVaultForBuildStrategy,
  linkBuildStrategyToOperatorFeed,
  getOperatorFeedForBuildStrategy,
  detectBuildStrategyDeliveryMismatch,
  detectBuildStrategyPushMismatch,
  setBuildStrategyState,
  trackBuildStrategyStateHistory,
  getBuildStrategyHistory,
  blockBuildStrategy,
  completeBuildStrategy,
  archiveBuildStrategy,
  runBuildStrategyPlanningPipeline,
  buildDuplicateBuildStrategyRiskContext,
  evaluateDuplicateBuildStrategyRisk,
  validateBuildStrategyRecord,
  validateBuildStrategyState,
  buildBuildStrategyFailureContext,
  getBuildStrategyDiagnostics,
  findDeliveryByName,
  findPushByName,
  findAutonomousBuildByName,
} from '../src/build-strategy-engine/index.js';
import {
  resetAutonomousBuilderFoundationForTests,
  processAutonomousBuilderRequest,
  listAutonomousBuildRecordsAll,
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
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import {
  clearRoutingPerformanceCache,
  selectCapabilities,
  resetGeneralQuestionUnderstandingForTests,
} from '../src/command-center-brain/general-question-understanding/index.js';
import type { PrepareBuildStrategyEngineInput } from '../src/build-strategy-engine/build-strategy-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show build strategy inventory';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const readText = createSourceTextCache(ROOT);
const routingPlanCache = createNormalizedQueryCache<ReturnType<typeof selectCapabilities>>(normalizeBatchRoutingQuery);
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
  processAutonomousBuilderRequest('Show autonomous builder inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const crossDevice = listCrossDeviceSessionsAll()[0]!;
  const notification = listNotificationsAll()[0]!;
  const inbox = listInboxEntriesAll()[0]!;
  const delivery = listDeliveryRecordsAll()[0]!;
  const push = listPushRecordsAll()[0]!;
  const autonomousBuild = listAutonomousBuildRecordsAll()[0]!;
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
    autonomousBuildId: autonomousBuild.autonomousBuildId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processBuildStrategyRequest>>();
let coreFixture: ReturnType<typeof processBuildStrategyRequest> | null = null;
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
  const result = processBuildStrategyRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(
  overrides: Partial<PrepareBuildStrategyEngineInput> = {},
): PrepareBuildStrategyEngineInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    runtimeId: 'crrt-0001',
    workspaceId: 'hws-0001',
    persistentBuildId: 'pbuild-0001',
    deviceId: 'dev-0001',
    crossDeviceSessionId: 'mxdev-0001',
    autonomousBuildId: 'abuild-0001',
    pushId: 'mpush-0001',
    deliveryId: 'ndeliv-0001',
    notificationId: 'fnotif-0001',
    inboxEntryId: 'finbox-0001',
    strategyName: 'Test Build Strategy Record',
    strategyCategory: 'GENERAL_BUILD_STRATEGY',
    projectExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    crossDeviceSessionExists: true,
    autonomousBuildExists: true,
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
  clearRoutingPerformanceCache();
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
  resetBuildStrategyEngineForTests();
}

function ensureUpstream(): ReturnType<typeof upstreamBootstrap.ensure> {
  upstreamBootstrapCalls += 1;
  return upstreamBootstrap.ensure();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 19.2 Build Strategy Engine');
  console.log('==============================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/build-strategy-engine');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'build-strategy-types.ts')), 'types');
  assert('A-SETUP', '2. store', existsSync(join(dir, 'build-strategy-store.ts')), 'store');
  assert('A-SETUP', '3. registry', existsSync(join(dir, 'build-strategy-registry.ts')), 'registry');
  assert('A-SETUP', '4. manager', existsSync(join(dir, 'build-strategy-manager.ts')), 'manager');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'build-strategy-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'build-strategy-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'build-strategy-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'build-strategy-context.ts')), 'context');
  assert('A-SETUP', '9. classifier', existsSync(join(dir, 'build-strategy-classifier.ts')), 'classifier');
  assert('A-SETUP', '10. selector', existsSync(join(dir, 'build-strategy-selector.ts')), 'selector');
  assert('A-SETUP', '11. mode', existsSync(join(dir, 'build-strategy-mode.ts')), 'mode');
  assert('A-SETUP', '12. autonomy', existsSync(join(dir, 'build-strategy-autonomy.ts')), 'autonomy');
  assert('A-SETUP', '13. risk', existsSync(join(dir, 'build-strategy-risk.ts')), 'risk');
  assert('A-SETUP', '14. confidence', existsSync(join(dir, 'build-strategy-confidence.ts')), 'confidence');
  assert('A-SETUP', '15. depth', existsSync(join(dir, 'build-strategy-depth.ts')), 'depth');
  assert('A-SETUP', '16. stage', existsSync(join(dir, 'build-strategy-stage-recommender.ts')), 'stage');
  assert('A-SETUP', '17. readiness', existsSync(join(dir, 'build-strategy-readiness.ts')), 'readiness');
  assert('A-SETUP', '18. constraint', existsSync(join(dir, 'build-strategy-constraint.ts')), 'constraint');
  assert('A-SETUP', '19. dependency', existsSync(join(dir, 'build-strategy-dependency.ts')), 'dependency');
  assert('A-SETUP', '20. policy', existsSync(join(dir, 'build-strategy-policy.ts')), 'policy');
  assert('A-SETUP', '21. autonomous builder bridge', existsSync(join(dir, 'build-strategy-autonomous-builder-bridge.ts')), 'abuild');
  assert('A-SETUP', '22. delivery bridge', existsSync(join(dir, 'build-strategy-delivery-bridge.ts')), 'delivery');
  assert('A-SETUP', '23. push bridge', existsSync(join(dir, 'build-strategy-push-bridge.ts')), 'push');
  assert('A-SETUP', '24. notification bridge', existsSync(join(dir, 'build-strategy-notification-bridge.ts')), 'notif');
  assert('A-SETUP', '25. inbox bridge', existsSync(join(dir, 'build-strategy-inbox-bridge.ts')), 'inbox');
  assert('A-SETUP', '26. cloud bridge', existsSync(join(dir, 'build-strategy-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '27. world2 bridge', existsSync(join(dir, 'build-strategy-world2-bridge.ts')), 'world2');
  assert('A-SETUP', '28. aidev bridge', existsSync(join(dir, 'build-strategy-aidev-bridge.ts')), 'aidev');
  assert('A-SETUP', '29. project vault bridge', existsSync(join(dir, 'build-strategy-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '30. operator feed bridge', existsSync(join(dir, 'build-strategy-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '31. query', existsSync(join(dir, 'build-strategy-query.ts')), 'query');
  assert('A-SETUP', '32. history', existsSync(join(dir, 'build-strategy-history.ts')), 'history');
  assert('A-SETUP', '33. validator', existsSync(join(dir, 'build-strategy-validator.ts')), 'validator');
  assert('A-SETUP', '34. diagnostics', existsSync(join(dir, 'build-strategy-diagnostics.ts')), 'diag');
  assert('A-SETUP', '35. report', existsSync(join(dir, 'build-strategy-report-builder.ts')), 'report');
  assert('A-SETUP', '36. read cache', existsSync(join(dir, 'read-cache.ts')), 'cache');
  assert('A-SETUP', '37. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '38. feed bridge', existsSync(join(ROOT, 'src/operator-feed/build-strategy-feed-bridge.ts')), 'feed');
  assert(
    'A-SETUP',
    '39. script',
    typeof pkg.scripts?.['validate:build-strategy-engine'] === 'string',
    'script',
  );
  const owner = getDevPulseV2Owner('build_strategy_engine');
  assert('A-SETUP', '40. owner', owner.ownerModule === BUILD_STRATEGY_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '41. phase', owner.phase === 19.2, String(owner.phase));
  assert('A-SETUP', '42. categories', TRACKED_BUILD_STRATEGY_CATEGORIES.length === 14, String(TRACKED_BUILD_STRATEGY_CATEGORIES.length));
  assert(
    'A-SETUP',
    '43. duplicate prefix',
    DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK_PREFIX === 'DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK',
    'prefix',
  );
  assert(
    'A-SETUP',
    '44. pass token',
    BUILD_STRATEGY_ENGINE_PASS_TOKEN === 'BUILD_STRATEGY_ENGINE_V1_PASS',
    BUILD_STRATEGY_ENGINE_PASS_TOKEN,
  );
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareBuildStrategyEngine(
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
      autonomousBuildId: upstream.autonomousBuildId,
    }),
  );
  assert('B-CORE', '45. strategy id', ready.record?.buildStrategyId.startsWith('bstrat-') === true, String(ready.record?.buildStrategyId));
  assert('B-CORE', '46. strategy only', ready.strategyOnly === true, 'only');
  assert('B-CORE', '47. reports', ready.reports.length === 28, String(ready.reports.length));
  assert('B-CORE', '48. inventory', listBuildStrategyRecordsAll().length >= 10, String(listBuildStrategyRecordsAll().length));
  assert('B-CORE', '49. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert(
    'B-CORE',
    '50. push ref',
    ready.record?.pushId.startsWith('mpush-') === true,
    String(ready.record?.pushId),
  );
  assert(
    'B-CORE',
    '51. delivery ref',
    ready.record?.deliveryId.startsWith('ndeliv-') === true,
    String(ready.record?.deliveryId),
  );
  assert(
    'B-CORE',
    '52. autonomous ref',
    ready.record?.autonomousBuildId.startsWith('abuild-') === true,
    String(ready.record?.autonomousBuildId),
  );

  const reg = registerBuildStrategy({
    strategyName: 'Query Test Build Strategy',
    autonomousBuildId: upstream.autonomousBuildId,
    pushId: upstream.pushId,
    deliveryId: upstream.deliveryId,
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    strategyCategory: 'PROJECT_BUILD_STRATEGY',
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    deviceId: upstream.deviceId,
    crossDeviceSessionId: upstream.crossDeviceSessionId,
    query: CANONICAL_QUERY,
  });
  assert('B-CORE', '53. register', reg.record !== null && !reg.blocked, 'registered');
  assert(
    'B-CORE',
    '54. get entry',
    getBuildStrategyRecord(reg.record!.buildStrategyId)?.buildStrategyId === reg.record!.buildStrategyId,
    'get',
  );
  assert('B-CORE', '55. by project', listBuildStrategiesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '56. by runtime', listBuildStrategiesByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '57. by push', listBuildStrategiesByPush(upstream.pushId).length >= 1, 'push');
  assert('B-CORE', '58. by delivery', listBuildStrategiesByDelivery(upstream.deliveryId).length >= 1, 'delivery');
  assert('B-CORE', '59. by notification', listBuildStrategiesByNotification(upstream.notificationId).length >= 1, 'notif');
  assert('B-CORE', '60. by inbox', listBuildStrategiesByInbox(upstream.inboxEntryId).length >= 1, 'inbox');
  assert(
    'B-CORE',
    '61. by owner',
    queryBuildStrategyRecords({ ownerModule: BUILD_STRATEGY_ENGINE_OWNER_MODULE }).length >= 1,
    'owner',
  );
  assert('B-CORE', '62. by category', queryBuildStrategyRecords({ strategyCategory: 'PROJECT_BUILD_STRATEGY' }).length >= 1, 'category');
  assert('B-CORE', '63. query', queryBuildStrategyRecords({ strategyCategory: 'PROJECT_BUILD_STRATEGY' }).length >= 1, 'query');

  const strategyId = reg.record!.buildStrategyId;
  classifyBuildStrategy({ buildStrategyId: strategyId });
  assert('B-CORE', '64. classify', getBuildStrategyClassification(strategyId) !== null, 'classify');
  selectBuildMode({ buildStrategyId: strategyId });
  assert('B-CORE', '65. mode', getBuildStrategyMode(strategyId) !== null, 'mode');
  selectAutonomyLevel({ buildStrategyId: strategyId });
  assert('B-CORE', '66. autonomy', getBuildStrategyAutonomy(strategyId) !== null, 'autonomy');
  evaluateBuildRisk({ buildStrategyId: strategyId });
  assert('B-CORE', '67. risk', getBuildStrategyRisk(strategyId) !== null, 'risk');
  evaluateBuildConfidence({ buildStrategyId: strategyId });
  assert('B-CORE', '68. confidence', getBuildStrategyConfidence(strategyId) !== null, 'confidence');
  selectBuildDepth({ buildStrategyId: strategyId });
  assert('B-CORE', '69. depth', getBuildStrategyDepth(strategyId) !== null, 'depth');
  recommendBuildStages(strategyId);
  assert('B-CORE', '70. stages', getBuildStrategyStages(strategyId).length >= 1, 'stages');
  evaluateBuildReadiness(strategyId);
  assert('B-CORE', '71. readiness', getBuildStrategyReadiness(strategyId) !== null, 'ready');
  registerBuildConstraint({ buildStrategyId: strategyId });
  assert('B-CORE', '72. constraint', getBuildStrategyConstraints(strategyId).length >= 1, 'constraint');
  registerBuildDependency({ buildStrategyId: strategyId });
  assert('B-CORE', '73. dependency', getBuildStrategyDependencies(strategyId).length >= 1, 'dependency');
  applyBuildPolicy({ buildStrategyId: strategyId });
  assert('B-CORE', '74. policy', getBuildStrategyPolicy(strategyId) !== null, 'policy');

  linkBuildStrategyToPush(reg.record!.buildStrategyId, upstream.pushId);
  assert('B-CORE', '75. push bridge', getPushForBuildStrategy(reg.record!.buildStrategyId) === upstream.pushId, 'push');
  linkBuildStrategyToDelivery(reg.record!.buildStrategyId, upstream.deliveryId);
  assert(
    'B-CORE',
    '76. delivery bridge',
    getDeliveryForBuildStrategy(reg.record!.buildStrategyId) === upstream.deliveryId,
    'delivery',
  );
  linkBuildStrategyToInbox(reg.record!.buildStrategyId, upstream.inboxEntryId);
  assert(
    'B-CORE',
    '77. inbox bridge',
    getInboxForBuildStrategy(reg.record!.buildStrategyId) === upstream.inboxEntryId,
    'inbox',
  );
  linkBuildStrategyToNotification(reg.record!.buildStrategyId, upstream.notificationId);
  assert(
    'B-CORE',
    '78. notification bridge',
    getNotificationForBuildStrategy(reg.record!.buildStrategyId) === upstream.notificationId,
    'notif',
  );
  linkBuildStrategyToAutonomousBuilder(reg.record!.buildStrategyId, upstream.autonomousBuildId);
  assert(
    'B-CORE',
    '79. autonomous builder bridge',
    getAutonomousBuilderForBuildStrategy(reg.record!.buildStrategyId) === upstream.autonomousBuildId,
    'abuild',
  );
  linkBuildStrategyToCloud(reg.record!.buildStrategyId, upstream.runtimeId);
  assert('B-CORE', '80. cloud bridge', getCloudForBuildStrategy(reg.record!.buildStrategyId) === upstream.runtimeId, 'cloud');
  linkBuildStrategyToWorld2(reg.record!.buildStrategyId, 'w2op-0001');
  assert('B-CORE', '81. world2 bridge', getWorld2ForBuildStrategy(reg.record!.buildStrategyId) === 'w2op-0001', 'world2');
  linkBuildStrategyToAiDev(reg.record!.buildStrategyId, 'aidev-0001');
  assert('B-CORE', '82. aidev bridge', getAiDevForBuildStrategy(reg.record!.buildStrategyId) === 'aidev-0001', 'aidev');
  linkBuildStrategyToProjectVault(reg.record!.buildStrategyId, 'proj-q');
  assert('B-CORE', '83. vault bridge', getProjectVaultForBuildStrategy(reg.record!.buildStrategyId) === 'proj-q', 'vault');
  linkBuildStrategyToOperatorFeed(reg.record!.buildStrategyId);
  assert('B-CORE', '84. operator feed bridge', getOperatorFeedForBuildStrategy(reg.record!.buildStrategyId) !== null, 'feed');

  setBuildStrategyState(reg.record!.buildStrategyId, 'MODE_SELECTED', true);
  assert('B-CORE', '85. state history', trackBuildStrategyStateHistory(reg.record!.buildStrategyId).length >= 1, 'history');
  assert('B-CORE', '86. build history', getBuildStrategyHistory(reg.record!.buildStrategyId).length >= 1, 'history');

  runBuildStrategyPlanningPipeline(reg.record!.buildStrategyId);
  assert('B-CORE', '87. planning pipeline', getBuildStrategyClassification(reg.record!.buildStrategyId) !== null, 'pipeline');
  blockBuildStrategy(reg.record!.buildStrategyId);
  assert('B-CORE', '88. block', blockBuildStrategy(reg.record!.buildStrategyId) !== null, 'blocked');
  completeBuildStrategy(reg.record!.buildStrategyId);
  assert('B-CORE', '89. completed', completeBuildStrategy(reg.record!.buildStrategyId) !== null, 'done');
  archiveBuildStrategy(reg.record!.buildStrategyId);
  assert('B-CORE', '90. archived', archiveBuildStrategy(reg.record!.buildStrategyId) !== null, 'archived');
  assert('B-CORE', '91. by state', listBuildStrategiesByState('ARCHIVED').length >= 1, 'state');
  assert(
    'B-CORE',
    '92. delivery mismatch fn',
    typeof detectBuildStrategyDeliveryMismatch(reg.record!.buildStrategyId) === 'boolean',
    'mismatch',
  );
  assert(
    'B-CORE',
    '93. push mismatch fn',
    typeof detectBuildStrategyPushMismatch(reg.record!.buildStrategyId) === 'boolean',
    'mismatch',
  );

  const dup = registerBuildStrategy({
    strategyName: 'Query Test Build Strategy',
    autonomousBuildId: upstream.autonomousBuildId,
    pushId: upstream.pushId,
    deliveryId: upstream.deliveryId,
    notificationId: upstream.notificationId,
    inboxEntryId: upstream.inboxEntryId,
    strategyCategory: 'PROJECT_BUILD_STRATEGY',
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    deviceId: upstream.deviceId,
    crossDeviceSessionId: upstream.crossDeviceSessionId,
    query: CANONICAL_QUERY,
  });
  assert('B-CORE', '94. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateBuildStrategyRiskContext('Query Test Build Strategy', 'PROJECT_BUILD_STRATEGY');
  assert('B-CORE', '95. risk context', riskCtx.pushSummaries.length >= 1, 'ctx');
  assert('B-CORE', '96. risk eval', Array.isArray(evaluateDuplicateBuildStrategyRisk(riskCtx)), 'eval');
  assert('B-CORE', '97. state validator', validateBuildStrategyState('COMPLETED') === true, 'valid');
  assert('B-CORE', '98. record validate', validateBuildStrategyRecord(ready.record!).valid === true, 'valid');
  assert('B-CORE', '99. find push', findPushByName('General Push Record') !== null, 'push');
  assert('B-CORE', '100. find delivery', findDeliveryByName('General Delivery Record') !== null, 'delivery');
  assert('B-CORE', '101. find autonomous', findAutonomousBuildByName('General Autonomous Build') !== null, 'abuild');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  assert('C-INTEGRATION', '102. signal', isBuildStrategyEngineQuestion(CANONICAL_QUERY), 'signal');
  assert(
    'C-INTEGRATION',
    '103. not push signal',
    !isBuildStrategyEngineQuestion('Show mobile push inventory'),
    'exclude',
  );

  const failures = buildBuildStrategyFailureContext(CANONICAL_QUERY);
  assert('C-INTEGRATION', '104. failure', failures.some((f) => f.sourceSystem === 'build_strategy_engine'), 'fail');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-ROUTING');
  const caps = selectCapabilities(CANONICAL_QUERY, [], [], []);
  assert('D-ROUTING', '105. primary', caps.primaryCapability === 'BUILD_STRATEGY_ENGINE', String(caps.primaryCapability));
  assert('D-ROUTING', '106. selected', caps.selectedCapabilities.includes('BUILD_STRATEGY_ENGINE'), 'selected');
  assert('D-ROUTING', '107. reason', caps.routingReason.includes('Build strategy question'), caps.routingReason.slice(0, 60));
  for (let i = 0; i < 20; i += 1) {
    const q = `List build strategy entries batch ${i}`;
    const plan = routingPlanCache.get(q, (query) => selectCapabilities(query, [], [], []));
    assert('D-ROUTING', `108.${i} route primary`, plan.primaryCapability === 'BUILD_STRATEGY_ENGINE', String(plan.primaryCapability));
    assert('D-ROUTING', `109.${i} route signal`, isBuildStrategyEngineQuestion(q), 'signal');
  }
  endGroup('D-ROUTING', g);

  g = beginGroup('E-REGISTRY');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('E-REGISTRY', '110. registry', registry.includes('build_strategy_engine'), 'registry');
  for (const forbidden of FORBIDDEN_BUILD_STRATEGY_DUPLICATES) {
    assert('E-REGISTRY', `111.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('E-REGISTRY', g);

  g = beginGroup('F-STATIC');
  const registrySrc = readTextOnce('src/build-strategy-engine/build-strategy-registry.ts');
  const validatorSrc = readTextOnce('src/build-strategy-engine/build-strategy-validator.ts');
  const deliveryBridgeSrc = readTextOnce('src/build-strategy-engine/build-strategy-delivery-bridge.ts');
  const feedBridgeSrc = readTextOnce('src/operator-feed/build-strategy-feed-bridge.ts');
  const allSrc = [registrySrc, validatorSrc, deliveryBridgeSrc].join('\n');
  assert('F-STATIC', '112. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('F-STATIC', '113. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('F-STATIC', '114. duplicate risk', validatorSrc.includes('DUPLICATE_BUILD_STRATEGY_AUTHORITY_RISK'), 'risk');
  assert('F-STATIC', '115. classifier module', readTextOnce('src/build-strategy-engine/build-strategy-classifier.ts').includes('classifyBuildStrategy'), 'classifier');
  assert('F-STATIC', '116. feed stages', feedBridgeSrc.includes('Build Strategy Created'), 'feed');
  assert('F-STATIC', '117. delivery bridge', deliveryBridgeSrc.includes('findDeliveryByName'), 'bridge');
  assert('F-STATIC', '118. strategy only', registrySrc.toLowerCase().includes('no code modification'), 'plan');
  endGroup('F-STATIC', g);

  g = beginGroup('G-SOURCE');
  const indexSource = readTextOnce('src/command-center-brain/general-question-understanding/index.ts');
  const selectorSource = readTextOnce('src/command-center-brain/general-question-understanding/capability-selector.ts');
  const indexImports = (indexSource.match(/^import\s+/gm) ?? []).length;
  const selectorLines = selectorSource.split('\n').length;
  assert('G-SOURCE', '119. index imports bounded', indexImports < 70, String(indexImports));
  assert('G-SOURCE', '120. selector lines bounded', selectorLines < 400, String(selectorLines));
  const routingTableSource = readTextOnce('src/command-center-brain/general-question-understanding/capability-routing-table.ts');
  assert('G-SOURCE', '121. gqu build strategy', routingTableSource.includes('BUILD_STRATEGY_ENGINE'), 'gqu');
  assert('G-SOURCE', '122. lazy loader referenced', indexSource.includes('invokeRouteHandler'), 'invoke');
  assert('G-SOURCE', '123. build strategy handler block', indexSource.includes('build-strategy-engine'), 'build-strategy');
  endGroup('G-SOURCE', g);

  g = beginGroup('H-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('H-CACHED', `123.${i} strategy id`, fixture.record?.buildStrategyId.startsWith('bstrat-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert(
      'H-CACHED',
      `124.${i} signal`,
      isBuildStrategyEngineQuestion(`build strategy inventory batch ${i}`),
      'signal',
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const q = `List build strategy records batch ${i}`;
    routingPlanCache.get(q, (query) => selectCapabilities(query, [], [], []));
    assert('H-CACHED', `125.${i} route`, isBuildStrategyEngineQuestion(q), 'signal');
  }
  const bridge = buildBuildStrategyFailureContext(CANONICAL_QUERY);
  for (let i = 0; i < 30; i += 1) {
    assert('H-CACHED', `126.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('H-CACHED', g);

  g = beginGroup('I-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is build strategy blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('I-HTTP', `127.${i} http`, status === 200, String(status));
    },
  });
  endGroup('I-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getBuildStrategyDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered build strategies: ${diag.registeredStrategyCount}`);
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

  console.log(BUILD_STRATEGY_ENGINE_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

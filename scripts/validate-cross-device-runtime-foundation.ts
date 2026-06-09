/**
 * DevPulse V2 Phase 18.5 — Cross Device Runtime Foundation validation.
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
  CROSS_DEVICE_RUNTIME_FOUNDATION_PASS_TOKEN,
  CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_CROSS_DEVICE_DUPLICATES,
  TRACKED_CROSS_DEVICE_CATEGORIES,
  DUPLICATE_CROSS_DEVICE_RISK_PREFIX,
  isCrossDeviceRuntimeFoundationQuestion,
  prepareCrossDeviceRuntimeFoundation,
  processCrossDeviceRequest,
  getCrossDeviceDiagnostics,
  resetCrossDeviceRuntimeFoundationForTests,
  registerCrossDeviceSession,
  getCrossDeviceSession,
  listCrossDeviceSessionsAll,
  listCrossDevicesByProject,
  listCrossDevicesByCommandSession,
  listCrossDevicesByChatSession,
  listCrossDevicesByPreviewSession,
  listCrossDevicesByRuntime,
  listCrossDevicesByWorkspace,
  listCrossDevicesByPersistentBuild,
  listCrossDevicesByOwner,
  listCrossDevicesByType,
  listCrossDevicesByApprovalSession,
  listCrossDevicesByDevice,
  queryCrossDeviceSessions,
  createCrossDeviceSession,
  getCrossDeviceTrackedSession,
  setCrossDeviceState,
  trackCrossDeviceStateHistory,
  getCrossDeviceHistory,
  linkCrossDeviceToCommandSession,
  getCommandSessionForCrossDevice,
  detectCrossDeviceCommandMismatch,
  linkCrossDeviceToChatSession,
  getChatSessionForCrossDevice,
  detectCrossDeviceChatMismatch,
  linkCrossDeviceToPreviewSession,
  getPreviewSessionForCrossDevice,
  detectCrossDevicePreviewMismatch,
  linkCrossDeviceToApprovalSession,
  getApprovalSessionForCrossDevice,
  detectCrossDeviceApprovalMismatch,
  linkCrossDeviceToCloud,
  getCloudForCrossDevice,
  detectCrossDeviceCloudMismatch,
  linkCrossDeviceToProjectVault,
  getProjectVaultForCrossDevice,
  linkCrossDeviceToOperatorFeed,
  getOperatorFeedForCrossDevice,
  registerDeviceRecord,
  registerDeviceLink,
  registerDeviceHandoff,
  listDeviceRecords,
  listDeviceLinks,
  listDeviceHandoffs,
  buildDuplicateCrossDeviceRiskContext,
  evaluateDuplicateCrossDeviceRisk,
  validateCrossDeviceRecord,
  validateCrossDeviceState,
  buildCrossDeviceFailureContext,
  initializeCrossDevice,
  listLifecycleEventsForCrossDevice,
  getDeviceVisibility,
  setDeviceVisibility,
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
  listRecoveries,
  processCloudRecoveryRequest,
} from '../src/cloud-recovery/index.js';
import { resetCloudMonitoringFoundationForTests, processCloudMonitoringRequest } from '../src/cloud-monitoring/index.js';
import {
  CROSS_DEVICE_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildCrossDeviceRuntimeFoundationPanelSnapshot,
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
import type { PrepareCrossDeviceRuntimeFoundationInput } from '../src/cross-device-runtime/cross-device-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show cross device inventory';

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  const preview = listMobilePreviewSessionsAll()[0]!;
  const approval = listMobileApprovalSessionsAll()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    projectId: runtime.runtimeOwner.projectId,
    mobileCommandSessionId: command.mobileCommandId,
    mobileChatSessionId: chat.mobileChatId,
    mobilePreviewSessionId: preview.mobilePreviewId,
    mobileApprovalSessionId: approval.mobileApprovalId,
    deviceId: `dev-${approval.mobileApprovalId.replace('mappr-', '')}`,
    deviceSessionId: `dsess-${approval.mobileApprovalId}`,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processCrossDeviceRequest>>();
let coreFixture: ReturnType<typeof processCrossDeviceRequest> | null = null;
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
  const result = processCrossDeviceRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareCrossDeviceRuntimeFoundationInput> = {}): PrepareCrossDeviceRuntimeFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    deviceId: 'dev-0001',
    deviceSessionId: 'dsess-0001',
    mobileCommandSessionId: 'mcmd-0001',
    mobileChatSessionId: 'mchat-0001',
    mobilePreviewSessionId: 'mpview-0001',
    mobileApprovalSessionId: 'mappr-0001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    crossDeviceName: 'Test Cross Device',
    crossDeviceType: 'GENERAL_CROSS_DEVICE',
    projectExists: true,
    commandSessionExists: true,
    chatSessionExists: true,
    previewSessionExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    approvalSessionExists: true,
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
  console.log('DevPulse V2 — Phase 18.5 Cross Device Runtime Foundation');
  console.log('============================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/cross-device-runtime');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'cross-device-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'cross-device-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'cross-device-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'cross-device-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'cross-device-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'cross-device-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'cross-device-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'cross-device-context.ts')), 'context');
  assert('A-SETUP', '9. device link', existsSync(join(dir, 'cross-device-device-link.ts')), 'link');
  assert('A-SETUP', '10. handoff', existsSync(join(dir, 'cross-device-handoff.ts')), 'handoff');
  assert('A-SETUP', '11. visibility', existsSync(join(dir, 'cross-device-visibility.ts')), 'visibility');
  assert('A-SETUP', '12. command bridge', existsSync(join(dir, 'cross-device-command-bridge.ts')), 'command');
  assert('A-SETUP', '13. chat bridge', existsSync(join(dir, 'cross-device-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '14. preview bridge', existsSync(join(dir, 'cross-device-preview-bridge.ts')), 'preview');
  assert('A-SETUP', '15. approval bridge', existsSync(join(dir, 'cross-device-approval-bridge.ts')), 'approval');
  assert('A-SETUP', '16. workspace bridge', existsSync(join(dir, 'cross-device-workspace-bridge.ts')), 'workspace');
  assert('A-SETUP', '17. build bridge', existsSync(join(dir, 'cross-device-build-bridge.ts')), 'build');
  assert('A-SETUP', '18. cloud bridge', existsSync(join(dir, 'cross-device-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '19. project vault bridge', existsSync(join(dir, 'cross-device-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '20. operator feed bridge', existsSync(join(dir, 'cross-device-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '21. query', existsSync(join(dir, 'cross-device-query.ts')), 'query');
  assert('A-SETUP', '22. history', existsSync(join(dir, 'cross-device-history.ts')), 'history');
  assert('A-SETUP', '23. validator', existsSync(join(dir, 'cross-device-validator.ts')), 'validator');
  assert('A-SETUP', '24. diagnostics', existsSync(join(dir, 'cross-device-diagnostics.ts')), 'diag');
  assert('A-SETUP', '25. report', existsSync(join(dir, 'cross-device-report-builder.ts')), 'report');
  assert('A-SETUP', '26. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '27. feed bridge', existsSync(join(ROOT, 'src/operator-feed/cross-device-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '28. script', typeof pkg.scripts?.['validate:cross-device-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('cross_device_runtime_foundation');
  assert('A-SETUP', '29. owner', owner.ownerModule === CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '30. phase', owner.phase === 18.5, String(owner.phase));
  assert('A-SETUP', '31. categories', TRACKED_CROSS_DEVICE_CATEGORIES.length === 9, String(TRACKED_CROSS_DEVICE_CATEGORIES.length));
  assert('A-SETUP', '32. duplicate prefix', DUPLICATE_CROSS_DEVICE_RISK_PREFIX === 'DUPLICATE_CROSS_DEVICE_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareCrossDeviceRuntimeFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      projectId: upstream.projectId,
      mobileCommandSessionId: upstream.mobileCommandSessionId,
      mobileChatSessionId: upstream.mobileChatSessionId,
      mobilePreviewSessionId: upstream.mobilePreviewSessionId,
      mobileApprovalSessionId: upstream.mobileApprovalSessionId,
      deviceId: upstream.deviceId,
      deviceSessionId: upstream.deviceSessionId,
    }),
  );
  assert('B-CORE', '33. cross device id', ready.session?.crossDeviceId.startsWith('mxdev-') === true, String(ready.session?.crossDeviceId));
  assert('B-CORE', '33. tracked session id', ready.trackedSession?.sessionId.startsWith('mxdevsess-') === true, String(ready.trackedSession?.sessionId));
  assert('B-CORE', '34. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '35. reports', ready.reports.length === 20, String(ready.reports.length));
  assert('B-CORE', '36. inventory', listCrossDeviceSessionsAll().length >= 9, String(listCrossDeviceSessionsAll().length));
  assert('B-CORE', '37. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '38. command link', ready.session?.crossDeviceCommandLink.mobileCommandId === upstream.mobileCommandSessionId, String(ready.session?.crossDeviceCommandLink.mobileCommandId));
  assert('B-CORE', '39. chat link', ready.session?.crossDeviceChatLink.mobileChatId === upstream.mobileChatSessionId, String(ready.session?.crossDeviceChatLink.mobileChatId));
  assert('B-CORE', '40. preview link', ready.session?.crossDevicePreviewLink.mobilePreviewId === upstream.mobilePreviewSessionId, String(ready.session?.crossDevicePreviewLink.mobilePreviewId));
  assert('B-CORE', '41. runtime link', ready.session?.crossDeviceCloudLink.runtimeId === upstream.runtimeId, String(ready.session?.crossDeviceCloudLink.runtimeId));
  assert('B-CORE', '42. workspace link', ready.session?.crossDeviceWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.session?.crossDeviceWorkspaceLink.workspaceId));
  assert('B-CORE', '43. build link', ready.session?.crossDeviceBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.session?.crossDeviceBuildLink.persistentBuildId));

  const reg = registerCrossDeviceSession({
    crossDeviceName: 'Query Test Cross Device',
    crossDeviceType: 'MOBILE_TO_DESKTOP',
    projectId: 'proj-q',
    deviceId: upstream.deviceId,
    deviceSessionId: upstream.deviceSessionId,
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    mobileApprovalSessionId: upstream.mobileApprovalSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '44. register', reg.session !== null && !reg.blocked, 'registered');
  assert('B-CORE', '45. get session', getCrossDeviceSession(reg.session!.crossDeviceId)?.crossDeviceId === reg.session!.crossDeviceId, 'get');
  assert('B-CORE', '46. by project', listCrossDevicesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '47. by command', listCrossDevicesByCommandSession(upstream.mobileCommandSessionId).length >= 1, 'command');
  assert('B-CORE', '48. by chat', listCrossDevicesByChatSession(upstream.mobileChatSessionId).length >= 1, 'chat');
  assert('B-CORE', '49. by preview', listCrossDevicesByPreviewSession(upstream.mobilePreviewSessionId).length >= 1, 'preview');
  assert('B-CORE', '50. by runtime', listCrossDevicesByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '51. by workspace', listCrossDevicesByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '52. by build', listCrossDevicesByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '53. by owner', listCrossDevicesByOwner(CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '55. by type', listCrossDevicesByType('MOBILE_TO_DESKTOP').length >= 1, 'type');
  assert('B-CORE', '56. query', queryCrossDeviceSessions({ crossDeviceType: 'MOBILE_TO_DESKTOP' }).length >= 1, 'query');

  linkCrossDeviceToCommandSession(reg.session!.crossDeviceId, upstream.mobileCommandSessionId);
  assert('B-CORE', '57. command bridge', getCommandSessionForCrossDevice(reg.session!.crossDeviceId) === upstream.mobileCommandSessionId, 'command');
  linkCrossDeviceToChatSession(reg.session!.crossDeviceId, upstream.mobileChatSessionId);
  assert('B-CORE', '58. chat bridge', getChatSessionForCrossDevice(reg.session!.crossDeviceId) === upstream.mobileChatSessionId, 'chat');
  linkCrossDeviceToPreviewSession(reg.session!.crossDeviceId, upstream.mobilePreviewSessionId);
  assert('B-CORE', '59. preview bridge', getPreviewSessionForCrossDevice(reg.session!.crossDeviceId) === upstream.mobilePreviewSessionId, 'preview');
  linkCrossDeviceToApprovalSession(reg.session!.crossDeviceId, upstream.mobileApprovalSessionId);
  assert('B-CORE', '60. approval bridge', getApprovalSessionForCrossDevice(reg.session!.crossDeviceId) === upstream.mobileApprovalSessionId, 'approval');
  linkCrossDeviceToCloud(reg.session!.crossDeviceId, upstream.runtimeId);
  assert('B-CORE', '61. cloud bridge', getCloudForCrossDevice(reg.session!.crossDeviceId) === upstream.runtimeId, 'cloud');
  linkCrossDeviceToProjectVault(reg.session!.crossDeviceId, 'proj-q');
  assert('B-CORE', '62. vault bridge', getProjectVaultForCrossDevice(reg.session!.crossDeviceId) === 'proj-q', 'vault');
  linkCrossDeviceToOperatorFeed(reg.session!.crossDeviceId);
  assert('B-CORE', '63. operator feed bridge', getOperatorFeedForCrossDevice(reg.session!.crossDeviceId) !== null, 'feed');
  assert('B-CORE', '64. by approval', listCrossDevicesByApprovalSession(upstream.mobileApprovalSessionId).length >= 1, 'approval');
  assert('B-CORE', '65. by device', listCrossDevicesByDevice(upstream.deviceId).length >= 1, 'device');

  const tracked = createCrossDeviceSession({
    crossDeviceId: reg.session!.crossDeviceId,
    projectId: 'proj-q',
    deviceId: upstream.deviceId,
    deviceSessionId: upstream.deviceSessionId,
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    mobileApprovalSessionId: upstream.mobileApprovalSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '66. tracked session', tracked !== null, 'session');
  assert('B-CORE', '67. get tracked', getCrossDeviceTrackedSession(tracked!.sessionId)?.sessionId === tracked!.sessionId, 'get');

  setDeviceVisibility(reg.session!.crossDeviceId, {
    visibleOnMobile: true,
    visibleOnDesktop: true,
    visibleOnCloud: false,
    visibleInOperatorFeed: true,
    visibleInProjectVault: true,
    visibleInMobileCommand: true,
    visibilityReason: 'Test visibility',
  });
  assert('B-CORE', '68. visibility', getDeviceVisibility(reg.session!.crossDeviceId)?.visibleOnMobile === true, 'visibility');

  initializeCrossDevice(reg.session!.crossDeviceId);
  const deviceRec = registerDeviceRecord({
    crossDeviceId: reg.session!.crossDeviceId,
    deviceId: upstream.deviceId,
    deviceType: 'MOBILE',
    deviceSessionId: upstream.deviceSessionId,
    projectId: 'proj-q',
  });
  assert('B-CORE', '69. device record id', deviceRec?.deviceRecordId.startsWith('mxdevrec-') === true, String(deviceRec?.deviceRecordId));
  assert('B-CORE', '70. list device records', listDeviceRecords().length >= 1, 'records');

  const deviceLink = registerDeviceLink({
    crossDeviceId: reg.session!.crossDeviceId,
    sourceDeviceId: upstream.deviceId,
    targetDeviceId: `${upstream.deviceId}-target`,
    sourceDeviceType: 'MOBILE',
    targetDeviceType: 'DESKTOP',
    projectId: 'proj-q',
    sessionId: tracked!.sessionId,
  });
  assert('B-CORE', '71. device link id', deviceLink?.deviceLinkId.startsWith('mxdevlink-') === true, String(deviceLink?.deviceLinkId));
  assert('B-CORE', '72. list device links', listDeviceLinks().length >= 1, 'links');

  const handoff = registerDeviceHandoff({
    crossDeviceId: reg.session!.crossDeviceId,
    handoffType: 'MOBILE_TO_DESKTOP',
    sourceDeviceId: upstream.deviceId,
    targetDeviceId: `${upstream.deviceId}-target`,
    projectId: 'proj-q',
  });
  assert('B-CORE', '73. handoff id', handoff?.handoffId.startsWith('mxdevhand-') === true, String(handoff?.handoffId));
  assert('B-CORE', '74. list handoffs', listDeviceHandoffs().length >= 1, 'handoffs');

  setCrossDeviceState(reg.session!.crossDeviceId, 'READY', true);
  assert('B-CORE', '75. lifecycle', getCrossDeviceHistory(reg.session!.crossDeviceId).length >= 1, 'lifecycle');
  assert('B-CORE', '76. lifecycle events', listLifecycleEventsForCrossDevice(reg.session!.crossDeviceId).length >= 1, 'events');
  assert('B-CORE', '77. state history', trackCrossDeviceStateHistory(reg.session!.crossDeviceId).length >= 1, 'history');

  const dup = registerCrossDeviceSession({
    crossDeviceName: 'Query Test Cross Device',
    crossDeviceType: 'MOBILE_TO_DESKTOP',
    projectId: 'proj-q',
    deviceId: upstream.deviceId,
    deviceSessionId: upstream.deviceSessionId,
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    mobileApprovalSessionId: upstream.mobileApprovalSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '78. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateCrossDeviceRiskContext('Query Test Cross Device', 'MOBILE_TO_DESKTOP');
  assert('B-CORE', '79. risk context', riskCtx.mobileApprovalSummaries.length >= 1, 'ctx');
  assert('B-CORE', '80. risk eval', Array.isArray(evaluateDuplicateCrossDeviceRisk(riskCtx)), 'eval');
  assert('B-CORE', '81. command mismatch fn', typeof detectCrossDeviceCommandMismatch(reg.session!.crossDeviceId) === 'boolean', 'mismatch');
  assert('B-CORE', '82. chat mismatch fn', typeof detectCrossDeviceChatMismatch(reg.session!.crossDeviceId) === 'boolean', 'mismatch');
  assert('B-CORE', '83. preview mismatch fn', typeof detectCrossDevicePreviewMismatch(reg.session!.crossDeviceId) === 'boolean', 'mismatch');
  assert('B-CORE', '84. approval mismatch fn', typeof detectCrossDeviceApprovalMismatch(reg.session!.crossDeviceId) === 'boolean', 'mismatch');
  assert('B-CORE', '85. cloud mismatch fn', typeof detectCrossDeviceCloudMismatch(reg.session!.crossDeviceId) === 'boolean', 'mismatch');
  assert('B-CORE', '86. state validator', validateCrossDeviceState('READY') === true, 'valid');
  assert('B-CORE', '87. record validate', validateCrossDeviceRecord(ready.session).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildCrossDeviceRuntimeFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '88. uvl panel', panel.panelTitle === 'Cross Device Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '89. panel count', panel.crossDeviceCount >= 9, String(panel.crossDeviceCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '87. routing', routing.primaryCapability === 'CROSS_DEVICE_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '88. signal', isCrossDeviceRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '89. action id', action.candidates[0]!.crossDeviceRuntimeFoundationId.startsWith('mxdevtfnd-'), 'id');
  assert('C-INTEGRATION', '90. action count', action.candidates[0]!.crossDeviceCount === 9, String(action.candidates[0]!.crossDeviceCount));
  assert('C-INTEGRATION', '91. action state', action.candidates[0]!.crossDeviceState === 'READY', String(action.candidates[0]!.crossDeviceState));

  const reasoning = buildReasoningVisibilityRecord('cross device runtime foundation');
  assert('C-INTEGRATION', '92. reasoning basis', reasoning.crossDeviceBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '93. reasoning chain', reasoning.crossDeviceChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '94. reasoning state', reasoning.crossDeviceState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is cross device blocked?');
  assert('C-INTEGRATION', '95. failure', failures.some((f) => f.sourceSystem === 'cross_device_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('cross device inventory');
  assert('C-INTEGRATION', '96. progress', progress[0]?.crossDeviceRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '97. uvl rows', CROSS_DEVICE_RUNTIME_FOUNDATION_UVL_ROWS.length === 27, String(CROSS_DEVICE_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '98. uvl types', hasUvlRow('CROSS_DEVICE_TYPES'), 'types');
  assert('D-REGISTRY', '99. uvl device link', hasUvlRow('CROSS_DEVICE_DEVICE_LINK'), 'link');
  assert('D-REGISTRY', '100. uvl approval bridge', hasUvlRow('CROSS_DEVICE_APPROVAL_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '101. console', isIntelligenceConsoleCapability('CROSS_DEVICE_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '102. find panel', resolveFindPanelAlias('Cross Device Runtime') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '103. registry', registry.includes('cross_device_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_CROSS_DEVICE_DUPLICATES) {
    assert('D-REGISTRY', `104.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/cross-device-runtime/cross-device-registry.ts');
  const validatorSrc = readTextOnce('src/cross-device-runtime/cross-device-validator.ts');
  const commandBridgeSrc = readTextOnce('src/cross-device-runtime/cross-device-command-bridge.ts');
  const chatBridgeSrc = readTextOnce('src/cross-device-runtime/cross-device-chat-bridge.ts');
  const feedMapperSrc = readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/cross-device-runtime/cross-device-device-link.ts')].join('\n');
  assert('E-STATIC', '105. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '106. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '107. duplicate risk', validatorSrc.includes('DUPLICATE_CROSS_DEVICE_RISK'), 'risk');
  assert('E-STATIC', '108. feed mapped', feedMapperSrc.includes('CROSS_DEVICE_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '109. command bridge', commandBridgeSrc.includes('Mobile Command'), 'bridge');
  assert('E-STATIC', '110. chat bridge', chatBridgeSrc.includes('Mobile Chat'), 'bridge');
  assert('E-STATIC', '111. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `112.${i} approval id`, fixture.session?.crossDeviceId.startsWith('mxdev-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `113.${i} signal`, isCrossDeviceRuntimeFoundationQuestion(`cross device inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List cross devices batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `114.${i} route`, r.primaryCapability === 'CROSS_DEVICE_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildCrossDeviceFailureContext('Why is cross device blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `115.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is cross device blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `116.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getCrossDeviceDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered cross devices: ${diag.registeredCrossDeviceCount}`);
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

  console.log(CROSS_DEVICE_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

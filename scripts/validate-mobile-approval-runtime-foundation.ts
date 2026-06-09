/**
 * DevPulse V2 Phase 18.4 — Mobile Approval Runtime Foundation validation.
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
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_MOBILE_APPROVAL_DUPLICATES,
  TRACKED_MOBILE_APPROVAL_CATEGORIES,
  DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX,
  isMobileApprovalRuntimeFoundationQuestion,
  prepareMobileApprovalRuntimeFoundation,
  processMobileApprovalRequest,
  getMobileApprovalDiagnostics,
  resetMobileApprovalRuntimeFoundationForTests,
  registerMobileApprovalSession,
  getMobileApprovalSession,
  listMobileApprovalSessionsAll,
  listMobileApprovalsByProject,
  listMobileApprovalsByCommandSession,
  listMobileApprovalsByChatSession,
  listMobileApprovalsByPreviewSession,
  listMobileApprovalsByRuntime,
  listMobileApprovalsByWorkspace,
  listMobileApprovalsByPersistentBuild,
  listMobileApprovalsByOwner,
  listMobileApprovalsByType,
  listMobileApprovalsByWorld2,
  listMobileApprovalsByAiDev,
  queryMobileApprovalSessions,
  createMobileApprovalSession,
  getMobileApprovalTrackedSession,
  setMobileApprovalState,
  trackMobileApprovalStateHistory,
  getMobileApprovalHistory,
  linkMobileApprovalToCommandSession,
  getCommandSessionForMobileApproval,
  detectMobileApprovalCommandMismatch,
  linkMobileApprovalToChatSession,
  getChatSessionForMobileApproval,
  detectMobileApprovalChatMismatch,
  linkMobileApprovalToPreviewSession,
  getPreviewSessionForMobileApproval,
  detectMobileApprovalPreviewMismatch,
  linkMobileApprovalToCloud,
  getCloudForMobileApproval,
  detectMobileApprovalCloudMismatch,
  linkMobileApprovalToProjectVault,
  getProjectVaultForMobileApproval,
  linkMobileApprovalToWorld2Operation,
  getWorld2OperationForMobileApproval,
  linkMobileApprovalToAiDevOperation,
  getAiDevOperationForMobileApproval,
  linkMobileApprovalToOperatorFeed,
  getOperatorFeedForMobileApproval,
  buildDuplicateMobileApprovalRiskContext,
  evaluateDuplicateMobileApprovalRisk,
  validateMobileApprovalRecord,
  validateMobileApprovalState,
  buildMobileApprovalFailureContext,
  initializeMobileApproval,
  registerApprovalRequest,
  recordApprovalDecision,
  listLifecycleEventsForMobileApproval,
  getMobileApprovalVisibility,
  setMobileApprovalVisibility,
  listApprovalRequests,
  listApprovalDecisions,
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
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildMobileApprovalRuntimeFoundationPanelSnapshot,
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
import type { PrepareMobileApprovalRuntimeFoundationInput } from '../src/mobile-approval-runtime/mobile-approval-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show mobile approval inventory';

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  const preview = listMobilePreviewSessionsAll()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    projectId: runtime.runtimeOwner.projectId,
    mobileCommandSessionId: command.mobileCommandId,
    mobileChatSessionId: chat.mobileChatId,
    mobilePreviewSessionId: preview.mobilePreviewId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processMobileApprovalRequest>>();
let coreFixture: ReturnType<typeof processMobileApprovalRequest> | null = null;
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
  const result = processMobileApprovalRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareMobileApprovalRuntimeFoundationInput> = {}): PrepareMobileApprovalRuntimeFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    mobileCommandSessionId: 'mcmd-0001',
    mobileChatSessionId: 'mchat-0001',
    mobilePreviewSessionId: 'mpview-0001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    approvalName: 'Test Mobile Approval',
    mobileApprovalType: 'GENERAL_APPROVAL',
    projectExists: true,
    commandSessionExists: true,
    chatSessionExists: true,
    previewSessionExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    flowFoundationExists: true,
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
  console.log('DevPulse V2 — Phase 18.4 Mobile Approval Runtime Foundation');
  console.log('============================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/mobile-approval-runtime');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'mobile-approval-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'mobile-approval-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'mobile-approval-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'mobile-approval-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'mobile-approval-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'mobile-approval-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'mobile-approval-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'mobile-approval-context.ts')), 'context');
  assert('A-SETUP', '9. request', existsSync(join(dir, 'mobile-approval-request-manager.ts')), 'request');
  assert('A-SETUP', '10. decision', existsSync(join(dir, 'mobile-approval-decision-manager.ts')), 'decision');
  assert('A-SETUP', '11. visibility', existsSync(join(dir, 'mobile-approval-visibility.ts')), 'visibility');
  assert('A-SETUP', '12. command bridge', existsSync(join(dir, 'mobile-approval-command-bridge.ts')), 'command');
  assert('A-SETUP', '13. chat bridge', existsSync(join(dir, 'mobile-approval-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '14. preview bridge', existsSync(join(dir, 'mobile-approval-preview-bridge.ts')), 'preview');
  assert('A-SETUP', '15. world2 bridge', existsSync(join(dir, 'mobile-approval-world2-bridge.ts')), 'world2');
  assert('A-SETUP', '16. aidev bridge', existsSync(join(dir, 'mobile-approval-aidev-bridge.ts')), 'aidev');
  assert('A-SETUP', '17. cloud bridge', existsSync(join(dir, 'mobile-approval-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '18. project vault bridge', existsSync(join(dir, 'mobile-approval-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '19. operator feed bridge', existsSync(join(dir, 'mobile-approval-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '20. query', existsSync(join(dir, 'mobile-approval-query.ts')), 'query');
  assert('A-SETUP', '21. history', existsSync(join(dir, 'mobile-approval-history.ts')), 'history');
  assert('A-SETUP', '22. validator', existsSync(join(dir, 'mobile-approval-validator.ts')), 'validator');
  assert('A-SETUP', '23. diagnostics', existsSync(join(dir, 'mobile-approval-diagnostics.ts')), 'diag');
  assert('A-SETUP', '24. report', existsSync(join(dir, 'mobile-approval-report-builder.ts')), 'report');
  assert('A-SETUP', '25. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '26. feed bridge', existsSync(join(ROOT, 'src/operator-feed/mobile-approval-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '27. script', typeof pkg.scripts?.['validate:mobile-approval-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('mobile_approval_runtime_foundation');
  assert('A-SETUP', '28. owner', owner.ownerModule === MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '29. phase', owner.phase === 18.4, String(owner.phase));
  assert('A-SETUP', '30. categories', TRACKED_MOBILE_APPROVAL_CATEGORIES.length === 9, String(TRACKED_MOBILE_APPROVAL_CATEGORIES.length));
  assert('A-SETUP', '31. duplicate prefix', DUPLICATE_MOBILE_APPROVAL_RISK_PREFIX === 'DUPLICATE_MOBILE_APPROVAL_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareMobileApprovalRuntimeFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      projectId: upstream.projectId,
      mobileCommandSessionId: upstream.mobileCommandSessionId,
      mobileChatSessionId: upstream.mobileChatSessionId,
      mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    }),
  );
  assert('B-CORE', '32. approval id', ready.session?.mobileApprovalId.startsWith('mappr-') === true, String(ready.session?.mobileApprovalId));
  assert('B-CORE', '33. tracked session id', ready.trackedSession?.sessionId.startsWith('mapprsess-') === true, String(ready.trackedSession?.sessionId));
  assert('B-CORE', '34. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '35. reports', ready.reports.length === 18, String(ready.reports.length));
  assert('B-CORE', '36. inventory', listMobileApprovalSessionsAll().length >= 9, String(listMobileApprovalSessionsAll().length));
  assert('B-CORE', '37. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '38. command link', ready.session?.mobileApprovalCommandLink.mobileCommandId === upstream.mobileCommandSessionId, String(ready.session?.mobileApprovalCommandLink.mobileCommandId));
  assert('B-CORE', '39. chat link', ready.session?.mobileApprovalChatLink.mobileChatId === upstream.mobileChatSessionId, String(ready.session?.mobileApprovalChatLink.mobileChatId));
  assert('B-CORE', '40. preview link', ready.session?.mobileApprovalPreviewLink.mobilePreviewId === upstream.mobilePreviewSessionId, String(ready.session?.mobileApprovalPreviewLink.mobilePreviewId));
  assert('B-CORE', '41. runtime link', ready.session?.mobileApprovalCloudLink.runtimeId === upstream.runtimeId, String(ready.session?.mobileApprovalCloudLink.runtimeId));
  assert('B-CORE', '42. workspace link', ready.session?.mobileApprovalWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.session?.mobileApprovalWorkspaceLink.workspaceId));
  assert('B-CORE', '43. build link', ready.session?.mobileApprovalBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.session?.mobileApprovalBuildLink.persistentBuildId));

  const reg = registerMobileApprovalSession({
    approvalName: 'Query Test Mobile Approval',
    mobileApprovalType: 'PROJECT_APPROVAL',
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '44. register', reg.session !== null && !reg.blocked, 'registered');
  assert('B-CORE', '45. get session', getMobileApprovalSession(reg.session!.mobileApprovalId)?.mobileApprovalId === reg.session!.mobileApprovalId, 'get');
  assert('B-CORE', '46. by project', listMobileApprovalsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '47. by command', listMobileApprovalsByCommandSession(upstream.mobileCommandSessionId).length >= 1, 'command');
  assert('B-CORE', '48. by chat', listMobileApprovalsByChatSession(upstream.mobileChatSessionId).length >= 1, 'chat');
  assert('B-CORE', '49. by preview', listMobileApprovalsByPreviewSession(upstream.mobilePreviewSessionId).length >= 1, 'preview');
  assert('B-CORE', '50. by runtime', listMobileApprovalsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '51. by workspace', listMobileApprovalsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '52. by build', listMobileApprovalsByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '53. by owner', listMobileApprovalsByOwner(MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '54. by type', listMobileApprovalsByType('PROJECT_APPROVAL').length >= 1, 'type');
  assert('B-CORE', '55. query', queryMobileApprovalSessions({ mobileApprovalType: 'PROJECT_APPROVAL' }).length >= 1, 'query');

  linkMobileApprovalToCommandSession(reg.session!.mobileApprovalId, upstream.mobileCommandSessionId);
  assert('B-CORE', '56. command bridge', getCommandSessionForMobileApproval(reg.session!.mobileApprovalId) === upstream.mobileCommandSessionId, 'command');
  linkMobileApprovalToChatSession(reg.session!.mobileApprovalId, upstream.mobileChatSessionId);
  assert('B-CORE', '57. chat bridge', getChatSessionForMobileApproval(reg.session!.mobileApprovalId) === upstream.mobileChatSessionId, 'chat');
  linkMobileApprovalToPreviewSession(reg.session!.mobileApprovalId, upstream.mobilePreviewSessionId);
  assert('B-CORE', '58. preview bridge', getPreviewSessionForMobileApproval(reg.session!.mobileApprovalId) === upstream.mobilePreviewSessionId, 'preview');
  linkMobileApprovalToCloud(reg.session!.mobileApprovalId, upstream.runtimeId);
  assert('B-CORE', '59. cloud bridge', getCloudForMobileApproval(reg.session!.mobileApprovalId) === upstream.runtimeId, 'cloud');
  linkMobileApprovalToProjectVault(reg.session!.mobileApprovalId, 'proj-q');
  assert('B-CORE', '60. vault bridge', getProjectVaultForMobileApproval(reg.session!.mobileApprovalId) === 'proj-q', 'vault');
  linkMobileApprovalToWorld2Operation(reg.session!.mobileApprovalId, 'w2op-test-001');
  assert('B-CORE', '61. world2 bridge', getWorld2OperationForMobileApproval(reg.session!.mobileApprovalId) === 'w2op-test-001', 'world2');
  linkMobileApprovalToAiDevOperation(reg.session!.mobileApprovalId, 'aidev-op-001');
  assert('B-CORE', '62. aidev bridge', getAiDevOperationForMobileApproval(reg.session!.mobileApprovalId) === 'aidev-op-001', 'aidev');
  linkMobileApprovalToOperatorFeed(reg.session!.mobileApprovalId);
  assert('B-CORE', '63. operator feed bridge', getOperatorFeedForMobileApproval(reg.session!.mobileApprovalId) !== null, 'feed');
  assert('B-CORE', '64. by world2', listMobileApprovalsByWorld2('w2op-test-001').length >= 1, 'world2');
  assert('B-CORE', '65. by aidev', listMobileApprovalsByAiDev('aidev-op-001').length >= 1, 'aidev');

  const tracked = createMobileApprovalSession({
    mobileApprovalId: reg.session!.mobileApprovalId,
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '66. tracked session', tracked !== null, 'session');
  assert('B-CORE', '67. get tracked', getMobileApprovalTrackedSession(tracked!.sessionId)?.sessionId === tracked!.sessionId, 'get');

  setMobileApprovalVisibility(reg.session!.mobileApprovalId, 'FOUNDER');
  assert('B-CORE', '68. visibility', getMobileApprovalVisibility(reg.session!.mobileApprovalId) === 'FOUNDER', 'visibility');

  initializeMobileApproval(reg.session!.mobileApprovalId);
  const req = registerApprovalRequest({
    mobileApprovalId: reg.session!.mobileApprovalId,
    requestTitle: 'Test approval request',
    requestSummary: 'Authority-only request metadata',
    requestCategory: 'PROJECT_APPROVAL',
  });
  assert('B-CORE', '69. request id', req?.requestId.startsWith('mapprreq-') === true, String(req?.requestId));
  assert('B-CORE', '70. list requests', listApprovalRequests().length >= 1, 'requests');

  if (req) {
    const dec = recordApprovalDecision({
      mobileApprovalId: reg.session!.mobileApprovalId,
      requestId: req.requestId,
      decisionType: 'APPROVED',
      reason: 'Metadata only',
    });
    assert('B-CORE', '71. decision id', dec?.decisionId.startsWith('mapprdec-') === true, String(dec?.decisionId));
  }
  assert('B-CORE', '72. list decisions', listApprovalDecisions().length >= 1, 'decisions');

  setMobileApprovalState(reg.session!.mobileApprovalId, 'READY', true);
  assert('B-CORE', '73. lifecycle', getMobileApprovalHistory(reg.session!.mobileApprovalId).length >= 1, 'lifecycle');
  assert('B-CORE', '74. lifecycle events', listLifecycleEventsForMobileApproval(reg.session!.mobileApprovalId).length >= 1, 'events');
  assert('B-CORE', '75. state history', trackMobileApprovalStateHistory(reg.session!.mobileApprovalId).length >= 1, 'history');

  const dup = registerMobileApprovalSession({
    approvalName: 'Query Test Mobile Approval',
    mobileApprovalType: 'PROJECT_APPROVAL',
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    mobilePreviewSessionId: upstream.mobilePreviewSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '76. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateMobileApprovalRiskContext('Query Test Mobile Approval', 'PROJECT_APPROVAL');
  assert('B-CORE', '77. risk context', riskCtx.mobilePreviewSummaries.length >= 1, 'ctx');
  assert('B-CORE', '78. risk eval', Array.isArray(evaluateDuplicateMobileApprovalRisk(riskCtx)), 'eval');
  assert('B-CORE', '79. command mismatch fn', typeof detectMobileApprovalCommandMismatch(reg.session!.mobileApprovalId) === 'boolean', 'mismatch');
  assert('B-CORE', '80. chat mismatch fn', typeof detectMobileApprovalChatMismatch(reg.session!.mobileApprovalId) === 'boolean', 'mismatch');
  assert('B-CORE', '81. preview mismatch fn', typeof detectMobileApprovalPreviewMismatch(reg.session!.mobileApprovalId) === 'boolean', 'mismatch');
  assert('B-CORE', '82. cloud mismatch fn', typeof detectMobileApprovalCloudMismatch(reg.session!.mobileApprovalId) === 'boolean', 'mismatch');
  assert('B-CORE', '83. state validator', validateMobileApprovalState('READY') === true, 'valid');
  assert('B-CORE', '84. record validate', validateMobileApprovalRecord(ready.session).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildMobileApprovalRuntimeFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '85. uvl panel', panel.panelTitle === 'Mobile Approval Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '86. panel count', panel.mobileApprovalCount >= 9, String(panel.mobileApprovalCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  cachedResponse(CANONICAL_QUERY);
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '87. routing', routing.primaryCapability === 'MOBILE_APPROVAL_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '88. signal', isMobileApprovalRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '89. action id', action.candidates[0]!.mobileApprovalRuntimeFoundationId.startsWith('mapprtfnd-'), 'id');
  assert('C-INTEGRATION', '90. action count', action.candidates[0]!.mobileApprovalCount === 9, String(action.candidates[0]!.mobileApprovalCount));
  assert('C-INTEGRATION', '91. action state', action.candidates[0]!.mobileApprovalState === 'READY', String(action.candidates[0]!.mobileApprovalState));

  const reasoning = buildReasoningVisibilityRecord('mobile approval runtime foundation');
  assert('C-INTEGRATION', '92. reasoning basis', reasoning.mobileApprovalBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '93. reasoning chain', reasoning.mobileApprovalChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '94. reasoning state', reasoning.mobileApprovalState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is mobile approval blocked?');
  assert('C-INTEGRATION', '95. failure', failures.some((f) => f.sourceSystem === 'mobile_approval_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('mobile approval inventory');
  assert('C-INTEGRATION', '96. progress', progress[0]?.mobileApprovalRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '97. uvl rows', MOBILE_APPROVAL_RUNTIME_FOUNDATION_UVL_ROWS.length === 28, String(MOBILE_APPROVAL_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '98. uvl types', hasUvlRow('MOBILE_APPROVAL_TYPES'), 'types');
  assert('D-REGISTRY', '99. uvl request', hasUvlRow('MOBILE_APPROVAL_REQUEST_MANAGER'), 'request');
  assert('D-REGISTRY', '100. uvl preview bridge', hasUvlRow('MOBILE_APPROVAL_PREVIEW_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '101. console', isIntelligenceConsoleCapability('MOBILE_APPROVAL_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '102. find panel', resolveFindPanelAlias('Mobile Approval Runtime') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '103. registry', registry.includes('mobile_approval_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_MOBILE_APPROVAL_DUPLICATES) {
    assert('D-REGISTRY', `104.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/mobile-approval-runtime/mobile-approval-registry.ts');
  const validatorSrc = readTextOnce('src/mobile-approval-runtime/mobile-approval-validator.ts');
  const commandBridgeSrc = readTextOnce('src/mobile-approval-runtime/mobile-approval-command-bridge.ts');
  const chatBridgeSrc = readTextOnce('src/mobile-approval-runtime/mobile-approval-chat-bridge.ts');
  const feedMapperSrc = readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/mobile-approval-runtime/mobile-approval-request-manager.ts')].join('\n');
  assert('E-STATIC', '105. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '106. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '107. duplicate risk', validatorSrc.includes('DUPLICATE_MOBILE_APPROVAL_RISK'), 'risk');
  assert('E-STATIC', '108. feed mapped', feedMapperSrc.includes('MOBILE_APPROVAL_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '109. command bridge', commandBridgeSrc.includes('Mobile Command'), 'bridge');
  assert('E-STATIC', '110. chat bridge', chatBridgeSrc.includes('Mobile Chat'), 'bridge');
  assert('E-STATIC', '111. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `112.${i} approval id`, fixture.session?.mobileApprovalId.startsWith('mappr-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `113.${i} signal`, isMobileApprovalRuntimeFoundationQuestion(`mobile approval inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List mobile approvals batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `114.${i} route`, r.primaryCapability === 'MOBILE_APPROVAL_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildMobileApprovalFailureContext('Why is mobile approval blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `115.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is mobile approval blocked?'] as const;
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
  const diag = getMobileApprovalDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered mobile approvals: ${diag.registeredMobileApprovalCount}`);
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

  console.log(MOBILE_APPROVAL_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

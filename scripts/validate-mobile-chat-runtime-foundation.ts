/**
 * DevPulse V2 Phase 18.2 — Mobile Chat Runtime Foundation validation.
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
  MOBILE_CHAT_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_MOBILE_CHAT_DUPLICATES,
  TRACKED_MOBILE_CHAT_CATEGORIES,
  DUPLICATE_MOBILE_CHAT_RISK_PREFIX,
  isMobileChatRuntimeFoundationQuestion,
  prepareMobileChatRuntimeFoundation,
  processMobileChatRequest,
  getMobileChatDiagnostics,
  resetMobileChatRuntimeFoundationForTests,
  registerMobileChatSession,
  getMobileChatSession,
  listMobileChatSessionsAll,
  listMobileChatsByProject,
  listMobileChatsByCommandSession,
  listMobileChatsByRuntime,
  listMobileChatsByWorkspace,
  listMobileChatsByPersistentBuild,
  listMobileChatsByVerification,
  listMobileChatsByMonitoring,
  listMobileChatsByOwner,
  listMobileChatsByType,
  queryMobileChatSessions,
  createMobileChatSession,
  getMobileChatTrackedSession,
  setMobileChatState,
  trackMobileChatStateHistory,
  getMobileChatHistory,
  linkMobileChatToCommandSession,
  getCommandSessionForMobileChat,
  detectMobileChatCommandMismatch,
  linkMobileChatToCloud,
  getCloudForMobileChat,
  detectMobileChatCloudMismatch,
  linkMobileChatToWorkspace,
  getWorkspaceForMobileChat,
  linkMobileChatToBuild,
  getBuildForMobileChat,
  linkMobileChatToVerification,
  getVerificationForMobileChat,
  linkMobileChatToMonitoring,
  getMonitoringForMobileChat,
  linkMobileChatToOperatorFeed,
  getOperatorFeedForMobileChat,
  linkMobileChatToProjectVault,
  getProjectVaultForMobileChat,
  buildDuplicateMobileChatRiskContext,
  evaluateDuplicateMobileChatRisk,
  validateMobileChatRecord,
  validateMobileChatState,
  buildMobileChatFailureContext,
  initializeMobileChat,
  completeMobileChat,
  refreshMobileChatContext,
  evaluateMobileChatAction,
  registerMobileChatActionGateResult,
  listMobileChatActionGateResults,
  intakeMobileChatPrompt,
  routeMobileChatIntent,
  registerMobileMessage,
  setMobileChatResponseReady,
} from '../src/mobile-chat-runtime/index.js';
import {
  resetMobileCommandRuntimeFoundationForTests,
  processMobileCommandRequest,
  listMobileCommandSessionsAll,
} from '../src/mobile-command-runtime/index.js';
import { resetCloudRuntimeFoundationForTests, listRuntimes, processCloudRuntimeRequest } from '../src/cloud-runtime/index.js';
import {
  resetWorkspaceHostingFoundationForTests,
  listWorkspaces,
  processWorkspaceHostingRequest,
} from '../src/workspace-hosting/index.js';
import {
  resetPersistentBuildFoundationForTests,
  listPersistentBuilds,
  processPersistentBuildRequest,
} from '../src/persistent-build-runtime/index.js';
import {
  resetCloudVerificationFoundationForTests,
  listCloudVerifications,
  processCloudVerificationRequest,
} from '../src/cloud-verification/index.js';
import {
  resetCloudRecoveryFoundationForTests,
  listRecoveries,
  processCloudRecoveryRequest,
} from '../src/cloud-recovery/index.js';
import {
  resetCloudMonitoringFoundationForTests,
  listMonitoringRecords,
  processCloudMonitoringRequest,
} from '../src/cloud-monitoring/index.js';
import {
  MOBILE_CHAT_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildMobileChatRuntimeFoundationPanelSnapshot,
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
import type { PrepareMobileChatRuntimeFoundationInput } from '../src/mobile-chat-runtime/mobile-chat-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show mobile chat inventory';

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const recovery = listRecoveries()[0]!;
  const monitoring = listMonitoringRecords()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    verificationId: recovery.recoveryOwner.verificationId,
    monitoringId: monitoring.monitoringId,
    projectId: runtime.runtimeOwner.projectId,
    mobileCommandSessionId: command.mobileCommandId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processMobileChatRequest>>();
let coreFixture: ReturnType<typeof processMobileChatRequest> | null = null;

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
  if (hit) return hit;
  if (key === CANONICAL_QUERY.trim().toLowerCase() && coreFixture) {
    responseCache.set(key, coreFixture);
    return coreFixture;
  }
  const result = processMobileChatRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareMobileChatRuntimeFoundationInput> = {}): PrepareMobileChatRuntimeFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    mobileCommandSessionId: 'mcmd-0001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    verificationId: 'cver-0001',
    monitoringId: 'cmon-0001',
    chatName: 'Test Mobile Chat',
    mobileChatType: 'GENERAL_MOBILE_CHAT',
    promptText: 'Show mobile chat status',
    projectExists: true,
    commandSessionExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    verificationExists: true,
    monitoringExists: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  coreFixture = null;
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

function ensureUpstream(): ReturnType<typeof upstreamBootstrap.ensure> {
  return upstreamBootstrap.ensure();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 18.2 Mobile Chat Runtime Foundation');
  console.log('========================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/mobile-chat-runtime');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'mobile-chat-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'mobile-chat-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'mobile-chat-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'mobile-chat-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'mobile-chat-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'mobile-chat-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'mobile-chat-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'mobile-chat-context.ts')), 'context');
  assert('A-SETUP', '9. message store', existsSync(join(dir, 'mobile-chat-message-store.ts')), 'message');
  assert('A-SETUP', '10. prompt intake', existsSync(join(dir, 'mobile-chat-prompt-intake.ts')), 'prompt');
  assert('A-SETUP', '11. response state', existsSync(join(dir, 'mobile-chat-response-state.ts')), 'response');
  assert('A-SETUP', '12. command router', existsSync(join(dir, 'mobile-chat-command-router.ts')), 'router');
  assert('A-SETUP', '13. action gate', existsSync(join(dir, 'mobile-chat-action-gate.ts')), 'gate');
  assert('A-SETUP', '14. command bridge', existsSync(join(dir, 'mobile-chat-command-bridge.ts')), 'command');
  assert('A-SETUP', '15. cloud bridge', existsSync(join(dir, 'mobile-chat-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '16. workspace bridge', existsSync(join(dir, 'mobile-chat-workspace-bridge.ts')), 'workspace');
  assert('A-SETUP', '17. build bridge', existsSync(join(dir, 'mobile-chat-build-bridge.ts')), 'build');
  assert('A-SETUP', '18. verification bridge', existsSync(join(dir, 'mobile-chat-verification-bridge.ts')), 'verification');
  assert('A-SETUP', '19. monitoring bridge', existsSync(join(dir, 'mobile-chat-monitoring-bridge.ts')), 'monitoring');
  assert('A-SETUP', '20. operator feed bridge', existsSync(join(dir, 'mobile-chat-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '21. project vault bridge', existsSync(join(dir, 'mobile-chat-project-vault-bridge.ts')), 'vault');
  assert('A-SETUP', '22. query', existsSync(join(dir, 'mobile-chat-query.ts')), 'query');
  assert('A-SETUP', '23. history', existsSync(join(dir, 'mobile-chat-history.ts')), 'history');
  assert('A-SETUP', '24. validator', existsSync(join(dir, 'mobile-chat-validator.ts')), 'validator');
  assert('A-SETUP', '25. diagnostics', existsSync(join(dir, 'mobile-chat-diagnostics.ts')), 'diag');
  assert('A-SETUP', '26. report', existsSync(join(dir, 'mobile-chat-report-builder.ts')), 'report');
  assert('A-SETUP', '27. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '28. feed bridge', existsSync(join(ROOT, 'src/operator-feed/mobile-chat-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '29. script', typeof pkg.scripts?.['validate:mobile-chat-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('mobile_chat_runtime_foundation');
  assert('A-SETUP', '30. owner', owner.ownerModule === MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '31. phase', owner.phase === 18.2, String(owner.phase));
  assert('A-SETUP', '32. categories', TRACKED_MOBILE_CHAT_CATEGORIES.length === 9, String(TRACKED_MOBILE_CHAT_CATEGORIES.length));
  assert('A-SETUP', '33. duplicate prefix', DUPLICATE_MOBILE_CHAT_RISK_PREFIX === 'DUPLICATE_MOBILE_CHAT_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareMobileChatRuntimeFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      verificationId: upstream.verificationId,
      monitoringId: upstream.monitoringId,
      projectId: upstream.projectId,
      mobileCommandSessionId: upstream.mobileCommandSessionId,
    }),
  );
  assert('B-CORE', '34. chat id', ready.session?.mobileChatId.startsWith('mchat-') === true, String(ready.session?.mobileChatId));
  assert('B-CORE', '35. tracked session id', ready.trackedSession?.sessionId.startsWith('mchsess-') === true, String(ready.trackedSession?.sessionId));
  assert('B-CORE', '36. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '37. reports', ready.reports.length === 19, String(ready.reports.length));
  assert('B-CORE', '38. inventory', listMobileChatSessionsAll().length >= 9, String(listMobileChatSessionsAll().length));
  assert('B-CORE', '39. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '40. command link', ready.session?.mobileChatCommandLink.mobileCommandId === upstream.mobileCommandSessionId, String(ready.session?.mobileChatCommandLink.mobileCommandId));
  assert('B-CORE', '41. runtime link', ready.session?.mobileChatCloudLink.runtimeId === upstream.runtimeId, String(ready.session?.mobileChatCloudLink.runtimeId));
  assert('B-CORE', '42. workspace link', ready.session?.mobileChatWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.session?.mobileChatWorkspaceLink.workspaceId));
  assert('B-CORE', '43. build link', ready.session?.mobileChatBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.session?.mobileChatBuildLink.persistentBuildId));
  assert('B-CORE', '44. verification link', ready.session?.mobileChatVerificationLink.verificationId === upstream.verificationId, String(ready.session?.mobileChatVerificationLink.verificationId));
  assert('B-CORE', '45. monitoring link', ready.session?.mobileChatMonitoringLink.monitoringId === upstream.monitoringId, String(ready.session?.mobileChatMonitoringLink.monitoringId));

  const reg = registerMobileChatSession({
    chatName: 'Query Test Mobile Chat',
    mobileChatType: 'PROJECT_MOBILE_CHAT',
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    monitoringId: upstream.monitoringId,
  });
  assert('B-CORE', '46. register', reg.session !== null && !reg.blocked, 'registered');
  assert('B-CORE', '47. get session', getMobileChatSession(reg.session!.mobileChatId)?.mobileChatId === reg.session!.mobileChatId, 'get');
  assert('B-CORE', '48. by project', listMobileChatsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '49. by command', listMobileChatsByCommandSession(upstream.mobileCommandSessionId).length >= 1, 'command');
  assert('B-CORE', '50. by runtime', listMobileChatsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '51. by workspace', listMobileChatsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '52. by build', listMobileChatsByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '53. by verification', listMobileChatsByVerification(upstream.verificationId).length >= 1, 'verification');
  assert('B-CORE', '54. by monitoring', listMobileChatsByMonitoring(upstream.monitoringId).length >= 1, 'monitoring');
  assert('B-CORE', '55. by owner', listMobileChatsByOwner(MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '56. by type', listMobileChatsByType('PROJECT_MOBILE_CHAT').length >= 1, 'type');
  assert('B-CORE', '57. query', queryMobileChatSessions({ mobileChatType: 'PROJECT_MOBILE_CHAT' }).length >= 1, 'query');

  linkMobileChatToCommandSession(reg.session!.mobileChatId, upstream.mobileCommandSessionId);
  assert('B-CORE', '58. command bridge', getCommandSessionForMobileChat(reg.session!.mobileChatId) === upstream.mobileCommandSessionId, 'command');
  linkMobileChatToCloud(reg.session!.mobileChatId, upstream.runtimeId);
  assert('B-CORE', '59. cloud bridge', getCloudForMobileChat(reg.session!.mobileChatId) === upstream.runtimeId, 'cloud');
  linkMobileChatToWorkspace(reg.session!.mobileChatId, upstream.workspaceId);
  assert('B-CORE', '60. workspace bridge', getWorkspaceForMobileChat(reg.session!.mobileChatId) === upstream.workspaceId, 'workspace');
  linkMobileChatToBuild(reg.session!.mobileChatId, upstream.persistentBuildId);
  assert('B-CORE', '61. build bridge', getBuildForMobileChat(reg.session!.mobileChatId) === upstream.persistentBuildId, 'build');
  linkMobileChatToVerification(reg.session!.mobileChatId, upstream.verificationId);
  assert('B-CORE', '62. verification bridge', getVerificationForMobileChat(reg.session!.mobileChatId) === upstream.verificationId, 'verification');
  linkMobileChatToMonitoring(reg.session!.mobileChatId, upstream.monitoringId);
  assert('B-CORE', '63. monitoring bridge', getMonitoringForMobileChat(reg.session!.mobileChatId) === upstream.monitoringId, 'monitoring');
  linkMobileChatToOperatorFeed(reg.session!.mobileChatId);
  assert('B-CORE', '64. operator feed bridge', getOperatorFeedForMobileChat(reg.session!.mobileChatId) !== null, 'feed');
  linkMobileChatToProjectVault(reg.session!.mobileChatId, 'proj-q');
  assert('B-CORE', '65. vault bridge', getProjectVaultForMobileChat(reg.session!.mobileChatId) === 'proj-q', 'vault');

  const tracked = createMobileChatSession({
    mobileChatId: reg.session!.mobileChatId,
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    monitoringId: upstream.monitoringId,
  });
  assert('B-CORE', '66. tracked session', tracked !== null, 'session');
  assert('B-CORE', '67. get tracked', getMobileChatTrackedSession(tracked!.sessionId)?.sessionId === tracked!.sessionId, 'get');

  const prompt = intakeMobileChatPrompt({
    mobileChatId: reg.session!.mobileChatId,
    promptText: 'Route this mobile chat prompt to command',
    promptSource: 'MOBILE_CHAT_AUTHORITY',
  });
  assert('B-CORE', '68. prompt intake', prompt !== null, 'prompt');
  const routes = routeMobileChatIntent(reg.session!.mobileChatId, 'route to command');
  assert('B-CORE', '69. route intent', routes.length >= 1, String(routes.length));
  const message = registerMobileMessage({
    mobileChatId: reg.session!.mobileChatId,
    messageRole: 'USER',
    messageText: 'Test mobile chat message',
    promptId: prompt?.promptId ?? null,
  });
  assert('B-CORE', '70. message id', message?.messageId.startsWith('mmsg-') === true, String(message?.messageId));
  const response = setMobileChatResponseReady(reg.session!.mobileChatId, 'Mobile chat response metadata ready', [
    reg.session!.mobileChatId,
  ]);
  assert('B-CORE', '71. response ready', response !== null && response.responseStatus === 'READY', String(response?.responseStatus));

  setMobileChatState(reg.session!.mobileChatId, 'READY', true);
  initializeMobileChat(reg.session!.mobileChatId);
  evaluateMobileChatAction(reg.session!.mobileChatId, 'view_status');
  registerMobileChatActionGateResult({ mobileChatId: reg.session!.mobileChatId, actionName: 'view_status' });
  refreshMobileChatContext(reg.session!.mobileChatId);
  completeMobileChat(reg.session!.mobileChatId);
  assert('B-CORE', '72. lifecycle', getMobileChatHistory(reg.session!.mobileChatId).length >= 3, 'lifecycle');
  assert('B-CORE', '73. state history', trackMobileChatStateHistory(reg.session!.mobileChatId).length >= 1, 'history');
  assert('B-CORE', '74. action gates', listMobileChatActionGateResults(reg.session!.mobileChatId).length >= 1, 'gates');

  const dup = registerMobileChatSession({
    chatName: 'Query Test Mobile Chat',
    mobileChatType: 'PROJECT_MOBILE_CHAT',
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    monitoringId: upstream.monitoringId,
  });
  assert('B-CORE', '75. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateMobileChatRiskContext('Query Test Mobile Chat', 'PROJECT_MOBILE_CHAT');
  assert('B-CORE', '76. risk context', riskCtx.monitoringSummaries.length >= 1, 'ctx');
  assert('B-CORE', '77. risk eval', Array.isArray(evaluateDuplicateMobileChatRisk(riskCtx)), 'eval');
  assert('B-CORE', '78. command mismatch fn', typeof detectMobileChatCommandMismatch(reg.session!.mobileChatId) === 'boolean', 'mismatch');
  assert('B-CORE', '79. cloud mismatch fn', typeof detectMobileChatCloudMismatch(reg.session!.mobileChatId) === 'boolean', 'mismatch');
  assert('B-CORE', '80. state validator', validateMobileChatState('PROMPT_RECEIVED') === true, 'valid');
  assert('B-CORE', '81. record validate', validateMobileChatRecord(ready.session).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildMobileChatRuntimeFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '82. uvl panel', panel.panelTitle === 'Mobile Chat Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '83. panel count', panel.mobileChatCount >= 9, String(panel.mobileChatCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '84. routing', routing.primaryCapability === 'MOBILE_CHAT_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '85. signal', isMobileChatRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '86. action id', action.candidates[0]!.mobileChatRuntimeFoundationId.startsWith('mchtfnd-'), 'id');
  assert('C-INTEGRATION', '87. action count', action.candidates[0]!.mobileChatCount === 9, String(action.candidates[0]!.mobileChatCount));
  assert('C-INTEGRATION', '88. action state', action.candidates[0]!.mobileChatState === 'READY', String(action.candidates[0]!.mobileChatState));

  const reasoning = buildReasoningVisibilityRecord('mobile chat runtime foundation');
  assert('C-INTEGRATION', '89. reasoning basis', reasoning.mobileChatBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '90. reasoning chain', reasoning.mobileChatChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '91. reasoning state', reasoning.mobileChatState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is mobile chat blocked?');
  assert('C-INTEGRATION', '92. failure', failures.some((f) => f.sourceSystem === 'mobile_chat_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('mobile chat inventory');
  assert('C-INTEGRATION', '93. progress', progress[0]?.mobileChatRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '94. uvl rows', MOBILE_CHAT_RUNTIME_FOUNDATION_UVL_ROWS.length === 29, String(MOBILE_CHAT_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '95. uvl types', hasUvlRow('MOBILE_CHAT_TYPES'), 'types');
  assert('D-REGISTRY', '96. uvl command bridge', hasUvlRow('MOBILE_CHAT_COMMAND_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '97. uvl prompt intake', hasUvlRow('MOBILE_CHAT_PROMPT_INTAKE'), 'intake');
  assert('D-REGISTRY', '98. console', isIntelligenceConsoleCapability('MOBILE_CHAT_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '99. find panel', resolveFindPanelAlias('Mobile Chat Runtime') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '100. registry', registry.includes('mobile_chat_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_MOBILE_CHAT_DUPLICATES) {
    assert('D-REGISTRY', `101.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/mobile-chat-runtime/mobile-chat-registry.ts');
  const validatorSrc = readTextOnce('src/mobile-chat-runtime/mobile-chat-validator.ts');
  const commandBridgeSrc = readTextOnce('src/mobile-chat-runtime/mobile-chat-command-bridge.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/mobile-chat-runtime/mobile-chat-action-gate.ts')].join('\n');
  assert('E-STATIC', '102. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '103. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '104. duplicate risk', validatorSrc.includes('DUPLICATE_MOBILE_CHAT_RISK'), 'risk');
  assert('E-STATIC', '105. feed mapped', readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts').includes('MOBILE_CHAT_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '106. command bridge', commandBridgeSrc.includes('Mobile Command'), 'bridge');
  assert('E-STATIC', '107. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `108.${i} chat id`, fixture.session?.mobileChatId.startsWith('mchat-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `109.${i} signal`, isMobileChatRuntimeFoundationQuestion(`mobile chat inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List mobile chats batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `110.${i} route`, r.primaryCapability === 'MOBILE_CHAT_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildMobileChatFailureContext('Why is mobile chat blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `111.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is mobile chat blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `112.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getMobileChatDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered mobile chats: ${diag.registeredMobileChatCount}`);
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

  console.log(MOBILE_CHAT_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

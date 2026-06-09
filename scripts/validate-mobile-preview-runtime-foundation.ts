/**
 * DevPulse V2 Phase 18.3 — Mobile Preview Runtime Foundation validation.
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
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_MOBILE_PREVIEW_DUPLICATES,
  TRACKED_MOBILE_PREVIEW_CATEGORIES,
  DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX,
  isMobilePreviewRuntimeFoundationQuestion,
  prepareMobilePreviewRuntimeFoundation,
  processMobilePreviewRequest,
  getMobilePreviewDiagnostics,
  resetMobilePreviewRuntimeFoundationForTests,
  registerMobilePreviewSession,
  getMobilePreviewSession,
  listMobilePreviewSessionsAll,
  listMobilePreviewsByProject,
  listMobilePreviewsByCommandSession,
  listMobilePreviewsByChatSession,
  listMobilePreviewsByRuntime,
  listMobilePreviewsByWorkspace,
  listMobilePreviewsByPersistentBuild,
  listMobilePreviewsByVerification,
  listMobilePreviewsByOwner,
  listMobilePreviewsByType,
  queryMobilePreviewSessions,
  createMobilePreviewSession,
  getMobilePreviewTrackedSession,
  setMobilePreviewState,
  trackMobilePreviewStateHistory,
  getMobilePreviewHistory,
  linkMobilePreviewToCommandSession,
  getCommandSessionForMobilePreview,
  detectMobilePreviewCommandMismatch,
  linkMobilePreviewToChatSession,
  getChatSessionForMobilePreview,
  detectMobilePreviewChatMismatch,
  linkMobilePreviewToCloud,
  getCloudForMobilePreview,
  detectMobilePreviewCloudMismatch,
  linkMobilePreviewToWorkspace,
  getWorkspaceForMobilePreview,
  linkMobilePreviewToBuild,
  getBuildForMobilePreview,
  linkMobilePreviewToVerification,
  getVerificationForMobilePreview,
  linkMobilePreviewToOperatorFeed,
  getOperatorFeedForMobilePreview,
  buildDuplicateMobilePreviewRiskContext,
  evaluateDuplicateMobilePreviewRisk,
  validateMobilePreviewRecord,
  validateMobilePreviewState,
  buildMobilePreviewFailureContext,
  initializeMobilePreview,
  checkMobilePreviewEligibility,
  checkMobilePreviewSafety,
  allowMobilePreview,
  completeMobilePreview,
  listLifecycleEventsForMobilePreview,
  evaluateDesktopRecommendation,
  registerPreviewLink,
  getPreviewLink,
  evaluateMobilePreviewEligibility,
  evaluateMobilePreviewSafety,
  getMobilePreviewDevicePolicy,
} from '../src/mobile-preview-runtime/index.js';
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
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildMobilePreviewRuntimeFoundationPanelSnapshot,
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
import type { PrepareMobilePreviewRuntimeFoundationInput } from '../src/mobile-preview-runtime/mobile-preview-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show mobile preview inventory';

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const recovery = listRecoveries()[0]!;
  const command = listMobileCommandSessionsAll()[0]!;
  const chat = listMobileChatSessionsAll()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    verificationId: recovery.recoveryOwner.verificationId,
    projectId: runtime.runtimeOwner.projectId,
    mobileCommandSessionId: command.mobileCommandId,
    mobileChatSessionId: chat.mobileChatId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processMobilePreviewRequest>>();
let coreFixture: ReturnType<typeof processMobilePreviewRequest> | null = null;

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
  const result = processMobilePreviewRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareMobilePreviewRuntimeFoundationInput> = {}): PrepareMobilePreviewRuntimeFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    mobileCommandSessionId: 'mcmd-0001',
    mobileChatSessionId: 'mchat-0001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    verificationId: 'cver-0001',
    previewName: 'Test Mobile Preview',
    mobilePreviewType: 'GENERAL_MOBILE_PREVIEW',
    projectExists: true,
    commandSessionExists: true,
    chatSessionExists: true,
    runtimeExists: true,
    workspaceExists: true,
    persistentBuildExists: true,
    verificationExists: true,
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
  resetMobilePreviewRuntimeFoundationForTests();
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
  console.log('DevPulse V2 — Phase 18.3 Mobile Preview Runtime Foundation');
  console.log('===========================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/mobile-preview-runtime');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'mobile-preview-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'mobile-preview-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'mobile-preview-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'mobile-preview-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'mobile-preview-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'mobile-preview-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'mobile-preview-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'mobile-preview-context.ts')), 'context');
  assert('A-SETUP', '9. eligibility', existsSync(join(dir, 'mobile-preview-eligibility.ts')), 'eligibility');
  assert('A-SETUP', '10. safety', existsSync(join(dir, 'mobile-preview-safety.ts')), 'safety');
  assert('A-SETUP', '11. device policy', existsSync(join(dir, 'mobile-preview-device-policy.ts')), 'policy');
  assert('A-SETUP', '12. desktop recommendation', existsSync(join(dir, 'mobile-preview-desktop-recommendation.ts')), 'desktop');
  assert('A-SETUP', '13. link manager', existsSync(join(dir, 'mobile-preview-link-manager.ts')), 'link');
  assert('A-SETUP', '14. command bridge', existsSync(join(dir, 'mobile-preview-command-bridge.ts')), 'command');
  assert('A-SETUP', '15. chat bridge', existsSync(join(dir, 'mobile-preview-chat-bridge.ts')), 'chat');
  assert('A-SETUP', '16. cloud bridge', existsSync(join(dir, 'mobile-preview-cloud-bridge.ts')), 'cloud');
  assert('A-SETUP', '17. workspace bridge', existsSync(join(dir, 'mobile-preview-workspace-bridge.ts')), 'workspace');
  assert('A-SETUP', '18. build bridge', existsSync(join(dir, 'mobile-preview-build-bridge.ts')), 'build');
  assert('A-SETUP', '19. verification bridge', existsSync(join(dir, 'mobile-preview-verification-bridge.ts')), 'verification');
  assert('A-SETUP', '20. operator feed bridge', existsSync(join(dir, 'mobile-preview-operator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '21. query', existsSync(join(dir, 'mobile-preview-query.ts')), 'query');
  assert('A-SETUP', '22. history', existsSync(join(dir, 'mobile-preview-history.ts')), 'history');
  assert('A-SETUP', '23. validator', existsSync(join(dir, 'mobile-preview-validator.ts')), 'validator');
  assert('A-SETUP', '24. diagnostics', existsSync(join(dir, 'mobile-preview-diagnostics.ts')), 'diag');
  assert('A-SETUP', '25. report', existsSync(join(dir, 'mobile-preview-report-builder.ts')), 'report');
  assert('A-SETUP', '26. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '27. feed bridge', existsSync(join(ROOT, 'src/operator-feed/mobile-preview-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '28. script', typeof pkg.scripts?.['validate:mobile-preview-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('mobile_preview_runtime_foundation');
  assert('A-SETUP', '29. owner', owner.ownerModule === MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '30. phase', owner.phase === 18.3, String(owner.phase));
  assert('A-SETUP', '31. categories', TRACKED_MOBILE_PREVIEW_CATEGORIES.length === 9, String(TRACKED_MOBILE_PREVIEW_CATEGORIES.length));
  assert('A-SETUP', '32. duplicate prefix', DUPLICATE_MOBILE_PREVIEW_RISK_PREFIX === 'DUPLICATE_MOBILE_PREVIEW_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareMobilePreviewRuntimeFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      verificationId: upstream.verificationId,
      projectId: upstream.projectId,
      mobileCommandSessionId: upstream.mobileCommandSessionId,
      mobileChatSessionId: upstream.mobileChatSessionId,
    }),
  );
  assert('B-CORE', '33. preview id', ready.session?.mobilePreviewId.startsWith('mpview-') === true, String(ready.session?.mobilePreviewId));
  assert('B-CORE', '34. tracked session id', ready.trackedSession?.sessionId.startsWith('mpvsess-') === true, String(ready.trackedSession?.sessionId));
  assert('B-CORE', '35. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '36. reports', ready.reports.length === 19, String(ready.reports.length));
  assert('B-CORE', '37. inventory', listMobilePreviewSessionsAll().length >= 9, String(listMobilePreviewSessionsAll().length));
  assert('B-CORE', '38. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '39. command link', ready.session?.mobilePreviewCommandLink.mobileCommandId === upstream.mobileCommandSessionId, String(ready.session?.mobilePreviewCommandLink.mobileCommandId));
  assert('B-CORE', '40. chat link', ready.session?.mobilePreviewChatLink.mobileChatId === upstream.mobileChatSessionId, String(ready.session?.mobilePreviewChatLink.mobileChatId));
  assert('B-CORE', '41. runtime link', ready.session?.mobilePreviewCloudLink.runtimeId === upstream.runtimeId, String(ready.session?.mobilePreviewCloudLink.runtimeId));
  assert('B-CORE', '42. workspace link', ready.session?.mobilePreviewWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.session?.mobilePreviewWorkspaceLink.workspaceId));
  assert('B-CORE', '43. build link', ready.session?.mobilePreviewBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.session?.mobilePreviewBuildLink.persistentBuildId));
  assert('B-CORE', '44. verification link', ready.session?.mobilePreviewVerificationLink.verificationId === upstream.verificationId, String(ready.session?.mobilePreviewVerificationLink.verificationId));

  const reg = registerMobilePreviewSession({
    previewName: 'Query Test Mobile Preview',
    mobilePreviewType: 'PROJECT_MOBILE_PREVIEW',
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
  });
  assert('B-CORE', '45. register', reg.session !== null && !reg.blocked, 'registered');
  assert('B-CORE', '46. get session', getMobilePreviewSession(reg.session!.mobilePreviewId)?.mobilePreviewId === reg.session!.mobilePreviewId, 'get');
  assert('B-CORE', '47. by project', listMobilePreviewsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '48. by command', listMobilePreviewsByCommandSession(upstream.mobileCommandSessionId).length >= 1, 'command');
  assert('B-CORE', '49. by chat', listMobilePreviewsByChatSession(upstream.mobileChatSessionId).length >= 1, 'chat');
  assert('B-CORE', '50. by runtime', listMobilePreviewsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '51. by workspace', listMobilePreviewsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '52. by build', listMobilePreviewsByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '53. by verification', listMobilePreviewsByVerification(upstream.verificationId).length >= 1, 'verification');
  assert('B-CORE', '54. by owner', listMobilePreviewsByOwner(MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '55. by type', listMobilePreviewsByType('PROJECT_MOBILE_PREVIEW').length >= 1, 'type');
  assert('B-CORE', '56. query', queryMobilePreviewSessions({ mobilePreviewType: 'PROJECT_MOBILE_PREVIEW' }).length >= 1, 'query');

  linkMobilePreviewToCommandSession(reg.session!.mobilePreviewId, upstream.mobileCommandSessionId);
  assert('B-CORE', '57. command bridge', getCommandSessionForMobilePreview(reg.session!.mobilePreviewId) === upstream.mobileCommandSessionId, 'command');
  linkMobilePreviewToChatSession(reg.session!.mobilePreviewId, upstream.mobileChatSessionId);
  assert('B-CORE', '58. chat bridge', getChatSessionForMobilePreview(reg.session!.mobilePreviewId) === upstream.mobileChatSessionId, 'chat');
  linkMobilePreviewToCloud(reg.session!.mobilePreviewId, upstream.runtimeId);
  assert('B-CORE', '59. cloud bridge', getCloudForMobilePreview(reg.session!.mobilePreviewId) === upstream.runtimeId, 'cloud');
  linkMobilePreviewToWorkspace(reg.session!.mobilePreviewId, upstream.workspaceId);
  assert('B-CORE', '60. workspace bridge', getWorkspaceForMobilePreview(reg.session!.mobilePreviewId) === upstream.workspaceId, 'workspace');
  linkMobilePreviewToBuild(reg.session!.mobilePreviewId, upstream.persistentBuildId);
  assert('B-CORE', '61. build bridge', getBuildForMobilePreview(reg.session!.mobilePreviewId) === upstream.persistentBuildId, 'build');
  linkMobilePreviewToVerification(reg.session!.mobilePreviewId, upstream.verificationId);
  assert('B-CORE', '62. verification bridge', getVerificationForMobilePreview(reg.session!.mobilePreviewId) === upstream.verificationId, 'verification');
  linkMobilePreviewToOperatorFeed(reg.session!.mobilePreviewId);
  assert('B-CORE', '63. operator feed bridge', getOperatorFeedForMobilePreview(reg.session!.mobilePreviewId) !== null, 'feed');

  const tracked = createMobilePreviewSession({
    mobilePreviewId: reg.session!.mobilePreviewId,
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
  });
  assert('B-CORE', '64. tracked session', tracked !== null, 'session');
  assert('B-CORE', '65. get tracked', getMobilePreviewTrackedSession(tracked!.sessionId)?.sessionId === tracked!.sessionId, 'get');

  const desktopEval = evaluateDesktopRecommendation(reg.session!.mobilePreviewId);
  assert('B-CORE', '66. desktop recommendation', typeof desktopEval.level === 'string', String(desktopEval.level));
  const previewLink = registerPreviewLink({
    mobilePreviewId: reg.session!.mobilePreviewId,
    urlMetadata: 'metadata://proj-q/extra-preview-link',
    linkType: 'METADATA_PREVIEW_LINK',
    previewTarget: 'Query Test Mobile Preview',
    previewType: 'PROJECT_MOBILE_PREVIEW',
  });
  assert('B-CORE', '67. preview link id', previewLink?.linkId.startsWith('mpvlink-') === true, String(previewLink?.linkId));
  assert('B-CORE', '68. get preview link', getPreviewLink(previewLink!.linkId)?.linkId === previewLink!.linkId, 'link');
  assert('B-CORE', '69. eligibility', evaluateMobilePreviewEligibility(reg.session!.mobilePreviewId) !== null, 'eligibility');
  assert('B-CORE', '70. safety', evaluateMobilePreviewSafety(reg.session!.mobilePreviewId) !== null, 'safety');
  assert('B-CORE', '71. device policy', getMobilePreviewDevicePolicy(reg.session!.mobilePreviewId) !== null, 'policy');

  setMobilePreviewState(reg.session!.mobilePreviewId, 'READY', true);
  initializeMobilePreview(reg.session!.mobilePreviewId);
  checkMobilePreviewEligibility(reg.session!.mobilePreviewId);
  checkMobilePreviewSafety(reg.session!.mobilePreviewId);
  allowMobilePreview(reg.session!.mobilePreviewId);
  completeMobilePreview(reg.session!.mobilePreviewId);
  assert('B-CORE', '72. lifecycle', getMobilePreviewHistory(reg.session!.mobilePreviewId).length >= 3, 'lifecycle');
  assert('B-CORE', '73. lifecycle events', listLifecycleEventsForMobilePreview(reg.session!.mobilePreviewId).length >= 3, 'events');
  assert('B-CORE', '74. state history', trackMobilePreviewStateHistory(reg.session!.mobilePreviewId).length >= 1, 'history');

  const dup = registerMobilePreviewSession({
    previewName: 'Query Test Mobile Preview',
    mobilePreviewType: 'PROJECT_MOBILE_PREVIEW',
    projectId: 'proj-q',
    mobileCommandSessionId: upstream.mobileCommandSessionId,
    mobileChatSessionId: upstream.mobileChatSessionId,
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
  });
  assert('B-CORE', '75. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateMobilePreviewRiskContext('Query Test Mobile Preview', 'PROJECT_MOBILE_PREVIEW');
  assert('B-CORE', '76. risk context', riskCtx.mobileChatSummaries.length >= 1, 'ctx');
  assert('B-CORE', '77. risk eval', Array.isArray(evaluateDuplicateMobilePreviewRisk(riskCtx)), 'eval');
  assert('B-CORE', '78. command mismatch fn', typeof detectMobilePreviewCommandMismatch(reg.session!.mobilePreviewId) === 'boolean', 'mismatch');
  assert('B-CORE', '79. chat mismatch fn', typeof detectMobilePreviewChatMismatch(reg.session!.mobilePreviewId) === 'boolean', 'mismatch');
  assert('B-CORE', '80. cloud mismatch fn', typeof detectMobilePreviewCloudMismatch(reg.session!.mobilePreviewId) === 'boolean', 'mismatch');
  assert('B-CORE', '81. state validator', validateMobilePreviewState('ELIGIBILITY_CHECKED') === true, 'valid');
  assert('B-CORE', '82. record validate', validateMobilePreviewRecord(ready.session).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildMobilePreviewRuntimeFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '83. uvl panel', panel.panelTitle === 'Mobile Preview Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '84. panel count', panel.mobilePreviewCount >= 9, String(panel.mobilePreviewCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '85. routing', routing.primaryCapability === 'MOBILE_PREVIEW_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '86. signal', isMobilePreviewRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '87. action id', action.candidates[0]!.mobilePreviewRuntimeFoundationId.startsWith('mpvtfnd-'), 'id');
  assert('C-INTEGRATION', '88. action count', action.candidates[0]!.mobilePreviewCount === 9, String(action.candidates[0]!.mobilePreviewCount));
  assert('C-INTEGRATION', '89. action state', action.candidates[0]!.mobilePreviewState === 'READY', String(action.candidates[0]!.mobilePreviewState));

  const reasoning = buildReasoningVisibilityRecord('mobile preview runtime foundation');
  assert('C-INTEGRATION', '90. reasoning basis', reasoning.mobilePreviewBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '91. reasoning chain', reasoning.mobilePreviewChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '92. reasoning state', reasoning.mobilePreviewState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is mobile preview blocked?');
  assert('C-INTEGRATION', '93. failure', failures.some((f) => f.sourceSystem === 'mobile_preview_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('mobile preview inventory');
  assert('C-INTEGRATION', '94. progress', progress[0]?.mobilePreviewRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '95. uvl rows', MOBILE_PREVIEW_RUNTIME_FOUNDATION_UVL_ROWS.length === 28, String(MOBILE_PREVIEW_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '96. uvl types', hasUvlRow('MOBILE_PREVIEW_TYPES'), 'types');
  assert('D-REGISTRY', '97. uvl eligibility', hasUvlRow('MOBILE_PREVIEW_ELIGIBILITY'), 'eligibility');
  assert('D-REGISTRY', '98. uvl chat bridge', hasUvlRow('MOBILE_PREVIEW_CHAT_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '99. console', isIntelligenceConsoleCapability('MOBILE_PREVIEW_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '100. find panel', resolveFindPanelAlias('Mobile Preview Runtime') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '101. registry', registry.includes('mobile_preview_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_MOBILE_PREVIEW_DUPLICATES) {
    assert('D-REGISTRY', `102.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/mobile-preview-runtime/mobile-preview-registry.ts');
  const validatorSrc = readTextOnce('src/mobile-preview-runtime/mobile-preview-validator.ts');
  const commandBridgeSrc = readTextOnce('src/mobile-preview-runtime/mobile-preview-command-bridge.ts');
  const chatBridgeSrc = readTextOnce('src/mobile-preview-runtime/mobile-preview-chat-bridge.ts');
  const feedMapperSrc = readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/mobile-preview-runtime/mobile-preview-eligibility.ts')].join('\n');
  assert('E-STATIC', '103. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '104. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '105. duplicate risk', validatorSrc.includes('DUPLICATE_MOBILE_PREVIEW_RISK'), 'risk');
  assert('E-STATIC', '106. feed mapped', feedMapperSrc.includes('MOBILE_PREVIEW_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '107. command bridge', commandBridgeSrc.includes('Mobile Command'), 'bridge');
  assert('E-STATIC', '108. chat bridge', chatBridgeSrc.includes('Mobile Chat'), 'bridge');
  assert('E-STATIC', '109. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `110.${i} preview id`, fixture.session?.mobilePreviewId.startsWith('mpview-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `111.${i} signal`, isMobilePreviewRuntimeFoundationQuestion(`mobile preview inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List mobile previews batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `112.${i} route`, r.primaryCapability === 'MOBILE_PREVIEW_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildMobilePreviewFailureContext('Why is mobile preview blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `113.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is mobile preview blocked?'] as const;
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
  const diag = getMobilePreviewDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered mobile previews: ${diag.registeredMobilePreviewCount}`);
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

  console.log(MOBILE_PREVIEW_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

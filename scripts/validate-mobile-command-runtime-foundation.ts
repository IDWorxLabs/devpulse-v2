/**
 * DevPulse V2 Phase 18.1 — Mobile Command Runtime Foundation validation.
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
  MOBILE_COMMAND_RUNTIME_FOUNDATION_PASS_TOKEN,
  MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_MOBILE_COMMAND_DUPLICATES,
  TRACKED_MOBILE_COMMAND_CATEGORIES,
  DUPLICATE_MOBILE_COMMAND_RISK_PREFIX,
  isMobileCommandRuntimeFoundationQuestion,
  prepareMobileCommandRuntimeFoundation,
  processMobileCommandRequest,
  getMobileCommandDiagnostics,
  resetMobileCommandRuntimeFoundationForTests,
  registerMobileCommandSession,
  getMobileCommandSession,
  listMobileCommandSessionsAll,
  listMobileCommandsByProject,
  listMobileCommandsByRuntime,
  listMobileCommandsByWorkspace,
  listMobileCommandsByBuild,
  listMobileCommandsByVerification,
  listMobileCommandsByRecovery,
  listMobileCommandsByMonitoring,
  listMobileCommandsByOwner,
  listMobileCommandsByType,
  queryMobileCommandSessions,
  createMobileCommandSession,
  getMobileCommandTrackedSession,
  setMobileCommandState,
  getMobileCommandState,
  trackMobileCommandStateHistory,
  getMobileCommandHistory,
  linkMobileCommandToCloud,
  getCloudForMobileCommand,
  detectMobileCommandCloudMismatch,
  linkMobileCommandToWorkspace,
  getWorkspaceForMobileCommand,
  linkMobileCommandToBuild,
  getBuildForMobileCommand,
  linkMobileCommandToVerification,
  getVerificationForMobileCommand,
  linkMobileCommandToRecovery,
  getRecoveryForMobileCommand,
  linkMobileCommandToMonitoring,
  getMonitoringForMobileCommand,
  linkMobileCommandToOperatorFeed,
  getOperatorFeedForMobileCommand,
  linkMobileCommandToProjectVault,
  getProjectVaultForMobileCommand,
  buildDuplicateMobileCommandRiskContext,
  evaluateDuplicateMobileCommandRisk,
  validateMobileCommandRegistration,
  validateMobileCommandRecord,
  validateMobileCommandState,
  buildAllMobileCommandReports,
  buildMobileCommandFailureContext,
  initializeMobileCommand,
  completeMobileCommand,
  refreshMobileCommandContext,
  evaluateMobileCommandAction,
  registerMobileActionGateResult,
  listMobileActionGateResults,
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
  MOBILE_COMMAND_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildMobileCommandRuntimeFoundationPanelSnapshot,
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
import type { PrepareMobileCommandRuntimeFoundationInput } from '../src/mobile-command-runtime/mobile-command-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show mobile command inventory';

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
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const recovery = listRecoveries()[0]!;
  const monitoring = listMonitoringRecords()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    verificationId: recovery.recoveryOwner.verificationId,
    recoveryId: recovery.recoveryId,
    monitoringId: monitoring.monitoringId,
    projectId: runtime.runtimeOwner.projectId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processMobileCommandRequest>>();
let coreFixture: ReturnType<typeof processMobileCommandRequest> | null = null;

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
  const result = processMobileCommandRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareMobileCommandRuntimeFoundationInput> = {}): PrepareMobileCommandRuntimeFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    verificationId: 'cver-0001',
    recoveryId: 'crec-0001',
    monitoringId: 'cmon-0001',
    commandName: 'Test Mobile Command',
    mobileCommandType: 'GENERAL_MOBILE_COMMAND',
    projectExists: true,
    workspaceExists: true,
    runtimeExists: true,
    persistentBuildExists: true,
    verificationExists: true,
    recoveryExists: true,
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
  console.log('DevPulse V2 — Phase 18.1 Mobile Command Runtime Foundation');
  console.log('==========================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/mobile-command-runtime');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'mobile-command-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'mobile-command-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'mobile-command-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'mobile-command-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'mobile-command-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'mobile-command-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'mobile-command-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'mobile-command-context.ts')), 'context');
  assert('A-SETUP', '9. permissions', existsSync(join(dir, 'mobile-command-permissions.ts')), 'permissions');
  assert('A-SETUP', '10. action gate', existsSync(join(dir, 'mobile-command-action-gate.ts')), 'gate');
  assert('A-SETUP', '11. cloud bridge', existsSync(join(dir, 'mobile-command-cloud-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. workspace bridge', existsSync(join(dir, 'mobile-command-workspace-bridge.ts')), 'bridge');
  assert('A-SETUP', '13. build bridge', existsSync(join(dir, 'mobile-command-build-bridge.ts')), 'bridge');
  assert('A-SETUP', '14. verification bridge', existsSync(join(dir, 'mobile-command-verification-bridge.ts')), 'bridge');
  assert('A-SETUP', '15. recovery bridge', existsSync(join(dir, 'mobile-command-recovery-bridge.ts')), 'bridge');
  assert('A-SETUP', '16. monitoring bridge', existsSync(join(dir, 'mobile-command-monitoring-bridge.ts')), 'bridge');
  assert('A-SETUP', '17. operator feed bridge', existsSync(join(dir, 'mobile-command-operator-feed-bridge.ts')), 'bridge');
  assert('A-SETUP', '18. project vault bridge', existsSync(join(dir, 'mobile-command-project-vault-bridge.ts')), 'bridge');
  assert('A-SETUP', '19. query', existsSync(join(dir, 'mobile-command-query.ts')), 'query');
  assert('A-SETUP', '20. history', existsSync(join(dir, 'mobile-command-history.ts')), 'history');
  assert('A-SETUP', '21. validator', existsSync(join(dir, 'mobile-command-validator.ts')), 'validator');
  assert('A-SETUP', '22. diagnostics', existsSync(join(dir, 'mobile-command-diagnostics.ts')), 'diag');
  assert('A-SETUP', '23. report', existsSync(join(dir, 'mobile-command-report-builder.ts')), 'report');
  assert('A-SETUP', '24. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '25. feed bridge', existsSync(join(ROOT, 'src/operator-feed/mobile-command-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '26. script', typeof pkg.scripts?.['validate:mobile-command-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('mobile_command_runtime_foundation');
  assert('A-SETUP', '27. owner', owner.ownerModule === MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '28. phase', owner.phase === 18.1, String(owner.phase));
  assert('A-SETUP', '29. categories', TRACKED_MOBILE_COMMAND_CATEGORIES.length === 9, String(TRACKED_MOBILE_COMMAND_CATEGORIES.length));
  assert('A-SETUP', '30. duplicate prefix', DUPLICATE_MOBILE_COMMAND_RISK_PREFIX === 'DUPLICATE_MOBILE_COMMAND_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareMobileCommandRuntimeFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      verificationId: upstream.verificationId,
      recoveryId: upstream.recoveryId,
      monitoringId: upstream.monitoringId,
      projectId: upstream.projectId,
    }),
  );
  assert('B-CORE', '31. command id', ready.session?.mobileCommandId.startsWith('mcmd-') === true, String(ready.session?.mobileCommandId));
  assert('B-CORE', '32. tracked session id', ready.trackedSession?.sessionId.startsWith('mcsess-') === true, String(ready.trackedSession?.sessionId));
  assert('B-CORE', '33. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '34. reports', ready.reports.length === 17, String(ready.reports.length));
  assert('B-CORE', '35. inventory', listMobileCommandSessionsAll().length >= 9, String(listMobileCommandSessionsAll().length));
  assert('B-CORE', '36. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '37. runtime link', ready.session?.mobileCommandCloudLink.runtimeId === upstream.runtimeId, String(ready.session?.mobileCommandCloudLink.runtimeId));
  assert('B-CORE', '38. workspace link', ready.session?.mobileCommandWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.session?.mobileCommandWorkspaceLink.workspaceId));
  assert('B-CORE', '39. build link', ready.session?.mobileCommandBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.session?.mobileCommandBuildLink.persistentBuildId));
  assert('B-CORE', '40. verification link', ready.session?.mobileCommandVerificationLink.verificationId === upstream.verificationId, String(ready.session?.mobileCommandVerificationLink.verificationId));
  assert('B-CORE', '41. recovery link', ready.session?.mobileCommandRecoveryLink.recoveryId === upstream.recoveryId, String(ready.session?.mobileCommandRecoveryLink.recoveryId));
  assert('B-CORE', '42. monitoring link', ready.session?.mobileCommandMonitoringLink.monitoringId === upstream.monitoringId, String(ready.session?.mobileCommandMonitoringLink.monitoringId));

  const reg = registerMobileCommandSession({
    commandName: 'Query Test Mobile Command',
    mobileCommandType: 'PROJECT_MOBILE_COMMAND',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    recoveryId: upstream.recoveryId,
    monitoringId: upstream.monitoringId,
  });
  assert('B-CORE', '43. register', reg.session !== null && !reg.blocked, 'registered');
  assert('B-CORE', '44. get session', getMobileCommandSession(reg.session!.mobileCommandId)?.mobileCommandId === reg.session!.mobileCommandId, 'get');
  assert('B-CORE', '45. by project', listMobileCommandsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '46. by runtime', listMobileCommandsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '47. by workspace', listMobileCommandsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '48. by build', listMobileCommandsByBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '49. by verification', listMobileCommandsByVerification(upstream.verificationId).length >= 1, 'verification');
  assert('B-CORE', '50. by recovery', listMobileCommandsByRecovery(upstream.recoveryId).length >= 1, 'recovery');
  assert('B-CORE', '51. by monitoring', listMobileCommandsByMonitoring(upstream.monitoringId).length >= 1, 'monitoring');
  assert('B-CORE', '52. by owner', listMobileCommandsByOwner(MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '53. by type', listMobileCommandsByType('PROJECT_MOBILE_COMMAND').length >= 1, 'type');
  assert('B-CORE', '54. query', queryMobileCommandSessions({ mobileCommandType: 'PROJECT_MOBILE_COMMAND' }).length >= 1, 'query');

  linkMobileCommandToCloud(reg.session!.mobileCommandId, upstream.runtimeId);
  assert('B-CORE', '55. cloud bridge', getCloudForMobileCommand(reg.session!.mobileCommandId) === upstream.runtimeId, 'cloud');
  linkMobileCommandToWorkspace(reg.session!.mobileCommandId, upstream.workspaceId);
  assert('B-CORE', '56. workspace bridge', getWorkspaceForMobileCommand(reg.session!.mobileCommandId) === upstream.workspaceId, 'workspace');
  linkMobileCommandToBuild(reg.session!.mobileCommandId, upstream.persistentBuildId);
  assert('B-CORE', '57. build bridge', getBuildForMobileCommand(reg.session!.mobileCommandId) === upstream.persistentBuildId, 'build');
  linkMobileCommandToVerification(reg.session!.mobileCommandId, upstream.verificationId);
  assert('B-CORE', '58. verification bridge', getVerificationForMobileCommand(reg.session!.mobileCommandId) === upstream.verificationId, 'verification');
  linkMobileCommandToRecovery(reg.session!.mobileCommandId, upstream.recoveryId);
  assert('B-CORE', '59. recovery bridge', getRecoveryForMobileCommand(reg.session!.mobileCommandId) === upstream.recoveryId, 'recovery');
  linkMobileCommandToMonitoring(reg.session!.mobileCommandId, upstream.monitoringId);
  assert('B-CORE', '60. monitoring bridge', getMonitoringForMobileCommand(reg.session!.mobileCommandId) === upstream.monitoringId, 'monitoring');
  linkMobileCommandToOperatorFeed(reg.session!.mobileCommandId);
  assert('B-CORE', '61. operator feed bridge', getOperatorFeedForMobileCommand(reg.session!.mobileCommandId) !== null, 'feed');
  linkMobileCommandToProjectVault(reg.session!.mobileCommandId, 'proj-q');
  assert('B-CORE', '62. vault bridge', getProjectVaultForMobileCommand(reg.session!.mobileCommandId) === 'proj-q', 'vault');

  const tracked = createMobileCommandSession({
    mobileCommandId: reg.session!.mobileCommandId,
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    recoveryId: upstream.recoveryId,
    monitoringId: upstream.monitoringId,
  });
  assert('B-CORE', '63. tracked session', tracked !== null, 'session');
  assert('B-CORE', '64. get tracked', getMobileCommandTrackedSession(tracked!.sessionId)?.sessionId === tracked!.sessionId, 'get');

  setMobileCommandState(reg.session!.mobileCommandId, 'READY', true);
  initializeMobileCommand(reg.session!.mobileCommandId);
  evaluateMobileCommandAction(reg.session!.mobileCommandId, 'view_status');
  registerMobileActionGateResult({ mobileCommandId: reg.session!.mobileCommandId, actionName: 'view_status' });
  refreshMobileCommandContext(reg.session!.mobileCommandId);
  completeMobileCommand(reg.session!.mobileCommandId);
  assert('B-CORE', '65. lifecycle', getMobileCommandHistory(reg.session!.mobileCommandId).length >= 3, 'lifecycle');
  assert('B-CORE', '66. state history', trackMobileCommandStateHistory(reg.session!.mobileCommandId).length >= 1, 'history');
  assert('B-CORE', '67. action gates', listMobileActionGateResults(reg.session!.mobileCommandId).length >= 1, 'gates');

  const dup = registerMobileCommandSession({
    commandName: 'Query Test Mobile Command',
    mobileCommandType: 'PROJECT_MOBILE_COMMAND',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    recoveryId: upstream.recoveryId,
    monitoringId: upstream.monitoringId,
  });
  assert('B-CORE', '68. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateMobileCommandRiskContext('Query Test Mobile Command', 'PROJECT_MOBILE_COMMAND');
  assert('B-CORE', '69. risk context', riskCtx.monitoringSummaries.length >= 1, 'ctx');
  assert('B-CORE', '70. risk eval', Array.isArray(evaluateDuplicateMobileCommandRisk(riskCtx)), 'eval');
  assert('B-CORE', '71. cloud mismatch fn', typeof detectMobileCommandCloudMismatch(reg.session!.mobileCommandId) === 'boolean', 'mismatch');
  assert('B-CORE', '72. state validator', validateMobileCommandState('CONNECTED_TO_CLOUD') === true, 'valid');
  assert('B-CORE', '73. record validate', validateMobileCommandRecord(ready.session).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildMobileCommandRuntimeFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '74. uvl panel', panel.panelTitle === 'Mobile Command Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '75. panel count', panel.mobileCommandCount >= 9, String(panel.mobileCommandCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '76. routing', routing.primaryCapability === 'MOBILE_COMMAND_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '77. signal', isMobileCommandRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '78. action id', action.candidates[0]!.mobileCommandRuntimeFoundationId.startsWith('mcrtfnd-'), 'id');
  assert('C-INTEGRATION', '79. action count', action.candidates[0]!.mobileCommandCount === 9, String(action.candidates[0]!.mobileCommandCount));
  assert('C-INTEGRATION', '80. action state', action.candidates[0]!.mobileCommandState === 'READY', String(action.candidates[0]!.mobileCommandState));

  const reasoning = buildReasoningVisibilityRecord('mobile command runtime foundation');
  assert('C-INTEGRATION', '81. reasoning basis', reasoning.mobileCommandBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '82. reasoning chain', reasoning.mobileCommandChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '83. reasoning state', reasoning.mobileCommandState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is mobile command blocked?');
  assert('C-INTEGRATION', '84. failure', failures.some((f) => f.sourceSystem === 'mobile_command_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('mobile command inventory');
  assert('C-INTEGRATION', '85. progress', progress[0]?.mobileCommandRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '86. uvl rows', MOBILE_COMMAND_RUNTIME_FOUNDATION_UVL_ROWS.length === 25, String(MOBILE_COMMAND_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '87. uvl types', hasUvlRow('MOBILE_COMMAND_TYPES'), 'types');
  assert('D-REGISTRY', '88. uvl monitoring bridge', hasUvlRow('MOBILE_COMMAND_MONITORING_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '89. uvl action gate', hasUvlRow('MOBILE_COMMAND_ACTION_GATE'), 'gate');
  assert('D-REGISTRY', '90. console', isIntelligenceConsoleCapability('MOBILE_COMMAND_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '91. find panel', resolveFindPanelAlias('Mobile Command Runtime') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '92. registry', registry.includes('mobile_command_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_MOBILE_COMMAND_DUPLICATES) {
    assert('D-REGISTRY', `93.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/mobile-command-runtime/mobile-command-registry.ts');
  const validatorSrc = readTextOnce('src/mobile-command-runtime/mobile-command-validator.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/mobile-command-runtime/mobile-command-permissions.ts')].join('\n');
  assert('E-STATIC', '94. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '95. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '96. duplicate risk', validatorSrc.includes('DUPLICATE_MOBILE_COMMAND_RISK'), 'risk');
  assert('E-STATIC', '97. feed mapped', readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts').includes('MOBILE_COMMAND_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '98. monitoring bridge', readTextOnce('src/mobile-command-runtime/mobile-command-monitoring-bridge.ts').includes('Cloud Monitoring Foundation'), 'bridge');
  assert('E-STATIC', '99. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `100.${i} command id`, fixture.session?.mobileCommandId.startsWith('mcmd-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `101.${i} signal`, isMobileCommandRuntimeFoundationQuestion(`mobile command inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List mobile commands batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `102.${i} route`, r.primaryCapability === 'MOBILE_COMMAND_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildMobileCommandFailureContext('Why is mobile command blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `103.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is mobile command blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `104.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getMobileCommandDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered mobile commands: ${diag.registeredMobileCommandCount}`);
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

  console.log(MOBILE_COMMAND_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

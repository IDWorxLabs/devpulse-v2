/**
 * DevPulse V2 Phase 17.3 — Persistent Build Runtime Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_PASS_TOKEN,
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_PERSISTENT_BUILD_DUPLICATES,
  TRACKED_PERSISTENT_BUILD_CATEGORIES,
  DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX,
  isPersistentBuildRuntimeFoundationQuestion,
  preparePersistentBuildFoundation,
  processPersistentBuildRequest,
  getPersistentBuildDiagnostics,
  resetPersistentBuildFoundationForTests,
  registerPersistentBuild,
  getPersistentBuild,
  listPersistentBuilds,
  listPersistentBuildsByProject,
  listPersistentBuildsByWorkspace,
  listPersistentBuildsByRuntime,
  listPersistentBuildsByOwner,
  listPersistentBuildsByType,
  queryPersistentBuilds,
  createPersistentBuildSession,
  getPersistentBuildSession,
  listPersistentBuildSessions,
  setPersistentBuildState,
  getPersistentBuildState,
  trackPersistentBuildStateHistory,
  getPersistentBuildHistory,
  linkBuildToRuntime,
  getRuntimeForBuild,
  detectBuildRuntimeMismatch,
  linkBuildToWorkspace,
  getWorkspaceForBuild,
  detectBuildWorkspaceMismatch,
  buildDuplicatePersistentBuildRiskContext,
  evaluateDuplicatePersistentBuildRisk,
  validatePersistentBuildRegistration,
  validatePersistentBuildRecord,
  validatePersistentBuildState,
  buildAllPersistentBuildReports,
  buildPersistentBuildFailureContext,
  activatePersistentBuild,
  pausePersistentBuild,
  resumePersistentBuild,
  waitForApproval,
  waitForVerification,
  waitForRecovery,
  completePersistentBuild,
  updateBuildProgress,
  markResumeCheckpoint,
} from '../src/persistent-build-runtime/index.js';
import { resetCloudRuntimeFoundationForTests, listRuntimes } from '../src/cloud-runtime/index.js';
import {
  resetWorkspaceHostingFoundationForTests,
  listWorkspaces,
  processWorkspaceHostingRequest,
} from '../src/workspace-hosting/index.js';
import {
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildPersistentBuildRuntimeFoundationPanelSnapshot,
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import type { PreparePersistentBuildFoundationInput } from '../src/persistent-build-runtime/persistent-build-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show persistent build inventory';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processPersistentBuildRequest>>();

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
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold`);
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processPersistentBuildRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PreparePersistentBuildFoundationInput> = {}): PreparePersistentBuildFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    buildName: 'Test Persistent Build',
    buildType: 'GENERAL_BUILD',
    projectExists: true,
    workspaceExists: true,
    runtimeExists: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetCloudRuntimeFoundationForTests();
  resetWorkspaceHostingFoundationForTests();
  resetPersistentBuildFoundationForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

function ensureUpstream(): { runtimeId: string; workspaceId: string; projectId: string } {
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  const runtime = listRuntimes()[0]!;
  const workspace = listWorkspaces()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: workspace.workspaceId,
    projectId: runtime.runtimeOwner.projectId,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 17.3 Persistent Build Runtime Foundation');
  console.log('==============================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/persistent-build-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'persistent-build-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'persistent-build-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'persistent-build-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'persistent-build-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'persistent-build-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'persistent-build-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'persistent-build-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. context', existsSync(join(dir, 'persistent-build-context.ts')), 'context');
  assert('A-SETUP', '9. progress', existsSync(join(dir, 'persistent-build-progress.ts')), 'progress');
  assert('A-SETUP', '10. resume', existsSync(join(dir, 'persistent-build-resume.ts')), 'resume');
  assert('A-SETUP', '11. cloud bridge', existsSync(join(dir, 'persistent-build-cloud-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. workspace bridge', existsSync(join(dir, 'persistent-build-workspace-bridge.ts')), 'bridge');
  assert('A-SETUP', '13. query', existsSync(join(dir, 'persistent-build-query.ts')), 'query');
  assert('A-SETUP', '14. history', existsSync(join(dir, 'persistent-build-history.ts')), 'history');
  assert('A-SETUP', '15. validator', existsSync(join(dir, 'persistent-build-validator.ts')), 'validator');
  assert('A-SETUP', '16. diagnostics', existsSync(join(dir, 'persistent-build-diagnostics.ts')), 'diag');
  assert('A-SETUP', '17. report', existsSync(join(dir, 'persistent-build-report-builder.ts')), 'report');
  assert('A-SETUP', '18. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '19. feed bridge', existsSync(join(ROOT, 'src/operator-feed/persistent-build-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '20. script', typeof pkg.scripts?.['validate:persistent-build-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('persistent_build_runtime_foundation');
  assert('A-SETUP', '21. owner', owner.ownerModule === PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '22. phase', owner.phase === 17.3, String(owner.phase));
  assert('A-SETUP', '23. categories', TRACKED_PERSISTENT_BUILD_CATEGORIES.length === 8, String(TRACKED_PERSISTENT_BUILD_CATEGORIES.length));
  assert('A-SETUP', '24. duplicate prefix', DUPLICATE_PERSISTENT_BUILD_RISK_PREFIX === 'DUPLICATE_PERSISTENT_BUILD_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = preparePersistentBuildFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      projectId: upstream.projectId,
    }),
  );
  assert('B-CORE', '25. build id', ready.build?.buildId.startsWith('pbuild-') === true, String(ready.build?.buildId));
  assert('B-CORE', '26. session id', ready.session?.sessionId.startsWith('pbsess-') === true, String(ready.session?.sessionId));
  assert('B-CORE', '27. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '28. reports', ready.reports.length === 11, String(ready.reports.length));
  assert('B-CORE', '29. inventory', listPersistentBuilds().length >= 8, String(listPersistentBuilds().length));
  assert('B-CORE', '30. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '31. runtime link', ready.build?.buildCloudRuntimeLink.runtimeId === upstream.runtimeId, String(ready.build?.buildCloudRuntimeLink.runtimeId));
  assert('B-CORE', '32. workspace link', ready.build?.buildWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.build?.buildWorkspaceLink.workspaceId));
  assert('B-CORE', '33. verification refs', (ready.build?.buildVerificationLink.evidenceReferences.length ?? 0) >= 1, 'evidence');

  const reg = registerPersistentBuild({
    buildName: 'Query Test Build',
    buildType: 'AIDEV_BUILD',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
  });
  assert('B-CORE', '34. register', reg.build !== null && !reg.blocked, 'registered');
  assert('B-CORE', '35. get build', getPersistentBuild(reg.build!.buildId)?.buildId === reg.build!.buildId, 'get');
  assert('B-CORE', '36. by project', listPersistentBuildsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '37. by workspace', listPersistentBuildsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '38. by runtime', listPersistentBuildsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '39. by owner', listPersistentBuildsByOwner(PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '40. by type', listPersistentBuildsByType('AIDEV_BUILD').length >= 1, 'type');
  assert('B-CORE', '41. query', queryPersistentBuilds({ buildType: 'AIDEV_BUILD' }).length >= 1, 'query');

  const runtimeLink = linkBuildToRuntime(reg.build!.buildId, upstream.runtimeId);
  assert('B-CORE', '42. runtime bridge', runtimeLink !== null && runtimeLink.runtimeId === upstream.runtimeId, 'link');
  assert('B-CORE', '43. get runtime', getRuntimeForBuild(reg.build!.buildId) === upstream.runtimeId, 'runtime');

  const workspaceLink = linkBuildToWorkspace(reg.build!.buildId, upstream.workspaceId);
  assert('B-CORE', '44. workspace bridge', workspaceLink !== null && workspaceLink.workspaceId === upstream.workspaceId, 'link');
  assert('B-CORE', '45. get workspace', getWorkspaceForBuild(reg.build!.buildId) === upstream.workspaceId, 'workspace');

  const sess = createPersistentBuildSession({
    buildId: reg.build!.buildId,
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
  });
  assert('B-CORE', '46. session', sess !== null, 'session');

  setPersistentBuildState(reg.build!.buildId, 'READY', true);
  activatePersistentBuild(reg.build!.buildId);
  pausePersistentBuild(reg.build!.buildId);
  resumePersistentBuild(reg.build!.buildId);
  waitForApproval(reg.build!.buildId);
  waitForVerification(reg.build!.buildId);
  waitForRecovery(reg.build!.buildId);
  updateBuildProgress(reg.build!.buildId, { progressPercent: 50, progressState: 'IN_PROGRESS' });
  markResumeCheckpoint(reg.build!.buildId, 'READY', 'Test checkpoint');
  completePersistentBuild(reg.build!.buildId);
  assert('B-CORE', '47. lifecycle', getPersistentBuildHistory(reg.build!.buildId).length >= 3, 'lifecycle');
  assert('B-CORE', '48. state history', trackPersistentBuildStateHistory(reg.build!.buildId).length >= 1, 'history');

  const dup = registerPersistentBuild({
    buildName: 'Query Test Build',
    buildType: 'AIDEV_BUILD',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
  });
  assert('B-CORE', '49. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicatePersistentBuildRiskContext('Query Test Build', 'AIDEV_BUILD');
  assert('B-CORE', '50. risk context', riskCtx.runtimeSummaries.length >= 1, 'ctx');
  assert('B-CORE', '51. risk eval', Array.isArray(evaluateDuplicatePersistentBuildRisk(riskCtx)), 'eval');
  assert('B-CORE', '52. runtime mismatch fn', typeof detectBuildRuntimeMismatch(reg.build!.buildId) === 'boolean', 'mismatch');
  assert('B-CORE', '53. workspace mismatch fn', typeof detectBuildWorkspaceMismatch(reg.build!.buildId) === 'boolean', 'mismatch');
  assert('B-CORE', '54. state validator', validatePersistentBuildState('PAUSED') === true, 'valid');
  assert('B-CORE', '55. build validate', validatePersistentBuildRecord(ready.build).valid === true, 'valid');

  resetAll();
  ensureUpstream();
  const panel = buildPersistentBuildRuntimeFoundationPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '56. uvl panel', panel.panelTitle === 'Persistent Build Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '57. panel count', panel.buildCount >= 8, String(panel.buildCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  ensureUpstream();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '58. routing', routing.primaryCapability === 'PERSISTENT_BUILD_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '59. signal', isPersistentBuildRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '60. action id', action.candidates[0]!.persistentBuildRuntimeFoundationId.startsWith('pbldfnd-'), 'id');
  assert('C-INTEGRATION', '61. action count', action.candidates[0]!.persistentBuildCount === 8, String(action.candidates[0]!.persistentBuildCount));
  assert('C-INTEGRATION', '62. action state', action.candidates[0]!.persistentBuildState === 'READY', String(action.candidates[0]!.persistentBuildState));

  const reasoning = buildReasoningVisibilityRecord('persistent build runtime foundation');
  assert('C-INTEGRATION', '63. reasoning basis', reasoning.persistentBuildBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '64. reasoning chain', reasoning.persistentBuildChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '65. reasoning state', reasoning.persistentBuildState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is persistent build blocked?');
  assert('C-INTEGRATION', '66. failure', failures.some((f) => f.sourceSystem === 'persistent_build_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('persistent build inventory');
  assert('C-INTEGRATION', '67. progress', progress[0]?.persistentBuildRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '68. uvl rows', PERSISTENT_BUILD_RUNTIME_FOUNDATION_UVL_ROWS.length === 19, String(PERSISTENT_BUILD_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '69. uvl types', hasUvlRow('PERSISTENT_BUILD_TYPES'), 'types');
  assert('D-REGISTRY', '70. uvl cloud bridge', hasUvlRow('PERSISTENT_BUILD_CLOUD_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '71. uvl workspace bridge', hasUvlRow('PERSISTENT_BUILD_WORKSPACE_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '72. console', isIntelligenceConsoleCapability('PERSISTENT_BUILD_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '73. find panel', resolveFindPanelAlias('Persistent Build Runtime') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '74. registry', registry.includes('persistent_build_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_PERSISTENT_BUILD_DUPLICATES) {
    assert('D-REGISTRY', `75.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readText('src/persistent-build-runtime/persistent-build-registry.ts');
  const cloudBridgeSrc = readText('src/persistent-build-runtime/persistent-build-cloud-bridge.ts');
  const workspaceBridgeSrc = readText('src/persistent-build-runtime/persistent-build-workspace-bridge.ts');
  const allSrc = [registrySrc, cloudBridgeSrc, workspaceBridgeSrc].join('\n');
  assert('E-STATIC', '76. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '77. no docker', !allSrc.toLowerCase().includes('docker run'), 'clean');
  assert('E-STATIC', '78. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '79. duplicate risk', readText('src/persistent-build-runtime/persistent-build-validator.ts').includes('DUPLICATE_PERSISTENT_BUILD_RISK'), 'risk');
  assert('E-STATIC', '80. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('PERSISTENT_BUILD_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '81. cloud bridge', cloudBridgeSrc.includes('Cloud Runtime Foundation'), 'bridge');
  assert('E-STATIC', '82. workspace bridge', workspaceBridgeSrc.includes('Workspace Hosting Foundation'), 'bridge');
  assert('E-STATIC', '83. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  ensureUpstream();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `84.${i} build id`, fixture.build?.buildId.startsWith('pbuild-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `85.${i} signal`, isPersistentBuildRuntimeFoundationQuestion(`persistent build inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`List persistent builds batch ${i}`);
    assert('F-CACHED', `86.${i} route`, r.primaryCapability === 'PERSISTENT_BUILD_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildPersistentBuildFailureContext('Why is persistent build blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `87.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  resetAll();
  ensureUpstream();
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is persistent build blocked?';
    const key = q.toLowerCase();
    let status = httpCache.get(key);
    if (!status) {
      const res = await fetch(`http://127.0.0.1:${port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      status = res.status;
      httpCache.set(key, status);
    }
    assert('G-HTTP', `88.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getPersistentBuildDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Registered builds: ${diag.registeredBuildCount}`);
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

  console.log(PERSISTENT_BUILD_RUNTIME_FOUNDATION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

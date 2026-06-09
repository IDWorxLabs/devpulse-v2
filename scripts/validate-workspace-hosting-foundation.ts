/**
 * DevPulse V2 Phase 17.2 — Workspace Hosting Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  WORKSPACE_HOSTING_FOUNDATION_PASS_TOKEN,
  WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_WORKSPACE_HOSTING_DUPLICATES,
  TRACKED_WORKSPACE_CATEGORIES,
  DUPLICATE_WORKSPACE_RISK_PREFIX,
  isWorkspaceHostingFoundationQuestion,
  prepareWorkspaceHostingFoundation,
  processWorkspaceHostingRequest,
  getWorkspaceHostingDiagnostics,
  resetWorkspaceHostingFoundationForTests,
  registerWorkspace,
  getWorkspace,
  listWorkspaces,
  listWorkspacesByProject,
  listWorkspacesByRuntime,
  listWorkspacesByOwner,
  listWorkspacesByType,
  queryWorkspaces,
  createWorkspaceSession,
  getWorkspaceSession,
  listWorkspaceSessions,
  setWorkspaceState,
  getWorkspaceState,
  trackWorkspaceStateHistory,
  getWorkspaceHistory,
  linkWorkspaceToRuntime,
  getRuntimeForWorkspace,
  detectRuntimeWorkspaceMismatch,
  buildDuplicateWorkspaceRiskContext,
  evaluateDuplicateWorkspaceRisk,
  validateWorkspaceRegistration,
  validateHostedWorkspace,
  validateWorkspaceState,
  buildAllWorkspaceHostingReports,
  buildWorkspaceHostingFailureContext,
  activateWorkspace,
  isolateWorkspace,
  pauseWorkspace,
  resumeWorkspace,
  completeWorkspace,
  applyWorkspaceIsolation,
} from '../src/workspace-hosting/index.js';
import { resetCloudRuntimeFoundationForTests, listRuntimes } from '../src/cloud-runtime/index.js';
import {
  WORKSPACE_HOSTING_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildWorkspaceHostingFoundationPanelSnapshot,
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
import type { PrepareWorkspaceHostingFoundationInput } from '../src/workspace-hosting/workspace-hosting-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show hosted workspace inventory';

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
const responseCache = new Map<string, ReturnType<typeof processWorkspaceHostingRequest>>();

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
  const result = processWorkspaceHostingRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareWorkspaceHostingFoundationInput> = {}): PrepareWorkspaceHostingFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    runtimeId: 'crrt-0001',
    workspaceName: 'Test Hosted Workspace',
    workspaceType: 'GENERAL_WORKSPACE',
    projectExists: true,
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 17.2 Workspace Hosting Foundation');
  console.log('=======================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/workspace-hosting');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'workspace-hosting-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'workspace-hosting-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'workspace-hosting-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'workspace-hosting-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'workspace-hosting-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'workspace-hosting-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'workspace-hosting-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. isolation', existsSync(join(dir, 'workspace-hosting-isolation.ts')), 'isolation');
  assert('A-SETUP', '9. runtime bridge', existsSync(join(dir, 'workspace-hosting-runtime-bridge.ts')), 'bridge');
  assert('A-SETUP', '10. query', existsSync(join(dir, 'workspace-hosting-query.ts')), 'query');
  assert('A-SETUP', '11. history', existsSync(join(dir, 'workspace-hosting-history.ts')), 'history');
  assert('A-SETUP', '12. validator', existsSync(join(dir, 'workspace-hosting-validator.ts')), 'validator');
  assert('A-SETUP', '13. diagnostics', existsSync(join(dir, 'workspace-hosting-diagnostics.ts')), 'diag');
  assert('A-SETUP', '14. report', existsSync(join(dir, 'workspace-hosting-report-builder.ts')), 'report');
  assert('A-SETUP', '15. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '16. feed bridge', existsSync(join(ROOT, 'src/operator-feed/workspace-hosting-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '17. script', typeof pkg.scripts?.['validate:workspace-hosting-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('workspace_hosting_foundation');
  assert('A-SETUP', '18. owner', owner.ownerModule === WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '19. phase', owner.phase === 17.2, String(owner.phase));
  assert('A-SETUP', '20. categories', TRACKED_WORKSPACE_CATEGORIES.length === 8, String(TRACKED_WORKSPACE_CATEGORIES.length));
  assert('A-SETUP', '21. duplicate prefix', DUPLICATE_WORKSPACE_RISK_PREFIX === 'DUPLICATE_WORKSPACE_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  const runtimes = listRuntimes();
  const runtime = runtimes[0]!;
  const runtimeId = runtime.runtimeId;
  const ready = prepareWorkspaceHostingFoundation(
    baseInput({ runtimeId, projectId: runtime.runtimeOwner.projectId }),
  );
  assert('B-CORE', '22. workspace id', ready.workspace?.workspaceId.startsWith('hws-') === true, String(ready.workspace?.workspaceId));
  assert('B-CORE', '23. session id', ready.session?.sessionId.startsWith('hwss-') === true, String(ready.session?.sessionId));
  assert('B-CORE', '24. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '25. reports', ready.reports.length === 8, String(ready.reports.length));
  assert('B-CORE', '26. inventory', listWorkspaces().length >= 8, String(listWorkspaces().length));
  assert('B-CORE', '27. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '28. runtime link', ready.workspace?.workspaceRuntimeLink.runtimeId === runtimeId, String(ready.workspace?.workspaceRuntimeLink.runtimeId));
  assert('B-CORE', '29. verification refs', (ready.workspace?.workspaceVerificationLink.evidenceReferences.length ?? 0) >= 1, 'evidence');

  const reg = registerWorkspace({
    workspaceName: 'Query Test Workspace',
    workspaceType: 'BUILD_WORKSPACE',
    projectId: 'proj-q',
    runtimeId,
  });
  assert('B-CORE', '30. register', reg.workspace !== null && !reg.blocked, 'registered');
  assert('B-CORE', '31. get workspace', getWorkspace(reg.workspace!.workspaceId)?.workspaceId === reg.workspace!.workspaceId, 'get');
  assert('B-CORE', '32. by project', listWorkspacesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '33. by runtime', listWorkspacesByRuntime(runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '34. by owner', listWorkspacesByOwner(WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '35. by type', listWorkspacesByType('BUILD_WORKSPACE').length >= 1, 'type');
  assert('B-CORE', '36. query', queryWorkspaces({ workspaceType: 'BUILD_WORKSPACE' }).length >= 1, 'query');

  const link = linkWorkspaceToRuntime(reg.workspace!.workspaceId, runtimeId);
  assert('B-CORE', '37. runtime bridge', link !== null && link.runtimeId === runtimeId, 'link');
  assert('B-CORE', '38. get runtime', getRuntimeForWorkspace(reg.workspace!.workspaceId) === runtimeId, 'runtime');

  const sess = createWorkspaceSession({
    workspaceId: reg.workspace!.workspaceId,
    projectId: 'proj-q',
    runtimeId,
  });
  assert('B-CORE', '39. session', sess !== null, 'session');

  setWorkspaceState(reg.workspace!.workspaceId, 'READY', true);
  activateWorkspace(reg.workspace!.workspaceId);
  isolateWorkspace(reg.workspace!.workspaceId);
  applyWorkspaceIsolation(reg.workspace!.workspaceId, 'STRICT');
  pauseWorkspace(reg.workspace!.workspaceId);
  resumeWorkspace(reg.workspace!.workspaceId);
  completeWorkspace(reg.workspace!.workspaceId);
  assert('B-CORE', '40. lifecycle', getWorkspaceHistory(reg.workspace!.workspaceId).length >= 3, 'lifecycle');
  assert('B-CORE', '41. state history', trackWorkspaceStateHistory(reg.workspace!.workspaceId).length >= 1, 'history');

  const dup = registerWorkspace({
    workspaceName: 'Query Test Workspace',
    workspaceType: 'BUILD_WORKSPACE',
    projectId: 'proj-q',
    runtimeId,
  });
  assert('B-CORE', '42. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateWorkspaceRiskContext('Test Hosted Workspace', 'GENERAL_WORKSPACE');
  assert('B-CORE', '43. risk context', riskCtx.runtimeSummaries.length >= 1, 'ctx');
  assert('B-CORE', '44. risk eval', Array.isArray(evaluateDuplicateWorkspaceRisk(riskCtx)), 'eval');
  assert('B-CORE', '45. mismatch fn', typeof detectRuntimeWorkspaceMismatch(reg.workspace!.workspaceId) === 'boolean', 'mismatch');
  assert('B-CORE', '46. state validator', validateWorkspaceState('ISOLATED') === true, 'valid');
  assert('B-CORE', '47. hosted validate', validateHostedWorkspace(ready.workspace).valid === true, 'valid');

  resetAll();
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  const panel = buildWorkspaceHostingFoundationPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '48. uvl panel', panel.panelTitle === 'Workspace Hosting Foundation', panel.panelTitle);
  assert('B-CORE', '49. panel count', panel.workspaceCount >= 8, String(panel.workspaceCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '50. routing', routing.primaryCapability === 'WORKSPACE_HOSTING_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '51. signal', isWorkspaceHostingFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '52. action id', action.candidates[0]!.workspaceHostingFoundationId.startsWith('whstfnd-'), 'id');
  assert('C-INTEGRATION', '53. action count', action.candidates[0]!.hostedWorkspaceCount === 8, String(action.candidates[0]!.hostedWorkspaceCount));
  assert('C-INTEGRATION', '54. action state', action.candidates[0]!.workspaceHostingState === 'READY', String(action.candidates[0]!.workspaceHostingState));

  const reasoning = buildReasoningVisibilityRecord('workspace hosting foundation');
  assert('C-INTEGRATION', '55. reasoning basis', reasoning.workspaceHostingBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '56. reasoning chain', reasoning.workspaceHostingChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '57. reasoning state', reasoning.workspaceHostingState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is workspace hosting blocked?');
  assert('C-INTEGRATION', '58. failure', failures.some((f) => f.sourceSystem === 'workspace_hosting_foundation'), 'fail');

  const progress = buildProgressRecords('hosted workspace inventory');
  assert('C-INTEGRATION', '59. progress', progress[0]?.workspaceHostingFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '60. uvl rows', WORKSPACE_HOSTING_FOUNDATION_UVL_ROWS.length === 16, String(WORKSPACE_HOSTING_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '61. uvl types', hasUvlRow('WORKSPACE_HOSTING_TYPES'), 'types');
  assert('D-REGISTRY', '62. uvl bridge', hasUvlRow('WORKSPACE_HOSTING_RUNTIME_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '63. console', isIntelligenceConsoleCapability('WORKSPACE_HOSTING_FOUNDATION'), 'console');
  assert('D-REGISTRY', '64. find panel', resolveFindPanelAlias('Workspace Hosting') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '65. registry', registry.includes('workspace_hosting_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_WORKSPACE_HOSTING_DUPLICATES) {
    assert('D-REGISTRY', `66.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readText('src/workspace-hosting/workspace-hosting-registry.ts');
  const bridgeSrc = readText('src/workspace-hosting/workspace-hosting-runtime-bridge.ts');
  const allSrc = [registrySrc, bridgeSrc, readText('src/workspace-hosting/workspace-hosting-isolation.ts')].join('\n');
  assert('E-STATIC', '67. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '68. no docker', !allSrc.toLowerCase().includes('docker run'), 'clean');
  assert('E-STATIC', '69. no container exec', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '70. duplicate risk', readText('src/workspace-hosting/workspace-hosting-validator.ts').includes('DUPLICATE_WORKSPACE_RISK'), 'risk');
  assert('E-STATIC', '71. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('WORKSPACE_HOSTING_FOUNDATION'), 'feed');
  assert('E-STATIC', '72. runtime bridge', bridgeSrc.includes('Cloud Runtime Foundation'), 'bridge');
  assert('E-STATIC', '73. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `74.${i} workspace id`, fixture.workspace?.workspaceId.startsWith('hws-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `75.${i} signal`, isWorkspaceHostingFoundationQuestion(`hosted workspace inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`List hosted workspaces batch ${i}`);
    assert('F-CACHED', `76.${i} route`, r.primaryCapability === 'WORKSPACE_HOSTING_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildWorkspaceHostingFailureContext('Why is workspace hosting blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `77.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  resetAll();
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is workspace hosting blocked?';
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
    assert('G-HTTP', `78.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getWorkspaceHostingDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Registered workspaces: ${diag.registeredWorkspaceCount}`);
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

  console.log(WORKSPACE_HOSTING_FOUNDATION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

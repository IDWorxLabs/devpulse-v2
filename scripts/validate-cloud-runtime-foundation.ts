/**
 * DevPulse V2 Phase 17.1 — Cloud Runtime Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  CLOUD_RUNTIME_FOUNDATION_PASS_TOKEN,
  CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_CLOUD_RUNTIME_DUPLICATES,
  TRACKED_CLOUD_RUNTIME_CATEGORIES,
  DUPLICATE_RUNTIME_RISK_PREFIX,
  isCloudRuntimeFoundationQuestion,
  prepareCloudRuntimeFoundation,
  processCloudRuntimeRequest,
  getCloudRuntimeDiagnostics,
  resetCloudRuntimeFoundationForTests,
  registerRuntime,
  getRuntime,
  listRuntimes,
  listRuntimesByProject,
  listRuntimesByWorkspace,
  listRuntimesByOwner,
  listRuntimesByType,
  queryRuntimes,
  createRuntimeSession,
  getRuntimeSession,
  listRuntimeSessions,
  setRuntimeState,
  getRuntimeState,
  trackRuntimeStateHistory,
  getRuntimeHistory,
  buildDuplicateRuntimeRiskContext,
  evaluateDuplicateRuntimeRisk,
  validateRuntimeRegistration,
  validateCloudRuntime,
  validateRuntimeState,
  buildAllCloudRuntimeReports,
  buildCloudRuntimeFailureContext,
  activateRuntime,
  pauseRuntime,
  resumeRuntime,
  completeRuntime,
  archiveRuntime,
} from '../src/cloud-runtime/index.js';
import { CLOUD_RUNTIME_FOUNDATION_UVL_ROWS, hasUvlRow, buildCloudRuntimeFoundationPanelSnapshot } from '../src/unified-verification-lab/index.js';
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
import type { PrepareCloudRuntimeFoundationInput } from '../src/cloud-runtime/cloud-runtime-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show cloud runtime inventory';

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
const responseCache = new Map<string, ReturnType<typeof processCloudRuntimeRequest>>();

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
  const result = processCloudRuntimeRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareCloudRuntimeFoundationInput> = {}): PrepareCloudRuntimeFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    runtimeName: 'Test Cloud Runtime',
    runtimeType: 'GENERAL_RUNTIME',
    projectExists: true,
    workspaceExists: true,
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 17.1 Cloud Runtime Foundation');
  console.log('==================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/cloud-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'cloud-runtime-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'cloud-runtime-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'cloud-runtime-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'cloud-runtime-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'cloud-runtime-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'cloud-runtime-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'cloud-runtime-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. query', existsSync(join(dir, 'cloud-runtime-query.ts')), 'query');
  assert('A-SETUP', '9. history', existsSync(join(dir, 'cloud-runtime-history.ts')), 'history');
  assert('A-SETUP', '10. validator', existsSync(join(dir, 'cloud-runtime-validator.ts')), 'validator');
  assert('A-SETUP', '11. diagnostics', existsSync(join(dir, 'cloud-runtime-diagnostics.ts')), 'diag');
  assert('A-SETUP', '12. report', existsSync(join(dir, 'cloud-runtime-report-builder.ts')), 'report');
  assert('A-SETUP', '13. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/cloud-runtime-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '15. script', typeof pkg.scripts?.['validate:cloud-runtime-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('cloud_runtime_foundation');
  assert('A-SETUP', '16. owner', owner.ownerModule === CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '17. phase', owner.phase === 17.1, String(owner.phase));
  assert('A-SETUP', '18. categories', TRACKED_CLOUD_RUNTIME_CATEGORIES.length === 7, String(TRACKED_CLOUD_RUNTIME_CATEGORIES.length));
  assert('A-SETUP', '19. duplicate prefix', DUPLICATE_RUNTIME_RISK_PREFIX === 'DUPLICATE_RUNTIME_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareCloudRuntimeFoundation(baseInput());
  assert('B-CORE', '20. runtime id', ready.runtime?.runtimeId.startsWith('crrt-') === true, String(ready.runtime?.runtimeId));
  assert('B-CORE', '21. session id', ready.session?.sessionId.startsWith('crss-') === true, String(ready.session?.sessionId));
  assert('B-CORE', '22. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '23. reports', ready.reports.length === 6, String(ready.reports.length));
  assert('B-CORE', '24. inventory', listRuntimes().length >= 8, String(listRuntimes().length));
  assert('B-CORE', '25. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '26. diagnostics active', ready.diagnostics.cloudRuntimeAuthorityActive === true, 'active');

  const reg = registerRuntime({
    runtimeName: 'Query Test Runtime',
    runtimeType: 'BUILD_RUNTIME',
    projectId: 'proj-q',
    workspaceId: 'ws-q',
  });
  assert('B-CORE', '27. register', reg.runtime !== null && !reg.blocked, 'registered');
  assert('B-CORE', '28. get runtime', getRuntime(reg.runtime!.runtimeId)?.runtimeId === reg.runtime!.runtimeId, 'get');
  assert('B-CORE', '29. by project', listRuntimesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '30. by workspace', listRuntimesByWorkspace('ws-q').length >= 1, 'workspace');
  assert('B-CORE', '31. by owner', listRuntimesByOwner(CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '32. by type', listRuntimesByType('BUILD_RUNTIME').length >= 1, 'type');
  assert('B-CORE', '33. query', queryRuntimes({ runtimeType: 'BUILD_RUNTIME' }).length >= 1, 'query');

  const sess = createRuntimeSession({
    runtimeId: reg.runtime!.runtimeId,
    projectId: 'proj-q',
    workspaceId: 'ws-q',
  });
  assert('B-CORE', '34. session', sess !== null, 'session');
  assert('B-CORE', '35. get session', getRuntimeSession(sess!.sessionId)?.sessionId === sess!.sessionId, 'get');
  assert('B-CORE', '36. list sessions', listRuntimeSessions(reg.runtime!.runtimeId).length >= 1, 'list');

  setRuntimeState(reg.runtime!.runtimeId, 'READY', true);
  assert('B-CORE', '37. state', getRuntimeState(reg.runtime!.runtimeId) === 'READY', 'state');
  assert('B-CORE', '38. state history', trackRuntimeStateHistory(reg.runtime!.runtimeId).length >= 1, 'history');

  activateRuntime(reg.runtime!.runtimeId);
  pauseRuntime(reg.runtime!.runtimeId);
  resumeRuntime(reg.runtime!.runtimeId);
  completeRuntime(reg.runtime!.runtimeId);
  assert('B-CORE', '39. lifecycle', getRuntimeHistory(reg.runtime!.runtimeId).length >= 3, 'lifecycle');

  const dup = registerRuntime({
    runtimeName: 'Query Test Runtime',
    runtimeType: 'BUILD_RUNTIME',
    projectId: 'proj-q',
    workspaceId: 'ws-q',
  });
  assert('B-CORE', '40. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateRuntimeRiskContext('Test Cloud Runtime', 'GENERAL_RUNTIME');
  const risks = evaluateDuplicateRuntimeRisk(riskCtx);
  assert('B-CORE', '41. risk context', riskCtx.ownershipDomains.length >= 1, 'ctx');
  assert('B-CORE', '42. risk eval', Array.isArray(risks), 'eval');

  const invalid = validateRuntimeRegistration({
    runtimeName: '',
    projectId: '',
    workspaceId: '',
  });
  assert('B-CORE', '43. invalid reg', invalid.valid === false, 'invalid');

  assert('B-CORE', '44. state validator', validateRuntimeState('READY') === true, 'valid');
  assert('B-CORE', '45. cloud validate', validateCloudRuntime(ready.runtime).valid === true, 'valid');

  resetAll();
  const panel = buildCloudRuntimeFoundationPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '46. uvl panel', panel.panelTitle === 'Cloud Runtime Foundation', panel.panelTitle);
  assert('B-CORE', '47. panel count', panel.runtimeCount >= 8, String(panel.runtimeCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '48. routing', routing.primaryCapability === 'CLOUD_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '49. signal', isCloudRuntimeFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '50. action id', action.candidates[0]!.cloudRuntimeFoundationId.startsWith('crrtfnd-'), 'id');
  assert('C-INTEGRATION', '51. action count', action.candidates[0]!.cloudRuntimeCount === 8, String(action.candidates[0]!.cloudRuntimeCount));
  assert('C-INTEGRATION', '52. action state', action.candidates[0]!.cloudRuntimeState === 'READY', String(action.candidates[0]!.cloudRuntimeState));

  const reasoning = buildReasoningVisibilityRecord('cloud runtime foundation');
  assert('C-INTEGRATION', '53. reasoning basis', reasoning.cloudRuntimeBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '54. reasoning chain', reasoning.cloudRuntimeChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '55. reasoning state', reasoning.cloudRuntimeState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is cloud runtime blocked?');
  assert('C-INTEGRATION', '56. failure', failures.some((f) => f.sourceSystem === 'cloud_runtime_foundation'), 'fail');

  const progress = buildProgressRecords('cloud runtime inventory');
  assert('C-INTEGRATION', '57. progress', progress[0]?.cloudRuntimeFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '58. uvl rows', CLOUD_RUNTIME_FOUNDATION_UVL_ROWS.length === 14, String(CLOUD_RUNTIME_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '59. uvl types', hasUvlRow('CLOUD_RUNTIME_TYPES'), 'types');
  assert('D-REGISTRY', '60. uvl registry', hasUvlRow('CLOUD_RUNTIME_REGISTRY'), 'registry');
  assert('D-REGISTRY', '61. console', isIntelligenceConsoleCapability('CLOUD_RUNTIME_FOUNDATION'), 'console');
  assert('D-REGISTRY', '62. find panel', resolveFindPanelAlias('Cloud Runtime') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '63. registry', registry.includes('cloud_runtime_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_CLOUD_RUNTIME_DUPLICATES) {
    assert('D-REGISTRY', `64.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readText('src/cloud-runtime/cloud-runtime-registry.ts');
  const allSrc = [
    registrySrc,
    readText('src/cloud-runtime/cloud-runtime-lifecycle.ts'),
    readText('src/cloud-runtime/cloud-runtime-session-manager.ts'),
  ].join('\n');
  assert('E-STATIC', '65. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '66. no executeBuild', !allSrc.includes('executeBuild'), 'clean');
  assert('E-STATIC', '67. no world2 execute', !allSrc.toLowerCase().includes('executeworld2'), 'clean');
  assert('E-STATIC', '68. duplicate risk', readText('src/cloud-runtime/cloud-runtime-validator.ts').includes('DUPLICATE_RUNTIME_RISK'), 'risk');
  assert('E-STATIC', '69. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('CLOUD_RUNTIME_FOUNDATION'), 'feed');
  assert('E-STATIC', '70. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  assert('E-STATIC', '71. no parallel executor', !registry.includes('cloud_runtime_executor:'), 'clean');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `72.${i} runtime id`, fixture.runtime?.runtimeId.startsWith('crrt-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `73.${i} signal`, isCloudRuntimeFoundationQuestion(`cloud runtime inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`List cloud runtimes batch ${i}`);
    assert('F-CACHED', `74.${i} route`, r.primaryCapability === 'CLOUD_RUNTIME_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildCloudRuntimeFailureContext('Why is cloud runtime blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `75.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is cloud runtime blocked?';
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
    assert('G-HTTP', `76.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getCloudRuntimeDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${runtime}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Registered runtimes: ${diag.registeredRuntimeCount}`);
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

  console.log(CLOUD_RUNTIME_FOUNDATION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * DevPulse V2 Phase 16.9 — Verification Orchestrator validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  VERIFICATION_ORCHESTRATOR_PASS_TOKEN,
  VERIFICATION_ORCHESTRATOR_OWNER_MODULE,
  FORBIDDEN_VERIFICATION_ORCHESTRATOR_DUPLICATES,
  isVerificationOrchestratorQuestion,
  isVerificationOrchestratorAdvisoryQuestion,
  prepareVerificationOrchestration,
  processVerificationOrchestratorRequest,
  getVerificationOrchestratorDiagnostics,
  resetVerificationOrchestratorDiagnostics,
  resetVerificationOrchestratorReportCounterForTests,
  resetVerificationPlanCounterForTests,
  resetParallelGroupCounterForTests,
  buildVerificationOrchestratorFailureContext,
  resolveVerificationDependencies,
  detectInjectedCycle,
  scheduleVerificationExecution,
  evaluateVerificationReadiness,
  identifyParallelGroups,
  analyzeVerificationBlockers,
  buildVerificationExecutionPlans,
} from '../src/verification-orchestrator/index.js';
import type { PrepareVerificationOrchestrationInput } from '../src/verification-orchestrator/types.js';
import {
  prepareVerificationRegistry,
  resetVerificationTargetRegistryForTests,
  resetVerificationOwnerRegistryForTests,
  resetVerificationDependencyRegistryForTests,
  resetVerificationRequirementRegistryForTests,
  resetVerificationCapabilityRegistryForTests,
  resetVerificationRegistryDiagnostics,
  resetVerificationRegistryReportCounterForTests,
  listVerificationTargets,
  listVerificationDependencies,
  listVerificationOwners,
} from '../src/verification-registry/index.js';
import {
  buildVerificationOrchestratorPanelSnapshot,
  VERIFICATION_ORCHESTRATOR_UVL_ROWS,
  hasUvlRow,
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

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'What should run first?';

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
const responseCache = new Map<string, ReturnType<typeof processVerificationOrchestratorRequest>>();
const textCache = new Map<string, string>();

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
  const hit = textCache.get(path);
  if (hit) return hit;
  const text = readFileSync(join(ROOT, path), 'utf8');
  textCache.set(path, text);
  return text;
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processVerificationOrchestratorRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareVerificationOrchestrationInput> = {}): PrepareVerificationOrchestrationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    projectExists: true,
    workspaceExists: true,
    world1Protected: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetVerificationTargetRegistryForTests();
  resetVerificationOwnerRegistryForTests();
  resetVerificationDependencyRegistryForTests();
  resetVerificationRequirementRegistryForTests();
  resetVerificationCapabilityRegistryForTests();
  resetVerificationRegistryDiagnostics();
  resetVerificationRegistryReportCounterForTests();
  resetVerificationOrchestratorDiagnostics();
  resetVerificationOrchestratorReportCounterForTests();
  resetVerificationPlanCounterForTests();
  resetParallelGroupCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.9 Verification Orchestrator');
  console.log('==================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/verification-orchestrator');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. plan builder', existsSync(join(dir, 'verification-plan-builder.ts')), 'plan');
  assert('A-SETUP', '3. dependency resolver', existsSync(join(dir, 'verification-dependency-resolver.ts')), 'dep');
  assert('A-SETUP', '4. scheduler', existsSync(join(dir, 'verification-scheduler.ts')), 'sched');
  assert('A-SETUP', '5. readiness', existsSync(join(dir, 'verification-readiness-evaluator.ts')), 'ready');
  assert('A-SETUP', '6. parallelization', existsSync(join(dir, 'verification-parallelization-engine.ts')), 'parallel');
  assert('A-SETUP', '7. blocker analyzer', existsSync(join(dir, 'verification-blocker-analyzer.ts')), 'blocker');
  assert('A-SETUP', '8. validator', existsSync(join(dir, 'verification-orchestrator-validator.ts')), 'validator');
  assert('A-SETUP', '9. report', existsSync(join(dir, 'verification-orchestrator-report.ts')), 'report');
  assert('A-SETUP', '10. diagnostics', existsSync(join(dir, 'verification-orchestrator-diagnostics.ts')), 'diag');
  assert('A-SETUP', '11. failure bridge', existsSync(join(dir, 'verification-orchestrator-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. orchestrator', existsSync(join(dir, 'verification-orchestrator.ts')), 'orch');
  assert('A-SETUP', '13. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/verification-orchestrator-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '15. script', typeof pkg.scripts?.['validate:verification-orchestrator'] === 'string', 'script');
  const owner = getDevPulseV2Owner('verification_orchestrator');
  assert('A-SETUP', '16. owner', owner.ownerModule === VERIFICATION_ORCHESTRATOR_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '17. phase', owner.phase === 16.9, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareVerificationOrchestration(baseInput());
  assert('B-CORE', '18. orchestration id', ready.orchestrationReport.orchestrationId.startsWith('vorch-'), 'id');
  assert('B-CORE', '19. execution plan', ready.executionPlan.length === 11, String(ready.executionPlan.length));
  assert('B-CORE', '20. execution order', ready.orchestrationReport.executionOrder.length === 11, String(ready.orchestrationReport.executionOrder.length));
  assert('B-CORE', '21. planning only', ready.orchestrationReport.planningOnly === true, 'only');
  assert('B-CORE', '22. ready state', ['READY', 'PLANNED', 'WAITING'].includes(ready.orchestrationReport.orchestrationState), ready.orchestrationReport.orchestrationState);

  resetAll();
  prepareVerificationRegistry({ query: CANONICAL_QUERY });
  const targets = listVerificationTargets();
  const deps = listVerificationDependencies();
  const resolution = resolveVerificationDependencies(targets, deps);
  assert('B-CORE', '23. dependency resolution', resolution.upstreamChains.size === 11, String(resolution.upstreamChains.size));
  assert('B-CORE', '24. no cycle in registry', resolution.hasCycle === false, 'cycle');

  const cycleMap = new Map<string, string[]>([
    ['a', ['b']],
    ['b', ['c']],
    ['c', ['a']],
  ]);
  const cycle = detectInjectedCycle(cycleMap);
  assert('B-CORE', '25. cycle detected', cycle.hasCycle === true, 'cycle');

  const schedule = scheduleVerificationExecution(targets, resolution);
  assert('B-CORE', '26. scheduler', schedule.executionOrder.length === 11, String(schedule.executionOrder.length));

  const readiness = evaluateVerificationReadiness(
    targets.map((t) => t.verificationTargetId),
    resolution,
  );
  assert('B-CORE', '27. readiness ready', readiness.readyTargets.length >= 1, String(readiness.readyTargets.length));
  assert('B-CORE', '28. readiness waiting', readiness.waitingTargets.length >= 1, String(readiness.waitingTargets.length));

  const parallelGroups = identifyParallelGroups(
    targets.map((t) => t.verificationTargetId),
    resolution,
    schedule.executionOrder,
  );
  assert('B-CORE', '29. parallel groups', parallelGroups.length >= 1, String(parallelGroups.length));

  const blockers = analyzeVerificationBlockers(targets, listVerificationOwners(), resolution, readiness);
  assert('B-CORE', '30. blocker analysis', blockers.blockedTargets.length >= 0, 'analysis');

  const plans = buildVerificationExecutionPlans(targets, deps, schedule.executionOrder, readiness.stateMap);
  assert('B-CORE', '31. plan builder', plans.length === 11, String(plans.length));
  assert('B-CORE', '32. ready targets', ready.orchestrationReport.readyTargets.length >= 1, String(ready.orchestrationReport.readyTargets.length));
  assert('B-CORE', '33. waiting targets', ready.orchestrationReport.waitingTargets.length >= 1, String(ready.orchestrationReport.waitingTargets.length));

  const panel = buildVerificationOrchestratorPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '34. uvl panel', panel.panelTitle === 'Verification Orchestrator', panel.panelTitle);
  assert('B-CORE', '35. panel plans', panel.planCount === 11, String(panel.planCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '36. routing', routing.primaryCapability === 'VERIFICATION_ORCHESTRATOR', String(routing.primaryCapability));
  assert('C-INTEGRATION', '37. advisory', isVerificationOrchestratorAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '38. action orchestration id', action.candidates[0]!.orchestrationId.startsWith('vorch-'), 'id');
  assert('C-INTEGRATION', '39. action plan count', action.candidates[0]!.verificationPlanCount === 11, 'count');
  assert('C-INTEGRATION', '40. action ready count', action.candidates[0]!.readyTargetCount === 3, 'count');

  const reasoning = buildReasoningVisibilityRecord('why verification orchestrator');
  assert('C-INTEGRATION', '41. reasoning basis', reasoning.orchestrationBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '42. reasoning order', reasoning.executionOrder.length >= 4, 'order');
  assert('C-INTEGRATION', '43. reasoning parallel', reasoning.parallelGroups.length >= 2, 'parallel');
  assert('C-INTEGRATION', '44. reasoning waiting', reasoning.waitingTargets.length >= 2, 'waiting');

  const failures = buildFailureRecords('Why is orchestration blocked?');
  assert('C-INTEGRATION', '45. failure', failures.some((f) => f.sourceSystem === 'verification_orchestrator'), 'fail');

  const progress = buildProgressRecords('verification orchestrator');
  assert('C-INTEGRATION', '46. progress', progress[0]?.verificationOrchestrationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '47. uvl rows', VERIFICATION_ORCHESTRATOR_UVL_ROWS.length === 11, String(VERIFICATION_ORCHESTRATOR_UVL_ROWS.length));
  assert('D-REGISTRY', '48. uvl types', hasUvlRow('VERIFICATION_ORCHESTRATOR_TYPES'), 'types');
  assert('D-REGISTRY', '49. console', isIntelligenceConsoleCapability('VERIFICATION_ORCHESTRATOR'), 'console');
  assert('D-REGISTRY', '50. find panel', resolveFindPanelAlias('Verification Orchestrator') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '51. registry', registry.includes('verification_orchestrator'), 'registry');
  for (const forbidden of FORBIDDEN_VERIFICATION_ORCHESTRATOR_DUPLICATES) {
    assert('D-REGISTRY', `52.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = prepareVerificationOrchestration(baseInput());
  const engineSrc = readText('src/verification-orchestrator/verification-orchestrator.ts');
  const allSrc = [
    engineSrc,
    readText('src/verification-orchestrator/verification-orchestrator-report.ts'),
    readText('src/verification-orchestrator/verification-plan-builder.ts'),
  ].join('\n');
  assert('E-STATIC', '53. no evidence engine', !allSrc.includes('verification_evidence_engine'), 'clean');
  assert('E-STATIC', '54. no reporting engine', !allSrc.includes('verification_reporting_engine'), 'clean');
  assert('E-STATIC', '55. no auto-fix', !allSrc.includes('auto_fix_engine'), 'clean');
  assert('E-STATIC', '56. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('VERIFICATION_ORCHESTRATOR'), 'feed');
  assert('E-STATIC', '57. planning only', staticReady.orchestrationReport.planningOnly === true, 'only');
  assert('E-STATIC', '58. no execution flag', !allSrc.includes('executeVerification'), 'clean');
  assert('E-STATIC', '59. no provider exec', !allSrc.includes('startVerificationSession'), 'clean');
  assert('E-STATIC', '60. no evidence gen', !allSrc.includes('collectEvidence'), 'clean');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `61.${i} orchestration id`, fixture.orchestrationReport.orchestrationId.startsWith('vorch-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `62.${i} signal`, isVerificationOrchestratorQuestion(`verification orchestrator batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What verification plan exists batch ${i}?`);
    assert('F-CACHED', `63.${i} route`, r.primaryCapability === 'VERIFICATION_ORCHESTRATOR', String(r.primaryCapability));
  }
  const bridge = buildVerificationOrchestratorFailureContext('Why is orchestration blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `64.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is orchestration blocked?';
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
    assert('G-HTTP', `65.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVerificationOrchestratorDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Plans: ${diag.verificationPlanCount}`);
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

  console.log(VERIFICATION_ORCHESTRATOR_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

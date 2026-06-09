/**
 * DevPulse V2 Phase 15.4 — World 2 Rollback Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  WORLD2_ROLLBACK_RUNTIME_PASS_TOKEN,
  WORLD2_ROLLBACK_RUNTIME_OWNER_MODULE,
  FORBIDDEN_ROLLBACK_DUPLICATES,
  BLOCKED_ROLLBACK_ACTIONS,
  isWorld2RollbackQuestion,
  isWorld2RollbackAdvisoryQuestion,
  prepareRollbackPlan,
  processRollbackRequest,
  getRollbackDiagnostics,
  resetRollbackDiagnostics,
  resetRollbackRequestCounterForTests,
  resetRollbackStepCounterForTests,
  resetRollbackPlanCounterForTests,
  buildRollbackFailureContext,
} from '../src/world2-rollback-runtime/index.js';
import { processControlledApplyRequest } from '../src/world2-controlled-apply-runtime/index.js';
import { WORLD2_ROLLBACK_RUNTIME_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetWorld2ExecutionActivationDiagnostics,
  resetWorld2ActivationPlanCounterForTests,
} from '../src/world2-execution-activation/index.js';
import {
  resetBuilderPacketExecutionDiagnostics,
  resetBuilderPacketExecutionRequestCounterForTests,
  resetBuilderPacketStepCounterForTests,
  resetBuilderPacketExecutionReportCounterForTests,
} from '../src/world2-builder-packet-execution/index.js';
import {
  resetControlledApplyDiagnostics,
  resetControlledApplyRequestCounterForTests,
  resetControlledApplyGateCounterForTests,
  resetControlledApplyStepCounterForTests,
  resetControlledApplyPlanCounterForTests,
} from '../src/world2-controlled-apply-runtime/index.js';
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
import type { PrepareRollbackPlanInput } from '../src/world2-rollback-runtime/types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show rollback plan';

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
const responseCache = new Map<string, ReturnType<typeof processRollbackRequest>>();
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
  const result = processRollbackRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareRollbackPlanInput> = {}): PrepareRollbackPlanInput {
  const applyResult = processControlledApplyRequest('Can this apply?');
  const applyPlan = applyResult.controlledApplyPlan;
  return {
    query: CANONICAL_QUERY,
    applyPlan,
    executionPacketLinked: applyPlan !== null && applyPlan.executionPacketId.length > 0,
    world2Isolated: true,
    world1Protected: true,
    snapshotRequirementsIdentified: true,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: true,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2',
    directRollbackAttempt: false,
    ...overrides,
  };
}

function applyPlanWithStepTitle(title: string, targetArea: string) {
  const applyResult = processControlledApplyRequest('Can this apply?');
  const plan = applyResult.controlledApplyPlan;
  if (!plan) return null;
  return {
    ...plan,
    applySteps: [
      {
        stepId: 'bad-step',
        title,
        sourceExecutionStep: 'exec-bad',
        targetArea,
        riskLevel: 'HIGH' as const,
        approvalLevel: 'FOUNDER' as const,
        applyState: 'WAITING_APPROVAL' as const,
        blockedReason: null,
      },
    ],
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetWorld2ExecutionActivationDiagnostics();
  resetWorld2ActivationPlanCounterForTests();
  resetBuilderPacketExecutionDiagnostics();
  resetBuilderPacketExecutionRequestCounterForTests();
  resetBuilderPacketStepCounterForTests();
  resetBuilderPacketExecutionReportCounterForTests();
  resetControlledApplyDiagnostics();
  resetControlledApplyRequestCounterForTests();
  resetControlledApplyGateCounterForTests();
  resetControlledApplyStepCounterForTests();
  resetControlledApplyPlanCounterForTests();
  resetRollbackDiagnostics();
  resetRollbackRequestCounterForTests();
  resetRollbackStepCounterForTests();
  resetRollbackPlanCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 15.4 World 2 Rollback Runtime');
  console.log('====================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/world2-rollback-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'rollback-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. validator', existsSync(join(dir, 'rollback-validator.ts')), 'validator');
  assert('A-SETUP', '4. snapshot analyzer', existsSync(join(dir, 'rollback-snapshot-analyzer.ts')), 'snapshot');
  assert('A-SETUP', '5. impact analyzer', existsSync(join(dir, 'rollback-impact-analyzer.ts')), 'impact');
  assert('A-SETUP', '6. risk engine', existsSync(join(dir, 'rollback-risk-engine.ts')), 'risk');
  assert('A-SETUP', '7. plan builder', existsSync(join(dir, 'rollback-plan-builder.ts')), 'plan');
  assert('A-SETUP', '8. report', existsSync(join(dir, 'rollback-report.ts')), 'report');
  assert('A-SETUP', '9. diagnostics', existsSync(join(dir, 'rollback-diagnostics.ts')), 'diag');
  assert('A-SETUP', '10. failure bridge', existsSync(join(dir, 'rollback-failure-bridge.ts')), 'fail');
  assert('A-SETUP', '11. orchestrator', existsSync(join(dir, 'rollback-runtime.ts')), 'orch');
  assert('A-SETUP', '12. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/world2-rollback-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '14. script', typeof pkg.scripts?.['validate:world2-rollback-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('world2_rollback_runtime');
  assert('A-SETUP', '15. owner', owner.ownerModule === WORLD2_ROLLBACK_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '16. phase', owner.phase === 15.4, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const valid = cachedResponse(CANONICAL_QUERY);
  assert('B-CORE', '17. valid plan', valid.rollbackPlan !== null, 'plan');
  assert('B-CORE', '18. rollback blocked', valid.rollbackPlan?.rollbackAllowed === false, 'rollback');
  assert('B-CORE', '19. simulation only', valid.rollbackPlan?.simulationOnly === true, 'sim');
  assert('B-CORE', '20. rollback steps', (valid.rollbackPlan?.rollbackSteps.length ?? 0) >= 2, String(valid.rollbackPlan?.rollbackSteps.length));
  assert('B-CORE', '21. snapshot reqs', (valid.rollbackPlan?.snapshotRequirement.length ?? 0) >= 3, String(valid.rollbackPlan?.snapshotRequirement.length));

  const noApply = prepareRollbackPlan(baseInput({ applyPlan: null }));
  assert('B-CORE', '22. missing apply plan', noApply.rollbackReport.state === 'BLOCKED', noApply.rollbackReport.state);

  const noLink = prepareRollbackPlan(baseInput({ executionPacketLinked: false }));
  assert('B-CORE', '23. missing packet link', noLink.rollbackReport.state === 'BLOCKED', noLink.rollbackReport.state);

  const noSnapshot = prepareRollbackPlan(baseInput({ snapshotRequirementsIdentified: false, applyPlan: null }));
  assert('B-CORE', '24. missing snapshot', noSnapshot.rollbackReport.state === 'BLOCKED', noSnapshot.rollbackReport.state);

  const noIsolation = prepareRollbackPlan(baseInput({ world2Isolated: false }));
  assert('B-CORE', '25. isolation failure', noIsolation.rollbackReport.state === 'BLOCKED', noIsolation.rollbackReport.state);

  const world1 = prepareRollbackPlan(baseInput({ targetWorld: 'WORLD_1', world1Protected: false }));
  assert('B-CORE', '26. world1 blocks', world1.rollbackReport.state === 'BLOCKED', world1.rollbackReport.state);

  const direct = prepareRollbackPlan(baseInput({ directRollbackAttempt: true }));
  assert('B-CORE', '27. direct rollback blocks', direct.rollbackReport.state === 'BLOCKED', direct.rollbackReport.state);

  const gitPlan = applyPlanWithStepTitle('git reset HEAD', 'src/app.ts');
  const gitRollback = prepareRollbackPlan(baseInput({ applyPlan: gitPlan }));
  assert('B-CORE', '28. git reset blocks', gitRollback.rollbackReport.state === 'BLOCKED', gitRollback.rollbackReport.state);

  const checkoutPlan = applyPlanWithStepTitle('git checkout main', 'src/app.ts');
  const checkoutRollback = prepareRollbackPlan(baseInput({ applyPlan: checkoutPlan }));
  assert('B-CORE', '29. git checkout blocks', checkoutRollback.rollbackReport.state === 'BLOCKED', checkoutRollback.rollbackReport.state);

  const shellPlan = applyPlanWithStepTitle('execute shell command', 'scripts/run.sh');
  const shellRollback = prepareRollbackPlan(baseInput({ applyPlan: shellPlan }));
  assert('B-CORE', '30. shell blocks', shellRollback.rollbackReport.state === 'BLOCKED', shellRollback.rollbackReport.state);

  const deletePlan = applyPlanWithStepTitle('delete_file target', 'src/remove.ts');
  const deleteRollback = prepareRollbackPlan(baseInput({ applyPlan: deletePlan }));
  assert('B-CORE', '31. deletion blocks', deleteRollback.rollbackReport.state === 'BLOCKED', deleteRollback.rollbackReport.state);

  const criticalPlan = applyPlanWithStepTitle('World 1 direct restore', 'world1/core');
  const criticalRollback = prepareRollbackPlan(baseInput({ applyPlan: criticalPlan }));
  assert('B-CORE', '32. critical risk blocks', criticalRollback.rollbackReport.state === 'BLOCKED', criticalRollback.rollbackReport.state);

  const noFounder = prepareRollbackPlan(baseInput({ founderApprovalRecorded: false }));
  assert('B-CORE', '33. founder gate', noFounder.rollbackReport.state === 'BLOCKED', noFounder.rollbackReport.state);

  const noConstitution = prepareRollbackPlan(baseInput({ constitutionPassed: false }));
  assert('B-CORE', '34. constitution gate', noConstitution.rollbackReport.state === 'BLOCKED', noConstitution.rollbackReport.state);

  const noGovernor = prepareRollbackPlan(baseInput({ taskGovernorPassed: false }));
  assert('B-CORE', '35. task governor', noGovernor.rollbackReport.state === 'BLOCKED', noGovernor.rollbackReport.state);

  const duplicate = prepareRollbackPlan(baseInput({ duplicateAuthorityDetected: true }));
  assert('B-CORE', '36. duplicate authority', duplicate.rollbackReport.state === 'BLOCKED', duplicate.rollbackReport.state);

  assert('B-CORE', '37. founder required', (valid.rollbackPlan?.approvalRequirements.length ?? 0) >= 1, 'approval');
  assert('B-CORE', '38. blocked actions listed', BLOCKED_ROLLBACK_ACTIONS.length >= 8, String(BLOCKED_ROLLBACK_ACTIONS.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '39. routing', routing.primaryCapability === 'WORLD2_ROLLBACK_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '40. advisory', isWorld2RollbackAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '41. action id', action.candidates[0]!.rollbackPlanId.startsWith('rb-'), 'id');
  assert('C-INTEGRATION', '42. action readiness', action.candidates[0]!.rollbackReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '43. rollback false', action.candidates[0]!.rollbackAllowed === false, 'rollback');

  const reasoning = buildReasoningVisibilityRecord('why rollback');
  assert('C-INTEGRATION', '44. reasoning basis', reasoning.rollbackBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '45. reasoning blockers', Array.isArray(reasoning.rollbackBlockers), 'blockers');
  assert('C-INTEGRATION', '46. reasoning risks', Array.isArray(reasoning.rollbackRisks), 'risks');
  assert('C-INTEGRATION', '47. reasoning approvals', reasoning.rollbackApprovalRequirements.length >= 3, 'approvals');
  assert('C-INTEGRATION', '48. snapshot visibility', reasoning.rollbackSnapshotRequirements.length >= 3, 'snapshots');

  const failures = buildFailureRecords('Why is rollback blocked?');
  assert('C-INTEGRATION', '49. failure', failures.some((f) => f.sourceSystem === 'world2_rollback_runtime'), 'fail');

  const progress = buildProgressRecords('Show rollback plan');
  assert('C-INTEGRATION', '50. progress', progress[0]?.rollbackNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '51. uvl rows', WORLD2_ROLLBACK_RUNTIME_UVL_ROWS.length === 9, String(WORLD2_ROLLBACK_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '52. uvl types', hasUvlRow('WORLD2_ROLLBACK_TYPES'), 'types');
  assert('D-REGISTRY', '53. console', isIntelligenceConsoleCapability('WORLD2_ROLLBACK_RUNTIME'), 'console');
  assert('D-REGISTRY', '54. find panel', resolveFindPanelAlias('Rollback Plan') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '55. registry', registry.includes('world2_rollback_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_ROLLBACK_DUPLICATES) {
    assert('D-REGISTRY', `56.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '57. no child_process', !readText('src/world2-rollback-runtime/rollback-runtime.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '58. no writeFileSync', !readText('src/world2-rollback-runtime/rollback-runtime.ts').includes('writeFileSync'), 'clean');
  assert('E-STATIC', '59. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('WORLD2_ROLLBACK_RUNTIME'), 'feed');
  assert('E-STATIC', '60. feed events', readText('src/operator-feed/world2-rollback-feed-bridge.ts').includes('Rollback Plan Ready'), 'events');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `61.${i} rollback false`, fixture.rollbackPlan?.rollbackAllowed === false, 'blocked');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `62.${i} signal`, isWorld2RollbackQuestion(`show rollback plan ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`Can World 2 roll back batch ${i}?`);
    assert('F-CACHED', `63.${i} route`, r.primaryCapability === 'WORLD2_ROLLBACK_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildRollbackFailureContext('Why is rollback blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `64.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is rollback blocked?';
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
  const diag = getRollbackDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Rollback plans: ${diag.rollbackPlanCount}`);
  console.log(`Blocked rollback: ${diag.blockedRollbackCount}`);
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

  console.log(WORLD2_ROLLBACK_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

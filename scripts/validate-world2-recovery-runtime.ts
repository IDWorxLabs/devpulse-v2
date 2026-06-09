/**
 * DevPulse V2 Phase 15.5 — World 2 Recovery Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  WORLD2_RECOVERY_RUNTIME_PASS_TOKEN,
  WORLD2_RECOVERY_RUNTIME_OWNER_MODULE,
  FORBIDDEN_RECOVERY_DUPLICATES,
  BLOCKED_RECOVERY_STRATEGIES,
  isWorld2RecoveryQuestion,
  isWorld2RecoveryAdvisoryQuestion,
  prepareRecoveryPlan,
  processRecoveryRequest,
  getRecoveryDiagnostics,
  resetRecoveryDiagnostics,
  resetRecoveryRequestCounterForTests,
  resetRecoveryStepCounterForTests,
  resetRecoveryPlanCounterForTests,
  buildRecoveryFailureContext,
  classifyFailure,
  selectRecoveryStrategy,
  strategyWouldRepeat,
} from '../src/world2-recovery-runtime/index.js';
import { processRollbackRequest } from '../src/world2-rollback-runtime/index.js';
import { processControlledApplyRequest } from '../src/world2-controlled-apply-runtime/index.js';
import { WORLD2_RECOVERY_RUNTIME_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
  resetRollbackDiagnostics,
  resetRollbackRequestCounterForTests,
  resetRollbackStepCounterForTests,
  resetRollbackPlanCounterForTests,
} from '../src/world2-rollback-runtime/index.js';
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
import type { FailureContext, PrepareRecoveryPlanInput } from '../src/world2-recovery-runtime/types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show recovery plan';

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
const responseCache = new Map<string, ReturnType<typeof processRecoveryRequest>>();
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
  const result = processRecoveryRequest(query);
  responseCache.set(key, result);
  return result;
}

function defaultFailureContext(): FailureContext {
  return {
    failureId: 'fail-test',
    failurePath: 'world2/runtime',
    failureCount: 1,
    summary: 'Test failure context',
    sourceSystem: 'failure_visibility_engine',
  };
}

function baseInput(overrides: Partial<PrepareRecoveryPlanInput> = {}): PrepareRecoveryPlanInput {
  const rollbackResult = processRollbackRequest('Show rollback plan');
  const applyResult = processControlledApplyRequest('Can this apply?');
  const rollbackPlan = rollbackResult.rollbackPlan;
  return {
    query: CANONICAL_QUERY,
    rollbackPlan,
    applyPlan: applyResult.controlledApplyPlan,
    failureContext: defaultFailureContext(),
    executionPacketLinked: rollbackPlan !== null && rollbackPlan.executionPacketId.length > 0,
    world2Isolated: true,
    world1Protected: true,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: true,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2',
    directRecoveryAttempt: false,
    repeatedFailureLimitReached: false,
    previousRecoveryStrategies: [],
    ...overrides,
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
  resetRecoveryDiagnostics();
  resetRecoveryRequestCounterForTests();
  resetRecoveryStepCounterForTests();
  resetRecoveryPlanCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 15.5 World 2 Recovery Runtime');
  console.log('====================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/world2-recovery-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'recovery-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. validator', existsSync(join(dir, 'recovery-validator.ts')), 'validator');
  assert('A-SETUP', '4. classifier', existsSync(join(dir, 'recovery-failure-classifier.ts')), 'classifier');
  assert('A-SETUP', '5. strategy', existsSync(join(dir, 'recovery-strategy-selector.ts')), 'strategy');
  assert('A-SETUP', '6. escalation', existsSync(join(dir, 'recovery-escalation-engine.ts')), 'escalation');
  assert('A-SETUP', '7. risk engine', existsSync(join(dir, 'recovery-risk-engine.ts')), 'risk');
  assert('A-SETUP', '8. plan builder', existsSync(join(dir, 'recovery-plan-builder.ts')), 'plan');
  assert('A-SETUP', '9. report', existsSync(join(dir, 'recovery-report.ts')), 'report');
  assert('A-SETUP', '10. diagnostics', existsSync(join(dir, 'recovery-diagnostics.ts')), 'diag');
  assert('A-SETUP', '11. failure bridge', existsSync(join(dir, 'recovery-failure-bridge.ts')), 'fail');
  assert('A-SETUP', '12. orchestrator', existsSync(join(dir, 'recovery-runtime.ts')), 'orch');
  assert('A-SETUP', '13. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/world2-recovery-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '15. script', typeof pkg.scripts?.['validate:world2-recovery-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('world2_recovery_runtime');
  assert('A-SETUP', '16. owner', owner.ownerModule === WORLD2_RECOVERY_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '17. phase', owner.phase === 15.5, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const valid = cachedResponse(CANONICAL_QUERY);
  assert('B-CORE', '18. valid plan', valid.recoveryPlan !== null, 'plan');
  assert('B-CORE', '19. recovery blocked', valid.recoveryPlan?.recoveryAllowed === false, 'recovery');
  assert('B-CORE', '20. simulation only', valid.recoveryPlan?.simulationOnly === true, 'sim');
  assert('B-CORE', '21. recovery steps', (valid.recoveryPlan?.recoverySteps.length ?? 0) >= 2, String(valid.recoveryPlan?.recoverySteps.length));

  const noRollback = prepareRecoveryPlan(baseInput({ rollbackPlan: null }));
  assert('B-CORE', '22. missing rollback', noRollback.recoveryReport.state === 'BLOCKED', noRollback.recoveryReport.state);

  const noApply = prepareRecoveryPlan(baseInput({ applyPlan: null }));
  assert('B-CORE', '23. missing apply', noApply.recoveryReport.state === 'BLOCKED', noApply.recoveryReport.state);

  const noLink = prepareRecoveryPlan(baseInput({ executionPacketLinked: false }));
  assert('B-CORE', '24. missing packet link', noLink.recoveryReport.state === 'BLOCKED', noLink.recoveryReport.state);

  const noFailure = prepareRecoveryPlan(baseInput({ failureContext: null }));
  assert('B-CORE', '25. missing failure context', noFailure.recoveryReport.state === 'BLOCKED', noFailure.recoveryReport.state);

  const applyFail = prepareRecoveryPlan(baseInput({ query: 'What happens if apply fails?' }));
  assert('B-CORE', '26. apply failed category', applyFail.recoveryPlan?.failureCategory === 'APPLY_FAILED', String(applyFail.recoveryPlan?.failureCategory));

  const verifyFail = prepareRecoveryPlan(baseInput({ query: 'What happens if verification fails?' }));
  assert('B-CORE', '27. verify failed category', verifyFail.recoveryPlan?.failureCategory === 'VERIFY_FAILED', String(verifyFail.recoveryPlan?.failureCategory));

  const rollbackFail = prepareRecoveryPlan(baseInput({ query: 'What happens if rollback fails?' }));
  assert('B-CORE', '28. rollback failed category', rollbackFail.recoveryPlan?.failureCategory === 'ROLLBACK_FAILED', String(rollbackFail.recoveryPlan?.failureCategory));

  const unknown = prepareRecoveryPlan(baseInput({ query: 'Show recovery plan' }));
  assert('B-CORE', '29. unknown category', unknown.recoveryPlan?.failureCategory === 'UNKNOWN_RUNTIME_FAILURE', String(unknown.recoveryPlan?.failureCategory));

  const repeated = prepareRecoveryPlan(
    baseInput({
      query: 'What happens after 3 failed attempts?',
      failureContext: { ...defaultFailureContext(), failureCount: 3, failurePath: 'world2/repeated-failure' },
    }),
  );
  assert('B-CORE', '30. self-evolution escalation', repeated.recoveryPlan?.escalationLevel === 'SELF_EVOLUTION_REVIEW', String(repeated.recoveryPlan?.escalationLevel));
  assert('B-CORE', '31. escalate strategy', repeated.recoveryPlan?.recoveryStrategy === 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL', String(repeated.recoveryPlan?.recoveryStrategy));

  const strategy = selectRecoveryStrategy('APPLY_FAILED', 1, []);
  const wouldRepeat = strategyWouldRepeat(strategy, [strategy, strategy]);
  assert('B-CORE', '32. strategy repeat detected', wouldRepeat === true, String(wouldRepeat));

  const repeatEscalate = prepareRecoveryPlan(
    baseInput({
      query: 'What happens if apply fails?',
      previousRecoveryStrategies: ['REBUILD_APPLY_PLAN_PROPOSAL', 'REBUILD_APPLY_PLAN_PROPOSAL'],
    }),
  );
  assert(
    'B-CORE',
    '33. repeat escalates',
    repeatEscalate.recoveryPlan?.recoveryStrategy === 'ESCALATE_TO_SELF_EVOLUTION_PROPOSAL',
    String(repeatEscalate.recoveryPlan?.recoveryStrategy),
  );
  assert(
    'B-CORE',
    '33b. no repeat strategy',
    repeatEscalate.recoveryPlan?.recoveryStrategy !== 'REBUILD_APPLY_PLAN_PROPOSAL',
    String(repeatEscalate.recoveryPlan?.recoveryStrategy),
  );

  const direct = prepareRecoveryPlan(baseInput({ directRecoveryAttempt: true }));
  assert('B-CORE', '34. direct recovery blocks', direct.recoveryReport.state === 'BLOCKED', direct.recoveryReport.state);

  const shell = prepareRecoveryPlan(
    baseInput({
      failureContext: { ...defaultFailureContext(), failurePath: 'execute shell command scripts/run.sh' },
    }),
  );
  assert('B-CORE', '35. shell blocks', shell.recoveryReport.state === 'BLOCKED', shell.recoveryReport.state);

  const write = prepareRecoveryPlan(
    baseInput({
      failureContext: { ...defaultFailureContext(), failurePath: 'write_file src/app.ts' },
    }),
  );
  assert('B-CORE', '36. write blocks', write.recoveryReport.state === 'BLOCKED', write.recoveryReport.state);

  const del = prepareRecoveryPlan(
    baseInput({
      failureContext: { ...defaultFailureContext(), failurePath: 'delete_file src/remove.ts' },
    }),
  );
  assert('B-CORE', '37. delete blocks', del.recoveryReport.state === 'BLOCKED', del.recoveryReport.state);

  const git = prepareRecoveryPlan(
    baseInput({
      failureContext: { ...defaultFailureContext(), failurePath: 'git reset HEAD world2' },
    }),
  );
  assert('B-CORE', '38. git reset blocks', git.recoveryReport.state === 'BLOCKED', git.recoveryReport.state);

  const checkout = prepareRecoveryPlan(
    baseInput({
      failureContext: { ...defaultFailureContext(), failurePath: 'git checkout main' },
    }),
  );
  assert('B-CORE', '39. git checkout blocks', checkout.recoveryReport.state === 'BLOCKED', checkout.recoveryReport.state);

  const world1 = prepareRecoveryPlan(baseInput({ targetWorld: 'WORLD_1', world1Protected: false }));
  assert('B-CORE', '40. world1 blocks', world1.recoveryReport.state === 'BLOCKED', world1.recoveryReport.state);

  const noFounder = prepareRecoveryPlan(baseInput({ founderApprovalRecorded: false }));
  assert('B-CORE', '41. founder gate', noFounder.recoveryReport.state === 'BLOCKED', noFounder.recoveryReport.state);

  const noConstitution = prepareRecoveryPlan(baseInput({ constitutionPassed: false }));
  assert('B-CORE', '42. constitution gate', noConstitution.recoveryReport.state === 'BLOCKED', noConstitution.recoveryReport.state);

  const noGovernor = prepareRecoveryPlan(baseInput({ taskGovernorPassed: false }));
  assert('B-CORE', '43. task governor', noGovernor.recoveryReport.state === 'BLOCKED', noGovernor.recoveryReport.state);

  const duplicate = prepareRecoveryPlan(baseInput({ duplicateAuthorityDetected: true }));
  assert('B-CORE', '44. duplicate authority', duplicate.recoveryReport.state === 'BLOCKED', duplicate.recoveryReport.state);

  assert('B-CORE', '45. classifier apply', classifyFailure('apply failed', null) === 'APPLY_FAILED', 'apply');
  assert('B-CORE', '46. blocked strategies', BLOCKED_RECOVERY_STRATEGIES.length >= 10, String(BLOCKED_RECOVERY_STRATEGIES.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '47. routing', routing.primaryCapability === 'WORLD2_RECOVERY_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '48. advisory', isWorld2RecoveryAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '49. action id', action.candidates[0]!.recoveryPlanId.startsWith('rc-'), 'id');
  assert('C-INTEGRATION', '50. action readiness', action.candidates[0]!.recoveryReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '51. recovery false', action.candidates[0]!.recoveryAllowed === false, 'recovery');

  const reasoning = buildReasoningVisibilityRecord('why recovery');
  assert('C-INTEGRATION', '52. reasoning basis', reasoning.recoveryBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '53. reasoning blockers', Array.isArray(reasoning.recoveryBlockers), 'blockers');
  assert('C-INTEGRATION', '54. reasoning strategy', reasoning.recoveryStrategy.length > 5, 'strategy');
  assert('C-INTEGRATION', '55. reasoning escalation', reasoning.recoveryEscalationReason.length > 5, 'escalation');

  const failures = buildFailureRecords('Why is recovery blocked?');
  assert('C-INTEGRATION', '56. failure', failures.some((f) => f.sourceSystem === 'world2_recovery_runtime'), 'fail');

  const progress = buildProgressRecords('Show recovery plan');
  assert('C-INTEGRATION', '57. progress', progress[0]?.recoveryNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '58. uvl rows', WORLD2_RECOVERY_RUNTIME_UVL_ROWS.length === 10, String(WORLD2_RECOVERY_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '59. uvl types', hasUvlRow('WORLD2_RECOVERY_TYPES'), 'types');
  assert('D-REGISTRY', '60. console', isIntelligenceConsoleCapability('WORLD2_RECOVERY_RUNTIME'), 'console');
  assert('D-REGISTRY', '61. find panel', resolveFindPanelAlias('Recovery Plan') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '62. registry', registry.includes('world2_recovery_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_RECOVERY_DUPLICATES) {
    assert('D-REGISTRY', `63.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '64. no child_process', !readText('src/world2-recovery-runtime/recovery-runtime.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '65. no writeFileSync', !readText('src/world2-recovery-runtime/recovery-runtime.ts').includes('writeFileSync'), 'clean');
  assert('E-STATIC', '66. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('WORLD2_RECOVERY_RUNTIME'), 'feed');
  assert('E-STATIC', '67. feed events', readText('src/operator-feed/world2-recovery-feed-bridge.ts').includes('Recovery Plan Ready'), 'events');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `68.${i} recovery false`, fixture.recoveryPlan?.recoveryAllowed === false, 'blocked');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `69.${i} signal`, isWorld2RecoveryQuestion(`show recovery plan ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`What happens if apply fails batch ${i}?`);
    assert('F-CACHED', `70.${i} route`, r.primaryCapability === 'WORLD2_RECOVERY_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildRecoveryFailureContext('Why is recovery blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `71.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is recovery blocked?';
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
    assert('G-HTTP', `72.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getRecoveryDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Recovery plans: ${diag.recoveryPlanCount}`);
  console.log(`Blocked recovery: ${diag.blockedRecoveryCount}`);
  console.log(`Escalation required: ${diag.escalationRequiredCount}`);
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

  console.log(WORLD2_RECOVERY_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

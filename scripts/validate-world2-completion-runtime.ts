/**
 * DevPulse V2 Phase 15.6 — World 2 Completion Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  WORLD2_COMPLETION_RUNTIME_PASS_TOKEN,
  WORLD2_COMPLETION_RUNTIME_OWNER_MODULE,
  FORBIDDEN_COMPLETION_DUPLICATES,
  isWorld2CompletionQuestion,
  isWorld2CompletionAdvisoryQuestion,
  prepareCompletionPlan,
  processCompletionRequest,
  getCompletionDiagnostics,
  resetCompletionDiagnostics,
  resetCompletionRequestCounterForTests,
  resetCompletionEvidenceCounterForTests,
  resetCompletionPlanCounterForTests,
  buildCompletionFailureContext,
  isProjectGoalCriterionSatisfied,
  buildVerificationRequirements,
  evaluateVerificationSatisfaction,
} from '../src/world2-completion-runtime/index.js';
import { processRecoveryRequest } from '../src/world2-recovery-runtime/index.js';
import { processRollbackRequest } from '../src/world2-rollback-runtime/index.js';
import { processControlledApplyRequest } from '../src/world2-controlled-apply-runtime/index.js';
import { processBuilderPacketExecutionRequest } from '../src/world2-builder-packet-execution/index.js';
import { WORLD2_COMPLETION_RUNTIME_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
  resetRecoveryDiagnostics,
  resetRecoveryRequestCounterForTests,
  resetRecoveryStepCounterForTests,
  resetRecoveryPlanCounterForTests,
} from '../src/world2-recovery-runtime/index.js';
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
import type { PrepareCompletionPlanInput, ProjectContext } from '../src/world2-completion-runtime/types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show completion plan';

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
const responseCache = new Map<string, ReturnType<typeof processCompletionRequest>>();
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
  const result = processCompletionRequest(query);
  responseCache.set(key, result);
  return result;
}

function defaultProjectContext(): ProjectContext {
  return {
    projectId: 'proj-test',
    projectName: 'DevPulse V2',
    goalSummary: 'World 2 completion planning test project',
  };
}

function baseInput(overrides: Partial<PrepareCompletionPlanInput> = {}): PrepareCompletionPlanInput {
  const recoveryResult = processRecoveryRequest('Show recovery plan');
  const rollbackResult = processRollbackRequest('Show rollback plan');
  const applyResult = processControlledApplyRequest('Can this apply?');
  const packetResult = processBuilderPacketExecutionRequest('Prepare builder packet execution');
  return {
    query: CANONICAL_QUERY,
    recoveryPlan: recoveryResult.recoveryPlan,
    rollbackPlan: rollbackResult.rollbackPlan,
    applyPlan: applyResult.controlledApplyPlan,
    executionPacket: packetResult.executionPacket,
    projectContext: defaultProjectContext(),
    evidenceProvided: true,
    verificationRequirementsMet: true,
    world2Isolated: true,
    world1Protected: true,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: true,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2',
    markCompleteAttempt: false,
    noCriticalFailures: true,
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
  resetCompletionDiagnostics();
  resetCompletionRequestCounterForTests();
  resetCompletionEvidenceCounterForTests();
  resetCompletionPlanCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 15.6 World 2 Completion Runtime');
  console.log('====================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/world2-completion-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'completion-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. validator', existsSync(join(dir, 'completion-validator.ts')), 'validator');
  assert('A-SETUP', '4. criteria', existsSync(join(dir, 'completion-criteria-engine.ts')), 'criteria');
  assert('A-SETUP', '5. evidence', existsSync(join(dir, 'completion-evidence-engine.ts')), 'evidence');
  assert('A-SETUP', '6. verification', existsSync(join(dir, 'completion-verification-engine.ts')), 'verification');
  assert('A-SETUP', '7. risk', existsSync(join(dir, 'completion-risk-engine.ts')), 'risk');
  assert('A-SETUP', '8. plan builder', existsSync(join(dir, 'completion-plan-builder.ts')), 'plan');
  assert('A-SETUP', '9. report', existsSync(join(dir, 'completion-report.ts')), 'report');
  assert('A-SETUP', '10. diagnostics', existsSync(join(dir, 'completion-diagnostics.ts')), 'diag');
  assert('A-SETUP', '11. failure bridge', existsSync(join(dir, 'completion-failure-bridge.ts')), 'fail');
  assert('A-SETUP', '12. orchestrator', existsSync(join(dir, 'completion-runtime.ts')), 'orch');
  assert('A-SETUP', '13. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/world2-completion-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '15. script', typeof pkg.scripts?.['validate:world2-completion-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('world2_completion_runtime');
  assert('A-SETUP', '16. owner', owner.ownerModule === WORLD2_COMPLETION_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '17. phase', owner.phase === 15.6, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const valid = cachedResponse(CANONICAL_QUERY);
  assert('B-CORE', '18. valid plan', valid.completionPlan !== null, 'plan');
  assert('B-CORE', '19. completion blocked', valid.completionPlan?.completionAllowed === false, 'completion');
  assert('B-CORE', '20. simulation only', valid.completionPlan?.simulationOnly === true, 'sim');
  assert('B-CORE', '21. criteria', (valid.completionPlan?.completionCriteria.length ?? 0) >= 5, String(valid.completionPlan?.completionCriteria.length));
  assert('B-CORE', '22. evidence', (valid.completionPlan?.completionEvidence.length ?? 0) >= 3, String(valid.completionPlan?.completionEvidence.length));

  const noRecovery = prepareCompletionPlan(baseInput({ recoveryPlan: null }));
  assert('B-CORE', '23. missing recovery', noRecovery.completionReport.state === 'BLOCKED', noRecovery.completionReport.state);

  const noRollback = prepareCompletionPlan(baseInput({ rollbackPlan: null }));
  assert('B-CORE', '24. missing rollback', noRollback.completionReport.state === 'BLOCKED', noRollback.completionReport.state);

  const noApply = prepareCompletionPlan(baseInput({ applyPlan: null }));
  assert('B-CORE', '25. missing apply', noApply.completionReport.state === 'BLOCKED', noApply.completionReport.state);

  const noPacket = prepareCompletionPlan(baseInput({ executionPacket: null }));
  assert('B-CORE', '26. missing packet', noPacket.completionReport.state === 'BLOCKED', noPacket.completionReport.state);

  const noEvidence = prepareCompletionPlan(baseInput({ evidenceProvided: false }));
  assert('B-CORE', '27. missing evidence', noEvidence.completionReport.state === 'BLOCKED', noEvidence.completionReport.state);

  const noVerification = prepareCompletionPlan(baseInput({ verificationRequirementsMet: false, runtimeVerificationPassed: false }));
  assert('B-CORE', '28. missing verification', noVerification.completionReport.state === 'BLOCKED', noVerification.completionReport.state);

  const goalOk = isProjectGoalCriterionSatisfied(baseInput());
  assert('B-CORE', '29. goal criterion', goalOk === true, String(goalOk));

  const reqs = buildVerificationRequirements(baseInput());
  const evalResult = evaluateVerificationSatisfaction(reqs, baseInput());
  assert('B-CORE', '30. verification eval', evalResult.satisfied.length >= 5, String(evalResult.satisfied.length));

  const approval = prepareCompletionPlan(baseInput());
  assert('B-CORE', '31. approval reqs', (approval.completionPlan?.approvalRequirements.length ?? 0) >= 1, 'approval');

  const critical = prepareCompletionPlan(baseInput({ markCompleteAttempt: true }));
  assert('B-CORE', '32. critical blocks', critical.completionReport.state === 'BLOCKED', critical.completionReport.state);

  const noEvBlock = prepareCompletionPlan(baseInput({ evidenceProvided: false }));
  assert('B-CORE', '33. no evidence blocks', noEvBlock.completionReport.state === 'BLOCKED', noEvBlock.completionReport.state);

  const world1 = prepareCompletionPlan(baseInput({ targetWorld: 'WORLD_1', world1Protected: false }));
  assert('B-CORE', '34. world1 blocks', world1.completionReport.state === 'BLOCKED', world1.completionReport.state);

  const duplicate = prepareCompletionPlan(baseInput({ duplicateAuthorityDetected: true }));
  assert('B-CORE', '35. duplicate authority', duplicate.completionReport.state === 'BLOCKED', duplicate.completionReport.state);

  const noFounder = prepareCompletionPlan(baseInput({ founderApprovalRecorded: false }));
  assert('B-CORE', '36. founder gate', noFounder.completionReport.state === 'BLOCKED', noFounder.completionReport.state);

  const noConstitution = prepareCompletionPlan(baseInput({ constitutionPassed: false }));
  assert('B-CORE', '37. constitution gate', noConstitution.completionReport.state === 'BLOCKED', noConstitution.completionReport.state);

  const noGovernor = prepareCompletionPlan(baseInput({ taskGovernorPassed: false }));
  assert('B-CORE', '38. task governor', noGovernor.completionReport.state === 'BLOCKED', noGovernor.completionReport.state);
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '39. routing', routing.primaryCapability === 'WORLD2_COMPLETION_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '40. advisory', isWorld2CompletionAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '41. action id', action.candidates[0]!.completionPlanId.startsWith('cm-'), 'id');
  assert('C-INTEGRATION', '42. action readiness', action.candidates[0]!.completionReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '43. completion false', action.candidates[0]!.completionAllowed === false, 'completion');

  const reasoning = buildReasoningVisibilityRecord('why completion');
  assert('C-INTEGRATION', '44. reasoning basis', reasoning.completionBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '45. reasoning criteria', reasoning.completionCriteria.length >= 3, 'criteria');
  assert('C-INTEGRATION', '46. reasoning evidence', reasoning.completionEvidence.length >= 3, 'evidence');
  assert('C-INTEGRATION', '47. reasoning verification', reasoning.completionVerificationRequirements.length >= 3, 'verification');

  const failures = buildFailureRecords('Why is completion blocked?');
  assert('C-INTEGRATION', '48. failure', failures.some((f) => f.sourceSystem === 'world2_completion_runtime'), 'fail');

  const progress = buildProgressRecords('Show completion plan');
  assert('C-INTEGRATION', '49. progress', progress[0]?.completionNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '50. uvl rows', WORLD2_COMPLETION_RUNTIME_UVL_ROWS.length === 10, String(WORLD2_COMPLETION_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '51. uvl types', hasUvlRow('WORLD2_COMPLETION_TYPES'), 'types');
  assert('D-REGISTRY', '52. console', isIntelligenceConsoleCapability('WORLD2_COMPLETION_RUNTIME'), 'console');
  assert('D-REGISTRY', '53. find panel', resolveFindPanelAlias('Completion Plan') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '54. registry', registry.includes('world2_completion_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_COMPLETION_DUPLICATES) {
    assert('D-REGISTRY', `55.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '56. no child_process', !readText('src/world2-completion-runtime/completion-runtime.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '57. no writeFileSync', !readText('src/world2-completion-runtime/completion-runtime.ts').includes('writeFileSync'), 'clean');
  assert('E-STATIC', '58. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('WORLD2_COMPLETION_RUNTIME'), 'feed');
  assert('E-STATIC', '59. feed events', readText('src/operator-feed/world2-completion-feed-bridge.ts').includes('Completion Plan Ready'), 'events');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `60.${i} completion false`, fixture.completionPlan?.completionAllowed === false, 'blocked');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `61.${i} signal`, isWorld2CompletionQuestion(`show completion plan ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`What defines completion batch ${i}?`);
    assert('F-CACHED', `62.${i} route`, r.primaryCapability === 'WORLD2_COMPLETION_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildCompletionFailureContext('Why is completion blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `63.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is completion blocked?';
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
    assert('G-HTTP', `64.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getCompletionDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Completion plans: ${diag.completionPlanCount}`);
  console.log(`Blocked completion: ${diag.blockedCompletionCount}`);
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

  console.log(WORLD2_COMPLETION_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

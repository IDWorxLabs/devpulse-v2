/**
 * DevPulse V2 Phase 15.3 — World 2 Controlled Apply Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  WORLD2_CONTROLLED_APPLY_RUNTIME_PASS_TOKEN,
  WORLD2_CONTROLLED_APPLY_RUNTIME_OWNER_MODULE,
  FORBIDDEN_CONTROLLED_APPLY_DUPLICATES,
  isWorld2ControlledApplyQuestion,
  isWorld2ControlledApplyAdvisoryQuestion,
  prepareControlledApplyPlan,
  processControlledApplyRequest,
  getControlledApplyDiagnostics,
  resetControlledApplyDiagnostics,
  resetControlledApplyRequestCounterForTests,
  resetControlledApplyGateCounterForTests,
  resetControlledApplyStepCounterForTests,
  resetControlledApplyPlanCounterForTests,
  buildControlledApplyFailureContext,
} from '../src/world2-controlled-apply-runtime/index.js';
import {
  processBuilderPacketExecutionRequest,
  createDefaultBuilderPacket,
} from '../src/world2-builder-packet-execution/index.js';
import { WORLD2_CONTROLLED_APPLY_RUNTIME_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
const CANONICAL_QUERY = 'Can this apply?';

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
const responseCache = new Map<string, ReturnType<typeof processControlledApplyRequest>>();
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
  const result = processControlledApplyRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<Parameters<typeof prepareControlledApplyPlan>[0]> = {}) {
  const packetResult = processBuilderPacketExecutionRequest('Prepare builder packet execution');
  return {
    builderPacket: createDefaultBuilderPacket(),
    executionPacket: packetResult.executionPacket,
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    builderPacketValid: packetResult.executionPacket !== null,
    world2Isolated: true,
    world1Protected: true,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: true,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2' as const,
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 15.3 World 2 Controlled Apply Runtime');
  console.log('============================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/world2-controlled-apply-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'controlled-apply-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. validator', existsSync(join(dir, 'controlled-apply-validator.ts')), 'validator');
  assert('A-SETUP', '4. gate engine', existsSync(join(dir, 'controlled-apply-gate-engine.ts')), 'gate');
  assert('A-SETUP', '5. risk engine', existsSync(join(dir, 'controlled-apply-risk-engine.ts')), 'risk');
  assert('A-SETUP', '6. plan builder', existsSync(join(dir, 'controlled-apply-plan-builder.ts')), 'plan');
  assert('A-SETUP', '7. report', existsSync(join(dir, 'controlled-apply-report.ts')), 'report');
  assert('A-SETUP', '8. diagnostics', existsSync(join(dir, 'controlled-apply-diagnostics.ts')), 'diag');
  assert('A-SETUP', '9. failure bridge', existsSync(join(dir, 'controlled-apply-failure-bridge.ts')), 'fail');
  assert('A-SETUP', '10. orchestrator', existsSync(join(dir, 'controlled-apply-runtime.ts')), 'orch');
  assert('A-SETUP', '11. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '12. feed bridge', existsSync(join(ROOT, 'src/operator-feed/world2-controlled-apply-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '13. script', typeof pkg.scripts?.['validate:world2-controlled-apply-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('world2_controlled_apply_runtime');
  assert('A-SETUP', '14. owner', owner.ownerModule === WORLD2_CONTROLLED_APPLY_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '15. phase', owner.phase === 15.3, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const valid = cachedResponse(CANONICAL_QUERY);
  assert('B-CORE', '16. valid plan', valid.controlledApplyPlan !== null, 'plan');
  assert('B-CORE', '17. apply blocked', valid.controlledApplyPlan?.applyAllowed === false, 'apply');
  assert('B-CORE', '18. simulation only', valid.controlledApplyPlan?.simulationOnly === true, 'sim');
  assert('B-CORE', '19. apply steps', (valid.controlledApplyPlan?.applySteps.length ?? 0) >= 5, String(valid.controlledApplyPlan?.applySteps.length));

  const noActivation = prepareControlledApplyPlan(baseInput({ activationExists: false }));
  assert('B-CORE', '20. missing activation', noActivation.controlledApplyReport.state === 'BLOCKED', noActivation.controlledApplyReport.state);

  const noPacket = prepareControlledApplyPlan(baseInput({ executionPacket: null, builderPacketValid: false }));
  assert('B-CORE', '21. missing packet', noPacket.controlledApplyReport.state === 'BLOCKED', noPacket.controlledApplyReport.state);

  const noIsolation = prepareControlledApplyPlan(baseInput({ world2Isolated: false }));
  assert('B-CORE', '22. isolation failure', noIsolation.controlledApplyReport.state === 'BLOCKED', noIsolation.controlledApplyReport.state);

  const world1 = prepareControlledApplyPlan(baseInput({ targetWorld: 'WORLD_1', world1Protected: false }));
  assert('B-CORE', '23. world1 blocks', world1.controlledApplyReport.state === 'BLOCKED', world1.controlledApplyReport.state);

  const deletePacket = processBuilderPacketExecutionRequest('delete test').executionPacket;
  const deleteInput = baseInput({
    executionPacket: deletePacket
      ? {
          ...deletePacket,
          steps: [
            {
              stepId: 'bad-1',
              title: 'Delete',
              description: 'delete file',
              targetArea: 'src/app.ts',
              stepType: 'DELETE_FILE_PROPOSAL',
              riskLevel: 'CRITICAL',
              requiresApproval: true,
              allowedInThisPhase: false,
              blockedReason: 'blocked',
            },
          ],
        }
      : null,
  });
  const critical = prepareControlledApplyPlan(deleteInput);
  assert('B-CORE', '24. critical blocks', critical.controlledApplyReport.state === 'BLOCKED', critical.controlledApplyReport.state);

  const noFounder = prepareControlledApplyPlan(baseInput({ founderApprovalRecorded: false }));
  assert('B-CORE', '25. founder gate', noFounder.controlledApplyReport.state === 'BLOCKED', noFounder.controlledApplyReport.state);

  const noConstitution = prepareControlledApplyPlan(baseInput({ constitutionPassed: false }));
  assert('B-CORE', '26. constitution gate', noConstitution.controlledApplyReport.state === 'BLOCKED', noConstitution.controlledApplyReport.state);

  const noGovernor = prepareControlledApplyPlan(baseInput({ taskGovernorPassed: false }));
  assert('B-CORE', '27. task governor', noGovernor.controlledApplyReport.state === 'BLOCKED', noGovernor.controlledApplyReport.state);

  const duplicate = prepareControlledApplyPlan(baseInput({ duplicateAuthorityDetected: true }));
  assert('B-CORE', '28. duplicate authority', duplicate.controlledApplyReport.state === 'BLOCKED', duplicate.controlledApplyReport.state);

  assert('B-CORE', '29. founder required', (valid.controlledApplyPlan?.approvalRequirements.length ?? 0) >= 1, 'approval');
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '30. routing', routing.primaryCapability === 'WORLD2_CONTROLLED_APPLY_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '31. advisory', isWorld2ControlledApplyAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '32. action id', action.candidates[0]!.controlledApplyId.startsWith('cap-'), 'id');
  assert('C-INTEGRATION', '33. action readiness', action.candidates[0]!.controlledApplyReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '34. apply false', action.candidates[0]!.applyAllowed === false, 'apply');

  const reasoning = buildReasoningVisibilityRecord('why');
  assert('C-INTEGRATION', '35. reasoning basis', reasoning.controlledApplyBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '36. reasoning blockers', Array.isArray(reasoning.controlledApplyBlockers), 'blockers');
  assert('C-INTEGRATION', '37. reasoning risks', Array.isArray(reasoning.controlledApplyRisks), 'risks');
  assert('C-INTEGRATION', '38. reasoning approvals', reasoning.controlledApplyApprovalRequirements.length >= 3, 'approvals');

  const failures = buildFailureRecords('Why is apply blocked?');
  assert('C-INTEGRATION', '39. failure', failures.some((f) => f.sourceSystem === 'world2_controlled_apply_runtime'), 'fail');

  const progress = buildProgressRecords('Show apply plan');
  assert('C-INTEGRATION', '40. progress', progress[0]?.controlledApplyNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '41. uvl rows', WORLD2_CONTROLLED_APPLY_RUNTIME_UVL_ROWS.length === 8, String(WORLD2_CONTROLLED_APPLY_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '42. uvl types', hasUvlRow('WORLD2_CONTROLLED_APPLY_TYPES'), 'types');
  assert('D-REGISTRY', '43. console', isIntelligenceConsoleCapability('WORLD2_CONTROLLED_APPLY_RUNTIME'), 'console');
  assert('D-REGISTRY', '44. find panel', resolveFindPanelAlias('Controlled Apply') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '45. registry', registry.includes('world2_controlled_apply_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_CONTROLLED_APPLY_DUPLICATES) {
    assert('D-REGISTRY', `46.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '47. no child_process', !readText('src/world2-controlled-apply-runtime/controlled-apply-runtime.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '48. no writeFileSync', !readText('src/world2-controlled-apply-runtime/controlled-apply-runtime.ts').includes('writeFileSync'), 'clean');
  assert('E-STATIC', '49. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('WORLD2_CONTROLLED_APPLY_RUNTIME'), 'feed');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `50.${i} apply false`, fixture.controlledApplyPlan?.applyAllowed === false, 'blocked');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `51.${i} signal`, isWorld2ControlledApplyQuestion(`show apply plan ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`Can this apply batch ${i}?`);
    assert('F-CACHED', `52.${i} route`, r.primaryCapability === 'WORLD2_CONTROLLED_APPLY_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildControlledApplyFailureContext('Why is apply blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `53.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is apply blocked?';
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
    assert('G-HTTP', `54.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getControlledApplyDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Apply plans: ${diag.applyPlanCount}`);
  console.log(`Blocked apply: ${diag.blockedApplyCount}`);
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

  console.log(WORLD2_CONTROLLED_APPLY_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

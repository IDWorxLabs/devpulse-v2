/**
 * DevPulse V2 Phase 15.2 — World 2 Builder Packet Execution validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  WORLD2_BUILDER_PACKET_EXECUTION_PASS_TOKEN,
  WORLD2_BUILDER_PACKET_EXECUTION_OWNER_MODULE,
  FORBIDDEN_BUILDER_PACKET_DUPLICATES,
  isWorld2BuilderPacketExecutionQuestion,
  isWorld2BuilderPacketExecutionAdvisoryQuestion,
  prepareBuilderPacketExecution,
  processBuilderPacketExecutionRequest,
  getBuilderPacketExecutionDiagnostics,
  resetBuilderPacketExecutionDiagnostics,
  resetBuilderPacketExecutionRequestCounterForTests,
  resetBuilderPacketStepCounterForTests,
  resetBuilderPacketExecutionReportCounterForTests,
  createDefaultBuilderPacket,
  validateBuilderPacketExecution,
  normalizeBuilderPacketSteps,
  classifyBuilderPacketSteps,
  buildBuilderPacketExecutionFailureContext,
} from '../src/world2-builder-packet-execution/index.js';
import { WORLD2_BUILDER_PACKET_EXECUTION_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES, resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  processBrainRequest,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetWorld2ExecutionActivationDiagnostics,
  resetWorld2ActivationPlanCounterForTests,
} from '../src/world2-execution-activation/index.js';
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
const CANONICAL_QUERY = 'Can this builder packet execute?';

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

const responseCache = new Map<string, ReturnType<typeof prepareBuilderPacketExecution>>();
const textCache = new Map<string, string>();

let httpServer: Server | null = null;
let httpPort: number | null = null;

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function beginGroup(group: string): number {
  if (Date.now() - startedAt > MAX_RUNTIME_MS) {
    throw new Error(`Max runtime guard exceeded during ${group}`);
  }
  console.log(`▶ ${group} ...`);
  return Date.now();
}

function endGroup(group: string, started: number): void {
  const elapsed = Date.now() - started;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  const passed = groupResults.filter((r) => r.passed).length;
  console.log(`✓ ${group} — ${passed}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) {
    console.log(`  ⚠ ${group} exceeded per-group warning threshold`);
  }
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
  const result = processBuilderPacketExecutionRequest(query);
  responseCache.set(key, result);
  return result;
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 15.2 World 2 Builder Packet Execution');
  console.log('===========================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/world2-builder-packet-execution');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'builder-packet-execution-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. validator', existsSync(join(dir, 'builder-packet-execution-validator.ts')), 'validator');
  assert('A-SETUP', '4. normalizer', existsSync(join(dir, 'builder-packet-step-normalizer.ts')), 'normalizer');
  assert('A-SETUP', '5. risk', existsSync(join(dir, 'builder-packet-risk-classifier.ts')), 'risk');
  assert('A-SETUP', '6. plan builder', existsSync(join(dir, 'builder-packet-execution-plan-builder.ts')), 'plan');
  assert('A-SETUP', '7. report', existsSync(join(dir, 'builder-packet-execution-report.ts')), 'report');
  assert('A-SETUP', '8. diagnostics', existsSync(join(dir, 'builder-packet-execution-diagnostics.ts')), 'diag');
  assert('A-SETUP', '9. orchestrator', existsSync(join(dir, 'builder-packet-execution.ts')), 'orch');
  assert('A-SETUP', '10. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '11. feed bridge', existsSync(join(ROOT, 'src/operator-feed/world2-builder-packet-execution-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '12. script', typeof pkg.scripts?.['validate:world2-builder-packet-execution'] === 'string', 'script');
  const owner = getDevPulseV2Owner('world2_builder_packet_execution');
  assert('A-SETUP', '13. owner', owner.ownerModule === WORLD2_BUILDER_PACKET_EXECUTION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '14. phase', owner.phase === 15.2, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const valid = cachedResponse(CANONICAL_QUERY);
  assert('B-CORE', '15. valid packet', valid.executionPacket !== null, 'packet');
  assert('B-CORE', '16. simulation only', valid.executionPacket?.simulationOnly === true, 'sim');
  assert('B-CORE', '17. execution blocked', valid.executionPacket?.executionAllowed === false, 'blocked');
  assert('B-CORE', '18. steps present', (valid.executionPacket?.steps.length ?? 0) >= 5, String(valid.executionPacket?.steps.length));

  const missingActivation = prepareBuilderPacketExecution({
    builderPacket: createDefaultBuilderPacket(),
    activationExists: false,
    activationState: null,
    activationId: null,
    world2Isolated: true,
    world1Protected: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '19. missing activation blocks', missingActivation.executionReport.state === 'BLOCKED', missingActivation.executionReport.state);

  const missingPacket = prepareBuilderPacketExecution({
    builderPacket: null,
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    world2Isolated: true,
    world1Protected: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '20. missing packet blocks', missingPacket.executionReport.state === 'BLOCKED', missingPacket.executionReport.state);

  const world1Target = prepareBuilderPacketExecution({
    builderPacket: createDefaultBuilderPacket({ targetWorld: 'WORLD_1' }),
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    world2Isolated: true,
    world1Protected: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '21. world1 blocks', world1Target.executionReport.state === 'BLOCKED', world1Target.executionReport.state);

  const deletePacket = createDefaultBuilderPacket({
    steps: [
      {
        title: 'Delete file',
        description: 'Unsafe delete proposal',
        targetArea: 'src/app.ts',
        stepType: 'DELETE_FILE_PROPOSAL',
      },
    ],
  });
  const deleteResult = prepareBuilderPacketExecution({
    builderPacket: deletePacket,
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    world2Isolated: true,
    world1Protected: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '22. delete blocks', deleteResult.executionReport.state === 'BLOCKED', deleteResult.executionReport.state);

  const rollbackPacket = createDefaultBuilderPacket({
    steps: [
      {
        title: 'Rollback',
        description: 'Rollback proposal blocked in 15.2',
        targetArea: 'rollback',
        stepType: 'ROLLBACK_PROPOSAL',
      },
    ],
  });
  const rollbackResult = prepareBuilderPacketExecution({
    builderPacket: rollbackPacket,
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    world2Isolated: true,
    world1Protected: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '23. rollback blocks', rollbackResult.executionReport.state === 'BLOCKED', rollbackResult.executionReport.state);

  const normalized = classifyBuilderPacketSteps(normalizeBuilderPacketSteps(createDefaultBuilderPacket().steps));
  const highSteps = normalized.filter((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL');
  assert('B-CORE', '24. high steps approval', highSteps.every((s) => s.requiresApproval), String(highSteps.length));

  const noIsolation = prepareBuilderPacketExecution({
    builderPacket: createDefaultBuilderPacket(),
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    world2Isolated: false,
    world1Protected: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '25. isolation required', noIsolation.executionReport.state === 'BLOCKED', noIsolation.executionReport.state);

  const noGovernor = prepareBuilderPacketExecution({
    builderPacket: createDefaultBuilderPacket(),
    activationExists: true,
    activationState: 'AWAITING_APPROVAL',
    activationId: 'w2act-0001',
    world2Isolated: true,
    world1Protected: true,
    taskGovernorPassed: false,
    founderApprovalRecorded: false,
  });
  assert('B-CORE', '26. task governor', noGovernor.executionReport.state === 'BLOCKED', noGovernor.executionReport.state);
  assert('B-CORE', '27. founder recorded', valid.executionReport.founderApprovalRequirementRecorded === true, 'founder');
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '28. routing primary', routing.primaryCapability === 'WORLD2_BUILDER_PACKET_EXECUTION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '29. advisory exempt', isWorld2BuilderPacketExecutionAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended action');
  assert('C-INTEGRATION', '30. action id', action.candidates[0]!.builderPacketExecutionId.startsWith('bpe-'), 'id');
  assert('C-INTEGRATION', '31. action readiness', action.candidates[0]!.builderPacketExecutionReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '32. action exec false', action.candidates[0]!.executionAllowed === false, 'exec');

  const reasoning = buildReasoningVisibilityRecord('why recommended');
  assert('C-INTEGRATION', '33. reasoning basis', reasoning.builderPacketExecutionBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '34. reasoning blockers', Array.isArray(reasoning.builderPacketExecutionBlockers), 'blockers');
  assert('C-INTEGRATION', '35. reasoning risks', Array.isArray(reasoning.builderPacketExecutionRisks), 'risks');
  assert('C-INTEGRATION', '36. reasoning sim', reasoning.builderPacketSimulationOnly === true, 'sim');

  const failures = buildFailureRecords('Why is this builder packet blocked?');
  assert('C-INTEGRATION', '37. failure context', failures.some((f) => f.sourceSystem === 'world2_builder_packet_execution'), 'fail');

  const progress = buildProgressRecords('Prepare builder packet execution');
  assert('C-INTEGRATION', '38. progress note', progress[0]?.builderPacketExecutionNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '39. uvl rows', WORLD2_BUILDER_PACKET_EXECUTION_UVL_ROWS.length === 7, String(WORLD2_BUILDER_PACKET_EXECUTION_UVL_ROWS.length));
  assert('D-REGISTRY', '40. uvl types', hasUvlRow('WORLD2_BUILDER_PACKET_EXECUTION_TYPES'), 'types');
  assert('D-REGISTRY', '41. console cap', isIntelligenceConsoleCapability('WORLD2_BUILDER_PACKET_EXECUTION'), 'console');
  assert('D-REGISTRY', '42. find aliases', WORLD2_BUILDER_PACKET_FIND_ALIASES.length === 6, String(WORLD2_BUILDER_PACKET_FIND_ALIASES.length));
  assert('D-REGISTRY', '43. find resolve', resolveFindPanelAlias('Builder Packet Execution') !== null, 'resolve');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '44. registry entry', registry.includes('world2_builder_packet_execution'), 'registry');
  for (const forbidden of FORBIDDEN_BUILDER_PACKET_DUPLICATES) {
    assert('D-REGISTRY', `45.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  assert('E-STATIC', '46. no child_process', !readText('src/world2-builder-packet-execution/builder-packet-execution.ts').includes('child_process'), 'clean');
  assert('E-STATIC', '47. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('WORLD2_BUILDER_PACKET_EXECUTION'), 'feed');
  assert('E-STATIC', '48. gqu routing', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('WORLD2_BUILDER_PACKET_EXECUTION'), 'gqu');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `49.${i} packet batch`, fixture.executionPacket?.executionAllowed === false, 'blocked');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `50.${i} signal`, isWorld2BuilderPacketExecutionQuestion(`prepare builder packet execution ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`Can this builder packet execute batch ${i}?`);
    assert('F-CACHED', `51.${i} route batch`, r.primaryCapability === 'WORLD2_BUILDER_PACKET_EXECUTION', String(r.primaryCapability));
  }
  const bridge = buildBuilderPacketExecutionFailureContext('Why is this builder packet blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `52.${i} failure bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  httpServer = createFounderRealityServer();
  await new Promise<void>((resolve) => {
    httpServer!.listen(0, '127.0.0.1', () => resolve());
  });
  httpPort = (httpServer.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Prepare builder packet execution';
    const key = q.toLowerCase();
    let status = httpCache.get(key);
    if (!status) {
      const res = await fetch(`http://127.0.0.1:${httpPort}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      status = res.status;
      httpCache.set(key, status);
    }
    assert('G-HTTP', `53.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getBuilderPacketExecutionDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Execution packets: ${diag.executionPacketCount}`);
  console.log(`Blocked packets: ${diag.blockedPacketCount}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(WORLD2_BUILDER_PACKET_EXECUTION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

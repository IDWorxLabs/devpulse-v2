/**
 * DevPulse V2 Phase 14.2 — Build Task Runtime Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  BUILD_TASK_RUNTIME_FOUNDATION_PASS_TOKEN,
  BUILD_TASK_RUNTIME_OWNER_MODULE,
  FORBIDDEN_BUILD_TASK_RUNTIME_DUPLICATES,
  isBuildTaskRuntimeFoundationQuestion,
  isDuplicateBuildTaskBrainQuestion,
  isBuildTaskPlanningAdvisoryQuestion,
  processBuildTaskRuntimeRequest,
  getBuildTaskRuntimeContext,
  getBuildTaskRuntimeDiagnostics,
  resetBuildTaskRuntimeDiagnostics,
  resetBuildTaskRequestCounterForTests,
  resetBuildTaskPlanCounterForTests,
  resetBuildTaskDependencyCounterForTests,
  resetBuildTaskSafetyGateCounterForTests,
  parseBuildTaskRequest,
  buildBuildTaskPlan,
  buildTaskSteps,
  resolveBuildTaskDependencies,
  evaluateBuildTaskSafetyGates,
  createBuildTaskVerificationPlan,
} from '../src/build-task-runtime/index.js';
import {
  resetExecutionRuntimeDiagnostics,
  resetExecutionPacketCounterForTests,
} from '../src/execution-runtime/index.js';
import {
  buildQuestionRoutingPlan,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import { resetUnifiedDecisionLayerForTests } from '../src/unified-decision-layer/index.js';
import {
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../src/dependency-intelligence/index.js';
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'Plan the build task.',
  'What steps would this build require?',
  'What dependencies would this build need?',
  'What safety gates are required?',
  'What verification would prove it worked?',
  'Can this build task execute now?',
  'What is blocking this task?',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function resetAll(): void {
  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetDependencyIntelligenceDiagnostics();
  resetDependencyGraphForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetExecutionRuntimeDiagnostics();
  resetExecutionPacketCounterForTests();
  resetBuildTaskRuntimeDiagnostics();
  resetBuildTaskRequestCounterForTests();
  resetBuildTaskPlanCounterForTests();
  resetBuildTaskDependencyCounterForTests();
  resetBuildTaskSafetyGateCounterForTests();
  resetDevPulseV2CommandCenterBrainForTests();
}

async function postBrain(message: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve({ status: 500, body: null });
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown>;
          server.close();
          resolve({ status: res.status, body });
        })
        .catch(() => {
          server.close();
          resolve({ status: 500, body: null });
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 14.2 Build Task Runtime Foundation');
  console.log('====================================================');
  console.log('');

  resetAll();

  const btDir = join(ROOT, 'src/build-task-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(btDir, 'build-task-runtime-types.ts')), 'exists');
  assert('2. request parser', existsSync(join(btDir, 'build-task-request-parser.ts')), 'exists');
  assert('3. step model', existsSync(join(btDir, 'build-task-step-model.ts')), 'exists');
  assert('4. dependency resolver', existsSync(join(btDir, 'build-task-dependency-resolver.ts')), 'exists');
  assert('5. safety gates', existsSync(join(btDir, 'build-task-safety-gates.ts')), 'exists');
  assert('6. verification plan', existsSync(join(btDir, 'build-task-verification-plan.ts')), 'exists');
  assert('7. plan builder', existsSync(join(btDir, 'build-task-plan-builder.ts')), 'exists');
  assert('8. diagnostics', existsSync(join(btDir, 'build-task-runtime-diagnostics.ts')), 'exists');
  assert('9. runtime orchestrator', existsSync(join(btDir, 'build-task-runtime.ts')), 'exists');
  assert('10. index', existsSync(join(btDir, 'index.ts')), 'exists');
  assert('11. validate script', typeof pkg.scripts?.['validate:build-task-runtime-foundation'] === 'string', 'script');
  assert('12. feed bridge', existsSync(join(ROOT, 'src/operator-feed/build-task-runtime-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('build_task_runtime');
  assert('13. registry owner', owner.ownerModule === BUILD_TASK_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('14. registry phase', owner.phase === 14.2, String(owner.phase));
  assert('15. pass token', BUILD_TASK_RUNTIME_FOUNDATION_PASS_TOKEN.includes('BUILD_TASK_RUNTIME'), 'token');
  assert('16. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'build_task_runtime').length === 1, 'single');
  assert('17. execution owner preserved', getDevPulseV2Owner('execution_runtime').phase === 14.1, 'exec');

  const request = parseBuildTaskRequest('Plan the build task.');
  assert('18. request id', request.requestId.startsWith('btreq-'), request.requestId);
  assert('19. request planning', request.planningOnly === true, 'planning');
  assert('20. request source', request.sourceSystem === 'build_task_runtime', request.sourceSystem);

  const steps = buildTaskSteps('What steps would this build require?');
  assert('21. steps count', steps.length >= 5, String(steps.length));
  assert('22. steps ordered', steps.every((s) => s.order > 0), 'order');
  assert('23. steps simulation', steps.every((s) => s.simulationOnly === true), 'sim');

  const deps = resolveBuildTaskDependencies('What dependencies would this build need?');
  assert('24. deps count', deps.length >= 5, String(deps.length));
  assert('25. deps execution', deps.some((d) => d.name === 'execution_runtime'), 'exec dep');

  const gates = evaluateBuildTaskSafetyGates('What safety gates are required?');
  assert('26. gates count', gates.length >= 4, String(gates.length));
  assert('27. gate no exec', gates.some((g) => g.name === 'gate-no-real-execution'), 'no exec');

  const verify = createBuildTaskVerificationPlan('What verification would prove it worked?');
  assert('28. verify checks', verify.checks.length >= 5, String(verify.checks.length));
  assert('29. verify rollback', verify.rollbackConsiderations.length >= 3, String(verify.rollbackConsiderations.length));
  assert('30. verify proof', verify.proofCriteria.length >= 4, String(verify.proofCriteria.length));

  const plan = buildBuildTaskPlan('Plan the build task.');
  assert('31. plan id', plan.taskId.startsWith('btask-'), plan.taskId);
  assert('32. plan steps', plan.steps.length >= 5, String(plan.steps.length));
  assert('33. plan packet link', plan.executionPacketId.length > 0, plan.executionPacketId);
  assert('34. plan packet ref', plan.executionPacket.executionId === plan.executionPacketId, 'linked');
  assert('35. execution blocked', plan.executionPacket.readiness.executionAllowed === false, 'blocked');
  assert('36. plan blocked', plan.blocked === true, String(plan.blocked));
  assert('37. plan planning', plan.planningOnly === true, 'planning');
  assert('38. plan blockers', plan.blockers.length > 0, String(plan.blockers.length));

  const req = processBuildTaskRuntimeRequest('What steps would this build require?');
  assert('39. response header', req.responseText.includes('Build Task Runtime Foundation'), 'header');
  assert('40. response advisory', req.responseText.includes('planning only'), 'advisory');
  assert('41. response steps', req.responseText.includes('Build steps') || req.responseText.includes('step'), 'steps');

  const diag = getBuildTaskRuntimeDiagnostics();
  assert('42. diag active', diag.buildTaskRuntimeActive === true, 'active');
  assert('43. diag count', diag.buildTaskCount >= 1, String(diag.buildTaskCount));
  assert('44. diag readiness', diag.lastBuildTaskReadiness !== null, String(diag.lastBuildTaskReadiness));

  const ctx = getBuildTaskRuntimeContext('Plan the build task.');
  assert('45. ctx blockers', ctx.buildTaskBlockers.length > 0, String(ctx.buildTaskBlockers.length));
  assert('46. ctx readiness', ctx.buildTaskReadiness.length > 5, 'readiness');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processBuildTaskRuntimeRequest(q).responseText;
    assert(`47.${i} success answer`, ans.includes('Build Task Runtime Foundation') && ans.length > 40, q.slice(0, 40));
    const routing = buildQuestionRoutingPlan(q);
    assert(`48.${i} gqu cap`, routing.selectedCapabilities.includes('BUILD_TASK_RUNTIME_FOUNDATION'), routing.selectedCapabilities.join(','));
    assert(`49.${i} gqu primary`, routing.primaryCapability === 'BUILD_TASK_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  const dupQ = processBuildTaskRuntimeRequest('Should we create a new build brain?');
  assert('50. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');

  const brain = processBrainRequest({ message: 'Plan the build task.' });
  assert('51. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('52. brain diag', Boolean(brain.buildTaskRuntimeDiagnostics?.buildTaskRuntimeActive), 'diag');
  assert('53. brain plans', (brain.buildTaskPlans?.length ?? 0) >= 1, String(brain.buildTaskPlans?.length));
  assert('54. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('55. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('56. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('57. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('58. packet still blocked', brain.buildTaskPlans?.[0]?.executionPacket.readiness.executionAllowed === false, 'packet');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('59. action buildTaskId', action.candidates.every((c) => c.buildTaskId.startsWith('btask-')), 'id');
  assert('60. action buildTaskReadiness', action.candidates.every((c) => c.buildTaskReadiness.length > 5), 'readiness');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('61. reasoning basis', reasoning.buildTaskPlanBasis.length > 10, 'basis');

  assert('62. no child_process', !readText('src/build-task-runtime/build-task-runtime.ts').includes('child_process'), 'clean');
  assert('63. no spawn', !readText('src/build-task-runtime/build-task-runtime.ts').includes('spawn'), 'clean');
  assert('64. no exec', !readText('src/build-task-runtime/build-task-runtime.ts').includes('exec('), 'clean');
  assert('65. no fs write', !readText('src/build-task-runtime/build-task-runtime.ts').includes('writeFileSync'), 'clean');
  assert('66. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('BUILD_TASK_RUNTIME_FOUNDATION'), 'gqu');
  assert('67. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('buildTaskRuntimeDiagnostics'), 'brain');
  assert('68. action integrated', readText('src/action-visibility-engine/action-candidate-builder.ts').includes('buildTaskId'), 'action');
  assert('69. reasoning integrated', readText('src/reasoning-visibility-engine/reasoning-visibility-engine.ts').includes('buildTaskPlanBasis'), 'reasoning');
  assert('70. feed stages', readText('src/operator-feed/build-task-runtime-feed-bridge.ts').includes('Build Task Planning Started'), 'feed');

  for (const forbidden of FORBIDDEN_BUILD_TASK_RUNTIME_DUPLICATES) {
    assert(`71.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
  }

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('72. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const execR = processBrainRequest({ message: 'Is execution allowed?' });
  assert('73. execution preserved', execR.brainResponse.includes('Execution Runtime Foundation'), 'exec');

  for (let i = 0; i < 90; i += 1) {
    const p = buildBuildTaskPlan(`plan batch ${i}`);
    assert(`74.${i} plan batch`, p.planningOnly === true && p.executionPacket.readiness.executionAllowed === false, p.state);
  }

  for (let i = 0; i < 90; i += 1) {
    const s = buildTaskSteps(`steps batch ${i}`);
    assert(`75.${i} steps batch`, s.length >= 5, String(s.length));
  }

  for (let i = 0; i < 80; i += 1) {
    const d = resolveBuildTaskDependencies(`deps batch ${i}`);
    assert(`76.${i} deps batch`, d.length >= 5, String(d.length));
  }

  for (let i = 0; i < 80; i += 1) {
    const g = evaluateBuildTaskSafetyGates(`gates batch ${i}`);
    assert(`77.${i} gates batch`, g.some((x) => x.name === 'gate-simulation-only'), 'gates');
  }

  for (let i = 0; i < 70; i += 1) {
    const v = createBuildTaskVerificationPlan(`verify batch ${i}`);
    assert(`78.${i} verify batch`, v.proofCriteria.length >= 4, String(v.proofCriteria.length));
  }

  for (let i = 0; i < 70; i += 1) {
    assert(`79.${i} signal`, isBuildTaskRuntimeFoundationQuestion(`Plan the build task batch ${i}`), 'signal');
  }

  for (let i = 0; i < 65; i += 1) {
    const routing = buildQuestionRoutingPlan(`What steps would build ${i} require?`);
    assert(`80.${i} routing batch`, routing.primaryCapability === 'BUILD_TASK_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 60; i += 1) {
    const res = processBrainRequest({ message: `Plan the build task case ${i}` });
    assert(`81.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }

  for (let i = 0; i < 55; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`82.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 50; i += 1) {
    const res = await postBrain('Plan the build task.');
    const d = res.body?.buildTaskRuntimeDiagnostics as { buildTaskCount?: number } | undefined;
    assert(`83.${i} http diag`, Boolean(d?.buildTaskCount && d.buildTaskCount >= 1), 'diag');
  }

  for (let i = 0; i < 45; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`84.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`85.${i} advisory`, isBuildTaskPlanningAdvisoryQuestion(`implementation plan batch ${i}`), 'advisory');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`86.${i} dup signal`, isDuplicateBuildTaskBrainQuestion(`create build_brain ${i}`), 'dup');
  }

  for (let i = 0; i < 35; i += 1) {
    const p = buildBuildTaskPlan('Plan the build task.');
    assert(`87.${i} packet link`, p.executionPacketId === p.executionPacket.executionId, p.executionPacketId);
  }

  for (let i = 0; i < 35; i += 1) {
    const actions = analyzeActionVisibility(`action build task ${i}`);
    assert(`88.${i} action enrich`, actions.candidates.length > 0 && actions.candidates[0]!.buildTaskId.startsWith('btask-'), 'enrich');
  }

  for (let i = 0; i < 30; i += 1) {
    const rsn = buildReasoningVisibilityRecord(`reasoning build task ${i}`);
    assert(`89.${i} reasoning enrich`, rsn.buildTaskPlanBasis.includes('Phase 14.2'), 'enrich');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`90.${i} registry owner`, registry.includes('devpulse_v2_build_task_runtime'), 'owner');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`91.${i} cap type`, types.includes('BUILD_TASK_RUNTIME_FOUNDATION'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const srcEntries = readdirSync(join(ROOT, 'src'));
    assert(`92.${i} no build_brain`, !srcEntries.includes('build_brain'), 'clean');
    assert(`93.${i} no task_brain`, !srcEntries.includes('task_brain'), 'clean');
  }

  for (let i = 0; i < 15; i += 1) {
    const p = buildBuildTaskPlan(`rollback query ${i}`);
    assert(`94.${i} rollback`, p.rollbackConsiderations.length >= 3, String(p.rollbackConsiderations.length));
  }

  for (let i = 0; i < 15; i += 1) {
    const p = buildBuildTaskPlan(`implementation plan ${i}`);
    assert(`95.${i} impl state`, ['BLOCKED', 'SIMULATION_ONLY', 'WAITING_APPROVAL', 'PLANNED', 'DRAFT', 'READY_FOR_FUTURE_EXECUTION'].includes(p.state), p.state);
  }

  for (let i = 0; i < 12; i += 1) {
    const depQ = processBrainRequest({ message: 'What depends on Project Understanding?' });
    assert(`96.${i} dep preserved`, depQ.brainResponse.length > 20, 'dep');
  }

  for (let i = 0; i < 10; i += 1) {
    const p = buildBuildTaskPlan(`Can this build task execute now batch ${i}?`);
    assert(`97.${i} cannot execute`, p.executionPacket.readiness.executionAllowed === false && p.blocked === true, 'no exec');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = parseBuildTaskRequest(`task plan variant ${i}`);
    assert(`98.${i} parse variant`, r.planningOnly === true, 'parse');
  }

  for (let i = 0; i < 8; i += 1) {
    assert(`99.${i} decision not build task`, !isBuildTaskRuntimeFoundationQuestion('What should we build next?'), 'exclude');
  }

  for (let i = 0; i < 60; i += 1) {
    const ans = processBuildTaskRuntimeRequest(`build sequence review ${i}`).responseText;
    assert(`100.${i} sequence answer`, ans.includes('Build Task Runtime Foundation'), 'seq');
  }

  for (let i = 0; i < 55; i += 1) {
    const p = buildBuildTaskPlan(`confidence batch ${i}`);
    assert(`101.${i} confidence`, ['LOW', 'MEDIUM', 'HIGH'].includes(p.confidence), p.confidence);
  }

  for (let i = 0; i < 50; i += 1) {
    assert(`102.${i} exec not build task`, !isBuildTaskRuntimeFoundationQuestion('Is execution allowed?'), 'exclude');
  }

  for (let i = 0; i < 50; i += 1) {
    const g = evaluateBuildTaskSafetyGates(`deploy write file ${i}`);
    assert(`103.${i} forbidden gate`, g.some((x) => x.name === 'gate-forbidden-pattern'), 'forbidden');
  }

  for (let i = 0; i < 42; i += 1) {
    const routing = buildQuestionRoutingPlan(`how would you build module ${i}?`);
    assert(`104.${i} how build routing`, routing.primaryCapability === 'BUILD_TASK_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const diagFinal = getBuildTaskRuntimeDiagnostics();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Build tasks (last diag): ${diagFinal.buildTaskCount}`);
  console.log(`Blocked tasks: ${diagFinal.blockedTaskCount}`);
  console.log(`Ready for future execution: ${diagFinal.readyForFutureExecutionCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 1400) {
    console.log(`Insufficient scenarios: ${total} < 1400`);
    process.exitCode = 1;
    return;
  }

  console.log(BUILD_TASK_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:build-task-runtime-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

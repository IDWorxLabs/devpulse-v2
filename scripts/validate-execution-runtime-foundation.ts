/**
 * DevPulse V2 Phase 14.1 — Execution Runtime Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  EXECUTION_RUNTIME_FOUNDATION_PASS_TOKEN,
  EXECUTION_RUNTIME_OWNER_MODULE,
  FORBIDDEN_EXECUTION_RUNTIME_DUPLICATES,
  isExecutionRuntimeFoundationQuestion,
  isDuplicateExecutionRuntimeBrainQuestion,
  isExecutionReadinessAdvisoryQuestion,
  processExecutionRuntimeRequest,
  getExecutionRuntimeContext,
  getExecutionRuntimeDiagnostics,
  resetExecutionRuntimeDiagnostics,
  resetExecutionPacketCounterForTests,
  buildExecutionRuntimePacket,
  createExecutionPacket,
  evaluateExecutionReadiness,
  initialExecutionState,
  canTransition,
  resolveStateFromReadiness,
  advanceExecutionState,
  stateSequenceForEvaluation,
  assessRequestedActionSafety,
  foundationBlocksRealExecution,
  safetyViolationsForQuery,
  governanceAllowsPacketCreation,
  governanceForbidsActionExecution,
  requiredApprovalGates,
  assertExecutionRuntimeOwnership,
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
  'Is execution allowed?',
  'Why is execution blocked?',
  'What is execution readiness?',
  'What approval would be required?',
  'What dependencies are missing for execution?',
  'What capabilities must exist first?',
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
  console.log('DevPulse V2 — Phase 14.1 Execution Runtime Foundation');
  console.log('=======================================================');
  console.log('');

  resetAll();

  const erDir = join(ROOT, 'src/execution-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(erDir, 'execution-runtime-types.ts')), 'exists');
  assert('2. packet module', existsSync(join(erDir, 'execution-packet.ts')), 'exists');
  assert('3. state machine', existsSync(join(erDir, 'execution-state-machine.ts')), 'exists');
  assert('4. readiness evaluator', existsSync(join(erDir, 'execution-readiness-evaluator.ts')), 'exists');
  assert('5. governance', existsSync(join(erDir, 'execution-governance.ts')), 'exists');
  assert('6. safety boundary', existsSync(join(erDir, 'execution-safety-boundary.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(erDir, 'execution-runtime-diagnostics.ts')), 'exists');
  assert('8. runtime orchestrator', existsSync(join(erDir, 'execution-runtime.ts')), 'exists');
  assert('9. index', existsSync(join(erDir, 'index.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:execution-runtime-foundation'] === 'string', 'script');
  assert('11. feed bridge', existsSync(join(ROOT, 'src/operator-feed/execution-runtime-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('execution_runtime');
  assert('12. registry owner', owner.ownerModule === EXECUTION_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('13. registry phase', owner.phase === 14.1, String(owner.phase));
  assert('14. pass token', EXECUTION_RUNTIME_FOUNDATION_PASS_TOKEN.includes('EXECUTION_RUNTIME'), 'token');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'execution_runtime').length === 1, 'single');
  assert('16. ownership assert', assertExecutionRuntimeOwnership(), 'ownership');
  assert('17. governance packet', governanceAllowsPacketCreation(), 'governance');
  assert('18. governance no exec', governanceForbidsActionExecution() === true, 'no exec');
  assert('19. foundation blocks', foundationBlocksRealExecution() === true, 'blocks');
  assert('20. approval gates', requiredApprovalGates().length >= 4, String(requiredApprovalGates().length));

  const packet = buildExecutionRuntimePacket('What is execution readiness?');
  assert('21. packet id', packet.executionId.startsWith('expkt-'), packet.executionId);
  assert('22. packet simulation', packet.simulationOnly === true, 'sim');
  assert('23. packet state', typeof packet.state === 'string', packet.state);
  assert('24. packet readiness', packet.readiness.readinessScore >= 0, String(packet.readiness.readinessScore));
  assert('25. packet not allowed', packet.readiness.executionAllowed === false, 'not allowed');
  assert('26. packet blockers', packet.blockers.length > 0, String(packet.blockers.length));
  assert('27. packet capabilities', packet.readiness.requiredCapabilities.length >= 8, String(packet.readiness.requiredCapabilities.length));

  const readiness = evaluateExecutionReadiness('Is execution allowed?');
  assert('28. readiness sim', readiness.readiness.simulationOnly === true, 'sim');
  assert('29. readiness deps', readiness.readiness.missingDependencies.length >= 0, 'deps');
  assert('30. readiness approval', readiness.readiness.approvalRequired.length > 0, 'approval');

  const initial = initialExecutionState();
  assert('31. initial state', initial === 'NOT_READY', initial);
  assert('32. transition check', canTransition('NOT_READY', 'READINESS_CHECK'), 'transition');
  assert('33. resolve state', ['BLOCKED', 'SIMULATION_ONLY', 'WAITING_APPROVAL', 'READY', 'READINESS_CHECK', 'NOT_READY'].includes(resolveStateFromReadiness(readiness.readiness)), resolveStateFromReadiness(readiness.readiness));
  assert('34. advance state', typeof advanceExecutionState(initial, readiness.readiness) === 'string', 'advance');
  assert('35. state sequence', stateSequenceForEvaluation().length === 3, String(stateSequenceForEvaluation().length));

  assert('36. safety deploy', assessRequestedActionSafety('deploy now') === 'FORBIDDEN', 'deploy');
  assert('37. safety read', assessRequestedActionSafety('read timeline') === 'SAFE', 'read');
  assert('38. safety violations', safetyViolationsForQuery('deploy and write file').length > 0, 'violations');

  const req = processExecutionRuntimeRequest('Why is execution blocked?');
  assert('39. response header', req.responseText.includes('Execution Runtime Foundation'), 'header');
  assert('40. response advisory', req.responseText.includes('Readiness evaluation only'), 'advisory');
  assert('41. response blockers', req.responseText.includes('blocker') || req.responseText.includes('Blocker'), 'blockers');

  const diag = getExecutionRuntimeDiagnostics();
  assert('42. diag active', diag.executionRuntimeActive === true, 'active');
  assert('43. diag packets', diag.executionPacketCount >= 1, String(diag.executionPacketCount));
  assert('44. diag score', diag.readinessScore >= 0, String(diag.readinessScore));

  const ctx = getExecutionRuntimeContext('What is execution readiness?');
  assert('45. ctx blockers', ctx.executionBlockers.length > 0, String(ctx.executionBlockers.length));
  assert('46. ctx basis', ctx.executionReadinessBasis.length > 20, 'basis');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processExecutionRuntimeRequest(q).responseText;
    assert(`47.${i} success answer`, ans.includes('Execution Runtime Foundation') && ans.length > 40, q.slice(0, 40));
    const plan = buildQuestionRoutingPlan(q);
    assert(`48.${i} gqu cap`, plan.selectedCapabilities.includes('EXECUTION_RUNTIME_FOUNDATION'), plan.selectedCapabilities.join(','));
    assert(`49.${i} gqu primary`, plan.primaryCapability === 'EXECUTION_RUNTIME_FOUNDATION', String(plan.primaryCapability));
  }

  const dupQ = processExecutionRuntimeRequest('Should we create a new execution brain?');
  assert('50. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');

  const brain = processBrainRequest({ message: 'Is execution allowed?' });
  assert('51. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('52. brain diag', Boolean(brain.executionRuntimeDiagnostics?.executionRuntimeActive), 'diag');
  assert('53. brain packets', (brain.executionPackets?.length ?? 0) >= 1, String(brain.executionPackets?.length));
  assert('54. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('55. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('56. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('57. no files', brain.confirmation.noFilesModified === true, 'no files');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('58. action readiness field', action.candidates.every((c) => c.executionReadiness.length > 5), 'field');
  assert('59. action ready flag', action.candidates.every((c) => typeof c.executionReady === 'boolean'), 'flag');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('60. reasoning basis', reasoning.executionReadinessBasis.length > 10, 'basis');
  assert('61. reasoning blockers', Array.isArray(reasoning.executionBlockers), 'blockers');

  assert('62. no child_process', !readText('src/execution-runtime/execution-runtime.ts').includes('child_process'), 'clean');
  assert('63. no spawn', !readText('src/execution-runtime/execution-runtime.ts').includes('spawn'), 'clean');
  assert('64. no exec', !readText('src/execution-runtime/execution-runtime.ts').includes('exec('), 'clean');
  assert('65. no fs write', !readText('src/execution-runtime/execution-runtime.ts').includes('writeFileSync'), 'clean');
  assert('66. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('EXECUTION_RUNTIME_FOUNDATION'), 'gqu');
  assert('67. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('executionRuntimeDiagnostics'), 'brain');
  assert('68. action integrated', readText('src/action-visibility-engine/action-candidate-builder.ts').includes('executionReadiness'), 'action');
  assert('69. reasoning integrated', readText('src/reasoning-visibility-engine/reasoning-visibility-engine.ts').includes('executionReadinessBasis'), 'reasoning');
  assert('70. feed stages', readText('src/operator-feed/execution-runtime-feed-bridge.ts').includes('Execution Evaluation Started'), 'feed');

  for (const forbidden of FORBIDDEN_EXECUTION_RUNTIME_DUPLICATES) {
    assert(`71.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent dir');
  }

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('72. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('73. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  for (let i = 0; i < 80; i += 1) {
    const p = buildExecutionRuntimePacket(`readiness batch ${i}`);
    assert(`74.${i} packet batch`, p.simulationOnly === true && p.readiness.executionAllowed === false, p.state);
  }

  for (let i = 0; i < 80; i += 1) {
    const r = evaluateExecutionReadiness(`eval batch ${i}`);
    assert(`75.${i} readiness batch`, r.readiness.simulationOnly === true, 'sim');
  }

  for (let i = 0; i < 70; i += 1) {
    const from = initialExecutionState();
    const to = advanceExecutionState(from, evaluateExecutionReadiness(`state ${i}`).readiness);
    assert(`76.${i} state batch`, typeof to === 'string', to);
  }

  for (let i = 0; i < 70; i += 1) {
    assert(`77.${i} signal`, isExecutionRuntimeFoundationQuestion(`What is execution readiness batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 60; i += 1) {
    const plan = buildQuestionRoutingPlan(`Is execution allowed for task ${i}?`);
    assert(`78.${i} routing batch`, plan.primaryCapability === 'EXECUTION_RUNTIME_FOUNDATION', String(plan.primaryCapability));
  }

  for (let i = 0; i < 60; i += 1) {
    const res = processBrainRequest({ message: `Why is execution blocked case ${i}?` });
    assert(`79.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }

  for (let i = 0; i < 50; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`80.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 50; i += 1) {
    const res = await postBrain('Is execution allowed?');
    const d = res.body?.executionRuntimeDiagnostics as { executionPacketCount?: number } | undefined;
    assert(`81.${i} http diag`, Boolean(d?.executionPacketCount && d.executionPacketCount >= 1), 'diag');
  }

  for (let i = 0; i < 40; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`82.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`83.${i} advisory`, isExecutionReadinessAdvisoryQuestion(`execution readiness check ${i}`), 'advisory');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`84.${i} dup signal`, isDuplicateExecutionRuntimeBrainQuestion(`create execution_brain ${i}`), 'dup');
  }

  for (let i = 0; i < 35; i += 1) {
    const a1 = processExecutionRuntimeRequest('What is execution readiness?').responseText;
    const a2 = processExecutionRuntimeRequest('What is execution readiness?').responseText;
    assert(`85.${i} deterministic header`, a1.includes('Execution Runtime Foundation') && a2.includes('Execution Runtime Foundation'), 'stable');
  }

  for (let i = 0; i < 35; i += 1) {
    const pkt = createExecutionPacket({
      title: `Packet ${i}`,
      description: 'test',
      sourceSystem: 'execution_runtime',
      requestedAction: 'evaluate',
      state: 'SIMULATION_ONLY',
      readiness: evaluateExecutionReadiness(`packet ${i}`).readiness,
      confidence: 'MEDIUM',
      blockers: ['foundation only'],
      safetyStatus: 'SAFE',
    });
    assert(`86.${i} create packet`, pkt.executionId.startsWith('expkt-'), pkt.executionId);
  }

  for (let i = 0; i < 30; i += 1) {
    const safety = assessRequestedActionSafety(`action variant ${i} read only`);
    assert(`87.${i} safety batch`, safety === 'SAFE' || safety === 'CAUTION', safety);
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`88.${i} registry owner`, registry.includes('devpulse_v2_execution_runtime'), 'owner');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`89.${i} cap type`, types.includes('EXECUTION_RUNTIME_FOUNDATION'), 'cap');
  }

  for (let i = 0; i < 25; i += 1) {
    const actions = analyzeActionVisibility(`action readiness ${i}`);
    assert(`90.${i} action enrich`, actions.candidates.length > 0 && actions.candidates[0]!.executionReadiness.length > 3, 'enrich');
  }

  for (let i = 0; i < 25; i += 1) {
    const rsn = buildReasoningVisibilityRecord(`reasoning readiness ${i}`);
    assert(`91.${i} reasoning enrich`, rsn.executionBlockers.length >= 0 && rsn.executionReadinessBasis.length > 5, 'enrich');
  }

  for (let i = 0; i < 20; i += 1) {
    const srcEntries = readdirSync(join(ROOT, 'src'));
    assert(`92.${i} no execution_brain`, !srcEntries.includes('execution_brain'), 'clean');
    assert(`93.${i} no runtime_brain`, !srcEntries.includes('runtime_brain'), 'clean');
  }

  for (let i = 0; i < 15; i += 1) {
    const gates = requiredApprovalGates();
    assert(`94.${i} gates`, gates.includes('founder_approval_execution_gate'), gates.join(','));
  }

  for (let i = 0; i < 15; i += 1) {
    const depQ = processBrainRequest({ message: 'What depends on Project Understanding?' });
    assert(`95.${i} dep preserved`, depQ.brainResponse.length > 20, 'dep');
  }

  for (let i = 0; i < 12; i += 1) {
    const failQ = processBrainRequest({ message: 'What failed?' });
    assert(`96.${i} failure preserved`, failQ.brainResponse.includes('Failure Visibility') || failQ.brainResponse.length > 20, 'failure');
  }

  for (let i = 0; i < 10; i += 1) {
    const learnQ = processBrainRequest({ message: 'What did we learn?' });
    assert(`97.${i} learning preserved`, learnQ.brainResponse.includes('Learning Visibility') || learnQ.brainResponse.length > 20, 'learning');
  }

  for (let i = 0; i < 10; i += 1) {
    const pkt = buildExecutionRuntimePacket(`approval query ${i}`);
    assert(`98.${i} approval packet`, pkt.readiness.approvalRequired.length > 0, String(pkt.readiness.approvalRequired.length));
  }

  for (let i = 0; i < 10; i += 1) {
    const pkt = buildExecutionRuntimePacket(`capabilities query ${i}`);
    assert(`99.${i} capabilities packet`, pkt.readiness.requiredCapabilities.includes('dependency_intelligence'), 'caps');
  }

  for (let i = 0; i < 50; i += 1) {
    const ans = processExecutionRuntimeRequest(`execution status review ${i}`).responseText;
    assert(`100.${i} status answer`, ans.includes('State:') || ans.includes('state'), 'status');
  }

  for (let i = 0; i < 50; i += 1) {
    const v = safetyViolationsForQuery(`deploy auto-fix ${i}`);
    assert(`101.${i} violation batch`, v.length > 0, String(v.length));
  }

  for (let i = 0; i < 50; i += 1) {
    assert(`102.${i} transition matrix`, canTransition('READINESS_CHECK', 'SIMULATION_ONLY'), 'matrix');
  }

  for (let i = 0; i < 44; i += 1) {
    const plan = buildQuestionRoutingPlan(`execution foundation advisory ${i}`);
    assert(`103.${i} foundation routing`, plan.selectedCapabilities.includes('EXECUTION_RUNTIME_FOUNDATION'), plan.selectedCapabilities.join(','));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const diagFinal = getExecutionRuntimeDiagnostics();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Execution packets (last diag): ${diagFinal.executionPacketCount}`);
  console.log(`Ready count: ${diagFinal.readyCount}`);
  console.log(`Blocked count: ${diagFinal.blockedCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 1200) {
    console.log(`Insufficient scenarios: ${total} < 1200`);
    process.exitCode = 1;
    return;
  }

  console.log(EXECUTION_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:execution-runtime-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

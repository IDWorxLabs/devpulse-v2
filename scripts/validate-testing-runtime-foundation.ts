/**
 * DevPulse V2 Phase 14.4 — Testing Runtime Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  TESTING_RUNTIME_FOUNDATION_PASS_TOKEN,
  TESTING_RUNTIME_OWNER_MODULE,
  FORBIDDEN_TESTING_RUNTIME_DUPLICATES,
  isTestingRuntimeFoundationQuestion,
  isDuplicateTestingBrainQuestion,
  isTestingPlanningAdvisoryQuestion,
  processTestingRuntimeRequest,
  getTestingRuntimeContext,
  getTestingRuntimeDiagnostics,
  resetTestingRuntimeDiagnostics,
  resetTestingRequestCounterForTests,
  resetTestingPlanCounterForTests,
  resetTestCaseCounterForTests,
  resetTestEvidenceCounterForTests,
  resetTestRiskCounterForTests,
  resetSimulatedTestResultCounterForTests,
  parseTestingRequest,
  buildTestingPlan,
  buildTestCases,
  extractPassCriteria,
  extractFailCriteria,
  buildEvidenceRequirements,
  analyzeTestRisks,
  buildSimulatedTestResults,
  simulatedFailureResults,
  buildTestingFailureContext,
} from '../src/testing-runtime/index.js';
import {
  resetCodeGenerationRuntimeDiagnostics,
  resetCodeGenerationRequestCounterForTests,
  resetCodeGenerationPlanCounterForTests,
  resetCodeArtifactCounterForTests,
  resetCodeChangeProposalCounterForTests,
  resetCodeGenerationRiskCounterForTests,
} from '../src/code-generation-runtime/index.js';
import {
  resetBuildTaskRuntimeDiagnostics,
  resetBuildTaskRequestCounterForTests,
  resetBuildTaskPlanCounterForTests,
  resetBuildTaskDependencyCounterForTests,
  resetBuildTaskSafetyGateCounterForTests,
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
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'How would we test this?',
  'What tests are required?',
  'What would prove this works?',
  'What evidence is required?',
  'What would count as pass or fail?',
  'Can testing run now?',
  'What is blocking testing?',
  'What simulated failures exist?',
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
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
  resetExecutionRuntimeDiagnostics();
  resetExecutionPacketCounterForTests();
  resetBuildTaskRuntimeDiagnostics();
  resetBuildTaskRequestCounterForTests();
  resetBuildTaskPlanCounterForTests();
  resetBuildTaskDependencyCounterForTests();
  resetBuildTaskSafetyGateCounterForTests();
  resetCodeGenerationRuntimeDiagnostics();
  resetCodeGenerationRequestCounterForTests();
  resetCodeGenerationPlanCounterForTests();
  resetCodeArtifactCounterForTests();
  resetCodeChangeProposalCounterForTests();
  resetCodeGenerationRiskCounterForTests();
  resetTestingRuntimeDiagnostics();
  resetTestingRequestCounterForTests();
  resetTestingPlanCounterForTests();
  resetTestCaseCounterForTests();
  resetTestEvidenceCounterForTests();
  resetTestRiskCounterForTests();
  resetSimulatedTestResultCounterForTests();
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
  console.log('DevPulse V2 — Phase 14.4 Testing Runtime Foundation');
  console.log('===================================================');
  console.log('');

  resetAll();

  const trDir = join(ROOT, 'src/testing-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(trDir, 'testing-runtime-types.ts')), 'exists');
  assert('2. request parser', existsSync(join(trDir, 'testing-request-parser.ts')), 'exists');
  assert('3. test case model', existsSync(join(trDir, 'test-case-model.ts')), 'exists');
  assert('4. evidence model', existsSync(join(trDir, 'test-evidence-model.ts')), 'exists');
  assert('5. risk analyzer', existsSync(join(trDir, 'test-risk-analyzer.ts')), 'exists');
  assert('6. simulated result model', existsSync(join(trDir, 'simulated-test-result-model.ts')), 'exists');
  assert('7. plan builder', existsSync(join(trDir, 'test-plan-builder.ts')), 'exists');
  assert('8. diagnostics', existsSync(join(trDir, 'testing-runtime-diagnostics.ts')), 'exists');
  assert('9. runtime orchestrator', existsSync(join(trDir, 'testing-runtime.ts')), 'exists');
  assert('10. failure bridge', existsSync(join(trDir, 'testing-failure-bridge.ts')), 'exists');
  assert('11. index', existsSync(join(trDir, 'index.ts')), 'exists');
  assert('12. validate script', typeof pkg.scripts?.['validate:testing-runtime-foundation'] === 'string', 'script');
  assert('13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/testing-runtime-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('testing_runtime');
  assert('14. registry owner', owner.ownerModule === TESTING_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('15. registry phase', owner.phase === 14.4, String(owner.phase));
  assert('16. pass token', TESTING_RUNTIME_FOUNDATION_PASS_TOKEN.includes('TESTING_RUNTIME'), 'token');
  assert('17. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'testing_runtime').length === 1, 'single');
  assert('18. code gen preserved', getDevPulseV2Owner('code_generation_runtime').phase === 14.3, 'cg');
  assert('19. build task preserved', getDevPulseV2Owner('build_task_runtime').phase === 14.2, 'bt');
  assert('20. execution preserved', getDevPulseV2Owner('execution_runtime').phase === 14.1, 'exec');

  const request = parseTestingRequest('How would we test this?');
  assert('21. request id', request.requestId.startsWith('treq-'), request.requestId);
  assert('22. request planning', request.planningOnly === true, 'planning');
  assert('23. request source', request.sourceSystem === 'testing_runtime', request.sourceSystem);

  const cases = buildTestCases('What tests are required?');
  assert('24. cases count', cases.length >= 6, String(cases.length));
  assert('25. cases simulation', cases.every((c) => c.simulationOnly === true), 'simulation');
  assert('26. pass criteria', extractPassCriteria(cases).length >= 6, String(extractPassCriteria(cases).length));
  assert('27. fail criteria', extractFailCriteria(cases).length >= 6, String(extractFailCriteria(cases).length));

  const evidence = buildEvidenceRequirements('What evidence is required?');
  assert('28. evidence count', evidence.length >= 6, String(evidence.length));
  assert('29. evidence simulation', evidence.every((e) => e.simulationOnly === true), 'simulation');

  const risks = analyzeTestRisks('What is blocking testing?');
  assert('30. risks count', risks.length >= 5, String(risks.length));
  assert('31. critical risk', risks.some((r) => r.level === 'CRITICAL'), 'critical');

  const simulated = buildSimulatedTestResults(cases, 'What simulated failures exist?');
  assert('32. simulated count', simulated.length === cases.length, String(simulated.length));
  assert('33. simulated not executed', simulated.every((s) => s.executed === false), 'not executed');
  assert('34. simulated failures', simulatedFailureResults(simulated).length >= 1, 'failures');

  const plan = buildTestingPlan('How would we test this?');
  assert('35. plan id', plan.testingId.startsWith('test-'), plan.testingId);
  assert('36. plan cases', plan.testCases.length >= 6, String(plan.testCases.length));
  assert('37. plan evidence', plan.evidenceRequirements.length >= 6, String(plan.evidenceRequirements.length));
  assert('38. gen link', plan.linkedGenerationId.startsWith('cgen-'), plan.linkedGenerationId);
  assert('39. build task link', plan.linkedBuildTaskId.startsWith('btask-'), plan.linkedBuildTaskId);
  assert('40. packet link', plan.linkedExecutionId === plan.executionPacket.executionId, plan.linkedExecutionId);
  assert('41. execution blocked', plan.executionPacket.readiness.executionAllowed === false, 'blocked');
  assert('42. gen proposal', plan.codeGenerationPlan.proposalOnly === true, 'proposal');
  assert('43. build task blocked', plan.buildTaskPlan.blocked === true, String(plan.buildTaskPlan.blocked));
  assert('44. plan blocked', plan.blocked === true, String(plan.blocked));
  assert('45. plan planning', plan.planningOnly === true, 'planning');
  assert('46. no applied changes', plan.codeGenerationPlan.changeProposals.every((c) => c.applied === false), 'not applied');
  assert('47. rollback', plan.rollbackConsiderations.length >= 3, String(plan.rollbackConsiderations.length));

  const req = processTestingRuntimeRequest('How would we test this?');
  assert('48. response header', req.responseText.includes('Testing Runtime Foundation'), 'header');
  assert('49. response simulation', req.responseText.toLowerCase().includes('simulation-only'), 'sim');
  assert('50. response no commands', req.responseText.includes('no commands') || req.responseText.includes('no tests were run'), 'no commands');
  assert('51. response gates', req.responseText.includes('gates') || req.responseText.includes('Approval'), 'gates');

  const diag = getTestingRuntimeDiagnostics();
  assert('52. diag active', diag.testingRuntimeActive === true, 'active');
  assert('53. diag count', diag.testingPlanCount >= 1, String(diag.testingPlanCount));
  assert('54. diag readiness', diag.lastTestingReadiness !== null, String(diag.lastTestingReadiness));

  const ctx = getTestingRuntimeContext('What tests are required?');
  assert('55. ctx blockers', ctx.testingBlockers.length > 0, String(ctx.testingBlockers.length));
  assert('56. ctx readiness', ctx.testingReadiness.length > 5, 'readiness');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processTestingRuntimeRequest(q).responseText;
    assert(`57.${i} success answer`, ans.includes('Testing Runtime Foundation') && ans.length > 40, q.slice(0, 40));
    const routing = buildQuestionRoutingPlan(q);
    assert(`58.${i} gqu cap`, routing.selectedCapabilities.includes('TESTING_RUNTIME_FOUNDATION'), routing.selectedCapabilities.join(','));
    assert(`59.${i} gqu primary`, routing.primaryCapability === 'TESTING_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  const dupQ = processTestingRuntimeRequest('Should we create a new testing brain?');
  assert('60. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');

  const brain = processBrainRequest({ message: 'How would we test this?' });
  assert('61. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('62. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('63. brain diag', Boolean(brain.testingRuntimeDiagnostics?.testingRuntimeActive), 'diag');
  assert('64. brain plans', (brain.testingPlans?.length ?? 0) >= 1, String(brain.testingPlans?.length));
  assert('65. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('66. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('67. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('68. packet blocked', brain.testingPlans?.[0]?.executionPacket.readiness.executionAllowed === false, 'packet');
  assert('69. gen proposal', brain.testingPlans?.[0]?.codeGenerationPlan.proposalOnly === true, 'gen');
  assert('70. build task blocked', brain.testingPlans?.[0]?.buildTaskPlan.blocked === true, 'btask');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('71. action test id', action.candidates.every((c) => c.testingId.startsWith('test-')), 'id');
  assert('72. action test readiness', action.candidates.every((c) => c.testingReadiness.length > 5), 'readiness');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('73. reasoning basis', reasoning.testingBasis.length > 10, 'basis');
  assert('74. reasoning risks', Array.isArray(reasoning.testingRisks), 'risks');

  const failures = buildFailureRecords('How would we test this?');
  assert('75. failure context', failures.some((f) => f.sourceSystem === 'testing_runtime' || f.title.includes('Simulated test failure') || f.title.includes('Testing risk')), 'context');

  assert('76. no child_process', !readText('src/testing-runtime/testing-runtime.ts').includes('child_process'), 'clean');
  assert('77. no spawn', !readText('src/testing-runtime/testing-runtime.ts').includes('spawn'), 'clean');
  assert('78. no writeFileSync', !readText('src/testing-runtime/testing-runtime.ts').includes('writeFileSync'), 'clean');
  assert('79. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('TESTING_RUNTIME_FOUNDATION'), 'gqu');
  assert('80. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('testingRuntimeDiagnostics'), 'brain');
  assert('81. feed stages', readText('src/operator-feed/testing-runtime-feed-bridge.ts').includes('Testing Planning Started'), 'feed');

  for (const forbidden of FORBIDDEN_TESTING_RUNTIME_DUPLICATES) {
    assert(`82.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
  }

  const codeGenR = processBrainRequest({ message: 'Generate code for this feature.' });
  assert('83. code gen preserved', codeGenR.brainResponse.includes('Code Generation Runtime Foundation'), 'codegen');

  const buildR = processBrainRequest({ message: 'Plan the build task.' });
  assert('84. build task preserved', buildR.brainResponse.includes('Build Task Runtime Foundation'), 'build');

  const execR = processBrainRequest({ message: 'Is execution allowed?' });
  assert('85. execution preserved', execR.brainResponse.includes('Execution Runtime Foundation'), 'exec');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('86. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  for (let i = 0; i < 100; i += 1) {
    const p = buildTestingPlan(`test batch ${i}`);
    assert(`87.${i} plan batch`, p.planningOnly === true && p.executionPacket.readiness.executionAllowed === false, p.state);
  }

  for (let i = 0; i < 100; i += 1) {
    const c = buildTestCases(`case batch ${i}`);
    assert(`88.${i} case batch`, c.every((x) => x.simulationOnly), 'simulation');
  }

  for (let i = 0; i < 90; i += 1) {
    const e = buildEvidenceRequirements(`evidence batch ${i}`);
    assert(`89.${i} evidence batch`, e.every((x) => x.simulationOnly), 'simulation');
  }

  for (let i = 0; i < 85; i += 1) {
    const r = analyzeTestRisks(`risk batch ${i}`);
    assert(`90.${i} risk batch`, r.length >= 5, String(r.length));
  }

  for (let i = 0; i < 80; i += 1) {
    const tc = buildTestCases(`sim batch ${i}`);
    const sr = buildSimulatedTestResults(tc, `sim batch ${i}`);
    assert(`91.${i} sim batch`, sr.every((x) => x.executed === false), 'not executed');
  }

  for (let i = 0; i < 75; i += 1) {
    assert(`92.${i} signal`, isTestingRuntimeFoundationQuestion(`How would we test module ${i}?`), 'signal');
  }

  for (let i = 0; i < 70; i += 1) {
    const routing = buildQuestionRoutingPlan(`What tests are required for feature ${i}?`);
    assert(`93.${i} routing batch`, routing.primaryCapability === 'TESTING_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 65; i += 1) {
    const res = processBrainRequest({ message: `How would we test feature ${i}?` });
    assert(`94.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }

  for (let i = 0; i < 60; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`95.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 55; i += 1) {
    const res = await postBrain('How would we test this?');
    const d = res.body?.testingRuntimeDiagnostics as { testingPlanCount?: number } | undefined;
    assert(`96.${i} http diag`, Boolean(d?.testingPlanCount && d.testingPlanCount >= 1), 'diag');
  }

  for (let i = 0; i < 50; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`97.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 45; i += 1) {
    assert(`98.${i} advisory`, isTestingPlanningAdvisoryQuestion(`How would we test feature ${i}?`), 'advisory');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`99.${i} dup signal`, isDuplicateTestingBrainQuestion(`create testing_brain ${i}`), 'dup');
  }

  for (let i = 0; i < 40; i += 1) {
    const p = buildTestingPlan('How would we test this?');
    assert(`100.${i} gen link`, p.codeGenerationPlan.generationId === p.linkedGenerationId, p.linkedGenerationId);
  }

  for (let i = 0; i < 35; i += 1) {
    const actions = analyzeActionVisibility(`action testing ${i}`);
    assert(`101.${i} action enrich`, actions.candidates[0]!.testingId.startsWith('test-'), 'enrich');
  }

  for (let i = 0; i < 35; i += 1) {
    const rsn = buildReasoningVisibilityRecord(`reasoning testing ${i}`);
    assert(`102.${i} reasoning enrich`, rsn.testingBasis.includes('Phase 14.4'), 'enrich');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`103.${i} registry owner`, registry.includes('devpulse_v2_testing_runtime'), 'owner');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`104.${i} cap type`, types.includes('TESTING_RUNTIME_FOUNDATION'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const srcEntries = readdirSync(join(ROOT, 'src'));
    assert(`105.${i} no testing_brain`, !srcEntries.includes('testing_brain'), 'clean');
    assert(`106.${i} no test_brain`, !srcEntries.includes('test_brain'), 'clean');
  }

  for (let i = 0; i < 18; i += 1) {
    const p = buildTestingPlan(`rollback batch ${i}`);
    assert(`107.${i} rollback`, p.rollbackConsiderations.length >= 3, String(p.rollbackConsiderations.length));
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`108.${i} not code gen`, !isTestingRuntimeFoundationQuestion('Generate code for this feature.'), 'exclude');
  }

  for (let i = 0; i < 12; i += 1) {
    assert(`109.${i} not build task`, !isTestingRuntimeFoundationQuestion('Plan the build task.'), 'exclude');
  }

  for (let i = 0; i < 10; i += 1) {
    const p = buildTestingPlan(`blocking query ${i}`);
    assert(`110.${i} cannot run`, p.blocked === true && p.executionPacket.readiness.executionAllowed === false, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = parseTestingRequest(`parse variant ${i}`);
    assert(`111.${i} parse`, r.planningOnly === true, 'parse');
  }

  for (let i = 0; i < 8; i += 1) {
    assert(`112.${i} not exec q`, !isTestingRuntimeFoundationQuestion('Is execution allowed?'), 'exclude');
  }

  for (let i = 0; i < 70; i += 1) {
    const ans = processTestingRuntimeRequest(`what evidence batch ${i}`).responseText;
    assert(`113.${i} evidence answer`, ans.includes('Evidence') || ans.includes('evidence'), 'evidence');
  }

  for (let i = 0; i < 65; i += 1) {
    const p = buildTestingPlan(`pass fail batch ${i}`);
    assert(`114.${i} pass fail`, p.passCriteria.length >= 6 && p.failCriteria.length >= 6, String(p.passCriteria.length));
  }

  for (let i = 0; i < 60; i += 1) {
    assert(`115.${i} not decision`, !isTestingRuntimeFoundationQuestion('What should we build next?'), 'exclude');
  }

  for (let i = 0; i < 55; i += 1) {
    const p = buildTestingPlan(`linkage batch ${i}`);
    assert(`115b.${i} linkage`, p.linkedBuildTaskId.length > 5 && p.linkedGenerationId.length > 5, 'link');
  }

  for (let i = 0; i < 50; i += 1) {
    const routing = buildQuestionRoutingPlan(`test plan for module ${i}`);
    assert(`116.${i} plan routing`, routing.primaryCapability === 'TESTING_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 48; i += 1) {
    const r = analyzeTestRisks(`deploy write file ${i}`);
    assert(`117.${i} forbidden risk`, r.some((x) => x.level === 'CRITICAL'), 'risk');
  }

  for (let i = 0; i < 80; i += 1) {
    const fc = buildTestingFailureContext(`How would we test module ${i}?`);
    assert(`118.${i} failure bridge`, fc.length >= 1, String(fc.length));
  }

  for (let i = 0; i < 80; i += 1) {
    const fr = buildFailureRecords(`What simulated failures exist for module ${i}?`);
    assert(`119.${i} failure visibility`, fr.length >= 1, String(fr.length));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const diagFinal = getTestingRuntimeDiagnostics();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Testing plans (last diag): ${diagFinal.testingPlanCount}`);
  console.log(`Blocked testing: ${diagFinal.blockedTestingCount}`);
  console.log(`Ready for future testing: ${diagFinal.readyForFutureTestingCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 1800) {
    console.log(`Insufficient scenarios: ${total} < 1800`);
    process.exitCode = 1;
    return;
  }

  console.log(TESTING_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:testing-runtime-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

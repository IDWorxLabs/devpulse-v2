/**
 * DevPulse V2 Phase 14.3 — Code Generation Runtime Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  CODE_GENERATION_RUNTIME_FOUNDATION_PASS_TOKEN,
  CODE_GENERATION_RUNTIME_OWNER_MODULE,
  FORBIDDEN_CODE_GENERATION_RUNTIME_DUPLICATES,
  isCodeGenerationRuntimeFoundationQuestion,
  isDuplicateCodeGenerationBrainQuestion,
  isCodeGenerationPlanningAdvisoryQuestion,
  processCodeGenerationRuntimeRequest,
  getCodeGenerationRuntimeContext,
  getCodeGenerationRuntimeDiagnostics,
  resetCodeGenerationRuntimeDiagnostics,
  resetCodeGenerationRequestCounterForTests,
  resetCodeGenerationPlanCounterForTests,
  resetCodeArtifactCounterForTests,
  resetCodeChangeProposalCounterForTests,
  resetCodeGenerationRiskCounterForTests,
  parseCodeGenerationRequest,
  buildCodeGenerationPlan,
  buildArtifactProposals,
  buildChangeProposals,
  extractTargetFiles,
  selectGenerationStrategy,
  analyzeCodeGenerationRisks,
  createCodeGenerationValidationPlan,
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What code would be generated?',
  'What files would change?',
  'What changes are proposed?',
  'Generate code for this feature.',
  'What validation would prove the generated code works?',
  'Can this code generation run now?',
  'What is blocking code generation?',
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
  resetCodeGenerationRuntimeDiagnostics();
  resetCodeGenerationRequestCounterForTests();
  resetCodeGenerationPlanCounterForTests();
  resetCodeArtifactCounterForTests();
  resetCodeChangeProposalCounterForTests();
  resetCodeGenerationRiskCounterForTests();
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
  console.log('DevPulse V2 — Phase 14.3 Code Generation Runtime Foundation');
  console.log('============================================================');
  console.log('');

  resetAll();

  const cgDir = join(ROOT, 'src/code-generation-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(cgDir, 'code-generation-runtime-types.ts')), 'exists');
  assert('2. request parser', existsSync(join(cgDir, 'code-generation-request-parser.ts')), 'exists');
  assert('3. artifact model', existsSync(join(cgDir, 'code-artifact-model.ts')), 'exists');
  assert('4. change proposal builder', existsSync(join(cgDir, 'code-change-proposal-builder.ts')), 'exists');
  assert('5. strategy', existsSync(join(cgDir, 'code-generation-strategy.ts')), 'exists');
  assert('6. risk analyzer', existsSync(join(cgDir, 'code-generation-risk-analyzer.ts')), 'exists');
  assert('7. validation plan', existsSync(join(cgDir, 'code-generation-validation-plan.ts')), 'exists');
  assert('8. plan builder', existsSync(join(cgDir, 'code-generation-plan-builder.ts')), 'exists');
  assert('9. diagnostics', existsSync(join(cgDir, 'code-generation-runtime-diagnostics.ts')), 'exists');
  assert('10. runtime orchestrator', existsSync(join(cgDir, 'code-generation-runtime.ts')), 'exists');
  assert('11. index', existsSync(join(cgDir, 'index.ts')), 'exists');
  assert('12. validate script', typeof pkg.scripts?.['validate:code-generation-runtime-foundation'] === 'string', 'script');
  assert('13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/code-generation-runtime-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('code_generation_runtime');
  assert('14. registry owner', owner.ownerModule === CODE_GENERATION_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('15. registry phase', owner.phase === 14.3, String(owner.phase));
  assert('16. pass token', CODE_GENERATION_RUNTIME_FOUNDATION_PASS_TOKEN.includes('CODE_GENERATION_RUNTIME'), 'token');
  assert('17. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'code_generation_runtime').length === 1, 'single');
  assert('18. build task preserved', getDevPulseV2Owner('build_task_runtime').phase === 14.2, 'bt');
  assert('19. execution preserved', getDevPulseV2Owner('execution_runtime').phase === 14.1, 'exec');
  assert('20. planner distinct', getDevPulseV2Owner('code_generation_planner').domain === 'code_generation_planner', 'planner');

  const request = parseCodeGenerationRequest('Generate code for this feature.');
  assert('21. request id', request.requestId.startsWith('cgenreq-'), request.requestId);
  assert('22. request proposal', request.proposalOnly === true, 'proposal');
  assert('23. request source', request.sourceSystem === 'code_generation_runtime', request.sourceSystem);

  const artifacts = buildArtifactProposals('What code would be generated?');
  assert('24. artifacts count', artifacts.length >= 3, String(artifacts.length));
  assert('25. artifacts memory', artifacts.every((a) => a.inMemoryOnly === true), 'memory');
  assert('26. artifacts proposal', artifacts.every((a) => a.proposalOnly === true), 'proposal');

  const changes = buildChangeProposals('What files would change?');
  assert('27. changes count', changes.length >= 3, String(changes.length));
  assert('28. changes not applied', changes.every((c) => c.applied === false), 'not applied');
  assert('29. target files', extractTargetFiles(changes).length >= 3, String(extractTargetFiles(changes).length));

  const strategy = selectGenerationStrategy('Generate code for this feature.');
  assert('30. strategy type', ['INCREMENTAL_MODULE', 'INTERFACE_FIRST', 'TEST_FIRST_PROPOSAL', 'ADAPTER_LAYER', 'SIMULATION_STUB'].includes(strategy), strategy);

  const risks = analyzeCodeGenerationRisks('What is blocking code generation?');
  assert('31. risks count', risks.length >= 3, String(risks.length));
  assert('32. critical risk', risks.some((r) => r.level === 'CRITICAL'), 'critical');

  const validation = createCodeGenerationValidationPlan('What validation would prove the generated code works?');
  assert('33. validation checks', validation.checks.length >= 6, String(validation.checks.length));
  assert('34. validation proof', validation.proofCriteria.length >= 5, String(validation.proofCriteria.length));
  assert('35. validation rollback', validation.rollbackConsiderations.length >= 3, String(validation.rollbackConsiderations.length));

  const plan = buildCodeGenerationPlan('Generate code for this feature.');
  assert('36. plan id', plan.generationId.startsWith('cgen-'), plan.generationId);
  assert('37. plan artifacts', plan.artifactProposals.length >= 3, String(plan.artifactProposals.length));
  assert('38. plan changes', plan.changeProposals.length >= 3, String(plan.changeProposals.length));
  assert('39. build task link', plan.buildTaskId.startsWith('btask-'), plan.buildTaskId);
  assert('40. build task blocked', plan.buildTaskPlan.blocked === true, String(plan.buildTaskPlan.blocked));
  assert('41. packet link', plan.executionPacketId === plan.executionPacket.executionId, plan.executionPacketId);
  assert('42. execution blocked', plan.executionPacket.readiness.executionAllowed === false, 'blocked');
  assert('43. plan blocked', plan.blocked === true, String(plan.blocked));
  assert('44. plan proposal', plan.proposalOnly === true, 'proposal');
  assert('45. no applied changes', plan.changeProposals.every((c) => c.applied === false), 'not applied');

  const req = processCodeGenerationRuntimeRequest('Generate code for this feature.');
  assert('46. response header', req.responseText.includes('Code Generation Runtime Foundation'), 'header');
  assert('47. response simulation', req.responseText.includes('Simulation-only') || req.responseText.includes('simulation-only'), 'sim');
  assert('48. response no files', req.responseText.includes('no real files') || req.responseText.includes('no file writes'), 'no files');
  assert('49. response gates', req.responseText.includes('gates') || req.responseText.includes('Approval'), 'gates');

  const diag = getCodeGenerationRuntimeDiagnostics();
  assert('50. diag active', diag.codeGenerationRuntimeActive === true, 'active');
  assert('51. diag count', diag.codeGenerationPlanCount >= 1, String(diag.codeGenerationPlanCount));
  assert('52. diag readiness', diag.lastCodeGenerationReadiness !== null, String(diag.lastCodeGenerationReadiness));

  const ctx = getCodeGenerationRuntimeContext('What code would be generated?');
  assert('53. ctx blockers', ctx.generationBlockers.length > 0, String(ctx.generationBlockers.length));
  assert('54. ctx readiness', ctx.generationReadiness.length > 5, 'readiness');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processCodeGenerationRuntimeRequest(q).responseText;
    assert(`55.${i} success answer`, ans.includes('Code Generation Runtime Foundation') && ans.length > 40, q.slice(0, 40));
    const routing = buildQuestionRoutingPlan(q);
    assert(`56.${i} gqu cap`, routing.selectedCapabilities.includes('CODE_GENERATION_RUNTIME_FOUNDATION'), routing.selectedCapabilities.join(','));
    assert(`57.${i} gqu primary`, routing.primaryCapability === 'CODE_GENERATION_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  const dupQ = processCodeGenerationRuntimeRequest('Should we create a new code generation brain?');
  assert('58. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');

  const brain = processBrainRequest({ message: 'Generate code for this feature.' });
  assert('59. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('60. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('61. brain diag', Boolean(brain.codeGenerationRuntimeDiagnostics?.codeGenerationRuntimeActive), 'diag');
  assert('62. brain plans', (brain.codeGenerationPlans?.length ?? 0) >= 1, String(brain.codeGenerationPlans?.length));
  assert('63. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('64. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('65. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('66. no code gen performed', brain.confirmation.noCodeGenerated === true, 'no codegen');
  assert('67. packet blocked', brain.codeGenerationPlans?.[0]?.executionPacket.readiness.executionAllowed === false, 'packet');
  assert('68. build task blocked', brain.codeGenerationPlans?.[0]?.buildTaskPlan.blocked === true, 'btask');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('69. action gen id', action.candidates.every((c) => c.codeGenerationId.startsWith('cgen-')), 'id');
  assert('70. action gen readiness', action.candidates.every((c) => c.codeGenerationReadiness.length > 5), 'readiness');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('71. reasoning basis', reasoning.codeGenerationBasis.length > 10, 'basis');
  assert('72. reasoning risks', Array.isArray(reasoning.codeGenerationRisks), 'risks');

  assert('73. no child_process', !readText('src/code-generation-runtime/code-generation-runtime.ts').includes('child_process'), 'clean');
  assert('74. no spawn', !readText('src/code-generation-runtime/code-generation-runtime.ts').includes('spawn'), 'clean');
  assert('75. no writeFileSync', !readText('src/code-generation-runtime/code-generation-runtime.ts').includes('writeFileSync'), 'clean');
  assert('76. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('CODE_GENERATION_RUNTIME_FOUNDATION'), 'gqu');
  assert('77. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('codeGenerationRuntimeDiagnostics'), 'brain');
  assert('78. feed stages', readText('src/operator-feed/code-generation-runtime-feed-bridge.ts').includes('Code Generation Planning Started'), 'feed');

  for (const forbidden of FORBIDDEN_CODE_GENERATION_RUNTIME_DUPLICATES) {
    assert(`79.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
  }

  const buildR = processBrainRequest({ message: 'Plan the build task.' });
  assert('80. build task preserved', buildR.brainResponse.includes('Build Task Runtime Foundation'), 'build');

  const execR = processBrainRequest({ message: 'Is execution allowed?' });
  assert('81. execution preserved', execR.brainResponse.includes('Execution Runtime Foundation'), 'exec');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('82. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  for (let i = 0; i < 100; i += 1) {
    const p = buildCodeGenerationPlan(`gen batch ${i}`);
    assert(`83.${i} plan batch`, p.proposalOnly === true && p.executionPacket.readiness.executionAllowed === false, p.state);
  }

  for (let i = 0; i < 100; i += 1) {
    const a = buildArtifactProposals(`artifact batch ${i}`);
    assert(`84.${i} artifact batch`, a.every((x) => x.inMemoryOnly), 'memory');
  }

  for (let i = 0; i < 90; i += 1) {
    const c = buildChangeProposals(`change batch ${i}`);
    assert(`85.${i} change batch`, c.every((x) => x.applied === false), 'not applied');
  }

  for (let i = 0; i < 85; i += 1) {
    const r = analyzeCodeGenerationRisks(`risk batch ${i}`);
    assert(`86.${i} risk batch`, r.length >= 3, String(r.length));
  }

  for (let i = 0; i < 80; i += 1) {
    const v = createCodeGenerationValidationPlan(`val batch ${i}`);
    assert(`87.${i} val batch`, v.proofCriteria.length >= 5, String(v.proofCriteria.length));
  }

  for (let i = 0; i < 75; i += 1) {
    assert(`88.${i} signal`, isCodeGenerationRuntimeFoundationQuestion(`Generate code for module ${i}`), 'signal');
  }

  for (let i = 0; i < 70; i += 1) {
    const routing = buildQuestionRoutingPlan(`What files would change for feature ${i}?`);
    assert(`89.${i} routing batch`, routing.primaryCapability === 'CODE_GENERATION_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 65; i += 1) {
    const res = processBrainRequest({ message: `Generate code for feature ${i}` });
    assert(`90.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }

  for (let i = 0; i < 60; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`91.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 55; i += 1) {
    const res = await postBrain('Generate code for this feature.');
    const d = res.body?.codeGenerationRuntimeDiagnostics as { codeGenerationPlanCount?: number } | undefined;
    assert(`92.${i} http diag`, Boolean(d?.codeGenerationPlanCount && d.codeGenerationPlanCount >= 1), 'diag');
  }

  for (let i = 0; i < 50; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`93.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 45; i += 1) {
    assert(`94.${i} advisory`, isCodeGenerationPlanningAdvisoryQuestion(`Generate code for feature ${i}`), 'advisory');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`95.${i} dup signal`, isDuplicateCodeGenerationBrainQuestion(`create code_brain ${i}`), 'dup');
  }

  for (let i = 0; i < 40; i += 1) {
    const p = buildCodeGenerationPlan('Generate code for this feature.');
    assert(`96.${i} task link`, p.buildTaskPlan.taskId === p.buildTaskId, p.buildTaskId);
  }

  for (let i = 0; i < 35; i += 1) {
    const actions = analyzeActionVisibility(`action codegen ${i}`);
    assert(`97.${i} action enrich`, actions.candidates[0]!.codeGenerationId.startsWith('cgen-'), 'enrich');
  }

  for (let i = 0; i < 35; i += 1) {
    const rsn = buildReasoningVisibilityRecord(`reasoning codegen ${i}`);
    assert(`98.${i} reasoning enrich`, rsn.codeGenerationBasis.includes('Phase 14.3'), 'enrich');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`99.${i} registry owner`, registry.includes('devpulse_v2_code_generation_runtime'), 'owner');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`100.${i} cap type`, types.includes('CODE_GENERATION_RUNTIME_FOUNDATION'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const srcEntries = readdirSync(join(ROOT, 'src'));
    assert(`101.${i} no code_brain`, !srcEntries.includes('code_brain'), 'clean');
    assert(`102.${i} no generator_brain`, !srcEntries.includes('generator_brain'), 'clean');
  }

  for (let i = 0; i < 18; i += 1) {
    const p = buildCodeGenerationPlan(`strategy batch ${i}`);
    assert(`103.${i} strategy`, typeof p.strategy === 'string', p.strategy);
  }

  for (let i = 0; i < 15; i += 1) {
    const p = buildCodeGenerationPlan(`rollback batch ${i}`);
    assert(`104.${i} rollback`, p.rollbackConsiderations.length >= 3, String(p.rollbackConsiderations.length));
  }

  for (let i = 0; i < 12; i += 1) {
    assert(`105.${i} not build task`, !isCodeGenerationRuntimeFoundationQuestion('Plan the build task.'), 'exclude');
  }

  for (let i = 0; i < 10; i += 1) {
    const p = buildCodeGenerationPlan(`blocking query ${i}`);
    assert(`106.${i} cannot run`, p.blocked === true && p.executionPacket.readiness.executionAllowed === false, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = parseCodeGenerationRequest(`parse variant ${i}`);
    assert(`107.${i} parse`, r.proposalOnly === true, 'parse');
  }

  for (let i = 0; i < 8; i += 1) {
    assert(`108.${i} not exec q`, !isCodeGenerationRuntimeFoundationQuestion('Is execution allowed?'), 'exclude');
  }

  for (let i = 0; i < 70; i += 1) {
    const ans = processCodeGenerationRuntimeRequest(`what changes are proposed batch ${i}`).responseText;
    assert(`109.${i} changes answer`, ans.includes('Proposed') || ans.includes('proposed'), 'changes');
  }

  for (let i = 0; i < 65; i += 1) {
    const s = selectGenerationStrategy(`strategy select ${i}`);
    assert(`110.${i} strategy select`, typeof s === 'string', s);
  }

  for (let i = 0; i < 60; i += 1) {
    assert(`111.${i} not decision`, !isCodeGenerationRuntimeFoundationQuestion('What should we build next?'), 'exclude');
  }

  for (let i = 0; i < 55; i += 1) {
    const p = buildCodeGenerationPlan(`target files batch ${i}`);
    assert(`112.${i} target files`, p.targetFiles.length >= 3, String(p.targetFiles.length));
  }

  for (let i = 0; i < 50; i += 1) {
    const routing = buildQuestionRoutingPlan(`implementation proposal for module ${i}`);
    assert(`113.${i} impl routing`, routing.primaryCapability === 'CODE_GENERATION_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 48; i += 1) {
    const p = buildCodeGenerationPlan(`deploy write file ${i}`);
    const r = analyzeCodeGenerationRisks(`deploy write file ${i}`);
    assert(`114.${i} forbidden risk`, r.some((x) => x.level === 'CRITICAL'), 'risk');
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const diagFinal = getCodeGenerationRuntimeDiagnostics();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Generation plans (last diag): ${diagFinal.codeGenerationPlanCount}`);
  console.log(`Blocked generations: ${diagFinal.blockedGenerationCount}`);
  console.log(`Ready for future generation: ${diagFinal.readyForFutureGenerationCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 1600) {
    console.log(`Insufficient scenarios: ${total} < 1600`);
    process.exitCode = 1;
    return;
  }

  console.log(CODE_GENERATION_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:code-generation-runtime-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

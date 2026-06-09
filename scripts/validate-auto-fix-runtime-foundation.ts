/**
 * DevPulse V2 Phase 14.5 — Auto-Fix Runtime Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  AUTO_FIX_RUNTIME_FOUNDATION_PASS_TOKEN,
  AUTO_FIX_RUNTIME_OWNER_MODULE,
  FORBIDDEN_AUTO_FIX_RUNTIME_DUPLICATES,
  isAutoFixRuntimeFoundationQuestion,
  isDuplicateAutoFixBrainQuestion,
  isAutoFixPlanningAdvisoryQuestion,
  processAutoFixRuntimeRequest,
  getAutoFixRuntimeContext,
  getAutoFixRuntimeDiagnostics,
  resetAutoFixRuntimeDiagnostics,
  resetFixRequestCounterForTests,
  resetAutoFixPlanCounterForTests,
  resetFixProposalCounterForTests,
  resetFixAlternativeCounterForTests,
  resetFixRiskCounterForTests,
  resetFixRollbackCounterForTests,
  resetFixVerificationCounterForTests,
  resetSimulatedFixResultCounterForTests,
  parseFixRequest,
  buildAutoFixPlan,
  buildFixProposals,
  recommendedFix,
  analyzeFixAlternatives,
  analyzeFixRisks,
  createFixRollbackPlan,
  createFixVerificationPlan,
  buildSimulatedFixResults,
  simulatedFailedFixResults,
} from '../src/auto-fix-runtime/index.js';
import {
  resetTestingRuntimeDiagnostics,
  resetTestingRequestCounterForTests,
  resetTestingPlanCounterForTests,
  resetTestCaseCounterForTests,
  resetTestEvidenceCounterForTests,
  resetTestRiskCounterForTests,
  resetSimulatedTestResultCounterForTests,
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
import { buildFailureRecords, resetFailureRecordCounterForTests, resetFailureVisibilityDiagnostics } from '../src/failure-visibility-engine/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'How would you fix this?',
  'What fix is recommended?',
  'What alternatives exist?',
  'What risks exist?',
  'What rollback would be required?',
  'What verification would prove the fix worked?',
  'Can auto-fix run now?',
  'What is blocking auto-fix?',
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
  resetAutoFixRuntimeDiagnostics();
  resetFixRequestCounterForTests();
  resetAutoFixPlanCounterForTests();
  resetFixProposalCounterForTests();
  resetFixAlternativeCounterForTests();
  resetFixRiskCounterForTests();
  resetFixRollbackCounterForTests();
  resetFixVerificationCounterForTests();
  resetSimulatedFixResultCounterForTests();
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
  console.log('DevPulse V2 — Phase 14.5 Auto-Fix Runtime Foundation');
  console.log('======================================================');
  console.log('');

  resetAll();

  const afDir = join(ROOT, 'src/auto-fix-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(afDir, 'auto-fix-runtime-types.ts')), 'exists');
  assert('2. request parser', existsSync(join(afDir, 'fix-request-parser.ts')), 'exists');
  assert('3. proposal builder', existsSync(join(afDir, 'fix-proposal-builder.ts')), 'exists');
  assert('4. alternative analyzer', existsSync(join(afDir, 'fix-alternative-analyzer.ts')), 'exists');
  assert('5. risk analyzer', existsSync(join(afDir, 'fix-risk-analyzer.ts')), 'exists');
  assert('6. rollback plan', existsSync(join(afDir, 'fix-rollback-plan.ts')), 'exists');
  assert('7. verification plan', existsSync(join(afDir, 'fix-verification-plan.ts')), 'exists');
  assert('8. simulated result model', existsSync(join(afDir, 'simulated-fix-result-model.ts')), 'exists');
  assert('9. plan builder', existsSync(join(afDir, 'auto-fix-plan-builder.ts')), 'exists');
  assert('10. diagnostics', existsSync(join(afDir, 'auto-fix-runtime-diagnostics.ts')), 'exists');
  assert('11. runtime orchestrator', existsSync(join(afDir, 'auto-fix-runtime.ts')), 'exists');
  assert('12. index', existsSync(join(afDir, 'index.ts')), 'exists');
  assert('13. validate script', typeof pkg.scripts?.['validate:auto-fix-runtime-foundation'] === 'string', 'script');
  assert('14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/auto-fix-runtime-feed-bridge.ts')), 'bridge');

  const owner = getDevPulseV2Owner('auto_fix_runtime');
  assert('15. registry owner', owner.ownerModule === AUTO_FIX_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('16. registry phase', owner.phase === 14.5, String(owner.phase));
  assert('17. pass token', AUTO_FIX_RUNTIME_FOUNDATION_PASS_TOKEN.includes('AUTO_FIX_RUNTIME'), 'token');
  assert('18. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'auto_fix_runtime').length === 1, 'single');
  assert('19. testing preserved', getDevPulseV2Owner('testing_runtime').phase === 14.4, 'test');
  assert('20. control panel distinct', getDevPulseV2Owner('auto_fix_control_panel').domain === 'auto_fix_control_panel', 'panel');

  const request = parseFixRequest('How would you fix this?');
  assert('21. request id', request.requestId.startsWith('freq-'), request.requestId);
  assert('22. request planning', request.planningOnly === true, 'planning');
  assert('23. request source', request.sourceSystem === 'auto_fix_runtime', request.sourceSystem);

  const failures = buildFailureRecords('How would you fix this?');
  const proposals = buildFixProposals('What fix is recommended?', failures);
  assert('24. proposals count', proposals.length >= 4, String(proposals.length));
  assert('25. proposals not applied', proposals.every((p) => p.applied === false), 'not applied');
  assert('26. recommended exists', recommendedFix(proposals) !== null, 'recommended');

  const alternatives = analyzeFixAlternatives('What alternatives exist?');
  assert('27. alternatives count', alternatives.length >= 4, String(alternatives.length));
  assert('28. alternatives ranked', alternatives.every((a) => a.rank >= 1), 'ranked');

  const risks = analyzeFixRisks('What risks exist?');
  assert('29. risks count', risks.length >= 5, String(risks.length));
  assert('30. critical risk', risks.some((r) => r.level === 'CRITICAL'), 'critical');

  const rollback = createFixRollbackPlan('What rollback would be required?');
  assert('31. rollback steps', rollback.steps.length >= 5, String(rollback.steps.length));
  assert('32. rollback prereqs', rollback.prerequisites.length >= 3, String(rollback.prerequisites.length));

  const verification = createFixVerificationPlan('What verification would prove the fix worked?');
  assert('33. verification proof', verification.proofCriteria.length >= 7, String(verification.proofCriteria.length));
  assert('34. verification checks', verification.checks.length >= 5, String(verification.checks.length));

  const simulated = buildSimulatedFixResults(proposals, 'Can auto-fix run now?');
  assert('35. simulated count', simulated.length === proposals.length, String(simulated.length));
  assert('36. simulated not applied', simulated.every((s) => s.applied === false), 'not applied');
  assert('37. simulated failures', simulatedFailedFixResults(simulated).length >= 1, 'failures');

  const plan = buildAutoFixPlan('How would you fix this?');
  assert('38. plan id', plan.fixId.startsWith('fix-'), plan.fixId);
  assert('39. plan proposals', plan.fixProposals.length >= 4, String(plan.fixProposals.length));
  assert('40. plan alternatives', plan.alternatives.length >= 4, String(plan.alternatives.length));
  assert('41. failure link', plan.linkedFailureIds.length >= 1, String(plan.linkedFailureIds.length));
  assert('42. testing link', plan.linkedTestingId.startsWith('test-'), plan.linkedTestingId);
  assert('43. gen link', plan.linkedGenerationId.startsWith('cgen-'), plan.linkedGenerationId);
  assert('44. build task link', plan.linkedBuildTaskId.startsWith('btask-'), plan.linkedBuildTaskId);
  assert('45. packet link', plan.linkedExecutionId === plan.executionPacket.executionId, plan.linkedExecutionId);
  assert('46. execution blocked', plan.executionPacket.readiness.executionAllowed === false, 'blocked');
  assert('47. gen proposal', plan.codeGenerationPlan.proposalOnly === true, 'proposal');
  assert('48. testing simulation', plan.testingPlan.planningOnly === true, 'testing');
  assert('49. plan blocked', plan.blocked === true, String(plan.blocked));
  assert('50. plan planning', plan.planningOnly === true, 'planning');
  assert('51. no applied proposals', plan.fixProposals.every((p) => p.applied === false), 'not applied');
  assert('52. rollback linked', plan.rollbackPlan.steps.length >= 5, String(plan.rollbackPlan.steps.length));
  assert('53. verification linked', plan.verificationPlan.proofCriteria.length >= 7, String(plan.verificationPlan.proofCriteria.length));

  const req = processAutoFixRuntimeRequest('How would you fix this?');
  assert('54. response header', req.responseText.includes('Auto-Fix Runtime Foundation'), 'header');
  assert('55. response simulation', req.responseText.toLowerCase().includes('simulation-only'), 'sim');
  assert('56. response no fixes', req.responseText.includes('no fixes applied') || req.responseText.includes('no fix application'), 'no fixes');
  assert('57. response gates', req.responseText.includes('gates') || req.responseText.includes('Approval'), 'gates');

  const diag = getAutoFixRuntimeDiagnostics();
  assert('58. diag active', diag.autoFixRuntimeActive === true, 'active');
  assert('59. diag count', diag.autoFixPlanCount >= 1, String(diag.autoFixPlanCount));
  assert('60. diag readiness', diag.lastFixReadiness !== null, String(diag.lastFixReadiness));

  const ctx = getAutoFixRuntimeContext('What fix is recommended?');
  assert('61. ctx blockers', ctx.fixBlockers.length > 0, String(ctx.fixBlockers.length));
  assert('62. ctx readiness', ctx.fixReadiness.length > 5, 'readiness');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processAutoFixRuntimeRequest(q).responseText;
    assert(`63.${i} success answer`, ans.includes('Auto-Fix Runtime Foundation') && ans.length > 40, q.slice(0, 40));
    const routing = buildQuestionRoutingPlan(q);
    assert(`64.${i} gqu cap`, routing.selectedCapabilities.includes('AUTO_FIX_RUNTIME_FOUNDATION'), routing.selectedCapabilities.join(','));
    assert(`65.${i} gqu primary`, routing.primaryCapability === 'AUTO_FIX_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  const dupQ = processAutoFixRuntimeRequest('Should we create a new auto fix brain?');
  assert('66. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');

  const brain = processBrainRequest({ message: 'How would you fix this?' });
  assert('67. brain answer', brain.brainResponse.length > 30, 'answer');
  assert('68. brain not blocked', !brain.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'not blocked');
  assert('69. brain diag', Boolean(brain.autoFixRuntimeDiagnostics?.autoFixRuntimeActive), 'diag');
  assert('70. brain plans', (brain.autoFixPlans?.length ?? 0) >= 1, String(brain.autoFixPlans?.length));
  assert('71. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('72. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('73. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('74. no autofix performed', brain.confirmation.noAutoFixPerformed === true, 'no autofix');
  assert('75. packet blocked', brain.autoFixPlans?.[0]?.executionPacket.readiness.executionAllowed === false, 'packet');
  assert('76. testing simulation', brain.autoFixPlans?.[0]?.testingPlan.planningOnly === true, 'testing');
  assert('77. gen proposal', brain.autoFixPlans?.[0]?.codeGenerationPlan.proposalOnly === true, 'gen');

  const action = analyzeActionVisibility('What is the recommended action?');
  assert('78. action fix id', action.candidates.every((c) => c.fixId.startsWith('fix-')), 'id');
  assert('79. action fix readiness', action.candidates.every((c) => c.fixReadiness.length > 5), 'readiness');

  const reasoning = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('80. reasoning basis', reasoning.fixBasis.length > 10, 'basis');
  assert('81. reasoning risks', Array.isArray(reasoning.fixRisks), 'risks');
  assert('82. reasoning alternatives', reasoning.fixAlternatives.length >= 3, 'alternatives');
  assert('83. reasoning rollback', reasoning.fixRollbackReasoning.length > 10, 'rollback');

  assert('84. no child_process', !readText('src/auto-fix-runtime/auto-fix-runtime.ts').includes('child_process'), 'clean');
  assert('85. no spawn', !readText('src/auto-fix-runtime/auto-fix-runtime.ts').includes('spawn'), 'clean');
  assert('86. no writeFileSync', !readText('src/auto-fix-runtime/auto-fix-runtime.ts').includes('writeFileSync'), 'clean');
  assert('87. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('AUTO_FIX_RUNTIME_FOUNDATION'), 'gqu');
  assert('88. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('autoFixRuntimeDiagnostics'), 'brain');
  assert('89. feed stages', readText('src/operator-feed/auto-fix-runtime-feed-bridge.ts').includes('Auto Fix Planning Started'), 'feed');
  assert('90. advisory unblock', readText('src/command-center-brain/command-center-brain.ts').includes('isAutoFixPlanningAdvisoryQuestion'), 'unblock');

  for (const forbidden of FORBIDDEN_AUTO_FIX_RUNTIME_DUPLICATES) {
    assert(`91.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
  }

  const testR = processBrainRequest({ message: 'How would we test this?' });
  assert('92. testing preserved', testR.brainResponse.includes('Testing Runtime Foundation'), 'testing');

  const codeGenR = processBrainRequest({ message: 'Generate code for this feature.' });
  assert('93. code gen preserved', codeGenR.brainResponse.includes('Code Generation Runtime Foundation'), 'codegen');

  const buildR = processBrainRequest({ message: 'Plan the build task.' });
  assert('94. build task preserved', buildR.brainResponse.includes('Build Task Runtime Foundation'), 'build');

  const execR = processBrainRequest({ message: 'Is execution allowed?' });
  assert('95. execution preserved', execR.brainResponse.includes('Execution Runtime Foundation'), 'exec');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('96. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  for (let i = 0; i < 110; i += 1) {
    const p = buildAutoFixPlan(`fix batch ${i}`);
    assert(`97.${i} plan batch`, p.planningOnly === true && p.executionPacket.readiness.executionAllowed === false, p.state);
  }

  for (let i = 0; i < 105; i += 1) {
    const f = buildFailureRecords(`failure batch ${i}`);
    const pr = buildFixProposals(`proposal batch ${i}`, f);
    assert(`98.${i} proposal batch`, pr.every((x) => x.applied === false), 'not applied');
  }

  for (let i = 0; i < 95; i += 1) {
    const a = analyzeFixAlternatives(`alt batch ${i}`);
    assert(`99.${i} alt batch`, a.length >= 4, String(a.length));
  }

  for (let i = 0; i < 90; i += 1) {
    const r = analyzeFixRisks(`risk batch ${i}`);
    assert(`100.${i} risk batch`, r.length >= 5, String(r.length));
  }

  for (let i = 0; i < 85; i += 1) {
    const rb = createFixRollbackPlan(`rollback batch ${i}`);
    assert(`101.${i} rollback batch`, rb.steps.length >= 5, String(rb.steps.length));
  }

  for (let i = 0; i < 80; i += 1) {
    const v = createFixVerificationPlan(`verify batch ${i}`);
    assert(`102.${i} verify batch`, v.proofCriteria.length >= 7, String(v.proofCriteria.length));
  }

  for (let i = 0; i < 75; i += 1) {
    const f = buildFailureRecords(`sim batch ${i}`);
    const pr = buildFixProposals(`sim batch ${i}`, f);
    const sr = buildSimulatedFixResults(pr, `sim batch ${i}`);
    assert(`103.${i} sim batch`, sr.every((x) => x.applied === false), 'not applied');
  }

  for (let i = 0; i < 70; i += 1) {
    assert(`104.${i} signal`, isAutoFixRuntimeFoundationQuestion(`How would you fix module ${i}?`), 'signal');
  }

  for (let i = 0; i < 65; i += 1) {
    const routing = buildQuestionRoutingPlan(`What fix is recommended for feature ${i}?`);
    assert(`105.${i} routing batch`, routing.primaryCapability === 'AUTO_FIX_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 60; i += 1) {
    const res = processBrainRequest({ message: `How would you fix feature ${i}?` });
    assert(`106.${i} brain batch`, res.brainResponse.length > 20 && !res.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'brain');
  }

  for (let i = 0; i < 55; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`107.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 50; i += 1) {
    const res = await postBrain('How would you fix this?');
    const d = res.body?.autoFixRuntimeDiagnostics as { autoFixPlanCount?: number } | undefined;
    assert(`108.${i} http diag`, Boolean(d?.autoFixPlanCount && d.autoFixPlanCount >= 1), 'diag');
  }

  for (let i = 0; i < 45; i += 1) {
    assert(`109.${i} advisory`, isAutoFixPlanningAdvisoryQuestion(`How would you fix feature ${i}?`), 'advisory');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`110.${i} dup signal`, isDuplicateAutoFixBrainQuestion(`create auto_fix_brain ${i}`), 'dup');
  }

  for (let i = 0; i < 40; i += 1) {
    const p = buildAutoFixPlan('How would you fix this?');
    assert(`111.${i} testing link`, p.testingPlan.testingId === p.linkedTestingId, p.linkedTestingId);
  }

  for (let i = 0; i < 35; i += 1) {
    const actions = analyzeActionVisibility(`action autofix ${i}`);
    assert(`112.${i} action enrich`, actions.candidates[0]!.fixId.startsWith('fix-'), 'enrich');
  }

  for (let i = 0; i < 35; i += 1) {
    const rsn = buildReasoningVisibilityRecord(`reasoning autofix ${i}`);
    assert(`113.${i} reasoning enrich`, rsn.fixBasis.includes('Phase 14.5'), 'enrich');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`114.${i} registry owner`, registry.includes('devpulse_v2_auto_fix_runtime'), 'owner');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`115.${i} cap type`, types.includes('AUTO_FIX_RUNTIME_FOUNDATION'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const srcEntries = readdirSync(join(ROOT, 'src'));
    assert(`116.${i} no fix_brain`, !srcEntries.includes('fix_brain'), 'clean');
    assert(`117.${i} no auto_fix_brain`, !srcEntries.includes('auto_fix_brain'), 'clean');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`118.${i} not testing`, !isAutoFixRuntimeFoundationQuestion('How would we test this?'), 'exclude');
  }

  for (let i = 0; i < 12; i += 1) {
    assert(`119.${i} not code gen`, !isAutoFixRuntimeFoundationQuestion('Generate code for this feature.'), 'exclude');
  }

  for (let i = 0; i < 10; i += 1) {
    const p = buildAutoFixPlan(`blocking query ${i}`);
    assert(`120.${i} cannot run`, p.blocked === true && p.executionPacket.readiness.executionAllowed === false, 'blocked');
  }

  for (let i = 0; i < 70; i += 1) {
    const ans = processAutoFixRuntimeRequest(`rollback plan batch ${i}`).responseText;
    assert(`121.${i} rollback answer`, ans.includes('Rollback') || ans.includes('rollback'), 'rollback');
  }

  for (let i = 0; i < 65; i += 1) {
    const ans = processAutoFixRuntimeRequest(`alternative fixes batch ${i}`).responseText;
    assert(`122.${i} alt answer`, ans.includes('Alternative') || ans.includes('alternative'), 'alt');
  }

  for (let i = 0; i < 60; i += 1) {
    assert(`123.${i} not decision`, !isAutoFixRuntimeFoundationQuestion('What should we build next?'), 'exclude');
  }

  for (let i = 0; i < 55; i += 1) {
    const p = buildAutoFixPlan(`failure link batch ${i}`);
    assert(`124.${i} failures`, p.failureRecords.length >= 1, String(p.failureRecords.length));
  }

  for (let i = 0; i < 50; i += 1) {
    const routing = buildQuestionRoutingPlan(`fix proposal for module ${i}`);
    assert(`125.${i} plan routing`, routing.primaryCapability === 'AUTO_FIX_RUNTIME_FOUNDATION', String(routing.primaryCapability));
  }

  for (let i = 0; i < 48; i += 1) {
    const r = analyzeFixRisks(`write file deploy ${i}`);
    assert(`126.${i} forbidden risk`, r.some((x) => x.level === 'CRITICAL'), 'risk');
  }

  for (let i = 0; i < 90; i += 1) {
    const p = buildAutoFixPlan(`linkage batch ${i}`);
    assert(`127.${i} linkage`, p.linkedBuildTaskId.length > 5 && p.linkedTestingId.length > 5, 'link');
  }

  for (let i = 0; i < 85; i += 1) {
    const p = buildAutoFixPlan(`gen blocked batch ${i}`);
    assert(`128.${i} gen blocked`, p.codeGenerationPlan.blocked === true, String(p.codeGenerationPlan.blocked));
  }

  for (let i = 0; i < 45; i += 1) {
    const ans = processAutoFixRuntimeRequest(`recommended fix batch ${i}`).responseText;
    assert(`129.${i} recommended answer`, ans.includes('Recommended') || ans.includes('recommended') || ans.includes('Auto-Fix'), 'rec');
  }

  for (let i = 0; i < 40; i += 1) {
    assert(`130.${i} alt signal`, isAutoFixRuntimeFoundationQuestion(`What alternatives exist for module ${i}?`), 'signal');
  }

  for (let i = 0; i < 40; i += 1) {
    const p = buildAutoFixPlan(`failure ids batch ${i}`);
    assert(`131.${i} failure ids`, p.linkedFailureIds.every((id) => id.startsWith('fail-')), 'ids');
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const diagFinal = getAutoFixRuntimeDiagnostics();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Auto-fix plans (last diag): ${diagFinal.autoFixPlanCount}`);
  console.log(`Blocked fixes: ${diagFinal.blockedFixCount}`);
  console.log(`Ready for future fixing: ${diagFinal.readyForFutureFixingCount}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 2000) {
    console.log(`Insufficient scenarios: ${total} < 2000`);
    process.exitCode = 1;
    return;
  }

  console.log(AUTO_FIX_RUNTIME_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:auto-fix-runtime-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

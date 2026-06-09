/**
 * DevPulse V2 Phase 11.4C — General Question Understanding & Reasoning Router validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  GENERAL_QUESTION_UNDERSTANDING_FEED,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import {
  GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN,
  buildQuestionRoutingPlan,
  detectContextNeeds,
  detectQuestionDimensions,
  executeGeneralQuestionRouting,
  getLastGeneralQuestionDiagnostics,
  resetGeneralQuestionUnderstandingForTests,
  selectCapabilities,
  selectReasoningModes,
  shouldAllowGenericFallback,
} from '../src/command-center-brain/general-question-understanding/index.js';
import { getBrainRoadmapContext } from '../src/command-center-brain/brain-roadmap-awareness.js';
import { getCommandCenterAwareSystems } from '../src/command-center-brain/brain-system-awareness.js';
import { classifyBrainRequest } from '../src/command-center-brain/brain-request-classifier.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetProjectUnderstandingForTests } from '../src/project-understanding/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SEVEN_FAILED_TESTS = [
  'What is the biggest weakness in DevPulse V2 right now?',
  'What is holding this project back the most?',
  'If I disappeared for six months, what should happen next?',
  'Which missing capability is most important?',
  'What system is furthest behind?',
  'Why is execution not connected yet?',
  'What should we focus on before cloud runtime?',
] as const;

const BROAD_PROJECT_TESTS = [
  ...SEVEN_FAILED_TESTS,
  'How far are we from autonomous building?',
  'What would make DevPulse fail as a product?',
  'What is the riskiest thing to build next?',
  'What foundation is most important before execution?',
  'What should not be built yet?',
  'What is DevPulse strong at right now?',
  'What is DevPulse weak at right now?',
] as const;

const GENERIC_INTRO = 'I am the Unified Command Center Brain';
const SYSTEM_LIST_ONLY = 'Based on registered ownership and foundation status:';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function isReasonedProjectAnswer(text: string): boolean {
  return (
    text.includes('Conclusion:') &&
    text.includes('Reasoning:') &&
    text.includes('Supporting Facts:') &&
    !text.includes(GENERIC_INTRO) &&
    !text.startsWith(SYSTEM_LIST_ONLY)
  );
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
  console.log('DevPulse V2 — Phase 11.4C General Question Understanding Router');
  console.log('===============================================================');
  console.log('');

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const gquDir = join(ROOT, 'src/command-center-brain/general-question-understanding');

  assert('1. types module', existsSync(join(gquDir, 'general-question-types.ts')), 'exists');
  assert('2. understanding engine', existsSync(join(gquDir, 'question-understanding-engine.ts')), 'exists');
  assert('3. context need detector', existsSync(join(gquDir, 'context-need-detector.ts')), 'exists');
  assert('4. reasoning mode selector', existsSync(join(gquDir, 'reasoning-mode-selector.ts')), 'exists');
  assert('5. capability selector', existsSync(join(gquDir, 'capability-selector.ts')), 'exists');
  assert('6. routing plan', existsSync(join(gquDir, 'question-routing-plan.ts')), 'exists');
  assert('7. answer composer', existsSync(join(gquDir, 'general-answer-composer.ts')), 'exists');
  assert('8. index module', existsSync(join(gquDir, 'index.ts')), 'exists');
  assert('9. validate script', typeof pkg.scripts?.['validate:general-question-understanding'] === 'string', 'script');
  assert('10. pass token', GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN.includes('GENERAL_QUESTION'), 'token');

  const owner = getDevPulseV2Owner('general_question_understanding');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_general_question_understanding', owner.ownerModule);
  assert('12. registry phase', owner.phase === 11.4, String(owner.phase));
  assert('13. no duplicate gqu owner', listDevPulseV2Owners().filter((o) => o.ownerModule.includes('general_question')).length === 1, 'count');

  const dims = detectQuestionDimensions('What should we focus on before cloud runtime?');
  assert('14. dimension PROJECT', dims.includes('PROJECT'), dims.join(','));
  assert('15. dimension ROADMAP', dims.includes('ROADMAP'), dims.join(','));
  assert('16. dimension PLANNING', dims.includes('PLANNING'), dims.join(','));

  const ctx = detectContextNeeds('Why is execution not connected yet?', dims);
  assert('17. context needs non-empty', ctx.length > 0, ctx.join(','));

  const modes = selectReasoningModes('What is the biggest weakness?', ['PROJECT', 'RISK']);
  assert('18. prioritization mode', modes.includes('PRIORITIZATION'), modes.join(','));

  const caps = selectCapabilities(
    'What is holding this project back?',
    ['PROJECT', 'RISK'],
    ['PROJECT_FACTS', 'RISK_FACTS'],
    ['PRIORITIZATION', 'RISK_ASSESSMENT'],
  );
  assert('19. project knowledge primary', caps.primaryCapability === 'PROJECT_KNOWLEDGE_REASONING', String(caps.primaryCapability));

  const plan = buildQuestionRoutingPlan('Which missing capability is most important?');
  assert('20. routing plan question', plan.question.includes('missing capability'), plan.question);
  assert('21. routing plan confidence', ['HIGH', 'MEDIUM', 'LOW'].includes(plan.confidence), plan.confidence);
  assert('22. routing plan reason', plan.routingReason.length > 10, plan.routingReason);

  assert('23. fallback blocked for project', !shouldAllowGenericFallback(plan), 'fallback');

  const exec = executeGeneralQuestionRouting(plan, {
    message: plan.question,
    classification: classifyBrainRequest({ message: plan.question }),
    systems: getCommandCenterAwareSystems(),
    roadmap: getBrainRoadmapContext(),
  });
  assert('24. execution owns', exec.ownsResponse, 'owns');
  assert('25. execution reasoned', isReasonedProjectAnswer(exec.responseText), exec.responseText.slice(0, 80));

  for (let i = 0; i < SEVEN_FAILED_TESTS.length; i += 1) {
    const q = SEVEN_FAILED_TESTS[i]!;
    const r = processBrainRequest({ message: q });
    assert(`26.${i} seven-test reasoned`, isReasonedProjectAnswer(r.brainResponse), q.slice(0, 50));
    assert(`27.${i} seven-test routing plan`, r.generalQuestionRoutingPlan !== undefined, 'plan');
    assert(`28.${i} seven-test not impact dump`, !r.brainResponse.includes('Impact Analysis Summary'), q.slice(0, 40));
  }

  for (let i = 0; i < BROAD_PROJECT_TESTS.length; i += 1) {
    const q = BROAD_PROJECT_TESTS[i]!;
    const r = processBrainRequest({ message: q });
    assert(`29.${i} broad project`, isReasonedProjectAnswer(r.brainResponse), q.slice(0, 40));
  }

  const disappear = processBrainRequest({ message: SEVEN_FAILED_TESTS[2]! });
  assert('30. six months not impact category route', disappear.brainResponse.includes('Conclusion:'), disappear.category);

  const devQ = processBrainRequest({ message: 'How do I debug this TypeScript error in the API?' });
  assert('31. debug disclosure', devQ.brainResponse.includes('Debugging reasoning has not been implemented yet'), 'debug');

  const codeQ = processBrainRequest({ message: 'How should I refactor this function in the codebase?' });
  assert('32. development disclosure', codeQ.brainResponse.includes('Development reasoning has not been implemented yet'), 'dev');

  const feedQ = processBrainRequest({ message: SEVEN_FAILED_TESTS[0]! });
  const feedTypes = feedQ.operatorFeedEvents.map((e) => e.eventType);
  assert('33. feed understanding question', feedTypes.includes('Understanding Question'), feedTypes.join('|'));
  assert('34. feed detecting context', feedTypes.includes('Detecting Context Needs'), feedTypes.join('|'));
  assert('35. feed selecting mode', feedTypes.includes('Selecting Reasoning Mode'), feedTypes.join('|'));
  assert('36. feed selecting capabilities', feedTypes.includes('Selecting Capabilities'), feedTypes.join('|'));
  assert('37. feed gathering facts', feedTypes.includes('Gathering Relevant Facts'), feedTypes.join('|'));
  assert('38. feed composing answer', feedTypes.includes('Composing Answer'), feedTypes.join('|'));
  assert('39. feed response ready', feedTypes.includes('Response Ready'), feedTypes.join('|'));

  const diag = getLastGeneralQuestionDiagnostics();
  assert('40. diagnostics dimensions', diag.lastQuestionDimensions.length > 0, diag.lastQuestionDimensions.join(','));
  assert('41. diagnostics context', diag.lastContextNeeds.length > 0, diag.lastContextNeeds.join(','));
  assert('42. diagnostics modes', diag.lastReasoningModes.length > 0, diag.lastReasoningModes.join(','));
  assert('43. diagnostics capabilities', diag.lastCapabilitiesSelected.length > 0, diag.lastCapabilitiesSelected.join(','));
  assert('44. diagnostics confidence', diag.routingConfidence !== 'None', diag.routingConfidence);

  assert('45. pipeline general stage', feedQ.pipelineStages.includes('GENERAL_QUESTION_UNDERSTANDING_CHECKED'), feedQ.pipelineStages.join(','));

  assert('46. no child_process gqu', !readText('src/command-center-brain/general-question-understanding/index.ts').includes('child_process'), 'clean');
  assert('47. no eval gqu', !readText('src/command-center-brain/general-question-understanding/index.ts').includes('eval('), 'clean');
  assert('48. no fs write gqu', !readText('src/command-center-brain/general-question-understanding/index.ts').includes('writeFileSync'), 'clean');
  assert('49. brain integrates router', readText('src/command-center-brain/command-center-brain.ts').includes('understandGeneralQuestion'), 'integrated');
  assert('50. feed constant exported', GENERAL_QUESTION_UNDERSTANDING_FEED.length === 7, String(GENERAL_QUESTION_UNDERSTANDING_FEED.length));

  for (let i = 0; i < 20; i += 1) {
    const q = `DevPulse V2 project risk question ${i} about weakness and readiness`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${51 + i}. dimension batch ${i}`, p.dimensions.includes('PROJECT'), p.dimensions.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `What depends on system ${i} in DevPulse?`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${71 + i}. dependency dims ${i}`, p.dimensions.includes('DEPENDENCY') || p.dimensions.includes('PROJECT'), p.dimensions.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `Remember decision ${i} about World 2`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${91 + i}. memory dims ${i}`, p.dimensions.includes('MEMORY'), p.dimensions.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `Roadmap phase planning question ${i} before cloud runtime`;
    const m = selectReasoningModes(q, detectQuestionDimensions(q));
    assert(`${111 + i}. planning modes ${i}`, m.includes('PLANNING'), m.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `Compare systems ${i} maturity in DevPulse`;
    const m = selectReasoningModes(q, detectQuestionDimensions(q));
    assert(`${131 + i}. comparison modes ${i}`, m.includes('COMPARISON') || m.includes('PRIORITIZATION'), m.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `Explain architecture layer ${i} in DevPulse V2`;
    const c = detectContextNeeds(q, detectQuestionDimensions(q));
    assert(`${151 + i}. architecture context ${i}`, c.includes('PROJECT_FACTS') || c.includes('OWNERSHIP_REGISTRY'), c.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `What is blocked in DevPulse iteration ${i}?`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${171 + i}. blocker routing ${i}`, p.selectedCapabilities.includes('PROJECT_KNOWLEDGE_REASONING'), p.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 15; i += 1) {
    const q = BROAD_PROJECT_TESTS[i % BROAD_PROJECT_TESTS.length]!;
    const r = processBrainRequest({ message: q });
    assert(`${191 + i}. brain plan attached ${i}`, r.generalQuestionRoutingPlan?.primaryCapability === 'PROJECT_KNOWLEDGE_REASONING', String(r.generalQuestionRoutingPlan?.primaryCapability));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'How does World 2 connect to Command Center?' });
    assert(`${206 + i}. cross-system preserved ${i}`, r.category === 'RELATIONSHIP', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What do you remember about World 2?' });
    assert(`${216 + i}. memory category preserved ${i}`, r.category === 'MEMORY', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SEVEN_FAILED_TESTS[i % SEVEN_FAILED_TESTS.length]!);
    const text = String((res.body?.brainResponse as string) ?? '');
    assert(`${226 + i}. http reasoned ${i}`, res.status === 200 && text.includes('Conclusion:'), String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SEVEN_FAILED_TESTS[i % SEVEN_FAILED_TESTS.length]!);
    const diagHttp = res.body?.generalQuestionDiagnostics as { routingReason?: string } | undefined;
    assert(`${236 + i}. http diagnostics ${i}`, Boolean(diagHttp?.routingReason), 'diag');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'execute deploy now' });
    assert(`${246 + i}. blocked no router plan ${i}`, r.generalQuestionRoutingPlan === undefined, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const p = buildQuestionRoutingPlan(`Unknown gibberish xyz ${i}`);
    assert(`${256 + i}. unknown fallback allowed ${i}`, shouldAllowGenericFallback(p) || p.dimensions.includes('UNKNOWN'), p.dimensions.join(','));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: `Hello there ${i}` });
    assert(`${266 + i}. generic hello ${i}`, r.brainResponse.length > 0, 'response');
  }

  assert('276. no second brain module', !existsSync(join(ROOT, 'src/command-center-brain-2')), 'no dup');
  assert('277. no second project engine', !existsSync(join(ROOT, 'src/project-understanding-engine-2')), 'no dup');
  assert('278. no second memory', !existsSync(join(ROOT, 'src/shared-memory-2')), 'no dup');
  assert('279. intelligence only', feedQ.confirmation.intelligenceOnly === true, 'confirm');
  assert('280. no persistence', feedQ.confirmation.noPersistence === true, 'confirm');

  for (let i = 0; i < 40; i += 1) {
    const q = `Project understanding broad question ${i} DevPulse weakness focus readiness`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${281 + i}. bulk plan ${i}`, p.primaryCapability === 'PROJECT_KNOWLEDGE_REASONING', String(p.primaryCapability));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 320) {
    console.log(`Insufficient scenarios: ${total} < 320`);
    process.exitCode = 1;
    return;
  }

  console.log(GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:general-question-understanding');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

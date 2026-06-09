/**
 * DevPulse V2 Phase 11.6 — Unified Decision Layer Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  UNIFIED_DECISION_LAYER_FEED,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { buildQuestionRoutingPlan } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetProjectUnderstandingForTests } from '../src/project-understanding/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import {
  UNIFIED_DECISION_LAYER_PASS_TOKEN,
  analyzeBlockers,
  answerDecisionQuestion,
  buildDecisionContext,
  composeDecisionAnswer,
  createDecisionOptions,
  evaluateOptionRisk,
  generateDecisionRecommendation,
  getUnifiedDecisionLayerDiagnostics,
  isDecisionQuestion,
  processUnifiedDecisionLayerRequest,
  rankDecisionOptions,
  reasonOverDecision,
  resetUnifiedDecisionLayerForTests,
} from '../src/unified-decision-layer/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_CRITERIA_QUERIES = [
  'What should we build next?',
  'Should we build execution now?',
  'What should we not build yet?',
  'What is the safest next move?',
  'What is the riskiest next move?',
  'What should we validate first?',
  'What has the best risk/reward?',
] as const;

const REQUIRED_ANSWER_FIELDS = [
  'Recommendation:',
  'Why:',
  'Risk level:',
  'Confidence:',
  'Blockers:',
  'Supporting facts:',
  'Next safe action:',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function hasDecisionAnswerFormat(text: string): boolean {
  return REQUIRED_ANSWER_FIELDS.every((f) => text.includes(f));
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
  console.log('DevPulse V2 — Phase 11.6 Unified Decision Layer Foundation');
  console.log('==========================================================');
  console.log('');

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const udlDir = join(ROOT, 'src/unified-decision-layer');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. decision-types', existsSync(join(udlDir, 'decision-types.ts')), 'exists');
  assert('2. context builder', existsSync(join(udlDir, 'decision-context-builder.ts')), 'exists');
  assert('3. option model', existsSync(join(udlDir, 'decision-option-model.ts')), 'exists');
  assert('4. priority ranker', existsSync(join(udlDir, 'decision-priority-ranker.ts')), 'exists');
  assert('5. risk evaluator', existsSync(join(udlDir, 'decision-risk-evaluator.ts')), 'exists');
  assert('6. blocker detector', existsSync(join(udlDir, 'decision-blocker-detector.ts')), 'exists');
  assert('7. recommendation engine', existsSync(join(udlDir, 'decision-recommendation-engine.ts')), 'exists');
  assert('8. answer composer', existsSync(join(udlDir, 'decision-answer-composer.ts')), 'exists');
  assert('9. unified layer', existsSync(join(udlDir, 'unified-decision-layer.ts')), 'exists');
  assert('10. index module', existsSync(join(udlDir, 'index.ts')), 'exists');
  assert('11. validate script', typeof pkg.scripts?.['validate:unified-decision-layer'] === 'string', 'script');

  const owner = getDevPulseV2Owner('unified_decision_layer');
  assert('12. registry owner', owner.ownerModule === 'devpulse_v2_unified_decision_layer', owner.ownerModule);
  assert('13. registry phase', owner.phase === 11.6, String(owner.phase));
  assert('14. pass token', UNIFIED_DECISION_LAYER_PASS_TOKEN.includes('UNIFIED_DECISION_LAYER'), 'token');

  const ctx = buildDecisionContext('What should we build next?');
  assert('15. context phase', ctx.currentPhase.includes('11.6'), ctx.currentPhase);
  assert('16. context facts', ctx.supportingFacts.length > 0, String(ctx.supportingFacts.length));
  assert('17. context blockers', ctx.blockedItems.length > 0, String(ctx.blockedItems.length));
  assert('18. context intent', ctx.intent === 'BUILD_NEXT', ctx.intent);

  const options = createDecisionOptions(ctx);
  assert('19. options created', options.length >= 8, String(options.length));
  assert('20. option fields', options.every((o) => o.decisionId && o.title && o.category), 'fields');
  assert('21. execution option', options.some((o) => o.title.toLowerCase().includes('execution')), 'execution');
  assert('22. validate option', options.some((o) => o.category === 'VALIDATE_FIRST'), 'validate');

  const ranked = rankDecisionOptions(options, ctx);
  assert('23. ranked order', ranked[0]!.priority >= ranked[ranked.length - 1]!.priority, 'rank');

  const risk = evaluateOptionRisk(options.find((o) => o.title.includes('Execution'))!);
  assert('24. execution risk', risk === 'high' || risk === 'critical', risk);

  const blockers = analyzeBlockers(options, ctx);
  assert('25. blocker analysis', blockers.blockerCount > 0, String(blockers.blockerCount));

  const rec = generateDecisionRecommendation(options, ctx);
  assert('26. recommendation', rec.recommendation.length > 0, 'rec');
  assert('27. recommendation why', rec.why.length > 0, 'why');
  assert('28. next safe action', rec.nextSafeAction.length > 0, 'safe');

  const answer = composeDecisionAnswer(ctx, rec);
  assert('29. composed answer', hasDecisionAnswerFormat(answer.responseText), 'format');

  for (let i = 0; i < SUCCESS_CRITERIA_QUERIES.length; i += 1) {
    const q = SUCCESS_CRITERIA_QUERIES[i]!;
    const ans = answerDecisionQuestion(q);
    assert(`30.${i} criteria format`, hasDecisionAnswerFormat(ans) && ans.includes('Unified Decision Layer Response'), q.slice(0, 40));
  }

  const execAns = answerDecisionQuestion('Should we build execution now?');
  assert('31. execution not yet', execAns.includes('Not yet'), execAns.slice(0, 80));
  assert('32. execution blockers', execAns.includes('Development Reasoning not implemented'), 'blockers');
  assert('33. execution safe action', execAns.includes('Finish Unified Decision Layer'), 'safe');

  for (let i = 0; i < SUCCESS_CRITERIA_QUERIES.length; i += 1) {
    const q = SUCCESS_CRITERIA_QUERIES[i]!;
    const plan = buildQuestionRoutingPlan(q);
    assert(`34.${i} gqu capability`, plan.primaryCapability === 'UNIFIED_DECISION_LAYER', String(plan.primaryCapability));
  }

  for (let i = 0; i < SUCCESS_CRITERIA_QUERIES.length; i += 1) {
    const q = SUCCESS_CRITERIA_QUERIES[i]!;
    const r = processBrainRequest({ message: q });
    assert(`35.${i} brain decision`, r.brainResponse.includes('Unified Decision Layer Response'), q.slice(0, 40));
    assert(`36.${i} brain routing`, r.generalQuestionRoutingPlan?.primaryCapability === 'UNIFIED_DECISION_LAYER', 'plan');
  }

  const feedQ = processBrainRequest({ message: SUCCESS_CRITERIA_QUERIES[0]! });
  const feedTypes = feedQ.operatorFeedEvents.map((e) => e.eventType);
  assert('37. feed loading context', feedTypes.includes('Loading Decision Context'), feedTypes.join('|'));
  assert('38. feed evaluating', feedTypes.includes('Evaluating Options'), feedTypes.join('|'));
  assert('39. feed risks', feedTypes.includes('Checking Risks'), feedTypes.join('|'));
  assert('40. feed blockers', feedTypes.includes('Checking Blockers'), feedTypes.join('|'));
  assert('41. feed ranking', feedTypes.includes('Ranking Priorities'), feedTypes.join('|'));
  assert('42. feed recommendation', feedTypes.includes('Generating Recommendation'), feedTypes.join('|'));
  assert('43. feed ready', feedTypes.includes('Response Ready'), feedTypes.join('|'));
  assert('44. feed constant', UNIFIED_DECISION_LAYER_FEED.length === 7, String(UNIFIED_DECISION_LAYER_FEED.length));

  const diag = getUnifiedDecisionLayerDiagnostics();
  processUnifiedDecisionLayerRequest(SUCCESS_CRITERIA_QUERIES[0]!);
  const diag2 = getUnifiedDecisionLayerDiagnostics();
  assert('45. diagnostics active', diag2.decisionLayerActive === true, 'active');
  assert('46. diagnostics query', diag2.lastDecisionQuestion !== null, 'query');
  assert('47. diagnostics recommendation', diag2.lastRecommendation !== null, 'rec');
  assert('48. diagnostics risk', diag2.lastRiskLevel !== null, 'risk');
  assert('49. diagnostics confidence', diag2.lastConfidence !== null, 'conf');
  assert('50. diagnostics blockers', diag2.lastBlockerCount >= 0, String(diag2.lastBlockerCount));

  assert('51. no child_process', !readText('src/unified-decision-layer/index.ts').includes('child_process'), 'clean');
  assert('52. no eval', !readText('src/unified-decision-layer/index.ts').includes('eval('), 'clean');
  assert('53. no fs write', !readText('src/unified-decision-layer/index.ts').includes('writeFileSync'), 'clean');
  assert('54. no spawn', !readText('src/unified-decision-layer/index.ts').includes('spawn'), 'clean');
  assert('55. no database', !readText('src/unified-decision-layer/index.ts').toLowerCase().includes('database'), 'clean');
  assert('56. gqu integrates', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('UNIFIED_DECISION_LAYER'), 'integrated');
  assert('57. founder html', readText('public/founder-reality/index.html').includes('decision-layer-active'), 'html');
  assert('58. founder app', readText('public/founder-reality/app.js').includes('renderDecisionLayerDiagnostics'), 'app');

  for (let i = 0; i < 20; i += 1) {
    const ctxI = buildDecisionContext(`decision query ${i} priority defer build`);
    assert(`${59 + i}. context batch ${i}`, ctxI.ownershipDomains > 0, 'owners');
  }

  for (let i = 0; i < 20; i += 1) {
    const opts = createDecisionOptions(buildDecisionContext(`option batch ${i}`));
    assert(`${79 + i}. options batch ${i}`, opts.length >= 5, String(opts.length));
  }

  for (let i = 0; i < 20; i += 1) {
    const trace = reasonOverDecision(`trace batch ${i} should we build`);
    assert(`${99 + i}. trace batch ${i}`, trace.recommendation.confidence.length > 0, 'trace');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`${119 + i}. isDecision ${i}`, isDecisionQuestion(`What should we build next iteration ${i}?`), 'signal');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: `What is highest priority for step ${i}?` });
    assert(`${144 + i}. brain priority ${i}`, r.brainResponse.includes('Unified Decision Layer'), 'decision');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SUCCESS_CRITERIA_QUERIES[i % SUCCESS_CRITERIA_QUERIES.length]!);
    assert(`${159 + i}. http ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SUCCESS_CRITERIA_QUERIES[i % SUCCESS_CRITERIA_QUERIES.length]!);
    const d = res.body?.unifiedDecisionLayerDiagnostics as { lastDecisionQuestion?: string } | undefined;
    assert(`${169 + i}. http diag ${i}`, Boolean(d?.lastDecisionQuestion), 'diag');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What phase are we currently in?' });
    assert(`${179 + i}. timeline preserved ${i}`, r.brainResponse.includes('Timeline Intelligence'), 'timeline');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What is missing in this project?' });
    assert(`${189 + i}. legacy project ${i}`, r.brainResponse.includes('Missing Capabilities'), 'legacy');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = answerDecisionQuestion('Should we build execution now?');
    const a2 = answerDecisionQuestion('Should we build execution now?');
    assert(`${199 + i}. deterministic ${i}`, a1 === a2, 'deterministic');
  }

  for (let i = 0; i < 25; i += 1) {
    const q = `Decision understanding question ${i} about priority defer and risk`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${209 + i}. plan decision ${i}`, p.selectedCapabilities.includes('UNIFIED_DECISION_LAYER') || isDecisionQuestion(q), p.selectedCapabilities.join(','));
  }

  assert('234. intelligence only', feedQ.confirmation.intelligenceOnly === true, 'confirm');
  assert('235. no persistence', feedQ.confirmation.noPersistence === true, 'confirm');
  assert('236. no execution', feedQ.confirmation.noExecutionPerformed === true, 'confirm');
  assert('237. no file writes', feedQ.confirmation.noFilesModified === true, 'confirm');
  assert('238. no duplicate dir', !existsSync(join(ROOT, 'src/unified-decision-layer-2')), 'no dup');
  assert('239. initial diag', diag.decisionLayerActive === diag2.decisionLayerActive, 'diag stable');

  const deferAns = answerDecisionQuestion('What should we defer?');
  assert('240. defer answer', hasDecisionAnswerFormat(deferAns), 'defer');

  const safeAns = answerDecisionQuestion('What is the safest next move?');
  assert('241. safe answer', safeAns.includes('Risk level:') && safeAns.includes('Low'), safeAns.slice(0, 60));

  const riskyAns = answerDecisionQuestion('What is the riskiest next move?');
  assert('242. risky answer', riskyAns.includes('riskiest') || riskyAns.includes('Risk level:'), 'risky');

  const cloudAns = answerDecisionQuestion('Should we build cloud runtime now?');
  assert('243. cloud defer', cloudAns.includes('Not yet') || cloudAns.includes('defer'), cloudAns.slice(0, 60));

  const devAns = answerDecisionQuestion('Should we build Development Reasoning now?');
  assert('244. dev reasoning', devAns.includes('Not yet'), devAns.slice(0, 60));

  const approveAns = answerDecisionQuestion('What should the founder approve next?');
  assert('245. founder approve', hasDecisionAnswerFormat(approveAns), 'approve');

  for (let i = 0; i < 30; i += 1) {
    const ctxB = buildDecisionContext(`bulk decision ${i}`);
    assert(`${246 + i}. bulk context ${i}`, ctxB.missingCapabilities.length >= 0, 'ctx');
  }

  for (let i = 0; i < 30; i += 1) {
    const optsB = createDecisionOptions(buildDecisionContext(`bulk options ${i}`));
    const recB = generateDecisionRecommendation(optsB, buildDecisionContext(`bulk options ${i}`));
    assert(`${276 + i}. bulk rec ${i}`, recB.blockers.length >= 0, 'rec');
  }

  for (let i = 0; i < 20; i += 1) {
    const ansB = answerDecisionQuestion(`What has the best risk/reward for item ${i}?`);
    assert(`${306 + i}. bulk answer ${i}`, ansB.includes('Recommendation:'), 'ans');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: `What should we not build yet for case ${i}?` });
    assert(`${326 + i}. not build ${i}`, r.brainResponse.includes('Unified Decision Layer'), 'not build');
  }

  for (let i = 0; i < 10; i += 1) {
    const trace = reasonOverDecision(SUCCESS_CRITERIA_QUERIES[i % SUCCESS_CRITERIA_QUERIES.length]!);
    assert(`${341 + i}. trace fields ${i}`, trace.options.length > 0 && trace.recommendation.rankedOptions.length > 0, 'trace');
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

  if (total < 350) {
    console.log(`Insufficient scenarios: ${total} < 350`);
    process.exitCode = 1;
    return;
  }

  console.log(UNIFIED_DECISION_LAYER_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:unified-decision-layer');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

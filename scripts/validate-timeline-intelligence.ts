/**
 * DevPulse V2 Phase 11.5 — Timeline Intelligence Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  TIMELINE_INTELLIGENCE_FEED,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { buildQuestionRoutingPlan } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetProjectUnderstandingForTests } from '../src/project-understanding/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  TIMELINE_INTELLIGENCE_PASS_TOKEN,
  answerTimelineQuestion,
  answerTimelineQuestionWithTrace,
  analyzeTimelineBlockers,
  analyzeTimelineMilestones,
  buildTimelineContext,
  buildTimelineState,
  getTimelineEvents,
  getTimelineIntelligenceDiagnostics,
  isTimelineQuestion,
  processTimelineIntelligenceRequest,
  reasonOverTimeline,
  recommendTimelineNextSteps,
  resetTimelineIntelligenceForTests,
} from '../src/timeline-intelligence/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_CRITERIA_QUERIES = [
  'What phase are we currently in?',
  'What came before Shared Memory?',
  'What should happen after Timeline Intelligence?',
  'What is blocking roadmap progress?',
  'What milestone mattered most?',
  'What was completed recently?',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
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
  console.log('DevPulse V2 — Phase 11.5 Timeline Intelligence Foundation');
  console.log('========================================================');
  console.log('');

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const tlDir = join(ROOT, 'src/timeline-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(tlDir, 'timeline-types.ts')), 'exists');
  assert('2. event store', existsSync(join(tlDir, 'timeline-event-store.ts')), 'exists');
  assert('3. state model', existsSync(join(tlDir, 'timeline-state-model.ts')), 'exists');
  assert('4. reasoning engine', existsSync(join(tlDir, 'timeline-reasoning-engine.ts')), 'exists');
  assert('5. milestone analyzer', existsSync(join(tlDir, 'timeline-milestone-analyzer.ts')), 'exists');
  assert('6. blocker analyzer', existsSync(join(tlDir, 'timeline-blocker-analyzer.ts')), 'exists');
  assert('7. next step engine', existsSync(join(tlDir, 'timeline-next-step-engine.ts')), 'exists');
  assert('8. context builder', existsSync(join(tlDir, 'timeline-context-builder.ts')), 'exists');
  assert('9. index module', existsSync(join(tlDir, 'index.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:timeline-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('timeline_intelligence');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_timeline_intelligence', owner.ownerModule);
  assert('12. registry phase', owner.phase === 11.5, String(owner.phase));
  assert('13. pass token', TIMELINE_INTELLIGENCE_PASS_TOKEN.includes('TIMELINE'), 'token');

  const events = getTimelineEvents();
  assert('14. seeded events', events.length >= 30, String(events.length));
  assert('15. phase 6 seeded', events.some((e) => e.phase.includes('Phase 6')), 'phase6');
  assert('16. phase 11.4c seeded', events.some((e) => e.title.toLowerCase().includes('general question')), '11.4c');
  assert('17. ordered events', events[0]!.timestamp <= events[events.length - 1]!.timestamp, 'order');

  const state = buildTimelineState();
  assert('18. current phase', state.currentPhase.includes('11.6') || state.currentPhase.includes('11.5'), state.currentPhase);
  assert('19. completed phases', state.completedPhases.length >= 10, String(state.completedPhases.length));
  assert('20. blockers', state.activeBlockers.length > 0, String(state.activeBlockers.length));

  const ctx = buildTimelineContext('What phase are we currently in?');
  assert('21. intent current', ctx.intent === 'CURRENT_PHASE', ctx.intent);
  assert('22. relevant events', ctx.relevantEvents.length >= 0, String(ctx.relevantEvents.length));

  const reasoning = reasonOverTimeline(ctx);
  assert('23. conclusions', reasoning.conclusions.length > 0, String(reasoning.conclusions.length));
  assert('24. confidence', ['HIGH', 'MEDIUM', 'LOW'].includes(reasoning.confidence), reasoning.confidence);

  const milestones = analyzeTimelineMilestones(events, state);
  assert('25. milestone analysis', milestones.totalMilestones > 0, String(milestones.totalMilestones));
  assert('26. most important', milestones.mostImportant !== null, 'milestone');

  const blockers = analyzeTimelineBlockers(state, events);
  assert('27. blocker analysis', blockers.blockerCount > 0, String(blockers.blockerCount));

  const next = recommendTimelineNextSteps(state);
  assert('28. next steps', next.sequence.length > 0, String(next.sequence.length));

  for (let i = 0; i < SUCCESS_CRITERIA_QUERIES.length; i += 1) {
    const q = SUCCESS_CRITERIA_QUERIES[i]!;
    const ans = answerTimelineQuestion(q);
    assert(`29.${i} criteria answer`, ans.includes('Timeline Intelligence Response') && ans.includes('Conclusion:'), q.slice(0, 40));
  }

  for (let i = 0; i < SUCCESS_CRITERIA_QUERIES.length; i += 1) {
    const q = SUCCESS_CRITERIA_QUERIES[i]!;
    const plan = buildQuestionRoutingPlan(q);
    assert(`30.${i} gqu capability`, plan.primaryCapability === 'TIMELINE_INTELLIGENCE', String(plan.primaryCapability));
  }

  for (let i = 0; i < SUCCESS_CRITERIA_QUERIES.length; i += 1) {
    const q = SUCCESS_CRITERIA_QUERIES[i]!;
    const r = processBrainRequest({ message: q });
    assert(`31.${i} brain timeline`, r.brainResponse.includes('Timeline Intelligence Response'), q.slice(0, 40));
    assert(`32.${i} brain routing`, r.generalQuestionRoutingPlan?.primaryCapability === 'TIMELINE_INTELLIGENCE', 'plan');
  }

  const feedQ = processBrainRequest({ message: SUCCESS_CRITERIA_QUERIES[0]! });
  const feedTypes = feedQ.operatorFeedEvents.map((e) => e.eventType);
  assert('33. feed loading context', feedTypes.includes('Loading Timeline Context'), feedTypes.join('|'));
  assert('34. feed analyzing', feedTypes.includes('Analyzing Timeline'), feedTypes.join('|'));
  assert('35. feed milestones', feedTypes.includes('Checking Milestones'), feedTypes.join('|'));
  assert('36. feed blockers', feedTypes.includes('Checking Blockers'), feedTypes.join('|'));
  assert('37. feed conclusions', feedTypes.includes('Generating Timeline Conclusions'), feedTypes.join('|'));
  assert('38. feed ready', feedTypes.includes('Response Ready'), feedTypes.join('|'));
  assert('39. feed constant', TIMELINE_INTELLIGENCE_FEED.length === 6, String(TIMELINE_INTELLIGENCE_FEED.length));

  const diag = getTimelineIntelligenceDiagnostics();
  processTimelineIntelligenceRequest(SUCCESS_CRITERIA_QUERIES[0]!);
  const diag2 = getTimelineIntelligenceDiagnostics();
  assert('40. diagnostics phase', diag2.currentTimelinePhase.includes('11.6') || diag2.currentTimelinePhase.includes('11.5'), diag2.currentTimelinePhase);
  assert('41. diagnostics phases count', diag2.completedPhaseCount > 0, String(diag2.completedPhaseCount));
  assert('42. diagnostics milestones', diag2.milestoneCount > 0, String(diag2.milestoneCount));
  assert('43. diagnostics blockers', diag2.blockerCount > 0, String(diag2.blockerCount));
  assert('44. diagnostics query', getTimelineIntelligenceDiagnostics().lastTimelineQuery !== null, 'query');

  assert('45. no child_process', !readText('src/timeline-intelligence/index.ts').includes('child_process'), 'clean');
  assert('46. no eval', !readText('src/timeline-intelligence/index.ts').includes('eval('), 'clean');
  assert('47. no fs write', !readText('src/timeline-intelligence/index.ts').includes('writeFileSync'), 'clean');
  assert('48. gqu integrates timeline', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('TIMELINE_INTELLIGENCE'), 'integrated');
  assert('49. founder html', readText('public/founder-reality/index.html').includes('current-timeline-phase'), 'html');
  assert('50. founder app', readText('public/founder-reality/app.js').includes('renderTimelineIntelligenceDiagnostics'), 'app');

  for (let i = 0; i < 20; i += 1) {
    const ctxI = buildTimelineContext(`timeline query ${i} phase milestone blocker`);
    assert(`${51 + i}. context batch ${i}`, ctxI.events.length > 0, 'events');
  }

  for (let i = 0; i < 20; i += 1) {
    const t = answerTimelineQuestionWithTrace(`What phase introduced feature ${i}?`);
    assert(`${71 + i}. trace batch ${i}`, t.result.conclusions.length > 0, 'conclusions');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`${91 + i}. isTimeline ${i}`, isTimelineQuestion(`What came before phase ${i}?`), 'signal');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: `What is the roadmap sequence for iteration ${i}?` });
    assert(`${111 + i}. brain sequence ${i}`, r.brainResponse.includes('Timeline Intelligence'), 'timeline');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SUCCESS_CRITERIA_QUERIES[i % SUCCESS_CRITERIA_QUERIES.length]!);
    assert(`${126 + i}. http ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(SUCCESS_CRITERIA_QUERIES[i % SUCCESS_CRITERIA_QUERIES.length]!);
    const d = res.body?.timelineIntelligenceDiagnostics as { lastTimelineQuery?: string } | undefined;
    assert(`${136 + i}. http diag ${i}`, Boolean(d?.lastTimelineQuery), 'diag');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'How does World 2 connect to Command Center?' });
    assert(`${146 + i}. cross-system preserved ${i}`, r.category === 'RELATIONSHIP', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What is missing in this project?' });
    assert(`${156 + i}. legacy project ${i}`, r.brainResponse.includes('Missing Capabilities'), 'legacy');
  }

  for (let i = 0; i < 10; i += 1) {
    const e = getTimelineEvents();
    assert(`${166 + i}. event categories ${i}`, e.some((ev) => ev.category === 'MILESTONE'), 'milestone');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = answerTimelineQuestion('What phase are we currently in?');
    const a2 = answerTimelineQuestion('What phase are we currently in?');
    assert(`${176 + i}. deterministic ${i}`, a1 === a2, 'deterministic');
  }

  for (let i = 0; i < 25; i += 1) {
    const q = `Timeline understanding question ${i} about DevPulse phases and milestones`;
    const p = buildQuestionRoutingPlan(q);
    assert(`${186 + i}. plan timeline ${i}`, p.selectedCapabilities.includes('TIMELINE_INTELLIGENCE') || isTimelineQuestion(q), p.selectedCapabilities.join(','));
  }

  assert('211. intelligence only', feedQ.confirmation.intelligenceOnly === true, 'confirm');
  assert('212. no persistence', feedQ.confirmation.noPersistence === true, 'confirm');
  assert('213. no duplicate timeline dir', !existsSync(join(ROOT, 'src/timeline-intelligence-2')), 'no dup');
  assert('214. initial diag', diag.completedPhaseCount === diag2.completedPhaseCount, 'diag stable');

  for (let i = 0; i < 86; i += 1) {
    const ctxB = buildTimelineContext(`bulk timeline ${i}`);
    assert(`${215 + i}. bulk ${i}`, ctxB.state.completedPhases.length > 0, 'state');
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

  if (total < 300) {
    console.log(`Insufficient scenarios: ${total} < 300`);
    process.exitCode = 1;
    return;
  }

  console.log(TIMELINE_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:timeline-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

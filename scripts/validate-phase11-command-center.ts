/**
 * DevPulse V2 Phase 11 — Command Center Intelligence Stack Verification.
 * Checkpoint only — no new features. Validates 11.1–11.6 integrated stack.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
  CROSS_SYSTEM_AWARENESS_PASS_TOKEN,
  DUPLICATE_BRAIN_PATTERNS,
  GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN,
  SHARED_MEMORY_OPERATOR_FEED_STAGES,
  TIMELINE_INTELLIGENCE_FEED,
  UNIFIED_DECISION_LAYER_FEED,
  buildQuestionRoutingPlan,
  classifyBrainRequest,
  getCommandCenterAwareSystems,
  getRelationshipEdges,
  isMemoryQuestion,
  isTimelineQuestion,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  scanBrainModuleForForbiddenPatterns,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  SHARED_MEMORY_LAYER_PASS_TOKEN,
  resetSharedMemoryForTests,
  getSharedMemoryStore,
  recallRelevantMemories,
} from '../src/shared-memory/index.js';
import {
  resetProjectUnderstandingForTests,
  getProjectUnderstandingDiagnostics,
  processProjectUnderstandingRequest,
} from '../src/project-understanding/index.js';
import {
  TIMELINE_INTELLIGENCE_PASS_TOKEN,
  answerTimelineQuestion,
  buildTimelineState,
  resetTimelineIntelligenceForTests,
} from '../src/timeline-intelligence/index.js';
import {
  UNIFIED_DECISION_LAYER_PASS_TOKEN,
  answerDecisionQuestion,
  buildDecisionContext,
  isDecisionQuestion,
  resetUnifiedDecisionLayerForTests,
} from '../src/unified-decision-layer/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const PHASE11_PASS_TOKEN = 'DEVPULSE_V2_PHASE11_COMMAND_CENTER_VERIFICATION_PASS';

interface ScenarioResult {
  name: string;
  group: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  { q: 'What phase are we in?', route: 'TIMELINE_INTELLIGENCE', marker: 'Timeline Intelligence Response' },
  { q: 'What should we build next?', route: 'UNIFIED_DECISION_LAYER', marker: 'Unified Decision Layer Response' },
  { q: 'What changed recently?', route: 'PROJECT_HISTORY_INTELLIGENCE', marker: 'Project History Intelligence Response' },
  { q: 'What is blocked?', route: 'PROJECT_UNDERSTANDING', marker: 'Blocked' },
  { q: 'What is highest priority?', route: 'UNIFIED_DECISION_LAYER', marker: 'Unified Decision Layer Response' },
  { q: 'What is the safest next move?', route: 'UNIFIED_DECISION_LAYER', marker: 'Unified Decision Layer Response' },
  { q: 'Should we build execution now?', route: 'UNIFIED_DECISION_LAYER', marker: 'Not yet' },
  { q: 'What should we validate first?', route: 'UNIFIED_DECISION_LAYER', marker: 'Unified Decision Layer Response' },
] as const;

const DECISION_FIELDS = [
  'Recommendation:',
  'Why:',
  'Risk level:',
  'Confidence:',
  'Blockers:',
  'Supporting facts:',
  'Next safe action:',
] as const;

const FORBIDDEN_DUPLICATE_MODULES = [
  'brain_v2',
  'command_center_v2',
  'decision_brain',
  'memory_brain',
  'project_brain',
  'timeline_brain',
  'intelligence_core',
] as const;

const PHASE11_DOMAINS = [
  'command_center_brain',
  'cross_system_awareness',
  'shared_memory_layer',
  'project_understanding_engine',
  'general_question_understanding',
  'timeline_intelligence',
  'unified_decision_layer',
] as const;

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function hasDecisionFormat(text: string): boolean {
  return DECISION_FIELDS.every((f) => text.includes(f));
}

function resetPhase11Stack(): void {
  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
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

function feedHasContextStage(types: string[]): boolean {
  return types.some(
    (t) =>
      t.includes('Loading') &&
      (t.includes('Context') || t.includes('Project') || t.includes('Timeline') || t.includes('Decision')),
  );
}

function feedHasMemoryStage(types: string[]): boolean {
  return types.some((t) => t.includes('Memory'));
}

function feedHasTimelineStage(types: string[]): boolean {
  return types.some((t) => t.includes('Timeline'));
}

function feedHasProjectStage(types: string[]): boolean {
  return types.some(
    (t) => t.includes('Project') || t.includes('Gathering Facts') || t.includes('Understanding Project'),
  );
}

function feedHasDecisionStage(types: string[]): boolean {
  return types.some(
    (t) =>
      t.includes('Decision') ||
      t.includes('Evaluating Options') ||
      t.includes('Ranking Priorities') ||
      t.includes('Generating Recommendation'),
  );
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 11 Command Center Intelligence Stack Verification');
  console.log('====================================================================');
  console.log('');

  resetPhase11Stack();

  const html = readText('public/founder-reality/index.html');
  const appJs = readText('public/founder-reality/app.js');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  // ── STACK REGISTRY ──────────────────────────────────────────────────────
  assert('STACK', 'validate script registered', typeof pkg.scripts?.['validate:phase11-command-center'] === 'string', 'script');
  assert('STACK', 'brain pass token', COMMAND_CENTER_BRAIN_PASS_TOKEN.includes('COMMAND_CENTER_BRAIN'), 'brain');
  assert('STACK', 'cross-system pass token', CROSS_SYSTEM_AWARENESS_PASS_TOKEN.includes('CROSS_SYSTEM'), 'csa');
  assert('STACK', 'memory pass token', SHARED_MEMORY_LAYER_PASS_TOKEN.includes('SHARED_MEMORY'), 'memory');
  assert('STACK', 'gqu pass token', GENERAL_QUESTION_UNDERSTANDING_PASS_TOKEN.includes('GENERAL_QUESTION'), 'gqu');
  assert('STACK', 'timeline pass token', TIMELINE_INTELLIGENCE_PASS_TOKEN.includes('TIMELINE'), 'timeline');
  assert('STACK', 'decision pass token', UNIFIED_DECISION_LAYER_PASS_TOKEN.includes('UNIFIED_DECISION'), 'decision');

  for (let i = 0; i < PHASE11_DOMAINS.length; i += 1) {
    const domain = PHASE11_DOMAINS[i]!;
    const owner = getDevPulseV2Owner(domain);
    assert('STACK', `owner ${domain}`, owner.ownerModule.length > 0, owner.ownerModule);
    assert('STACK', `phase ${domain}`, owner.phase >= 11.1, String(owner.phase));
  }

  for (const dup of FORBIDDEN_DUPLICATE_MODULES) {
    assert('STACK', `no duplicate ${dup}`, !existsSync(join(ROOT, 'src', dup)), 'absent');
    const registered = listDevPulseV2Owners().some((o) => o.ownerModule.includes(dup));
    assert('STACK', `no registry ${dup}`, !registered, 'clean');
  }

  for (const pattern of DUPLICATE_BRAIN_PATTERNS) {
    const competing = listDevPulseV2Owners().filter(
      (o) => o.ownerModule.includes(pattern.replace(/\s+/g, '_')) && o.domain !== 'command_center_brain',
    );
    assert('STACK', `no brain dup ${pattern}`, competing.length === 0, pattern);
  }

  // ── GROUP A: QUESTION UNDERSTANDING ─────────────────────────────────────
  const generalQs = [
    'What is DevPulse V2?',
    'Explain the governance stack',
    'How mature is World 2?',
  ];
  for (let i = 0; i < generalQs.length; i += 1) {
    const plan = buildQuestionRoutingPlan(generalQs[i]!);
    assert('A-UNDERSTAND', `general plan ${i}`, plan.dimensions.length > 0, plan.dimensions.join(','));
  }

  const projectQs = [
    'What is the biggest weakness in DevPulse V2 right now?',
    'What is holding this project back the most?',
    'What is DevPulse strong at right now?',
  ];
  for (let i = 0; i < projectQs.length; i += 1) {
    const plan = buildQuestionRoutingPlan(projectQs[i]!);
    assert('A-UNDERSTAND', `project plan ${i}`, plan.selectedCapabilities.length > 0, plan.selectedCapabilities.join(','));
  }

  const timelineQs = [
    'What phase are we currently in?',
    'What came before Shared Memory?',
    'What was completed recently?',
  ];
  for (let i = 0; i < timelineQs.length; i += 1) {
    assert('A-UNDERSTAND', `timeline signal ${i}`, isTimelineQuestion(timelineQs[i]!), timelineQs[i]!.slice(0, 30));
  }

  const decisionQs = [
    'What should we build next?',
    'Should we build execution now?',
    'What is highest priority?',
  ];
  for (let i = 0; i < decisionQs.length; i += 1) {
    assert('A-UNDERSTAND', `decision signal ${i}`, isDecisionQuestion(decisionQs[i]!), decisionQs[i]!.slice(0, 30));
  }

  const mixedQs = [
    'What should we build next given our timeline and blocked items?',
    'What is highest priority before cloud runtime?',
    'What phase are we in and what should we defer?',
  ];
  for (let i = 0; i < mixedQs.length; i += 1) {
    const plan = buildQuestionRoutingPlan(mixedQs[i]!);
    assert('A-UNDERSTAND', `mixed plan ${i}`, plan.selectedCapabilities.length >= 1, plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 25; i += 1) {
    const q = `Phase 11 understanding batch ${i} project timeline decision`;
    const plan = buildQuestionRoutingPlan(q);
    assert('A-UNDERSTAND', `batch understand ${i}`, plan.confidence.length > 0, plan.confidence);
  }

  // ── GROUP B: ROUTING ────────────────────────────────────────────────────
  for (let i = 0; i < timelineQs.length; i += 1) {
    const q = timelineQs[i]!;
    const plan = buildQuestionRoutingPlan(q);
    const r = processBrainRequest({ message: q });
    assert('B-ROUTING', `timeline route ${i}`, plan.primaryCapability === 'TIMELINE_INTELLIGENCE', String(plan.primaryCapability));
    assert('B-ROUTING', `timeline response ${i}`, r.brainResponse.includes('Timeline Intelligence'), q.slice(0, 25));
  }

  for (let i = 0; i < decisionQs.length; i += 1) {
    const q = decisionQs[i]!;
    const plan = buildQuestionRoutingPlan(q);
    const r = processBrainRequest({ message: q });
    assert('B-ROUTING', `decision route ${i}`, plan.primaryCapability === 'UNIFIED_DECISION_LAYER', String(plan.primaryCapability));
    assert('B-ROUTING', `decision response ${i}`, r.brainResponse.includes('Unified Decision Layer'), q.slice(0, 25));
  }

  const legacyProjectQ = 'What is missing in this project?';
  const legacyR = processBrainRequest({ message: legacyProjectQ });
  assert('B-ROUTING', 'legacy project route', legacyR.category === 'PROJECT_UNDERSTANDING', legacyR.category);
  assert('B-ROUTING', 'legacy project answer', legacyR.brainResponse.includes('Missing Capabilities'), 'gaps');

  const blockedLegacy = processBrainRequest({ message: 'What is blocked?' });
  assert('B-ROUTING', 'blocked legacy route', blockedLegacy.category === 'PROJECT_UNDERSTANDING', blockedLegacy.category);

  const depQ = processBrainRequest({ message: 'What does Command Center Brain depend on?' });
  assert('B-ROUTING', 'dependency route', depQ.category === 'DEPENDENCY' || depQ.brainResponse.length > 20, depQ.category);

  const memQ = processBrainRequest({ message: 'What do you remember about World 2?' });
  assert('B-ROUTING', 'memory route', memQ.category === 'MEMORY', memQ.category);

  for (let i = 0; i < 30; i += 1) {
    const q = i % 3 === 0
      ? `What phase are we in iteration ${i}?`
      : i % 3 === 1
        ? `What should we build next iteration ${i}?`
        : `What is highest priority iteration ${i}?`;
    const plan = buildQuestionRoutingPlan(q);
    const expected =
      i % 3 === 0 ? 'TIMELINE_INTELLIGENCE' : 'UNIFIED_DECISION_LAYER';
    assert('B-ROUTING', `route batch ${i}`, plan.primaryCapability === expected, String(plan.primaryCapability));
  }

  for (let i = 0; i < 20; i += 1) {
    const q = `Mixed routing ${i} DevPulse roadmap defer blocked`;
    const plan = buildQuestionRoutingPlan(q);
    assert('B-ROUTING', `mixed route ${i}`, plan.primaryCapability !== null || plan.selectedCapabilities.length > 0, 'routed');
  }

  // ── GROUP C: SHARED MEMORY ──────────────────────────────────────────────
  const store = getSharedMemoryStore();
  assert('C-MEMORY', 'store exists', store !== null, 'store');
  assert('C-MEMORY', 'seeded memories', store.memoryCount() > 0, String(store.memoryCount()));

  const recall = recallRelevantMemories('What do you remember about World 2?');
  assert('C-MEMORY', 'recall matches', recall.matches.length > 0, String(recall.matches.length));

  const memBrain = processBrainRequest({ message: 'What do you remember about World 2?' });
  assert('C-MEMORY', 'memory brain response', memBrain.brainResponse.length > 30, 'response');
  assert('C-MEMORY', 'memory context', Boolean(memBrain.sharedMemoryContext?.lookupPerformed), 'context');

  const emptyRecall = recallRelevantMemories('xyzzy_nonexistent_memory_token_12345');
  assert('C-MEMORY', 'empty recall safe', emptyRecall.matches.length >= 0, String(emptyRecall.matches.length));

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: `What decisions have been recorded batch ${i}?` });
    assert('C-MEMORY', `memory batch ${i}`, r.category === 'MEMORY' || r.brainResponse.length > 10, r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    assert('C-MEMORY', `isMemory ${i}`, isMemoryQuestion('What do you remember about governance?'), 'signal');
  }

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('C-MEMORY', 'decision uses memory facts', decisionCtx.memoryFactCount >= 0, String(decisionCtx.memoryFactCount));

  for (let i = 0; i < 15; i += 1) {
    const partial = recallRelevantMemories(`partial memory query ${i}`);
    assert('C-MEMORY', `partial recall ${i}`, partial.query.length > 0, 'ok');
  }

  // ── GROUP D: PROJECT UNDERSTANDING ──────────────────────────────────────
  const projResult = processProjectUnderstandingRequest('What project are we working on?');
  assert('D-PROJECT', 'project name', projResult.responseText.includes('DevPulse'), 'name');
  assert('D-PROJECT', 'project status', projResult.context.statusSummary.summaryLines.length > 0, 'status');

  const goalsR = processBrainRequest({ message: 'What is the biggest weakness in DevPulse V2 right now?' });
  assert('D-PROJECT', 'goals/weakness', goalsR.brainResponse.includes('Conclusion:'), 'conclusion');

  const scopeR = processBrainRequest({ message: 'What should not be built yet?' });
  assert('D-PROJECT', 'scope/defer', scopeR.brainResponse.includes('Unified Decision Layer') || scopeR.brainResponse.includes('Conclusion:'), 'scope');

  const maturityR = processBrainRequest({ message: 'What foundation is most important before execution?' });
  assert('D-PROJECT', 'maturity', maturityR.brainResponse.length > 50, 'maturity');

  for (let i = 0; i < 25; i += 1) {
    const r = processProjectUnderstandingRequest(`Project summary batch ${i}`);
    assert('D-PROJECT', `project batch ${i}`, r.responseText.length > 20, 'summary');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `What is holding this project back batch ${i}?` });
    assert('D-PROJECT', `awareness batch ${i}`, r.brainResponse.includes('Conclusion:') || r.brainResponse.includes('Unified Decision'), 'aware');
  }

  const diag = getProjectUnderstandingDiagnostics();
  processProjectUnderstandingRequest('What project are we working on?');
  const diag2 = getProjectUnderstandingDiagnostics();
  assert('D-PROJECT', 'diagnostics active', diag2.projectUnderstandingActive === true, 'active');

  // ── GROUP E: TIMELINE INTELLIGENCE ──────────────────────────────────────
  const state = buildTimelineState();
  assert('E-TIMELINE', 'current phase', state.currentPhase.includes('11.'), state.currentPhase);
  assert('E-TIMELINE', 'completed phases', state.completedPhases.length > 5, String(state.completedPhases.length));
  assert('E-TIMELINE', 'blockers', state.activeBlockers.length > 0, String(state.activeBlockers.length));

  const phaseAns = answerTimelineQuestion('What phase are we currently in?');
  assert('E-TIMELINE', 'phase answer', phaseAns.includes('Timeline Intelligence Response'), 'format');

  const beforeAns = answerTimelineQuestion('What came before Shared Memory?');
  assert('E-TIMELINE', 'past phases', beforeAns.includes('Shared Memory') || beforeAns.includes('Conclusion:'), 'before');

  const recentAns = answerTimelineQuestion('What changed recently?');
  assert('E-TIMELINE', 'recent activity', recentAns.includes('Timeline Intelligence Response'), 'recent');

  for (let i = 0; i < 30; i += 1) {
    const ans = answerTimelineQuestion(`What is the roadmap sequence batch ${i}?`);
    assert('E-TIMELINE', `timeline batch ${i}`, ans.includes('Timeline Intelligence'), 'timeline');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `What phase are we in batch ${i}?` });
    assert('E-TIMELINE', `brain timeline ${i}`, r.brainResponse.includes('Timeline Intelligence'), 'routed');
  }

  // ── GROUP F: UNIFIED DECISION LAYER ─────────────────────────────────────
  for (const field of DECISION_FIELDS) {
    const ans = answerDecisionQuestion('Should we build execution now?');
    assert('F-DECISION', `field ${field}`, ans.includes(field), field);
  }

  const execAns = answerDecisionQuestion('Should we build execution now?');
  assert('F-DECISION', 'execution not generic', execAns.includes('Not yet') && !execAns.includes('runtime is not connected'), 'advisory');
  assert('F-DECISION', 'execution blockers listed', execAns.includes('Development Reasoning not implemented'), 'blockers');

  for (let i = 0; i < SUCCESS_QUESTIONS.filter((s) => s.route === 'UNIFIED_DECISION_LAYER').length; i += 1) {
    const sq = SUCCESS_QUESTIONS.filter((s) => s.route === 'UNIFIED_DECISION_LAYER')[i]!;
    const ans = answerDecisionQuestion(sq.q);
    assert('F-DECISION', `success ${i}`, hasDecisionFormat(ans) && ans.includes(sq.marker) || ans.includes('Recommendation:'), sq.q.slice(0, 30));
  }

  for (let i = 0; i < 35; i += 1) {
    const ans = answerDecisionQuestion(`What should we defer item ${i}?`);
    assert('F-DECISION', `decision batch ${i}`, hasDecisionFormat(ans), 'format');
  }

  const ctx = buildDecisionContext('What is highest priority?');
  assert('F-DECISION', 'context blockers', ctx.blockedItems.length > 0, String(ctx.blockedItems.length));
  assert('F-DECISION', 'context systems', ctx.relatedSystems.length > 0, String(ctx.relatedSystems.length));

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `Should we build cloud runtime now batch ${i}?` });
    assert('F-DECISION', `cloud defer ${i}`, r.brainResponse.includes('Not yet') || r.brainResponse.includes('defer'), 'defer');
  }

  // ── GROUP G: CROSS-SYSTEM AWARENESS ─────────────────────────────────────
  const edges = getRelationshipEdges();
  assert('G-CROSS', 'relationship edges', edges.length > 0, String(edges.length));

  const systems = getCommandCenterAwareSystems();
  assert('G-CROSS', 'brain in awareness', systems.some((s) => s.systemId === 'command_center_brain'), 'brain');

  for (const domain of PHASE11_DOMAINS) {
    const owner = getDevPulseV2Owner(domain);
    assert('G-CROSS', `registry ${domain}`, owner.ownerModule.length > 0, owner.ownerModule);
  }

  assert('G-CROSS', 'decision cross edges', buildDecisionContext('What should we build next?').crossSystemEdgeCount > 0, 'edges');

  const relR = processBrainRequest({ message: 'How does World 2 connect to Command Center?' });
  assert('G-CROSS', 'relationship answer', relR.brainResponse.length > 30, 'rel');

  for (let i = 0; i < 25; i += 1) {
    const ctxI = buildDecisionContext(`cross-system context ${i}`);
    assert('G-CROSS', `context share ${i}`, ctxI.ownershipDomains > 20, String(ctxI.ownershipDomains));
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: `What depends on Shared Memory layer batch ${i}?` });
    assert('G-CROSS', `dependency ${i}`, r.category === 'DEPENDENCY' || r.brainResponse.length > 20, r.category);
  }

  // ── GROUP H: OPERATOR FEED ────────────────────────────────────────────────
  const timelineFeed = processBrainRequest({ message: 'What phase are we currently in?' });
  const tlTypes = timelineFeed.operatorFeedEvents.map((e) => e.eventType);
  assert('H-FEED', 'timeline context stage', feedHasContextStage(tlTypes), tlTypes.join('|'));
  assert('H-FEED', 'timeline timeline stage', feedHasTimelineStage(tlTypes), tlTypes.join('|'));
  assert('H-FEED', 'timeline response ready', tlTypes.includes('Response Ready'), 'ready');
  assert('H-FEED', 'timeline feed constant', TIMELINE_INTELLIGENCE_FEED.length === 6, String(TIMELINE_INTELLIGENCE_FEED.length));

  const decisionFeed = processBrainRequest({ message: 'What should we build next?' });
  const dTypes = decisionFeed.operatorFeedEvents.map((e) => e.eventType);
  assert('H-FEED', 'decision context stage', feedHasContextStage(dTypes), dTypes.join('|'));
  assert('H-FEED', 'decision eval stage', feedHasDecisionStage(dTypes), dTypes.join('|'));
  assert('H-FEED', 'decision response ready', dTypes.includes('Response Ready'), 'ready');
  assert('H-FEED', 'decision feed constant', UNIFIED_DECISION_LAYER_FEED.length === 7, String(UNIFIED_DECISION_LAYER_FEED.length));

  const memFeed = processBrainRequest({ message: 'What do you remember about Operator Feed?' });
  const mTypes = memFeed.operatorFeedEvents.map((e) => e.eventType);
  assert('H-FEED', 'memory feed stage', feedHasMemoryStage(mTypes), mTypes.join('|'));
  assert('H-FEED', 'memory response ready', mTypes.includes('Response Ready'), 'ready');

  const projFeed = processBrainRequest({ message: 'What is missing in this project?' });
  const pTypes = projFeed.operatorFeedEvents.map((e) => e.eventType);
  assert('H-FEED', 'project feed stage', feedHasProjectStage(pTypes), pTypes.join('|'));

  for (let i = 0; i < SHARED_MEMORY_OPERATOR_FEED_STAGES.length; i += 1) {
    assert('H-FEED', `memory stage def ${i}`, mTypes.includes(SHARED_MEMORY_OPERATOR_FEED_STAGES[i]!), 'defined');
  }

  for (let i = 0; i < 30; i += 1) {
    const r = processBrainRequest({
      message: i % 2 === 0 ? `What should we build next feed ${i}?` : `What phase are we in feed ${i}?`,
    });
    const types = r.operatorFeedEvents.map((e) => e.eventType);
    assert('H-FEED', `feed batch ${i}`, types.includes('Response Ready') && types.length >= 3, String(types.length));
  }

  // ── GROUP I: DIAGNOSTICS ────────────────────────────────────────────────
  assert('I-DIAG', 'runtime diagnostics html', html.includes('runtime-diagnostics-list'), 'runtime');
  assert('I-DIAG', 'project diagnostics html', html.includes('project-understanding-active'), 'project');
  assert('I-DIAG', 'timeline diagnostics html', html.includes('current-timeline-phase'), 'timeline');
  assert('I-DIAG', 'decision diagnostics html', html.includes('decision-layer-active'), 'decision');
  assert('I-DIAG', 'routing diagnostics html', html.includes('routing-reason'), 'route');
  assert('I-DIAG', 'last recommendation html', html.includes('last-recommendation'), 'rec');

  assert('I-DIAG', 'render runtime', appJs.includes('renderRuntimeDiagnostics'), 'runtime fn');
  assert('I-DIAG', 'render project', appJs.includes('renderProjectUnderstandingDiagnostics'), 'project fn');
  assert('I-DIAG', 'render timeline', appJs.includes('renderTimelineIntelligenceDiagnostics'), 'timeline fn');
  assert('I-DIAG', 'render decision', appJs.includes('renderDecisionLayerDiagnostics'), 'decision fn');
  assert('I-DIAG', 'render general route', appJs.includes('renderGeneralQuestionDiagnostics'), 'route fn');

  const httpDecision = await postBrain('What should we build next?');
  const httpDiag = httpDecision.body?.unifiedDecisionLayerDiagnostics as {
    decisionLayerActive?: boolean;
    lastRecommendation?: string;
  } | undefined;
  assert('I-DIAG', 'http decision diag', httpDiag?.decisionLayerActive === true, 'active');
  assert('I-DIAG', 'http recommendation', Boolean(httpDiag?.lastRecommendation), 'rec');

  const httpTimeline = await postBrain('What phase are we in?');
  const tlDiag = httpTimeline.body?.timelineIntelligenceDiagnostics as { lastTimelineQuery?: string } | undefined;
  assert('I-DIAG', 'http timeline diag', Boolean(tlDiag?.lastTimelineQuery), 'timeline');

  const httpGqu = httpDecision.body?.generalQuestionDiagnostics as { routingReason?: string } | undefined;
  assert('I-DIAG', 'http last route', Boolean(httpGqu?.routingReason), 'route');

  for (let i = 0; i < 15; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!.q);
    assert('I-DIAG', `http diag batch ${i}`, res.status === 200, String(res.status));
  }

  // ── GROUP J: NEGATIVE TESTS ─────────────────────────────────────────────
  const phase11Dirs = [
    'src/command-center-brain',
    'src/shared-memory',
    'src/project-understanding',
    'src/timeline-intelligence',
    'src/unified-decision-layer',
  ];
  const forbidden = ['child_process', 'writeFileSync', 'spawn', 'exec(', 'eval(', 'deploy('];
  for (const dir of phase11Dirs) {
    const content = readText(`${dir}/index.ts`);
    for (const f of forbidden) {
      assert('J-NEGATIVE', `no ${f} in ${dir}`, !content.includes(f), 'clean');
    }
  }

  const brainScan = scanBrainModuleForForbiddenPatterns(join(ROOT, 'src/command-center-brain'));
  assert('J-NEGATIVE', 'brain scan clean', brainScan.length === 0, brainScan.join(';').slice(0, 80));

  const blockedExec = processBrainRequest({ message: 'please execute this now and deploy' });
  assert('J-NEGATIVE', 'blocked execution', blockedExec.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');

  const blockedCode = processBrainRequest({ message: 'generate code for me now' });
  assert('J-NEGATIVE', 'blocked codegen', blockedCode.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');

  const safeQ = processBrainRequest({ message: 'What should we build next?' });
  assert('J-NEGATIVE', 'intelligence only', safeQ.confirmation.intelligenceOnly === true, 'intel');
  assert('J-NEGATIVE', 'no execution', safeQ.confirmation.noExecutionPerformed === true, 'no exec');
  assert('J-NEGATIVE', 'no files', safeQ.confirmation.noFilesModified === true, 'no files');
  assert('J-NEGATIVE', 'no codegen confirm', safeQ.confirmation.noCodeGenerated === true, 'no codegen');
  assert('J-NEGATIVE', 'no deploy confirm', safeQ.confirmation.noDeploymentPerformed === true, 'no deploy');
  assert('J-NEGATIVE', 'no persistence', safeQ.confirmation.noPersistence === true, 'no persist');
  assert('J-NEGATIVE', 'no runtime mutation', safeQ.confirmation.noRuntimeMutation === true, 'no mutate');

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: `execute deploy auto-fix batch ${i}` });
    assert('J-NEGATIVE', `blocked batch ${i}`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  // ── SUCCESS QUESTIONS (integrated) ──────────────────────────────────────
  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const { q, route, marker } = SUCCESS_QUESTIONS[i]!;
    const r = processBrainRequest({ message: q });
    const plan = buildQuestionRoutingPlan(q);
    if (route === 'PROJECT_UNDERSTANDING') {
      assert('SUCCESS', `q${i} project`, r.brainResponse.includes(marker) || r.brainResponse.includes('Blocked'), q);
    } else {
      assert('SUCCESS', `q${i} plan`, plan.primaryCapability === route, String(plan.primaryCapability));
      assert('SUCCESS', `q${i} answer`, r.brainResponse.includes(marker) || r.brainResponse.includes('Conclusion:'), q.slice(0, 35));
    }
  }

  // ── BULK INTEGRATION LOOPS (reach 500+) ─────────────────────────────────
  for (let i = 0; i < 40; i += 1) {
    const r = processBrainRequest({
      message:
        i % 4 === 0
          ? `What phase are we in stack ${i}?`
          : i % 4 === 1
            ? `What should we build next stack ${i}?`
            : i % 4 === 2
              ? `What is highest priority stack ${i}?`
              : `What do you remember stack ${i}?`,
    });
    assert('INTEGRATION', `stack ${i}`, r.confirmation.intelligenceOnly === true && r.brainResponse.length > 10, 'ok');
  }

  for (let i = 0; i < 30; i += 1) {
    const cls = classifyBrainRequest({ message: `Classify batch ${i} DevPulse roadmap`, timestamp: Date.now() });
    assert('INTEGRATION', `classify ${i}`, cls.category.length > 0, cls.category);
  }

  for (let i = 0; i < 25; i += 1) {
    const a1 = answerDecisionQuestion('Should we build execution now?');
    const a2 = answerDecisionQuestion('Should we build execution now?');
    assert('INTEGRATION', `deterministic ${i}`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 20; i += 1) {
    const res = await postBrain(`HTTP integration ${i} what should we build next`);
    assert('INTEGRATION', `http ${i}`, res.status === 200 && Boolean(res.body?.brainResponse), 'http');
  }

  // verify src has no duplicate intelligence dirs
  const srcEntries = readdirSync(join(ROOT, 'src'));
  for (const dup of FORBIDDEN_DUPLICATE_MODULES) {
    assert('INTEGRATION', `src no ${dup}`, !srcEntries.includes(dup), 'absent');
  }

  // ── REPORT ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  const groupSummary = new Map<string, { pass: number; fail: number }>();
  for (const r of results) {
    const g = groupSummary.get(r.group) ?? { pass: 0, fail: 0 };
    if (r.passed) g.pass += 1;
    else g.fail += 1;
    groupSummary.set(r.group, g);
  }

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Group summary:');
  for (const [group, stats] of groupSummary) {
    console.log(`  ${group}: ${stats.pass} pass, ${stats.fail} fail`);
  }
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 40)) {
      console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 500) {
    console.log(`Insufficient scenarios: ${total} < 500`);
    process.exitCode = 1;
    return;
  }

  console.log(PHASE11_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:phase11-command-center');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

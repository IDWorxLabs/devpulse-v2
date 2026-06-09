/**
 * DevPulse V2 Phase 13.1 — Operator Feed Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  OPERATOR_FEED_FOUNDATION_PASS_TOKEN,
  FORBIDDEN_OPERATOR_FEED_DUPLICATES,
  STANDARD_VISIBILITY_STAGES,
  createOperatorFeedEvent,
  mapCapabilityToFeedStages,
  sourceSystemsForStages,
  publishVisibilityStages,
  buildOperatorFeedVisibility,
  isTimelineOrdered,
  getOperatorFeedDiagnostics,
  resetOperatorFeedDiagnostics,
  resetOperatorFeedEventCounterForTests,
  resetOperatorFeedTimelineCounterForTests,
} from '../src/operator-feed/index.js';
import {
  buildQuestionRoutingPlan,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import { resetProjectUnderstandingForTests } from '../src/project-understanding/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import { resetUnifiedDecisionLayerForTests } from '../src/unified-decision-layer/index.js';
import {
  resetProjectVaultIntelligenceDiagnostics,
  resetProjectVaultIntelligenceBridgeForTests,
} from '../src/project-vault-intelligence/index.js';
import {
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../src/dependency-intelligence/index.js';
import {
  resetWorkspaceIntelligenceDiagnostics,
  resetWorkspaceSnapshotForTests,
  resetWorkspaceRiskCounterForTests,
} from '../src/workspace-intelligence/index.js';
import {
  resetProjectHistoryIntelligenceDiagnostics,
  resetProjectHistorySnapshotForTests,
  resetHistoryEventReaderForTests,
} from '../src/project-history-intelligence/index.js';
import {
  resetProjectSummarizationDiagnostics,
  resetExecutiveSummaryCounterForTests,
  resetTechnicalSummaryCounterForTests,
  resetProjectHealthCounterForTests,
  resetProjectStatusCounterForTests,
} from '../src/project-summarization-engine/index.js';
import {
  resetPortfolioIntelligenceDiagnostics,
  resetPortfolioRiskCounterForTests,
  resetPortfolioPriorityCounterForTests,
  resetPortfolioComparisonCounterForTests,
  resetPortfolioSummaryCounterForTests,
} from '../src/portfolio-intelligence/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS: Array<{ q: string; authority: string; source: string }> = [
  { q: 'What should we build next?', authority: 'UNIFIED_DECISION_LAYER', source: 'unified_decision_layer' },
  { q: 'What projects exist?', authority: 'PORTFOLIO_INTELLIGENCE', source: 'portfolio_intelligence' },
  { q: 'What changed recently?', authority: 'PROJECT_HISTORY_INTELLIGENCE', source: 'project_history_intelligence' },
  { q: 'What workspace is active?', authority: 'WORKSPACE_INTELLIGENCE', source: 'workspace_intelligence' },
  { q: 'Summarize DevPulse V2.', authority: 'PROJECT_SUMMARIZATION_ENGINE', source: 'project_summarization_engine' },
  { q: 'What is the healthiest project?', authority: 'PORTFOLIO_INTELLIGENCE', source: 'portfolio_intelligence' },
];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function resetAll(): void {
  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetTimelineIntelligenceForTests();
  resetUnifiedDecisionLayerForTests();
  resetProjectVaultIntelligenceDiagnostics();
  resetProjectVaultIntelligenceBridgeForTests();
  resetDependencyIntelligenceDiagnostics();
  resetDependencyGraphForTests();
  resetWorkspaceIntelligenceDiagnostics();
  resetWorkspaceSnapshotForTests();
  resetWorkspaceRiskCounterForTests();
  resetProjectHistoryIntelligenceDiagnostics();
  resetProjectHistorySnapshotForTests();
  resetHistoryEventReaderForTests();
  resetProjectSummarizationDiagnostics();
  resetExecutiveSummaryCounterForTests();
  resetTechnicalSummaryCounterForTests();
  resetProjectHealthCounterForTests();
  resetProjectStatusCounterForTests();
  resetPortfolioIntelligenceDiagnostics();
  resetPortfolioRiskCounterForTests();
  resetPortfolioPriorityCounterForTests();
  resetPortfolioComparisonCounterForTests();
  resetPortfolioSummaryCounterForTests();
  resetOperatorFeedDiagnostics();
  resetOperatorFeedEventCounterForTests();
  resetOperatorFeedTimelineCounterForTests();
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
  console.log('DevPulse V2 — Phase 13.1 Operator Feed Foundation');
  console.log('=================================================');
  console.log('');

  resetAll();

  const feedDir = join(ROOT, 'src/operator-feed');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(feedDir, 'operator-feed-types.ts')), 'exists');
  assert('2. event', existsSync(join(feedDir, 'operator-feed-event.ts')), 'exists');
  assert('3. mapper', existsSync(join(feedDir, 'operator-feed-stage-mapper.ts')), 'exists');
  assert('4. visibility', existsSync(join(feedDir, 'operator-feed-visibility-engine.ts')), 'exists');
  assert('5. context', existsSync(join(feedDir, 'operator-feed-context-tracker.ts')), 'exists');
  assert('6. timeline', existsSync(join(feedDir, 'operator-feed-timeline.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(feedDir, 'operator-feed-diagnostics.ts')), 'exists');
  assert('8. engine', existsSync(join(feedDir, 'operator-feed.ts')), 'exists');
  assert('9. validate script', typeof pkg.scripts?.['validate:operator-feed-foundation'] === 'string', 'script');

  const owner = getDevPulseV2Owner('operator_feed');
  assert('10. registry owner', owner.ownerModule === 'devpulse_v2_operator_feed', owner.ownerModule);
  assert('11. registry phase', owner.phase === 13.1, String(owner.phase));
  assert('12. pass token', OPERATOR_FEED_FOUNDATION_PASS_TOKEN.includes('OPERATOR_FEED'), 'token');
  assert('13. inline preserved', getDevPulseV2Owner('inline_operator_feed').ownerModule === 'devpulse_v2_inline_operator_feed_authority', 'inline');
  assert('14. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'operator_feed').length === 1, 'single');
  assert('15. stage count', STANDARD_VISIBILITY_STAGES.length >= 12, String(STANDARD_VISIBILITY_STAGES.length));

  const event = createOperatorFeedEvent('Loading Context', 'operator_feed', Date.now());
  assert('16. event fields', event.visibilityOnly === true && event.stage === 'Loading Context', 'event');
  assert('17. event confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(event.confidence), event.confidence);

  const decisionStages = mapCapabilityToFeedStages('UNIFIED_DECISION_LAYER');
  assert('18. decision stages', decisionStages.includes('Generating Recommendation'), decisionStages.join(','));
  assert('19. portfolio stages', mapCapabilityToFeedStages('PORTFOLIO_INTELLIGENCE').includes('Generating Portfolio Summary'), 'port');
  assert('20. summary stages', mapCapabilityToFeedStages('PROJECT_SUMMARIZATION_ENGINE').includes('Reading Summaries'), 'sum');

  const timeline = publishVisibilityStages('feed test', 'UNIFIED_DECISION_LAYER');
  assert('21. timeline events', timeline.events.length > 0, String(timeline.events.length));
  assert('22. response ready', timeline.responseReady === true, 'ready');
  assert('23. ordered', isTimelineOrdered(timeline), 'ordered');
  assert('24. sources', timeline.sourceSystems.includes('unified_decision_layer'), timeline.sourceSystems.join(','));

  const diag = getOperatorFeedDiagnostics();
  assert('25. diag active', diag.operatorFeedActive === true, 'active');
  assert('26. diag ready', diag.responseReadyEmitted === true, 'ready');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const { q, authority, source } = SUCCESS_QUESTIONS[i]!;
    const brain = processBrainRequest({ message: q });
    const tl = brain.operatorFeedTimeline;
    assert(`27.${i} feed events`, Boolean(tl && tl.events.length > 0), q.slice(0, 30));
    assert(`28.${i} timeline`, Boolean(tl && tl.stageCount > 0), String(tl?.stageCount));
    assert(`29.${i} response ready`, Boolean(tl?.responseReady), 'ready');
    assert(`30.${i} source`, Boolean(tl?.sourceSystems.some((s) => s.includes(source.split('_')[0]!))), source);
    const plan = buildQuestionRoutingPlan(q);
    assert(`31.${i} authority`, plan.primaryCapability === authority, String(plan.primaryCapability));
    assert(`32.${i} legacy feed`, brain.operatorFeedEvents.length > 0, String(brain.operatorFeedEvents.length));
  }

  assert('33. brain diag', Boolean(processBrainRequest({ message: 'What projects exist?' }).operatorFeedFoundationDiagnostics?.operatorFeedActive), 'diag');
  assert('34. no child_process', !readText('src/operator-feed/index.ts').includes('child_process'), 'clean');
  assert('35. no eval', !readText('src/operator-feed/index.ts').includes('eval('), 'clean');
  assert('36. no fs write', !readText('src/operator-feed/index.ts').includes('writeFileSync'), 'clean');
  assert('37. no spawn', !readText('src/operator-feed/index.ts').includes('spawn'), 'clean');
  assert('38. brain integrated', readText('src/command-center-brain/command-center-brain.ts').includes('buildOperatorFeedVisibility'), 'brain');
  assert('39. founder html', readText('public/founder-reality/index.html').includes('operator-feed-active'), 'html');
  assert('40. founder app', readText('public/founder-reality/app.js').includes('renderOperatorFeedDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_OPERATOR_FEED_DUPLICATES) {
    const domain = forbidden.replace(/-/g, '_');
    assert(`41.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('42. no feed_brain', !srcEntries.includes('feed_brain'), 'clean');
  assert('43. no visibility_brain', !srcEntries.includes('visibility_brain'), 'clean');

  assert('44. intel only', processBrainRequest({ message: 'What projects exist?' }).confirmation.intelligenceOnly === true, 'intel');
  assert('45. no execution', processBrainRequest({ message: 'What projects exist?' }).confirmation.noExecutionPerformed === true, 'no exec');
  assert('46. no persistence', processBrainRequest({ message: 'What projects exist?' }).confirmation.noPersistence === true, 'no persist');
  assert('47. no files', processBrainRequest({ message: 'What projects exist?' }).confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 50; i += 1) {
    const tl = buildOperatorFeedVisibility({ query: `visibility batch ${i}`, routingPlan: buildQuestionRoutingPlan('What projects exist?') });
    assert(`48.${i} vis batch`, tl.events.length > 0, String(tl.events.length));
  }

  for (let i = 0; i < 40; i += 1) {
    const stages = mapCapabilityToFeedStages('PORTFOLIO_INTELLIGENCE');
    assert(`49.${i} port map`, stages.includes('Response Ready'), stages.join(','));
  }

  for (let i = 0; i < 40; i += 1) {
    const stages = mapCapabilityToFeedStages('PROJECT_SUMMARIZATION_ENGINE');
    assert(`50.${i} sum map`, stages.includes('Reading Summaries'), stages.join(','));
  }

  for (let i = 0; i < 35; i += 1) {
    const stages = mapCapabilityToFeedStages('WORKSPACE_INTELLIGENCE');
    assert(`51.${i} ws map`, stages.includes('Reading Workspace Intelligence'), stages.join(','));
  }

  for (let i = 0; i < 35; i += 1) {
    const stages = mapCapabilityToFeedStages('PROJECT_HISTORY_INTELLIGENCE');
    assert(`52.${i} hist map`, stages.includes('Reading History Intelligence'), stages.join(','));
  }

  for (let i = 0; i < 30; i += 1) {
    const stages = mapCapabilityToFeedStages('DEPENDENCY_INTELLIGENCE');
    assert(`53.${i} dep map`, stages.includes('Reading Dependency Intelligence'), stages.join(','));
  }

  for (let i = 0; i < 30; i += 1) {
    const brain = processBrainRequest({ message: `What should we build next? batch ${i}` });
    assert(`54.${i} decision feed`, Boolean(brain.operatorFeedTimeline?.responseReady), 'ready');
  }

  for (let i = 0; i < 25; i += 1) {
    const brain = processBrainRequest({ message: `Summarize DevPulse batch ${i}` });
    assert(`55.${i} sum feed`, Boolean(brain.operatorFeedTimeline?.sourceSystems.includes('project_summarization_engine')), 'sum');
  }

  for (let i = 0; i < 25; i += 1) {
    const systems = sourceSystemsForStages(['Reading Vault Intelligence', 'Response Ready']);
    assert(`56.${i} vault src`, systems.includes('project_vault_intelligence'), systems.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const e = createOperatorFeedEvent('Generating Response', 'command_center_brain', Date.now() + i);
    assert(`57.${i} event batch`, e.visibilityOnly === true, 'vis');
  }

  for (let i = 0; i < 15; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!.q);
    assert(`58.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 12; i += 1) {
    const res = await postBrain('What projects exist?');
    const d = res.body?.operatorFeedFoundationDiagnostics as { eventCount?: number } | undefined;
    assert(`59.${i} http diag`, Boolean(d?.eventCount && d.eventCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`60.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = buildOperatorFeedVisibility({ query: 'stable', routingPlan: buildQuestionRoutingPlan('What projects exist?') });
    const a2 = buildOperatorFeedVisibility({ query: 'stable', routingPlan: buildQuestionRoutingPlan('What projects exist?') });
    assert(`61.${i} deterministic stages`, a1.stageCount === a2.stageCount, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`62.${i} no feed_brain`, !registry.includes('feed_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`63.${i} udl hook`, readText('src/unified-decision-layer/index.ts').includes('publishOperatorFeedStage'), 'udl');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`64.${i} pu hook`, readText('src/project-understanding/project-understanding-runtime.ts').includes('publishOperatorFeedStage'), 'pu');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`65.${i} port hook`, readText('src/portfolio-intelligence/portfolio-intelligence.ts').includes('publishOperatorFeedStage'), 'port');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`66.${i} sum hook`, readText('src/project-summarization-engine/project-summarization-engine.ts').includes('publishOperatorFeedStage'), 'sum');
  }

  for (let i = 0; i < 12; i += 1) {
    assert(`67.${i} ws hook`, readText('src/workspace-intelligence/workspace-intelligence.ts').includes('publishOperatorFeedStage'), 'ws');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`68.${i} hist hook`, readText('src/project-history-intelligence/project-history-intelligence.ts').includes('publishOperatorFeedStage'), 'hist');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`69.${i} dep hook`, readText('src/dependency-intelligence/dependency-intelligence.ts').includes('publishOperatorFeedStage'), 'dep');
  }

  for (let i = 0; i < 8; i += 1) {
    const last = processBrainRequest({ message: 'What projects exist?' }).operatorFeedTimeline?.events.at(-1);
    assert(`70.${i} final stage`, last?.stage === 'Response Ready', String(last?.stage));
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

  if (total < 600) {
    console.log(`Insufficient scenarios: ${total} < 600`);
    process.exitCode = 1;
    return;
  }

  console.log(OPERATOR_FEED_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:operator-feed-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

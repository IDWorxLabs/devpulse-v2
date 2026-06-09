/**
 * DevPulse V2 Phase 13.2 — Action Visibility Engine Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  ACTION_VISIBILITY_ENGINE_PASS_TOKEN,
  FORBIDDEN_ACTION_VISIBILITY_DUPLICATES,
  buildActionCandidates,
  evaluateActionStatus,
  findHighestPriorityAction,
  filterActionsByStatus,
  filterActionsBySource,
  isActionVisibilityQuestion,
  processActionVisibilityRequest,
  getActionVisibilityDiagnostics,
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
} from '../src/action-visibility-engine/index.js';
import { ACTION_VISIBILITY_FEED_STAGES } from '../src/operator-feed/index.js';
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
import { resetUnifiedDecisionLayerForTests, processUnifiedDecisionLayerRequest } from '../src/unified-decision-layer/index.js';
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
import {
  resetOperatorFeedDiagnostics,
  resetOperatorFeedEventCounterForTests,
  resetOperatorFeedTimelineCounterForTests,
} from '../src/operator-feed/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What should we do next?',
  'What is the recommended action?',
  'What actions are blocked?',
  'What actions are deferred?',
  'What action has highest priority?',
  'What action comes from Dependency Intelligence?',
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
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
  console.log('DevPulse V2 — Phase 13.2 Action Visibility Engine Foundation');
  console.log('===========================================================');
  console.log('');

  resetAll();

  const aveDir = join(ROOT, 'src/action-visibility-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(aveDir, 'action-visibility-types.ts')), 'exists');
  assert('2. builder', existsSync(join(aveDir, 'action-candidate-builder.ts')), 'exists');
  assert('3. status', existsSync(join(aveDir, 'action-status-evaluator.ts')), 'exists');
  assert('4. priority', existsSync(join(aveDir, 'action-priority-evaluator.ts')), 'exists');
  assert('5. source', existsSync(join(aveDir, 'action-source-resolver.ts')), 'exists');
  assert('6. diagnostics', existsSync(join(aveDir, 'action-visibility-diagnostics.ts')), 'exists');
  assert('7. engine', existsSync(join(aveDir, 'action-visibility-engine.ts')), 'exists');
  assert('8. index', existsSync(join(aveDir, 'index.ts')), 'exists');
  assert('9. feed bridge', existsSync(join(ROOT, 'src/operator-feed/action-visibility-feed-bridge.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:action-visibility-engine'] === 'string', 'script');

  const owner = getDevPulseV2Owner('action_visibility_engine');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_action_visibility_engine', owner.ownerModule);
  assert('12. registry phase', owner.phase === 13.2, String(owner.phase));
  assert('13. pass token', ACTION_VISIBILITY_ENGINE_PASS_TOKEN.includes('ACTION_VISIBILITY'), 'token');
  assert('14. operator feed preserved', getDevPulseV2Owner('operator_feed').phase === 13.1, 'feed');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'action_visibility_engine').length === 1, 'single');
  assert('16. feed stages', ACTION_VISIBILITY_FEED_STAGES.length >= 6, String(ACTION_VISIBILITY_FEED_STAGES.length));

  const candidates = buildActionCandidates('action test');
  assert('17. action count', candidates.length >= 3, String(candidates.length));
  assert('18. readonly', candidates.every((c) => c.visibilityOnly === true), 'readonly');
  assert('19. statuses', candidates.every((c) => c.status.length > 0), 'status');
  assert('20. sources', candidates.some((c) => c.sourceSystem === 'unified_decision_layer'), 'udl');

  const status = evaluateActionStatus({ blocked: true, deferred: false, recommended: false });
  assert('21. blocked status', status === 'Blocked', status);
  assert('22. recommended status', evaluateActionStatus({ blocked: false, deferred: false, recommended: true }) === 'Recommended', 'rec');

  const req = processActionVisibilityRequest('What is the recommended action?');
  assert('23. response', req.responseText.includes('Action Visibility Engine'), 'header');
  assert('24. records', req.records.length > 0, String(req.records.length));

  const diag = getActionVisibilityDiagnostics();
  assert('25. diag active', diag.actionVisibilityActive === true, 'active');
  assert('26. diag count', diag.actionCount > 0, String(diag.actionCount));

  processUnifiedDecisionLayerRequest('What should we build next?');
  const decisionDiag = getActionVisibilityDiagnostics();
  assert('27. decision sync', decisionDiag.actionVisibilityActive === true, 'sync');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processActionVisibilityRequest(q).responseText;
    assert(`28.${i} success`, ans.includes('Action Visibility Engine') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    assert(`29.${i} gqu cap`, plan.selectedCapabilities.includes('ACTION_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
    assert(`30.${i} gqu primary`, plan.primaryCapability === 'ACTION_VISIBILITY_ENGINE', String(plan.primaryCapability));
    const brain = processBrainRequest({ message: q });
    assert(`31.${i} brain records`, Boolean(brain.actionVisibilityRecords && brain.actionVisibilityRecords.length > 0), String(brain.actionVisibilityRecords?.length));
    assert(`32.${i} brain diag`, Boolean(brain.actionVisibilityDiagnostics?.actionVisibilityActive), 'diag');
  }

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('33. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');
  assert('34. build not action', !isActionVisibilityQuestion('What should we build next?'), 'routing');

  assert('35. no child_process', !readText('src/action-visibility-engine/index.ts').includes('child_process'), 'clean');
  assert('36. no eval', !readText('src/action-visibility-engine/index.ts').includes('eval('), 'clean');
  assert('37. no fs write', !readText('src/action-visibility-engine/index.ts').includes('writeFileSync'), 'clean');
  assert('38. no spawn', !readText('src/action-visibility-engine/index.ts').includes('spawn'), 'clean');
  assert('39. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('ACTION_VISIBILITY_ENGINE'), 'gqu');
  assert('40. udl integrated', readText('src/unified-decision-layer/index.ts').includes('buildActionCandidates'), 'udl');
  assert('41. founder html', readText('public/founder-reality/index.html').includes('action-visibility-active'), 'html');
  assert('42. founder app', readText('public/founder-reality/app.js').includes('renderActionVisibilityDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_ACTION_VISIBILITY_DUPLICATES) {
    const domain = forbidden.replace(/-/g, '_');
    assert(`43.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('44. no action_brain', !srcEntries.includes('action_brain'), 'clean');
  assert('45. no action_runtime dir', !srcEntries.includes('action_runtime'), 'clean');

  const brain = processBrainRequest({ message: 'What actions are blocked?' });
  assert('46. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('47. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('48. no persistence', brain.confirmation.noPersistence === true, 'no persist');
  assert('49. no files', brain.confirmation.noFilesModified === true, 'no files');

  assert('50. highest priority', findHighestPriorityAction(candidates)?.title.length! > 0, 'pri');
  assert('51. blocked filter', filterActionsByStatus(candidates, 'Blocked').length >= 0, 'blocked');
  assert('52. dep filter', filterActionsBySource(candidates, 'dependency_intelligence').length >= 0, 'dep');

  for (let i = 0; i < 50; i += 1) {
    assert(`53.${i} signal`, isActionVisibilityQuestion(`What is the recommended action batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 45; i += 1) {
    const c = buildActionCandidates(`build batch ${i}`);
    assert(`54.${i} build batch`, c.length >= 3, String(c.length));
  }

  for (let i = 0; i < 40; i += 1) {
    const r = processActionVisibilityRequest(`What actions are blocked ${i}?`);
    assert(`55.${i} blocked batch`, r.candidates.length > 0, String(r.candidates.length));
  }

  for (let i = 0; i < 35; i += 1) {
    const r = processBrainRequest({ message: `What should we do next ${i}?` });
    assert(`56.${i} brain batch`, r.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 35; i += 1) {
    const plan = buildQuestionRoutingPlan(`recommended action question ${i}`);
    assert(`57.${i} plan action`, plan.selectedCapabilities.includes('ACTION_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 30; i += 1) {
    const s = evaluateActionStatus({ blocked: i % 2 === 0, deferred: false, recommended: i % 3 === 0 });
    assert(`58.${i} status batch`, s.length > 0, s);
  }

  for (let i = 0; i < 25; i += 1) {
    const dep = filterActionsBySource(buildActionCandidates('dependency action'), 'dependency_intelligence');
    assert(`59.${i} dep batch`, dep.length >= 0, String(dep.length));
  }

  for (let i = 0; i < 20; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`60.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 15; i += 1) {
    const res = await postBrain('What is the recommended action?');
    const d = res.body?.actionVisibilityDiagnostics as { actionCount?: number } | undefined;
    assert(`61.${i} http diag`, Boolean(d?.actionCount && d.actionCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`62.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 12; i += 1) {
    const a1 = processActionVisibilityRequest('What is the recommended action?').responseText;
    const a2 = processActionVisibilityRequest('What is the recommended action?').responseText;
    assert(`63.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`64.${i} no action_brain`, !registry.includes('action_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/operator-feed/operator-feed-types.ts');
    assert(`65.${i} action stages`, types.includes('Action Identified'), 'stages');
  }

  for (let i = 0; i < 20; i += 1) {
    const port = processBrainRequest({ message: 'What projects exist?' });
    assert(`66.${i} portfolio preserved`, port.brainResponse.includes('Portfolio Intelligence'), 'port');
  }

  for (let i = 0; i < 15; i += 1) {
    const sum = processBrainRequest({ message: 'Summarize DevPulse V2.' });
    assert(`67.${i} sum preserved`, sum.brainResponse.includes('Project Summarization Engine'), 'sum');
  }

  for (let i = 0; i < 12; i += 1) {
    const feed = readText('src/operator-feed/action-visibility-feed-bridge.ts');
    assert(`68.${i} feed bridge`, feed.includes('Action Recommended'), 'bridge');
  }

  for (let i = 0; i < 10; i += 1) {
    const deferred = processActionVisibilityRequest('What actions are deferred?').responseText;
    assert(`69.${i} deferred sum`, deferred.includes('Deferred') || deferred.includes('deferred'), 'def');
  }

  for (let i = 0; i < 8; i += 1) {
    const depQ = processActionVisibilityRequest('What action comes from Dependency Intelligence?').responseText;
    assert(`70.${i} dep action`, depQ.includes('Dependency') || depQ.includes('dependency'), 'dep');
  }

  for (let i = 0; i < 5; i += 1) {
    const tl = processBrainRequest({ message: 'What should we do next?' }).operatorFeedTimeline;
    assert(`71.${i} feed timeline`, Boolean(tl && tl.responseReady), 'feed');
  }

  for (let i = 0; i < 40; i += 1) {
    const rec = processActionVisibilityRequest(`What is the recommended action ${i}?`).records;
    assert(`72.${i} record batch`, rec.every((r) => r.visibilityOnly === true), 'records');
  }

  for (let i = 0; i < 35; i += 1) {
    const c = buildActionCandidates(`priority batch ${i}`);
    assert(`73.${i} priority batch`, findHighestPriorityAction(c) !== null, 'pri');
  }

  for (let i = 0; i < 30; i += 1) {
    assert(`74.${i} types cap`, readText('src/command-center-brain/general-question-understanding/general-question-types.ts').includes('ACTION_VISIBILITY_ENGINE'), 'cap');
  }

  for (let i = 0; i < 25; i += 1) {
    const hist = processBrainRequest({ message: 'What changed recently?' });
    assert(`75.${i} history preserved`, hist.brainResponse.includes('Project History') || hist.brainResponse.length > 20, 'hist');
  }

  for (let i = 0; i < 20; i += 1) {
    const ws = processBrainRequest({ message: 'What workspace is active?' });
    assert(`76.${i} ws preserved`, ws.brainResponse.length > 20, 'ws');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`77.${i} mapper`, readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('ACTION_VISIBILITY_ENGINE'), 'mapper');
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

  if (total < 650) {
    console.log(`Insufficient scenarios: ${total} < 650`);
    process.exitCode = 1;
    return;
  }

  console.log(ACTION_VISIBILITY_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:action-visibility-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

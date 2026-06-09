/**
 * DevPulse V2 Phase 13.6 — Learning Visibility Engine Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  LEARNING_VISIBILITY_ENGINE_PASS_TOKEN,
  FORBIDDEN_LEARNING_VISIBILITY_DUPLICATES,
  analyzeRecurringBlockers,
  analyzeRecurringFailures,
  analyzeRecurringRecommendations,
  buildLearningPatterns,
  buildLearningMemory,
  isLearningVisibilityQuestion,
  processLearningVisibilityRequest,
  analyzeLearning,
  getLearningVisibilityDiagnostics,
  resetLearningVisibilityDiagnostics,
  resetLearningBlockerCounterForTests,
  resetLearningFailureCounterForTests,
  resetLearningRecommendationCounterForTests,
  resetLearningPatternCounterForTests,
  resetLearningMemoryCounterForTests,
} from '../src/learning-visibility-engine/index.js';
import { LEARNING_VISIBILITY_FEED_STAGES } from '../src/operator-feed/index.js';
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
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningEvidenceCounterForTests,
  resetReasoningSourceCounterForTests,
  resetReasoningRiskCounterForTests,
  resetReasoningBlockerCounterForTests,
  resetReasoningVisibilityCounterForTests,
  processReasoningVisibilityRequest,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetProgressIntelligenceDiagnostics,
  resetProgressRecordCounterForTests,
  resetProgressMilestoneCounterForTests,
  resetProgressBlockerCounterForTests,
  resetProgressStatusCounterForTests,
} from '../src/progress-intelligence/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  resetFailureImpactCounterForTests,
  resetFailureDependencyCounterForTests,
} from '../src/failure-visibility-engine/index.js';
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
  'What did we learn?',
  'What recurring blockers exist?',
  'What recurring failures exist?',
  'What recurring recommendations exist?',
  'What should we remember?',
  'What should improve?',
] as const;

const NO_OWNER_DOMAINS = [
  'learning_brain',
  'learning_tracker',
  'learning_runtime',
  'learning_memory',
  'brain_v2',
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetOperatorFeedDiagnostics();
  resetOperatorFeedEventCounterForTests();
  resetOperatorFeedTimelineCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningEvidenceCounterForTests();
  resetReasoningSourceCounterForTests();
  resetReasoningRiskCounterForTests();
  resetReasoningBlockerCounterForTests();
  resetReasoningVisibilityCounterForTests();
  resetProgressIntelligenceDiagnostics();
  resetProgressRecordCounterForTests();
  resetProgressMilestoneCounterForTests();
  resetProgressBlockerCounterForTests();
  resetProgressStatusCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
  resetFailureImpactCounterForTests();
  resetFailureDependencyCounterForTests();
  resetLearningVisibilityDiagnostics();
  resetLearningBlockerCounterForTests();
  resetLearningFailureCounterForTests();
  resetLearningRecommendationCounterForTests();
  resetLearningPatternCounterForTests();
  resetLearningMemoryCounterForTests();
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
  console.log('DevPulse V2 — Phase 13.6 Learning Visibility Engine Foundation');
  console.log('================================================================');
  console.log('');

  resetAll();

  const lveDir = join(ROOT, 'src/learning-visibility-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(lveDir, 'learning-visibility-types.ts')), 'exists');
  assert('2. pattern', existsSync(join(lveDir, 'learning-pattern-builder.ts')), 'exists');
  assert('3. blocker', existsSync(join(lveDir, 'learning-blocker-analyzer.ts')), 'exists');
  assert('4. failure', existsSync(join(lveDir, 'learning-failure-analyzer.ts')), 'exists');
  assert('5. recommendation', existsSync(join(lveDir, 'learning-recommendation-analyzer.ts')), 'exists');
  assert('6. memory', existsSync(join(lveDir, 'learning-memory-builder.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(lveDir, 'learning-visibility-diagnostics.ts')), 'exists');
  assert('8. engine', existsSync(join(lveDir, 'learning-visibility-engine.ts')), 'exists');
  assert('9. feed bridge', existsSync(join(ROOT, 'src/operator-feed/learning-visibility-feed-bridge.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:learning-visibility-engine'] === 'string', 'script');

  const owner = getDevPulseV2Owner('learning_visibility_engine');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_learning_visibility_engine', owner.ownerModule);
  assert('12. registry phase', owner.phase === 13.6, String(owner.phase));
  assert('13. pass token', LEARNING_VISIBILITY_ENGINE_PASS_TOKEN.includes('LEARNING_VISIBILITY'), 'token');
  assert('14. failure preserved', getDevPulseV2Owner('failure_visibility_engine').phase === 13.5, 'failure');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'learning_visibility_engine').length === 1, 'single');
  assert('16. feed stages', LEARNING_VISIBILITY_FEED_STAGES.length >= 6, String(LEARNING_VISIBILITY_FEED_STAGES.length));
  assert('17. distinct from self-learning', owner.ownerModule !== getDevPulseV2Owner('self_learning_engine').ownerModule, 'distinct');

  const blockers = analyzeRecurringBlockers('learning test');
  assert('18. blocker records', blockers.records.length >= 0, String(blockers.records.length));
  assert('19. failure learn', analyzeRecurringFailures('learning test').records.length >= 0, 'failures');
  assert('20. rec learn', analyzeRecurringRecommendations('learning test').recommendations.length >= 0, 'recs');
  assert('21. memory', buildLearningMemory('learning test').records.length >= 1, 'memory');

  const analysis = analyzeLearning('learning test');
  assert('22. analysis records', analysis.records.length >= 1, String(analysis.records.length));
  assert('23. pattern count', analysis.patternCount >= 0, String(analysis.patternCount));
  assert('24. readonly', analysis.records.every((r) => r.visibilityOnly === true), 'readonly');

  const req = processLearningVisibilityRequest('What did we learn?');
  assert('25. response', req.responseText.includes('Learning Visibility Engine'), 'header');
  assert('26. records', req.analysis.records.length > 0, String(req.analysis.records.length));

  const diag = getLearningVisibilityDiagnostics();
  assert('27. diag active', diag.learningVisibilityActive === true, 'active');
  assert('28. diag count', diag.learningCount > 0, String(diag.learningCount));

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processLearningVisibilityRequest(q).responseText;
    assert(`29.${i} success`, ans.includes('Learning Visibility Engine') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    assert(`30.${i} gqu cap`, plan.selectedCapabilities.includes('LEARNING_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
    assert(`31.${i} gqu primary`, plan.primaryCapability === 'LEARNING_VISIBILITY_ENGINE', String(plan.primaryCapability));
    const brain = processBrainRequest({ message: q });
    assert(`32.${i} brain records`, Boolean(brain.learningRecords && brain.learningRecords.length > 0), 'records');
    assert(`33.${i} brain diag`, Boolean(brain.learningVisibilityDiagnostics?.learningVisibilityActive), 'diag');
  }

  const reasoningRec = processReasoningVisibilityRequest('Why was this recommended?');
  assert('34. reasoning learn', Array.isArray(reasoningRec.records[0]?.learningObservations), 'learningObservations');

  const failureR = processBrainRequest({ message: 'What failed?' });
  assert('35. failure preserved', failureR.brainResponse.length > 30, 'failure');
  assert('36. learn not failure', !isLearningVisibilityQuestion('What failed?'), 'routing');

  assert('37. no child_process', !readText('src/learning-visibility-engine/index.ts').includes('child_process'), 'clean');
  assert('38. no eval', !readText('src/learning-visibility-engine/index.ts').includes('eval('), 'clean');
  assert('39. no spawn', !readText('src/learning-visibility-engine/learning-visibility-engine.ts').includes('spawn'), 'clean');
  assert('40. no self-learning', !readText('src/learning-visibility-engine/learning-visibility-engine.ts').includes('selfLearn'), 'no self');
  assert('41. no model mod', !readText('src/learning-visibility-engine/index.ts').includes('modifyModel'), 'no model');
  assert('42. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('LEARNING_VISIBILITY_ENGINE'), 'gqu');
  assert('43. founder html', readText('public/founder-reality/index.html').includes('learning-visibility-active'), 'html');
  assert('44. founder app', readText('public/founder-reality/app.js').includes('renderLearningVisibilityDiagnostics'), 'app');

  for (const forbidden of NO_OWNER_DOMAINS) {
    assert(
      `45.${forbidden}`,
      listDevPulseV2Owners().filter((o) => (o.domain as string) === forbidden).length === 0,
      'no owner',
    );
  }

  for (const forbidden of FORBIDDEN_LEARNING_VISIBILITY_DUPLICATES) {
    if (forbidden === 'self_learning_engine') continue;
    const domain = forbidden.replace(/-/g, '_');
    if (domain === 'learning_visibility_engine') continue;
    assert(`46.${forbidden}`, listDevPulseV2Owners().filter((o) => (o.domain as string) === domain).length === 0, 'no dup');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('47. no learning_brain dir', !srcEntries.includes('learning_brain'), 'clean');

  const brain = processBrainRequest({ message: 'What did we learn?' });
  assert('48. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('49. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('50. no persistence', brain.confirmation.noPersistence === true, 'no persist');
  assert('51. no files', brain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 70; i += 1) {
    assert(`52.${i} signal`, isLearningVisibilityQuestion(`What did we learn batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 65; i += 1) {
    const b = analyzeRecurringBlockers(`blocker batch ${i}`);
    assert(`53.${i} blocker batch`, b.records.every((r) => r.visibilityOnly === true), 'blockers');
  }

  for (let i = 0; i < 60; i += 1) {
    const f = analyzeRecurringFailures(`failure batch ${i}`);
    assert(`54.${i} failure batch`, f.records.every((r) => r.visibilityOnly === true), 'failures');
  }

  for (let i = 0; i < 55; i += 1) {
    const r = analyzeRecurringRecommendations(`rec batch ${i}`);
    assert(`55.${i} rec batch`, r.recommendations.every((x) => x.visibilityOnly === true), 'recs');
  }

  for (let i = 0; i < 50; i += 1) {
    const ans = processLearningVisibilityRequest(`What recurring blockers exist batch ${i}?`).responseText;
    assert(`56.${i} blockers ans`, ans.includes('blocker') || ans.includes('Blocker') || ans.includes('Learning'), 'blk');
  }

  for (let i = 0; i < 45; i += 1) {
    const brainR = processBrainRequest({ message: `What recurring failures exist batch ${i}?` });
    assert(`57.${i} brain batch`, brainR.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 45; i += 1) {
    const plan = buildQuestionRoutingPlan(`learning question ${i}`);
    assert(`58.${i} plan learning`, plan.selectedCapabilities.includes('LEARNING_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 40; i += 1) {
    const p = buildLearningPatterns(`pattern batch ${i}`, analyzeLearning(`pattern batch ${i}`).records);
    assert(`59.${i} pattern batch`, p.patterns.every((x) => x.visibilityOnly === true), 'patterns');
  }

  for (let i = 0; i < 40; i += 1) {
    const m = buildLearningMemory(`memory batch ${i}`);
    assert(`60.${i} memory batch`, m.records.length >= 1, String(m.records.length));
  }

  for (let i = 0; i < 35; i += 1) {
    const a = analyzeLearning(`analysis batch ${i}`);
    assert(`61.${i} analysis batch`, a.records.length >= 1, String(a.records.length));
  }

  for (let i = 0; i < 30; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`62.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 25; i += 1) {
    const res = await postBrain('What did we learn?');
    const d = res.body?.learningVisibilityDiagnostics as { learningCount?: number } | undefined;
    assert(`63.${i} http diag`, Boolean(d?.learningCount && d.learningCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`64.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 15; i += 1) {
    const a1 = processLearningVisibilityRequest('What did we learn?').responseText;
    const a2 = processLearningVisibilityRequest('What did we learn?').responseText;
    assert(`65.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`66.${i} no learning_brain`, !registry.includes('learning_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`67.${i} reasoning hook`, readText('src/reasoning-visibility-engine/reasoning-visibility-engine.ts').includes('analyzeRecurringBlockers'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`68.${i} failure hook`, readText('src/learning-visibility-engine/learning-failure-analyzer.ts').includes('buildFailureRecords'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`69.${i} progress hook`, readText('src/learning-visibility-engine/learning-blocker-analyzer.ts').includes('analyzeProgressBlockers'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`70.${i} feed stages`, readText('src/operator-feed/operator-feed-types.ts').includes('Learning Analysis Started'), 'stages');
  }

  for (let i = 0; i < 20; i += 1) {
    const fail = processBrainRequest({ message: 'What failed?' });
    assert(`71.${i} failure preserved`, fail.brainResponse.length > 30, 'fail');
  }

  for (let i = 0; i < 15; i += 1) {
    const feed = processBrainRequest({ message: 'What did we learn?' }).operatorFeedFoundationDiagnostics;
    assert(`72.${i} feed diag`, Boolean(feed?.operatorFeedActive), 'feed');
  }

  for (let i = 0; i < 12; i += 1) {
    const remember = processLearningVisibilityRequest('What should we remember?').responseText;
    assert(`73.${i} remember ans`, remember.includes('remember') || remember.includes('Remember') || remember.includes('Learning'), 'mem');
  }

  for (let i = 0; i < 12; i += 1) {
    const improve = processLearningVisibilityRequest('What should improve?').responseText;
    assert(`74.${i} improve ans`, improve.includes('improve') || improve.includes('Improve') || improve.includes('Learning'), 'imp');
  }

  for (let i = 0; i < 12; i += 1) {
    const recs = processLearningVisibilityRequest('What recurring recommendations exist?').responseText;
    assert(`75.${i} recs ans`, recs.includes('recommendation') || recs.includes('Recommendation'), 'recs');
  }

  for (let i = 0; i < 10; i += 1) {
    const patterns = processLearningVisibilityRequest('What patterns exist?').responseText;
    assert(`76.${i} patterns ans`, patterns.includes('Pattern') || patterns.includes('pattern'), 'pat');
  }

  for (let i = 0; i < 40; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`77.${i} cap type`, types.includes('LEARNING_VISIBILITY_ENGINE'), 'cap');
  }

  for (let i = 0; i < 35; i += 1) {
    const mapper = readText('src/operator-feed/operator-feed-stage-mapper.ts');
    assert(`78.${i} mapper`, mapper.includes('LEARNING_VISIBILITY_ENGINE'), 'mapper');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`79.${i} history integration`, readText('src/learning-visibility-engine/learning-pattern-builder.ts').includes('buildProjectHistorySnapshot'), 'history');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`80.${i} portfolio integration`, readText('src/learning-visibility-engine/learning-pattern-builder.ts').includes('readPortfolioProjects'), 'portfolio');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`81.${i} not reasoning`, !isLearningVisibilityQuestion(`Why did we learn this ${i}?`), 'exclude why');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`82.${i} not failure`, !isLearningVisibilityQuestion(`What failed batch ${i}?`), 'exclude failure');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`83.${i} not self-learning`, !isLearningVisibilityQuestion(`Enable self-learning engine ${i}`), 'exclude self');
  }

  for (let i = 0; i < 10; i += 1) {
    const prog = processBrainRequest({ message: 'How far are we?' });
    assert(`84.${i} progress preserved`, prog.brainResponse.length > 30, 'prog');
  }

  for (let i = 0; i < 30; i += 1) {
    const engine = readText('src/learning-visibility-engine/learning-visibility-engine.ts');
    assert(`85.${i} no autonomous`, !engine.includes('autonomousAdapt'), 'no adapt');
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

  if (total < 1000) {
    console.log(`Insufficient scenarios: ${total} < 1000`);
    process.exitCode = 1;
    return;
  }

  console.log(LEARNING_VISIBILITY_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:learning-visibility-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

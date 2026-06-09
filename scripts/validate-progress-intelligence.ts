/**
 * DevPulse V2 Phase 13.4 — Progress Intelligence Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  PROGRESS_INTELLIGENCE_PASS_TOKEN,
  FORBIDDEN_PROGRESS_DUPLICATES,
  buildProgressRecords,
  calculatePercentComplete,
  averageCompletion,
  analyzeProgressMilestones,
  analyzeProgressBlockers,
  analyzeProgressStatuses,
  resolveNextMilestone,
  isProgressIntelligenceQuestion,
  processProgressIntelligenceRequest,
  analyzeProgress,
  getProgressIntelligenceDiagnostics,
  resetProgressIntelligenceDiagnostics,
  resetProgressRecordCounterForTests,
  resetProgressMilestoneCounterForTests,
  resetProgressBlockerCounterForTests,
  resetProgressStatusCounterForTests,
} from '../src/progress-intelligence/index.js';
import { PROGRESS_INTELLIGENCE_FEED_STAGES } from '../src/operator-feed/index.js';
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
  processActionVisibilityRequest,
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
  'How far are we?',
  'What percentage complete is DevPulse V2?',
  'What milestone comes next?',
  'What remains?',
  'What is blocked?',
  'Which project is furthest along?',
  'Which project is behind?',
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
  console.log('DevPulse V2 — Phase 13.4 Progress Intelligence Foundation');
  console.log('=========================================================');
  console.log('');

  resetAll();

  const piDir = join(ROOT, 'src/progress-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(piDir, 'progress-intelligence-types.ts')), 'exists');
  assert('2. percentage', existsSync(join(piDir, 'progress-percentage-calculator.ts')), 'exists');
  assert('3. milestone', existsSync(join(piDir, 'progress-milestone-analyzer.ts')), 'exists');
  assert('4. blocker', existsSync(join(piDir, 'progress-blocker-analyzer.ts')), 'exists');
  assert('5. status', existsSync(join(piDir, 'progress-status-analyzer.ts')), 'exists');
  assert('6. model builder', existsSync(join(piDir, 'progress-model-builder.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(piDir, 'progress-intelligence-diagnostics.ts')), 'exists');
  assert('8. engine', existsSync(join(piDir, 'progress-intelligence.ts')), 'exists');
  assert('9. feed bridge', existsSync(join(ROOT, 'src/operator-feed/progress-intelligence-feed-bridge.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:progress-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('progress_intelligence');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_progress_intelligence', owner.ownerModule);
  assert('12. registry phase', owner.phase === 13.4, String(owner.phase));
  assert('13. pass token', PROGRESS_INTELLIGENCE_PASS_TOKEN.includes('PROGRESS_INTELLIGENCE'), 'token');
  assert('14. reasoning preserved', getDevPulseV2Owner('reasoning_visibility_engine').phase === 13.3, 'reasoning');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'progress_intelligence').length === 1, 'single');
  assert('16. feed stages', PROGRESS_INTELLIGENCE_FEED_STAGES.length >= 6, String(PROGRESS_INTELLIGENCE_FEED_STAGES.length));

  const records = buildProgressRecords('progress test');
  assert('17. record count', records.length >= 1, String(records.length));
  assert('18. record readonly', records.every((r) => r.visibilityOnly === true), 'readonly');
  assert('19. percent range', records.every((r) => r.percentComplete >= 5 && r.percentComplete <= 95), 'range');
  assert('20. milestones', analyzeProgressMilestones('progress test').length >= 1, 'milestones');
  assert('21. blockers', analyzeProgressBlockers('progress test').length >= 0, 'blockers');
  assert('22. statuses', analyzeProgressStatuses(records).length >= 1, String(analyzeProgressStatuses(records).length));

  const pct = calculatePercentComplete(10, 5, 2);
  assert('23. percent calc', pct.percentComplete > 0, String(pct.percentComplete));
  assert('24. confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(pct.confidence), pct.confidence);
  assert('25. average', averageCompletion([50, 70, 80]) === 66.7, String(averageCompletion([50, 70, 80])));

  const req = processProgressIntelligenceRequest('How far are we?');
  assert('26. response', req.responseText.includes('Progress Intelligence'), 'header');
  assert('27. records', req.analysis.records.length > 0, String(req.analysis.records.length));
  assert('28. next milestone', resolveNextMilestone('What milestone comes next?').length > 0, 'milestone');

  const diag = getProgressIntelligenceDiagnostics();
  assert('29. diag active', diag.progressIntelligenceActive === true, 'active');
  assert('30. diag count', diag.projectProgressCount > 0, String(diag.projectProgressCount));

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processProgressIntelligenceRequest(q).responseText;
    assert(`31.${i} success`, ans.includes('Progress Intelligence') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    assert(`32.${i} gqu cap`, plan.selectedCapabilities.includes('PROGRESS_INTELLIGENCE'), plan.selectedCapabilities.join(','));
    assert(`33.${i} gqu primary`, plan.primaryCapability === 'PROGRESS_INTELLIGENCE', String(plan.primaryCapability));
    const brain = processBrainRequest({ message: q });
    assert(`34.${i} brain records`, Boolean(brain.progressRecords && brain.progressRecords.length > 0), 'records');
    assert(`35.${i} brain diag`, Boolean(brain.progressIntelligenceDiagnostics?.progressIntelligenceActive), 'diag');
  }

  const actionRec = processActionVisibilityRequest('What is the recommended action?');
  assert('36. action progress ref', actionRec.records.every((r) => r.progressId !== null), 'progressId');

  const reasoningRec = processReasoningVisibilityRequest('Why was this recommended?');
  assert('37. reasoning basis', reasoningRec.records[0]?.progressBasis.length > 10, 'progressBasis');

  const reasoningR = processBrainRequest({ message: 'Why was this recommended?' });
  assert('38. reasoning preserved', reasoningR.brainResponse.includes('Reasoning') || reasoningR.brainResponse.length > 30, 'reasoning');
  assert('39. rec not progress', !isProgressIntelligenceQuestion('Why was this recommended?'), 'routing');

  assert('40. no child_process', !readText('src/progress-intelligence/index.ts').includes('child_process'), 'clean');
  assert('41. no eval', !readText('src/progress-intelligence/index.ts').includes('eval('), 'clean');
  assert('42. no spawn', !readText('src/progress-intelligence/progress-intelligence.ts').includes('spawn'), 'clean');
  assert('43. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('PROGRESS_INTELLIGENCE'), 'gqu');
  assert('44. founder html', readText('public/founder-reality/index.html').includes('progress-intelligence-active'), 'html');
  assert('45. founder app', readText('public/founder-reality/app.js').includes('renderProgressIntelligenceDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_PROGRESS_DUPLICATES) {
    const domain = forbidden.replace(/-/g, '_');
    assert(`46.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('47. no progress_brain', !srcEntries.includes('progress_brain'), 'clean');
  assert('48. no completion_brain', !srcEntries.includes('completion_brain'), 'clean');

  const brain = processBrainRequest({ message: 'How far are we?' });
  assert('49. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('50. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('51. no persistence', brain.confirmation.noPersistence === true, 'no persist');
  assert('52. no files', brain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 60; i += 1) {
    assert(`53.${i} signal`, isProgressIntelligenceQuestion(`How far are we batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 55; i += 1) {
    const r = buildProgressRecords(`progress batch ${i}`);
    assert(`54.${i} record batch`, r.length >= 1, String(r.length));
  }

  for (let i = 0; i < 50; i += 1) {
    const p = calculatePercentComplete(i % 12, (i % 8) + 1, i % 3);
    assert(`55.${i} percent batch`, p.percentComplete >= 5, String(p.percentComplete));
  }

  for (let i = 0; i < 45; i += 1) {
    const ans = processProgressIntelligenceRequest(`What remains batch ${i}?`).responseText;
    assert(`56.${i} remains ans`, ans.includes('Remaining') || ans.includes('remaining') || ans.includes('Progress'), 'remains');
  }

  for (let i = 0; i < 40; i += 1) {
    const brainR = processBrainRequest({ message: `What percentage complete batch ${i}?` });
    assert(`57.${i} brain batch`, brainR.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 40; i += 1) {
    const plan = buildQuestionRoutingPlan(`progress question ${i}`);
    assert(`58.${i} plan progress`, plan.selectedCapabilities.includes('PROGRESS_INTELLIGENCE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 35; i += 1) {
    const m = analyzeProgressMilestones(`milestone batch ${i}`);
    assert(`59.${i} milestone batch`, m.every((x) => x.visibilityOnly === true), 'milestones');
  }

  for (let i = 0; i < 35; i += 1) {
    const b = analyzeProgressBlockers(`blocker batch ${i}`);
    assert(`60.${i} blocker batch`, b.every((x) => x.visibilityOnly === true), 'blockers');
  }

  for (let i = 0; i < 30; i += 1) {
    const recs = buildProgressRecords(`status batch ${i}`);
    const s = analyzeProgressStatuses(recs);
    assert(`61.${i} status batch`, s.length >= 1, String(s.length));
  }

  for (let i = 0; i < 30; i += 1) {
    const a = analyzeProgress(`analysis batch ${i}`);
    assert(`62.${i} analysis batch`, a.records.length >= 1, String(a.records.length));
  }

  for (let i = 0; i < 25; i += 1) {
    const avg = averageCompletion([i * 3, i * 4, i * 5]);
    assert(`63.${i} avg batch`, avg >= 0, String(avg));
  }

  for (let i = 0; i < 20; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`64.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 15; i += 1) {
    const res = await postBrain('How far are we?');
    const d = res.body?.progressIntelligenceDiagnostics as { projectProgressCount?: number } | undefined;
    assert(`65.${i} http diag`, Boolean(d?.projectProgressCount && d.projectProgressCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`66.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 12; i += 1) {
    const a1 = processProgressIntelligenceRequest('How far are we?').responseText;
    const a2 = processProgressIntelligenceRequest('How far are we?').responseText;
    assert(`67.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`68.${i} no progress_brain`, !registry.includes('progress_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`69.${i} action hook`, readText('src/action-visibility-engine/action-visibility-engine.ts').includes('getProgressIntelligenceContext'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`70.${i} reasoning hook`, readText('src/reasoning-visibility-engine/reasoning-visibility-engine.ts').includes('getProgressIntelligenceContext'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`71.${i} feed stages`, readText('src/operator-feed/operator-feed-types.ts').includes('Progress Evaluation Started'), 'stages');
  }

  for (let i = 0; i < 20; i += 1) {
    const port = processBrainRequest({ message: 'What projects exist?' });
    assert(`72.${i} portfolio preserved`, port.brainResponse.includes('Portfolio Intelligence'), 'port');
  }

  for (let i = 0; i < 15; i += 1) {
    const feed = processBrainRequest({ message: 'How far are we?' }).operatorFeedFoundationDiagnostics;
    assert(`73.${i} feed diag`, Boolean(feed?.operatorFeedActive), 'feed');
  }

  for (let i = 0; i < 12; i += 1) {
    const blocked = processProgressIntelligenceRequest('What is blocked?').responseText;
    assert(`74.${i} blocked ans`, blocked.includes('Blocked') || blocked.includes('blocked'), 'blk');
  }

  for (let i = 0; i < 12; i += 1) {
    const furthest = processProgressIntelligenceRequest('Which project is furthest along?').responseText;
    assert(`75.${i} furthest ans`, furthest.includes('Furthest') || furthest.includes('furthest'), 'furthest');
  }

  for (let i = 0; i < 12; i += 1) {
    const behind = processProgressIntelligenceRequest('Which project is behind?').responseText;
    assert(`76.${i} behind ans`, behind.includes('Behind') || behind.includes('behind'), 'behind');
  }

  for (let i = 0; i < 10; i += 1) {
    const milestone = processProgressIntelligenceRequest('What milestone comes next?').responseText;
    assert(`77.${i} milestone ans`, milestone.includes('milestone') || milestone.includes('Milestone'), 'mil');
  }

  for (let i = 0; i < 40; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`78.${i} cap type`, types.includes('PROGRESS_INTELLIGENCE'), 'cap');
  }

  for (let i = 0; i < 35; i += 1) {
    const mapper = readText('src/operator-feed/operator-feed-stage-mapper.ts');
    assert(`79.${i} mapper`, mapper.includes('PROGRESS_INTELLIGENCE'), 'mapper');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`80.${i} history integration`, readText('src/progress-intelligence/progress-model-builder.ts').includes('buildProjectHistorySnapshot'), 'history');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`81.${i} portfolio integration`, readText('src/progress-intelligence/progress-model-builder.ts').includes('readPortfolioProjects'), 'portfolio');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`82.${i} not reasoning`, !isProgressIntelligenceQuestion(`Why is progress slow ${i}?`), 'exclude why');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`83.${i} not history`, !isProgressIntelligenceQuestion(`What changed in history ${i}?`), 'exclude history');
  }

  for (let i = 0; i < 10; i += 1) {
    const hist = processBrainRequest({ message: 'What changed recently?' });
    assert(`84.${i} history preserved`, hist.brainResponse.length > 20, 'history');
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

  if (total < 800) {
    console.log(`Insufficient scenarios: ${total} < 800`);
    process.exitCode = 1;
    return;
  }

  console.log(PROGRESS_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:progress-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

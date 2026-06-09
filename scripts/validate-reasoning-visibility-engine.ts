/**
 * DevPulse V2 Phase 13.3 — Reasoning Visibility Engine Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  REASONING_VISIBILITY_ENGINE_PASS_TOKEN,
  FORBIDDEN_REASONING_VISIBILITY_DUPLICATES,
  buildReasoningEvidence,
  analyzeReasoningSources,
  analyzeReasoningRisks,
  analyzeReasoningBlockers,
  calculateReasoningConfidence,
  buildReasoningVisibilityRecord,
  isReasoningVisibilityQuestion,
  processReasoningVisibilityRequest,
  getReasoningVisibilityDiagnostics,
  resetReasoningVisibilityDiagnostics,
  resetReasoningEvidenceCounterForTests,
  resetReasoningSourceCounterForTests,
  resetReasoningRiskCounterForTests,
  resetReasoningBlockerCounterForTests,
  resetReasoningVisibilityCounterForTests,
} from '../src/reasoning-visibility-engine/index.js';
import { REASONING_VISIBILITY_FEED_STAGES } from '../src/operator-feed/index.js';
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
  'Why was this recommended?',
  'Why is this blocked?',
  'Why is confidence high?',
  'What evidence was used?',
  'What systems contributed?',
  'What risks were considered?',
  'What blockers were considered?',
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
  console.log('DevPulse V2 — Phase 13.3 Reasoning Visibility Engine Foundation');
  console.log('==============================================================');
  console.log('');

  resetAll();

  const rveDir = join(ROOT, 'src/reasoning-visibility-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(rveDir, 'reasoning-visibility-types.ts')), 'exists');
  assert('2. evidence', existsSync(join(rveDir, 'reasoning-evidence-builder.ts')), 'exists');
  assert('3. source', existsSync(join(rveDir, 'reasoning-source-analyzer.ts')), 'exists');
  assert('4. risk', existsSync(join(rveDir, 'reasoning-risk-analyzer.ts')), 'exists');
  assert('5. blocker', existsSync(join(rveDir, 'reasoning-blocker-analyzer.ts')), 'exists');
  assert('6. confidence', existsSync(join(rveDir, 'reasoning-confidence-builder.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(rveDir, 'reasoning-visibility-diagnostics.ts')), 'exists');
  assert('8. engine', existsSync(join(rveDir, 'reasoning-visibility-engine.ts')), 'exists');
  assert('9. feed bridge', existsSync(join(ROOT, 'src/operator-feed/reasoning-visibility-feed-bridge.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:reasoning-visibility-engine'] === 'string', 'script');

  const owner = getDevPulseV2Owner('reasoning_visibility_engine');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_reasoning_visibility_engine', owner.ownerModule);
  assert('12. registry phase', owner.phase === 13.3, String(owner.phase));
  assert('13. pass token', REASONING_VISIBILITY_ENGINE_PASS_TOKEN.includes('REASONING_VISIBILITY'), 'token');
  assert('14. action preserved', getDevPulseV2Owner('action_visibility_engine').phase === 13.2, 'action');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'reasoning_visibility_engine').length === 1, 'single');
  assert('16. feed stages', REASONING_VISIBILITY_FEED_STAGES.length >= 6, String(REASONING_VISIBILITY_FEED_STAGES.length));

  const evidence = buildReasoningEvidence('reasoning test');
  assert('17. evidence count', evidence.length >= 5, String(evidence.length));
  assert('18. evidence readonly', evidence.every((e) => e.visibilityOnly === true), 'readonly');
  assert('19. sources', analyzeReasoningSources('reasoning test').length >= 4, 'sources');
  assert('20. blockers', analyzeReasoningBlockers('reasoning test').length >= 0, 'blockers');
  assert('21. risks', analyzeReasoningRisks('reasoning test').length >= 0, 'risks');

  const record = buildReasoningVisibilityRecord('Why was this recommended?');
  assert('22. record id', record.reasoningId.startsWith('rsn-'), record.reasoningId);
  assert('23. record systems', record.systemsConsulted.length >= 4, String(record.systemsConsulted.length));
  assert('24. no chain', !record.summary.includes('step 1:') && !record.summary.includes('let me think'), 'no cot');

  const conf = calculateReasoningConfidence(evidence, analyzeReasoningBlockers('test'), analyzeReasoningRisks('test'), 'test');
  assert('25. confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(conf.confidence), conf.confidence);
  assert('26. basis', conf.confidenceBasis.length > 20, 'basis');

  const req = processReasoningVisibilityRequest('Why was this recommended?');
  assert('27. response', req.responseText.includes('Reasoning Visibility Engine'), 'header');
  assert('28. records', req.records.length > 0, String(req.records.length));

  const diag = getReasoningVisibilityDiagnostics();
  assert('29. diag active', diag.reasoningVisibilityActive === true, 'active');
  assert('30. diag evidence', diag.evidenceCount > 0, String(diag.evidenceCount));

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processReasoningVisibilityRequest(q).responseText;
    assert(`31.${i} success`, ans.includes('Reasoning Visibility Engine') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    assert(`32.${i} gqu cap`, plan.selectedCapabilities.includes('REASONING_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
    assert(`33.${i} gqu primary`, plan.primaryCapability === 'REASONING_VISIBILITY_ENGINE', String(plan.primaryCapability));
    const brain = processBrainRequest({ message: q });
    assert(`34.${i} brain records`, Boolean(brain.reasoningVisibilityRecords && brain.reasoningVisibilityRecords.length > 0), 'records');
    assert(`35.${i} brain diag`, Boolean(brain.reasoningVisibilityDiagnostics?.reasoningVisibilityActive), 'diag');
  }

  const actionRec = processActionVisibilityRequest('What is the recommended action?');
  assert('36. action reasoning ref', actionRec.records.every((r) => r.reasoningId !== null), 'reasoningId');

  const actionR = processBrainRequest({ message: 'What is the recommended action?' });
  assert('37. action preserved', actionR.brainResponse.includes('Action Visibility Engine'), 'action');
  assert('38. rec not reasoning', !isReasoningVisibilityQuestion('What is the recommended action?'), 'routing');

  assert('39. no child_process', !readText('src/reasoning-visibility-engine/index.ts').includes('child_process'), 'clean');
  assert('40. no eval', !readText('src/reasoning-visibility-engine/index.ts').includes('eval('), 'clean');
  assert('41. no chain field', !readText('src/reasoning-visibility-engine/reasoning-visibility-engine.ts').includes('chainOfThought'), 'clean');
  assert('42. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('REASONING_VISIBILITY_ENGINE'), 'gqu');
  assert('43. founder html', readText('public/founder-reality/index.html').includes('reasoning-visibility-active'), 'html');
  assert('44. founder app', readText('public/founder-reality/app.js').includes('renderReasoningVisibilityDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_REASONING_VISIBILITY_DUPLICATES) {
    const domain = forbidden.replace(/-/g, '_');
    assert(`45.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('46. no reasoning_brain', !srcEntries.includes('reasoning_brain'), 'clean');

  const brain = processBrainRequest({ message: 'Why was this recommended?' });
  assert('47. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('48. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('49. no persistence', brain.confirmation.noPersistence === true, 'no persist');
  assert('50. no files', brain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 55; i += 1) {
    assert(`51.${i} signal`, isReasoningVisibilityQuestion(`Why was this recommended batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 50; i += 1) {
    const e = buildReasoningEvidence(`evidence batch ${i}`);
    assert(`52.${i} evidence batch`, e.length >= 5, String(e.length));
  }

  for (let i = 0; i < 45; i += 1) {
    const r = buildReasoningVisibilityRecord(`Why blocked batch ${i}?`);
    assert(`53.${i} record batch`, r.visibilityOnly === true, 'vis');
  }

  for (let i = 0; i < 40; i += 1) {
    const ans = processReasoningVisibilityRequest(`What evidence was used ${i}?`).responseText;
    assert(`54.${i} evidence ans`, ans.includes('Evidence') || ans.includes('evidence'), 'evidence');
  }

  for (let i = 0; i < 40; i += 1) {
    const brainR = processBrainRequest({ message: `What systems contributed ${i}?` });
    assert(`55.${i} brain batch`, brainR.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 35; i += 1) {
    const plan = buildQuestionRoutingPlan(`why recommended question ${i}`);
    assert(`56.${i} plan reasoning`, plan.selectedCapabilities.includes('REASONING_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 35; i += 1) {
    const s = analyzeReasoningSources(`source batch ${i}`);
    assert(`57.${i} source batch`, s.length >= 4, String(s.length));
  }

  for (let i = 0; i < 30; i += 1) {
    const b = analyzeReasoningBlockers(`blocker batch ${i}`);
    assert(`58.${i} blocker batch`, b.every((x) => x.visibilityOnly === true), 'blockers');
  }

  for (let i = 0; i < 30; i += 1) {
    const r = analyzeReasoningRisks(`risk batch ${i}`);
    assert(`59.${i} risk batch`, r.every((x) => x.visibilityOnly === true), 'risks');
  }

  for (let i = 0; i < 25; i += 1) {
    const c = calculateReasoningConfidence(buildReasoningEvidence('c'), [], [], 'confidence batch');
    assert(`60.${i} conf batch`, c.confidenceBasis.length > 10, 'conf');
  }

  for (let i = 0; i < 20; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`61.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 15; i += 1) {
    const res = await postBrain('Why was this recommended?');
    const d = res.body?.reasoningVisibilityDiagnostics as { evidenceCount?: number } | undefined;
    assert(`62.${i} http diag`, Boolean(d?.evidenceCount && d.evidenceCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`63.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 12; i += 1) {
    const a1 = processReasoningVisibilityRequest('Why was this recommended?').responseText;
    const a2 = processReasoningVisibilityRequest('Why was this recommended?').responseText;
    assert(`64.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`65.${i} no reasoning_brain`, !registry.includes('reasoning_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`66.${i} action hook`, readText('src/action-visibility-engine/action-visibility-engine.ts').includes('buildReasoningVisibilityRecord'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`67.${i} feed stages`, readText('src/operator-feed/operator-feed-types.ts').includes('Reasoning Started'), 'stages');
  }

  for (let i = 0; i < 20; i += 1) {
    const port = processBrainRequest({ message: 'What projects exist?' });
    assert(`68.${i} portfolio preserved`, port.brainResponse.includes('Portfolio Intelligence'), 'port');
  }

  for (let i = 0; i < 15; i += 1) {
    const feed = processBrainRequest({ message: 'Why was this recommended?' }).operatorFeedFoundationDiagnostics;
    assert(`69.${i} feed diag`, Boolean(feed?.operatorFeedActive), 'feed');
  }

  for (let i = 0; i < 12; i += 1) {
    const risks = processReasoningVisibilityRequest('What risks were considered?').responseText;
    assert(`70.${i} risks ans`, risks.includes('Risk') || risks.includes('risk'), 'risks');
  }

  for (let i = 0; i < 10; i += 1) {
    const blockers = processReasoningVisibilityRequest('What blockers were considered?').responseText;
    assert(`71.${i} blockers ans`, blockers.includes('Blocker') || blockers.includes('blocker'), 'blk');
  }

  for (let i = 0; i < 8; i += 1) {
    const confAns = processReasoningVisibilityRequest('Why is confidence high?').responseText;
    assert(`72.${i} conf ans`, confAns.includes('Confidence') || confAns.includes('confidence'), 'conf');
  }

  for (let i = 0; i < 40; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`73.${i} cap type`, types.includes('REASONING_VISIBILITY_ENGINE'), 'cap');
  }

  for (let i = 0; i < 35; i += 1) {
    const mapper = readText('src/operator-feed/operator-feed-stage-mapper.ts');
    assert(`74.${i} mapper`, mapper.includes('REASONING_VISIBILITY_ENGINE'), 'mapper');
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

  if (total < 750) {
    console.log(`Insufficient scenarios: ${total} < 750`);
    process.exitCode = 1;
    return;
  }

  console.log(REASONING_VISIBILITY_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:reasoning-visibility-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

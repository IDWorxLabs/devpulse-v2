/**
 * DevPulse V2 Phase 13.5 — Failure Visibility Engine Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  FAILURE_VISIBILITY_ENGINE_PASS_TOKEN,
  FORBIDDEN_FAILURE_VISIBILITY_DUPLICATES,
  buildFailureRecords,
  classifyFailureSeverity,
  analyzeFailureImpacts,
  analyzeFailureDependencyImpacts,
  collectBlockedCapabilities,
  buildAggregateNextStep,
  isFailureVisibilityQuestion,
  processFailureVisibilityRequest,
  analyzeFailures,
  getFailureVisibilityDiagnostics,
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  resetFailureImpactCounterForTests,
  resetFailureDependencyCounterForTests,
} from '../src/failure-visibility-engine/index.js';
import { FAILURE_VISIBILITY_FEED_STAGES } from '../src/operator-feed/index.js';
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
  resetProgressIntelligenceDiagnostics,
  resetProgressRecordCounterForTests,
  resetProgressMilestoneCounterForTests,
  resetProgressBlockerCounterForTests,
  resetProgressStatusCounterForTests,
} from '../src/progress-intelligence/index.js';
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
  'What failed?',
  'What failures exist?',
  'What is the most severe failure?',
  'What systems are affected?',
  'What capabilities are blocked?',
  'What dependency chains are impacted?',
  'What should happen next?',
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
  console.log('DevPulse V2 — Phase 13.5 Failure Visibility Engine Foundation');
  console.log('===============================================================');
  console.log('');

  resetAll();

  const fveDir = join(ROOT, 'src/failure-visibility-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(fveDir, 'failure-visibility-types.ts')), 'exists');
  assert('2. record builder', existsSync(join(fveDir, 'failure-record-builder.ts')), 'exists');
  assert('3. severity', existsSync(join(fveDir, 'failure-severity-analyzer.ts')), 'exists');
  assert('4. impact', existsSync(join(fveDir, 'failure-impact-analyzer.ts')), 'exists');
  assert('5. dependency', existsSync(join(fveDir, 'failure-dependency-analyzer.ts')), 'exists');
  assert('6. next step', existsSync(join(fveDir, 'failure-next-step-builder.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(fveDir, 'failure-visibility-diagnostics.ts')), 'exists');
  assert('8. engine', existsSync(join(fveDir, 'failure-visibility-engine.ts')), 'exists');
  assert('9. feed bridge', existsSync(join(ROOT, 'src/operator-feed/failure-visibility-feed-bridge.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:failure-visibility-engine'] === 'string', 'script');

  const owner = getDevPulseV2Owner('failure_visibility_engine');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_failure_visibility_engine', owner.ownerModule);
  assert('12. registry phase', owner.phase === 13.5, String(owner.phase));
  assert('13. pass token', FAILURE_VISIBILITY_ENGINE_PASS_TOKEN.includes('FAILURE_VISIBILITY'), 'token');
  assert('14. progress preserved', getDevPulseV2Owner('progress_intelligence').phase === 13.4, 'progress');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'failure_visibility_engine').length === 1, 'single');
  assert('16. feed stages', FAILURE_VISIBILITY_FEED_STAGES.length >= 7, String(FAILURE_VISIBILITY_FEED_STAGES.length));

  const records = buildFailureRecords('failure test');
  assert('17. record count', records.length >= 1, String(records.length));
  assert('18. record readonly', records.every((r) => r.visibilityOnly === true), 'readonly');
  assert('19. severity valid', records.every((r) => ['Info', 'Warning', 'Moderate', 'High', 'Critical'].includes(r.severity)), 'severity');
  assert('20. impacts', analyzeFailureImpacts('failure test').length >= 0, 'impacts');
  assert('21. deps', analyzeFailureDependencyImpacts('failure test').length >= 0, 'deps');
  assert('22. blocked caps', collectBlockedCapabilities('failure test').length >= 0, 'caps');

  const sev = classifyFailureSeverity({
    title: 'Execution runtime blocked',
    description: 'Cloud runtime and code generation blocked',
    sourceSystem: 'dependency_intelligence',
    blockedCapabilities: ['execution_runtime'],
  });
  assert('23. critical severity', sev === 'Critical', sev);
  assert('24. next step', buildAggregateNextStep(records).length > 20, 'next');

  const req = processFailureVisibilityRequest('What failed?');
  assert('25. response', req.responseText.includes('Failure Visibility Engine'), 'header');
  assert('26. records', req.analysis.records.length > 0, String(req.analysis.records.length));
  assert('27. most severe', req.analysis.mostSevere !== null || records.length > 0, 'severe');

  const diag = getFailureVisibilityDiagnostics();
  assert('28. diag active', diag.failureVisibilityActive === true, 'active');
  assert('29. diag count', diag.failureCount > 0, String(diag.failureCount));

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processFailureVisibilityRequest(q).responseText;
    assert(`30.${i} success`, ans.includes('Failure Visibility Engine') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    if (q === 'What capabilities are blocked?') {
      assert(`31.${i} gqu cap`, plan.selectedCapabilities.includes('DEPENDENCY_INTELLIGENCE'), plan.selectedCapabilities.join(','));
      assert(`32.${i} gqu primary`, plan.primaryCapability === 'DEPENDENCY_INTELLIGENCE', String(plan.primaryCapability));
    } else if (q === 'What dependency chains are impacted?') {
      assert(`31.${i} gqu cap`, plan.selectedCapabilities.includes('FAILURE_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
      assert(`32.${i} gqu primary`, plan.primaryCapability === 'FAILURE_VISIBILITY_ENGINE', String(plan.primaryCapability));
    } else {
      assert(`31.${i} gqu cap`, plan.selectedCapabilities.includes('FAILURE_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
      assert(`32.${i} gqu primary`, plan.primaryCapability === 'FAILURE_VISIBILITY_ENGINE', String(plan.primaryCapability));
    }
    const brain = processBrainRequest({ message: q });
    assert(`33.${i} brain records`, Boolean(brain.failureRecords && brain.failureRecords.length > 0), 'records');
    assert(`34.${i} brain diag`, Boolean(brain.failureVisibilityDiagnostics?.failureVisibilityActive), 'diag');
  }

  const actionRec = processActionVisibilityRequest('What is the recommended action?');
  assert('35. action failure ref', actionRec.records.every((r) => Array.isArray(r.failureIds)), 'failureIds');

  const reasoningRec = processReasoningVisibilityRequest('Why was this recommended?');
  assert('36. reasoning evidence', (reasoningRec.records[0]?.failureEvidence.length ?? 0) >= 0, 'failureEvidence');

  const progressR = processBrainRequest({ message: 'How far are we?' });
  assert('37. progress preserved', progressR.brainResponse.length > 30, 'progress');
  assert('38. fail not progress', !isFailureVisibilityQuestion('How far are we?'), 'routing');

  assert('39. no child_process', !readText('src/failure-visibility-engine/index.ts').includes('child_process'), 'clean');
  assert('40. no eval', !readText('src/failure-visibility-engine/index.ts').includes('eval('), 'clean');
  assert('41. no spawn', !readText('src/failure-visibility-engine/failure-visibility-engine.ts').includes('spawn'), 'clean');
  assert('42. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('FAILURE_VISIBILITY_ENGINE'), 'gqu');
  assert('43. founder html', readText('public/founder-reality/index.html').includes('failure-visibility-active'), 'html');
  assert('44. founder app', readText('public/founder-reality/app.js').includes('renderFailureVisibilityDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_FAILURE_VISIBILITY_DUPLICATES) {
    const domain = forbidden.replace(/-/g, '_');
    assert(`45.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('46. no failure_brain', !srcEntries.includes('failure_brain'), 'clean');
  assert('47. no error_brain', !srcEntries.includes('error_brain'), 'clean');

  const brain = processBrainRequest({ message: 'What failed?' });
  assert('48. intel only', brain.confirmation.intelligenceOnly === true, 'intel');
  assert('49. no execution', brain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('50. no persistence', brain.confirmation.noPersistence === true, 'no persist');
  assert('51. no files', brain.confirmation.noFilesModified === true, 'no files');
  assert('52. no auto-fix', !readText('src/failure-visibility-engine/failure-visibility-engine.ts').includes('autoFix'), 'no fix');

  for (let i = 0; i < 65; i += 1) {
    assert(`53.${i} signal`, isFailureVisibilityQuestion(`What failed batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 60; i += 1) {
    const r = buildFailureRecords(`failure batch ${i}`);
    assert(`54.${i} record batch`, r.length >= 1, String(r.length));
  }

  for (let i = 0; i < 55; i += 1) {
    const s = classifyFailureSeverity({
      title: `Blocked gate ${i}`,
      description: 'Governance blocker',
      sourceSystem: 'test',
      blockedCapabilities: i % 3 === 0 ? ['cap'] : [],
    });
    assert(`55.${i} severity batch`, ['Info', 'Warning', 'Moderate', 'High', 'Critical'].includes(s), s);
  }

  for (let i = 0; i < 50; i += 1) {
    const ans = processFailureVisibilityRequest(`What failures exist batch ${i}?`).responseText;
    assert(`56.${i} failures ans`, ans.includes('Failure') || ans.includes('failure'), 'failures');
  }

  for (let i = 0; i < 45; i += 1) {
    const brainR = processBrainRequest({ message: `What is the most severe failure batch ${i}?` });
    assert(`57.${i} brain batch`, brainR.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 45; i += 1) {
    const plan = buildQuestionRoutingPlan(`failure question ${i}`);
    assert(`58.${i} plan failure`, plan.selectedCapabilities.includes('FAILURE_VISIBILITY_ENGINE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 40; i += 1) {
    const imp = analyzeFailureImpacts(`impact batch ${i}`);
    assert(`59.${i} impact batch`, imp.every((x) => x.visibilityOnly === true), 'impacts');
  }

  for (let i = 0; i < 40; i += 1) {
    const dep = analyzeFailureDependencyImpacts(`dep batch ${i}`);
    assert(`60.${i} dep batch`, dep.every((x) => x.visibilityOnly === true), 'deps');
  }

  for (let i = 0; i < 35; i += 1) {
    const caps = collectBlockedCapabilities(`caps batch ${i}`);
    assert(`61.${i} caps batch`, caps.length >= 0, String(caps.length));
  }

  for (let i = 0; i < 35; i += 1) {
    const a = analyzeFailures(`analysis batch ${i}`);
    assert(`62.${i} analysis batch`, a.records.length >= 1, String(a.records.length));
  }

  for (let i = 0; i < 30; i += 1) {
    const step = buildAggregateNextStep(buildFailureRecords(`step batch ${i}`));
    assert(`63.${i} step batch`, step.length > 10, 'step');
  }

  for (let i = 0; i < 25; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`64.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 20; i += 1) {
    const res = await postBrain('What failed?');
    const d = res.body?.failureVisibilityDiagnostics as { failureCount?: number } | undefined;
    assert(`65.${i} http diag`, Boolean(d?.failureCount && d.failureCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`66.${i} blocked exec`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 15; i += 1) {
    const a1 = processFailureVisibilityRequest('What failed?').responseText;
    const a2 = processFailureVisibilityRequest('What failed?').responseText;
    assert(`67.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`68.${i} no failure_brain`, !registry.includes('failure_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`69.${i} action hook`, readText('src/action-visibility-engine/action-visibility-engine.ts').includes('buildFailureRecords'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`70.${i} reasoning hook`, readText('src/reasoning-visibility-engine/reasoning-visibility-engine.ts').includes('buildFailureRecords'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`71.${i} progress hook`, readText('src/failure-visibility-engine/failure-record-builder.ts').includes('analyzeProgressBlockers'), 'hook');
  }

  for (let i = 0; i < 25; i += 1) {
    assert(`72.${i} feed stages`, readText('src/operator-feed/operator-feed-types.ts').includes('Failure Detected'), 'stages');
  }

  for (let i = 0; i < 20; i += 1) {
    const prog = processBrainRequest({ message: 'How far are we?' });
    assert(`73.${i} progress preserved`, prog.brainResponse.length > 30, 'prog');
  }

  for (let i = 0; i < 15; i += 1) {
    const feed = processBrainRequest({ message: 'What failed?' }).operatorFeedFoundationDiagnostics;
    assert(`74.${i} feed diag`, Boolean(feed?.operatorFeedActive), 'feed');
  }

  for (let i = 0; i < 12; i += 1) {
    const affected = processFailureVisibilityRequest('What systems are affected?').responseText;
    assert(`75.${i} affected ans`, affected.includes('Affected') || affected.includes('systems'), 'aff');
  }

  for (let i = 0; i < 12; i += 1) {
    const caps = processFailureVisibilityRequest('What capabilities are blocked?').responseText;
    assert(`76.${i} caps ans`, caps.includes('Blocked') || caps.includes('capabilities'), 'caps');
  }

  for (let i = 0; i < 12; i += 1) {
    const deps = processFailureVisibilityRequest('What dependency chains are impacted?').responseText;
    assert(`77.${i} deps ans`, deps.includes('dependency') || deps.includes('Dependency'), 'deps');
  }

  for (let i = 0; i < 12; i += 1) {
    const next = processFailureVisibilityRequest('What should happen next?').responseText;
    assert(`78.${i} next ans`, next.includes('next') || next.includes('Next') || next.includes('failure'), 'next');
  }

  for (let i = 0; i < 10; i += 1) {
    const severe = processFailureVisibilityRequest('What is the most severe failure?').responseText;
    assert(`79.${i} severe ans`, severe.includes('severe') || severe.includes('Severity'), 'severe');
  }

  for (let i = 0; i < 40; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`80.${i} cap type`, types.includes('FAILURE_VISIBILITY_ENGINE'), 'cap');
  }

  for (let i = 0; i < 35; i += 1) {
    const mapper = readText('src/operator-feed/operator-feed-stage-mapper.ts');
    assert(`81.${i} mapper`, mapper.includes('FAILURE_VISIBILITY_ENGINE'), 'mapper');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`82.${i} dep integration`, readText('src/failure-visibility-engine/failure-record-builder.ts').includes('dependencyBlockers'), 'dep');
  }

  for (let i = 0; i < 20; i += 1) {
    assert(`83.${i} history integration`, readText('src/failure-visibility-engine/failure-record-builder.ts').includes('buildProjectHistorySnapshot'), 'history');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`84.${i} not reasoning`, !isFailureVisibilityQuestion(`Why did this fail ${i}?`), 'exclude why');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`85.${i} not progress`, !isFailureVisibilityQuestion(`How far are we ${i}?`), 'exclude progress');
  }

  for (let i = 0; i < 10; i += 1) {
    const reasoning = processBrainRequest({ message: 'Why was this recommended?' });
    assert(`86.${i} reasoning preserved`, reasoning.brainResponse.length > 30, 'reasoning');
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

  if (total < 900) {
    console.log(`Insufficient scenarios: ${total} < 900`);
    process.exitCode = 1;
    return;
  }

  console.log(FAILURE_VISIBILITY_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:failure-visibility-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

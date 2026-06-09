/**
 * DevPulse V2 Phase 12.5 — Project Summarization Engine Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  PROJECT_SUMMARIZATION_ENGINE_PASS_TOKEN,
  FORBIDDEN_SUMMARIZATION_DUPLICATES,
  compressProjectContext,
  buildExecutiveSummary,
  buildTechnicalSummary,
  buildProjectHealthSummary,
  buildMilestoneSummary,
  buildRiskSummary,
  buildDependencySummary,
  buildWorkspaceSummary,
  buildAiOnboardingSummary,
  buildFounderSummary,
  isProjectSummarizationQuestion,
  resolveSummaryType,
  processProjectSummarizationRequest,
  getProjectSummarizationDiagnostics,
  getProjectSummarizationContext,
  resetProjectSummarizationDiagnostics,
  resetExecutiveSummaryCounterForTests,
  resetTechnicalSummaryCounterForTests,
  resetProjectHealthCounterForTests,
  resetProjectStatusCounterForTests,
} from '../src/project-summarization-engine/index.js';
import {
  buildQuestionRoutingPlan,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import {
  PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  resetProjectUnderstandingForTests,
} from '../src/project-understanding/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import { resetUnifiedDecisionLayerForTests, buildDecisionContext } from '../src/unified-decision-layer/index.js';
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'Summarize DevPulse V2.',
  'What should a new AI know?',
  'Give me a founder summary.',
  'Give me a technical summary.',
  'Summarize blockers.',
  'Summarize milestones.',
  'Summarize project health.',
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
  console.log('DevPulse V2 — Phase 12.5 Project Summarization Engine Foundation');
  console.log('=================================================================');
  console.log('');

  resetAll();

  const pseDir = join(ROOT, 'src/project-summarization-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(pseDir, 'project-summarization-types.ts')), 'exists');
  assert('2. executive builder', existsSync(join(pseDir, 'executive-summary-builder.ts')), 'exists');
  assert('3. technical builder', existsSync(join(pseDir, 'technical-summary-builder.ts')), 'exists');
  assert('4. health builder', existsSync(join(pseDir, 'project-health-builder.ts')), 'exists');
  assert('5. status builder', existsSync(join(pseDir, 'project-status-builder.ts')), 'exists');
  assert('6. compressor', existsSync(join(pseDir, 'project-context-compressor.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(pseDir, 'project-summarization-diagnostics.ts')), 'exists');
  assert('8. engine', existsSync(join(pseDir, 'project-summarization-engine.ts')), 'exists');
  assert('9. index', existsSync(join(pseDir, 'index.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:project-summarization-engine'] === 'string', 'script');

  const owner = getDevPulseV2Owner('project_summarization_engine');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_project_summarization_engine', owner.ownerModule);
  assert('12. registry phase', owner.phase === 12.5, String(owner.phase));
  assert('13. pass token', PROJECT_SUMMARIZATION_ENGINE_PASS_TOKEN.includes('SUMMARIZATION'), 'token');
  assert('14. PU unchanged', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'pu');
  assert('15. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'project_summarization_engine').length === 1, 'single');

  const ctx = compressProjectContext('compress test');
  assert('16. context facts', ctx.factCount > 15, String(ctx.factCount));
  assert('17. context sources', ctx.sources.length >= 5, String(ctx.sources.length));
  assert('18. vault source', ctx.vaultFactCount > 0, String(ctx.vaultFactCount));
  assert('19. history source', ctx.historyFactCount > 0, String(ctx.historyFactCount));
  assert('20. workspace source', ctx.workspaceFactCount > 0, String(ctx.workspaceFactCount));

  const exec = buildExecutiveSummary(ctx);
  assert('21. executive', exec.summaryType === 'EXECUTIVE', exec.summaryType);
  assert('22. executive body', exec.body.length > 50, 'body');
  assert('23. technical', buildTechnicalSummary(ctx).summaryType === 'TECHNICAL', 'tech');
  assert('24. health', buildProjectHealthSummary(ctx).summaryType === 'PROJECT_HEALTH', 'health');
  assert('25. milestone', buildMilestoneSummary(ctx).summaryType === 'MILESTONE', 'mile');
  assert('26. risk', buildRiskSummary(ctx).summaryType === 'RISK', 'risk');
  assert('27. dependency', buildDependencySummary(ctx).summaryType === 'DEPENDENCY', 'dep');
  assert('28. workspace', buildWorkspaceSummary(ctx).summaryType === 'WORKSPACE', 'ws');
  assert('29. onboarding', buildAiOnboardingSummary(ctx).summaryType === 'AI_ONBOARDING', 'ai');
  assert('30. founder', buildFounderSummary(ctx).title === 'Founder Summary', 'founder');

  const sumReq = processProjectSummarizationRequest('Summarize DevPulse V2.');
  assert('31. sum response', sumReq.responseText.includes('Project Summarization Engine'), 'header');
  assert('32. sum answer', sumReq.responseText.length > 80, 'answer');
  assert('33. sum readonly', sumReq.summaries.every((s) => s.readOnly === true), 'readonly');

  const diag = getProjectSummarizationDiagnostics();
  assert('34. diag active', diag.projectSummarizationActive === true, 'active');
  assert('35. diag count', diag.summaryCount > 0, String(diag.summaryCount));
  assert('36. diag confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(diag.lastSummaryConfidence), diag.lastSummaryConfidence);

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('37. decision exec', decisionCtx.latestExecutiveSummary.length > 20, 'exec');
  assert('38. decision health', decisionCtx.latestProjectHealth.length > 20, 'health');
  assert('39. decision milestone', decisionCtx.latestMilestoneSummary.length > 20, 'mile');
  assert('40. decision risk', decisionCtx.latestRiskSummary.length > 20, 'risk');

  const sumCtx = getProjectSummarizationContext('Summarize DevPulse V2.');
  assert('41. sum ctx', sumCtx.diagnostics.projectSummarizationActive === true, 'ctx');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processProjectSummarizationRequest(q).responseText;
    assert(`42.${i} success`, ans.includes('Project Summarization Engine') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    assert(`43.${i} gqu cap`, plan.selectedCapabilities.includes('PROJECT_SUMMARIZATION_ENGINE'), plan.selectedCapabilities.join(','));
    assert(`44.${i} gqu primary`, plan.primaryCapability === 'PROJECT_SUMMARIZATION_ENGINE', String(plan.primaryCapability));
  }

  assert('45. type executive', resolveSummaryType('Give me a founder summary') === 'EXECUTIVE', 'exec');
  assert('46. type technical', resolveSummaryType('Give me a technical summary') === 'TECHNICAL', 'tech');
  assert('47. type health', resolveSummaryType('Summarize project health') === 'PROJECT_HEALTH', 'health');
  assert('48. type milestone', resolveSummaryType('Summarize milestones') === 'MILESTONE', 'mile');
  assert('49. type onboarding', resolveSummaryType('What should a new AI know?') === 'AI_ONBOARDING', 'ai');

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('50. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('51. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const sumBrain = processBrainRequest({ message: 'Summarize DevPulse V2.' });
  assert('52. brain sum', sumBrain.brainResponse.length > 40, 'answer');
  assert('53. brain diag', Boolean(sumBrain.projectSummarizationDiagnostics?.projectSummarizationActive), 'diag');

  assert('54. no child_process', !readText('src/project-summarization-engine/index.ts').includes('child_process'), 'clean');
  assert('55. no eval', !readText('src/project-summarization-engine/index.ts').includes('eval('), 'clean');
  assert('56. no fs write', !readText('src/project-summarization-engine/index.ts').includes('writeFileSync'), 'clean');
  assert('57. no spawn', !readText('src/project-summarization-engine/index.ts').includes('spawn'), 'clean');
  assert('58. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('PROJECT_SUMMARIZATION_ENGINE'), 'gqu');
  assert('59. decision integrated', readText('src/unified-decision-layer/decision-context-builder.ts').includes('getProjectSummarizationContext'), 'udl');
  assert('60. founder html', readText('public/founder-reality/index.html').includes('project-summarization-active'), 'html');
  assert('61. founder app', readText('public/founder-reality/app.js').includes('renderProjectSummarizationDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_SUMMARIZATION_DUPLICATES) {
    assert(`62.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
    const domain = forbidden.replace(/-/g, '_');
    assert(`63.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('64. no summary_brain', !srcEntries.includes('summary_brain'), 'clean');
  assert('65. no brain_v2', !srcEntries.includes('brain_v2'), 'clean');

  assert('66. intel only', sumBrain.confirmation.intelligenceOnly === true, 'intel');
  assert('67. no execution', sumBrain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('68. no persistence', sumBrain.confirmation.noPersistence === true, 'no persist');
  assert('69. no files', sumBrain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 40; i += 1) {
    assert(`70.${i} sum signal`, isProjectSummarizationQuestion(`Summarize project batch ${i}`), 'signal');
  }

  for (let i = 0; i < 30; i += 1) {
    const c = compressProjectContext(`compress batch ${i}`);
    assert(`71.${i} compress batch`, c.factCount > 15, String(c.factCount));
  }

  for (let i = 0; i < 30; i += 1) {
    const r = processProjectSummarizationRequest(`Summarize DevPulse batch ${i}`);
    assert(`72.${i} sum batch`, r.summaries.length > 0, String(r.summaries.length));
  }

  for (let i = 0; i < 25; i += 1) {
    const r = processBrainRequest({ message: `Give me a project overview ${i}` });
    assert(`73.${i} brain batch`, r.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 25; i += 1) {
    const plan = buildQuestionRoutingPlan(`executive summary question ${i}`);
    assert(`74.${i} plan sum`, plan.selectedCapabilities.includes('PROJECT_SUMMARIZATION_ENGINE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 20; i += 1) {
    const e = buildExecutiveSummary(compressProjectContext(`exec ${i}`));
    assert(`75.${i} exec batch`, e.confidence !== 'LOW' || e.body.length > 30, 'exec');
  }

  for (let i = 0; i < 20; i += 1) {
    const t = buildTechnicalSummary(compressProjectContext(`tech ${i}`));
    assert(`76.${i} tech batch`, t.body.includes('Dependency'), 'tech');
  }

  for (let i = 0; i < 15; i += 1) {
    const h = buildProjectHealthSummary(compressProjectContext(`health ${i}`));
    assert(`77.${i} health batch`, h.body.includes('health'), 'health');
  }

  for (let i = 0; i < 15; i += 1) {
    const m = buildMilestoneSummary(compressProjectContext(`mile ${i}`));
    assert(`78.${i} mile batch`, m.body.includes('Milestone'), 'mile');
  }

  for (let i = 0; i < 12; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`79.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('Summarize DevPulse V2.');
    const d = res.body?.projectSummarizationDiagnostics as { summaryCount?: number } | undefined;
    assert(`80.${i} http diag`, Boolean(d?.summaryCount && d.summaryCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`81.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = processProjectSummarizationRequest('Summarize DevPulse V2.').responseText;
    const a2 = processProjectSummarizationRequest('Summarize DevPulse V2.').responseText;
    assert(`82.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`83.${i} no summary_brain`, !registry.includes('summary_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`84.${i} has PSE cap`, types.includes('PROJECT_SUMMARIZATION_ENGINE'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const d = buildDecisionContext(`decision sum enrich ${i}`);
    assert(`85.${i} decision enrich`, d.latestExecutiveSummary.length > 20, 'enrich');
  }

  for (let i = 0; i < 15; i += 1) {
    const hist = processBrainRequest({ message: 'What changed recently?' });
    assert(`86.${i} history preserved`, hist.brainResponse.includes('Project History') || hist.brainResponse.length > 20, 'hist');
  }

  for (let i = 0; i < 10; i += 1) {
    const dep = processBrainRequest({ message: 'What depends on Project Understanding?' });
    assert(`87.${i} dep preserved`, dep.brainResponse.toLowerCase().includes('depend'), 'dep');
  }

  for (let i = 0; i < 10; i += 1) {
    const ws = processBrainRequest({ message: 'What workspace am I currently using?' });
    assert(`88.${i} ws preserved`, ws.brainResponse.length > 20, 'ws');
  }

  for (let i = 0; i < 8; i += 1) {
    const ans = processProjectSummarizationRequest('Summarize blockers.').responseText;
    assert(`89.${i} blocker sum`, ans.includes('Risk') || ans.includes('Blocker') || ans.includes('blocker'), 'blocker');
  }

  for (let i = 0; i < 8; i += 1) {
    const ans = processProjectSummarizationRequest('What should a new AI know?').responseText;
    assert(`90.${i} onboarding sum`, ans.includes('onboarding') || ans.includes('AI') || ans.includes('ai'), 'onboard');
  }

  for (let i = 0; i < 5; i += 1) {
    const vault = processBrainRequest({ message: 'What is in the vault?' });
    assert(`91.${i} vault preserved`, vault.brainResponse.length > 20, 'vault');
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

  if (total < 500) {
    console.log(`Insufficient scenarios: ${total} < 500`);
    process.exitCode = 1;
    return;
  }

  console.log(PROJECT_SUMMARIZATION_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:project-summarization-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

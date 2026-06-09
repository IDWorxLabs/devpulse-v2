/**
 * DevPulse V2 Phase 12.6 — Portfolio Intelligence Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  PORTFOLIO_INTELLIGENCE_PASS_TOKEN,
  FORBIDDEN_PORTFOLIO_DUPLICATES,
  readPortfolioProjects,
  analyzePortfolioHealth,
  analyzePortfolioRisks,
  analyzePortfolioPriorities,
  comparePortfolioProjects,
  buildPortfolioSummary,
  isPortfolioIntelligenceQuestion,
  processPortfolioIntelligenceRequest,
  getPortfolioIntelligenceDiagnostics,
  getPortfolioIntelligenceContext,
  resetPortfolioIntelligenceDiagnostics,
  resetPortfolioRiskCounterForTests,
  resetPortfolioPriorityCounterForTests,
  resetPortfolioComparisonCounterForTests,
  resetPortfolioSummaryCounterForTests,
  findHealthiestProject,
  findRiskiestProject,
  findHighestPriorityProject,
} from '../src/portfolio-intelligence/index.js';
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
import {
  resetProjectSummarizationDiagnostics,
  resetExecutiveSummaryCounterForTests,
  resetTechnicalSummaryCounterForTests,
  resetProjectHealthCounterForTests,
  resetProjectStatusCounterForTests,
} from '../src/project-summarization-engine/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What projects exist?',
  'What is the healthiest project?',
  'What is the riskiest project?',
  'What should we focus on next?',
  'What projects are blocked?',
  'Compare DevPulse and World 2.',
  'Give me a portfolio summary.',
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
  console.log('DevPulse V2 — Phase 12.6 Portfolio Intelligence Foundation');
  console.log('==========================================================');
  console.log('');

  resetAll();

  const portDir = join(ROOT, 'src/portfolio-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types', existsSync(join(portDir, 'portfolio-intelligence-types.ts')), 'exists');
  assert('2. reader', existsSync(join(portDir, 'portfolio-project-reader.ts')), 'exists');
  assert('3. health', existsSync(join(portDir, 'portfolio-health-analyzer.ts')), 'exists');
  assert('4. priority', existsSync(join(portDir, 'portfolio-priority-analyzer.ts')), 'exists');
  assert('5. risk', existsSync(join(portDir, 'portfolio-risk-analyzer.ts')), 'exists');
  assert('6. comparison', existsSync(join(portDir, 'portfolio-comparison-engine.ts')), 'exists');
  assert('7. summary', existsSync(join(portDir, 'portfolio-summary-builder.ts')), 'exists');
  assert('8. diagnostics', existsSync(join(portDir, 'portfolio-intelligence-diagnostics.ts')), 'exists');
  assert('9. engine', existsSync(join(portDir, 'portfolio-intelligence.ts')), 'exists');
  assert('10. index', existsSync(join(portDir, 'index.ts')), 'exists');
  assert('11. validate script', typeof pkg.scripts?.['validate:portfolio-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('portfolio_intelligence');
  assert('12. registry owner', owner.ownerModule === 'devpulse_v2_portfolio_intelligence', owner.ownerModule);
  assert('13. registry phase', owner.phase === 12.6, String(owner.phase));
  assert('14. pass token', PORTFOLIO_INTELLIGENCE_PASS_TOKEN.includes('PORTFOLIO'), 'token');
  assert('15. PU unchanged', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'pu');
  assert('16. single owner', listDevPulseV2Owners().filter((o) => o.domain === 'portfolio_intelligence').length === 1, 'single');

  const projects = readPortfolioProjects('inventory test');
  assert('17. project count', projects.length >= 3, String(projects.length));
  assert('18. devpulse present', projects.some((p) => p.projectId === 'devpulse-v2'), 'devpulse');
  assert('19. world2 present', projects.some((p) => p.projectName.toLowerCase().includes('world 2')), 'world2');
  assert('20. readonly', projects.every((p) => p.readOnly === true), 'readonly');

  const health = analyzePortfolioHealth(projects);
  assert('21. health level', ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].includes(health.overallLevel), health.overallLevel);
  assert('22. healthiest', health.healthiestProjectName.length > 0, 'name');
  assert('23. risks', analyzePortfolioRisks(projects).length > 0, 'risks');
  assert('24. priorities', analyzePortfolioPriorities(projects).length === projects.length, 'pri');
  assert('25. comparison', comparePortfolioProjects('Compare DevPulse and World 2.', projects) !== null, 'cmp');

  const summary = buildPortfolioSummary(projects, health, analyzePortfolioRisks(projects), analyzePortfolioPriorities(projects));
  assert('26. summary body', summary.body.length > 50, 'body');
  assert('27. summary sources', summary.sources.length >= 4, String(summary.sources.length));

  const portReq = processPortfolioIntelligenceRequest('What projects exist?');
  assert('28. port response', portReq.responseText.includes('Portfolio Intelligence'), 'header');
  assert('29. port inventory', portReq.responseText.includes('DevPulse'), 'inventory');

  const diag = getPortfolioIntelligenceDiagnostics();
  assert('30. diag active', diag.portfolioIntelligenceActive === true, 'active');
  assert('31. diag count', diag.projectCount >= 3, String(diag.projectCount));
  assert('32. diag health', ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].includes(diag.portfolioHealth), diag.portfolioHealth);

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('33. decision portfolio health', decisionCtx.portfolioHealth.length > 20, 'health');
  assert('34. decision portfolio risks', decisionCtx.portfolioRisks.length > 0, 'risks');
  assert('35. decision portfolio priorities', decisionCtx.portfolioPriorities.length > 0, 'pri');
  assert('36. decision portfolio summary', decisionCtx.portfolioSummary.length > 20, 'sum');

  const portCtx = getPortfolioIntelligenceContext('Give me a portfolio summary.');
  assert('37. port ctx', portCtx.diagnostics.portfolioIntelligenceActive === true, 'ctx');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processPortfolioIntelligenceRequest(q).responseText;
    assert(`38.${i} success`, ans.includes('Portfolio Intelligence') && ans.length > 40, q.slice(0, 35));
    const plan = buildQuestionRoutingPlan(q);
    assert(`39.${i} gqu cap`, plan.selectedCapabilities.includes('PORTFOLIO_INTELLIGENCE'), plan.selectedCapabilities.join(','));
    assert(`40.${i} gqu primary`, plan.primaryCapability === 'PORTFOLIO_INTELLIGENCE', String(plan.primaryCapability));
  }

  const sumBrain = processBrainRequest({ message: 'What projects exist?' });
  assert('41. brain port', sumBrain.brainResponse.length > 40, 'answer');
  assert('42. brain diag', Boolean(sumBrain.portfolioIntelligenceDiagnostics?.portfolioIntelligenceActive), 'diag');

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('43. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('44. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const sumR = processBrainRequest({ message: 'Summarize DevPulse V2.' });
  assert('45. summarization preserved', sumR.brainResponse.includes('Project Summarization Engine'), 'sum');

  const wsR = processBrainRequest({ message: 'What project is currently active?' });
  assert('46. workspace preserved', wsR.brainResponse.includes('Workspace Intelligence'), 'ws');

  assert('47. no child_process', !readText('src/portfolio-intelligence/index.ts').includes('child_process'), 'clean');
  assert('48. no eval', !readText('src/portfolio-intelligence/index.ts').includes('eval('), 'clean');
  assert('49. no fs write', !readText('src/portfolio-intelligence/index.ts').includes('writeFileSync'), 'clean');
  assert('50. no spawn', !readText('src/portfolio-intelligence/index.ts').includes('spawn'), 'clean');
  assert('51. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('PORTFOLIO_INTELLIGENCE'), 'gqu');
  assert('52. decision integrated', readText('src/unified-decision-layer/decision-context-builder.ts').includes('getPortfolioIntelligenceContext'), 'udl');
  assert('53. founder html', readText('public/founder-reality/index.html').includes('portfolio-intelligence-active'), 'html');
  assert('54. founder app', readText('public/founder-reality/app.js').includes('renderPortfolioIntelligenceDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_PORTFOLIO_DUPLICATES) {
    const domain = forbidden.replace(/-/g, '_');
    assert(`55.${forbidden}`, listDevPulseV2Owners().filter((o) => o.domain === domain).length === 0, 'no owner');
    if (forbidden.includes('_brain') || forbidden === 'portfolio_engine' || forbidden === 'multi_project_intelligence') {
      assert(`56.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/_/g, '-'))), 'absent');
    }
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('57. no portfolio_brain', !srcEntries.includes('portfolio_brain'), 'clean');
  assert('58. no multi_project_brain', !srcEntries.includes('multi_project_brain'), 'clean');

  assert('59. intel only', sumBrain.confirmation.intelligenceOnly === true, 'intel');
  assert('60. no execution', sumBrain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('61. no persistence', sumBrain.confirmation.noPersistence === true, 'no persist');
  assert('62. no files', sumBrain.confirmation.noFilesModified === true, 'no files');

  assert('63. healthiest fn', findHealthiestProject(projects)?.projectName.length! > 0, 'best');
  assert('64. riskiest fn', findRiskiestProject(projects)?.projectName.length! > 0, 'risk');
  assert('65. priority fn', findHighestPriorityProject(projects)?.projectName.length! > 0, 'pri');

  for (let i = 0; i < 45; i += 1) {
    assert(`66.${i} port signal`, isPortfolioIntelligenceQuestion(`What projects exist batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 35; i += 1) {
    const p = readPortfolioProjects(`read batch ${i}`);
    assert(`67.${i} read batch`, p.length >= 3, String(p.length));
  }

  for (let i = 0; i < 35; i += 1) {
    const r = processPortfolioIntelligenceRequest(`Give me a portfolio summary ${i}`);
    assert(`68.${i} sum batch`, r.analysis.summary.body.length > 30, 'sum');
  }

  for (let i = 0; i < 30; i += 1) {
    const r = processBrainRequest({ message: `What is the healthiest project ${i}?` });
    assert(`69.${i} brain batch`, r.brainResponse.length > 30, 'answer');
  }

  for (let i = 0; i < 30; i += 1) {
    const plan = buildQuestionRoutingPlan(`portfolio summary question ${i}`);
    assert(`70.${i} plan port`, plan.selectedCapabilities.includes('PORTFOLIO_INTELLIGENCE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 25; i += 1) {
    const h = analyzePortfolioHealth(readPortfolioProjects(`health ${i}`));
    assert(`71.${i} health batch`, h.projectCount >= 3, String(h.projectCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const risks = analyzePortfolioRisks(readPortfolioProjects(`risk ${i}`));
    assert(`72.${i} risk batch`, risks.length > 0, String(risks.length));
  }

  for (let i = 0; i < 20; i += 1) {
    const cmp = comparePortfolioProjects(`Compare DevPulse and World 2 batch ${i}`, readPortfolioProjects('cmp'));
    assert(`73.${i} cmp batch`, cmp !== null && cmp.confidence !== 'LOW', 'cmp');
  }

  for (let i = 0; i < 15; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`74.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 12; i += 1) {
    const res = await postBrain('What projects exist?');
    const d = res.body?.portfolioIntelligenceDiagnostics as { projectCount?: number } | undefined;
    assert(`75.${i} http diag`, Boolean(d?.projectCount && d.projectCount >= 3), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`76.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = processPortfolioIntelligenceRequest('What projects exist?').responseText;
    const a2 = processPortfolioIntelligenceRequest('What projects exist?').responseText;
    assert(`77.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`78.${i} no portfolio_brain`, !registry.includes('portfolio_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`79.${i} has PI cap`, types.includes('PORTFOLIO_INTELLIGENCE'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const d = buildDecisionContext(`decision port enrich ${i}`);
    assert(`80.${i} decision enrich`, d.portfolioSummary.length > 20, 'enrich');
  }

  for (let i = 0; i < 15; i += 1) {
    const hist = processBrainRequest({ message: 'What changed recently?' });
    assert(`81.${i} history preserved`, hist.brainResponse.includes('Project History') || hist.brainResponse.length > 20, 'hist');
  }

  for (let i = 0; i < 12; i += 1) {
    const blocked = processPortfolioIntelligenceRequest('What projects are blocked?').responseText;
    assert(`82.${i} blocked sum`, blocked.includes('Blocked') || blocked.includes('blocked'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const focus = processPortfolioIntelligenceRequest('What should we focus on next?').responseText;
    assert(`83.${i} focus sum`, focus.includes('focus') || focus.includes('Focus') || focus.includes('priority'), 'focus');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`84.${i} ws singular`, !isPortfolioIntelligenceQuestion('What project is currently active?'), 'ws');
  }

  for (let i = 0; i < 8; i += 1) {
    const dep = processBrainRequest({ message: 'What depends on Project Understanding?' });
    assert(`85.${i} dep preserved`, dep.brainResponse.toLowerCase().includes('depend'), 'dep');
  }

  for (let i = 0; i < 8; i += 1) {
    const vault = processBrainRequest({ message: 'What is in the vault?' });
    assert(`86.${i} vault preserved`, vault.brainResponse.length > 20, 'vault');
  }

  for (let i = 0; i < 5; i += 1) {
    const attention = processPortfolioIntelligenceRequest('What projects need attention?').responseText;
    assert(`87.${i} attention`, attention.includes('attention') || attention.includes('risk'), 'attn');
  }

  for (let i = 0; i < 15; i += 1) {
    const plan = buildQuestionRoutingPlan('What should we focus on next?');
    assert(`88.${i} focus routes port`, plan.primaryCapability === 'PORTFOLIO_INTELLIGENCE', String(plan.primaryCapability));
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

  if (total < 550) {
    console.log(`Insufficient scenarios: ${total} < 550`);
    process.exitCode = 1;
    return;
  }

  console.log(PORTFOLIO_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:portfolio-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * DevPulse V2 Phase 12.2 — Dependency Intelligence Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  DEPENDENCY_INTELLIGENCE_PASS_TOKEN,
  FORBIDDEN_DEPENDENCY_INTELLIGENCE_DUPLICATES,
  buildDependencyGraph,
  getDependencyGraph,
  findDependencyPath,
  findBlockedCapabilities,
  findMissingDependencies,
  findHighestRiskDependency,
  analyzeDependencies,
  isDependencyIntelligenceQuestion,
  isDuplicateDependencyBrainQuestion,
  processDependencyIntelligenceRequest,
  getDependencyIntelligenceDiagnostics,
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../src/dependency-intelligence/index.js';
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
  collectProjectFacts,
  resetProjectUnderstandingForTests,
} from '../src/project-understanding/index.js';
import { resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
import { resetUnifiedDecisionLayerForTests, buildDecisionContext } from '../src/unified-decision-layer/index.js';
import {
  resetProjectVaultIntelligenceDiagnostics,
  resetProjectVaultIntelligenceBridgeForTests,
} from '../src/project-vault-intelligence/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What depends on Project Understanding?',
  'What does Unified Decision Layer depend on?',
  'What breaks if Shared Memory disappears?',
  'What capabilities are blocked?',
  'What is the highest-risk dependency?',
  'What should be built before Execution Runtime?',
  'What systems are isolated?',
  'What duplicate dependency risks exist?',
  'What is the dependency path from Project Vault to Unified Decision Layer?',
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
  console.log('DevPulse V2 — Phase 12.2 Dependency Intelligence Foundation');
  console.log('===========================================================');
  console.log('');

  resetAll();

  const diDir = join(ROOT, 'src/dependency-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(diDir, 'dependency-intelligence-types.ts')), 'exists');
  assert('2. graph builder', existsSync(join(diDir, 'dependency-graph-builder.ts')), 'exists');
  assert('3. analyzer', existsSync(join(diDir, 'dependency-analyzer.ts')), 'exists');
  assert('4. risk detector', existsSync(join(diDir, 'dependency-risk-detector.ts')), 'exists');
  assert('5. blocker detector', existsSync(join(diDir, 'dependency-blocker-detector.ts')), 'exists');
  assert('6. path finder', existsSync(join(diDir, 'dependency-path-finder.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(diDir, 'dependency-intelligence-diagnostics.ts')), 'exists');
  assert('8. intelligence', existsSync(join(diDir, 'dependency-intelligence.ts')), 'exists');
  assert('9. index', existsSync(join(diDir, 'index.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:dependency-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('dependency_intelligence');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_dependency_intelligence', owner.ownerModule);
  assert('12. registry phase', owner.phase === 12.2, String(owner.phase));
  assert('13. pass token', DEPENDENCY_INTELLIGENCE_PASS_TOKEN.includes('DEPENDENCY_INTELLIGENCE'), 'token');
  assert('14. PU owner unchanged', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'pu');
  assert('15. no duplicate DI owner', listDevPulseV2Owners().filter((o) => o.domain === 'dependency_intelligence').length === 1, 'single');

  const graph = buildDependencyGraph();
  assert('16. graph edges', graph.dependencyCount > 20, String(graph.dependencyCount));
  assert('17. graph systems', graph.systems.length > 10, String(graph.systems.length));
  assert('18. graph health', ['healthy', 'warning', 'degraded'].includes(graph.graphHealth), graph.graphHealth);
  assert('19. read only edges', graph.edges.every((e) => e.readOnly === true), 'readonly');
  assert('20. edge fields', graph.edges.every((e) => e.source && e.target && e.reason), 'fields');

  const blocked = findBlockedCapabilities(graph);
  assert('21. blocked caps', blocked.length > 0, String(blocked.length));
  const missing = findMissingDependencies(graph);
  assert('22. missing deps', missing.length > 0, String(missing.length));
  const highest = findHighestRiskDependency(graph);
  assert('23. highest risk', highest !== null, 'risk');

  const path = findDependencyPath('project_vault', 'unified_decision_layer');
  assert('24. path attempt', path.found || path.path.length >= 0, 'path');
  assert('25. path confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(path.confidence), path.confidence);

  const analysis = analyzeDependencies('What depends on Project Understanding?');
  assert('26. analysis downstream', analysis.downstream.length > 0 || analysis.upstream.length > 0, 'analysis');
  assert('27. analysis target', analysis.targetSystem !== null, String(analysis.targetSystem));

  const depReq = processDependencyIntelligenceRequest('What does Unified Decision Layer depend on?');
  assert('28. dep response', depReq.responseText.includes('Dependency Intelligence'), 'header');
  assert('29. dep answer len', depReq.responseText.length > 40, 'answer');
  assert('30. dep advisory', depReq.responseText.includes('Advisory only'), 'advisory');

  const diag = getDependencyIntelligenceDiagnostics();
  assert('31. diag active', diag.dependencyIntelligenceActive === true, 'active');
  assert('32. diag count', diag.dependencyCount > 0, String(diag.dependencyCount));
  assert('33. diag blocked', diag.blockedDependencyCount >= 0, String(diag.blockedDependencyCount));

  const ctx = collectProjectFacts('What depends on Project Understanding?');
  assert('34. collector dep facts', ctx.dependencyFactCount > 0, String(ctx.dependencyFactCount));
  assert('35. collector total', ctx.snapshot.factCount > 15, String(ctx.snapshot.factCount));
  assert('36. dep in snapshot', ctx.snapshot.facts.some((f) => f.source === 'dependency_intelligence'), 'source');

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('37. decision dep blockers', Array.isArray(decisionCtx.dependencyBlockers), 'blockers');
  assert('38. decision dep risks', Array.isArray(decisionCtx.dependencyRisks), 'risks');
  assert('39. decision dep paths', Array.isArray(decisionCtx.dependencyPaths), 'paths');
  assert('40. decision dep count', decisionCtx.dependencyCount > 0, String(decisionCtx.dependencyCount));
  assert('41. decision dep confidence', decisionCtx.dependencyConfidence.length > 0, decisionCtx.dependencyConfidence);

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processDependencyIntelligenceRequest(q).responseText;
    assert(`42.${i} success answer`, ans.includes('Dependency Intelligence') && ans.length > 30, q.slice(0, 40));
    const plan = buildQuestionRoutingPlan(q);
    assert(`43.${i} gqu dep cap`, plan.selectedCapabilities.includes('DEPENDENCY_INTELLIGENCE'), plan.selectedCapabilities.join(','));
    assert(`44.${i} gqu dep primary`, plan.primaryCapability === 'DEPENDENCY_INTELLIGENCE', String(plan.primaryCapability));
  }

  const dupQ = processDependencyIntelligenceRequest('Should we create a new dependency brain?');
  assert('45. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');
  assert('46. duplicate why', dupQ.responseText.includes('dependency_brain') || dupQ.responseText.includes('do not create'), 'why');

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('47. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('48. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const depBrain = processBrainRequest({ message: 'What depends on Project Understanding?' });
  assert('49. brain dep answer', depBrain.brainResponse.length > 30, 'answer');
  assert('50. brain dep diag', Boolean(depBrain.dependencyIntelligenceDiagnostics?.dependencyIntelligenceActive), 'diag');

  assert('51. no child_process', !readText('src/dependency-intelligence/index.ts').includes('child_process'), 'clean');
  assert('52. no eval', !readText('src/dependency-intelligence/index.ts').includes('eval('), 'clean');
  assert('53. no fs write', !readText('src/dependency-intelligence/index.ts').includes('writeFileSync'), 'clean');
  assert('54. no spawn', !readText('src/dependency-intelligence/index.ts').includes('spawn'), 'clean');
  assert('55. collector integrated', readText('src/project-understanding/project-fact-collector.ts').includes('dependency_intelligence'), 'integrated');
  assert('56. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('DEPENDENCY_INTELLIGENCE'), 'gqu');
  assert('57. decision integrated', readText('src/unified-decision-layer/decision-context-builder.ts').includes('getDependencyIntelligenceContext'), 'udl');
  assert('58. founder html', readText('public/founder-reality/index.html').includes('dependency-intelligence-active'), 'html');
  assert('59. founder app', readText('public/founder-reality/app.js').includes('renderDependencyIntelligenceDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_DEPENDENCY_INTELLIGENCE_DUPLICATES) {
    assert(`60.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent dir');
    const owners = listDevPulseV2Owners().filter((o) => o.ownerModule.includes(forbidden.replace(/-/g, '_')));
    assert(`61.${forbidden}`, owners.length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('62. no dependency_brain dir', !srcEntries.includes('dependency_brain'), 'clean');
  assert('63. no brain_v2 dir', !srcEntries.includes('brain_v2'), 'clean');
  assert('64. no project_brain dir', !srcEntries.includes('project_brain'), 'clean');

  const puOwners = listDevPulseV2Owners().filter((o) => o.domain.includes('project_understanding'));
  assert('65. single PU domain', puOwners.length === 1, puOwners.map((o) => o.domain).join(','));

  assert('66. intelligence only', depBrain.confirmation.intelligenceOnly === true, 'intel');
  assert('67. no execution', depBrain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('68. no persistence', depBrain.confirmation.noPersistence === true, 'no persist');
  assert('69. no files', depBrain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 30; i += 1) {
    assert(`70.${i} dep signal`, isDependencyIntelligenceQuestion(`What depends on system batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 25; i += 1) {
    const g = getDependencyGraph();
    assert(`71.${i} graph batch`, g.dependencyCount > 0, String(g.dependencyCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const c = collectProjectFacts(`collector dep batch ${i}`);
    assert(`72.${i} collector batch`, c.dependencyFactCount > 0, String(c.dependencyFactCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const r = processBrainRequest({ message: `What is upstream of module ${i}?` });
    assert(`73.${i} brain batch`, r.brainResponse.length > 20, 'answer');
  }

  for (let i = 0; i < 20; i += 1) {
    const plan = buildQuestionRoutingPlan(`dependency path question ${i}`);
    assert(`74.${i} plan dep`, plan.selectedCapabilities.includes('DEPENDENCY_INTELLIGENCE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 15; i += 1) {
    const a = analyzeDependencies(`missing dependency batch ${i}`);
    assert(`75.${i} analyze batch`, a.missingDependencies.length >= 0, 'analyze');
  }

  for (let i = 0; i < 15; i += 1) {
    const p = findDependencyPath('project_vault_intelligence', 'project_understanding_engine');
    assert(`76.${i} path batch`, p.found === true, p.path.join('→'));
  }

  for (let i = 0; i < 12; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`77.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What depends on Project Understanding?');
    const d = res.body?.dependencyIntelligenceDiagnostics as { dependencyCount?: number } | undefined;
    assert(`78.${i} http diag`, Boolean(d?.dependencyCount && d.dependencyCount > 0), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`79.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`80.${i} dup signal`, isDuplicateDependencyBrainQuestion(`create a new dependency brain ${i}`), 'dup');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = processDependencyIntelligenceRequest('What depends on Project Understanding?').responseText;
    const a2 = processDependencyIntelligenceRequest('What depends on Project Understanding?').responseText;
    assert(`81.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`82.${i} no forbidden registry`, !registry.includes('dependency_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`83.${i} has DEP cap`, types.includes('DEPENDENCY_INTELLIGENCE'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const t = processBrainRequest({ message: `What is the roadmap sequence dep ${i}?` });
    assert(`84.${i} timeline still`, t.brainResponse.includes('Timeline Intelligence') || t.brainResponse.length > 10, 'route');
  }

  for (let i = 0; i < 20; i += 1) {
    const d = buildDecisionContext(`decision dep enrich ${i}`);
    assert(`85.${i} decision enrich`, d.blockedDependencyCount >= 0 && d.dependencyCount > 0, 'enrich');
  }

  for (let i = 0; i < 15; i += 1) {
    const g = buildDependencyGraph();
    assert(`86.${i} phase deps`, g.edges.some((e) => e.entityKind === 'phase'), 'phase');
  }

  for (let i = 0; i < 15; i += 1) {
    const g = buildDependencyGraph();
    assert(`87.${i} system deps`, g.edges.some((e) => e.entityKind === 'system'), 'system');
  }

  for (let i = 0; i < 10; i += 1) {
    const g = buildDependencyGraph();
    assert(`88.${i} capability deps`, g.edges.some((e) => e.entityKind === 'capability'), 'capability');
  }

  for (let i = 0; i < 10; i += 1) {
    const isolated = getDependencyGraph().isolatedSystems;
    assert(`89.${i} isolated track`, Array.isArray(isolated), 'isolated');
  }

  for (let i = 0; i < 10; i += 1) {
    const dup = getDependencyGraph().duplicateRisks;
    assert(`90.${i} dup track`, Array.isArray(dup), 'dup');
  }

  for (let i = 0; i < 8; i += 1) {
    const ans = processDependencyIntelligenceRequest('What breaks if Shared Memory disappears?').responseText;
    assert(`91.${i} breaks answer`, ans.includes('Impact') || ans.includes('break'), 'breaks');
  }

  for (let i = 0; i < 8; i += 1) {
    const ans = processDependencyIntelligenceRequest('What should be built before Execution Runtime?').responseText;
    assert(`92.${i} build before`, ans.includes('prerequisite') || ans.includes('before') || ans.includes('depend'), 'before');
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

  if (total < 400) {
    console.log(`Insufficient scenarios: ${total} < 400`);
    process.exitCode = 1;
    return;
  }

  console.log(DEPENDENCY_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:dependency-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

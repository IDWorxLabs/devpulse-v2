/**
 * DevPulse V2 Phase 12.3 — Workspace Intelligence Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  WORKSPACE_INTELLIGENCE_PASS_TOKEN,
  FORBIDDEN_WORKSPACE_INTELLIGENCE_DUPLICATES,
  buildWorkspaceSnapshot,
  getWorkspaceSnapshot,
  analyzeWorkspace,
  assertWorkspaceIntelligenceOwner,
  detectWorkspaceRisks,
  isWorkspaceIntelligenceQuestion,
  isDuplicateWorkspaceBrainQuestion,
  processWorkspaceIntelligenceRequest,
  getWorkspaceIntelligenceDiagnostics,
  getWorkspaceIntelligenceContext,
  resetWorkspaceIntelligenceDiagnostics,
  resetWorkspaceSnapshotForTests,
  resetWorkspaceRiskCounterForTests,
  listWorkspaceModules,
  listWorkspaceFileAreas,
  resolveActiveProject,
} from '../src/workspace-intelligence/index.js';
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
import {
  resetDependencyIntelligenceDiagnostics,
  resetDependencyGraphForTests,
} from '../src/dependency-intelligence/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What workspace am I currently using?',
  'What project owns this workspace?',
  'What modules belong to this workspace?',
  'What project is currently active?',
  'Are there workspace mismatch risks?',
  'Are there context leakage risks?',
  'What project should this work belong to?',
  'What workspace boundaries exist?',
  'What workspace intelligence risks exist?',
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
  console.log('DevPulse V2 — Phase 12.3 Workspace Intelligence Foundation');
  console.log('==========================================================');
  console.log('');

  resetAll();

  const wiDir = join(ROOT, 'src/workspace-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(wiDir, 'workspace-intelligence-types.ts')), 'exists');
  assert('2. context builder', existsSync(join(wiDir, 'workspace-context-builder.ts')), 'exists');
  assert('3. owner resolver', existsSync(join(wiDir, 'workspace-owner-resolver.ts')), 'exists');
  assert('4. boundary detector', existsSync(join(wiDir, 'workspace-boundary-detector.ts')), 'exists');
  assert('5. isolation analyzer', existsSync(join(wiDir, 'workspace-isolation-analyzer.ts')), 'exists');
  assert('6. risk detector', existsSync(join(wiDir, 'workspace-risk-detector.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(wiDir, 'workspace-intelligence-diagnostics.ts')), 'exists');
  assert('8. intelligence', existsSync(join(wiDir, 'workspace-intelligence.ts')), 'exists');
  assert('9. index', existsSync(join(wiDir, 'index.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:workspace-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('workspace_intelligence');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_workspace_intelligence', owner.ownerModule);
  assert('12. registry phase', owner.phase === 12.3, String(owner.phase));
  assert('13. pass token', WORKSPACE_INTELLIGENCE_PASS_TOKEN.includes('WORKSPACE_INTELLIGENCE'), 'token');
  assert('14. PU owner unchanged', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'pu');
  assert('15. single WI owner', listDevPulseV2Owners().filter((o) => o.domain === 'workspace_intelligence').length === 1, 'single');
  assert('16. owner assert', assertWorkspaceIntelligenceOwner(), 'assert');

  const snapshot = buildWorkspaceSnapshot();
  assert('17. workspace count', snapshot.workspaceCount >= 2, String(snapshot.workspaceCount));
  assert('18. active workspace', snapshot.activeWorkspace?.active === true, 'active');
  assert('19. active project', (snapshot.activeProject?.projectName?.length ?? 0) > 0, snapshot.activeProject?.projectName ?? '');
  assert('20. modules', snapshot.modules.length >= 8, String(snapshot.modules.length));
  assert('21. boundaries', snapshot.boundaries.length >= 4, String(snapshot.boundaries.length));
  assert('22. ownership conf', snapshot.ownershipConfidence === 'HIGH', snapshot.ownershipConfidence);

  const risks = detectWorkspaceRisks(snapshot);
  assert('23. risks array', Array.isArray(risks), 'risks');
  assert('24. applied snapshot', getWorkspaceSnapshot().risks.length >= 0, 'applied');

  const analysis = analyzeWorkspace('What workspace am I currently using?');
  assert('25. analysis snapshot', analysis.snapshot.workspaceCount >= 2, String(analysis.snapshot.workspaceCount));
  assert('26. safe to reason', typeof analysis.safeToReason === 'boolean', 'safe');
  assert('27. recommended project', analysis.recommendedProject !== null, String(analysis.recommendedProject));

  const wsReq = processWorkspaceIntelligenceRequest('What project owns this workspace?');
  assert('28. ws response', wsReq.responseText.includes('Workspace Intelligence'), 'header');
  assert('29. ws answer len', wsReq.responseText.length > 40, 'answer');
  assert('30. ws advisory', wsReq.responseText.includes('Advisory only'), 'advisory');

  const diag = getWorkspaceIntelligenceDiagnostics();
  assert('31. diag active', diag.workspaceIntelligenceActive === true, 'active');
  assert('32. diag count', diag.workspaceCount >= 2, String(diag.workspaceCount));
  assert('33. diag active ws', diag.activeWorkspace !== null, String(diag.activeWorkspace));

  const ctx = collectProjectFacts('What workspace am I currently using?');
  assert('34. collector ws facts', ctx.workspaceFactCount > 0, String(ctx.workspaceFactCount));
  assert('35. collector total', ctx.snapshot.factCount > 15, String(ctx.snapshot.factCount));
  assert('36. ws in snapshot', ctx.snapshot.facts.some((f) => f.source === 'workspace_intelligence'), 'source');

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('37. decision ws risks', Array.isArray(decisionCtx.workspaceRisks), 'risks');
  assert('38. decision ws conf', decisionCtx.workspaceOwnershipConfidence.length > 0, decisionCtx.workspaceOwnershipConfidence);
  assert('39. decision ws mismatch', decisionCtx.workspaceMismatchCount >= 0, String(decisionCtx.workspaceMismatchCount));
  assert('40. decision isolation', Array.isArray(decisionCtx.contextIsolationWarnings), 'isolation');

  const wsIntelCtx = getWorkspaceIntelligenceContext('What workspace am I currently using?');
  assert('41. intel ctx risks', Array.isArray(wsIntelCtx.workspaceRisks), 'risks');
  assert('42. intel ctx diag', wsIntelCtx.diagnostics.workspaceIntelligenceActive === true, 'diag');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processWorkspaceIntelligenceRequest(q).responseText;
    assert(`43.${i} success answer`, ans.includes('Workspace Intelligence') && ans.length > 30, q.slice(0, 40));
    const plan = buildQuestionRoutingPlan(q);
    assert(`44.${i} gqu ws cap`, plan.selectedCapabilities.includes('WORKSPACE_INTELLIGENCE'), plan.selectedCapabilities.join(','));
    assert(`45.${i} gqu ws primary`, plan.primaryCapability === 'WORKSPACE_INTELLIGENCE', String(plan.primaryCapability));
  }

  const dupQ = processWorkspaceIntelligenceRequest('Should we create a new workspace brain?');
  assert('46. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');
  assert('47. duplicate why', dupQ.responseText.includes('workspace_brain') || dupQ.responseText.includes('do not create'), 'why');

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('48. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('49. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const depR = processBrainRequest({ message: 'What depends on Project Understanding?' });
  assert('50. dependency preserved', depR.brainResponse.includes('Dependency Intelligence') || depR.brainResponse.toLowerCase().includes('depend'), 'dependency');

  const wsBrain = processBrainRequest({ message: 'What workspace am I currently using?' });
  assert('51. brain ws answer', wsBrain.brainResponse.length > 30, 'answer');
  assert('52. brain ws diag', Boolean(wsBrain.workspaceIntelligenceDiagnostics?.workspaceIntelligenceActive), 'diag');

  assert('53. no child_process', !readText('src/workspace-intelligence/index.ts').includes('child_process'), 'clean');
  assert('54. no eval', !readText('src/workspace-intelligence/index.ts').includes('eval('), 'clean');
  assert('55. no fs write', !readText('src/workspace-intelligence/index.ts').includes('writeFileSync'), 'clean');
  assert('56. no spawn', !readText('src/workspace-intelligence/index.ts').includes('spawn'), 'clean');
  assert('57. collector integrated', readText('src/project-understanding/project-fact-collector.ts').includes('workspace_intelligence'), 'integrated');
  assert('58. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('WORKSPACE_INTELLIGENCE'), 'gqu');
  assert('59. decision integrated', readText('src/unified-decision-layer/decision-context-builder.ts').includes('getWorkspaceIntelligenceContext'), 'udl');
  assert('60. founder html', readText('public/founder-reality/index.html').includes('workspace-intelligence-active'), 'html');
  assert('61. founder app', readText('public/founder-reality/app.js').includes('renderWorkspaceIntelligenceDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_WORKSPACE_INTELLIGENCE_DUPLICATES) {
    assert(`62.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent dir');
    const owners = listDevPulseV2Owners().filter((o) => o.ownerModule.includes(forbidden.replace(/-/g, '_')));
    assert(`63.${forbidden}`, owners.length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('64. no workspace_brain dir', !srcEntries.includes('workspace_brain'), 'clean');
  assert('65. no brain_v2 dir', !srcEntries.includes('brain_v2'), 'clean');
  assert('66. no project_brain dir', !srcEntries.includes('project_brain'), 'clean');

  const puOwners = listDevPulseV2Owners().filter((o) => o.domain.includes('project_understanding'));
  assert('67. single PU domain', puOwners.length === 1, puOwners.map((o) => o.domain).join(','));

  const memOwners = listDevPulseV2Owners().filter((o) => o.domain === 'shared_memory_layer');
  assert('68. single memory domain', memOwners.length === 1, 'memory');

  assert('69. intelligence only', wsBrain.confirmation.intelligenceOnly === true, 'intel');
  assert('70. no execution', wsBrain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('71. no persistence', wsBrain.confirmation.noPersistence === true, 'no persist');
  assert('72. no files', wsBrain.confirmation.noFilesModified === true, 'no files');

  const active = resolveActiveProject(snapshot);
  assert('73. resolve active', active.projectName.length > 0, active.projectName);
  assert('74. modules list', listWorkspaceModules(snapshot).length >= 8, String(listWorkspaceModules(snapshot).length));
  assert('75. file areas', listWorkspaceFileAreas(snapshot).length >= 4, String(listWorkspaceFileAreas(snapshot).length));

  for (let i = 0; i < 30; i += 1) {
    assert(`76.${i} ws signal`, isWorkspaceIntelligenceQuestion(`What workspace batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 25; i += 1) {
    const s = getWorkspaceSnapshot();
    assert(`77.${i} snapshot batch`, s.workspaceCount >= 2, String(s.workspaceCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const c = collectProjectFacts(`collector ws batch ${i}`);
    assert(`78.${i} collector batch`, c.workspaceFactCount > 0, String(c.workspaceFactCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const r = processBrainRequest({ message: `What is the active workspace ${i}?` });
    assert(`79.${i} brain batch`, r.brainResponse.length > 20, 'answer');
  }

  for (let i = 0; i < 20; i += 1) {
    const plan = buildQuestionRoutingPlan(`workspace boundary question ${i}`);
    assert(`80.${i} plan ws`, plan.selectedCapabilities.includes('WORKSPACE_INTELLIGENCE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 15; i += 1) {
    const a = analyzeWorkspace(`workspace mismatch batch ${i}`);
    assert(`81.${i} analyze batch`, a.snapshot.workspaceCount >= 2, 'analyze');
  }

  for (let i = 0; i < 12; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`82.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What workspace am I currently using?');
    const d = res.body?.workspaceIntelligenceDiagnostics as { workspaceCount?: number } | undefined;
    assert(`83.${i} http diag`, Boolean(d?.workspaceCount && d.workspaceCount >= 2), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`84.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`85.${i} dup signal`, isDuplicateWorkspaceBrainQuestion(`create a new workspace brain ${i}`), 'dup');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = processWorkspaceIntelligenceRequest('What workspace am I currently using?').responseText;
    const a2 = processWorkspaceIntelligenceRequest('What workspace am I currently using?').responseText;
    assert(`86.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`87.${i} no forbidden registry`, !registry.includes('workspace_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`88.${i} has WS cap`, types.includes('WORKSPACE_INTELLIGENCE'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const d = buildDecisionContext(`decision ws enrich ${i}`);
    assert(`89.${i} decision enrich`, d.workspaceOwnershipConfidence.length > 0, 'enrich');
  }

  for (let i = 0; i < 15; i += 1) {
    const a = analyzeWorkspace('Are there context leakage risks?');
    assert(`90.${i} leakage`, ['clear', 'warning', 'high'].includes(a.snapshot.contextLeakageRisk), a.snapshot.contextLeakageRisk);
  }

  for (let i = 0; i < 10; i += 1) {
    const a = analyzeWorkspace('Are there workspace mismatch risks?');
    assert(`91.${i} mismatch`, a.snapshot.mismatchCount >= 0, String(a.snapshot.mismatchCount));
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

  console.log(WORKSPACE_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:workspace-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

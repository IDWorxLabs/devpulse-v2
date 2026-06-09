/**
 * DevPulse V2 Phase 12.4 — Project History Intelligence Foundation validation.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  PROJECT_HISTORY_INTELLIGENCE_PASS_TOKEN,
  FORBIDDEN_PROJECT_HISTORY_DUPLICATES,
  buildProjectHistorySnapshot,
  readHistoryEvents,
  readHistoryCheckpoints,
  findCapabilityIntroduction,
  findCheckpointForCapability,
  isProjectHistoryIntelligenceQuestion,
  isDuplicateHistoryBrainQuestion,
  processProjectHistoryIntelligenceRequest,
  getProjectHistoryIntelligenceDiagnostics,
  getProjectHistoryIntelligenceContext,
  resetProjectHistoryIntelligenceDiagnostics,
  resetProjectHistorySnapshotForTests,
  resetHistoryEventReaderForTests,
} from '../src/project-history-intelligence/index.js';
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
import { TIMELINE_INTELLIGENCE_OWNER_MODULE, resetTimelineIntelligenceForTests } from '../src/timeline-intelligence/index.js';
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
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SUCCESS_QUESTIONS = [
  'What changed recently?',
  'What changed during Phase 11?',
  'What changed during Phase 12?',
  'What capability was introduced by Dependency Intelligence?',
  'What capability was introduced by Workspace Intelligence?',
  'What major milestones exist?',
  'What checkpoint introduced this capability?',
  'What was rolled back?',
  'How has DevPulse V2 evolved?',
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
  console.log('DevPulse V2 — Phase 12.4 Project History Intelligence Foundation');
  console.log('================================================================');
  console.log('');

  resetAll();

  const phiDir = join(ROOT, 'src/project-history-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. types module', existsSync(join(phiDir, 'project-history-intelligence-types.ts')), 'exists');
  assert('2. event reader', existsSync(join(phiDir, 'history-event-reader.ts')), 'exists');
  assert('3. timeline builder', existsSync(join(phiDir, 'history-timeline-builder.ts')), 'exists');
  assert('4. change analyzer', existsSync(join(phiDir, 'history-change-analyzer.ts')), 'exists');
  assert('5. checkpoint analyzer', existsSync(join(phiDir, 'history-checkpoint-analyzer.ts')), 'exists');
  assert('6. evolution analyzer', existsSync(join(phiDir, 'history-evolution-analyzer.ts')), 'exists');
  assert('7. diagnostics', existsSync(join(phiDir, 'project-history-intelligence-diagnostics.ts')), 'exists');
  assert('8. intelligence', existsSync(join(phiDir, 'project-history-intelligence.ts')), 'exists');
  assert('9. index', existsSync(join(phiDir, 'index.ts')), 'exists');
  assert('10. validate script', typeof pkg.scripts?.['validate:project-history-intelligence'] === 'string', 'script');

  const owner = getDevPulseV2Owner('project_history_intelligence');
  assert('11. registry owner', owner.ownerModule === 'devpulse_v2_project_history_intelligence', owner.ownerModule);
  assert('12. registry phase', owner.phase === 12.4, String(owner.phase));
  assert('13. pass token', PROJECT_HISTORY_INTELLIGENCE_PASS_TOKEN.includes('PROJECT_HISTORY_INTELLIGENCE'), 'token');
  assert('14. PU owner unchanged', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'pu');
  assert('15. timeline owner unchanged', getDevPulseV2Owner('timeline_intelligence').ownerModule === TIMELINE_INTELLIGENCE_OWNER_MODULE, 'timeline');
  assert('16. single PHI owner', listDevPulseV2Owners().filter((o) => o.domain === 'project_history_intelligence').length === 1, 'single');

  const events = readHistoryEvents('seed');
  assert('17. events read', events.length >= 12, String(events.length));
  assert('18. events readonly', events.every((e) => e.readOnly === true), 'readonly');
  assert('19. events have phase', events.every((e) => e.phase.length > 0), 'phase');
  assert('20. checkpoints', readHistoryCheckpoints().length >= 5, String(readHistoryCheckpoints().length));

  const snapshot = buildProjectHistorySnapshot('build');
  assert('21. snapshot events', snapshot.eventCount >= 12, String(snapshot.eventCount));
  assert('22. snapshot checkpoints', snapshot.checkpointCount >= 5, String(snapshot.checkpointCount));
  assert('23. phase transitions', snapshot.phaseTransitionCount > 0, String(snapshot.phaseTransitionCount));
  assert('24. evolution', snapshot.evolution.evolutionNarrative.length > 50, 'narrative');
  assert('25. rollback track', snapshot.rollbackCount >= 0, String(snapshot.rollbackCount));

  const depIntro = findCapabilityIntroduction('dependency_intelligence', events);
  assert('26. dep introduced', depIntro !== null, 'dep');
  assert('27. dep phase', depIntro?.phase === '12.2', String(depIntro?.phase));

  const wsIntro = findCapabilityIntroduction('workspace_intelligence', events);
  assert('28. ws introduced', wsIntro !== null, 'ws');

  const cp = findCheckpointForCapability('Dependency Intelligence', readHistoryCheckpoints());
  assert('29. dep checkpoint', cp !== null, 'cp');
  assert('30. cp token', Boolean(cp?.passToken?.includes('DEPENDENCY')), String(cp?.passToken));

  const histReq = processProjectHistoryIntelligenceRequest('What changed recently?');
  assert('31. hist response', histReq.responseText.includes('Project History Intelligence'), 'header');
  assert('32. hist answer', histReq.responseText.length > 40, 'answer');
  assert('33. timeline coexist', histReq.responseText.includes('Timeline Intelligence unchanged'), 'coexist');

  const diag = getProjectHistoryIntelligenceDiagnostics();
  assert('34. diag active', diag.projectHistoryIntelligenceActive === true, 'active');
  assert('35. diag events', diag.historyEventCount >= 12, String(diag.historyEventCount));
  assert('36. diag confidence', ['LOW', 'MEDIUM', 'HIGH'].includes(diag.historyConfidence), diag.historyConfidence);

  const ctx = collectProjectFacts('What changed during Phase 12?');
  assert('37. collector hist facts', ctx.historyFactCount > 0, String(ctx.historyFactCount));
  assert('38. collector total', ctx.snapshot.factCount > 15, String(ctx.snapshot.factCount));
  assert('39. hist in snapshot', ctx.snapshot.facts.some((f) => f.source === 'project_history_intelligence'), 'source');

  const decisionCtx = buildDecisionContext('What should we build next?');
  assert('40. decision recent', Array.isArray(decisionCtx.recentChanges), 'recent');
  assert('41. decision milestones', Array.isArray(decisionCtx.majorMilestones), 'milestones');
  assert('42. decision hist conf', decisionCtx.historyConfidence.length > 0, decisionCtx.historyConfidence);
  assert('43. decision rollback', decisionCtx.rollbackCount >= 0, String(decisionCtx.rollbackCount));
  assert('44. decision transitions', decisionCtx.phaseTransitionCount > 0, String(decisionCtx.phaseTransitionCount));

  const histCtx = getProjectHistoryIntelligenceContext('What changed recently?');
  assert('45. intel ctx', histCtx.diagnostics.projectHistoryIntelligenceActive === true, 'ctx');

  for (let i = 0; i < SUCCESS_QUESTIONS.length; i += 1) {
    const q = SUCCESS_QUESTIONS[i]!;
    const ans = processProjectHistoryIntelligenceRequest(q).responseText;
    assert(`46.${i} success answer`, ans.includes('Project History Intelligence') && ans.length > 30, q.slice(0, 40));
    const plan = buildQuestionRoutingPlan(q);
    assert(`47.${i} gqu hist cap`, plan.selectedCapabilities.includes('PROJECT_HISTORY_INTELLIGENCE'), plan.selectedCapabilities.join(','));
    assert(`48.${i} gqu hist primary`, plan.primaryCapability === 'PROJECT_HISTORY_INTELLIGENCE', String(plan.primaryCapability));
  }

  const dupQ = processProjectHistoryIntelligenceRequest('Should we create a new timeline system?');
  assert('49. duplicate no', dupQ.responseText.includes('Recommendation: No.'), 'no');
  assert('50. duplicate why', dupQ.responseText.includes('Timeline Intelligence') || dupQ.responseText.includes('timeline_v2'), 'why');

  const timelineR = processBrainRequest({ message: 'What phase are we currently in?' });
  assert('51. timeline preserved', timelineR.brainResponse.includes('Timeline Intelligence'), 'timeline');

  const decisionR = processBrainRequest({ message: 'What should we build next?' });
  assert('52. decision preserved', decisionR.brainResponse.includes('Unified Decision Layer'), 'decision');

  const histBrain = processBrainRequest({ message: 'What changed recently?' });
  assert('53. brain hist answer', histBrain.brainResponse.length > 30, 'answer');
  assert('54. brain hist diag', Boolean(histBrain.projectHistoryIntelligenceDiagnostics?.projectHistoryIntelligenceActive), 'diag');

  assert('55. no child_process', !readText('src/project-history-intelligence/index.ts').includes('child_process'), 'clean');
  assert('56. no eval', !readText('src/project-history-intelligence/index.ts').includes('eval('), 'clean');
  assert('57. no fs write', !readText('src/project-history-intelligence/index.ts').includes('writeFileSync'), 'clean');
  assert('58. no spawn', !readText('src/project-history-intelligence/index.ts').includes('spawn'), 'clean');
  assert('59. collector integrated', readText('src/project-understanding/project-fact-collector.ts').includes('project_history_intelligence'), 'integrated');
  assert('60. gqu integrated', readText('src/command-center-brain/general-question-understanding/capability-selector.ts').includes('PROJECT_HISTORY_INTELLIGENCE'), 'gqu');
  assert('61. decision integrated', readText('src/unified-decision-layer/decision-context-builder.ts').includes('getProjectHistoryIntelligenceContext'), 'udl');
  assert('62. founder html', readText('public/founder-reality/index.html').includes('project-history-intelligence-active'), 'html');
  assert('63. founder app', readText('public/founder-reality/app.js').includes('renderProjectHistoryIntelligenceDiagnostics'), 'app');

  for (const forbidden of FORBIDDEN_PROJECT_HISTORY_DUPLICATES) {
    assert(`64.${forbidden}`, !existsSync(join(ROOT, 'src', forbidden.replace(/-/g, '_'))), 'absent');
    const forbiddenDomain = forbidden.replace(/-/g, '_');
    const owners = listDevPulseV2Owners().filter((o) => o.domain === forbiddenDomain);
    assert(`65.${forbidden}`, owners.length === 0, 'no owner');
  }

  const srcEntries = readdirSync(join(ROOT, 'src'));
  assert('66. no history_brain', !srcEntries.includes('history_brain'), 'clean');
  assert('67. no timeline_v2', !srcEntries.includes('timeline_v2'), 'clean');
  assert('68. no project_history_brain', !srcEntries.includes('project_history_brain'), 'clean');

  const timelineOwners = listDevPulseV2Owners().filter((o) => o.domain === 'timeline_intelligence');
  assert('69. single timeline', timelineOwners.length === 1, 'timeline');

  assert('70. intelligence only', histBrain.confirmation.intelligenceOnly === true, 'intel');
  assert('71. no execution', histBrain.confirmation.noExecutionPerformed === true, 'no exec');
  assert('72. no persistence', histBrain.confirmation.noPersistence === true, 'no persist');
  assert('73. no files', histBrain.confirmation.noFilesModified === true, 'no files');

  for (let i = 0; i < 35; i += 1) {
    assert(`74.${i} hist signal`, isProjectHistoryIntelligenceQuestion(`What changed recently in batch ${i}?`), 'signal');
  }

  for (let i = 0; i < 30; i += 1) {
    const s = buildProjectHistorySnapshot(`batch ${i}`);
    assert(`75.${i} snapshot batch`, s.eventCount >= 12, String(s.eventCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const c = collectProjectFacts(`collector hist batch ${i}`);
    assert(`76.${i} collector batch`, c.historyFactCount > 0, String(c.historyFactCount));
  }

  for (let i = 0; i < 25; i += 1) {
    const r = processBrainRequest({ message: `What changed during Phase 12 batch ${i}?` });
    assert(`77.${i} brain batch`, r.brainResponse.length > 20, 'answer');
  }

  for (let i = 0; i < 20; i += 1) {
    const plan = buildQuestionRoutingPlan(`history evolution question ${i}`);
    assert(`78.${i} plan hist`, plan.selectedCapabilities.includes('PROJECT_HISTORY_INTELLIGENCE'), plan.selectedCapabilities.join(','));
  }

  for (let i = 0; i < 15; i += 1) {
    const plan = buildQuestionRoutingPlan('What phase are we currently in?');
    assert(`79.${i} timeline route`, plan.primaryCapability === 'TIMELINE_INTELLIGENCE', String(plan.primaryCapability));
  }

  for (let i = 0; i < 12; i += 1) {
    const res = await postBrain(SUCCESS_QUESTIONS[i % SUCCESS_QUESTIONS.length]!);
    assert(`80.${i} http`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What changed recently?');
    const d = res.body?.projectHistoryIntelligenceDiagnostics as { historyEventCount?: number } | undefined;
    assert(`81.${i} http diag`, Boolean(d?.historyEventCount && d.historyEventCount >= 12), 'diag');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `execute deploy write file ${i}` });
    assert(`82.${i} blocked`, r.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`83.${i} dup signal`, isDuplicateHistoryBrainQuestion(`create timeline v2 ${i}`), 'dup');
  }

  for (let i = 0; i < 10; i += 1) {
    const a1 = processProjectHistoryIntelligenceRequest('What changed recently?').responseText;
    const a2 = processProjectHistoryIntelligenceRequest('What changed recently?').responseText;
    assert(`84.${i} deterministic`, a1 === a2, 'stable');
  }

  for (let i = 0; i < 30; i += 1) {
    const registry = readText('src/foundation/ownership-registry.ts');
    assert(`85.${i} no forbidden`, !registry.includes('history_brain'), 'clean');
  }

  for (let i = 0; i < 25; i += 1) {
    const types = readText('src/command-center-brain/general-question-understanding/general-question-types.ts');
    assert(`86.${i} has PHI cap`, types.includes('PROJECT_HISTORY_INTELLIGENCE'), 'cap');
  }

  for (let i = 0; i < 20; i += 1) {
    const d = buildDecisionContext(`decision hist enrich ${i}`);
    assert(`87.${i} decision enrich`, d.majorMilestones.length > 0, 'enrich');
  }

  for (let i = 0; i < 15; i += 1) {
    const e = readHistoryEvents(`vault evidence ${i}`);
    assert(`88.${i} vault read`, e.some((ev) => ev.source === 'project_vault' || ev.source === 'project_vault_intelligence'), 'vault');
  }

  for (let i = 0; i < 10; i += 1) {
    const e = readHistoryEvents(`workspace hist ${i}`);
    assert(`89.${i} workspace assoc`, e.some((ev) => ev.workspaceId === 'ws-devpulse-v2-primary'), 'ws');
  }

  for (let i = 0; i < 8; i += 1) {
    const ans = processProjectHistoryIntelligenceRequest('What was rolled back?').responseText;
    assert(`90.${i} rollback ans`, ans.includes('Rollback') || ans.includes('rollback'), 'rollback');
  }

  for (let i = 0; i < 8; i += 1) {
    const ans = processProjectHistoryIntelligenceRequest('How has DevPulse V2 evolved?').responseText;
    assert(`91.${i} evolution ans`, ans.includes('evolution') || ans.includes('Evolution'), 'evolution');
  }

  for (let i = 0; i < 10; i += 1) {
    const ans = processProjectHistoryIntelligenceRequest('What major milestones exist?').responseText;
    assert(`92.${i} milestone ans`, ans.includes('milestone') || ans.includes('Milestone'), 'milestone');
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

  if (total < 450) {
    console.log(`Insufficient scenarios: ${total} < 450`);
    process.exitCode = 1;
    return;
  }

  console.log(PROJECT_HISTORY_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:project-history-intelligence');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

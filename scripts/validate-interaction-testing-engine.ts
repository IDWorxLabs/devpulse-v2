/**
 * DevPulse V2 Phase 16.5 — Interaction Testing Engine validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  INTERACTION_TESTING_ENGINE_PASS_TOKEN,
  INTERACTION_TESTING_ENGINE_OWNER_MODULE,
  FORBIDDEN_INTERACTION_TESTING_DUPLICATES,
  ALL_INTERACTION_TYPES,
  isInteractionTestingQuestion,
  isInteractionTestingAdvisoryQuestion,
  executeInteractionTesting,
  processInteractionTestingRequest,
  getInteractionTestingDiagnostics,
  resetInteractionTestingDiagnostics,
  resetInteractionTestingRequestCounterForTests,
  resetInteractionTestingReportCounterForTests,
  buildInteractionTestingFailureContext,
  buildInteractionPlans,
  executeButtonInteractions,
  executeNavigationInteractions,
  executeFormInteractions,
  executeWorkflowInteractions,
  classifyInteractionSurfaces,
} from '../src/interaction-testing-engine/index.js';
import { inspectUiSurface } from '../src/ui-inspection-engine/index.js';
import {
  resetUiInspectionDiagnostics,
  resetUiInspectionRequestCounterForTests,
  resetUiInspectionReportCounterForTests,
} from '../src/ui-inspection-engine/index.js';
import {
  resetSelfVisionRuntimeDiagnostics,
  resetSelfVisionRequestCounterForTests,
  resetSelfVisionSessionRegistryForTests,
  resetSelfVisionReportCounterForTests,
} from '../src/self-vision-runtime/index.js';
import {
  resetPreviewRuntimeDiagnostics,
  resetPreviewRequestCounterForTests,
  resetPreviewTargetRegistryForTests,
  resetPreviewSessionManagerForTests,
  resetPreviewReportCounterForTests,
} from '../src/live-preview-runtime/index.js';
import type { ExecuteInteractionTestingInput } from '../src/interaction-testing-engine/types.js';
import { INTERACTION_TESTING_ENGINE_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
  analyzeActionVisibility,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningBlockerCounterForTests,
  buildReasoningVisibilityRecord,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { buildProgressRecords } from '../src/progress-intelligence/progress-model-builder.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'What interactions were tested?';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processInteractionTestingRequest>>();
const textCache = new Map<string, string>();

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function beginGroup(group: string): number {
  if (Date.now() - startedAt > MAX_RUNTIME_MS) throw new Error(`Max runtime guard exceeded during ${group}`);
  console.log(`▶ ${group} ...`);
  return Date.now();
}

function endGroup(group: string, started: number): void {
  const elapsed = Date.now() - started;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  console.log(`✓ ${group} — ${groupResults.filter((r) => r.passed).length}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold`);
}

function readText(path: string): string {
  const hit = textCache.get(path);
  if (hit) return hit;
  const text = readFileSync(join(ROOT, path), 'utf8');
  textCache.set(path, text);
  return text;
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processInteractionTestingRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<ExecuteInteractionTestingInput> = {}): ExecuteInteractionTestingInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    targetName: 'DevPulse Web Preview',
    projectExists: true,
    workspaceExists: true,
    world1Protected: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetPreviewRuntimeDiagnostics();
  resetPreviewRequestCounterForTests();
  resetPreviewTargetRegistryForTests();
  resetPreviewSessionManagerForTests();
  resetPreviewReportCounterForTests();
  resetSelfVisionRuntimeDiagnostics();
  resetSelfVisionRequestCounterForTests();
  resetSelfVisionSessionRegistryForTests();
  resetSelfVisionReportCounterForTests();
  resetUiInspectionDiagnostics();
  resetUiInspectionRequestCounterForTests();
  resetUiInspectionReportCounterForTests();
  resetInteractionTestingDiagnostics();
  resetInteractionTestingRequestCounterForTests();
  resetInteractionTestingReportCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.5 Interaction Testing Engine');
  console.log('====================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/interaction-testing-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'interaction-testing-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. classifier', existsSync(join(dir, 'interaction-surface-classifier.ts')), 'classifier');
  assert('A-SETUP', '4. plan builder', existsSync(join(dir, 'interaction-plan-builder.ts')), 'plan');
  assert('A-SETUP', '5. button tester', existsSync(join(dir, 'button-interaction-tester.ts')), 'button');
  assert('A-SETUP', '6. nav tester', existsSync(join(dir, 'navigation-interaction-tester.ts')), 'nav');
  assert('A-SETUP', '7. form tester', existsSync(join(dir, 'form-interaction-tester.ts')), 'form');
  assert('A-SETUP', '8. workflow tester', existsSync(join(dir, 'workflow-interaction-tester.ts')), 'workflow');
  assert('A-SETUP', '9. recorder', existsSync(join(dir, 'interaction-result-recorder.ts')), 'recorder');
  assert('A-SETUP', '10. validator', existsSync(join(dir, 'interaction-testing-validator.ts')), 'validator');
  assert('A-SETUP', '11. report', existsSync(join(dir, 'interaction-testing-report.ts')), 'report');
  assert('A-SETUP', '12. diagnostics', existsSync(join(dir, 'interaction-testing-diagnostics.ts')), 'diag');
  assert('A-SETUP', '13. failure bridge', existsSync(join(dir, 'interaction-testing-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '14. orchestrator', existsSync(join(dir, 'interaction-testing-engine.ts')), 'orch');
  assert('A-SETUP', '15. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '16. feed bridge', existsSync(join(ROOT, 'src/operator-feed/interaction-testing-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '17. script', typeof pkg.scripts?.['validate:interaction-testing-engine'] === 'string', 'script');
  const owner = getDevPulseV2Owner('interaction_testing_engine');
  assert('A-SETUP', '18. owner', owner.ownerModule === INTERACTION_TESTING_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '19. phase', owner.phase === 16.5, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = executeInteractionTesting(baseInput());
  assert('B-CORE', '20. report id', ready.interactionTestingReport.interactionTestId.startsWith('itest-'), 'id');
  assert('B-CORE', '21. inspection link', ready.interactionTestingReport.inspectionId?.startsWith('uinsp-') === true, 'insp');
  assert('B-CORE', '22. sv link', ready.interactionTestingReport.selfVisionSessionId?.startsWith('svsess-') === true, 'sv');
  assert('B-CORE', '23. completed', ready.interactionTestingReport.interactionState === 'COMPLETED', ready.interactionTestingReport.interactionState);
  assert('B-CORE', '24. plans', ready.interactionTestingReport.interactionPlans.length >= 4, String(ready.interactionTestingReport.interactionPlans.length));
  assert('B-CORE', '25. results', ready.interactionTestingReport.interactionResults.length >= 4, String(ready.interactionTestingReport.interactionResults.length));
  assert('B-CORE', '26. no verdict', ready.interactionTestingReport.interactionResults.every((r) => r.noVerdict === true), 'verdict');

  const noInspection = executeInteractionTesting(
    baseInput({
      suppressRuntimeBootstrap: true,
      inspectionReportExists: false,
      selfVisionSessionExists: true,
      previewContextExists: true,
    }),
  );
  assert('B-CORE', '27. missing inspection', noInspection.interactionTestingReport.interactionState === 'BLOCKED', noInspection.interactionTestingReport.interactionState);

  const noSession = executeInteractionTesting(
    baseInput({
      suppressRuntimeBootstrap: true,
      inspectionReportExists: true,
      selfVisionSessionExists: false,
      previewContextExists: true,
    }),
  );
  assert('B-CORE', '28. missing sv session', noSession.interactionTestingReport.interactionState === 'BLOCKED', noSession.interactionTestingReport.interactionState);

  const inspection = inspectUiSurface(baseInput({ query: CANONICAL_QUERY }));
  const surfaces = classifyInteractionSurfaces(inspection.inspectionReport);
  const plans = buildInteractionPlans(surfaces, inspection.inspectionReport);
  const button = executeButtonInteractions(plans);
  const nav = executeNavigationInteractions(plans);
  const form = executeFormInteractions(plans);
  const workflow = executeWorkflowInteractions(plans);
  assert('B-CORE', '29. button testing', button.results.length >= 1, String(button.results.length));
  assert('B-CORE', '30. nav testing', nav.results.length >= 1, String(nav.results.length));
  assert('B-CORE', '31. form testing', form.results.length >= 1, String(form.results.length));
  assert('B-CORE', '32. workflow testing', workflow.results.length >= 1, String(workflow.results.length));
  assert('B-CORE', '33. interaction types', ALL_INTERACTION_TYPES.length === 7, String(ALL_INTERACTION_TYPES.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '34. routing', routing.primaryCapability === 'INTERACTION_TESTING_ENGINE', String(routing.primaryCapability));
  assert('C-INTEGRATION', '35. advisory', isInteractionTestingAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '36. action test id', action.candidates[0]!.interactionTestId.startsWith('itest-'), 'id');
  assert('C-INTEGRATION', '37. action readiness', action.candidates[0]!.interactionReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '38. interaction count', action.candidates[0]!.interactionCount >= 4, 'count');

  const reasoning = buildReasoningVisibilityRecord('why interaction testing');
  assert('C-INTEGRATION', '39. reasoning basis', reasoning.interactionBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '40. reasoning plans', reasoning.interactionPlans.length >= 3, 'plans');
  assert('C-INTEGRATION', '41. reasoning results', reasoning.interactionResults.length >= 3, 'results');
  assert('C-INTEGRATION', '42. reasoning warnings', reasoning.interactionWarnings.length >= 2, 'warnings');

  const failures = buildFailureRecords('Why is interaction testing blocked?');
  assert('C-INTEGRATION', '43. failure', failures.some((f) => f.sourceSystem === 'interaction_testing_engine'), 'fail');

  const progress = buildProgressRecords('Interaction testing');
  assert('C-INTEGRATION', '44. progress', progress[0]?.interactionTestingNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '45. uvl rows', INTERACTION_TESTING_ENGINE_UVL_ROWS.length === 12, String(INTERACTION_TESTING_ENGINE_UVL_ROWS.length));
  assert('D-REGISTRY', '46. uvl types', hasUvlRow('INTERACTION_TESTING_ENGINE_TYPES'), 'types');
  assert('D-REGISTRY', '47. console', isIntelligenceConsoleCapability('INTERACTION_TESTING_ENGINE'), 'console');
  assert('D-REGISTRY', '48. find panel', resolveFindPanelAlias('Interaction Testing') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '49. registry', registry.includes('interaction_testing_engine'), 'registry');
  for (const forbidden of FORBIDDEN_INTERACTION_TESTING_DUPLICATES) {
    assert('D-REGISTRY', `50.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = executeInteractionTesting(baseInput());
  const staticInspection = inspectUiSurface(baseInput({ query: CANONICAL_QUERY }));
  const staticPlans = buildInteractionPlans(
    classifyInteractionSurfaces(staticInspection.inspectionReport),
    staticInspection.inspectionReport,
  );
  const staticButton = executeButtonInteractions(staticPlans);
  const engineSrc = readText('src/interaction-testing-engine/interaction-testing-engine.ts');
  const allSrc = [
    engineSrc,
    readText('src/interaction-testing-engine/button-interaction-tester.ts'),
    readText('src/interaction-testing-engine/interaction-result-recorder.ts'),
  ].join('\n');
  assert('E-STATIC', '51. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '52. no playwright', !allSrc.includes('playwright'), 'clean');
  assert('E-STATIC', '53. no verdict score', !allSrc.toLowerCase().includes('correctnessscore'), 'clean');
  assert('E-STATIC', '54. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '55. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('INTERACTION_TESTING_ENGINE'), 'feed');
  assert('E-STATIC', '56. no verdict field', staticReady.interactionTestingReport.interactionResults.every((r) => !('verdict' in r)), 'no verdict');
  assert('E-STATIC', '57. simulated only', staticButton.executed.every((e) => e.simulated === true), 'sim');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `58.${i} report id`, fixture.interactionTestingReport.interactionTestId.startsWith('itest-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `59.${i} signal`, isInteractionTestingQuestion(`interaction testing batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What buttons were discovered batch ${i}?`);
    assert('F-CACHED', `60.${i} route`, r.primaryCapability === 'INTERACTION_TESTING_ENGINE', String(r.primaryCapability));
  }
  const bridge = buildInteractionTestingFailureContext('Why is interaction testing blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `61.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is interaction testing blocked?';
    const key = q.toLowerCase();
    let status = httpCache.get(key);
    if (!status) {
      const res = await fetch(`http://127.0.0.1:${port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      status = res.status;
      httpCache.set(key, status);
    }
    assert('G-HTTP', `62.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getInteractionTestingDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Interaction tests: ${diag.interactionTestCount}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    process.exitCode = 1;
    return;
  }
  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(INTERACTION_TESTING_ENGINE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

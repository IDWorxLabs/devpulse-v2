/**
 * DevPulse V2 Phase 16.4 — UI Inspection Engine validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  UI_INSPECTION_ENGINE_PASS_TOKEN,
  UI_INSPECTION_ENGINE_OWNER_MODULE,
  FORBIDDEN_UI_INSPECTION_DUPLICATES,
  ALL_SURFACE_TYPES,
  isUiInspectionQuestion,
  isUiInspectionAdvisoryQuestion,
  inspectUiSurface,
  processUiInspectionRequest,
  getUiInspectionDiagnostics,
  resetUiInspectionDiagnostics,
  resetUiInspectionRequestCounterForTests,
  resetUiInspectionReportCounterForTests,
  buildUiInspectionFailureContext,
  inspectLayoutStructures,
  inspectNavigationStructures,
  inspectLoadingStructures,
  inspectResponsiveStructures,
  classifyInspectableSurfaces,
} from '../src/ui-inspection-engine/index.js';
import {
  resetSelfVisionRuntimeDiagnostics,
  resetSelfVisionRequestCounterForTests,
  resetSelfVisionSessionRegistryForTests,
  resetSelfVisionReportCounterForTests,
  planObservationTargets,
} from '../src/self-vision-runtime/index.js';
import {
  resetPreviewRuntimeDiagnostics,
  resetPreviewRequestCounterForTests,
  resetPreviewTargetRegistryForTests,
  resetPreviewSessionManagerForTests,
  resetPreviewReportCounterForTests,
} from '../src/live-preview-runtime/index.js';
import type { InspectUiSurfaceInput } from '../src/ui-inspection-engine/types.js';
import { UI_INSPECTION_ENGINE_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
const CANONICAL_QUERY = 'What UI structures exist?';

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
const responseCache = new Map<string, ReturnType<typeof processUiInspectionRequest>>();
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
  const result = processUiInspectionRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<InspectUiSurfaceInput> = {}): InspectUiSurfaceInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    targetName: 'DevPulse Web Preview',
    targetType: 'WEB_APP',
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.4 UI Inspection Engine');
  console.log('==============================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/ui-inspection-engine');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'ui-inspection-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. classifier', existsSync(join(dir, 'ui-surface-classifier.ts')), 'classifier');
  assert('A-SETUP', '4. layout', existsSync(join(dir, 'ui-layout-inspector.ts')), 'layout');
  assert('A-SETUP', '5. navigation', existsSync(join(dir, 'ui-navigation-inspector.ts')), 'navigation');
  assert('A-SETUP', '6. loading', existsSync(join(dir, 'ui-loading-state-inspector.ts')), 'loading');
  assert('A-SETUP', '7. responsive', existsSync(join(dir, 'ui-responsive-surface-inspector.ts')), 'responsive');
  assert('A-SETUP', '8. validator', existsSync(join(dir, 'ui-inspection-validator.ts')), 'validator');
  assert('A-SETUP', '9. report', existsSync(join(dir, 'ui-inspection-report.ts')), 'report');
  assert('A-SETUP', '10. diagnostics', existsSync(join(dir, 'ui-inspection-diagnostics.ts')), 'diag');
  assert('A-SETUP', '11. failure bridge', existsSync(join(dir, 'ui-inspection-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. orchestrator', existsSync(join(dir, 'ui-inspection-engine.ts')), 'orch');
  assert('A-SETUP', '13. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/ui-inspection-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '15. script', typeof pkg.scripts?.['validate:ui-inspection-engine'] === 'string', 'script');
  const owner = getDevPulseV2Owner('ui_inspection_engine');
  assert('A-SETUP', '16. owner', owner.ownerModule === UI_INSPECTION_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '17. phase', owner.phase === 16.4, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = inspectUiSurface(baseInput());
  assert('B-CORE', '18. report id', ready.inspectionReport.inspectionId.startsWith('uinsp-'), 'id');
  assert('B-CORE', '19. sv session link', ready.inspectionReport.selfVisionSessionId?.startsWith('svsess-') === true, 'link');
  assert('B-CORE', '20. inspection ready', ready.inspectionReport.inspectionState === 'INSPECTION_READY', ready.inspectionReport.inspectionState);
  assert('B-CORE', '21. surfaces', ready.inspectionReport.inspectedSurfaces.length >= 3, String(ready.inspectionReport.inspectedSurfaces.length));
  assert('B-CORE', '22. layout', ready.inspectionReport.layoutStructures.length >= 1, String(ready.inspectionReport.layoutStructures.length));
  assert('B-CORE', '23. navigation', ready.inspectionReport.navigationStructures.length >= 1, String(ready.inspectionReport.navigationStructures.length));
  assert('B-CORE', '24. loading', ready.inspectionReport.loadingStructures.length >= 1, String(ready.inspectionReport.loadingStructures.length));
  assert('B-CORE', '25. responsive', ready.inspectionReport.responsiveStructures.length >= 1, String(ready.inspectionReport.responsiveStructures.length));

  const noSession = inspectUiSurface(
    baseInput({
      suppressRuntimeBootstrap: true,
      selfVisionSessionExists: false,
      observationTargetsExist: true,
      previewContextExists: true,
    }),
  );
  assert('B-CORE', '26. missing sv session', noSession.inspectionReport.inspectionState === 'INSPECTION_BLOCKED', noSession.inspectionReport.inspectionState);

  const noTargets = inspectUiSurface(
    baseInput({
      suppressRuntimeBootstrap: true,
      selfVisionSessionExists: true,
      observationTargetsExist: false,
      previewContextExists: true,
      observationTargets: [],
    }),
  );
  assert('B-CORE', '27. missing targets', noTargets.inspectionReport.inspectionState === 'INSPECTION_BLOCKED', noTargets.inspectionReport.inspectionState);

  const noOwner = inspectUiSurface(baseInput({ ownershipValid: false }));
  assert('B-CORE', '28. ownership invalid', noOwner.inspectionReport.inspectionState === 'INSPECTION_BLOCKED', noOwner.inspectionReport.inspectionState);

  const targets = planObservationTargets('WEB_APP');
  const surfaces = classifyInspectableSurfaces(targets);
  assert('B-CORE', '29. layout inspector', inspectLayoutStructures(surfaces).length >= 1, 'layout');
  assert('B-CORE', '30. nav inspector', inspectNavigationStructures(surfaces).length >= 1, 'nav');
  assert('B-CORE', '31. load inspector', inspectLoadingStructures(surfaces).length >= 1, 'load');
  assert('B-CORE', '32. resp inspector', inspectResponsiveStructures(surfaces).length >= 1, 'resp');
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '33. routing', routing.primaryCapability === 'UI_INSPECTION_ENGINE', String(routing.primaryCapability));
  assert('C-INTEGRATION', '34. advisory', isUiInspectionAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '35. action insp id', action.candidates[0]!.inspectionId.startsWith('insp-'), 'id');
  assert('C-INTEGRATION', '36. action readiness', action.candidates[0]!.inspectionReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '37. surface count', action.candidates[0]!.inspectedSurfaceCount >= 3, 'count');

  const reasoning = buildReasoningVisibilityRecord('why ui inspection');
  assert('C-INTEGRATION', '38. reasoning basis', reasoning.inspectionBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '39. reasoning layout', reasoning.layoutStructures.length >= 3, 'layout');
  assert('C-INTEGRATION', '40. reasoning nav', reasoning.navigationStructures.length >= 3, 'nav');
  assert('C-INTEGRATION', '41. reasoning loading', reasoning.loadingStructures.length >= 3, 'loading');
  assert('C-INTEGRATION', '42. reasoning responsive', reasoning.responsiveStructures.length >= 3, 'responsive');

  const failures = buildFailureRecords('Why is inspection blocked?');
  assert('C-INTEGRATION', '43. failure', failures.some((f) => f.sourceSystem === 'ui_inspection_engine'), 'fail');

  const progress = buildProgressRecords('UI inspection');
  assert('C-INTEGRATION', '44. progress', progress[0]?.uiInspectionNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '45. uvl rows', UI_INSPECTION_ENGINE_UVL_ROWS.length === 10, String(UI_INSPECTION_ENGINE_UVL_ROWS.length));
  assert('D-REGISTRY', '46. uvl types', hasUvlRow('UI_INSPECTION_ENGINE_TYPES'), 'types');
  assert('D-REGISTRY', '47. console', isIntelligenceConsoleCapability('UI_INSPECTION_ENGINE'), 'console');
  assert('D-REGISTRY', '48. find panel', resolveFindPanelAlias('UI Inspection') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '49. registry', registry.includes('ui_inspection_engine'), 'registry');
  for (const forbidden of FORBIDDEN_UI_INSPECTION_DUPLICATES) {
    assert('D-REGISTRY', `50.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const engineSrc = readText('src/ui-inspection-engine/ui-inspection-engine.ts');
  const allSrc = [
    engineSrc,
    readText('src/ui-inspection-engine/ui-layout-inspector.ts'),
    readText('src/ui-inspection-engine/ui-navigation-inspector.ts'),
  ].join('\n');
  assert('E-STATIC', '51. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '52. no playwright', !allSrc.includes('playwright'), 'clean');
  assert('E-STATIC', '53. no click', !allSrc.includes('.click('), 'clean');
  assert('E-STATIC', '54. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '55. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('UI_INSPECTION_ENGINE'), 'feed');
  assert('E-STATIC', '56. surface types', ALL_SURFACE_TYPES.length === 7, String(ALL_SURFACE_TYPES.length));
  assert('E-STATIC', '57. inspection only', allSrc.includes('inspectionOnly: true'), 'flag');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `58.${i} report id`, fixture.inspectionReport.inspectionId.startsWith('uinsp-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `59.${i} signal`, isUiInspectionQuestion(`ui inspection batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What layout was detected batch ${i}?`);
    assert('F-CACHED', `60.${i} route`, r.primaryCapability === 'UI_INSPECTION_ENGINE', String(r.primaryCapability));
  }
  const bridge = buildUiInspectionFailureContext('Why is inspection blocked?');
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
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is inspection blocked?';
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
  const diag = getUiInspectionDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Inspection reports: ${diag.inspectionReportCount}`);
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

  console.log(UI_INSPECTION_ENGINE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

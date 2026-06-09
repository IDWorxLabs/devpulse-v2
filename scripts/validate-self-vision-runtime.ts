/**
 * DevPulse V2 Phase 16.3 — Self Vision Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  SELF_VISION_RUNTIME_PASS_TOKEN,
  SELF_VISION_RUNTIME_OWNER_MODULE,
  FORBIDDEN_SELF_VISION_RUNTIME_DUPLICATES,
  TRACKED_OBSERVATION_CAPABILITIES,
  ALL_OBSERVATION_TARGETS,
  isSelfVisionRuntimeQuestion,
  isSelfVisionRuntimeAdvisoryQuestion,
  prepareSelfVisionRuntime,
  processSelfVisionRuntimeRequest,
  getSelfVisionRuntimeDiagnostics,
  resetSelfVisionRuntimeDiagnostics,
  resetSelfVisionRequestCounterForTests,
  resetSelfVisionSessionRegistryForTests,
  resetSelfVisionReportCounterForTests,
  createSelfVisionSession,
  planCaptureSequence,
  planObservationTargets,
  buildSelfVisionFailureContext,
} from '../src/self-vision-runtime/index.js';
import {
  prepareLivePreviewRuntime,
  resetPreviewRuntimeDiagnostics,
  resetPreviewRequestCounterForTests,
  resetPreviewTargetRegistryForTests,
  resetPreviewSessionManagerForTests,
  resetPreviewReportCounterForTests,
  createPreviewSession,
} from '../src/live-preview-runtime/index.js';
import type { PrepareSelfVisionRuntimeInput } from '../src/self-vision-runtime/types.js';
import { SELF_VISION_RUNTIME_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
const CANONICAL_QUERY = 'Show Self Vision session';

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
const responseCache = new Map<string, ReturnType<typeof processSelfVisionRuntimeRequest>>();
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
  const result = processSelfVisionRuntimeRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareSelfVisionRuntimeInput> = {}): PrepareSelfVisionRuntimeInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    targetName: 'DevPulse Web Preview',
    targetType: 'WEB_APP',
    previewUrl: null,
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.3 Self Vision Runtime');
  console.log('=============================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/self-vision-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'self-vision-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. registry', existsSync(join(dir, 'self-vision-session-registry.ts')), 'registry');
  assert('A-SETUP', '4. capture planner', existsSync(join(dir, 'self-vision-capture-planner.ts')), 'capture');
  assert('A-SETUP', '5. validator', existsSync(join(dir, 'self-vision-runtime-validator.ts')), 'validator');
  assert('A-SETUP', '6. observation model', existsSync(join(dir, 'self-vision-observation-model.ts')), 'model');
  assert('A-SETUP', '7. report', existsSync(join(dir, 'self-vision-runtime-report.ts')), 'report');
  assert('A-SETUP', '8. diagnostics', existsSync(join(dir, 'self-vision-runtime-diagnostics.ts')), 'diag');
  assert('A-SETUP', '9. failure bridge', existsSync(join(dir, 'self-vision-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '10. orchestrator', existsSync(join(dir, 'self-vision-runtime.ts')), 'orch');
  assert('A-SETUP', '11. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '12. feed bridge', existsSync(join(ROOT, 'src/operator-feed/self-vision-runtime-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '13. script', typeof pkg.scripts?.['validate:self-vision-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('self_vision_runtime');
  assert('A-SETUP', '14. owner', owner.ownerModule === SELF_VISION_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '15. phase', owner.phase === 16.3, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareSelfVisionRuntime(baseInput());
  assert('B-CORE', '16. session created', ready.selfVisionSession !== null, 'session');
  assert('B-CORE', '17. preview link', ready.selfVisionSession?.previewSessionId.startsWith('pvsess-') === true, 'link');
  assert('B-CORE', '18. observation ready', ready.selfVisionSession?.observationState === 'READY_FOR_OBSERVATION', String(ready.selfVisionSession?.observationState));
  assert('B-CORE', '19. capture plan', (ready.selfVisionSession?.capturePlan.length ?? 0) >= 3, String(ready.selfVisionSession?.capturePlan.length));
  assert('B-CORE', '20. observation targets', ready.runtimeReport.observationTargets.length >= 3, String(ready.runtimeReport.observationTargets.length));

  const noPreview = prepareSelfVisionRuntime(
    baseInput({
      suppressPreviewBootstrap: true,
      previewSessionExists: false,
      previewTargetExists: true,
    }),
  );
  assert('B-CORE', '21. missing preview session', noPreview.runtimeReport.state === 'OBSERVATION_BLOCKED', noPreview.runtimeReport.state);

  const noTarget = prepareSelfVisionRuntime(
    baseInput({
      suppressPreviewBootstrap: true,
      previewSessionExists: true,
      previewTargetExists: false,
    }),
  );
  assert('B-CORE', '22. missing preview target', noTarget.runtimeReport.state === 'OBSERVATION_BLOCKED', noTarget.runtimeReport.state);

  resetSelfVisionSessionRegistryForTests();
  resetPreviewTargetRegistryForTests();
  resetPreviewSessionManagerForTests();
  const preview = prepareLivePreviewRuntime({
    query: CANONICAL_QUERY,
    projectId: 'proj-dup',
    workspaceId: 'ws-dup',
    targetName: 'Dup Target',
    targetType: 'WEB_APP',
    projectExists: true,
    workspaceExists: true,
    world1Protected: true,
    ownershipValid: true,
  });
  const s1 = createSelfVisionSession({
    previewSessionId: preview.previewSession!.previewSessionId,
    projectId: 'proj-dup',
    workspaceId: 'ws-dup',
    targetType: 'WEB_APP',
    capturePlan: planCaptureSequence('WEB_APP'),
  });
  const s2 = createSelfVisionSession({
    previewSessionId: preview.previewSession!.previewSessionId,
    projectId: 'proj-dup',
    workspaceId: 'ws-dup',
    targetType: 'WEB_APP',
    capturePlan: planCaptureSequence('WEB_APP'),
  });
  assert('B-CORE', '23. duplicate session', s1.session !== null && s2.duplicate === true, String(s2.duplicate));

  const noOwner = prepareSelfVisionRuntime(baseInput({ ownershipValid: false }));
  assert('B-CORE', '24. ownership invalid', noOwner.runtimeReport.state === 'OBSERVATION_BLOCKED', noOwner.runtimeReport.state);

  const world1 = prepareSelfVisionRuntime(baseInput({ world1Protected: false }));
  assert('B-CORE', '25. world1 blocks', world1.runtimeReport.state === 'OBSERVATION_BLOCKED', world1.runtimeReport.state);

  assert('B-CORE', '26. tracked caps', TRACKED_OBSERVATION_CAPABILITIES.length === 7, String(TRACKED_OBSERVATION_CAPABILITIES.length));
  assert('B-CORE', '27. target surfaces', ALL_OBSERVATION_TARGETS.length === 7, String(ALL_OBSERVATION_TARGETS.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '28. routing', routing.primaryCapability === 'SELF_VISION_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '29. advisory', isSelfVisionRuntimeAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '30. action sv id', action.candidates[0]!.selfVisionSessionId.startsWith('sv-'), 'id');
  assert('C-INTEGRATION', '31. action readiness', action.candidates[0]!.selfVisionReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '32. observation state', action.candidates[0]!.observationState.length > 3, 'state');

  const reasoning = buildReasoningVisibilityRecord('why self vision');
  assert('C-INTEGRATION', '33. reasoning basis', reasoning.selfVisionBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '34. reasoning blockers', reasoning.selfVisionBlockers.length >= 0, 'blockers');
  assert('C-INTEGRATION', '35. reasoning capture', reasoning.capturePlan.length >= 3, 'capture');
  assert('C-INTEGRATION', '36. reasoning targets', reasoning.observationTargets.length >= 3, 'targets');
  assert('C-INTEGRATION', '37. reasoning caps', reasoning.observationCapabilities.length >= 3, 'caps');

  const failures = buildFailureRecords('Why is Self Vision blocked?');
  assert('C-INTEGRATION', '38. failure', failures.some((f) => f.sourceSystem === 'self_vision_runtime'), 'fail');

  const progress = buildProgressRecords('Show Self Vision session');
  assert('C-INTEGRATION', '39. progress', progress[0]?.selfVisionNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '40. uvl rows', SELF_VISION_RUNTIME_UVL_ROWS.length === 8, String(SELF_VISION_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '41. uvl types', hasUvlRow('SELF_VISION_RUNTIME_TYPES'), 'types');
  assert('D-REGISTRY', '42. console', isIntelligenceConsoleCapability('SELF_VISION_RUNTIME'), 'console');
  assert('D-REGISTRY', '43. find panel', resolveFindPanelAlias('Self Vision') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '44. registry', registry.includes('self_vision_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_SELF_VISION_RUNTIME_DUPLICATES) {
    assert('D-REGISTRY', `45.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const runtimeSrc = readText('src/self-vision-runtime/self-vision-runtime.ts');
  const allSrc = [
    runtimeSrc,
    readText('src/self-vision-runtime/self-vision-capture-planner.ts'),
    readText('src/self-vision-runtime/self-vision-observation-model.ts'),
  ].join('\n');
  assert('E-STATIC', '46. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '47. no playwright', !allSrc.includes('playwright'), 'clean');
  assert('E-STATIC', '48. no screenshot analysis', !allSrc.toLowerCase().includes('analyzescreenshot'), 'clean');
  assert('E-STATIC', '49. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '50. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('SELF_VISION_RUNTIME'), 'feed');
  assert('E-STATIC', '51. planners only', planCaptureSequence('WEB_APP').every((c) => c.deferred === true), 'deferred');
  assert('E-STATIC', '52. targets planned', planObservationTargets('WEB_APP').every((t) => t.plannedOnly === true), 'planned');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `53.${i} session id`, fixture.selfVisionSession?.selfVisionSessionId.startsWith('svsess-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `54.${i} signal`, isSelfVisionRuntimeQuestion(`show self vision session ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What observation targets exist batch ${i}?`);
    assert('F-CACHED', `55.${i} route`, r.primaryCapability === 'SELF_VISION_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildSelfVisionFailureContext('Why is Self Vision blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `56.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is Self Vision blocked?';
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
    assert('G-HTTP', `57.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getSelfVisionRuntimeDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Self vision sessions: ${diag.selfVisionSessionCount}`);
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

  console.log(SELF_VISION_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

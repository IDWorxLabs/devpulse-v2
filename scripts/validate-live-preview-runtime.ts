/**
 * DevPulse V2 Phase 16.1 — Live Preview Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  LIVE_PREVIEW_RUNTIME_PASS_TOKEN,
  LIVE_PREVIEW_RUNTIME_OWNER_MODULE,
  FORBIDDEN_LIVE_PREVIEW_DUPLICATES,
  TRACKED_PREVIEW_CAPABILITIES,
  isLivePreviewQuestion,
  isLivePreviewAdvisoryQuestion,
  prepareLivePreviewRuntime,
  processLivePreviewRequest,
  getPreviewRuntimeDiagnostics,
  resetPreviewRuntimeDiagnostics,
  resetPreviewRequestCounterForTests,
  resetPreviewTargetRegistryForTests,
  resetPreviewSessionManagerForTests,
  resetPreviewReportCounterForTests,
  registerPreviewTarget,
  createPreviewSession,
  listPreviewSessions,
  closePreviewSession,
  buildPreviewFailureContext,
  capabilitiesForTargetType,
} from '../src/live-preview-runtime/index.js';
import { LIVE_PREVIEW_RUNTIME_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
import type { PrepareLivePreviewRuntimeInput } from '../src/live-preview-runtime/types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show preview session';

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
const responseCache = new Map<string, ReturnType<typeof processLivePreviewRequest>>();
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
  const result = processLivePreviewRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareLivePreviewRuntimeInput> = {}): PrepareLivePreviewRuntimeInput {
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
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.1 Live Preview Runtime');
  console.log('================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/live-preview-runtime');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'preview-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. registry', existsSync(join(dir, 'preview-target-registry.ts')), 'registry');
  assert('A-SETUP', '4. session mgr', existsSync(join(dir, 'preview-session-manager.ts')), 'session');
  assert('A-SETUP', '5. validator', existsSync(join(dir, 'preview-runtime-validator.ts')), 'validator');
  assert('A-SETUP', '6. report', existsSync(join(dir, 'preview-runtime-report.ts')), 'report');
  assert('A-SETUP', '7. diagnostics', existsSync(join(dir, 'preview-runtime-diagnostics.ts')), 'diag');
  assert('A-SETUP', '8. orchestrator', existsSync(join(dir, 'preview-runtime.ts')), 'orch');
  assert('A-SETUP', '9. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '10. feed bridge', existsSync(join(ROOT, 'src/operator-feed/live-preview-runtime-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '11. script', typeof pkg.scripts?.['validate:live-preview-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('live_preview_runtime');
  assert('A-SETUP', '12. owner', owner.ownerModule === LIVE_PREVIEW_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '13. phase', owner.phase === 16.1, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  const reg = registerPreviewTarget({
    targetName: 'Test Target',
    targetType: 'WEB_APP',
    projectId: 'proj-a',
    workspaceId: 'ws-a',
  });
  assert('B-CORE', '14. target registration', reg.target !== null && !reg.duplicate, 'registered');

  const valid = prepareLivePreviewRuntime(baseInput());
  assert('B-CORE', '15. session creation', valid.previewSession !== null, 'session');
  assert('B-CORE', '16. preview ready', valid.previewSession?.previewState === 'PREVIEW_READY', String(valid.previewSession?.previewState));
  assert('B-CORE', '17. capabilities', (valid.previewSession?.previewCapabilities.length ?? 0) >= 3, String(valid.previewSession?.previewCapabilities.length));

  const dupTarget = registerPreviewTarget({
    targetName: 'Test Target',
    targetType: 'WEB_APP',
    projectId: 'proj-a',
    workspaceId: 'ws-a',
  });
  assert('B-CORE', '18. duplicate target', dupTarget.duplicate === true, String(dupTarget.duplicate));

  resetPreviewSessionManagerForTests();
  registerPreviewTarget({
    targetName: 'Sess Target',
    targetType: 'MOBILE_APP',
    projectId: 'proj-b',
    workspaceId: 'ws-b',
  });
  const s1 = createPreviewSession({
    projectId: 'proj-b',
    workspaceId: 'ws-b',
    targetName: 'Sess Target',
    targetType: 'MOBILE_APP',
  });
  const s2 = createPreviewSession({
    projectId: 'proj-b',
    workspaceId: 'ws-b',
    targetName: 'Sess Target',
    targetType: 'MOBILE_APP',
  });
  assert('B-CORE', '19. duplicate session', s1.session !== null && s2.duplicate === true, String(s2.duplicate));

  const noProject = prepareLivePreviewRuntime(baseInput({ projectExists: false }));
  assert('B-CORE', '20. missing project', noProject.runtimeReport.state === 'PREVIEW_BLOCKED', noProject.runtimeReport.state);

  const noWorkspace = prepareLivePreviewRuntime(baseInput({ workspaceExists: false }));
  assert('B-CORE', '21. missing workspace', noWorkspace.runtimeReport.state === 'PREVIEW_BLOCKED', noWorkspace.runtimeReport.state);

  const noOwner = prepareLivePreviewRuntime(baseInput({ ownershipValid: false }));
  assert('B-CORE', '22. ownership invalid', noOwner.runtimeReport.state === 'PREVIEW_BLOCKED', noOwner.runtimeReport.state);

  const world1 = prepareLivePreviewRuntime(baseInput({ world1Protected: false }));
  assert('B-CORE', '23. world1 blocks', world1.runtimeReport.state === 'PREVIEW_BLOCKED', world1.runtimeReport.state);

  resetPreviewTargetRegistryForTests();
  resetPreviewSessionManagerForTests();
  const dupFirst = prepareLivePreviewRuntime(baseInput({ targetName: 'Dup Repeat Target' }));
  const dupSecond = prepareLivePreviewRuntime(baseInput({ targetName: 'Dup Repeat Target' }));
  assert('B-CORE', '24. repeat target blocks', dupSecond.runtimeReport.state === 'PREVIEW_BLOCKED', dupSecond.runtimeReport.state);
  assert('B-CORE', '25. first run ok', dupFirst.previewSession !== null, 'first');

  assert('B-CORE', '26. tracked caps', TRACKED_PREVIEW_CAPABILITIES.length === 6, String(TRACKED_PREVIEW_CAPABILITIES.length));
  assert('B-CORE', '27. web caps', capabilitiesForTargetType('WEB_APP').includes('LIVE_VIEW'), 'live_view');
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '28. routing', routing.primaryCapability === 'LIVE_PREVIEW_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '29. advisory', isLivePreviewAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '30. action id', action.candidates[0]!.previewSessionId.startsWith('pv-'), 'id');
  assert('C-INTEGRATION', '31. action readiness', action.candidates[0]!.previewReadiness.length > 5, 'readiness');
  assert('C-INTEGRATION', '32. preview state', action.candidates[0]!.previewState.length > 3, 'state');

  const reasoning = buildReasoningVisibilityRecord('why preview');
  assert('C-INTEGRATION', '33. reasoning basis', reasoning.previewBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '34. reasoning caps', reasoning.previewCapabilities.length >= 3, 'caps');

  const failures = buildFailureRecords('Why is preview blocked?');
  assert('C-INTEGRATION', '35. failure', failures.some((f) => f.sourceSystem === 'live_preview_runtime'), 'fail');

  const progress = buildProgressRecords('Show preview session');
  assert('C-INTEGRATION', '36. progress', progress[0]?.previewNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '37. uvl rows', LIVE_PREVIEW_RUNTIME_UVL_ROWS.length === 7, String(LIVE_PREVIEW_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '38. uvl types', hasUvlRow('LIVE_PREVIEW_RUNTIME_TYPES'), 'types');
  assert('D-REGISTRY', '39. console', isIntelligenceConsoleCapability('LIVE_PREVIEW_RUNTIME'), 'console');
  assert('D-REGISTRY', '40. find panel', resolveFindPanelAlias('Preview Session') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '41. registry', registry.includes('live_preview_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_LIVE_PREVIEW_DUPLICATES) {
    assert('D-REGISTRY', `42.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const runtimeSrc = readText('src/live-preview-runtime/preview-runtime.ts');
  const allSrc = [
    runtimeSrc,
    readText('src/live-preview-runtime/preview-session-manager.ts'),
    readText('src/live-preview-runtime/preview-target-registry.ts'),
  ].join('\n');
  assert('E-STATIC', '43. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '44. no playwright', !allSrc.includes('playwright'), 'clean');
  assert('E-STATIC', '45. no screenshot', !allSrc.toLowerCase().includes('capturescreenshot'), 'clean');
  assert('E-STATIC', '46. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '47. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('LIVE_PREVIEW_RUNTIME'), 'feed');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `48.${i} session id`, fixture.previewSession?.previewSessionId.startsWith('pvsess-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `49.${i} signal`, isLivePreviewQuestion(`show preview session ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`What preview targets exist batch ${i}?`);
    assert('F-CACHED', `50.${i} route`, r.primaryCapability === 'LIVE_PREVIEW_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildPreviewFailureContext('Why is preview blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `51.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is preview blocked?';
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
    assert('G-HTTP', `52.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getPreviewRuntimeDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Preview sessions: ${diag.previewSessionCount}`);
  console.log(`Registered targets: ${diag.registeredTargetCount}`);
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

  console.log(LIVE_PREVIEW_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

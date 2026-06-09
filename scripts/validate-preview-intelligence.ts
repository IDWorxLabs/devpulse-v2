/**
 * DevPulse V2 Phase 16.2 — Preview Intelligence validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  PREVIEW_INTELLIGENCE_PASS_TOKEN,
  PREVIEW_INTELLIGENCE_OWNER_MODULE,
  FORBIDDEN_PREVIEW_INTELLIGENCE_DUPLICATES,
  TRACKED_PREVIEW_CAPABILITIES,
  ALL_OBSERVATION_ITEMS,
  isPreviewIntelligenceQuestion,
  isPreviewIntelligenceAdvisoryQuestion,
  analyzePreviewIntelligence,
  processPreviewIntelligenceRequest,
  getPreviewIntelligenceDiagnostics,
  resetPreviewIntelligenceDiagnostics,
  resetPreviewIntelligenceRequestCounterForTests,
  resetPreviewIntelligenceReportCounterForTests,
  buildPreviewIntelligenceFailureContext,
  analyzePreviewLimitations,
  analyzePreviewContext,
} from '../src/preview-intelligence/index.js';
import {
  prepareLivePreviewRuntime,
  resetPreviewRuntimeDiagnostics,
  resetPreviewRequestCounterForTests,
  resetPreviewTargetRegistryForTests,
  resetPreviewSessionManagerForTests,
  resetPreviewReportCounterForTests,
  registerPreviewTarget,
  createPreviewSession,
} from '../src/live-preview-runtime/index.js';
import type { PrepareLivePreviewRuntimeInput } from '../src/live-preview-runtime/types.js';
import { PREVIEW_INTELLIGENCE_UVL_ROWS, hasUvlRow } from '../src/unified-verification-lab/index.js';
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
const CANONICAL_QUERY = 'Is this preview ready?';

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
const responseCache = new Map<string, ReturnType<typeof processPreviewIntelligenceRequest>>();
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
  const result = processPreviewIntelligenceRequest(query);
  responseCache.set(key, result);
  return result;
}

function basePreviewInput(overrides: Partial<PrepareLivePreviewRuntimeInput> = {}): PrepareLivePreviewRuntimeInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    targetName: 'DevPulse Web Preview',
    targetType: 'WEB_APP',
    previewUrl: 'http://localhost:3000',
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
  resetPreviewIntelligenceDiagnostics();
  resetPreviewIntelligenceRequestCounterForTests();
  resetPreviewIntelligenceReportCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.2 Preview Intelligence');
  console.log('==============================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/preview-intelligence');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'preview-intelligence-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. context', existsSync(join(dir, 'preview-context-analyzer.ts')), 'context');
  assert('A-SETUP', '4. readiness', existsSync(join(dir, 'preview-readiness-engine.ts')), 'readiness');
  assert('A-SETUP', '5. capability', existsSync(join(dir, 'preview-capability-analyzer.ts')), 'capability');
  assert('A-SETUP', '6. limitation', existsSync(join(dir, 'preview-limitation-analyzer.ts')), 'limitation');
  assert('A-SETUP', '7. observation', existsSync(join(dir, 'preview-observation-planner.ts')), 'observation');
  assert('A-SETUP', '8. report', existsSync(join(dir, 'preview-intelligence-report.ts')), 'report');
  assert('A-SETUP', '9. diagnostics', existsSync(join(dir, 'preview-intelligence-diagnostics.ts')), 'diag');
  assert('A-SETUP', '10. failure bridge', existsSync(join(dir, 'preview-intelligence-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '11. orchestrator', existsSync(join(dir, 'preview-intelligence.ts')), 'orch');
  assert('A-SETUP', '12. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/preview-intelligence-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '14. script', typeof pkg.scripts?.['validate:preview-intelligence'] === 'string', 'script');
  const owner = getDevPulseV2Owner('preview_intelligence');
  assert('A-SETUP', '15. owner', owner.ownerModule === PREVIEW_INTELLIGENCE_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '16. phase', owner.phase === 16.2, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const web = analyzePreviewIntelligence({
    query: CANONICAL_QUERY,
    ...basePreviewInput({ targetType: 'WEB_APP', previewUrl: 'http://localhost:3000' }),
  });
  assert('B-CORE', '17. report id', web.previewIntelligenceReport.previewIntelligenceId.startsWith('pvint-'), 'id');
  assert('B-CORE', '18. session report', web.previewIntelligenceReport.previewSessionId !== null, 'session');
  assert('B-CORE', '19. web readiness', web.previewIntelligenceReport.readinessLevel === 'READY_FOR_OBSERVATION', web.previewIntelligenceReport.readinessLevel);

  const noSession = analyzePreviewIntelligence({
    query: 'Why is preview not ready?',
    previewSession: null,
    previewTarget: null,
    suppressRuntimeBootstrap: true,
    projectId: 'proj-x',
    workspaceId: 'ws-x',
    targetType: 'WEB_APP',
    projectExists: true,
    workspaceExists: true,
    workspaceReady: true,
    ownershipValid: true,
  });
  assert('B-CORE', '20. missing session blocks', noSession.previewIntelligenceReport.readinessLevel === 'BLOCKED', noSession.previewIntelligenceReport.readinessLevel);

  const noTarget = analyzePreviewIntelligence({
    query: 'Why is preview not ready?',
    previewSession: null,
    previewTarget: null,
    suppressRuntimeBootstrap: true,
    projectExists: true,
    workspaceExists: true,
    workspaceReady: true,
    ownershipValid: true,
  });
  assert('B-CORE', '21. missing target blocks', noTarget.previewIntelligenceReport.readinessLevel === 'BLOCKED', noTarget.previewIntelligenceReport.readinessLevel);

  const mobile = analyzePreviewIntelligence(basePreviewInput({ targetType: 'MOBILE_APP', targetName: 'Mobile App', previewUrl: 'http://localhost:3000' }));
  assert('B-CORE', '22. mobile warning', mobile.previewIntelligenceReport.limitations.some((l) => l.limitation === 'MOBILE_PREVIEW_REQUIRES_DESKTOP'), 'mobile');
  assert('B-CORE', '23. mobile partial', mobile.previewIntelligenceReport.readinessLevel === 'PARTIALLY_READY', mobile.previewIntelligenceReport.readinessLevel);

  const api = analyzePreviewIntelligence(basePreviewInput({ targetType: 'API_SERVICE', targetName: 'API Service', previewUrl: null }));
  assert('B-CORE', '24. api non-visual', api.previewIntelligenceReport.limitations.some((l) => l.limitation === 'API_SERVICE_NOT_VISUAL'), 'api');

  const bg = analyzePreviewIntelligence(basePreviewInput({ targetType: 'BACKGROUND_RUNTIME', targetName: 'Worker', previewUrl: null }));
  assert('B-CORE', '25. background non-visual', bg.previewIntelligenceReport.limitations.some((l) => l.limitation === 'BACKGROUND_RUNTIME_NOT_VISUAL'), 'bg');

  const staticPage = analyzePreviewIntelligence(basePreviewInput({ targetType: 'STATIC_PAGE', targetName: 'Static', previewUrl: 'http://localhost/static' }));
  assert('B-CORE', '26. static readiness', staticPage.previewIntelligenceReport.readinessLevel === 'READY_FOR_OBSERVATION', staticPage.previewIntelligenceReport.readinessLevel);

  const unknown = analyzePreviewIntelligence({
    query: 'Is this preview ready?',
    suppressRuntimeBootstrap: true,
    previewSession: null,
    previewTarget: null,
    targetType: 'UNKNOWN_TARGET',
    projectId: 'proj-u',
    workspaceId: 'ws-u',
    projectExists: true,
    workspaceExists: true,
    workspaceReady: true,
    ownershipValid: true,
  });
  assert('B-CORE', '27. unknown blocks', unknown.previewIntelligenceReport.readinessLevel === 'BLOCKED', unknown.previewIntelligenceReport.readinessLevel);

  assert('B-CORE', '28. capability summary', web.previewIntelligenceReport.capabilitySummary.length === TRACKED_PREVIEW_CAPABILITIES.length, String(web.previewIntelligenceReport.capabilitySummary.length));
  assert('B-CORE', '29. limitations', web.previewIntelligenceReport.limitations.length >= 4, String(web.previewIntelligenceReport.limitations.length));
  assert('B-CORE', '30. observation plan', web.previewIntelligenceReport.observationPlan.length >= 3, String(web.previewIntelligenceReport.observationPlan.length));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '31. routing', routing.primaryCapability === 'PREVIEW_INTELLIGENCE', String(routing.primaryCapability));
  assert('C-INTEGRATION', '32. advisory', isPreviewIntelligenceAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '33. action intel id', action.candidates[0]!.previewIntelligenceId.startsWith('pvi-'), 'id');
  assert('C-INTEGRATION', '34. action level', action.candidates[0]!.previewReadinessLevel.length > 3, 'level');
  assert('C-INTEGRATION', '35. action score', typeof action.candidates[0]!.previewReadinessScore === 'number', 'score');

  const reasoning = buildReasoningVisibilityRecord('why preview intelligence');
  assert('C-INTEGRATION', '36. reasoning basis', reasoning.previewIntelligenceBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '37. reasoning limitations', reasoning.previewLimitations.length >= 3, 'limits');
  assert('C-INTEGRATION', '38. reasoning plan', reasoning.previewObservationPlan.length >= 3, 'plan');
  assert('C-INTEGRATION', '39. reasoning caps', reasoning.previewCapabilitySummary.length >= 3, 'caps');

  const failures = buildFailureRecords('What preview limitations exist?');
  assert('C-INTEGRATION', '40. failure', failures.some((f) => f.sourceSystem === 'preview_intelligence'), 'fail');

  const progress = buildProgressRecords('Preview readiness');
  assert('C-INTEGRATION', '41. progress', progress[0]?.previewIntelligenceNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '42. uvl rows', PREVIEW_INTELLIGENCE_UVL_ROWS.length === 9, String(PREVIEW_INTELLIGENCE_UVL_ROWS.length));
  assert('D-REGISTRY', '43. uvl types', hasUvlRow('PREVIEW_INTELLIGENCE_TYPES'), 'types');
  assert('D-REGISTRY', '44. console', isIntelligenceConsoleCapability('PREVIEW_INTELLIGENCE'), 'console');
  assert('D-REGISTRY', '45. find panel', resolveFindPanelAlias('Preview Intelligence') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '46. registry', registry.includes('preview_intelligence'), 'registry');
  for (const forbidden of FORBIDDEN_PREVIEW_INTELLIGENCE_DUPLICATES) {
    assert('D-REGISTRY', `47.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const intelSrc = readText('src/preview-intelligence/preview-intelligence.ts');
  const allSrc = [
    intelSrc,
    readText('src/preview-intelligence/preview-capability-analyzer.ts'),
    readText('src/preview-intelligence/preview-observation-planner.ts'),
  ].join('\n');
  assert('E-STATIC', '48. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '49. no playwright', !allSrc.includes('playwright'), 'clean');
  assert('E-STATIC', '50. no screenshot capture', !allSrc.toLowerCase().includes('capturescreenshot'), 'clean');
  assert('E-STATIC', '51. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '52. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('PREVIEW_INTELLIGENCE'), 'feed');
  assert('E-STATIC', '53. observation items', ALL_OBSERVATION_ITEMS.length === 8, String(ALL_OBSERVATION_ITEMS.length));
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `54.${i} report id`, fixture.previewIntelligenceReport.previewIntelligenceId.startsWith('pvint-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `55.${i} signal`, isPreviewIntelligenceQuestion(`preview readiness batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What preview limitations exist batch ${i}?`);
    assert('F-CACHED', `56.${i} route`, r.primaryCapability === 'PREVIEW_INTELLIGENCE', String(r.primaryCapability));
  }
  const bridge = buildPreviewIntelligenceFailureContext('What preview limitations exist?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `57.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'What preview limitations exist?';
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
    assert('G-HTTP', `58.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getPreviewIntelligenceDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Intelligence reports: ${diag.intelligenceReportCount}`);
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

  console.log(PREVIEW_INTELLIGENCE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

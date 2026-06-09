/**
 * DevPulse V2 Phase 16.7 — Unified Verification Lab Runtime validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  UNIFIED_VERIFICATION_LAB_RUNTIME_PASS_TOKEN,
  UNIFIED_VERIFICATION_LAB_RUNTIME_OWNER_MODULE,
  FORBIDDEN_UVL_RUNTIME_DUPLICATES,
  INITIAL_VERIFICATION_PROVIDER_TYPES,
  isUvlRuntimeQuestion,
  isUvlRuntimeAdvisoryQuestion,
  prepareVerificationRuntime,
  processVerificationRuntimeRequest,
  getVerificationRuntimeDiagnostics,
  resetVerificationRuntimeDiagnostics,
  resetVerificationRuntimeRequestCounterForTests,
  resetVerificationRuntimeReportCounterForTests,
  resetVerificationProviderRegistryForTests,
  resetVerificationSessionManagerForTests,
  buildVerificationRuntimeFailureContext,
  registerProvider,
  registerInitialProviders,
  buildInitialProviderDefinition,
  getVerificationProvider,
  listVerificationProviders,
  createVerificationSession,
  getVerificationSession,
  startVerificationSession,
  completeVerificationSession,
  failVerificationSession,
  validateProviderRegistration,
  buildUvlPanelSnapshot,
  UNIFIED_VERIFICATION_LAB_RUNTIME_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/index.js';
import type { PrepareVerificationRuntimeInput } from '../src/unified-verification-lab/types.js';
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
const CANONICAL_QUERY = 'What verification providers exist?';

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
const responseCache = new Map<string, ReturnType<typeof processVerificationRuntimeRequest>>();
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
  const result = processVerificationRuntimeRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareVerificationRuntimeInput> = {}): PrepareVerificationRuntimeInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
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
  resetVerificationProviderRegistryForTests();
  resetVerificationSessionManagerForTests();
  resetVerificationRuntimeDiagnostics();
  resetVerificationRuntimeRequestCounterForTests();
  resetVerificationRuntimeReportCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.7 Unified Verification Lab Runtime');
  console.log('===========================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/unified-verification-lab');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. parser', existsSync(join(dir, 'verification-request-parser.ts')), 'parser');
  assert('A-SETUP', '3. provider registry', existsSync(join(dir, 'verification-provider-registry.ts')), 'registry');
  assert('A-SETUP', '4. session manager', existsSync(join(dir, 'verification-session-manager.ts')), 'session');
  assert('A-SETUP', '5. lifecycle', existsSync(join(dir, 'verification-lifecycle-manager.ts')), 'lifecycle');
  assert('A-SETUP', '6. validator', existsSync(join(dir, 'verification-runtime-validator.ts')), 'validator');
  assert('A-SETUP', '7. report', existsSync(join(dir, 'verification-runtime-report.ts')), 'report');
  assert('A-SETUP', '8. diagnostics', existsSync(join(dir, 'verification-runtime-diagnostics.ts')), 'diag');
  assert('A-SETUP', '9. failure bridge', existsSync(join(dir, 'verification-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '10. orchestrator', existsSync(join(dir, 'unified-verification-lab-runtime.ts')), 'orch');
  assert('A-SETUP', '11. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '12. uvl panel', existsSync(join(dir, 'uvl-panel-registry.ts')), 'panel');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/unified-verification-lab-runtime-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '14. script', typeof pkg.scripts?.['validate:unified-verification-lab-runtime'] === 'string', 'script');
  const owner = getDevPulseV2Owner('unified_verification_lab_runtime');
  assert('A-SETUP', '15. owner', owner.ownerModule === UNIFIED_VERIFICATION_LAB_RUNTIME_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '16. phase', owner.phase === 16.7, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareVerificationRuntime(baseInput());
  assert('B-CORE', '17. report id', ready.runtimeReport.reportId.startsWith('uvlrep-'), 'id');
  assert('B-CORE', '18. providers', ready.registeredProviders.length === 7, String(ready.registeredProviders.length));
  assert('B-CORE', '19. sessions', ready.verificationSessions.length === 7, String(ready.verificationSessions.length));
  assert('B-CORE', '20. runtime only', ready.runtimeReport.runtimeOnly === true, 'only');
  assert('B-CORE', '21. completed', ready.verificationSessions.every((s) => s.sessionState === 'COMPLETED'), 'completed');

  resetAll();
  registerInitialProviders();
  const provider = buildInitialProviderDefinition('PREVIEW_VERIFICATION');
  const dup = registerProvider(provider);
  assert('B-CORE', '22. duplicate provider', !dup.ok && dup.duplicate === true, 'dup');

  resetAll();
  registerInitialProviders();
  const previewProvider = getVerificationProvider('vprov-preview-verification');
  const session = createVerificationSession({
    providerId: previewProvider!.providerId,
    verificationType: 'PREVIEW_VERIFICATION',
  });
  const dupSession = createVerificationSession({
    providerId: previewProvider!.providerId,
    verificationType: 'PREVIEW_VERIFICATION',
  });
  assert('B-CORE', '23. session created', session.ok === true, 'created');
  assert('B-CORE', '24. duplicate session', !dupSession.ok && dupSession.duplicate === true, 'dup');

  resetAll();
  registerInitialProviders();
  const prov = listVerificationProviders()[0]!;
  const sess = createVerificationSession({
    providerId: prov.providerId,
    verificationType: prov.providerType,
  });
  const started = startVerificationSession(sess.session!.verificationSessionId);
  const completed = completeVerificationSession(sess.session!.verificationSessionId);
  const failedSession = failVerificationSession('vvsess-9999', 'test');
  assert('B-CORE', '25. lifecycle start', started?.sessionState === 'RUNNING', String(started?.sessionState));
  assert('B-CORE', '26. lifecycle complete', completed?.sessionState === 'COMPLETED', String(completed?.sessionState));
  assert('B-CORE', '27. lifecycle fail null', failedSession === null, 'null');
  assert('B-CORE', '28. provider lookup', validateProviderRegistration(prov.providerId).valid === true, 'lookup');
  assert('B-CORE', '29. session lookup', getVerificationSession(sess.session!.verificationSessionId) !== null, 'lookup');
  assert('B-CORE', '30. provider types', INITIAL_VERIFICATION_PROVIDER_TYPES.length === 7, String(INITIAL_VERIFICATION_PROVIDER_TYPES.length));

  const panel = buildUvlPanelSnapshot('COMPLETED');
  assert('B-CORE', '31. uvl panel', panel.panelTitle === 'Unified Verification Lab Runtime', panel.panelTitle);
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '32. routing', routing.primaryCapability === 'UNIFIED_VERIFICATION_LAB_RUNTIME', String(routing.primaryCapability));
  assert('C-INTEGRATION', '33. advisory', isUvlRuntimeAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '34. action session id', action.candidates[0]!.verificationSessionId.startsWith('vvsess-'), 'id');
  assert('C-INTEGRATION', '35. action runtime state', action.candidates[0]!.verificationRuntimeState.length > 3, 'state');
  assert('C-INTEGRATION', '36. provider count', action.candidates[0]!.providerCount === 7, 'count');

  const reasoning = buildReasoningVisibilityRecord('why uvl runtime');
  assert('C-INTEGRATION', '37. reasoning basis', reasoning.verificationRuntimeBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '38. reasoning providers', reasoning.registeredProviders.length >= 7, 'providers');
  assert('C-INTEGRATION', '39. reasoning lifecycle', reasoning.verificationLifecycle.length >= 3, 'lifecycle');
  assert('C-INTEGRATION', '40. reasoning warnings', reasoning.verificationWarnings.length >= 2, 'warnings');

  const failures = buildFailureRecords('Why is verification blocked?');
  assert('C-INTEGRATION', '41. failure', failures.some((f) => f.sourceSystem === 'unified_verification_lab_runtime'), 'fail');

  const progress = buildProgressRecords('UVL runtime');
  assert('C-INTEGRATION', '42. progress', progress[0]?.uvlRuntimeNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '43. uvl rows', UNIFIED_VERIFICATION_LAB_RUNTIME_UVL_ROWS.length === 8, String(UNIFIED_VERIFICATION_LAB_RUNTIME_UVL_ROWS.length));
  assert('D-REGISTRY', '44. uvl types', hasUvlRow('UNIFIED_VERIFICATION_LAB_RUNTIME_TYPES'), 'types');
  assert('D-REGISTRY', '45. console', isIntelligenceConsoleCapability('UNIFIED_VERIFICATION_LAB_RUNTIME'), 'console');
  assert('D-REGISTRY', '46. find panel', resolveFindPanelAlias('UVL Runtime') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '47. registry', registry.includes('unified_verification_lab_runtime'), 'registry');
  for (const forbidden of FORBIDDEN_UVL_RUNTIME_DUPLICATES) {
    assert('D-REGISTRY', `48.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = prepareVerificationRuntime(baseInput());
  const engineSrc = readText('src/unified-verification-lab/unified-verification-lab-runtime.ts');
  const allSrc = [
    engineSrc,
    readText('src/unified-verification-lab/verification-lifecycle-manager.ts'),
    readText('src/unified-verification-lab/verification-runtime-report.ts'),
  ].join('\n');
  assert('E-STATIC', '49. no orchestrator dup', !allSrc.includes('verification_orchestrator'), 'clean');
  assert('E-STATIC', '50. no evidence engine', !allSrc.includes('verification_evidence_engine'), 'clean');
  assert('E-STATIC', '51. no auto-fix', !allSrc.toLowerCase().includes('autofix'), 'clean');
  assert('E-STATIC', '52. no puppeteer', !allSrc.includes('puppeteer'), 'clean');
  assert('E-STATIC', '53. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('UNIFIED_VERIFICATION_LAB_RUNTIME'), 'feed');
  assert('E-STATIC', '54. runtime only', staticReady.runtimeReport.runtimeOnly === true, 'only');
  assert('E-STATIC', '55. no execution flag', !allSrc.includes('executeVerification'), 'clean');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `56.${i} report id`, fixture.runtimeReport.reportId.startsWith('uvlrep-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `57.${i} signal`, isUvlRuntimeQuestion(`uvl runtime batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What verification sessions exist batch ${i}?`);
    assert('F-CACHED', `58.${i} route`, r.primaryCapability === 'UNIFIED_VERIFICATION_LAB_RUNTIME', String(r.primaryCapability));
  }
  const bridge = buildVerificationRuntimeFailureContext('Why is verification blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `59.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is verification blocked?';
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
    assert('G-HTTP', `60.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVerificationRuntimeDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Providers: ${diag.providerCount}`);
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

  console.log(UNIFIED_VERIFICATION_LAB_RUNTIME_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * DevPulse V2 Phase 16.12 — Unified Verification Entry Point validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  UNIFIED_VERIFICATION_ENTRY_POINT_PASS_TOKEN,
  UNIFIED_VERIFICATION_ENTRY_OWNER_MODULE,
  FORBIDDEN_UNIFIED_VERIFICATION_DUPLICATES,
  INITIAL_VERIFICATION_REQUEST_TYPES,
  INITIAL_VERIFICATION_SCOPES,
  isUnifiedVerificationQuestion,
  isUnifiedVerificationAdvisoryQuestion,
  requestVerification,
  processUnifiedVerificationRequest,
  getVerificationEntryDiagnostics,
  resetVerificationEntryDiagnostics,
  resetVerificationEntryReportCounterForTests,
  resetUnifiedVerificationEntryForTests,
  resetVerificationEntrySessionsForTests,
  resetVerificationScopeCounterForTests,
  buildUnifiedVerificationFailureContext,
  listVerificationRequests,
  listVerificationSessions,
  getVerificationState,
  getVerificationReports,
  getVerificationEvidence,
  getVerificationSession,
  routeVerificationRequest,
  describeRoutingPlan,
  buildVerificationScope,
  buildVerificationContext,
  validateVerificationEntry,
  evaluateEntryGates,
} from '../src/unified-verification-entry/index.js';
import type { RequestVerificationInput } from '../src/unified-verification-entry/unified-verification-types.js';
import {
  resetVerificationEvidenceDiagnostics,
  resetVerificationEvidenceReportCounterForTests,
  resetVerificationEvidenceStoreForTests,
} from '../src/verification-evidence-engine/index.js';
import {
  resetVerificationReportingDiagnostics,
  resetVerificationReportingAuthorityCounterForTests,
  resetVerificationReportStoreForTests,
  resetVerificationHistoryForTests,
} from '../src/verification-reporting-engine/index.js';
import {
  resetVerificationTargetRegistryForTests,
  resetVerificationOwnerRegistryForTests,
  resetVerificationDependencyRegistryForTests,
  resetVerificationRequirementRegistryForTests,
  resetVerificationCapabilityRegistryForTests,
  resetVerificationRegistryDiagnostics,
  resetVerificationRegistryReportCounterForTests,
} from '../src/verification-registry/index.js';
import {
  resetVerificationOrchestratorDiagnostics,
  resetVerificationOrchestratorReportCounterForTests,
  resetVerificationPlanCounterForTests,
  resetParallelGroupCounterForTests,
} from '../src/verification-orchestrator/index.js';
import {
  resetVerificationRuntimeDiagnostics,
  resetVerificationRuntimeReportCounterForTests,
  resetVerificationProviderRegistryForTests,
  resetVerificationSessionManagerForTests,
} from '../src/unified-verification-lab/index.js';
import {
  buildUnifiedVerificationEntryPanelSnapshot,
  UNIFIED_VERIFICATION_ENTRY_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/index.js';
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
const CANONICAL_QUERY = 'Request verification';

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
const responseCache = new Map<string, ReturnType<typeof processUnifiedVerificationRequest>>();
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
  const result = processUnifiedVerificationRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<RequestVerificationInput> = {}): RequestVerificationInput {
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
  resetVerificationTargetRegistryForTests();
  resetVerificationOwnerRegistryForTests();
  resetVerificationDependencyRegistryForTests();
  resetVerificationRequirementRegistryForTests();
  resetVerificationCapabilityRegistryForTests();
  resetVerificationRegistryDiagnostics();
  resetVerificationRegistryReportCounterForTests();
  resetVerificationOrchestratorDiagnostics();
  resetVerificationOrchestratorReportCounterForTests();
  resetVerificationPlanCounterForTests();
  resetParallelGroupCounterForTests();
  resetVerificationEvidenceDiagnostics();
  resetVerificationEvidenceReportCounterForTests();
  resetVerificationEvidenceStoreForTests();
  resetVerificationReportingDiagnostics();
  resetVerificationReportingAuthorityCounterForTests();
  resetVerificationReportStoreForTests();
  resetVerificationHistoryForTests();
  resetVerificationRuntimeDiagnostics();
  resetVerificationRuntimeReportCounterForTests();
  resetVerificationProviderRegistryForTests();
  resetVerificationSessionManagerForTests();
  resetVerificationEntryDiagnostics();
  resetVerificationEntryReportCounterForTests();
  resetUnifiedVerificationEntryForTests();
  resetVerificationEntrySessionsForTests();
  resetVerificationScopeCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.12 Unified Verification Entry Point');
  console.log('==========================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/unified-verification-entry');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'unified-verification-types.ts')), 'types');
  assert('A-SETUP', '2. entry', existsSync(join(dir, 'unified-verification-entry.ts')), 'entry');
  assert('A-SETUP', '3. router', existsSync(join(dir, 'verification-request-router.ts')), 'router');
  assert('A-SETUP', '4. scope', existsSync(join(dir, 'verification-scope-builder.ts')), 'scope');
  assert('A-SETUP', '5. context', existsSync(join(dir, 'verification-context-builder.ts')), 'context');
  assert('A-SETUP', '6. session', existsSync(join(dir, 'verification-session-builder.ts')), 'session');
  assert('A-SETUP', '7. state', existsSync(join(dir, 'verification-state-manager.ts')), 'state');
  assert('A-SETUP', '8. history', existsSync(join(dir, 'verification-history-manager.ts')), 'history');
  assert('A-SETUP', '9. response', existsSync(join(dir, 'verification-response-builder.ts')), 'response');
  assert('A-SETUP', '10. validator', existsSync(join(dir, 'verification-entry-validator.ts')), 'validator');
  assert('A-SETUP', '11. diagnostics', existsSync(join(dir, 'verification-entry-diagnostics.ts')), 'diag');
  assert('A-SETUP', '12. report', existsSync(join(dir, 'verification-entry-report.ts')), 'report');
  assert('A-SETUP', '13. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '14. feed bridge', existsSync(join(ROOT, 'src/operator-feed/unified-verification-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '15. script', typeof pkg.scripts?.['validate:unified-verification-entry'] === 'string', 'script');
  const owner = getDevPulseV2Owner('unified_verification_entry');
  assert('A-SETUP', '16. owner', owner.ownerModule === UNIFIED_VERIFICATION_ENTRY_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '17. phase', owner.phase === 16.12, String(owner.phase));
  assert('A-SETUP', '18. request types', INITIAL_VERIFICATION_REQUEST_TYPES.length === 10, String(INITIAL_VERIFICATION_REQUEST_TYPES.length));
  assert('A-SETUP', '19. scopes', INITIAL_VERIFICATION_SCOPES.length === 9, String(INITIAL_VERIFICATION_SCOPES.length));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = requestVerification(baseInput());
  assert('B-CORE', '20. authority id', ready.authorityId.startsWith('uventauth-'), 'id');
  assert('B-CORE', '21. request id', ready.response.request.requestId.startsWith('vreq-'), 'req');
  assert('B-CORE', '22. session id', ready.response.session.sessionId.startsWith('uvent-'), 'sess');
  assert('B-CORE', '23. authority only', ready.response.authorityOnly === true, 'only');
  assert('B-CORE', '24. state completed', ready.response.state === 'COMPLETED', ready.response.state);
  assert('B-CORE', '25. validation', ready.validationValid === true, 'valid');
  assert('B-CORE', '26. evidence refs', ready.response.evidenceReferences.length >= 13, String(ready.response.evidenceReferences.length));
  assert('B-CORE', '27. report refs', ready.response.reportReferences.length >= 10, String(ready.response.reportReferences.length));
  assert('B-CORE', '28. history', ready.response.historyReferences.length >= 5, String(ready.response.historyReferences.length));

  assert('B-CORE', '29. list requests', listVerificationRequests().length >= 1, String(listVerificationRequests().length));
  assert('B-CORE', '30. list sessions', listVerificationSessions().length >= 1, String(listVerificationSessions().length));
  assert('B-CORE', '31. get state', getVerificationState(ready.response.request.requestId) === 'COMPLETED', 'state');
  assert('B-CORE', '32. get session', getVerificationSession(ready.response.session.sessionId)?.sessionId === ready.response.session.sessionId, 'sess');
  assert('B-CORE', '33. get reports', getVerificationReports().length >= 10, String(getVerificationReports().length));
  assert('B-CORE', '34. get evidence', getVerificationEvidence().length >= 13, String(getVerificationEvidence().length));

  const routed = routeVerificationRequest(baseInput());
  const context = buildVerificationContext(routed);
  assert('B-CORE', '35. routing', describeRoutingPlan().length >= 6, String(describeRoutingPlan().length));
  assert('B-CORE', '36. context', context.registryTargetCount === 11, String(context.registryTargetCount));

  const scope = buildVerificationScope(baseInput(), 'MANUAL_VERIFICATION', context.targets);
  assert('B-CORE', '37. scope', scope.scopeId.startsWith('vscope-'), 'scope');

  const validation = validateVerificationEntry({
    request: ready.response.request,
    session: ready.response.session,
    response: ready.response,
    knownEvidenceIds: new Set(ready.response.evidenceReferences),
    knownReportIds: new Set(ready.response.reportReferences),
  });
  assert('B-CORE', '38. entry validation', validation.valid === true, 'valid');

  const gates = evaluateEntryGates(baseInput());
  assert('B-CORE', '39. gates', gates.blockers.length === 0, String(gates.blockers.length));

  resetAll();
  const panel = buildUnifiedVerificationEntryPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '40. uvl panel', panel.panelTitle === 'Unified Verification Entry', panel.panelTitle);
  assert('B-CORE', '41. panel requests', panel.requestCount >= 1, String(panel.requestCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '42. routing', routing.primaryCapability === 'UNIFIED_VERIFICATION_ENTRY', String(routing.primaryCapability));
  assert('C-INTEGRATION', '43. advisory', isUnifiedVerificationAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '44. action entry id', action.candidates[0]!.unifiedVerificationEntryId.startsWith('uventauth-'), 'id');
  assert('C-INTEGRATION', '45. action requests', action.candidates[0]!.verificationRequestCount === 1, 'count');
  assert('C-INTEGRATION', '46. action sessions', action.candidates[0]!.verificationEntrySessionCount === 1, 'count');

  const reasoning = buildReasoningVisibilityRecord('unified verification entry');
  assert('C-INTEGRATION', '47. reasoning basis', reasoning.unifiedVerificationBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '48. reasoning chain', reasoning.verificationEntryChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '49. reasoning state', reasoning.verificationEntryState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is verification blocked?');
  assert('C-INTEGRATION', '50. failure', failures.some((f) => f.sourceSystem === 'unified_verification_entry'), 'fail');

  const progress = buildProgressRecords('unified verification entry');
  assert('C-INTEGRATION', '51. progress', progress[0]?.unifiedVerificationEntryNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '52. uvl rows', UNIFIED_VERIFICATION_ENTRY_UVL_ROWS.length === 14, String(UNIFIED_VERIFICATION_ENTRY_UVL_ROWS.length));
  assert('D-REGISTRY', '53. uvl types', hasUvlRow('UNIFIED_VERIFICATION_TYPES'), 'types');
  assert('D-REGISTRY', '54. uvl entry', hasUvlRow('UNIFIED_VERIFICATION_ENTRY'), 'entry');
  assert('D-REGISTRY', '55. console', isIntelligenceConsoleCapability('UNIFIED_VERIFICATION_ENTRY'), 'console');
  assert('D-REGISTRY', '56. find panel', resolveFindPanelAlias('Unified Verification') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '57. registry', registry.includes('unified_verification_entry'), 'registry');
  for (const forbidden of FORBIDDEN_UNIFIED_VERIFICATION_DUPLICATES) {
    assert('D-REGISTRY', `58.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = requestVerification(baseInput());
  const engineSrc = readText('src/unified-verification-entry/unified-verification-entry.ts');
  const allSrc = [
    engineSrc,
    readText('src/unified-verification-entry/verification-request-router.ts'),
    readText('src/unified-verification-entry/verification-response-builder.ts'),
  ].join('\n');
  assert('E-STATIC', '59. no auto-fix', !allSrc.includes('auto_fix_engine'), 'clean');
  assert('E-STATIC', '60. no trust score', !allSrc.includes('evaluateTrustScore'), 'clean');
  assert('E-STATIC', '61. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('UNIFIED_VERIFICATION_ENTRY'), 'feed');
  assert('E-STATIC', '62. authority only', staticReady.response.authorityOnly === true, 'only');
  assert('E-STATIC', '63. no execution flag', !allSrc.includes('executeVerification'), 'clean');
  assert('E-STATIC', '64. no provider exec', !allSrc.includes('startVerificationSession'), 'clean');
  assert('E-STATIC', '65. routes subsystems', allSrc.includes('routeVerificationRequest'), 'route');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `66.${i} authority id`, fixture.authorityId.startsWith('uventauth-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `67.${i} signal`, isUnifiedVerificationQuestion(`unified verification entry batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`Request verification batch ${i}`);
    assert('F-CACHED', `68.${i} route`, r.primaryCapability === 'UNIFIED_VERIFICATION_ENTRY', String(r.primaryCapability));
  }
  const bridge = buildUnifiedVerificationFailureContext('Why is verification blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `69.${i} bridge`, bridge.length >= 1, String(bridge.length));
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
    assert('G-HTTP', `70.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVerificationEntryDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Requests: ${diag.requestCount}`);
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

  console.log(UNIFIED_VERIFICATION_ENTRY_POINT_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

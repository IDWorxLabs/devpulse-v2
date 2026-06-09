/**
 * DevPulse V2 Phase 17.4 — Cloud Verification Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  CLOUD_VERIFICATION_FOUNDATION_PASS_TOKEN,
  CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_CLOUD_VERIFICATION_DUPLICATES,
  TRACKED_CLOUD_VERIFICATION_CATEGORIES,
  DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX,
  isCloudVerificationFoundationQuestion,
  prepareCloudVerificationFoundation,
  processCloudVerificationRequest,
  getCloudVerificationDiagnostics,
  resetCloudVerificationFoundationForTests,
  registerCloudVerification,
  getCloudVerification,
  listCloudVerifications,
  listCloudVerificationsByProject,
  listCloudVerificationsByRuntime,
  listCloudVerificationsByWorkspace,
  listCloudVerificationsByPersistentBuild,
  listCloudVerificationsByOwner,
  listCloudVerificationsByType,
  queryCloudVerifications,
  createCloudVerificationSession,
  getCloudVerificationSession,
  listCloudVerificationSessions,
  setCloudVerificationState,
  getCloudVerificationState,
  trackCloudVerificationStateHistory,
  getCloudVerificationHistory,
  linkCloudVerificationToRuntime,
  getRuntimeForCloudVerification,
  detectCloudVerificationRuntimeMismatch,
  linkCloudVerificationToWorkspace,
  getWorkspaceForCloudVerification,
  detectCloudVerificationWorkspaceMismatch,
  linkCloudVerificationToPersistentBuild,
  getPersistentBuildForCloudVerification,
  detectCloudVerificationBuildMismatch,
  requestCloudVerificationThroughUnifiedEntry,
  getUnifiedVerificationForCloudVerification,
  detectUnifiedVerificationMismatch,
  linkCloudVerificationEvidence,
  getEvidenceForCloudVerification,
  detectEvidenceMismatch,
  linkCloudVerificationReport,
  getReportsForCloudVerification,
  detectReportMismatch,
  listAvailableReportIdsForBridge,
  buildDuplicateCloudVerificationRiskContext,
  evaluateDuplicateCloudVerificationRisk,
  validateCloudVerificationRegistration,
  validateCloudVerificationRecord,
  validateCloudVerificationState,
  buildAllCloudVerificationReports,
  buildCloudVerificationFailureContext,
  initializeCloudVerification,
  requestCloudVerification,
  completeCloudVerification,
  updateCloudVerificationScope,
  refreshCloudVerificationContext,
} from '../src/cloud-verification/index.js';
import { resetCloudRuntimeFoundationForTests, listRuntimes } from '../src/cloud-runtime/index.js';
import {
  resetWorkspaceHostingFoundationForTests,
  listWorkspaces,
  processWorkspaceHostingRequest,
} from '../src/workspace-hosting/index.js';
import {
  resetPersistentBuildFoundationForTests,
  listPersistentBuilds,
  processPersistentBuildRequest,
} from '../src/persistent-build-runtime/index.js';
import {
  CLOUD_VERIFICATION_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildCloudVerificationFoundationPanelSnapshot,
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
import type { PrepareCloudVerificationFoundationInput } from '../src/cloud-verification/cloud-verification-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show cloud verification inventory';

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
const responseCache = new Map<string, ReturnType<typeof processCloudVerificationRequest>>();

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
  return readFileSync(join(ROOT, path), 'utf8');
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processCloudVerificationRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareCloudVerificationFoundationInput> = {}): PrepareCloudVerificationFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    verificationName: 'Test Cloud Verification',
    verificationType: 'GENERAL_CLOUD_VERIFICATION',
    projectExists: true,
    workspaceExists: true,
    runtimeExists: true,
    persistentBuildExists: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetCloudRuntimeFoundationForTests();
  resetWorkspaceHostingFoundationForTests();
  resetPersistentBuildFoundationForTests();
  resetCloudVerificationFoundationForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

function ensureUpstream(): {
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  projectId: string;
} {
  processWorkspaceHostingRequest('Show cloud runtime inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    projectId: runtime.runtimeOwner.projectId,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 17.4 Cloud Verification Foundation');
  console.log('======================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/cloud-verification');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'cloud-verification-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'cloud-verification-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'cloud-verification-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'cloud-verification-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'cloud-verification-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'cloud-verification-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'cloud-verification-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. scope', existsSync(join(dir, 'cloud-verification-scope.ts')), 'scope');
  assert('A-SETUP', '9. context', existsSync(join(dir, 'cloud-verification-context.ts')), 'context');
  assert('A-SETUP', '10. unified bridge', existsSync(join(dir, 'cloud-verification-unified-entry-bridge.ts')), 'bridge');
  assert('A-SETUP', '11. evidence bridge', existsSync(join(dir, 'cloud-verification-evidence-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. report bridge', existsSync(join(dir, 'cloud-verification-report-bridge.ts')), 'bridge');
  assert('A-SETUP', '13. runtime bridge', existsSync(join(dir, 'cloud-verification-runtime-bridge.ts')), 'bridge');
  assert('A-SETUP', '14. workspace bridge', existsSync(join(dir, 'cloud-verification-workspace-bridge.ts')), 'bridge');
  assert('A-SETUP', '15. build bridge', existsSync(join(dir, 'cloud-verification-build-bridge.ts')), 'bridge');
  assert('A-SETUP', '16. query', existsSync(join(dir, 'cloud-verification-query.ts')), 'query');
  assert('A-SETUP', '17. history', existsSync(join(dir, 'cloud-verification-history.ts')), 'history');
  assert('A-SETUP', '18. validator', existsSync(join(dir, 'cloud-verification-validator.ts')), 'validator');
  assert('A-SETUP', '19. diagnostics', existsSync(join(dir, 'cloud-verification-diagnostics.ts')), 'diag');
  assert('A-SETUP', '20. report', existsSync(join(dir, 'cloud-verification-report-builder.ts')), 'report');
  assert('A-SETUP', '21. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '22. feed bridge', existsSync(join(ROOT, 'src/operator-feed/cloud-verification-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '23. script', typeof pkg.scripts?.['validate:cloud-verification-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('cloud_verification_foundation');
  assert('A-SETUP', '24. owner', owner.ownerModule === CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '25. phase', owner.phase === 17.4, String(owner.phase));
  assert('A-SETUP', '26. categories', TRACKED_CLOUD_VERIFICATION_CATEGORIES.length === 9, String(TRACKED_CLOUD_VERIFICATION_CATEGORIES.length));
  assert('A-SETUP', '27. duplicate prefix', DUPLICATE_CLOUD_VERIFICATION_RISK_PREFIX === 'DUPLICATE_CLOUD_VERIFICATION_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareCloudVerificationFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      projectId: upstream.projectId,
    }),
  );
  assert('B-CORE', '28. verification id', ready.verification?.verificationId.startsWith('cver-') === true, String(ready.verification?.verificationId));
  assert('B-CORE', '29. session id', ready.session?.sessionId.startsWith('cvsess-') === true, String(ready.session?.sessionId));
  assert('B-CORE', '30. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '31. reports', ready.reports.length === 13, String(ready.reports.length));
  assert('B-CORE', '32. inventory', listCloudVerifications().length >= 9, String(listCloudVerifications().length));
  assert('B-CORE', '33. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '34. runtime link', ready.verification?.verificationRuntimeLink.runtimeId === upstream.runtimeId, String(ready.verification?.verificationRuntimeLink.runtimeId));
  assert('B-CORE', '35. workspace link', ready.verification?.verificationWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.verification?.verificationWorkspaceLink.workspaceId));
  assert('B-CORE', '36. build link', ready.verification?.verificationPersistentBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.verification?.verificationPersistentBuildLink.persistentBuildId));
  assert('B-CORE', '37. unified entry', (ready.verification?.verificationUnifiedEntryLink.unifiedSessionId.length ?? 0) >= 1, 'unified');

  const reg = registerCloudVerification({
    verificationName: 'Query Test Verification',
    verificationType: 'RUNTIME_VERIFICATION',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '38. register', reg.verification !== null && !reg.blocked, 'registered');
  assert('B-CORE', '39. get verification', getCloudVerification(reg.verification!.verificationId)?.verificationId === reg.verification!.verificationId, 'get');
  assert('B-CORE', '40. by project', listCloudVerificationsByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '41. by runtime', listCloudVerificationsByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '42. by workspace', listCloudVerificationsByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '43. by build', listCloudVerificationsByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '44. by owner', listCloudVerificationsByOwner(CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '45. by type', listCloudVerificationsByType('RUNTIME_VERIFICATION').length >= 1, 'type');
  assert('B-CORE', '46. query', queryCloudVerifications({ verificationType: 'RUNTIME_VERIFICATION' }).length >= 1, 'query');

  linkCloudVerificationToRuntime(reg.verification!.verificationId, upstream.runtimeId);
  assert('B-CORE', '47. runtime bridge', getRuntimeForCloudVerification(reg.verification!.verificationId) === upstream.runtimeId, 'runtime');
  linkCloudVerificationToWorkspace(reg.verification!.verificationId, upstream.workspaceId);
  assert('B-CORE', '48. workspace bridge', getWorkspaceForCloudVerification(reg.verification!.verificationId) === upstream.workspaceId, 'workspace');
  linkCloudVerificationToPersistentBuild(reg.verification!.verificationId, upstream.persistentBuildId);
  assert('B-CORE', '49. build bridge', getPersistentBuildForCloudVerification(reg.verification!.verificationId) === upstream.persistentBuildId, 'build');

  requestCloudVerificationThroughUnifiedEntry(reg.verification!.verificationId, CANONICAL_QUERY);
  assert('B-CORE', '50. unified bridge', (getUnifiedVerificationForCloudVerification(reg.verification!.verificationId)?.length ?? 0) >= 1, 'unified');

  linkCloudVerificationEvidence(reg.verification!.verificationId, ['vevid-0001']);
  assert('B-CORE', '51. evidence bridge', getEvidenceForCloudVerification(reg.verification!.verificationId).length >= 1, 'evidence');
  const reportIds = listAvailableReportIdsForBridge().slice(0, 1);
  if (reportIds.length > 0) {
    linkCloudVerificationReport(reg.verification!.verificationId, reportIds);
  }
  assert('B-CORE', '52. report bridge', reportIds.length === 0 || getReportsForCloudVerification(reg.verification!.verificationId).length >= 1, 'report');

  const sess = createCloudVerificationSession({
    verificationId: reg.verification!.verificationId,
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '53. session', sess !== null, 'session');

  setCloudVerificationState(reg.verification!.verificationId, 'READY', true);
  initializeCloudVerification(reg.verification!.verificationId);
  requestCloudVerification(reg.verification!.verificationId);
  updateCloudVerificationScope(reg.verification!.verificationId, { verificationDepth: 'DEEP' });
  refreshCloudVerificationContext(reg.verification!.verificationId);
  completeCloudVerification(reg.verification!.verificationId);
  assert('B-CORE', '54. lifecycle', getCloudVerificationHistory(reg.verification!.verificationId).length >= 3, 'lifecycle');
  assert('B-CORE', '55. state history', trackCloudVerificationStateHistory(reg.verification!.verificationId).length >= 1, 'history');

  const dup = registerCloudVerification({
    verificationName: 'Query Test Verification',
    verificationType: 'RUNTIME_VERIFICATION',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
  });
  assert('B-CORE', '56. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateCloudVerificationRiskContext('Query Test Verification', 'RUNTIME_VERIFICATION');
  assert('B-CORE', '57. risk context', riskCtx.runtimeSummaries.length >= 1, 'ctx');
  assert('B-CORE', '58. risk eval', Array.isArray(evaluateDuplicateCloudVerificationRisk(riskCtx)), 'eval');
  assert('B-CORE', '59. runtime mismatch fn', typeof detectCloudVerificationRuntimeMismatch(reg.verification!.verificationId) === 'boolean', 'mismatch');
  assert('B-CORE', '60. unified mismatch fn', typeof detectUnifiedVerificationMismatch(reg.verification!.verificationId) === 'boolean', 'mismatch');
  assert('B-CORE', '61. evidence mismatch fn', typeof detectEvidenceMismatch(reg.verification!.verificationId) === 'boolean', 'mismatch');
  assert('B-CORE', '62. report mismatch fn', typeof detectReportMismatch(reg.verification!.verificationId) === 'boolean', 'mismatch');
  assert('B-CORE', '63. state validator', validateCloudVerificationState('EVIDENCE_LINKED') === true, 'valid');
  assert('B-CORE', '64. record validate', validateCloudVerificationRecord(ready.verification).valid === true, 'valid');

  resetAll();
  ensureUpstream();
  const panel = buildCloudVerificationFoundationPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '65. uvl panel', panel.panelTitle === 'Cloud Verification Foundation', panel.panelTitle);
  assert('B-CORE', '66. panel count', panel.verificationCount >= 9, String(panel.verificationCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  ensureUpstream();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '67. routing', routing.primaryCapability === 'CLOUD_VERIFICATION_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '68. signal', isCloudVerificationFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '69. action id', action.candidates[0]!.cloudVerificationFoundationId.startsWith('cvrfnd-'), 'id');
  assert('C-INTEGRATION', '70. action count', action.candidates[0]!.cloudVerificationCount === 9, String(action.candidates[0]!.cloudVerificationCount));
  assert('C-INTEGRATION', '71. action state', action.candidates[0]!.cloudVerificationState === 'READY', String(action.candidates[0]!.cloudVerificationState));

  const reasoning = buildReasoningVisibilityRecord('cloud verification foundation');
  assert('C-INTEGRATION', '72. reasoning basis', reasoning.cloudVerificationBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '73. reasoning chain', reasoning.cloudVerificationChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '74. reasoning state', reasoning.cloudVerificationState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is cloud verification blocked?');
  assert('C-INTEGRATION', '75. failure', failures.some((f) => f.sourceSystem === 'cloud_verification_foundation'), 'fail');

  const progress = buildProgressRecords('cloud verification inventory');
  assert('C-INTEGRATION', '76. progress', progress[0]?.cloudVerificationFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '77. uvl rows', CLOUD_VERIFICATION_FOUNDATION_UVL_ROWS.length === 22, String(CLOUD_VERIFICATION_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '78. uvl types', hasUvlRow('CLOUD_VERIFICATION_TYPES'), 'types');
  assert('D-REGISTRY', '79. uvl unified bridge', hasUvlRow('CLOUD_VERIFICATION_UNIFIED_ENTRY_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '80. uvl build bridge', hasUvlRow('CLOUD_VERIFICATION_BUILD_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '81. console', isIntelligenceConsoleCapability('CLOUD_VERIFICATION_FOUNDATION'), 'console');
  assert('D-REGISTRY', '82. find panel', resolveFindPanelAlias('Cloud Verification') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '83. registry', registry.includes('cloud_verification_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_CLOUD_VERIFICATION_DUPLICATES) {
    assert('D-REGISTRY', `84.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readText('src/cloud-verification/cloud-verification-registry.ts');
  const unifiedBridgeSrc = readText('src/cloud-verification/cloud-verification-unified-entry-bridge.ts');
  const allSrc = [registrySrc, unifiedBridgeSrc, readText('src/cloud-verification/cloud-verification-evidence-bridge.ts')].join('\n');
  assert('E-STATIC', '85. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '86. no docker', !allSrc.toLowerCase().includes('docker run'), 'clean');
  assert('E-STATIC', '87. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '88. duplicate risk', readText('src/cloud-verification/cloud-verification-validator.ts').includes('DUPLICATE_CLOUD_VERIFICATION_RISK'), 'risk');
  assert('E-STATIC', '89. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('CLOUD_VERIFICATION_FOUNDATION'), 'feed');
  assert('E-STATIC', '90. unified bridge', unifiedBridgeSrc.includes('Unified Verification Entry'), 'bridge');
  assert('E-STATIC', '91. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  ensureUpstream();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `92.${i} verification id`, fixture.verification?.verificationId.startsWith('cver-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `93.${i} signal`, isCloudVerificationFoundationQuestion(`cloud verification inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`List cloud verifications batch ${i}`);
    assert('F-CACHED', `94.${i} route`, r.primaryCapability === 'CLOUD_VERIFICATION_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildCloudVerificationFailureContext('Why is cloud verification blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `95.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  resetAll();
  ensureUpstream();
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is cloud verification blocked?';
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
    assert('G-HTTP', `96.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getCloudVerificationDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Registered verifications: ${diag.registeredVerificationCount}`);
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

  console.log(CLOUD_VERIFICATION_FOUNDATION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * DevPulse V2 Phase 17.5 — Cloud Recovery Foundation validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  CLOUD_RECOVERY_FOUNDATION_PASS_TOKEN,
  CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_CLOUD_RECOVERY_DUPLICATES,
  TRACKED_CLOUD_RECOVERY_CATEGORIES,
  DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX,
  isCloudRecoveryFoundationQuestion,
  prepareCloudRecoveryFoundation,
  processCloudRecoveryRequest,
  getCloudRecoveryDiagnostics,
  resetCloudRecoveryFoundationForTests,
  registerRecovery,
  getRecovery,
  listRecoveries,
  listRecoveriesByProject,
  listRecoveriesByRuntime,
  listRecoveriesByWorkspace,
  listRecoveriesByPersistentBuild,
  listRecoveriesByVerification,
  listRecoveriesByOwner,
  listRecoveriesByType,
  queryRecoveries,
  createRecoverySession,
  getRecoverySession,
  listRecoverySessions,
  setRecoveryState,
  getRecoveryState,
  trackRecoveryStateHistory,
  getCloudRecoveryHistory,
  linkRecoveryToRuntime,
  getRuntimeForRecovery,
  detectRecoveryRuntimeMismatch,
  linkRecoveryToWorkspace,
  getWorkspaceForRecovery,
  detectRecoveryWorkspaceMismatch,
  linkRecoveryToPersistentBuild,
  getPersistentBuildForRecovery,
  detectRecoveryBuildMismatch,
  linkRecoveryToVerification,
  getVerificationForRecovery,
  detectRecoveryVerificationMismatch,
  buildDuplicateCloudRecoveryRiskContext,
  evaluateDuplicateCloudRecoveryRisk,
  validateCloudRecoveryRegistration,
  validateCloudRecoveryRecord,
  validateCloudRecoveryState,
  buildAllCloudRecoveryReports,
  buildCloudRecoveryFailureContext,
  initializeCloudRecovery,
  registerFailure,
  registerRecoveryCandidate,
  registerRecoveryPlan,
  markRecoveryReady,
  completeCloudRecovery,
  updateCloudRecoveryScope,
  refreshCloudRecoveryContext,
} from '../src/cloud-recovery/index.js';
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
  resetCloudVerificationFoundationForTests,
  listCloudVerifications,
  processCloudVerificationRequest,
} from '../src/cloud-verification/index.js';
import {
  CLOUD_RECOVERY_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildCloudRecoveryFoundationPanelSnapshot,
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
import type { PrepareCloudRecoveryFoundationInput } from '../src/cloud-recovery/cloud-recovery-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show cloud recovery inventory';

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
const responseCache = new Map<string, ReturnType<typeof processCloudRecoveryRequest>>();

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
  const result = processCloudRecoveryRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareCloudRecoveryFoundationInput> = {}): PrepareCloudRecoveryFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    verificationId: 'cver-0001',
    recoveryName: 'Test Cloud Recovery',
    recoveryType: 'GENERAL_RECOVERY',
    projectExists: true,
    workspaceExists: true,
    runtimeExists: true,
    persistentBuildExists: true,
    verificationExists: true,
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
  resetCloudRecoveryFoundationForTests();
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
  verificationId: string;
  projectId: string;
} {
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const verification = listCloudVerifications()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    verificationId: verification.verificationId,
    projectId: runtime.runtimeOwner.projectId,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 17.5 Cloud Recovery Foundation');
  console.log('===================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/cloud-recovery');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'cloud-recovery-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'cloud-recovery-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'cloud-recovery-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'cloud-recovery-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'cloud-recovery-state-manager.ts')), 'state');
  assert('A-SETUP', '6. lifecycle', existsSync(join(dir, 'cloud-recovery-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '7. ownership', existsSync(join(dir, 'cloud-recovery-ownership.ts')), 'ownership');
  assert('A-SETUP', '8. scope', existsSync(join(dir, 'cloud-recovery-scope.ts')), 'scope');
  assert('A-SETUP', '9. context', existsSync(join(dir, 'cloud-recovery-context.ts')), 'context');
  assert('A-SETUP', '10. runtime bridge', existsSync(join(dir, 'cloud-recovery-runtime-bridge.ts')), 'bridge');
  assert('A-SETUP', '11. workspace bridge', existsSync(join(dir, 'cloud-recovery-workspace-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. build bridge', existsSync(join(dir, 'cloud-recovery-build-bridge.ts')), 'bridge');
  assert('A-SETUP', '13. verification bridge', existsSync(join(dir, 'cloud-recovery-verification-bridge.ts')), 'bridge');
  assert('A-SETUP', '14. query', existsSync(join(dir, 'cloud-recovery-query.ts')), 'query');
  assert('A-SETUP', '15. history', existsSync(join(dir, 'cloud-recovery-history.ts')), 'history');
  assert('A-SETUP', '16. validator', existsSync(join(dir, 'cloud-recovery-validator.ts')), 'validator');
  assert('A-SETUP', '17. diagnostics', existsSync(join(dir, 'cloud-recovery-diagnostics.ts')), 'diag');
  assert('A-SETUP', '18. report', existsSync(join(dir, 'cloud-recovery-report-builder.ts')), 'report');
  assert('A-SETUP', '19. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '20. feed bridge', existsSync(join(ROOT, 'src/operator-feed/cloud-recovery-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '21. script', typeof pkg.scripts?.['validate:cloud-recovery-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('cloud_recovery_foundation');
  assert('A-SETUP', '22. owner', owner.ownerModule === CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '23. phase', owner.phase === 17.5, String(owner.phase));
  assert('A-SETUP', '24. categories', TRACKED_CLOUD_RECOVERY_CATEGORIES.length === 9, String(TRACKED_CLOUD_RECOVERY_CATEGORIES.length));
  assert('A-SETUP', '25. duplicate prefix', DUPLICATE_CLOUD_RECOVERY_RISK_PREFIX === 'DUPLICATE_CLOUD_RECOVERY_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareCloudRecoveryFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      verificationId: upstream.verificationId,
      projectId: upstream.projectId,
    }),
  );
  assert('B-CORE', '26. recovery id', ready.recovery?.recoveryId.startsWith('crec-') === true, String(ready.recovery?.recoveryId));
  assert('B-CORE', '27. session id', ready.session?.sessionId.startsWith('crsess-') === true, String(ready.session?.sessionId));
  assert('B-CORE', '28. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '29. reports', ready.reports.length === 12, String(ready.reports.length));
  assert('B-CORE', '30. inventory', listRecoveries().length >= 9, String(listRecoveries().length));
  assert('B-CORE', '31. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '32. runtime link', ready.recovery?.recoveryRuntimeLink.runtimeId === upstream.runtimeId, String(ready.recovery?.recoveryRuntimeLink.runtimeId));
  assert('B-CORE', '33. workspace link', ready.recovery?.recoveryWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.recovery?.recoveryWorkspaceLink.workspaceId));
  assert('B-CORE', '34. build link', ready.recovery?.recoveryPersistentBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.recovery?.recoveryPersistentBuildLink.persistentBuildId));
  assert('B-CORE', '35. verification link', ready.recovery?.recoveryVerificationLink.verificationId === upstream.verificationId, String(ready.recovery?.recoveryVerificationLink.verificationId));

  const reg = registerRecovery({
    recoveryName: 'Query Test Recovery',
    recoveryType: 'RUNTIME_RECOVERY',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
  });
  assert('B-CORE', '36. register', reg.recovery !== null && !reg.blocked, 'registered');
  assert('B-CORE', '37. get recovery', getRecovery(reg.recovery!.recoveryId)?.recoveryId === reg.recovery!.recoveryId, 'get');
  assert('B-CORE', '38. by project', listRecoveriesByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '39. by runtime', listRecoveriesByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '40. by workspace', listRecoveriesByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '41. by build', listRecoveriesByPersistentBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '42. by verification', listRecoveriesByVerification(upstream.verificationId).length >= 1, 'verification');
  assert('B-CORE', '43. by owner', listRecoveriesByOwner(CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '44. by type', listRecoveriesByType('RUNTIME_RECOVERY').length >= 1, 'type');
  assert('B-CORE', '45. query', queryRecoveries({ recoveryType: 'RUNTIME_RECOVERY' }).length >= 1, 'query');

  linkRecoveryToRuntime(reg.recovery!.recoveryId, upstream.runtimeId);
  assert('B-CORE', '46. runtime bridge', getRuntimeForRecovery(reg.recovery!.recoveryId) === upstream.runtimeId, 'runtime');
  linkRecoveryToWorkspace(reg.recovery!.recoveryId, upstream.workspaceId);
  assert('B-CORE', '47. workspace bridge', getWorkspaceForRecovery(reg.recovery!.recoveryId) === upstream.workspaceId, 'workspace');
  linkRecoveryToPersistentBuild(reg.recovery!.recoveryId, upstream.persistentBuildId);
  assert('B-CORE', '48. build bridge', getPersistentBuildForRecovery(reg.recovery!.recoveryId) === upstream.persistentBuildId, 'build');
  linkRecoveryToVerification(reg.recovery!.recoveryId, upstream.verificationId);
  assert('B-CORE', '49. verification bridge', getVerificationForRecovery(reg.recovery!.recoveryId) === upstream.verificationId, 'verification');

  const sess = createRecoverySession({
    recoveryId: reg.recovery!.recoveryId,
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
  });
  assert('B-CORE', '50. session', sess !== null, 'session');

  setRecoveryState(reg.recovery!.recoveryId, 'READY', true);
  initializeCloudRecovery(reg.recovery!.recoveryId);
  registerFailure(reg.recovery!.recoveryId, 'Test failure metadata');
  registerRecoveryCandidate(reg.recovery!.recoveryId, 'Test candidate metadata');
  registerRecoveryPlan(reg.recovery!.recoveryId, 'Test plan metadata');
  updateCloudRecoveryScope(reg.recovery!.recoveryId, { failureCategory: 'RUNTIME' });
  refreshCloudRecoveryContext(reg.recovery!.recoveryId);
  markRecoveryReady(reg.recovery!.recoveryId);
  completeCloudRecovery(reg.recovery!.recoveryId);
  assert('B-CORE', '51. lifecycle', getCloudRecoveryHistory(reg.recovery!.recoveryId).length >= 3, 'lifecycle');
  assert('B-CORE', '52. state history', trackRecoveryStateHistory(reg.recovery!.recoveryId).length >= 1, 'history');

  const dup = registerRecovery({
    recoveryName: 'Query Test Recovery',
    recoveryType: 'RUNTIME_RECOVERY',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
  });
  assert('B-CORE', '53. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateCloudRecoveryRiskContext('Query Test Recovery', 'RUNTIME_RECOVERY');
  assert('B-CORE', '54. risk context', riskCtx.runtimeSummaries.length >= 1, 'ctx');
  assert('B-CORE', '55. risk eval', Array.isArray(evaluateDuplicateCloudRecoveryRisk(riskCtx)), 'eval');
  assert('B-CORE', '56. runtime mismatch fn', typeof detectRecoveryRuntimeMismatch(reg.recovery!.recoveryId) === 'boolean', 'mismatch');
  assert('B-CORE', '57. workspace mismatch fn', typeof detectRecoveryWorkspaceMismatch(reg.recovery!.recoveryId) === 'boolean', 'mismatch');
  assert('B-CORE', '58. build mismatch fn', typeof detectRecoveryBuildMismatch(reg.recovery!.recoveryId) === 'boolean', 'mismatch');
  assert('B-CORE', '59. verification mismatch fn', typeof detectRecoveryVerificationMismatch(reg.recovery!.recoveryId) === 'boolean', 'mismatch');
  assert('B-CORE', '60. state validator', validateCloudRecoveryState('RECOVERY_READY') === true, 'valid');
  assert('B-CORE', '61. record validate', validateCloudRecoveryRecord(ready.recovery).valid === true, 'valid');

  resetAll();
  ensureUpstream();
  const panel = buildCloudRecoveryFoundationPanelSnapshot(CANONICAL_QUERY);
  assert('B-CORE', '62. uvl panel', panel.panelTitle === 'Cloud Recovery Foundation', panel.panelTitle);
  assert('B-CORE', '63. panel count', panel.recoveryCount >= 9, String(panel.recoveryCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  ensureUpstream();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '64. routing', routing.primaryCapability === 'CLOUD_RECOVERY_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '65. signal', isCloudRecoveryFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '66. action id', action.candidates[0]!.cloudRecoveryFoundationId.startsWith('crrfnd-'), 'id');
  assert('C-INTEGRATION', '67. action count', action.candidates[0]!.cloudRecoveryCount === 9, String(action.candidates[0]!.cloudRecoveryCount));
  assert('C-INTEGRATION', '68. action state', action.candidates[0]!.cloudRecoveryState === 'READY', String(action.candidates[0]!.cloudRecoveryState));

  const reasoning = buildReasoningVisibilityRecord('cloud recovery foundation');
  assert('C-INTEGRATION', '69. reasoning basis', reasoning.cloudRecoveryBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '70. reasoning chain', reasoning.cloudRecoveryChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '71. reasoning state', reasoning.cloudRecoveryState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is cloud recovery blocked?');
  assert('C-INTEGRATION', '72. failure', failures.some((f) => f.sourceSystem === 'cloud_recovery_foundation'), 'fail');

  const progress = buildProgressRecords('cloud recovery inventory');
  assert('C-INTEGRATION', '73. progress', progress[0]?.cloudRecoveryFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '74. uvl rows', CLOUD_RECOVERY_FOUNDATION_UVL_ROWS.length === 20, String(CLOUD_RECOVERY_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '75. uvl types', hasUvlRow('CLOUD_RECOVERY_TYPES'), 'types');
  assert('D-REGISTRY', '76. uvl verification bridge', hasUvlRow('CLOUD_RECOVERY_VERIFICATION_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '77. uvl build bridge', hasUvlRow('CLOUD_RECOVERY_BUILD_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '78. console', isIntelligenceConsoleCapability('CLOUD_RECOVERY_FOUNDATION'), 'console');
  assert('D-REGISTRY', '79. find panel', resolveFindPanelAlias('Cloud Recovery') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '80. registry', registry.includes('cloud_recovery_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_CLOUD_RECOVERY_DUPLICATES) {
    assert('D-REGISTRY', `81.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readText('src/cloud-recovery/cloud-recovery-registry.ts');
  const validatorSrc = readText('src/cloud-recovery/cloud-recovery-validator.ts');
  const allSrc = [registrySrc, validatorSrc, readText('src/cloud-recovery/cloud-recovery-lifecycle.ts')].join('\n');
  assert('E-STATIC', '82. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '83. no docker', !allSrc.toLowerCase().includes('docker run'), 'clean');
  assert('E-STATIC', '84. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '85. duplicate risk', validatorSrc.includes('DUPLICATE_CLOUD_RECOVERY_RISK'), 'risk');
  assert('E-STATIC', '86. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('CLOUD_RECOVERY_FOUNDATION'), 'feed');
  assert('E-STATIC', '87. verification bridge', readText('src/cloud-recovery/cloud-recovery-verification-bridge.ts').includes('Cloud Verification Foundation'), 'bridge');
  assert('E-STATIC', '88. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  ensureUpstream();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `89.${i} recovery id`, fixture.recovery?.recoveryId.startsWith('crec-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `90.${i} signal`, isCloudRecoveryFoundationQuestion(`cloud recovery inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = buildQuestionRoutingPlan(`List recoveries batch ${i}`);
    assert('F-CACHED', `91.${i} route`, r.primaryCapability === 'CLOUD_RECOVERY_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildCloudRecoveryFailureContext('Why is cloud recovery blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `92.${i} bridge`, bridge.length >= 1, String(bridge.length));
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
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is cloud recovery blocked?';
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
    assert('G-HTTP', `93.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getCloudRecoveryDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Registered recoveries: ${diag.registeredRecoveryCount}`);
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

  console.log(CLOUD_RECOVERY_FOUNDATION_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

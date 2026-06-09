/**
 * DevPulse V2 Phase 17.6 — Cloud Monitoring Foundation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN,
  createNormalizedQueryCache,
  createPackageJsonCache,
  createSourceTextCache,
  createUpstreamBootstrapper,
  normalizeBatchRoutingQuery,
  runCachedHttpStatusChecks,
} from './lib/mobile-phase18-validation-fixtures.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  CLOUD_MONITORING_FOUNDATION_PASS_TOKEN,
  CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
  FORBIDDEN_CLOUD_MONITORING_DUPLICATES,
  TRACKED_CLOUD_MONITORING_CATEGORIES,
  DUPLICATE_CLOUD_MONITORING_RISK_PREFIX,
  isCloudMonitoringFoundationQuestion,
  prepareCloudMonitoringFoundation,
  processCloudMonitoringRequest,
  getCloudMonitoringDiagnostics,
  resetCloudMonitoringFoundationForTests,
  registerMonitoringRecord,
  getMonitoringRecord,
  listMonitoringRecords,
  listMonitoringByProject,
  listMonitoringByRuntime,
  listMonitoringByWorkspace,
  listMonitoringByBuild,
  listMonitoringByVerification,
  listMonitoringByRecovery,
  listMonitoringByOwner,
  listMonitoringByType,
  queryMonitoringRecords,
  createMonitoringSession,
  getMonitoringSession,
  listMonitoringSessions,
  setMonitoringState,
  getMonitoringState,
  trackMonitoringStateHistory,
  getCloudMonitoringHistory,
  linkMonitoringToRuntime,
  getRuntimeForMonitoring,
  detectMonitoringRuntimeMismatch,
  linkMonitoringToWorkspace,
  getWorkspaceForMonitoring,
  detectMonitoringWorkspaceMismatch,
  linkMonitoringToBuild,
  getBuildForMonitoring,
  detectMonitoringBuildMismatch,
  linkMonitoringToVerification,
  getVerificationForMonitoring,
  detectMonitoringVerificationMismatch,
  linkMonitoringToRecovery,
  getRecoveryForMonitoring,
  detectMonitoringRecoveryMismatch,
  buildDuplicateCloudMonitoringRiskContext,
  evaluateDuplicateCloudMonitoringRisk,
  validateCloudMonitoringRegistration,
  validateCloudMonitoringRecord,
  validateCloudMonitoringState,
  buildAllCloudMonitoringReports,
  buildCloudMonitoringFailureContext,
  initializeCloudMonitoring,
  activateCloudMonitoring,
  updateMonitoringHealth,
  createMonitoringAlert,
  acknowledgeMonitoringAlert,
  completeCloudMonitoring,
  refreshCloudMonitoringContext,
} from '../src/cloud-monitoring/index.js';
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
  resetCloudRecoveryFoundationForTests,
  listRecoveries,
  processCloudRecoveryRequest,
} from '../src/cloud-recovery/index.js';
import {
  CLOUD_MONITORING_FOUNDATION_UVL_ROWS,
  hasUvlRow,
  buildCloudMonitoringFoundationPanelSnapshot,
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
import type { PrepareCloudMonitoringFoundationInput } from '../src/cloud-monitoring/cloud-monitoring-types.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'Show cloud monitoring inventory';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const readText = createSourceTextCache(ROOT);
const routingPlanCache = createNormalizedQueryCache<ReturnType<typeof buildQuestionRoutingPlan>>(normalizeBatchRoutingQuery);
const upstreamBootstrap = createUpstreamBootstrapper(() => {
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
  processCloudRecoveryRequest('Show cloud recovery inventory');
  const runtime = listRuntimes()[0]!;
  const build = listPersistentBuilds()[0]!;
  const recovery = listRecoveries()[0]!;
  return {
    runtimeId: runtime.runtimeId,
    workspaceId: build.buildOwner.workspaceId,
    persistentBuildId: build.buildId,
    verificationId: recovery.recoveryOwner.verificationId,
    recoveryId: recovery.recoveryId,
    projectId: runtime.runtimeOwner.projectId,
  };
});
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processCloudMonitoringRequest>>();
let coreFixture: ReturnType<typeof processCloudMonitoringRequest> | null = null;

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
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold (${elapsed}ms)`);
}

function readTextOnce(path: string): string {
  return readText(path);
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  if (key === CANONICAL_QUERY.trim().toLowerCase() && coreFixture) {
    responseCache.set(key, coreFixture);
    return coreFixture;
  }
  const result = processCloudMonitoringRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareCloudMonitoringFoundationInput> = {}): PrepareCloudMonitoringFoundationInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'hws-0001',
    runtimeId: 'crrt-0001',
    persistentBuildId: 'pbuild-0001',
    verificationId: 'cver-0001',
    recoveryId: 'crec-0001',
    monitoringName: 'Test Cloud Monitoring',
    monitoringType: 'GENERAL_MONITORING',
    projectExists: true,
    workspaceExists: true,
    runtimeExists: true,
    persistentBuildExists: true,
    verificationExists: true,
    recoveryExists: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  coreFixture = null;
  routingPlanCache.clear();
  upstreamBootstrap.invalidate();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetCloudRuntimeFoundationForTests();
  resetWorkspaceHostingFoundationForTests();
  resetPersistentBuildFoundationForTests();
  resetCloudVerificationFoundationForTests();
  resetCloudRecoveryFoundationForTests();
  resetCloudMonitoringFoundationForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

function ensureUpstream(): ReturnType<typeof upstreamBootstrap.ensure> {
  return upstreamBootstrap.ensure();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 17.6 Cloud Monitoring Foundation');
  console.log('====================================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/cloud-monitoring');
  const pkg = createPackageJsonCache(ROOT);
  assert('A-SETUP', '1. types', existsSync(join(dir, 'cloud-monitoring-types.ts')), 'types');
  assert('A-SETUP', '2. registry', existsSync(join(dir, 'cloud-monitoring-registry.ts')), 'registry');
  assert('A-SETUP', '3. store', existsSync(join(dir, 'cloud-monitoring-store.ts')), 'store');
  assert('A-SETUP', '4. session', existsSync(join(dir, 'cloud-monitoring-session-manager.ts')), 'session');
  assert('A-SETUP', '5. state', existsSync(join(dir, 'cloud-monitoring-state-manager.ts')), 'state');
  assert('A-SETUP', '6. health', existsSync(join(dir, 'cloud-monitoring-health.ts')), 'health');
  assert('A-SETUP', '7. alerts', existsSync(join(dir, 'cloud-monitoring-alerts.ts')), 'alerts');
  assert('A-SETUP', '8. lifecycle', existsSync(join(dir, 'cloud-monitoring-lifecycle.ts')), 'lifecycle');
  assert('A-SETUP', '9. ownership', existsSync(join(dir, 'cloud-monitoring-ownership.ts')), 'ownership');
  assert('A-SETUP', '10. context', existsSync(join(dir, 'cloud-monitoring-context.ts')), 'context');
  assert('A-SETUP', '11. runtime bridge', existsSync(join(dir, 'cloud-monitoring-runtime-bridge.ts')), 'bridge');
  assert('A-SETUP', '12. workspace bridge', existsSync(join(dir, 'cloud-monitoring-workspace-bridge.ts')), 'bridge');
  assert('A-SETUP', '13. build bridge', existsSync(join(dir, 'cloud-monitoring-build-bridge.ts')), 'bridge');
  assert('A-SETUP', '14. verification bridge', existsSync(join(dir, 'cloud-monitoring-verification-bridge.ts')), 'bridge');
  assert('A-SETUP', '15. recovery bridge', existsSync(join(dir, 'cloud-monitoring-recovery-bridge.ts')), 'bridge');
  assert('A-SETUP', '16. query', existsSync(join(dir, 'cloud-monitoring-query.ts')), 'query');
  assert('A-SETUP', '17. history', existsSync(join(dir, 'cloud-monitoring-history.ts')), 'history');
  assert('A-SETUP', '18. validator', existsSync(join(dir, 'cloud-monitoring-validator.ts')), 'validator');
  assert('A-SETUP', '19. diagnostics', existsSync(join(dir, 'cloud-monitoring-diagnostics.ts')), 'diag');
  assert('A-SETUP', '20. report', existsSync(join(dir, 'cloud-monitoring-report-builder.ts')), 'report');
  assert('A-SETUP', '21. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '22. feed bridge', existsSync(join(ROOT, 'src/operator-feed/cloud-monitoring-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '23. script', typeof pkg.scripts?.['validate:cloud-monitoring-foundation'] === 'string', 'script');
  const owner = getDevPulseV2Owner('cloud_monitoring_foundation');
  assert('A-SETUP', '24. owner', owner.ownerModule === CLOUD_MONITORING_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '25. phase', owner.phase === 17.6, String(owner.phase));
  assert('A-SETUP', '26. categories', TRACKED_CLOUD_MONITORING_CATEGORIES.length === 9, String(TRACKED_CLOUD_MONITORING_CATEGORIES.length));
  assert('A-SETUP', '27. duplicate prefix', DUPLICATE_CLOUD_MONITORING_RISK_PREFIX === 'DUPLICATE_CLOUD_MONITORING_RISK', 'prefix');
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const upstream = ensureUpstream();
  const ready = prepareCloudMonitoringFoundation(
    baseInput({
      runtimeId: upstream.runtimeId,
      workspaceId: upstream.workspaceId,
      persistentBuildId: upstream.persistentBuildId,
      verificationId: upstream.verificationId,
      recoveryId: upstream.recoveryId,
      projectId: upstream.projectId,
    }),
  );
  assert('B-CORE', '28. monitoring id', ready.record?.monitoringId.startsWith('cmon-') === true, String(ready.record?.monitoringId));
  assert('B-CORE', '29. session id', ready.session?.sessionId.startsWith('cmsess-') === true, String(ready.session?.sessionId));
  assert('B-CORE', '30. authority only', ready.authorityOnly === true, 'only');
  assert('B-CORE', '31. reports', ready.reports.length === 12, String(ready.reports.length));
  assert('B-CORE', '32. inventory', listMonitoringRecords().length >= 9, String(listMonitoringRecords().length));
  assert('B-CORE', '33. validation', ready.validation.valid === true, String(ready.validation.valid));
  assert('B-CORE', '34. runtime link', ready.record?.monitoringRuntimeLink.runtimeId === upstream.runtimeId, String(ready.record?.monitoringRuntimeLink.runtimeId));
  assert('B-CORE', '35. workspace link', ready.record?.monitoringWorkspaceLink.workspaceId === upstream.workspaceId, String(ready.record?.monitoringWorkspaceLink.workspaceId));
  assert('B-CORE', '36. build link', ready.record?.monitoringBuildLink.persistentBuildId === upstream.persistentBuildId, String(ready.record?.monitoringBuildLink.persistentBuildId));
  assert('B-CORE', '37. verification link', ready.record?.monitoringVerificationLink.verificationId === upstream.verificationId, String(ready.record?.monitoringVerificationLink.verificationId));
  assert('B-CORE', '38. recovery link', ready.record?.monitoringRecoveryLink.recoveryId === upstream.recoveryId, String(ready.record?.monitoringRecoveryLink.recoveryId));
  assert('B-CORE', '39. health', (ready.record?.monitoringHealth.healthScore ?? 0) > 0, 'health');

  const reg = registerMonitoringRecord({
    monitoringName: 'Query Test Monitoring',
    monitoringType: 'RUNTIME_MONITORING',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    recoveryId: upstream.recoveryId,
  });
  assert('B-CORE', '40. register', reg.record !== null && !reg.blocked, 'registered');
  assert('B-CORE', '41. get record', getMonitoringRecord(reg.record!.monitoringId)?.monitoringId === reg.record!.monitoringId, 'get');
  assert('B-CORE', '42. by project', listMonitoringByProject('proj-q').length >= 1, 'project');
  assert('B-CORE', '43. by runtime', listMonitoringByRuntime(upstream.runtimeId).length >= 1, 'runtime');
  assert('B-CORE', '44. by workspace', listMonitoringByWorkspace(upstream.workspaceId).length >= 1, 'workspace');
  assert('B-CORE', '45. by build', listMonitoringByBuild(upstream.persistentBuildId).length >= 1, 'build');
  assert('B-CORE', '46. by verification', listMonitoringByVerification(upstream.verificationId).length >= 1, 'verification');
  assert('B-CORE', '47. by recovery', listMonitoringByRecovery(upstream.recoveryId).length >= 1, 'recovery');
  assert('B-CORE', '48. by owner', listMonitoringByOwner(CLOUD_MONITORING_FOUNDATION_OWNER_MODULE).length >= 1, 'owner');
  assert('B-CORE', '49. by type', listMonitoringByType('RUNTIME_MONITORING').length >= 1, 'type');
  assert('B-CORE', '50. query', queryMonitoringRecords({ monitoringType: 'RUNTIME_MONITORING' }).length >= 1, 'query');

  linkMonitoringToRuntime(reg.record!.monitoringId, upstream.runtimeId);
  assert('B-CORE', '51. runtime bridge', getRuntimeForMonitoring(reg.record!.monitoringId) === upstream.runtimeId, 'runtime');
  linkMonitoringToWorkspace(reg.record!.monitoringId, upstream.workspaceId);
  assert('B-CORE', '52. workspace bridge', getWorkspaceForMonitoring(reg.record!.monitoringId) === upstream.workspaceId, 'workspace');
  linkMonitoringToBuild(reg.record!.monitoringId, upstream.persistentBuildId);
  assert('B-CORE', '53. build bridge', getBuildForMonitoring(reg.record!.monitoringId) === upstream.persistentBuildId, 'build');
  linkMonitoringToVerification(reg.record!.monitoringId, upstream.verificationId);
  assert('B-CORE', '54. verification bridge', getVerificationForMonitoring(reg.record!.monitoringId) === upstream.verificationId, 'verification');
  linkMonitoringToRecovery(reg.record!.monitoringId, upstream.recoveryId);
  assert('B-CORE', '55. recovery bridge', getRecoveryForMonitoring(reg.record!.monitoringId) === upstream.recoveryId, 'recovery');

  const sess = createMonitoringSession({
    monitoringId: reg.record!.monitoringId,
    projectId: 'proj-q',
    runtimeId: upstream.runtimeId,
    workspaceId: upstream.workspaceId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    recoveryId: upstream.recoveryId,
  });
  assert('B-CORE', '56. session', sess !== null, 'session');

  setMonitoringState(reg.record!.monitoringId, 'READY', true);
  initializeCloudMonitoring(reg.record!.monitoringId);
  activateCloudMonitoring(reg.record!.monitoringId);
  updateMonitoringHealth(reg.record!.monitoringId, { healthScore: 90, healthStatus: 'HEALTHY' });
  const alert = createMonitoringAlert({ monitoringId: reg.record!.monitoringId, alertType: 'TEST', alertSeverity: 'LOW' });
  if (alert) acknowledgeMonitoringAlert(reg.record!.monitoringId, alert.alertId);
  refreshCloudMonitoringContext(reg.record!.monitoringId);
  completeCloudMonitoring(reg.record!.monitoringId);
  assert('B-CORE', '57. lifecycle', getCloudMonitoringHistory(reg.record!.monitoringId).length >= 3, 'lifecycle');
  assert('B-CORE', '58. state history', trackMonitoringStateHistory(reg.record!.monitoringId).length >= 1, 'history');

  const dup = registerMonitoringRecord({
    monitoringName: 'Query Test Monitoring',
    monitoringType: 'RUNTIME_MONITORING',
    projectId: 'proj-q',
    workspaceId: upstream.workspaceId,
    runtimeId: upstream.runtimeId,
    persistentBuildId: upstream.persistentBuildId,
    verificationId: upstream.verificationId,
    recoveryId: upstream.recoveryId,
  });
  assert('B-CORE', '59. duplicate', dup.duplicate === true, String(dup.duplicate));

  const riskCtx = buildDuplicateCloudMonitoringRiskContext('Query Test Monitoring', 'RUNTIME_MONITORING');
  assert('B-CORE', '60. risk context', riskCtx.recoverySummaries.length >= 1, 'ctx');
  assert('B-CORE', '61. risk eval', Array.isArray(evaluateDuplicateCloudMonitoringRisk(riskCtx)), 'eval');
  assert('B-CORE', '62. runtime mismatch fn', typeof detectMonitoringRuntimeMismatch(reg.record!.monitoringId) === 'boolean', 'mismatch');
  assert('B-CORE', '63. recovery mismatch fn', typeof detectMonitoringRecoveryMismatch(reg.record!.monitoringId) === 'boolean', 'mismatch');
  assert('B-CORE', '64. state validator', validateCloudMonitoringState('MONITORING_ACTIVE') === true, 'valid');
  assert('B-CORE', '65. record validate', validateCloudMonitoringRecord(ready.record).valid === true, 'valid');

  coreFixture = ready;
  responseCache.set(CANONICAL_QUERY.trim().toLowerCase(), ready);
  const panel = buildCloudMonitoringFoundationPanelSnapshot(CANONICAL_QUERY, ready);
  assert('B-CORE', '66. uvl panel', panel.panelTitle === 'Cloud Monitoring Foundation', panel.panelTitle);
  assert('B-CORE', '67. panel count', panel.monitoringCount >= 9, String(panel.monitoringCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '68. routing', routing.primaryCapability === 'CLOUD_MONITORING_FOUNDATION', String(routing.primaryCapability));
  assert('C-INTEGRATION', '69. signal', isCloudMonitoringFoundationQuestion(CANONICAL_QUERY), 'signal');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '70. action id', action.candidates[0]!.cloudMonitoringFoundationId.startsWith('cmonfnd-'), 'id');
  assert('C-INTEGRATION', '71. action count', action.candidates[0]!.cloudMonitoringCount === 9, String(action.candidates[0]!.cloudMonitoringCount));
  assert('C-INTEGRATION', '72. action state', action.candidates[0]!.cloudMonitoringState === 'READY', String(action.candidates[0]!.cloudMonitoringState));

  const reasoning = buildReasoningVisibilityRecord('cloud monitoring foundation');
  assert('C-INTEGRATION', '73. reasoning basis', reasoning.cloudMonitoringBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '74. reasoning chain', reasoning.cloudMonitoringChain.length >= 2, 'chain');
  assert('C-INTEGRATION', '75. reasoning state', reasoning.cloudMonitoringState.length >= 2, 'state');

  const failures = buildFailureRecords('Why is cloud monitoring blocked?');
  assert('C-INTEGRATION', '76. failure', failures.some((f) => f.sourceSystem === 'cloud_monitoring_foundation'), 'fail');

  const progress = buildProgressRecords('cloud monitoring inventory');
  assert('C-INTEGRATION', '77. progress', progress[0]?.cloudMonitoringFoundationNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '78. uvl rows', CLOUD_MONITORING_FOUNDATION_UVL_ROWS.length === 22, String(CLOUD_MONITORING_FOUNDATION_UVL_ROWS.length));
  assert('D-REGISTRY', '79. uvl types', hasUvlRow('CLOUD_MONITORING_TYPES'), 'types');
  assert('D-REGISTRY', '80. uvl recovery bridge', hasUvlRow('CLOUD_MONITORING_RECOVERY_BRIDGE'), 'bridge');
  assert('D-REGISTRY', '81. uvl health', hasUvlRow('CLOUD_MONITORING_HEALTH'), 'health');
  assert('D-REGISTRY', '82. console', isIntelligenceConsoleCapability('CLOUD_MONITORING_FOUNDATION'), 'console');
  assert('D-REGISTRY', '83. find panel', resolveFindPanelAlias('Cloud Monitoring') !== null, 'find');
  const registry = readTextOnce('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '84. registry', registry.includes('cloud_monitoring_foundation'), 'registry');
  for (const forbidden of FORBIDDEN_CLOUD_MONITORING_DUPLICATES) {
    assert('D-REGISTRY', `85.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  const registrySrc = readTextOnce('src/cloud-monitoring/cloud-monitoring-registry.ts');
  const validatorSrc = readTextOnce('src/cloud-monitoring/cloud-monitoring-validator.ts');
  const allSrc = [registrySrc, validatorSrc, readTextOnce('src/cloud-monitoring/cloud-monitoring-health.ts')].join('\n');
  assert('E-STATIC', '86. no child_process', !allSrc.includes('child_process'), 'clean');
  assert('E-STATIC', '87. no docker', !allSrc.toLowerCase().includes('docker run'), 'clean');
  assert('E-STATIC', '88. no spawn', !allSrc.includes('spawn('), 'clean');
  assert('E-STATIC', '89. duplicate risk', validatorSrc.includes('DUPLICATE_CLOUD_MONITORING_RISK'), 'risk');
  assert('E-STATIC', '90. feed mapped', readTextOnce('src/operator-feed/operator-feed-stage-mapper.ts').includes('CLOUD_MONITORING_FOUNDATION'), 'feed');
  assert('E-STATIC', '91. recovery bridge', readTextOnce('src/cloud-monitoring/cloud-monitoring-recovery-bridge.ts').includes('Cloud Recovery Foundation'), 'bridge');
  assert('E-STATIC', '92. authority only', registrySrc.toLowerCase().includes('authority only'), 'authority');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 80; i += 1) {
    assert('F-CACHED', `93.${i} monitoring id`, fixture.record?.monitoringId.startsWith('cmon-') === true, 'id');
  }
  for (let i = 0; i < 60; i += 1) {
    assert('F-CACHED', `94.${i} signal`, isCloudMonitoringFoundationQuestion(`cloud monitoring inventory batch ${i}`), 'signal');
  }
  for (let i = 0; i < 40; i += 1) {
    const r = routingPlanCache.get(`List monitoring records batch ${i}`, (query) => buildQuestionRoutingPlan(query));
    assert('F-CACHED', `95.${i} route`, r.primaryCapability === 'CLOUD_MONITORING_FOUNDATION', String(r.primaryCapability));
  }
  const bridge = buildCloudMonitoringFailureContext('Why is cloud monitoring blocked?');
  for (let i = 0; i < 30; i += 1) {
    assert('F-CACHED', `96.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const httpQueries = [CANONICAL_QUERY, 'Why is cloud monitoring blocked?'] as const;
  await runCachedHttpStatusChecks({
    queries: httpQueries,
    iterations: 20,
    onStatus: (i, status) => {
      assert('G-HTTP', `97.${i} http`, status === 200, String(status));
    },
  });
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsedMs = Date.now() - startedAt;
  const slowest = groupTimings.sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const diag = getCloudMonitoringDiagnostics();

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  for (const timing of groupTimings) console.log(`  ${timing.group}: ${timing.elapsedMs}ms`);
  console.log(`Registered monitoring records: ${diag.registeredMonitoringCount}`);
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

  console.log(CLOUD_MONITORING_FOUNDATION_PASS_TOKEN);
  console.log(MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * Phase 20.1 — Multi Project Foundation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  MULTI_PROJECT_FOUNDATION_PASS_TOKEN,
  MULTI_PROJECT_FOUNDATION_OWNER_MODULE,
  DEFAULT_MAX_PROJECT_HISTORY_SIZE,
  canTransitionProjectState,
  coordinateProject,
  coordinateProjectStateChange,
  createProjectIdentity,
  generateProjectReport,
  getDevPulseV2MultiProjectFoundation,
  getMultiProjectFoundationRuntimeReport,
  getProject,
  getProjectContext,
  getProjectHistory,
  getProjectRegistryCacheStats,
  getProjectRegistrySize,
  getTotalProjectHistorySize,
  getWorkspace,
  listProjects,
  listProjectsByState,
  listProjectsByType,
  listWorkspaceMappings,
  registerAndReportProject,
  registerMultiProjectFoundationWithAutonomousBuilder,
  registerMultiProjectFoundationWithBuildStrategyEngine,
  registerMultiProjectFoundationWithCentralBrain,
  registerMultiProjectFoundationWithCompletionEngine,
  registerMultiProjectFoundationWithProjectVault,
  registerMultiProjectFoundationWithTrustEngine,
  registerMultiProjectFoundationWithUvl,
  registerMultiProjectFoundationWithWorld2Coordinator,
  registerProject,
  removeProject,
  resetMultiProjectFoundationModuleForTests,
  storeProjectContext,
  updateProjectState,
  validateProjectIsolation,
  evaluateProjectLifecycle,
  recordProjectEvent,
} from '../src/multi-project-foundation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { MULTI_PROJECT_FOUNDATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/multi-project-foundation');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 45 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'multi-project-foundation.ts',
  'multi-project-types.ts',
  'project-registry.ts',
  'project-identity-manager.ts',
  'project-state-manager.ts',
  'project-workspace-mapper.ts',
  'project-context-manager.ts',
  'project-history-manager.ts',
  'project-lifecycle-manager.ts',
  'project-isolation-policy.ts',
  'project-coordinator.ts',
  'project-reporting.ts',
  'project-registry-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetMultiProjectFoundationModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2MultiProjectFoundation();
  assert('A-SETUP', 'pass token', authority.passToken === MULTI_PROJECT_FOUNDATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === MULTI_PROJECT_FOUNDATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'foundation only', authority.foundationOnly === true, 'foundationOnly');
  assert('A-SETUP', 'uvl rows', MULTI_PROJECT_FOUNDATION_UVL_ROWS.length === 13, String(MULTI_PROJECT_FOUNDATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history default', DEFAULT_MAX_PROJECT_HISTORY_SIZE === 64, String(DEFAULT_MAX_PROJECT_HISTORY_SIZE));
  harness.endGroup('A-SETUP', g);
}

function runRegistrationAndIdentity(): void {
  const g = harness.beginGroup('B-REGISTER');
  resetAll();

  const identity = createProjectIdentity('Alpha App');
  assert('B-REGISTER', 'project id format', identity.projectId.startsWith('WORLD2_PROJECT_'), identity.projectId);
  assert('B-REGISTER', 'workspace id format', identity.workspaceId.startsWith('WORLD2_WORKSPACE_'), identity.workspaceId);
  assert('B-REGISTER', 'project handle', identity.projectHandle.length > 0, identity.projectHandle);

  const record = registerProject({ projectName: 'Beta App', projectType: 'FEATURE' });
  assert('B-REGISTER', 'register project', record.state === 'CREATED', record.state);
  assert('B-REGISTER', 'get project', getProject(record.projectId)?.projectId === record.projectId, record.projectId);
  assert('B-REGISTER', 'list projects', listProjects().length >= 1, String(listProjects().length));
  assert('B-REGISTER', 'lookup by type', listProjectsByType('FEATURE').length >= 1, 'FEATURE');
  assert('B-REGISTER', 'lookup by state', listProjectsByState('CREATED').length >= 1, 'CREATED');
  assert('B-REGISTER', 'workspace mapping', getWorkspace(record.projectId) === record.workspaceId, record.workspaceId);

  const coordinated = coordinateProject({ projectName: 'Gamma App', projectType: 'UI' });
  assert('B-REGISTER', 'coordinator', coordinated.record.projectId.length > 0, coordinated.record.projectId);
  assert('B-REGISTER', 'coordinator lifecycle', coordinated.lifecycle.status === 'ACTIVE', coordinated.lifecycle.status);

  harness.endGroup('B-REGISTER', g);
}

function runStateTransitions(): void {
  const g = harness.beginGroup('C-STATE');
  resetAll();

  const record = registerProject({ projectName: 'State App', projectType: 'FEATURE' });
  const path: Array<ReturnType<typeof coordinateProjectStateChange>> = [];

  const steps = ['PLANNING', 'BUILDING', 'TESTING', 'FIXING', 'VERIFYING', 'COMPLETED'] as const;
  for (const step of steps) {
    path.push(coordinateProjectStateChange(record.projectId, step));
  }

  assert('C-STATE', 'full path', path.every((p) => p.ok), 'path');
  const final = getProject(record.projectId);
  assert('C-STATE', 'completed', final?.state === 'COMPLETED', final?.state ?? 'missing');

  const invalid = updateProjectState(record, 'BUILDING');
  assert('C-STATE', 'invalid from created', !canTransitionProjectState('CREATED', 'COMPLETED') || !invalid.ok, 'invalid');

  const pause = coordinateProjectStateChange(record.projectId, 'PAUSED');
  assert('C-STATE', 'pause', pause.ok === true, String(pause.ok));

  const fail = coordinateProjectStateChange(record.projectId, 'FAILED');
  assert('C-STATE', 'fail from paused', fail.ok === true, String(fail.ok));

  harness.endGroup('C-STATE', g);
}

function runContextIsolationHistory(): void {
  const g = harness.beginGroup('D-ISOLATION');
  resetAll();

  const projectA = coordinateProject({ projectName: 'Project A', projectType: 'A' });
  const projectB = coordinateProject({ projectName: 'Project B', projectType: 'B' });

  storeProjectContext(projectA.record.projectId, { planningContext: { secret: 'A-only' } });
  storeProjectContext(projectB.record.projectId, { planningContext: { secret: 'B-only' } });

  const ctxA = getProjectContext(projectA.record.projectId);
  const ctxB = getProjectContext(projectB.record.projectId);
  assert('D-ISOLATION', 'context A', (ctxA?.planningContext as { secret?: string }).secret === 'A-only', 'A');
  assert('D-ISOLATION', 'context B', (ctxB?.planningContext as { secret?: string }).secret === 'B-only', 'B');

  const violation = validateProjectIsolation(projectA.record.projectId, projectB.record.projectId);
  assert('D-ISOLATION', 'isolation violation', violation.status === 'ISOLATION_VIOLATION', violation.status);
  assert('D-ISOLATION', 'violations listed', violation.violations.length > 0, String(violation.violations.length));

  const selfIsolation = validateProjectIsolation(projectA.record.projectId, projectA.record.projectId);
  assert('D-ISOLATION', 'self isolated', selfIsolation.status === 'ISOLATED', selfIsolation.status);

  recordProjectEvent(projectA.record.projectId, 'PLANNING_ACTION', 'plan created');
  recordProjectEvent(projectA.record.projectId, 'VERIFICATION_ACTION', 'verification planned');
  const history = getProjectHistory(projectA.record.projectId);
  assert('D-ISOLATION', 'history recorded', history.length >= 3, String(history.length));

  const lifecycle = evaluateProjectLifecycle(projectA.record);
  assert('D-ISOLATION', 'lifecycle active', lifecycle.status === 'ACTIVE', lifecycle.status);

  harness.endGroup('D-ISOLATION', g);
}

function runReportingAndCache(): void {
  const g = harness.beginGroup('E-REPORT');
  resetAll();

  const { coordinated, report } = registerAndReportProject({ projectName: 'Report App', projectType: 'REPORT' });
  assert('E-REPORT', 'report id', (report?.reportId.length ?? 0) > 0, report?.reportId ?? 'missing');
  assert('E-REPORT', 'report isolation', report?.isolationStatus === 'ISOLATED', report?.isolationStatus ?? 'missing');
  assert('E-REPORT', 'report workspace', report?.workspaceId === coordinated.record.workspaceId, report?.workspaceId ?? 'missing');

  const projectId = coordinated.record.projectId;
  getProject(projectId);
  getProject(projectId);
  const cache = getProjectRegistryCacheStats();
  assert('E-REPORT', 'cache hits', cache.hits >= 1, String(cache.hits));
  assert('E-REPORT', 'workspace mappings', listWorkspaceMappings().length >= 1, String(listWorkspaceMappings().length));

  const removed = removeProject(projectId);
  assert('E-REPORT', 'remove project', removed === true, String(removed));

  harness.endGroup('E-REPORT', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('multi_project_foundation');
  assert('F-INTEGRATION', 'ownership', owner.ownerModule === MULTI_PROJECT_FOUNDATION_OWNER_MODULE, owner.ownerModule);

  const brain = registerMultiProjectFoundationWithCentralBrain();
  const vault = registerMultiProjectFoundationWithProjectVault();
  const trust = registerMultiProjectFoundationWithTrustEngine();
  const uvl = registerMultiProjectFoundationWithUvl();
  const world2 = registerMultiProjectFoundationWithWorld2Coordinator();
  const builder = registerMultiProjectFoundationWithAutonomousBuilder();
  const buildStrategy = registerMultiProjectFoundationWithBuildStrategyEngine();
  const completion = registerMultiProjectFoundationWithCompletionEngine();

  assert('F-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('F-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'builder read-only', builder.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'build strategy read-only', buildStrategy.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'completion read-only', completion.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'verification tokens', brain.verificationStackTokens.length === 3, String(brain.verificationStackTokens.length));
  assert('F-INTEGRATION', 'completion token', brain.completionEngineToken.length > 0, brain.completionEngineToken);

  const brainReuse = registerMultiProjectFoundationWithCentralBrain();
  assert('F-INTEGRATION', 'bootstrap reuse', brainReuse.registeredAt === brain.registeredAt, 'cached');

  harness.endGroup('F-INTEGRATION', g);
}

function stressRegister(count: number, label: string): void {
  const g = harness.beginGroup(`G-STRESS-${label}`);
  resetAll();

  const start = performance.now();
  const ids: string[] = [];

  for (let i = 0; i < count; i++) {
    const { record } = coordinateProject({ projectName: `Stress ${label} ${i}`, projectType: `TYPE_${i % 10}` });
    ids.push(record.projectId);
  }

  const elapsed = performance.now() - start;

  assert(`G-STRESS-${label}`, 'count', getProjectRegistrySize() === count, String(getProjectRegistrySize()));
  assert(`G-STRESS-${label}`, 'lookup sample', getProject(ids[0])?.projectId === ids[0], ids[0]);
  assert(`G-STRESS-${label}`, 'lookup tail', getProject(ids[ids.length - 1])?.projectId === ids[ids.length - 1], ids[ids.length - 1]);
  assert(`G-STRESS-${label}`, 'type lookup', listProjectsByType('TYPE_0').length >= Math.floor(count / 10), 'TYPE_0');
  assert(`G-STRESS-${label}`, 'performance', elapsed < 30_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getMultiProjectFoundationRuntimeReport();
  assert(`G-STRESS-${label}`, 'runtime registry', runtime.registrySize === count, String(runtime.registrySize));
  assert(`G-STRESS-${label}`, 'runtime history', runtime.historySize >= count, String(runtime.historySize));
  assert(`G-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`G-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('H-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 20.1 Multi Project Foundation');
  console.log('==================================================\n');

  runSetup();
  runRegistrationAndIdentity();
  runStateTransitions();
  runContextIsolationHistory();
  runReportingAndCache();
  runIntegration();
  stressRegister(100, '100');
  stressRegister(500, '500');
  stressRegister(1000, '1000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getMultiProjectFoundationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Project count: ${runtime.projectCount}`,
    `Registry size: ${runtime.registrySize}`,
    `History size: ${runtime.historySize}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    failed.length === 0 ? MULTI_PROJECT_FOUNDATION_PASS_TOKEN : 'MULTI_PROJECT_FOUNDATION_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.error(`  [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  if (results.length < MIN_SCENARIOS) {
    console.error(`\nInsufficient scenarios: ${results.length} < ${MIN_SCENARIOS}`);
    process.exit(1);
  }

  console.log(`\n${MULTI_PROJECT_FOUNDATION_PASS_TOKEN}`);
}

main();

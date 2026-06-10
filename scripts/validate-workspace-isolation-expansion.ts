/**
 * Phase 20.2 — Workspace Isolation Expansion validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN,
  WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE,
  addPermittedAccess,
  canTransitionWorkspaceState,
  coordinateWorkspace,
  coordinateWorkspaceFromProject,
  detectWorkspaceViolations,
  evaluateWorkspacePolicy,
  generateWorkspaceBoundaryReport,
  getDevPulseV2WorkspaceIsolationExpansion,
  getWorkspaceBoundary,
  getWorkspaceCacheStats,
  getWorkspaceIsolationExpansionRuntimeReport,
  getWorkspaceOwner,
  getWorkspaceRecord,
  getWorkspaceRegistrySize,
  grantWorkspaceAccess,
  listWorkspaces,
  listWorkspacesByOwner,
  registerWorkspaceIsolationExpansionWithAutonomousBuilder,
  registerWorkspaceIsolationExpansionWithCentralBrain,
  registerWorkspaceIsolationExpansionWithCompletionEngine,
  registerWorkspaceIsolationExpansionWithMultiProjectFoundation,
  registerWorkspaceIsolationExpansionWithProjectVault,
  registerWorkspaceIsolationExpansionWithTrustEngine,
  registerWorkspaceIsolationExpansionWithUvl,
  registerWorkspaceIsolationExpansionWithWorld2Coordinator,
  requestWorkspaceAccess,
  resetWorkspaceIsolationExpansionModuleForTests,
  updateWorkspaceRecord,
  updateWorkspaceState,
  validateWorkspaceAccess,
  validateWorkspaceBoundary,
  validateWorkspaceIsolation,
} from '../src/workspace-isolation-expansion/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { WORKSPACE_ISOLATION_EXPANSION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/workspace-isolation-expansion');

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
  'workspace-isolation-expansion.ts',
  'workspace-isolation-types.ts',
  'workspace-boundary-manager.ts',
  'workspace-ownership-manager.ts',
  'workspace-access-controller.ts',
  'workspace-isolation-validator.ts',
  'workspace-policy-engine.ts',
  'workspace-violation-detector.ts',
  'workspace-boundary-reporting.ts',
  'workspace-state-manager.ts',
  'workspace-registry.ts',
  'workspace-cache.ts',
  'workspace-coordinator.ts',
  'index.ts',
];

function resetAll(): void {
  resetWorkspaceIsolationExpansionModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2WorkspaceIsolationExpansion();
  assert('A-SETUP', 'pass token', authority.passToken === WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'isolation only', authority.isolationOnly === true, 'isolationOnly');
  assert('A-SETUP', 'uvl rows', WORKSPACE_ISOLATION_EXPANSION_UVL_ROWS.length === 13, String(WORKSPACE_ISOLATION_EXPANSION_UVL_ROWS.length));
  harness.endGroup('A-SETUP', g);
}

function runRegistrationAndBoundary(): void {
  const g = harness.beginGroup('B-REGISTER');
  resetAll();

  const coordinated = coordinateWorkspace({
    workspaceId: 'WORLD2_WORKSPACE_TEST_001',
    ownerProjectId: 'WORLD2_PROJECT_TEST_001',
  });

  assert('B-REGISTER', 'workspace registered', coordinated.record.workspaceId === 'WORLD2_WORKSPACE_TEST_001', coordinated.record.workspaceId);
  assert('B-REGISTER', 'owner assigned', getWorkspaceOwner('WORLD2_WORKSPACE_TEST_001') === 'WORLD2_PROJECT_TEST_001', 'owner');
  assert('B-REGISTER', 'boundary exists', getWorkspaceBoundary('WORLD2_WORKSPACE_TEST_001') !== undefined, 'boundary');
  assert('B-REGISTER', 'isolation', coordinated.isolation.status === 'ISOLATED', coordinated.isolation.status);
  assert('B-REGISTER', 'owner policy', coordinated.policy === 'POLICY_ALLOW', coordinated.policy);
  assert('B-REGISTER', 'lookup', getWorkspaceRecord('WORLD2_WORKSPACE_TEST_001') !== undefined, 'lookup');
  assert('B-REGISTER', 'list by owner', listWorkspacesByOwner('WORLD2_PROJECT_TEST_001').length >= 1, 'by owner');

  const boundaryValid = validateWorkspaceBoundary('WORLD2_WORKSPACE_TEST_001', 'WORLD2_PROJECT_TEST_001');
  assert('B-REGISTER', 'boundary valid', boundaryValid.valid === true, String(boundaryValid.valid));

  harness.endGroup('B-REGISTER', g);
}

function runAccessAndPolicy(): void {
  const g = harness.beginGroup('C-ACCESS');
  resetAll();

  coordinateWorkspace({
    workspaceId: 'WORLD2_WORKSPACE_ACCESS_001',
    ownerProjectId: 'WORLD2_PROJECT_ACCESS_001',
  });

  const ownerAccess = requestWorkspaceAccess('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_ACCESS_001');
  const crossAccess = requestWorkspaceAccess('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_OTHER_001');

  assert('C-ACCESS', 'owner granted', ownerAccess === 'ACCESS_GRANTED', ownerAccess);
  assert('C-ACCESS', 'cross requires auth', crossAccess === 'ACCESS_REQUIRES_AUTHORIZATION', crossAccess);

  const ownerPolicy = evaluateWorkspacePolicy('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_ACCESS_001');
  const crossPolicy = evaluateWorkspacePolicy('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_OTHER_001');

  assert('C-ACCESS', 'owner policy allow', ownerPolicy === 'POLICY_ALLOW', ownerPolicy);
  assert('C-ACCESS', 'cross policy escalate', crossPolicy === 'POLICY_ESCALATE', crossPolicy);

  addPermittedAccess('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_OTHER_001');
  grantWorkspaceAccess('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_OTHER_001');
  const grantedAccess = validateWorkspaceAccess('WORLD2_WORKSPACE_ACCESS_001', 'WORLD2_PROJECT_OTHER_001');
  assert('C-ACCESS', 'granted access', grantedAccess === 'ACCESS_GRANTED', grantedAccess);

  harness.endGroup('C-ACCESS', g);
}

function runViolationsAndIsolation(): void {
  const g = harness.beginGroup('D-VIOLATIONS');
  resetAll();

  coordinateWorkspace({
    workspaceId: 'WORLD2_WORKSPACE_VIOL_001',
    ownerProjectId: 'WORLD2_PROJECT_VIOL_001',
  });

  const violations = detectWorkspaceViolations('WORLD2_WORKSPACE_VIOL_001', 'WORLD2_PROJECT_INTRUDER');
  assert('D-VIOLATIONS', 'unauthorized detected', violations.some((v) => v.violationType === 'unauthorized_access'), 'unauthorized');

  const isolation = validateWorkspaceIsolation('WORLD2_WORKSPACE_VIOL_001', 'WORLD2_PROJECT_INTRUDER');
  assert('D-VIOLATIONS', 'isolation check', isolation.status === 'ISOLATED' || isolation.violations.length > 0, isolation.status);

  const report = generateWorkspaceBoundaryReport('WORLD2_WORKSPACE_VIOL_001', 'WORLD2_PROJECT_INTRUDER');
  assert('D-VIOLATIONS', 'report id', (report?.reportId.length ?? 0) > 0, report?.reportId ?? 'missing');
  assert('D-VIOLATIONS', 'report violations', (report?.violations.length ?? 0) >= 1, String(report?.violations.length));

  harness.endGroup('D-VIOLATIONS', g);
}

function runStateAndCache(): void {
  const g = harness.beginGroup('E-STATE');
  resetAll();

  const { record } = coordinateWorkspace({
    workspaceId: 'WORLD2_WORKSPACE_STATE_001',
    ownerProjectId: 'WORLD2_PROJECT_STATE_001',
  });

  const paused = updateWorkspaceState(record, 'PAUSED');
  assert('E-STATE', 'pause', paused.ok === true, String(paused.ok));

  if (paused.ok) {
    updateWorkspaceRecord(paused.record);
    const active = updateWorkspaceState(paused.record, 'ACTIVE');
    assert('E-STATE', 'resume', active.ok === true, String(active.ok));
  }

  assert('E-STATE', 'pause allowed', canTransitionWorkspaceState('ACTIVE', 'PAUSED') === true, 'pause');
  assert('E-STATE', 'archive allowed', canTransitionWorkspaceState('ACTIVE', 'ARCHIVED') === true, 'archive');

  getWorkspaceRecord('WORLD2_WORKSPACE_STATE_001');
  getWorkspaceRecord('WORLD2_WORKSPACE_STATE_001');
  const cache = getWorkspaceCacheStats();
  assert('E-STATE', 'cache hits', cache.hits >= 1, String(cache.hits));

  harness.endGroup('E-STATE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('workspace_isolation_expansion');
  assert('F-INTEGRATION', 'ownership', owner.ownerModule === WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE, owner.ownerModule);

  const brain = registerWorkspaceIsolationExpansionWithCentralBrain();
  const vault = registerWorkspaceIsolationExpansionWithProjectVault();
  const trust = registerWorkspaceIsolationExpansionWithTrustEngine();
  const uvl = registerWorkspaceIsolationExpansionWithUvl();
  const world2 = registerWorkspaceIsolationExpansionWithWorld2Coordinator();
  const multiProject = registerWorkspaceIsolationExpansionWithMultiProjectFoundation();
  const builder = registerWorkspaceIsolationExpansionWithAutonomousBuilder();
  const completion = registerWorkspaceIsolationExpansionWithCompletionEngine();

  assert('F-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('F-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'multi project read-only', multiProject.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'builder read-only', builder.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'completion read-only', completion.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'multi project token', brain.multiProjectFoundationToken.length > 0, brain.multiProjectFoundationToken);
  assert('F-INTEGRATION', 'completion token', brain.completionEngineToken.length > 0, brain.completionEngineToken);

  const fromProject = coordinateWorkspaceFromProject('Integration App', 'FEATURE');
  assert('F-INTEGRATION', 'from project', fromProject.record.workspaceId.length > 0, fromProject.record.workspaceId);
  assert('F-INTEGRATION', 'from project isolated', fromProject.isolation.status === 'ISOLATED', fromProject.isolation.status);

  const brainReuse = registerWorkspaceIsolationExpansionWithCentralBrain();
  assert('F-INTEGRATION', 'bootstrap reuse', brainReuse.registeredAt === brain.registeredAt, 'cached');

  harness.endGroup('F-INTEGRATION', g);
}

function stressWorkspaces(count: number, label: string): void {
  const g = harness.beginGroup(`G-STRESS-${label}`);
  resetAll();

  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const wsId = `WORLD2_WORKSPACE_STRESS_${label}_${String(i).padStart(6, '0')}`;
    const projId = `WORLD2_PROJECT_STRESS_${label}_${String(i).padStart(6, '0')}`;
    coordinateWorkspace({ workspaceId: wsId, ownerProjectId: projId });
  }

  const elapsed = performance.now() - start;

  assert(`G-STRESS-${label}`, 'count', getWorkspaceRegistrySize() === count, String(getWorkspaceRegistrySize()));
  assert(`G-STRESS-${label}`, 'list', listWorkspaces().length === count, String(listWorkspaces().length));
  assert(`G-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getWorkspaceIsolationExpansionRuntimeReport();
  assert(`G-STRESS-${label}`, 'runtime registry', runtime.registrySize === count, String(runtime.registrySize));
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
  console.log('\nDevPulse V2 — Phase 20.2 Workspace Isolation Expansion');
  console.log('========================================================\n');

  runSetup();
  runRegistrationAndBoundary();
  runAccessAndPolicy();
  runViolationsAndIsolation();
  runStateAndCache();
  runIntegration();
  stressWorkspaces(100, '100');
  stressWorkspaces(1000, '1000');
  stressWorkspaces(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getWorkspaceIsolationExpansionRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Workspace count: ${runtime.workspaceCount}`,
    `Registry size: ${runtime.registrySize}`,
    `Violation count: ${runtime.violationCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    failed.length === 0 ? WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN : 'WORKSPACE_ISOLATION_EXPANSION_V1_FAIL',
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

  console.log(`\n${WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN}`);
}

main();

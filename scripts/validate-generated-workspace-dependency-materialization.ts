/**
 * Phase 26.78 — Generated Workspace Dependency Materialization validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessGeneratedWorkspaceDependencyMaterialization,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS,
  getGeneratedWorkspaceDependencyMaterializationHistorySize,
  readWorkspacePackageManifest,
  resolvePackageManager,
  resetGeneratedWorkspaceDependencyMaterializationModuleForTests,
  scanDependencyPresence,
  probeModuleResolution,
  buildDependencyMaterializationRepairPlan,
} from '../src/generated-workspace-dependency-materialization/index.js';
import {
  assessRuntimeStartupProofRepair,
  resetRuntimeStartupProofRepairModuleForTests,
  resolvePrimaryWorkspace,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from '../src/runtime-materialization-truth-bridge/index.js';
import { assessConnectedBuildExecution, resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.ts',
  'src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-registry.ts',
  'src/generated-workspace-dependency-materialization/workspace-package-manifest-reader.ts',
  'src/generated-workspace-dependency-materialization/package-manager-resolver.ts',
  'src/generated-workspace-dependency-materialization/dependency-presence-scanner.ts',
  'src/generated-workspace-dependency-materialization/module-resolution-probe.ts',
  'src/generated-workspace-dependency-materialization/dependency-materialization-repair-planner.ts',
  'src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-report-builder.ts',
  'src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-authority.ts',
  'src/generated-workspace-dependency-materialization/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-authority.ts'),
  'utf8',
);
const resolverSource = readFileSync(
  join(ROOT, 'src/generated-workspace-dependency-materialization/package-manager-resolver.ts'),
  'utf8',
);
const startupAuthoritySource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-proof-repair-authority.ts'),
  'utf8',
);
const classifierSource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-failure-classifier.ts'),
  'utf8',
);
const collectorSource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'),
  'utf8',
);

assert('PASS token', authoritySource.includes(GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS), 'missing');
assert('package manager evidence source', resolverSource.includes('evidenceSource'), 'missing');
assert('startup repair consumes dependency assessment', startupAuthoritySource.includes('assessGeneratedWorkspaceDependencyMaterialization'), 'missing');
assert('classifier uses dependency materialization', classifierSource.includes('dependencyMaterialization'), 'missing');
assert('runtime bridge consumes dependency proof', collectorSource.includes('dependencyMaterialization'), 'missing');
assert('no nested validators in authority', !authoritySource.includes('validate:') && !authoritySource.includes('assessRuntimeMaterializationTruthBridge'), 'nested validator');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates files');
assert('shouldAutoRun default false', readFileSync(join(ROOT, 'src/generated-workspace-dependency-materialization/dependency-materialization-repair-planner.ts'), 'utf8').includes('shouldAutoRun = false'), 'missing');

resetGeneratedWorkspaceDependencyMaterializationModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;

const workspace = resolvePrimaryWorkspace({ rootDir: ROOT, buildMaterializationReport: buildReport });
assert('workspace discovery', Boolean(workspace), workspace?.workspaceRoot ?? 'none');

if (workspace) {
  const manifest = readWorkspacePackageManifest(workspace.workspaceAbs);
  assert('package manifest detection', manifest.packageJsonExists, manifest.parseError ?? 'no package.json');

  const pm = resolvePackageManager({ workspaceAbs: workspace.workspaceAbs, manifest });
  assert('package manager resolved', Boolean(pm.packageManager), pm.packageManager);
  assert('evidence-backed pm', pm.evidenceSource.length > 0, pm.evidenceSource);

  const moduleProbe = probeModuleResolution({ workspaceAbs: workspace.workspaceAbs });
  const presence = scanDependencyPresence({
    workspaceAbs: workspace.workspaceAbs,
    manifest,
    moduleProbe,
    startupLogHints: [],
  });
  assert('dependency state assigned', presence.dependencyState.length > 0, presence.dependencyState);
  assert(
    'node_modules absence detectable',
    presence.nodeModulesExists === existsSync(join(workspace.workspaceAbs, 'node_modules')),
    String(presence.nodeModulesExists),
  );

  const plan = buildDependencyMaterializationRepairPlan({
    workspaceRoot: workspace.workspaceRoot,
    packageManager: pm,
    presence,
  });
  assert('repair plan generated', plan.installCommand.length > 0, plan.installCommand);
  assert('repair plan shouldAutoRun false', plan.shouldAutoRun === false, String(plan.shouldAutoRun));
}

const assessment = assessGeneratedWorkspaceDependencyMaterialization({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
});
const report = assessment.report;

assert('assessment completes', assessment.orchestrationState === 'DEPENDENCY_MATERIALIZATION_COMPLETE', assessment.orchestrationState);
assert('dependency state in report', Boolean(report.dependencyState), report.dependencyState);
assert('history recorded', getGeneratedWorkspaceDependencyMaterializationHistorySize() >= 1, String(getGeneratedWorkspaceDependencyMaterializationHistorySize()));

const startupRepair = assessRuntimeStartupProofRepair({ rootDir: ROOT, buildMaterializationReport: buildReport });
assert('startup receives dependency state', Boolean(startupRepair.report.dependencyMaterialization), 'missing');
assert(
  'startup dependency state propagated',
  startupRepair.report.dependencyMaterialization?.dependencyState === report.dependencyState ||
    Boolean(startupRepair.report.dependencyMaterialization?.dependencyState),
  startupRepair.report.dependencyMaterialization?.dependencyState ?? 'none',
);

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  skipHistoryRecording: true,
});

assert('runtime bridge dependency proof', Boolean(runtimeBridge.report.evidence.dependencyMaterialization), 'missing');
assert(
  'startup evidence has dependency details',
  runtimeBridge.report.evidence.startup.dependencyState !== undefined,
  String(runtimeBridge.report.evidence.startup.dependencyState),
);

if (startupRepair.report.failureClass === 'MISSING_DEPENDENCIES') {
  assert(
    'missing deps has install command detail',
    Boolean(runtimeBridge.report.evidence.startup.dependencyInstallCommand) ||
      Boolean(startupRepair.report.dependencyMaterialization?.repairPlan.installCommand),
    runtimeBridge.report.evidence.startup.dependencyInstallCommand ?? 'none',
  );
  assert(
    'recommended fix not generic only',
    (startupRepair.report.recommendedFix.includes('install') ||
      startupRepair.report.recommendedFix.includes('Run')) &&
      startupRepair.report.recommendedNextActions.some((a) => a.includes('installCommand=')),
    startupRepair.report.recommendedFix,
  );
}

if (report.dependenciesReady && !startupRepair.report.applicationBoots) {
  assert(
    'ready deps not classified as MISSING_DEPENDENCIES',
    startupRepair.report.failureClass !== 'MISSING_DEPENDENCIES',
    startupRepair.report.failureClass,
  );
}

const failed = results.filter((e) => !e.passed);
const summary = [
  '# Generated Workspace Dependency Materialization Validation',
  '',
  `Result: ${failed.length === 0 ? GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS : 'FAILED'}`,
  '',
  ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
  '',
  '## Snapshot',
  '',
  `- dependencyState=${report.dependencyState}`,
  `- dependenciesReady=${report.dependenciesReady}`,
  `- packageManager=${report.packageManager.packageManager} (${report.packageManager.evidenceSource})`,
  `- nodeModulesExists=${report.presence.nodeModulesExists}`,
  `- installCommand=${report.repairPlan.installCommand}`,
  `- startupFailureClass=${startupRepair.report.failureClass}`,
  `- runtimeBridge.recommendedFix=${runtimeBridge.report.reconciliation.recommendedFix.slice(0, 120)}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_VALIDATION.md'), summary, 'utf8');
writeFileSync(
  join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_REPORT.md'),
  [
    '# Generated Workspace Dependency Materialization Report',
    '',
    `- dependencyState: **${report.dependencyState}**`,
    `- dependenciesReady: **${report.dependenciesReady}**`,
    `- packageJsonExists: **${report.manifest.packageJsonExists}**`,
    `- nodeModulesExists: **${report.presence.nodeModulesExists}**`,
    `- lockfileType: **${report.presence.lockfileType}**`,
    `- packageManager: **${report.packageManager.packageManager}** (${report.packageManager.evidenceSource})`,
    `- missingRuntime: ${report.presence.missingRuntimeDependencies.join(', ') || 'none'}`,
    `- unresolvedModules: ${report.moduleProbe.unresolvedModules.join(', ') || 'none'}`,
    '',
    GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS,
  ].join('\n'),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_REPAIR_PLAN.md'),
  [
    '# Generated Workspace Dependency Repair Plan',
    '',
    `- installCommand: **${report.repairPlan.installCommand}**`,
    `- installCwd: **${report.repairPlan.installCwd}**`,
    `- shouldAutoRun: **${report.repairPlan.shouldAutoRun}**`,
    `- riskLevel: **${report.repairPlan.riskLevel}**`,
    `- missingModules: **${report.repairPlan.missingModulesSummary}**`,
    '',
    report.repairPlan.reason,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(summary);
  process.exit(1);
}

console.log(GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS);
console.log(summary);

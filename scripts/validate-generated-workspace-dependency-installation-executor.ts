/**
 * Phase 26.79 — Generated Workspace Dependency Installation Executor validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  executeGeneratedWorkspaceDependencyInstallation,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS,
  validateWorkspaceInstallSafety,
  buildParsedInstallCommand,
  getGeneratedWorkspaceDependencyInstallationExecutorHistorySize,
  resetGeneratedWorkspaceDependencyInstallationExecutorModuleForTests,
} from '../src/generated-workspace-dependency-installation-executor/index.js';
import {
  assessGeneratedWorkspaceDependencyMaterialization,
  resetGeneratedWorkspaceDependencyMaterializationModuleForTests,
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
  'src/generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.ts',
  'src/generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-registry.ts',
  'src/generated-workspace-dependency-installation-executor/workspace-install-safety-guard.ts',
  'src/generated-workspace-dependency-installation-executor/dependency-install-command-builder.ts',
  'src/generated-workspace-dependency-installation-executor/dependency-install-process-runner.ts',
  'src/generated-workspace-dependency-installation-executor/post-install-dependency-verifier.ts',
  'src/generated-workspace-dependency-installation-executor/dependency-installation-report-builder.ts',
  'src/generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-authority.ts',
  'src/generated-workspace-dependency-installation-executor/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-authority.ts'),
  'utf8',
);
const runnerSource = readFileSync(
  join(ROOT, 'src/generated-workspace-dependency-installation-executor/dependency-install-process-runner.ts'),
  'utf8',
);
const guardSource = readFileSync(
  join(ROOT, 'src/generated-workspace-dependency-installation-executor/workspace-install-safety-guard.ts'),
  'utf8',
);
const startupAuthoritySource = readFileSync(
  join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-proof-repair-authority.ts'),
  'utf8',
);
const collectorSource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'),
  'utf8',
);

assert('PASS token', authoritySource.includes(GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS), 'missing');
assert('shell:false spawn', runnerSource.includes('shell: false'), 'missing');
assert('timeout enforced', runnerSource.includes('timeout:'), 'missing');
assert('unsafe path rejection', guardSource.includes('REFUSED'), 'missing');
assert('startup repair wired', startupAuthoritySource.includes('executeGeneratedWorkspaceDependencyInstallation'), 'missing');
assert('runtime bridge wired', collectorSource.includes('dependencyInstallationExecutor'), 'missing');
assert('no nested validators', !authoritySource.includes('validate:') && !authoritySource.includes('assessRuntimeMaterializationTruthBridge'), 'nested');
assert('DRY_RUN default', authoritySource.includes("input.executionMode ?? 'DRY_RUN'"), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');

resetGeneratedWorkspaceDependencyInstallationExecutorModuleForTests();
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

const mainRepoSafety = validateWorkspaceInstallSafety({
  rootDir: ROOT,
  workspaceAbs: ROOT,
  installCwd: '.',
  installCommand: 'npm install',
  expectedPackageManager: 'npm',
});
assert('main repo install rejected', mainRepoSafety.verdict === 'REFUSED', mainRepoSafety.refusalReason ?? 'accepted');

const unsafePathSafety = validateWorkspaceInstallSafety({
  rootDir: ROOT,
  workspaceAbs: resolve(ROOT, 'src'),
  installCwd: 'src',
  installCommand: 'npm install',
  expectedPackageManager: 'npm',
});
assert('unsafe path rejected', unsafePathSafety.verdict === 'REFUSED', unsafePathSafety.refusalReason ?? 'accepted');

const injectionSafety = validateWorkspaceInstallSafety({
  rootDir: ROOT,
  workspaceAbs: workspace?.workspaceAbs ?? ROOT,
  installCwd: workspace?.workspaceRoot ?? 'none',
  installCommand: 'npm install; rm -rf /',
  expectedPackageManager: 'npm',
});
assert('shell injection rejected', injectionSafety.verdict === 'REFUSED', injectionSafety.refusalReason ?? 'accepted');

if (workspace) {
  const depMaterialization = assessGeneratedWorkspaceDependencyMaterialization({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
    workspacePath: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    skipHistoryRecording: true,
  }).report;

  const workspaceSafety = validateWorkspaceInstallSafety({
    rootDir: ROOT,
    workspaceAbs: workspace.workspaceAbs,
    installCwd: depMaterialization.repairPlan.installCwd,
    installCommand: depMaterialization.repairPlan.installCommand,
    expectedPackageManager: depMaterialization.repairPlan.packageManager,
  });
  assert(
    'generated workspace cwd accepted or manifest missing',
    workspaceSafety.verdict === 'SAFE' ||
      workspaceSafety.refusalReason?.includes('package.json') === true,
    workspaceSafety.refusalReason ?? 'SAFE',
  );

  const parsed = buildParsedInstallCommand(depMaterialization.repairPlan.installCommand);
  assert('install command parsed without shell', Boolean(parsed?.executable), parsed?.executable ?? 'none');
  assert('no shell metacharacters in parsed args', !parsed?.args.some((a) => a.includes(';')), 'injection');
}

const dryRunAssessment = executeGeneratedWorkspaceDependencyInstallation({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  executionMode: 'DRY_RUN',
});
const dryRunReport = dryRunAssessment.report;

assert('DRY_RUN completes', dryRunAssessment.orchestrationState === 'DEPENDENCY_INSTALLATION_EXECUTOR_COMPLETE', dryRunAssessment.orchestrationState);
assert('DRY_RUN does not execute', dryRunReport.processResult.executed === false, String(dryRunReport.processResult.executed));
assert('DRY_RUN cleanup NOT_STARTED', dryRunReport.processResult.cleanupStatus === 'NOT_STARTED', dryRunReport.processResult.cleanupStatus);
assert('post-install verifier wired', Boolean(dryRunReport.postInstallVerification.verificationReason), 'missing');
assert('history recorded', getGeneratedWorkspaceDependencyInstallationExecutorHistorySize() >= 1, String(getGeneratedWorkspaceDependencyInstallationExecutorHistorySize()));

const executeDefault = executeGeneratedWorkspaceDependencyInstallation({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
});
assert('default mode is DRY_RUN', executeDefault.report.executionMode === 'DRY_RUN', executeDefault.report.executionMode);

const startupRepair = assessRuntimeStartupProofRepair({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  dependencyInstallExecutionMode: 'SKIP',
});
assert('startup receives install executor field', startupRepair.report.dependencyInstallationExecutor === null, 'expected null on SKIP');

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  skipHistoryRecording: true,
});
assert('runtime bridge install fields', runtimeBridge.report.evidence.startup.dependencyInstallExecuted === false, 'missing');

const failed = results.filter((e) => !e.passed);
const summary = [
  '# Generated Workspace Dependency Installation Executor Validation',
  '',
  `Result: ${failed.length === 0 ? GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS : 'FAILED'}`,
  '',
  ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
  '',
  '## Snapshot',
  '',
  `- executionMode=${dryRunReport.executionMode}`,
  `- safetyVerdict=${dryRunReport.safetyCheck.verdict}`,
  `- executed=${dryRunReport.processResult.executed}`,
  `- beforeState=${dryRunReport.postInstallVerification.beforeState}`,
  `- afterState=${dryRunReport.postInstallVerification.afterState}`,
  `- installCommand=${dryRunReport.processResult.attemptedCommand}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_VALIDATION.md'), summary, 'utf8');
writeFileSync(
  join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_REPORT.md'),
  [
    '# Generated Workspace Dependency Installation Executor Report',
    '',
    `- executionMode: **${dryRunReport.executionMode}**`,
    `- safetyVerdict: **${dryRunReport.safetyCheck.verdict}**`,
    `- executed: **${dryRunReport.processResult.executed}**`,
    `- cleanupStatus: **${dryRunReport.processResult.cleanupStatus}**`,
    '',
    GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS,
  ].join('\n'),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_RESULT.md'),
  [
    '# Generated Workspace Dependency Installation Result',
    '',
    `- beforeState: **${dryRunReport.postInstallVerification.beforeState}**`,
    `- afterState: **${dryRunReport.postInstallVerification.afterState}**`,
    `- dependenciesReady: **${dryRunReport.postInstallVerification.dependenciesReady}**`,
    `- verificationReason: ${dryRunReport.postInstallVerification.verificationReason}`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(summary);
  process.exit(1);
}

console.log(GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS);
console.log(summary);

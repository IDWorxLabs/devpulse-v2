/**
 * Phase 26.80 — Execute dependency install + runtime boot proof for generated workspace.
 * Explicit EXECUTE only inside .generated-builder-workspaces/build-ready-idea-1.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessConnectedBuildExecution } from '../src/connected-build-execution/index.js';
import {
  executeGeneratedWorkspaceDependencyInstallation,
  type GeneratedWorkspaceDependencyInstallationExecutorReport,
} from '../src/generated-workspace-dependency-installation-executor/index.js';
import {
  assessRuntimeStartupProofRepair,
  type RuntimeStartupProofRepairReport,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  type RuntimeMaterializationTruthBridgeReport,
} from '../src/runtime-materialization-truth-bridge/index.js';

export const GENERATED_WORKSPACE_RUNTIME_BOOT_PROOF_EXECUTED =
  'GENERATED_WORKSPACE_RUNTIME_BOOT_PROOF_EXECUTED';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const WORKSPACE_PATH = '.generated-builder-workspaces/build-ready-idea-1';
const WORKSPACE_ID = 'build-ready-idea-1';

function printSummary(input: {
  installReport: GeneratedWorkspaceDependencyInstallationExecutorReport;
  startupReport: RuntimeStartupProofRepairReport | null;
  runtimeBridge: RuntimeMaterializationTruthBridgeReport | null;
}): void {
  const { installReport, startupReport, runtimeBridge } = input;
  const post = installReport.postInstallVerification;

  console.log('--- Generated Workspace Runtime Boot Proof ---');
  console.log(`installExecuted=${installReport.processResult.executed}`);
  console.log(`installSucceeded=${installReport.processResult.installSucceeded}`);
  console.log(`beforeState=${post.beforeState}`);
  console.log(`afterState=${post.afterState}`);
  console.log(`dependenciesReady=${post.dependenciesReady}`);
  console.log(
    `applicationBoots=${startupReport?.applicationBoots ?? installReport.applicationBootsAfterInstall ?? false}`,
  );
  console.log(`startupFailureClass=${startupReport?.failureClass ?? 'n/a'}`);
  console.log(`runtimeBridge.failureBoundary=${runtimeBridge?.reconciliation.failureBoundary ?? 'n/a'}`);
  console.log(`runtimeBridge.rootCause=${runtimeBridge?.reconciliation.rootCause ?? 'n/a'}`);
  console.log(`cleanupStatus=${installReport.processResult.cleanupStatus}`);
}

function writeReports(input: {
  installReport: GeneratedWorkspaceDependencyInstallationExecutorReport;
  startupReport: RuntimeStartupProofRepairReport | null;
  runtimeBridge: RuntimeMaterializationTruthBridgeReport | null;
  refused: string | null;
}): void {
  const { installReport, startupReport, runtimeBridge, refused } = input;
  const post = installReport.postInstallVerification;
  const nodeModulesPath = join(ROOT, WORKSPACE_PATH, 'node_modules');
  const nodeModulesAfterInstall = existsSync(nodeModulesPath);

  const validationSummary = [
    '# Runtime Boot Proof Execution Validation',
    '',
    `Result: ${GENERATED_WORKSPACE_RUNTIME_BOOT_PROOF_EXECUTED}`,
    '',
    '## Execution chain',
    '',
    'FILES_EXIST → DEPENDENCIES_INSTALLED → APPLICATION_BOOT_ATTEMPTED → BOOT_RESULT_CLASSIFIED',
    '',
    '## Snapshot',
    '',
    `- workspace: **${WORKSPACE_PATH}**`,
    `- safetyVerdict: **${installReport.safetyCheck.verdict}**`,
    `- refused: ${refused ?? 'none'}`,
    `- installExecuted: **${installReport.processResult.executed}**`,
    `- installSucceeded: **${installReport.processResult.installSucceeded}**`,
    `- beforeState: **${post.beforeState}**`,
    `- afterState: **${post.afterState}**`,
    `- nodeModulesAfterInstall: **${nodeModulesAfterInstall}**`,
    `- dependenciesReady: **${post.dependenciesReady}**`,
    `- applicationBoots: **${startupReport?.applicationBoots ?? installReport.applicationBootsAfterInstall ?? false}**`,
    `- startupFailureClass: **${startupReport?.failureClass ?? 'n/a'}**`,
    `- runtimeProofLevel: **${runtimeBridge?.evidence.snapshot.runtimeProofLevel ?? 'n/a'}**`,
    `- failureBoundary: **${runtimeBridge?.reconciliation.failureBoundary ?? 'n/a'}**`,
    `- rootCause: **${runtimeBridge?.reconciliation.rootCause ?? 'n/a'}**`,
    `- cleanupStatus: **${installReport.processResult.cleanupStatus}**`,
    '',
    GENERATED_WORKSPACE_RUNTIME_BOOT_PROOF_EXECUTED,
  ].join('\n');

  writeFileSync(
    join(ROOT, 'architecture', 'GENERATED_WORKSPACE_DEPENDENCY_INSTALL_EXECUTION_REPORT.md'),
    [
      '# Generated Workspace Dependency Install Execution Report',
      '',
      `Generated: ${installReport.generatedAt}`,
      '',
      `- executionMode: **EXECUTE**`,
      `- workspace: **${WORKSPACE_PATH}**`,
      `- safetyVerdict: **${installReport.safetyCheck.verdict}**`,
      `- installCommand: **${installReport.processResult.attemptedCommand}**`,
      `- executed: **${installReport.processResult.executed}**`,
      `- installSucceeded: **${installReport.processResult.installSucceeded}**`,
      `- exitCode: ${installReport.processResult.exitCode ?? 'n/a'}`,
      `- nodeModulesAfterInstall: **${nodeModulesAfterInstall}**`,
      `- beforeState: **${post.beforeState}**`,
      `- afterState: **${post.afterState}**`,
      `- verificationSucceeded: **${post.verificationSucceeded}**`,
      `- cleanupStatus: **${installReport.processResult.cleanupStatus}**`,
      '',
      installReport.processResult.failureReason
        ? `### Failure\n\n${installReport.processResult.failureReason}`
        : '',
      '',
      installReport.processResult.installLogs.length > 0
        ? `### Logs (tail)\n\n${installReport.processResult.installLogs.slice(-8).map((l) => `- ${l}`).join('\n')}`
        : '',
    ].join('\n'),
    'utf8',
  );

  writeFileSync(
    join(ROOT, 'architecture', 'RUNTIME_BOOT_AFTER_DEPENDENCY_INSTALL_REPORT.md'),
    [
      '# Runtime Boot After Dependency Install Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `- dependenciesReady: **${post.dependenciesReady}**`,
      `- applicationBoots: **${startupReport?.applicationBoots ?? installReport.applicationBootsAfterInstall ?? false}**`,
      `- startupFailureClass: **${startupReport?.failureClass ?? 'n/a'}**`,
      `- failureReason: ${startupReport?.failureReason ?? 'n/a'}`,
      `- resolvedCommand: **${startupReport?.resolvedCommand.command ?? 'n/a'}**`,
      `- probeCleanup: **${startupReport?.probe.cleanupStatus ?? installReport.startupProbeAfterInstall?.cleanupStatus ?? 'n/a'}**`,
      '',
      '## Failure boundary',
      '',
      `- failureBoundary: **${runtimeBridge?.reconciliation.failureBoundary ?? 'STARTUP'}**`,
      `- rootCause: **${runtimeBridge?.reconciliation.rootCause ?? 'n/a'}**`,
      `- recommendedFix: ${runtimeBridge?.reconciliation.recommendedFix ?? startupReport?.recommendedFix ?? 'n/a'}`,
      '',
      post.dependenciesReady && startupReport?.failureClass === 'MISSING_DEPENDENCIES'
        ? '**Warning:** Dependencies ready but still classified MISSING_DEPENDENCIES — classification bug.'
        : '',
    ].join('\n'),
    'utf8',
  );

  writeFileSync(
    join(ROOT, 'architecture', 'RUNTIME_BOOT_PROOF_EXECUTION_VALIDATION.md'),
    validationSummary,
    'utf8',
  );
}

function main(): void {
  const buildReport = assessConnectedBuildExecution({
    rootDir: ROOT,
    attemptBuildProofGapMaterialization: false,
  }).report;

  const installAssessment = executeGeneratedWorkspaceDependencyInstallation({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
    workspacePath: WORKSPACE_PATH,
    workspaceId: WORKSPACE_ID,
    executionMode: 'EXECUTE',
    skipHistoryRecording: true,
  });

  const installReport = installAssessment.report;

  if (installReport.safetyCheck.verdict !== 'SAFE') {
    writeReports({
      installReport,
      startupReport: null,
      runtimeBridge: null,
      refused: installReport.safetyCheck.refusalReason ?? 'Safety guard refused install.',
    });
    printSummary({ installReport, startupReport: null, runtimeBridge: null });
    console.log(GENERATED_WORKSPACE_RUNTIME_BOOT_PROOF_EXECUTED);
    process.exit(1);
  }

  const startupRepair = assessRuntimeStartupProofRepair({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
    workspacePath: WORKSPACE_PATH,
    workspaceId: WORKSPACE_ID,
    dependencyInstallExecutionMode: 'EXECUTE',
    skipHistoryRecording: true,
  });

  const runtimeBridge = assessRuntimeMaterializationTruthBridge({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
    startupProofRepair: startupRepair,
    dependencyInstallationExecutor: installAssessment,
    workspacePath: WORKSPACE_PATH,
    workspaceId: WORKSPACE_ID,
    dependencyInstallExecutionMode: 'EXECUTE',
    skipHistoryRecording: true,
  });

  writeReports({
    installReport,
    startupReport: startupRepair.report,
    runtimeBridge: runtimeBridge.report,
    refused: null,
  });

  printSummary({
    installReport,
    startupReport: startupRepair.report,
    runtimeBridge: runtimeBridge.report,
  });

  console.log(GENERATED_WORKSPACE_RUNTIME_BOOT_PROOF_EXECUTED);
}

main();

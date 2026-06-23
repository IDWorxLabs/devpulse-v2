/**
 * Generated Workspace Dependency Installation Executor — authority (Phase 26.79).
 * Bounded install only inside generated workspaces. No nested validators.
 */

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessGeneratedWorkspaceDependencyMaterialization } from '../generated-workspace-dependency-materialization/index.js';
import {
  discoverRuntimeEntrypoint,
  resolvePrimaryWorkspace,
} from '../runtime-startup-proof-repair/runtime-entrypoint-discovery.js';
import { resolveStartupCommand } from '../runtime-startup-proof-repair/runtime-start-command-resolver.js';
import { probeRuntimeStartup } from '../runtime-startup-proof-repair/runtime-process-probe.js';
import { buildParsedInstallCommand } from './dependency-install-command-builder.js';
import { runDependencyInstallProcess } from './dependency-install-process-runner.js';
import { verifyPostInstallDependencies } from './post-install-dependency-verifier.js';
import {
  buildDependencyInstallationExecutorReportMarkdown,
  buildDependencyInstallationResultMarkdown,
} from './dependency-installation-report-builder.js';
import {
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CACHE_KEY_PREFIX,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION,
  GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS,
} from './generated-workspace-dependency-installation-executor-registry.js';
import {
  recordGeneratedWorkspaceDependencyInstallationExecutorAssessment,
  resetGeneratedWorkspaceDependencyInstallationExecutorHistoryForTests,
} from './generated-workspace-dependency-installation-executor-history.js';
import { validateWorkspaceInstallSafety } from './workspace-install-safety-guard.js';
import type {
  DependencyInstallProcessResult,
  ExecuteGeneratedWorkspaceDependencyInstallationInput,
  GeneratedWorkspaceDependencyInstallationExecutorAssessment,
  GeneratedWorkspaceDependencyInstallationExecutorReport,
} from './generated-workspace-dependency-installation-executor-types.js';
import type { RuntimeStartupProbeResult } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

let executionCounter = 0;

export function resetGeneratedWorkspaceDependencyInstallationExecutorCounterForTests(): void {
  executionCounter = 0;
}

export function resetGeneratedWorkspaceDependencyInstallationExecutorModuleForTests(): void {
  resetGeneratedWorkspaceDependencyInstallationExecutorCounterForTests();
  resetGeneratedWorkspaceDependencyInstallationExecutorHistoryForTests();
}

function nextExecutionId(): string {
  executionCounter += 1;
  return `generated-workspace-dependency-installation-executor-${executionCounter}-${Date.now()}`;
}

function stableCacheKey(executionId: string, mode: string, succeeded: boolean): string {
  const digest = createHash('sha256')
    .update([
      GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_PASS,
      executionId,
      mode,
      String(succeeded),
    ].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CACHE_KEY_PREFIX}:${digest}`;
}

function emptyProcessResult(cwd: string, reason: string): DependencyInstallProcessResult {
  return {
    readOnly: true,
    executed: false,
    dryRun: true,
    attemptedCommand: 'none',
    executable: 'none',
    args: [],
    cwd,
    exitCode: null,
    stdout: [],
    stderr: [],
    installLogs: [reason],
    elapsedMs: 0,
    timedOut: false,
    cleanupStatus: 'NOT_STARTED',
    processId: null,
    installSucceeded: false,
    failureReason: reason,
  };
}

export function executeGeneratedWorkspaceDependencyInstallation(
  input: ExecuteGeneratedWorkspaceDependencyInstallationInput = {},
): GeneratedWorkspaceDependencyInstallationExecutorAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const executionId = nextExecutionId();
  const executionMode = input.executionMode ?? 'DRY_RUN';

  const buildMaterializationReport =
    input.buildMaterializationReport ??
    assessConnectedBuildExecution({
      rootDir,
      attemptBuildProofGapMaterialization: false,
    }).report;

  const workspace = resolvePrimaryWorkspace({
    rootDir,
    buildMaterializationReport,
    workspacePath: input.workspacePath,
    workspaceId: input.workspaceId,
  });

  if (!workspace) {
    const report: GeneratedWorkspaceDependencyInstallationExecutorReport = {
      readOnly: true,
      advisoryOnly: true,
      executionId,
      generatedAt: new Date().toISOString(),
      coreQuestion: GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION,
      executionMode,
      workspaceRoot: 'none',
      workspaceId: 'none',
      safetyCheck: {
        readOnly: true,
        verdict: 'REFUSED',
        refusalReason: 'No generated workspace resolved.',
        workspaceAbs: 'none',
        installCwd: 'none',
        installCommand: 'none',
        packageJsonExists: false,
        insideGeneratedWorkspace: false,
        mainRepoProtected: true,
      },
      parsedCommand: null,
      processResult: emptyProcessResult('none', 'No workspace'),
      postInstallVerification: {
        readOnly: true,
        beforeState: 'UNKNOWN_DEPENDENCY_STATE',
        afterState: 'UNKNOWN_DEPENDENCY_STATE',
        dependenciesReady: false,
        nodeModulesExists: false,
        missingModulesAfterInstall: [],
        installSucceeded: false,
        verificationSucceeded: false,
        verificationReason: 'No workspace.',
        afterMaterialization: null,
      },
      startupProbeAfterInstall: null,
      applicationBootsAfterInstall: null,
      connectedBuildProofLevel: buildMaterializationReport.proofLevel,
      recommendedNextAction: 'Resolve generated workspace before dependency install.',
      cacheKey: stableCacheKey(executionId, executionMode, false),
    };
    const assessment: GeneratedWorkspaceDependencyInstallationExecutorAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'DEPENDENCY_INSTALLATION_EXECUTOR_COMPLETE',
      report,
      cacheKey: report.cacheKey,
    };
    if (!input.skipHistoryRecording) {
      recordGeneratedWorkspaceDependencyInstallationExecutorAssessment(assessment);
    }
    return assessment;
  }

  const beforeMaterialization =
    input.dependencyMaterializationReport ??
    assessGeneratedWorkspaceDependencyMaterialization({
      rootDir,
      buildMaterializationReport,
      workspacePath: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      skipHistoryRecording: true,
    }).report;

  const repairPlan = beforeMaterialization.repairPlan;
  const safetyCheck = validateWorkspaceInstallSafety({
    rootDir,
    workspaceAbs: workspace.workspaceAbs,
    installCwd: repairPlan.installCwd,
    installCommand: repairPlan.installCommand,
    expectedPackageManager: repairPlan.packageManager,
  });

  const parsedCommand =
    safetyCheck.verdict === 'SAFE' ? buildParsedInstallCommand(repairPlan.installCommand) : null;

  let processResult: DependencyInstallProcessResult;
  if (safetyCheck.verdict !== 'SAFE') {
    processResult = emptyProcessResult(workspace.workspaceAbs, safetyCheck.refusalReason ?? 'Unsafe');
  } else if (!parsedCommand) {
    processResult = emptyProcessResult(
      workspace.workspaceAbs,
      'Failed to parse install command for direct spawn.',
    );
  } else if (beforeMaterialization.dependenciesReady) {
    processResult = {
      readOnly: true,
      executed: false,
      dryRun: executionMode === 'DRY_RUN',
      attemptedCommand: parsedCommand.normalizedCommand,
      executable: parsedCommand.executable,
      args: parsedCommand.args,
      cwd: workspace.workspaceAbs,
      exitCode: null,
      stdout: [],
      stderr: [],
      installLogs: ['Dependencies already ready — install skipped.'],
      elapsedMs: 0,
      timedOut: false,
      cleanupStatus: 'NOT_STARTED',
      processId: null,
      installSucceeded: true,
      failureReason: null,
    };
  } else if (executionMode === 'DRY_RUN') {
    processResult = runDependencyInstallProcess({
      parsed: parsedCommand,
      cwdAbs: workspace.workspaceAbs,
      dryRun: true,
    });
  } else {
    processResult = runDependencyInstallProcess({
      parsed: parsedCommand,
      cwdAbs: resolve(rootDir, repairPlan.installCwd),
      dryRun: false,
    });
  }

  const postInstallVerification = verifyPostInstallDependencies({
    rootDir,
    workspacePath: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    workspaceAbs: workspace.workspaceAbs,
    beforeMaterialization,
    processResult,
    buildMaterializationReport,
  });

  let startupProbeAfterInstall: RuntimeStartupProbeResult | null = null;
  let applicationBootsAfterInstall: boolean | null = null;

  if (
    !input.skipPostInstallStartupProbe &&
    postInstallVerification.dependenciesReady &&
    (processResult.installSucceeded || beforeMaterialization.dependenciesReady)
  ) {
    const entrypoint = discoverRuntimeEntrypoint({
      rootDir,
      workspaceRoot: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      workspaceAbs: workspace.workspaceAbs,
      buildMaterializationReport,
    });
    const resolvedCommand = resolveStartupCommand({
      rootDir,
      entrypoint,
      buildMaterializationReport,
    });
    startupProbeAfterInstall = probeRuntimeStartup({
      rootDir,
      resolved: resolvedCommand,
      workspaceId: workspace.workspaceId,
    });
    applicationBootsAfterInstall = startupProbeAfterInstall.applicationBoots;
  }

  let recommendedNextAction = 'No action required.';
  if (executionMode === 'DRY_RUN' && !beforeMaterialization.dependenciesReady) {
    recommendedNextAction = `Enable EXECUTE mode to run: ${repairPlan.installCommand} in ${repairPlan.installCwd}`;
  } else if (safetyCheck.verdict === 'REFUSED') {
    recommendedNextAction = `Install refused: ${safetyCheck.refusalReason}`;
  } else if (!processResult.installSucceeded && executionMode === 'EXECUTE') {
    recommendedNextAction = `Install failed: ${processResult.failureReason ?? 'unknown'}`;
  } else if (postInstallVerification.verificationSucceeded && applicationBootsAfterInstall === true) {
    recommendedNextAction = 'Dependencies ready and application boots — advance runtime proof.';
  } else if (postInstallVerification.verificationSucceeded && applicationBootsAfterInstall === false) {
    recommendedNextAction = 'Dependencies ready but startup still fails — classify new failure boundary.';
  } else if (postInstallVerification.verificationSucceeded) {
    recommendedNextAction = 'Dependencies ready — run bounded startup probe.';
  }

  const cacheKey = stableCacheKey(
    executionId,
    executionMode,
    postInstallVerification.verificationSucceeded,
  );

  const report: GeneratedWorkspaceDependencyInstallationExecutorReport = {
    readOnly: true,
    advisoryOnly: true,
    executionId,
    generatedAt: new Date().toISOString(),
    coreQuestion: GENERATED_WORKSPACE_DEPENDENCY_INSTALLATION_EXECUTOR_CORE_QUESTION,
    executionMode,
    workspaceRoot: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    safetyCheck,
    parsedCommand,
    processResult,
    postInstallVerification,
    startupProbeAfterInstall,
    applicationBootsAfterInstall,
    connectedBuildProofLevel: buildMaterializationReport.proofLevel,
    recommendedNextAction,
    cacheKey,
  };

  const assessment: GeneratedWorkspaceDependencyInstallationExecutorAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'DEPENDENCY_INSTALLATION_EXECUTOR_COMPLETE',
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordGeneratedWorkspaceDependencyInstallationExecutorAssessment(assessment);
  }

  return assessment;
}

export {
  buildDependencyInstallationExecutorReportMarkdown,
  buildDependencyInstallationResultMarkdown,
};

/**
 * Runtime Startup Proof Repair — authority orchestrator (Phase 26.77).
 * Bounded startup probe only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessGeneratedWorkspaceDependencyMaterialization } from '../generated-workspace-dependency-materialization/index.js';
import type { GeneratedWorkspaceDependencyMaterializationReport } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import { executeGeneratedWorkspaceDependencyInstallation } from '../generated-workspace-dependency-installation-executor/index.js';
import type { GeneratedWorkspaceDependencyInstallationExecutorReport } from '../generated-workspace-dependency-installation-executor/generated-workspace-dependency-installation-executor-types.js';
import { assessGeneratedRuntimeCrashDiagnosis } from '../generated-runtime-crash-diagnosis/index.js';
import type { GeneratedRuntimeCrashDiagnosisReport } from '../generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.js';
import {
  discoverRuntimeEntrypoint,
  resolvePrimaryWorkspace,
} from './runtime-entrypoint-discovery.js';
import { resolveStartupCommand } from './runtime-start-command-resolver.js';
import { probeRuntimeStartup } from './runtime-process-probe.js';
import { classifyStartupFailure } from './runtime-startup-failure-classifier.js';
import {
  RUNTIME_STARTUP_PROOF_REPAIR_CACHE_KEY_PREFIX,
  RUNTIME_STARTUP_PROOF_REPAIR_CORE_QUESTION,
  RUNTIME_STARTUP_PROOF_REPAIR_PASS,
} from './runtime-startup-proof-repair-registry.js';
import { recordRuntimeStartupProofRepairAssessment, resetRuntimeStartupProofRepairHistoryForTests } from './runtime-startup-proof-repair-history.js';
import {
  buildRuntimeStartupFailureClassificationReportMarkdown,
  buildRuntimeStartupProofRepairReportMarkdown,
} from './runtime-startup-proof-report-builder.js';
import type {
  AssessRuntimeStartupProofRepairInput,
  RuntimeStartupProofRepairAssessment,
  RuntimeStartupProofRepairReport,
} from './runtime-startup-proof-repair-types.js';

let repairCounter = 0;

export function resetRuntimeStartupProofRepairCounterForTests(): void {
  repairCounter = 0;
}

export function resetRuntimeStartupProofRepairModuleForTests(): void {
  resetRuntimeStartupProofRepairCounterForTests();
  resetRuntimeStartupProofRepairHistoryForTests();
}

function nextRepairId(): string {
  repairCounter += 1;
  return `runtime-startup-proof-repair-${repairCounter}-${Date.now()}`;
}

function stableCacheKey(repairId: string, boots: boolean, failureClass: string): string {
  const digest = createHash('sha256')
    .update([RUNTIME_STARTUP_PROOF_REPAIR_PASS, repairId, String(boots), failureClass].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${RUNTIME_STARTUP_PROOF_REPAIR_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessRuntimeStartupProofRepair(
  input: AssessRuntimeStartupProofRepairInput = {},
): RuntimeStartupProofRepairAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const repairId = nextRepairId();

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

  const emptyEntrypoint = {
    readOnly: true as const,
    appType: 'UNKNOWN' as const,
    workspaceRoot: 'none',
    workspaceId: 'none',
    startCommand: null,
    expectedPort: 4173,
    entryFile: null,
    confidence: 0,
    missingPrerequisites: ['no workspace resolved'],
    discoverySources: [],
  };

  if (!workspace) {
    const classification = classifyStartupFailure({
      entrypoint: emptyEntrypoint,
      resolved: {
        readOnly: true,
        command: null,
        cwd: 'none',
        expectedPort: 4173,
        entryFile: null,
        appType: 'UNKNOWN',
        evidenceSource: 'NO_COMMAND_FOUND',
        evidenceDetail: 'No generated workspace found',
        confidence: 0,
        resolved: false,
      },
      probe: {
        readOnly: true,
        attemptedCommand: null,
        cwd: 'none',
        expectedPort: 4173,
        processStarted: false,
        portBound: false,
        firstResponseStatus: null,
        startupLogs: [],
        fatalErrors: ['no workspace'],
        elapsedMs: 0,
        timedOut: false,
        cleanupStatus: 'NOT_STARTED',
        processId: null,
        healthResponded: false,
        applicationBoots: false,
      },
    });

    const report: RuntimeStartupProofRepairReport = {
      readOnly: true,
      advisoryOnly: true,
      repairId,
      generatedAt: new Date().toISOString(),
      coreQuestion: RUNTIME_STARTUP_PROOF_REPAIR_CORE_QUESTION,
      workspaceId: 'none',
      workspaceRoot: 'none',
      entrypoint: emptyEntrypoint,
      resolvedCommand: {
        readOnly: true,
        command: null,
        cwd: 'none',
        expectedPort: 4173,
        entryFile: null,
        appType: 'UNKNOWN',
        evidenceSource: 'NO_COMMAND_FOUND',
        evidenceDetail: 'No workspace',
        confidence: 0,
        resolved: false,
      },
      probe: {
        readOnly: true,
        attemptedCommand: null,
        cwd: 'none',
        expectedPort: 4173,
        processStarted: false,
        portBound: false,
        firstResponseStatus: null,
        startupLogs: [],
        fatalErrors: ['no workspace'],
        elapsedMs: 0,
        timedOut: false,
        cleanupStatus: 'NOT_STARTED',
        processId: null,
        healthResponded: false,
        applicationBoots: false,
      },
      failureClass: classification.failureClass,
      failureReason: classification.failureReason,
      recommendedFix: classification.recommendedFix,
      recommendedNextActions: classification.recommendedNextActions,
      applicationBoots: false,
      connectedBuildProofLevel: buildMaterializationReport.proofLevel,
      dependencyMaterialization: null,
      dependencyInstallationExecutor: null,
      crashDiagnosis: null,
      preciseCrashClass: null,
      cacheKey: stableCacheKey(repairId, false, classification.failureClass),
    };

    const assessment: RuntimeStartupProofRepairAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'RUNTIME_STARTUP_PROOF_REPAIR_COMPLETE',
      report,
      cacheKey: report.cacheKey,
    };
    if (!input.skipHistoryRecording) recordRuntimeStartupProofRepairAssessment(assessment);
    return assessment;
  }

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
    expectedPortOverride: input.expectedPort,
  });

  const preInstallDependency =
    input.dependencyMaterializationReport ??
    assessGeneratedWorkspaceDependencyMaterialization({
      rootDir,
      buildMaterializationReport,
      workspacePath: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      skipHistoryRecording: true,
    }).report;

  let dependencyInstallationExecutor: GeneratedWorkspaceDependencyInstallationExecutorReport | null =
    null;

  const installMode = input.dependencyInstallExecutionMode ?? 'SKIP';
  if (installMode === 'EXECUTE' && !preInstallDependency.dependenciesReady) {
    dependencyInstallationExecutor = executeGeneratedWorkspaceDependencyInstallation({
      rootDir,
      buildMaterializationReport,
      workspacePath: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      dependencyMaterializationReport: preInstallDependency,
      executionMode: 'EXECUTE',
      skipPostInstallStartupProbe: false,
      skipHistoryRecording: true,
    }).report;
  }

  let probe = probeRuntimeStartup({
    rootDir,
    resolved: resolvedCommand,
    workspaceId: workspace.workspaceId,
    skipProbe: input.skipProbe,
  });

  if (dependencyInstallationExecutor?.startupProbeAfterInstall) {
    probe = dependencyInstallationExecutor.startupProbeAfterInstall;
  } else if (
    dependencyInstallationExecutor?.postInstallVerification.dependenciesReady &&
    !probe.applicationBoots &&
    !input.skipProbe
  ) {
    probe = probeRuntimeStartup({
      rootDir,
      resolved: resolvedCommand,
      workspaceId: workspace.workspaceId,
    });
  }

  const dependencyMaterialization: GeneratedWorkspaceDependencyMaterializationReport =
    dependencyInstallationExecutor?.postInstallVerification.afterMaterialization ??
    input.dependencyMaterializationReport ??
    assessGeneratedWorkspaceDependencyMaterialization({
      rootDir,
      buildMaterializationReport,
      workspacePath: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      startupProbeLogs: probe.startupLogs,
      startupFatalErrors: probe.fatalErrors,
      allowAutoInstall: input.allowAutoInstall,
      skipHistoryRecording: true,
    }).report;

  const crashDiagnosis: GeneratedRuntimeCrashDiagnosisReport =
    assessGeneratedRuntimeCrashDiagnosis({
      rootDir,
      buildMaterializationReport,
      workspacePath: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      probe,
      entrypoint,
      resolvedCommand,
      skipHistoryRecording: true,
    }).report;

  const classification = classifyStartupFailure({
    entrypoint,
    resolved: resolvedCommand,
    probe,
    dependencyMaterialization,
    crashDiagnosis,
  });

  const cacheKey = stableCacheKey(repairId, probe.applicationBoots, classification.failureClass);
  const report: RuntimeStartupProofRepairReport = {
    readOnly: true,
    advisoryOnly: true,
    repairId,
    generatedAt: new Date().toISOString(),
    coreQuestion: RUNTIME_STARTUP_PROOF_REPAIR_CORE_QUESTION,
    workspaceId: workspace.workspaceId,
    workspaceRoot: workspace.workspaceRoot,
    entrypoint,
    resolvedCommand,
    probe,
    failureClass: classification.failureClass,
    failureReason: classification.failureReason,
    recommendedFix: classification.recommendedFix,
    recommendedNextActions: classification.recommendedNextActions,
    applicationBoots: probe.applicationBoots,
    connectedBuildProofLevel: buildMaterializationReport.proofLevel,
    dependencyMaterialization,
    dependencyInstallationExecutor,
    crashDiagnosis,
    preciseCrashClass: probe.applicationBoots
      ? 'NONE'
      : crashDiagnosis.classification.crashClass,
    cacheKey,
  };

  const assessment: RuntimeStartupProofRepairAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_STARTUP_PROOF_REPAIR_COMPLETE',
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordRuntimeStartupProofRepairAssessment(assessment);
  }

  return assessment;
}

export {
  buildRuntimeStartupProofRepairReportMarkdown,
  buildRuntimeStartupFailureClassificationReportMarkdown,
};

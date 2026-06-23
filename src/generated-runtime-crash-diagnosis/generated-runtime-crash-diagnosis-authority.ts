/**
 * Generated Runtime Crash Diagnosis — authority orchestrator (Phase 26.81).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import {
  discoverRuntimeEntrypoint,
  resolvePrimaryWorkspace,
} from '../runtime-startup-proof-repair/runtime-entrypoint-discovery.js';
import { resolveStartupCommand } from '../runtime-startup-proof-repair/runtime-start-command-resolver.js';
import { probeRuntimeStartup } from '../runtime-startup-proof-repair/runtime-process-probe.js';
import { extractStartupLogCrash } from './startup-log-crash-extractor.js';
import { mapRuntimeEntrypointCrash } from './runtime-entrypoint-crash-mapper.js';
import { classifyRuntimeCrash } from './runtime-crash-classifier.js';
import { buildRuntimeCrashRepairPlan } from './runtime-crash-repair-planner.js';
import {
  buildGeneratedRuntimeCrashDiagnosisReportMarkdown,
  buildGeneratedRuntimeCrashRepairPlanMarkdown,
} from './generated-runtime-crash-diagnosis-report-builder.js';
import {
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_CACHE_KEY_PREFIX,
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_CORE_QUESTION,
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS,
} from './generated-runtime-crash-diagnosis-registry.js';
import {
  recordGeneratedRuntimeCrashDiagnosisAssessment,
  resetGeneratedRuntimeCrashDiagnosisHistoryForTests,
} from './generated-runtime-crash-diagnosis-history.js';
import type {
  AssessGeneratedRuntimeCrashDiagnosisInput,
  GeneratedRuntimeCrashDiagnosisAssessment,
  GeneratedRuntimeCrashDiagnosisReport,
} from './generated-runtime-crash-diagnosis-types.js';
import type { RuntimeStartupProbeResult } from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

let diagnosisCounter = 0;

export function resetGeneratedRuntimeCrashDiagnosisCounterForTests(): void {
  diagnosisCounter = 0;
}

export function resetGeneratedRuntimeCrashDiagnosisModuleForTests(): void {
  resetGeneratedRuntimeCrashDiagnosisCounterForTests();
  resetGeneratedRuntimeCrashDiagnosisHistoryForTests();
}

function nextDiagnosisId(): string {
  diagnosisCounter += 1;
  return `generated-runtime-crash-diagnosis-${diagnosisCounter}-${Date.now()}`;
}

function stableCacheKey(diagnosisId: string, crashClass: string): string {
  const digest = createHash('sha256')
    .update([GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS, diagnosisId, crashClass].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${GENERATED_RUNTIME_CRASH_DIAGNOSIS_CACHE_KEY_PREFIX}:${digest}`;
}

const emptyProbe: RuntimeStartupProbeResult = {
  readOnly: true,
  attemptedCommand: null,
  cwd: 'none',
  expectedPort: 4173,
  processStarted: false,
  portBound: false,
  firstResponseStatus: null,
  startupLogs: [],
  fatalErrors: ['no probe'],
  elapsedMs: 0,
  timedOut: false,
  cleanupStatus: 'NOT_STARTED',
  processId: null,
  healthResponded: false,
  applicationBoots: false,
};

export function assessGeneratedRuntimeCrashDiagnosis(
  input: AssessGeneratedRuntimeCrashDiagnosisInput = {},
): GeneratedRuntimeCrashDiagnosisAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const diagnosisId = nextDiagnosisId();

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
    const extraction = extractStartupLogCrash({ probe: emptyProbe });
    const mapping = {
      readOnly: true as const,
      attemptedCommand: null,
      cwd: 'none',
      entryFile: null,
      workspaceRoot: 'none',
      workspaceId: 'none',
      processCrashed: false,
      processStarted: false,
      portBound: false,
      healthResponded: false,
      candidateEntryFiles: [],
    };
    const classification = classifyRuntimeCrash({ extraction, mapping });
    const repairPlan = buildRuntimeCrashRepairPlan({ classification, mapping });
    const report: GeneratedRuntimeCrashDiagnosisReport = {
      readOnly: true,
      advisoryOnly: true,
      diagnosisId,
      generatedAt: new Date().toISOString(),
      coreQuestion: GENERATED_RUNTIME_CRASH_DIAGNOSIS_CORE_QUESTION,
      workspaceRoot: 'none',
      workspaceId: 'none',
      extraction,
      entrypointMapping: mapping,
      classification,
      repairPlan,
      crashDetected: false,
      connectedBuildProofLevel: buildMaterializationReport.proofLevel,
      recommendedFix: repairPlan.repairRecommendation,
      cacheKey: stableCacheKey(diagnosisId, classification.crashClass),
    };
    const assessment: GeneratedRuntimeCrashDiagnosisAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'RUNTIME_CRASH_DIAGNOSIS_COMPLETE',
      report,
      cacheKey: report.cacheKey,
    };
    if (!input.skipHistoryRecording) recordGeneratedRuntimeCrashDiagnosisAssessment(assessment);
    return assessment;
  }

  const entrypoint =
    input.entrypoint ??
    discoverRuntimeEntrypoint({
      rootDir,
      workspaceRoot: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      workspaceAbs: workspace.workspaceAbs,
      buildMaterializationReport,
    });

  const resolvedCommand =
    input.resolvedCommand ??
    resolveStartupCommand({
      rootDir,
      entrypoint,
      buildMaterializationReport,
    });

  const probe =
    input.probe ??
    probeRuntimeStartup({
      rootDir,
      resolved: resolvedCommand,
      workspaceId: workspace.workspaceId,
    });

  const extraction = extractStartupLogCrash({ probe });
  const entrypointMapping = mapRuntimeEntrypointCrash({
    workspaceAbs: workspace.workspaceAbs,
    workspaceRoot: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    probe,
    entrypoint,
    resolved: resolvedCommand,
  });

  const classification = classifyRuntimeCrash({
    extraction,
    mapping: entrypointMapping,
    firstResponseStatus: probe.firstResponseStatus,
  });
  const repairPlan = buildRuntimeCrashRepairPlan({ classification, mapping: entrypointMapping });
  const crashDetected =
    classification.crashClass !== 'NONE' &&
    !probe.applicationBoots &&
    (entrypointMapping.processCrashed ||
      probe.fatalErrors.some((e) => e.includes('RUNTIME_CRASH')));

  const recommendedFix =
    classification.crashClass === 'NONE'
      ? 'No crash repair required — bounded startup probe confirmed health response.'
      : `[${classification.crashClass}] ${repairPlan.repairRecommendation}`;

  const report: GeneratedRuntimeCrashDiagnosisReport = {
    readOnly: true,
    advisoryOnly: true,
    diagnosisId,
    generatedAt: new Date().toISOString(),
    coreQuestion: GENERATED_RUNTIME_CRASH_DIAGNOSIS_CORE_QUESTION,
    workspaceRoot: workspace.workspaceRoot,
    workspaceId: workspace.workspaceId,
    extraction,
    entrypointMapping,
    classification,
    repairPlan,
    crashDetected,
    connectedBuildProofLevel: buildMaterializationReport.proofLevel,
    recommendedFix,
    cacheKey: stableCacheKey(diagnosisId, classification.crashClass),
  };

  const assessment: GeneratedRuntimeCrashDiagnosisAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_CRASH_DIAGNOSIS_COMPLETE',
    report,
    cacheKey: report.cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordGeneratedRuntimeCrashDiagnosisAssessment(assessment);
  }

  return assessment;
}

export {
  buildGeneratedRuntimeCrashDiagnosisReportMarkdown,
  buildGeneratedRuntimeCrashRepairPlanMarkdown,
};

/**
 * Phase 26.97 — Founder Simulation Payload Guard authority (V1).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import {
  FOUNDER_SIMULATION_PAYLOAD_GUARD_CACHE_KEY_PREFIX,
  FOUNDER_SIMULATION_PAYLOAD_GUARD_CORE_QUESTION,
  FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS,
} from './founder-simulation-payload-guard-registry.js';
import {
  recordFounderSimulationPayloadGuardReport,
  resetFounderSimulationPayloadGuardHistoryForTests,
} from './founder-simulation-payload-guard-history.js';
import {
  normalizeFounderSimulationExecutionResult,
  toHandlerResultShape,
} from './founder-simulation-payload-normalizer.js';
import { buildGuardedDiagnosticMarkdown } from './founder-simulation-payload-repair-planner.js';
import {
  isLaunchVerdictGovernanceGuardedDiagnosticPath,
  mergeGovernanceSourceNormalizationIntoRaw,
  resolveGuardedDiagnosticOriginalError,
} from './founder-simulation-guarded-diagnostic-source-patch.js';
import { locateAndPatchFounderSimulationCrash } from '../founder-simulation-crash-locator/index.js';
import type {
  ApplyFounderSimulationPayloadGuardInput,
  FounderSimulationPayloadGuardAssessment,
  FounderSimulationPayloadGuardReport,
} from './founder-simulation-payload-guard-types.js';

let guardCounter = 0;

export function resetFounderSimulationPayloadGuardCounterForTests(): void {
  guardCounter = 0;
}

export function resetFounderSimulationPayloadGuardModuleForTests(): void {
  resetFounderSimulationPayloadGuardCounterForTests();
  resetFounderSimulationPayloadGuardHistoryForTests();
}

function nextGuardId(): string {
  guardCounter += 1;
  return `founder-simulation-payload-guard-${guardCounter}-${Date.now()}`;
}

function stableCacheKey(guardId: string, repairsApplied: number): string {
  const digest = createHash('sha256')
    .update([FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS, guardId, String(repairsApplied)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_SIMULATION_PAYLOAD_GUARD_CACHE_KEY_PREFIX}:${digest}`;
}

function canSafelyBuildReport(
  guarded: ReturnType<typeof normalizeFounderSimulationExecutionResult>['guarded'],
): boolean {
  const summary = guarded.report?.unifiedSummary as Record<string, unknown> | undefined;
  if (!summary) return true;
  for (const field of ['whatWorks', 'whatIsBroken', 'launchBlockers'] as const) {
    const value = summary[field];
    if (value != null && !Array.isArray(value)) return false;
  }
  const v4 = guarded.report?.v4 as Record<string, unknown> | undefined;
  const chat = v4?.chatIntelligenceReality as Record<string, unknown> | undefined;
  if (chat?.failedScenarios != null && !Array.isArray(chat.failedScenarios)) return false;
  if (chat?.founderProofNotes != null && !Array.isArray(chat.founderProofNotes)) return false;
  return true;
}

export function applyFounderSimulationPayloadGuard(
  input: ApplyFounderSimulationPayloadGuardInput,
): FounderSimulationPayloadGuardAssessment {
  const guardId = nextGuardId();
  const generatedAt = new Date().toISOString();
  const { guarded, repairs } = normalizeFounderSimulationExecutionResult({
    rawResult: input.rawResult,
    degraded: input.degraded,
    completionEvent: input.completionEvent,
    originalError: input.originalError,
  });

  const reportGenerationSafe = canSafelyBuildReport(guarded);
  const passToken =
    reportGenerationSafe && (repairs.length === 0 || guarded.guard.degraded)
      ? FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS
      : reportGenerationSafe
        ? FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS
        : null;

  const report: FounderSimulationPayloadGuardReport = {
    readOnly: true,
    guardId,
    generatedAt,
    coreQuestion: FOUNDER_SIMULATION_PAYLOAD_GUARD_CORE_QUESTION,
    repairsApplied: repairs.length,
    missingFields: guarded.guard.missingFields,
    degraded: guarded.guard.degraded,
    completionEvent: guarded.guard.completionEvent,
    reportGenerationSafe,
    passToken,
  };

  if (!input.skipHistoryRecording) {
    recordFounderSimulationPayloadGuardReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_SIMULATION_PAYLOAD_GUARD_COMPLETE',
    report,
    guardedResult: guarded,
    cacheKey: stableCacheKey(guardId, repairs.length),
  };
}

export function guardFounderSimulationHandlerResult(input: {
  rawResult: unknown;
  degraded?: boolean;
  completionEvent?: string | null;
  originalError?: string | null;
  elapsedMs?: number;
  skipHistoryRecording?: boolean;
  runId?: string | null;
  reportBuildError?: unknown;
}): {
  result: ReturnType<typeof toHandlerResultShape>;
  diagnosticMarkdown: string | null;
  guardAssessment: FounderSimulationPayloadGuardAssessment;
} {
  const sourcePrep = mergeGovernanceSourceNormalizationIntoRaw(input.rawResult);
  let workingRaw = sourcePrep.workingRaw;
  const governanceSourceNormalized = sourcePrep.governanceSourceNormalized;
  let crashContext = null as ReturnType<typeof locateAndPatchFounderSimulationCrash>['assessment']['report']['context'] | null;
  let crashAppliedPaths: string[] = [];

  const originalErrorForGuard = resolveGuardedDiagnosticOriginalError({
    originalError: input.originalError,
    governanceSourceNormalized,
  });

  if (input.reportBuildError != null && !governanceSourceNormalized) {
    const located = locateAndPatchFounderSimulationCrash({
      error: input.reportBuildError,
      rawResult: workingRaw,
      runId: input.runId ?? null,
      completionEvent: input.completionEvent ?? null,
      degraded: input.degraded,
      guardApplied: false,
    });
    crashAppliedPaths = located.appliedPaths.filter(
      (path) => !isLaunchVerdictGovernanceGuardedDiagnosticPath(path),
    );
    if (crashAppliedPaths.length > 0) {
      workingRaw = located.patchedResult;
    }
    crashContext = {
      ...located.assessment.report.context,
      crashFieldPath:
        located.assessment.report.context.crashFieldPath &&
        isLaunchVerdictGovernanceGuardedDiagnosticPath(
          located.assessment.report.context.crashFieldPath,
        )
          ? null
          : located.assessment.report.context.crashFieldPath,
      patchApplied: crashAppliedPaths.length > 0,
    };
  }

  const guardAssessment = applyFounderSimulationPayloadGuard({
    rawResult: workingRaw,
    degraded: input.degraded,
    completionEvent: input.completionEvent,
    originalError: originalErrorForGuard,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  if (crashAppliedPaths.length > 0) {
    const extraRepairs = crashAppliedPaths.map((path) => ({
      readOnly: true as const,
      path,
      failureClass: 'REPORT_BUILDER_UNGUARDED_LENGTH_ACCESS' as const,
      defaultApplied: '[]',
    }));
    guardAssessment.guardedResult.guard = {
      ...guardAssessment.guardedResult.guard,
      missingFields: [
        ...new Set([...guardAssessment.guardedResult.guard.missingFields, ...crashAppliedPaths]),
      ],
      repairs: [...guardAssessment.guardedResult.guard.repairs, ...extraRepairs],
      crashLocation: crashContext?.crashLocation ?? null,
      crashFieldPath: crashContext?.crashFieldPath ?? crashAppliedPaths[0] ?? null,
      patchApplied: true,
      originalStack: crashContext?.originalStack ?? null,
    };
    guardAssessment.report = {
      ...guardAssessment.report,
      repairsApplied: guardAssessment.guardedResult.guard.missingFields.length,
      missingFields: guardAssessment.guardedResult.guard.missingFields,
    };
  } else if (crashContext) {
    guardAssessment.guardedResult.guard = {
      ...guardAssessment.guardedResult.guard,
      crashLocation: crashContext.crashLocation,
      crashFieldPath: crashContext.crashFieldPath,
      patchApplied: crashContext.patchApplied,
      originalStack: crashContext.originalStack,
    };
  } else if (governanceSourceNormalized) {
    guardAssessment.guardedResult.guard = {
      ...guardAssessment.guardedResult.guard,
      crashLocation: null,
      crashFieldPath: null,
      patchApplied: false,
      originalStack: null,
    };
  }

  const result = toHandlerResultShape(guardAssessment.guardedResult);
  const diagnosticMarkdown =
    guardAssessment.guardedResult.guard.degraded ||
    guardAssessment.report.repairsApplied > 0 ||
    crashAppliedPaths.length > 0
      ? buildGuardedDiagnosticMarkdown({
          guard: guardAssessment.guardedResult.guard,
          elapsedMs: input.elapsedMs,
          partialReportMarkdown:
            typeof guardAssessment.guardedResult.report?.reportMarkdown === 'string'
              ? (guardAssessment.guardedResult.report.reportMarkdown as string)
              : null,
        })
      : null;

  return { result, diagnosticMarkdown, guardAssessment };
}

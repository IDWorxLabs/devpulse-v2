/**
 * Phase 26.99 — Founder Simulation Crash Locator authority (V1).
 * Locates exact undefined `.length` crash sites before broad normalization.
 */

import { createHash } from 'node:crypto';
import {
  CONFIRMED_V5_CRASH_FIELD_PATHS,
  FOUNDER_SIMULATION_CRASH_LOCATOR_CACHE_KEY_PREFIX,
  FOUNDER_SIMULATION_CRASH_LOCATOR_PASS,
  isUndefinedLengthCrashError,
} from './founder-simulation-crash-locator-registry.js';
import { captureFounderSimulationCrashContext } from './founder-simulation-crash-context-capturer.js';
import {
  recordFounderSimulationCrashLocatorReport,
  resetFounderSimulationCrashLocatorHistoryForTests,
} from './founder-simulation-crash-locator-history.js';
import {
  extractErrorStack,
  findPrimaryCrashFrame,
  parseUndefinedLengthStack,
} from './undefined-length-stack-parser.js';
import {
  probeFieldPath,
  resolveLikelyFieldPaths,
} from './object-path-probe.js';
import type {
  ApplyFounderSimulationCrashPatchInput,
  FounderSimulationCrashContext,
  FounderSimulationCrashLocatorAssessment,
  LocateFounderSimulationCrashInput,
} from './founder-simulation-crash-locator-types.js';

let locatorCounter = 0;

export function resetFounderSimulationCrashLocatorCounterForTests(): void {
  locatorCounter = 0;
}

export function resetFounderSimulationCrashLocatorModuleForTests(): void {
  resetFounderSimulationCrashLocatorCounterForTests();
  resetFounderSimulationCrashLocatorHistoryForTests();
}

function nextLocatorId(): string {
  locatorCounter += 1;
  return `founder-simulation-crash-locator-${locatorCounter}-${Date.now()}`;
}

function stableCacheKey(locatorId: string, patchApplied: boolean): string {
  const digest = createHash('sha256')
    .update([FOUNDER_SIMULATION_CRASH_LOCATOR_PASS, locatorId, String(patchApplied)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_SIMULATION_CRASH_LOCATOR_CACHE_KEY_PREFIX}:${digest}`;
}

function clonePathSegment(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function setPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    const next = cursor[key];
    const cloned = clonePathSegment(next);
    cursor[key] = cloned;
    cursor = cloned;
  }
  cursor[parts[parts.length - 1]!] = value;
}

export function applyTargetedCrashFieldPatch(
  rawResult: unknown,
  fieldPath: string,
): { patched: unknown; applied: boolean } {
  if (!fieldPath) return { patched: rawResult, applied: false };

  const root =
    rawResult && typeof rawResult === 'object'
      ? JSON.parse(JSON.stringify(rawResult)) as Record<string, unknown>
      : {};

  const probe = probeFieldPath(rawResult, fieldPath);
  if (!probe.isUndefined && probe.value != null && Array.isArray(probe.value)) {
    return { patched: rawResult, applied: false };
  }

  const defaultValue = probe.fieldKind === 'string-like' ? '' : [];
  setPath(root, fieldPath, defaultValue);
  return { patched: root, applied: true };
}

export function applyConfirmedV5LaunchVerdictGovernancePatches(rawResult: unknown): {
  patched: unknown;
  appliedPaths: string[];
} {
  const appliedPaths: string[] = [];
  let current = rawResult;

  for (const path of CONFIRMED_V5_CRASH_FIELD_PATHS) {
    const probe = probeFieldPath(current, path);
    if (probe.isUndefined || probe.value == null || !Array.isArray(probe.value)) {
      const result = applyTargetedCrashFieldPatch(current, path);
      current = result.patched;
      if (result.applied) appliedPaths.push(path);
    }
  }

  return { patched: current, appliedPaths };
}

export function locateFounderSimulationUndefinedLengthCrash(
  input: LocateFounderSimulationCrashInput,
): FounderSimulationCrashLocatorAssessment {
  const locatorId = nextLocatorId();
  const stack = extractErrorStack(input.error);
  const stackFrames = parseUndefinedLengthStack(stack);
  const primaryFrame = findPrimaryCrashFrame(stackFrames);
  const likelyFieldPaths = resolveLikelyFieldPaths({
    primaryFrame,
    rawResult: input.rawResult,
  });

  const context = captureFounderSimulationCrashContext(input);
  const passToken =
    context.crashFieldPath != null && context.crashLocation != null
      ? FOUNDER_SIMULATION_CRASH_LOCATOR_PASS
      : null;

  const report = {
    readOnly: true as const,
    locatorId,
    generatedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
    context,
    stackFrames,
    likelyFieldPaths,
    passToken,
  };

  recordFounderSimulationCrashLocatorReport(report);
  stableCacheKey(locatorId, false);

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}

export function applyFounderSimulationCrashPatch(
  input: ApplyFounderSimulationCrashPatchInput,
): {
  patchedResult: unknown;
  context: FounderSimulationCrashContext;
  appliedPaths: string[];
} {
  const fieldPath = input.crashContext.crashFieldPath;
  const appliedPaths: string[] = [];
  let current = input.rawResult;

  if (fieldPath) {
    const single = applyTargetedCrashFieldPatch(current, fieldPath);
    current = single.patched;
    if (single.applied) appliedPaths.push(fieldPath);
  }

  const confirmed = applyConfirmedV5LaunchVerdictGovernancePatches(current);
  current = confirmed.patched;
  for (const path of confirmed.appliedPaths) {
    if (!appliedPaths.includes(path)) appliedPaths.push(path);
  }

  const context: FounderSimulationCrashContext = {
    ...input.crashContext,
    patchApplied: appliedPaths.length > 0,
    patchedFieldPath: appliedPaths[0] ?? null,
  };

  return { patchedResult: current, context, appliedPaths };
}

export function locateAndPatchFounderSimulationCrash(input: {
  error: unknown;
  rawResult: unknown;
  runId?: string | null;
  stage?: string | null;
  completionEvent?: string | null;
  degraded?: boolean;
  guardApplied?: boolean;
  guardMissingFields?: readonly string[];
}): {
  assessment: FounderSimulationCrashLocatorAssessment;
  patchedResult: unknown;
  appliedPaths: string[];
} {
  const assessment = locateFounderSimulationUndefinedLengthCrash(input);
  const patch = applyFounderSimulationCrashPatch({
    rawResult: input.rawResult,
    crashContext: assessment.report.context,
  });

  const updatedReport = {
    ...assessment.report,
    context: patch.context,
    passToken:
      patch.appliedPaths.length > 0
        ? FOUNDER_SIMULATION_CRASH_LOCATOR_PASS
        : assessment.report.passToken,
  };
  recordFounderSimulationCrashLocatorReport(updatedReport);

  return {
    assessment: { ...assessment, report: updatedReport },
    patchedResult: patch.patchedResult,
    appliedPaths: patch.appliedPaths,
  };
}

export function tryBuildV5ReportWithCrashLocator<T>(input: {
  rawResult: unknown;
  build: (payload: unknown) => T;
  onCrash?: (assessment: FounderSimulationCrashLocatorAssessment) => void;
  completionEvent?: string | null;
  degraded?: boolean;
  guardMissingFields?: readonly string[];
}): { result: T | null; crashAssessment: FounderSimulationCrashLocatorAssessment | null } {
  try {
    return { result: input.build(input.rawResult), crashAssessment: null };
  } catch (error) {
    if (!isUndefinedLengthCrashError(error)) {
      throw error;
    }

    const located = locateAndPatchFounderSimulationCrash({
      error,
      rawResult: input.rawResult,
      completionEvent: input.completionEvent,
      degraded: input.degraded,
      guardApplied: true,
      guardMissingFields: input.guardMissingFields,
    });
    input.onCrash?.(located.assessment);

    return {
      result: input.build(located.patchedResult),
      crashAssessment: located.assessment,
    };
  }
}

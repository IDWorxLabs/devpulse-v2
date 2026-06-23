/**
 * Phase 26.99 — Founder simulation crash context capturer.
 */

import type { FounderSimulationCrashContext, LocateFounderSimulationCrashInput } from './founder-simulation-crash-locator-types.js';
import {
  extractErrorMessage,
  extractErrorStack,
  findPrimaryCrashFrame,
  formatCrashLocation,
  parseUndefinedLengthStack,
} from './undefined-length-stack-parser.js';
import {
  probeFieldPath,
  resolveLikelyFieldPaths,
  selectPrimaryCrashFieldPath,
} from './object-path-probe.js';
import { classifyFounderSimulationCrash } from './founder-simulation-crash-classifier.js';

export function captureFounderSimulationCrashContext(
  input: LocateFounderSimulationCrashInput,
): FounderSimulationCrashContext {
  const originalError = extractErrorMessage(input.error);
  const originalStack = extractErrorStack(input.error);
  const stackFrames = parseUndefinedLengthStack(originalStack);
  const primaryFrame = findPrimaryCrashFrame(stackFrames);
  const likelyFieldPaths = resolveLikelyFieldPaths({
    primaryFrame,
    rawResult: input.rawResult,
  });
  const crashFieldPath = selectPrimaryCrashFieldPath(likelyFieldPaths);
  const fieldProbe = crashFieldPath ? probeFieldPath(input.rawResult, crashFieldPath) : null;
  const classification = classifyFounderSimulationCrash(primaryFrame);

  const guardMissedField =
    crashFieldPath != null &&
    !(input.guardMissingFields ?? []).includes(crashFieldPath) &&
    (fieldProbe?.isUndefined === true || fieldProbe?.value == null);

  return {
    readOnly: true,
    runId: input.runId ?? null,
    stage: input.stage ?? 'FOUNDER_SIMULATION_ENGINE',
    completionEvent: input.completionEvent ?? null,
    degraded: input.degraded ?? false,
    originalError,
    originalStack,
    crashLocation: formatCrashLocation(primaryFrame),
    crashFieldPath,
    crashFieldName: crashFieldPath ? crashFieldPath.split('.').pop() ?? null : null,
    parentObjectType: fieldProbe?.parentType ?? null,
    fieldKind: fieldProbe?.fieldKind ?? 'unknown',
    failureClass: guardMissedField ? 'PAYLOAD_GUARD_MISSED_FIELD' : classification.failureClass,
    occurredBeforePayloadGuard: input.guardApplied !== true,
    guardNormalizedParent: fieldProbe?.parentExists === true && fieldProbe.isUndefined,
    guardMissedField,
    patchApplied: false,
    patchedFieldPath: null,
  };
}

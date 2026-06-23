/**
 * Phase 26.99 — Founder simulation crash classifier.
 */

import type {
  FounderSimulationCrashFailureClass,
  UndefinedLengthStackFrame,
} from './founder-simulation-crash-locator-types.js';
import {
  V5_REPORT_BUILDER_FILE_HINT,
} from './founder-simulation-crash-locator-registry.js';

export function classifyFounderSimulationCrash(
  primaryFrame: UndefinedLengthStackFrame | null,
): {
  readOnly: true;
  failureClass: FounderSimulationCrashFailureClass;
  reason: string | null;
} {
  const file = primaryFrame?.filePath ?? '';

  if (file.includes(V5_REPORT_BUILDER_FILE_HINT)) {
    return {
      readOnly: true,
      failureClass: 'V5_REPORT_BUILDER_UNDEFINED_LENGTH',
      reason: `V5 report builder frame at line ${primaryFrame?.lineNumber ?? 'unknown'}`,
    };
  }
  if (file.includes('founder-simulation-payload-repair-planner') || file.includes('payload-guard')) {
    return {
      readOnly: true,
      failureClass: 'DIAGNOSTIC_REPORT_UNDEFINED_LENGTH',
      reason: 'Diagnostic report builder frame',
    };
  }
  if (file.includes('founder-result-store-delivery-repair') || file.includes('founder-test-run-result-store')) {
    return {
      readOnly: true,
      failureClass: 'RESULT_STORE_HANDOFF_UNDEFINED_LENGTH',
      reason: 'Result store handoff frame',
    };
  }
  if (file.includes('founder-testing-handler')) {
    return {
      readOnly: true,
      failureClass: 'FINAL_REPORT_AGGREGATION_UNDEFINED_LENGTH',
      reason: 'Founder Test handler aggregation frame',
    };
  }
  if (file.includes('runtime-failure-report-builder') || file.includes('founder-test-runtime-monitor')) {
    return {
      readOnly: true,
      failureClass: 'RUNTIME_STATUS_UNDEFINED_LENGTH',
      reason: 'Runtime status/report frame',
    };
  }

  return {
    readOnly: true,
    failureClass: 'UNKNOWN_UNDEFINED_LENGTH_CRASH',
    reason: primaryFrame?.raw ?? 'No stack frame available',
  };
}

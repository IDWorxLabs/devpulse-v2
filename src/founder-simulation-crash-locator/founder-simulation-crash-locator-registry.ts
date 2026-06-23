/**
 * Phase 26.99 — Founder Simulation Crash Locator registry (V1).
 */

export const FOUNDER_SIMULATION_CRASH_LOCATOR_PASS = 'FOUNDER_SIMULATION_CRASH_LOCATOR_PASS';

export const FOUNDER_SIMULATION_CRASH_LOCATOR_CORE_QUESTION =
  'Which object path is undefined when downstream code reads `.length` after FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS?';

export const FOUNDER_SIMULATION_CRASH_LOCATOR_CACHE_KEY_PREFIX =
  'founder-simulation-crash-locator-v1';

export const UNDEFINED_LENGTH_ERROR_PATTERN =
  /Cannot read properties of undefined \(reading 'length'\)/i;

export const V5_REPORT_BUILDER_FILE_HINT = 'founder-testing-v5-report-builder';

export const CONFIRMED_V5_CRASH_FIELD_PATHS = [
  'report.v4.launchVerdictGovernance.requiredEvidenceMissing',
  'report.v4.launchVerdictGovernance.blockingAuthorities',
] as const;

export const V5_LINE_TO_FIELD_PATH: Readonly<Record<number, string>> = {
  455: 'report.v4.launchVerdictGovernance.requiredEvidenceMissing',
  457: 'report.v4.launchVerdictGovernance.blockingAuthorities',
};

export const FOUNDER_SIMULATION_CRASH_FAILURE_CLASSES = [
  'V5_REPORT_BUILDER_UNDEFINED_LENGTH',
  'DIAGNOSTIC_REPORT_UNDEFINED_LENGTH',
  'RESULT_STORE_HANDOFF_UNDEFINED_LENGTH',
  'FINAL_REPORT_AGGREGATION_UNDEFINED_LENGTH',
  'RUNTIME_STATUS_UNDEFINED_LENGTH',
  'PAYLOAD_GUARD_MISSED_FIELD',
  'UNKNOWN_UNDEFINED_LENGTH_CRASH',
  'NONE',
] as const;

export const CRASH_LOCATOR_INTEGRATION_TARGETS = [
  'Founder Simulation Payload Guard',
  'Founder Simulation Completion Boundary Repair',
  'Founder Test Handler',
  'V5 Report Builder',
  'Runtime Failure Report Builder',
  'Result Store Delivery Repair',
] as const;

export function isUndefinedLengthCrashError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return UNDEFINED_LENGTH_ERROR_PATTERN.test(message);
}

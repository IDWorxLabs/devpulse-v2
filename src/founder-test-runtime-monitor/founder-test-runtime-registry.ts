/**
 * Founder Test Runtime Monitor — registry constants (V1).
 */

export const FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS = 'FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS';

export const FOUNDER_TEST_RUNTIME_MONITOR_OWNER_MODULE = 'founder-test-runtime-monitor';

export const FOUNDER_TEST_RUNTIME_MONITOR_PHASE = '26.42';

export const FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS = 'FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS';

export const FOUNDER_TEST_STAGE2_STALL_REPAIR_REPORT_TITLE = 'Founder Test Stage 2 Stall Repair Report';

export const FOUNDER_TEST_RUNTIME_MONITOR_REPORT_TITLE = 'Founder Test Runtime Monitor Report';

export const MAX_FOUNDER_TEST_RUNTIME_HISTORY = 16;

export const MAX_FOUNDER_TEST_RUNTIME_MS = 120_000;

export const STALL_SLOW_THRESHOLD_MS = 15_000;

export const STALL_STALLED_THRESHOLD_MS = 45_000;

export const FOUNDER_TEST_RUNTIME_STATES = [
  'IDLE',
  'STARTING',
  'RUNNING',
  'COMPLETING',
  'COMPLETE',
  'FAILED',
  'CANCELLED',
  'STALLED',
] as const;

export const FOUNDER_TEST_STAGE_STATUSES = [
  'PENDING',
  'RUNNING',
  'PASSED',
  'FAILED',
  'SKIPPED',
] as const;

export const STALL_HEALTH_VALUES = ['HEALTHY', 'SLOW', 'STALLED'] as const;

export const FOUNDER_TEST_ALREADY_RUNNING = 'FOUNDER_TEST_ALREADY_RUNNING';

export const FOUNDER_TEST_RUNTIME_STAGES = [
  { stageId: 'FOUNDER_TEST_STARTED', label: 'Founder Test Started', order: 1 },
  { stageId: 'INTAKE_VALIDATION', label: 'Intake Validation', order: 2 },
  { stageId: 'PLANNING_GATE', label: 'Planning Gate', order: 3 },
  { stageId: 'PLANNING_BRIEF', label: 'Planning Brief', order: 4 },
  { stageId: 'ARCHITECTURE_BRIEF', label: 'Architecture Brief', order: 5 },
  { stageId: 'BUILD_PLAN', label: 'Build Plan', order: 6 },
  { stageId: 'FOUNDER_SIMULATION_ENGINE', label: 'Founder Simulation Engine', order: 7 },
  { stageId: 'CROSS_SYSTEM_ORCHESTRATION_PROOF', label: 'Cross-System Orchestration Proof', order: 8 },
  { stageId: 'EXECUTION_READINESS_GATE', label: 'Execution Readiness Gate', order: 9 },
  { stageId: 'REPORT_GENERATION', label: 'Report Generation', order: 10 },
  { stageId: 'COMPLETE', label: 'Complete', order: 11 },
] as const;

export const STAGE_HISTORICAL_AVERAGE_MS: Record<string, number> = {
  FOUNDER_TEST_STARTED: 200,
  INTAKE_VALIDATION: 4000,
  PLANNING_GATE: 800,
  PLANNING_BRIEF: 600,
  ARCHITECTURE_BRIEF: 600,
  BUILD_PLAN: 600,
  FOUNDER_SIMULATION_ENGINE: 270_000,
  CROSS_SYSTEM_ORCHESTRATION_PROOF: 2000,
  EXECUTION_READINESS_GATE: 1500,
  REPORT_GENERATION: 1000,
  COMPLETE: 200,
};

/** Per-stage wall-clock timeout before stall escalation (ms). */
export const STAGE_TIMEOUT_MS: Record<string, number> = {
  FOUNDER_TEST_STARTED: 5_000,
  INTAKE_VALIDATION: 120_000,
  PLANNING_GATE: 30_000,
  PLANNING_BRIEF: 30_000,
  ARCHITECTURE_BRIEF: 30_000,
  BUILD_PLAN: 30_000,
  FOUNDER_SIMULATION_ENGINE: 300_000,
  CROSS_SYSTEM_ORCHESTRATION_PROOF: 60_000,
  EXECUTION_READINESS_GATE: 60_000,
  REPORT_GENERATION: 30_000,
  COMPLETE: 10_000,
};

export const STAGE_STALL_MESSAGES: Record<string, string> = {
  INTAKE_VALIDATION: 'Intake Validation has not advanced for',
  FOUNDER_SIMULATION_ENGINE: 'Founder Simulation Engine is still running (V5 in progress) after',
};

export const SAFETY_GUARANTEES = [
  'READ_ONLY_RUNTIME_OBSERVATION',
  'NO_FOUNDER_TEST_SCORING_CHANGES',
  'NO_FOUNDER_TEST_LOGIC_CHANGES',
  'NO_CODE_GENERATION',
  'NO_PROJECT_MUTATION',
  'BOUNDED_RUNTIME_HISTORY',
  'NO_FAKE_PROGRESS_PERCENTAGES',
  'DOUBLE_RUN_PROTECTION',
] as const;

/**
 * Runtime Trace Registry — founder test operator trace constants (V1).
 */

export const FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS = 'FOUNDER_TEST_OPERATOR_FEED_TRACE_V1_PASS';

export const FOUNDER_TEST_OPERATOR_FEED_TRACE_REPORT_TITLE = 'Founder Test Operator Feed Trace Report';

export const MAX_FOUNDER_TEST_TRACE_EVENTS = 48;

export const TRACE_EVENT_STATUSES = [
  'RUNNING',
  'SLOW',
  'STALLED',
  'FAILED',
  'COMPLETE',
  'PASSED',
  'WAITING',
] as const;

/** Next expected backend operation after a completed operation ID. */
export const OPERATION_NEXT_EXPECTED: Record<string, string> = {
  'runtime-session-created': 'Intake validation started',
  'intake-validation-started': 'Hydrating founder execution proof input',
  'founder-input-hydrated': 'Running product readiness simulation',
  'running-product-readiness-simulation': 'Product readiness simulation complete',
  'chat-stress-simulation-complete': 'Product readiness simulation complete',
  'product-readiness-simulation-complete': 'Launch readiness assessment complete',
  'launch-readiness-assessment-complete': 'Building launch readiness report markdown',
  'building-launch-readiness-report-markdown': 'Launch readiness artifacts built',
  'launch-readiness-artifacts-built': 'Intake validation complete',
  'intake-validation-complete': 'Planning gate entered',
  'intake-validation-passed': 'Planning gate entered',
  'planning-gate-entered': 'Planning gate passed',
  'planning-gate-passed': 'Planning brief generated',
  'planning-brief-passed': 'Architecture brief generated',
  'architecture-brief-passed': 'Build plan generated',
  'build-plan-passed': 'Founder simulation running',
  'founder-simulation-running': 'Founder simulation complete',
  'founder-simulation-complete': 'Cross-system orchestration proof',
  'cross-system-orchestration-complete': 'Execution readiness gate',
  'execution-readiness-gate-complete': 'Report generation started',
  'report-generation-started': 'Runtime completed',
};

export const STAGE_NEXT_EXPECTED: Record<string, string> = {
  FOUNDER_TEST_STARTED: 'Intake validation started',
  INTAKE_VALIDATION: 'Planning gate entered',
  PLANNING_GATE: 'Planning brief generated',
  PLANNING_BRIEF: 'Architecture brief generated',
  ARCHITECTURE_BRIEF: 'Build plan generated',
  BUILD_PLAN: 'Founder simulation running',
  FOUNDER_SIMULATION_ENGINE: 'Cross-system orchestration proof',
  CROSS_SYSTEM_ORCHESTRATION_PROOF: 'Execution readiness gate',
  EXECUTION_READINESS_GATE: 'Report generation started',
  REPORT_GENERATION: 'Runtime completed',
  COMPLETE: 'None — run finished',
};

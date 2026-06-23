/**
 * Phase 26.96 — Founder Simulation Completion Boundary Repair registry (V1).
 */

export const FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS =
  'FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS';

export const FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION =
  'Why does Founder Simulation Engine remain RUNNING after prior stages have completed?';

export const FOUNDER_SIMULATION_COMPLETION_BOUNDARY_CACHE_KEY_PREFIX =
  'founder-simulation-completion-boundary-v1';

export const FOUNDER_SIMULATION_COMPLETE = 'FOUNDER_SIMULATION_COMPLETE';
export const FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS =
  'FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS';
export const FOUNDER_SIMULATION_RUNNING = 'founder-simulation-running';

export const FOUNDER_SIMULATION_HEARTBEAT_INTERVAL_MS = 15_000;

/** Wall-clock budget for Stage 7 V5 founder testing (ms). */
export const FOUNDER_SIMULATION_STAGE_BUDGET_MS = 300_000;

export const FOUNDER_SIMULATION_COMPLETION_RULES = [
  'Rule 1 — bounded result must emit FOUNDER_SIMULATION_COMPLETE exactly once',
  'Rule 2 — degraded/partial/budget-limited results emit FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS',
  'Rule 3 — completion makes Cross-System Orchestration Proof eligible',
  'Rule 4 — runtime monitor must not stop before Complete or Failed with diagnostic',
  'Rule 5 — store diagnostic result on failure to avoid HTTP 500 result fetch',
] as const;

export const INTEGRATION_TARGETS = [
  'Founder Test Runtime Monitor',
  'Founder Test Handler',
  'Founder Simulation Engine',
  'Founder Test Integration',
  'Result Store Delivery Repair',
  'Runtime Status Reporting',
] as const;

export const POST_FOUNDER_SIMULATION_STAGES = [
  'CROSS_SYSTEM_ORCHESTRATION_PROOF',
  'EXECUTION_READINESS_GATE',
  'REPORT_GENERATION',
  'COMPLETE',
] as const;

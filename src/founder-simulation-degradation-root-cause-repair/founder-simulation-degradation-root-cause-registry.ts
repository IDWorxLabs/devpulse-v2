/**
 * Phase 27.02 — Founder Simulation Degradation Root Cause registry (V1).
 */

export const FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS =
  'FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS';

export const FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_PHASE = '27.02';

export const FOUNDER_SIMULATION_DEGRADATION_CORE_QUESTION =
  'Why does Founder Simulation complete with warnings instead of clean completion, and what consumed the runtime budget?';

export const FOUNDER_SIMULATION_DEGRADATION_CACHE_KEY_PREFIX =
  'founder-simulation-degradation-root-cause-v1';

export const DEGRADATION_INVESTIGATION_RULES = [
  'Rule 1 — capture full Founder Simulation timeline from runtime monitor stages and trace events',
  'Rule 2 — rank authorities and substeps by elapsedMs with runtime percentage',
  'Rule 3 — flag degradation when warning completion, budget exceedance, fallback, or repair planner activates',
  'Rule 4 — classify root cause before any repair attempt',
  'Rule 5 — identify exact authority that emitted FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS',
  'Rule 6 — produce repair recommendation without mutating simulation behavior',
] as const;

export const STAGE_TO_AUTHORITY: Record<string, string> = {
  FOUNDER_TEST_STARTED: 'Founder Test Runtime Monitor',
  INTAKE_VALIDATION: 'Founder Test Integration',
  PLANNING_GATE: 'Planning Gate Authority',
  PLANNING_BRIEF: 'Planning Brief Authority',
  ARCHITECTURE_BRIEF: 'Architecture Brief Authority',
  BUILD_PLAN: 'Build Plan Authority',
  FOUNDER_SIMULATION_ENGINE: 'Founder Testing V5 Assessment',
  CROSS_SYSTEM_ORCHESTRATION_PROOF: 'Cross-System Orchestration Proof',
  EXECUTION_READINESS_GATE: 'Execution Readiness Gate',
  REPORT_GENERATION: 'Report Generation',
  COMPLETE: 'Founder Test Integration',
};

export const OPERATION_TO_AUTHORITY: Record<string, string> = {
  'founder-input-hydrated': 'Founder Execution Proof Input',
  'founder-input-hydrating': 'Founder Execution Proof Input',
  'running-product-readiness-simulation': 'Product Readiness Simulation',
  'product-readiness-simulation-complete': 'Product Readiness Simulation',
  'chat-stress-simulation-complete': 'Chat Stress Simulation',
  'launch-readiness-assessment-complete': 'Launch Readiness Assessment',
  'launch-readiness-artifacts-built': 'Launch Readiness Assessment',
  'founder-simulation-running': 'Founder Simulation Completion Boundary',
  FOUNDER_SIMULATION_COMPLETE: 'Founder Simulation Completion Boundary',
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS: 'Founder Simulation Completion Boundary',
  'report-generation-started': 'Report Generation',
  'cross-system-orchestration-complete': 'Cross-System Orchestration Proof',
};

export const DEGRADATION_TRACE_PATTERNS = [
  /SIMULATION_BUDGET_EXCEEDED/i,
  /budget exceeded/i,
  /degraded evidence/i,
  /RECURSION_GUARD/i,
  /authority-recursion/i,
  /fallback/i,
  /WITH_WARNINGS/i,
  /repair planner/i,
  /payload guard/i,
  /timeout recovery/i,
] as const;

export const INTEGRATION_TARGETS = [
  'Founder Simulation Completion Boundary Repair',
  'Founder Test Runtime Monitor',
  'Founder Test Integration',
  'Founder Truth Matrix',
  'Runtime Status Reporting',
] as const;

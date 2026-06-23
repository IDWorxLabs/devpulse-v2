/**
 * Phase 27.05 — Intake Validation Stage Transition Repair registry (V1).
 */

export const INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS =
  'INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS';

export const INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_CACHE_KEY_PREFIX =
  'intake-validation-stage-transition-repair';

export const LAUNCH_READINESS_ASSESSMENT_COMPLETE = 'launch-readiness-assessment-complete';

export const LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS =
  'launch-readiness-assessment-complete-with-warnings';

export const BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN = 'building-launch-readiness-report-markdown';

export const LAUNCH_READINESS_ARTIFACTS_BUILT = 'launch-readiness-artifacts-built';

export const INTAKE_VALIDATION_COMPLETE = 'intake-validation-complete';

export const INTAKE_VALIDATION_COMPLETE_EMITTED = 'intake-validation-complete-emitted';

export const PLANNING_GATE_ENTERED = 'planning-gate-entered';

export const PLANNING_GATE_STARTED = 'planning-gate-started';

export const STAGE2_TRANSITION_CHAIN = [
  'Founder Test Started',
  'Intake Validation Started',
  'Launch Readiness Artifact Build Started',
  'Product Readiness Simulation Complete',
  'Launch Readiness Assessment Complete',
  'Launch Readiness Report Markdown Complete',
  'Launch Readiness Artifacts Built',
  'Intake Validation Complete',
  'Planning Gate Running',
] as const;

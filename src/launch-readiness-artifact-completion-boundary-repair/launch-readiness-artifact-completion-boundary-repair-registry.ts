/**
 * Phase 27.03 — Launch Readiness Artifact Completion Boundary Repair registry (V1).
 */

export const LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS =
  'LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS';

export const LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX =
  'launch-readiness-artifact-completion-boundary-repair';

export const LAUNCH_READINESS_ASSESSMENT_COMPLETE = 'launch-readiness-assessment-complete';

export const LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS =
  'launch-readiness-assessment-complete-with-warnings';

export const BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN = 'building-launch-readiness-report-markdown';

export const LAUNCH_READINESS_ARTIFACTS_BUILT = 'launch-readiness-artifacts-built';

export const INTAKE_VALIDATION_COMPLETE = 'intake-validation-complete';

export const PLANNING_GATE_ENTERED = 'planning-gate-entered';

export const PLANNING_GATE_STARTED = 'planning-gate-started';

export const LAUNCH_READINESS_ARTIFACT_CHAIN_LABELS = [
  'Launch readiness assessment complete',
  'Building launch readiness report markdown (started)',
  'Building launch readiness report markdown (finished)',
  'Launch artifacts created',
  'Launch artifacts persisted',
  'Launch readiness artifacts built',
  'Intake validation complete',
  'Planning gate running',
] as const;

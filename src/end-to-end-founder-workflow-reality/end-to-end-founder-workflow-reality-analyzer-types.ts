/**
 * End-to-End Founder Workflow Reality — analyzer level types (Phase 24A.4).
 */

export type FounderWorkflowStageId =
  | 'IDEA'
  | 'PLAN'
  | 'ARCHITECTURE'
  | 'TASK_BREAKDOWN'
  | 'BUILD'
  | 'RUNTIME'
  | 'PREVIEW'
  | 'VERIFY'
  | 'LAUNCH_READINESS';

export type StageEvidenceLevel = 'MISSING' | 'CLAIMED' | 'OBSERVED' | 'PROVEN';

export type WorkflowTruthMapLabel = 'PROVEN' | 'PARTIAL' | 'UNPROVEN' | 'BLOCKED' | 'UNAVAILABLE';

export type WorkflowContinuityLevel = 'CONTINUITY_PROVEN' | 'CONTINUITY_PARTIAL' | 'CONTINUITY_BROKEN';

export type WorkflowTransitionResult = 'PASS' | 'PARTIAL' | 'FAIL';

export type FounderExperienceLevel = 'FOUNDER_SUCCESSFUL' | 'FOUNDER_PARTIAL' | 'FOUNDER_BLOCKED';

export type LaunchReadinessRealityLevel =
  | 'LAUNCH_READINESS_PROVEN'
  | 'LAUNCH_READINESS_PARTIAL'
  | 'LAUNCH_READINESS_UNAVAILABLE';

export type WorkflowEvidenceLevel = 'CLAIMED' | 'OBSERVED' | 'PROVEN';

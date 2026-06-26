/**
 * ASE — resume controller.
 */

import type { AseResumeBoundary, AseStageId } from './ase-types.js';
import { ASE_STAGE_ORDER } from './ase-types.js';

const BOUNDARY_STAGE: Record<AseResumeBoundary, AseStageId> = {
  PROMPT_EVIDENCE_CONTRACT_CREATED: 'PROMPT_FAITHFULNESS',
  CAPABILITIES_RESOLVED: 'MISSING_CAPABILITY_EVOLUTION',
  FEATURE_SLICE_STABILIZED: 'INCREMENTAL_BUILD',
  BEHAVIOR_SCENARIO_PASSED: 'BEHAVIOR_SIMULATION',
  VIRTUAL_USER_JOURNEY_PASSED: 'VIRTUAL_USER',
  DEVICE_PROFILE_PASSED: 'VIRTUAL_DEVICE',
  INTERACTION_SWEEP_PASSED: 'INTERACTION_PROOF',
  REPAIR_LOOP_COMPLETED: 'AUTONOMOUS_DEBUGGING',
  IMPROVEMENT_LOOP_COMPLETED: 'CONTINUOUS_IMPROVEMENT',
  LAUNCH_DECISION_CREATED: 'LAUNCH_READINESS_AUTHORITY',
  PREVIEW_UNLOCKED: 'LIVE_PREVIEW_GATE',
};

export function getResumeStartStage(boundary: AseResumeBoundary): AseStageId {
  const completedStage = BOUNDARY_STAGE[boundary];
  const idx = ASE_STAGE_ORDER.indexOf(completedStage);
  return ASE_STAGE_ORDER[idx + 1] ?? completedStage;
}

export function shouldSkipStageForResume(stageId: AseStageId, resumeFrom: AseResumeBoundary | null): boolean {
  if (!resumeFrom) return false;
  const startStage = getResumeStartStage(resumeFrom);
  const stageIdx = ASE_STAGE_ORDER.indexOf(stageId);
  const startIdx = ASE_STAGE_ORDER.indexOf(startStage);
  return stageIdx < startIdx;
}

export function getResumePointLabel(boundary: AseResumeBoundary): string {
  return `Resume from ${boundary.replace(/_/g, ' ').toLowerCase()}`;
}

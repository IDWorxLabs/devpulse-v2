/**
 * ASE Enforcement — engineering state discovery from ASE pipeline evidence.
 */

import type { AutonomousSoftwareEngineeringPipelineResult } from '../autonomous-software-engineering-engine/ase-types.js';
import type { EngineeringState } from './ase-enforcement-engine-types.js';

export function discoverEngineeringState(
  pipeline: AutonomousSoftwareEngineeringPipelineResult | null,
): EngineeringState {
  if (!pipeline) return 'NOT_STARTED';

  const status = pipeline.overallStatus;
  const stage = pipeline.currentStage;

  if (status === 'HUMAN_REVIEW_REQUIRED') return 'HUMAN_REVIEW_REQUIRED';
  if (status === 'FAILED' || status === 'BLOCKED') return 'FAILED';
  if (status === 'PREVIEW_UNLOCKED' && pipeline.readyForPreview) return 'READY_FOR_LAUNCH';
  if (status === 'LAUNCH_READY') return 'READY_FOR_LAUNCH';
  if (status === 'REPAIRING') return 'REPAIRING';
  if (status === 'EVOLVING_CAPABILITY') return 'EVOLVING_CAPABILITIES';
  if (status === 'IMPROVING') return 'CONTINUOUS_IMPROVEMENT';

  switch (stage) {
    case 'INTENT_UNDERSTANDING':
      return 'UNDERSTANDING_PRODUCT';
    case 'PROMPT_FAITHFULNESS':
    case 'CAPABILITY_PLANNING':
    case 'MISSING_CAPABILITY_EVOLUTION':
      return 'PLANNING';
    case 'INCREMENTAL_BUILD':
      return 'GENERATING';
    case 'BEHAVIOR_SIMULATION':
    case 'VIRTUAL_USER':
    case 'VIRTUAL_DEVICE':
    case 'INTERACTION_PROOF':
    case 'AUTONOMOUS_DEBUGGING':
      return 'VALIDATING';
    case 'CONTINUOUS_IMPROVEMENT':
      return 'CONTINUOUS_IMPROVEMENT';
    case 'LAUNCH_READINESS_AUTHORITY':
    case 'LIVE_PREVIEW_GATE':
      return pipeline.readyForPreview ? 'READY_FOR_LAUNCH' : 'VALIDATING';
    default:
      return status === 'RUNNING' ? 'VALIDATING' : 'UNKNOWN';
  }
}

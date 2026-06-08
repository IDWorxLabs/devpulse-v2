/**
 * Founder journey engine — maps founder journey stages. Descriptive only.
 */

import type { ExperienceJourneyStage } from './types.js';
import { KNOWN_JOURNEY_STAGES } from './types.js';

export function journeyKey(stages: ExperienceJourneyStage[]): string {
  return stages.join('|');
}

export function generateJourneyStages(): ExperienceJourneyStage[] {
  return [...KNOWN_JOURNEY_STAGES];
}

export function getJourneyStageDescription(stage: ExperienceJourneyStage): string {
  const descriptions: Record<ExperienceJourneyStage, string> = {
    IDEA_CAPTURE: 'Founder captures a project idea and enters DevPulse',
    PROJECT_PLANNING: 'DevPulse exposes planning and workspace systems for the project',
    WORLD2_SIMULATION: 'World 2 simulation runtime prepares governed build context',
    BUILD_PREPARATION: 'Autonomous builder and execution planner prepare build packages',
    VERIFICATION: 'Verification loops and evidence ledger gate any apply',
    TRUST_REVIEW: 'Trust engine surfaces confidence and evidence for founder review',
    MOBILE_MONITORING: 'Mobile stack enables remote monitoring and approval',
    SELF_EVOLUTION_ANALYSIS: 'Self-evolution stack surfaces gaps, drift, complexity, and predictions',
    PROJECT_COMPLETION: 'Completion verifier and founder approval path finalize the project',
  };
  return descriptions[stage];
}

export function getFounderActionsForStage(stage: ExperienceJourneyStage): string[] {
  const actions: Record<ExperienceJourneyStage, string[]> = {
    IDEA_CAPTURE: ['Enter project idea', 'Confirm World 2 target'],
    PROJECT_PLANNING: ['Review project workspace', 'Confirm planning scope'],
    WORLD2_SIMULATION: ['Review simulation output', 'Approve simulation continuation'],
    BUILD_PREPARATION: ['Review build preparation status', 'Confirm no World 1 modification'],
    VERIFICATION: ['Review verification evidence', 'Approve or defer gated apply'],
    TRUST_REVIEW: ['Review trust signals', 'Confirm evidence sufficiency'],
    MOBILE_MONITORING: ['Review mobile session status', 'Approve mobile decisions if required'],
    SELF_EVOLUTION_ANALYSIS: ['Review capability gaps and predictions', 'Decide on acquisition plans'],
    PROJECT_COMPLETION: ['Review completion verification', 'Founder sign-off for completion'],
  };
  return actions[stage];
}

export function getSystemActionsForStage(stage: ExperienceJourneyStage): string[] {
  const actions: Record<ExperienceJourneyStage, string[]> = {
    IDEA_CAPTURE: ['Open World 2 workspace', 'Register project context'],
    PROJECT_PLANNING: ['Expose execution planner', 'Surface governance gates'],
    WORLD2_SIMULATION: ['Run simulation runtime exposure', 'Record simulation context'],
    BUILD_PREPARATION: ['Expose builder readiness', 'Link controlled execution bridge'],
    VERIFICATION: ['Surface verification loop status', 'Expose evidence ledger entries'],
    TRUST_REVIEW: ['Expose trust engine summary', 'Link evidence registry'],
    MOBILE_MONITORING: ['Expose mobile command session', 'Surface approval flow readiness'],
    SELF_EVOLUTION_ANALYSIS: ['Expose gap detector output', 'Surface complexity and prediction maps'],
    PROJECT_COMPLETION: ['Expose completion verifier', 'Surface founder approval gate'],
  };
  return actions[stage];
}

export function getCurrentStageIndex(stage: ExperienceJourneyStage): number {
  return KNOWN_JOURNEY_STAGES.indexOf(stage);
}

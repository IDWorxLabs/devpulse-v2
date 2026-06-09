/**
 * Project next-step analyzer — roadmap recommendation. Deterministic only.
 */

import { getCurrentProjectProfile } from './project-profile-store.js';
import type { ProjectNextStepRecommendation } from './project-understanding-types.js';

export function recommendProjectNextStep(): ProjectNextStepRecommendation {
  const profile = getCurrentProjectProfile();
  return {
    projectId: profile.projectId,
    nextRecommendedStep: profile.nextRecommendedStep,
    rationale:
      'Based on completed milestones, missing capabilities, and blocked items in the DevPulse V2 project profile.',
  };
}

export function formatProjectNextStepResponse(): string {
  const profile = getCurrentProjectProfile();
  const rec = recommendProjectNextStep();
  return [
    `Project: ${profile.name}`,
    '',
    'Next Recommended Step:',
    rec.nextRecommendedStep,
    '',
    'Rationale:',
    rec.rationale,
    '',
    'Current Phase:',
    profile.currentPhase,
    '',
    'Intelligence only — no execution or code generation.',
  ].join('\n');
}

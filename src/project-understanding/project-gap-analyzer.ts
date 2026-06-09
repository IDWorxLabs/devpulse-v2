/**
 * Project gap analyzer — what is missing. Deterministic only.
 */

import { getCurrentProjectProfile } from './project-profile-store.js';
import type { ProjectGapAnalysis } from './project-understanding-types.js';

export function analyzeProjectGaps(): ProjectGapAnalysis {
  const profile = getCurrentProjectProfile();
  return {
    projectId: profile.projectId,
    missingCapabilities: [...profile.missingCapabilities],
    gapCount: profile.missingCapabilities.length,
    explanation:
      'These capabilities are not yet connected or validated in the DevPulse V2 foundation stack.',
  };
}

export function formatProjectGapsResponse(): string {
  const profile = getCurrentProjectProfile();
  const gaps = analyzeProjectGaps();
  const lines = gaps.missingCapabilities.map((item) => `• ${item}`);
  return [
    `Project: ${profile.name}`,
    '',
    'Missing Capabilities:',
    ...lines,
    '',
    `Gap Count: ${gaps.gapCount}`,
    '',
    'Explanation:',
    gaps.explanation,
    '',
    'Intelligence only — no execution or project modification occurred.',
  ].join('\n');
}

export function formatCompletedMilestonesResponse(): string {
  const profile = getCurrentProjectProfile();
  const lines = profile.completedMilestones.map((m) => `• ${m}`);
  return [
    `Project: ${profile.name}`,
    '',
    'Completed Milestones:',
    ...lines,
    '',
    `Completed Count: ${profile.completedMilestones.length}`,
    '',
    'These foundation phases are registered as complete in the project profile.',
  ].join('\n');
}

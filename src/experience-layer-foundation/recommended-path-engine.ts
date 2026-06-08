/**
 * Recommended path engine — founder-readable recommended path. No execution.
 */

import type { ExperienceJourneyStage, ExperienceSurface, RecommendedPathStep } from './types.js';
import { getSurfaceForStage } from './experience-surface-engine.js';
import { getFounderActionsForStage, getJourneyStageDescription } from './founder-journey-engine.js';
import { systemsForStage } from './system-sequence-engine.js';

export function recommendedPathKey(steps: RecommendedPathStep[]): string {
  return steps.map((s) => `${s.order}:${s.stage}:${s.surface}`).join('|');
}

export function generateRecommendedPath(stages: ExperienceJourneyStage[]): RecommendedPathStep[] {
  const steps: RecommendedPathStep[] = [];

  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i]!;
    const surface = getSurfaceForStage(stage) ?? 'PROJECT_WORKSPACE';
    const founderActions = getFounderActionsForStage(stage);
    const systems = systemsForStage(stage);

    steps.push({
      stepId: `step-${(i + 1).toString().padStart(2, '0')}`,
      stage,
      surface,
      founderAction: founderActions[0] ?? 'Review stage guidance',
      systemExposure: systems.join(', ') || 'governed systems',
      order: i + 1,
    });
  }

  if (steps.length > 0 && steps[0]!.order !== 1) {
    steps.unshift({
      stepId: 'step-00',
      stage: 'IDEA_CAPTURE',
      surface: 'FOUNDER_HOME',
      founderAction: 'Orient at Founder Home — understand what DevPulse can do',
      systemExposure: 'central_brain, shell_authority',
      order: 0,
    });
  } else if (steps.length > 0 && steps[0]!.surface !== 'FOUNDER_HOME') {
    steps.unshift({
      stepId: 'step-00',
      stage: 'IDEA_CAPTURE',
      surface: 'FOUNDER_HOME',
      founderAction: 'Start at Founder Home before project entry',
      systemExposure: 'central_brain',
      order: 0,
    });
  }

  return steps.sort((a, b) => a.order - b.order);
}

export function getPrimaryRecommendation(steps: RecommendedPathStep[]): string {
  const first = steps.find((s) => s.order > 0) ?? steps[0];
  if (!first) return 'Begin at Founder Home — experience mapping only';
  return `${first.founderAction} (${getJourneyStageDescription(first.stage)})`;
}

export function pathIncludesSurface(steps: RecommendedPathStep[], surface: ExperienceSurface): boolean {
  return steps.some((s) => s.surface === surface);
}

export function pathIncludesAllStacks(steps: RecommendedPathStep[]): boolean {
  const surfaces = new Set(steps.map((s) => s.surface));
  return (
    surfaces.has('WORLD2_WORKSPACE') &&
    surfaces.has('VERIFICATION_WORKSPACE') &&
    surfaces.has('TRUST_WORKSPACE') &&
    surfaces.has('MOBILE_WORKSPACE') &&
    surfaces.has('SELF_EVOLUTION_WORKSPACE')
  );
}

/**
 * Brain roadmap awareness — understands DevPulse phase progression. No execution planning.
 */

import type { BrainRoadmapContext } from './brain-types.js';

export function roadmapContextKey(ctx: BrainRoadmapContext): string {
  return [ctx.currentPhase, ctx.nextPhase, ctx.recommendedNextStep.slice(0, 32)].join('|');
}

export function getBrainRoadmapContext(): BrainRoadmapContext {
  return {
    currentPhase: '11.1 — Unified Command Center Brain Foundation',
    completedPhases: [
      'Phase 6 — Governance Stack',
      'Phase 7 — World 2 Foundation Stack',
      'Phase 8 — Mobile Command Foundation Stack',
      'Phase 9 — Self-Evolution Foundation Stack',
      'Phase 10.1 — Experience Layer Foundation',
      'Phase 10.2 — Trust Engine Expansion Foundation',
      'Phase 10.3 — Founder Reality Surface Foundation',
      'Phase 10.3.1 — Command Center Runtime Shell Foundation',
      'Phase 11.1 — Unified Command Center Brain Foundation',
    ],
    nextPhase: '11.2 — Cross-System Awareness',
    nextPhaseDescription:
      'Deepen Command Center Brain awareness across registered systems without duplicating their intelligence or execution paths.',
    recommendedNextStep:
      'After Unified Command Center Brain stabilizes, implement Phase 11.2 Cross-System Awareness to connect brain responses to live system context — still intelligence only, no execution.',
    stackMaturitySummary:
      'Foundation architecture is extensive and validated. Runnable product experience is beginning. Command Center Brain provides local intelligence. Execution runtime, cloud runtime, autonomous building, and real mobile control are not yet connected.',
  };
}

export function getNextBuildRecommendation(): string {
  return getBrainRoadmapContext().recommendedNextStep;
}

export function isPhaseComplete(phaseLabel: string): boolean {
  return getBrainRoadmapContext().completedPhases.some((p) =>
    p.toLowerCase().includes(phaseLabel.toLowerCase()),
  );
}

export function formatCompletedPhasesList(): string {
  return getBrainRoadmapContext().completedPhases.map((p) => `• ${p}`).join('\n');
}

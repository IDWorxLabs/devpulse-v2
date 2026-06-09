/**
 * Brain roadmap awareness — understands DevPulse phase progression. No execution planning.
 */

import type { BrainRoadmapContext } from './brain-types.js';

export function roadmapContextKey(ctx: BrainRoadmapContext): string {
  return [ctx.currentPhase, ctx.nextPhase, ctx.recommendedNextStep.slice(0, 32)].join('|');
}

export function getBrainRoadmapContext(): BrainRoadmapContext {
  return {
    currentPhase: '11.6 — Unified Decision Layer Foundation',
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
      'Phase 11.1A — Brain Runtime Verification',
      'Phase 11.1B — Command Center UX Stabilization',
      'Phase 11.2 — Cross-System Awareness Foundation',
      'Phase 11.3 — Shared Memory Layer',
      'Phase 11.4 — Project Understanding Engine',
      'Phase 11.4B — Project Knowledge Reasoning',
      'Phase 11.4C — General Question Understanding Router',
      'Phase 11.5 — Timeline Intelligence Foundation',
    ],
    nextPhase: '11.7 — Development Reasoning Foundation (planned)',
    nextPhaseDescription:
      'Structured development reasoning for code and implementation questions — intelligence only, no execution.',
    recommendedNextStep:
      'Unified Decision Layer Foundation is active. Next step: Development Reasoning Foundation — still intelligence only.',
    stackMaturitySummary:
      'Foundation architecture is extensive and validated. Command Center Brain understands system relationships. Execution runtime, cloud runtime, autonomous building, and real mobile control are not yet connected.',
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

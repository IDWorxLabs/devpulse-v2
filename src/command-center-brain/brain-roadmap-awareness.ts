/**
 * Brain roadmap awareness — understands DevPulse phase progression. No execution planning.
 */

import type { BrainRoadmapContext } from './brain-types.js';

export function roadmapContextKey(ctx: BrainRoadmapContext): string {
  return [ctx.currentPhase, ctx.nextPhase, ctx.recommendedNextStep.slice(0, 32)].join('|');
}

export function getBrainRoadmapContext(): BrainRoadmapContext {
  return {
    currentPhase: '11.5 — Timeline Intelligence Foundation',
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
    ],
    nextPhase: '11.6 — Unified Decision Layer (planned)',
    nextPhaseDescription:
      'Optional unified decision layer for DevPulse — still intelligence only, no execution.',
    recommendedNextStep:
      'Timeline Intelligence Foundation is active. Next optional step: Unified Decision Layer — still intelligence only.',
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

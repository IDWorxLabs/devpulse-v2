/**
 * Autonomous Founder Launch Authority V1 — user-visible surface labels only.
 * The authority itself remains invisible; users see phase labels only.
 */

import { FOUNDER_LAUNCH_USER_LABELS } from './autonomous-founder-launch-authority-registry.js';
import type { FounderLaunchUserPhase } from './autonomous-founder-launch-authority-types.js';

export function resolveFounderLaunchUserLabel(phase: FounderLaunchUserPhase): string {
  return FOUNDER_LAUNCH_USER_LABELS[phase];
}

export function resolveFounderLaunchPhaseDuringPipeline(step: 'build' | 'test' | 'fix' | 'review'): FounderLaunchUserPhase {
  switch (step) {
    case 'build':
      return 'BUILDING';
    case 'test':
      return 'TESTING';
    case 'fix':
      return 'FIXING_ISSUES';
    case 'review':
    default:
      return 'FINAL_LAUNCH_REVIEW';
  }
}

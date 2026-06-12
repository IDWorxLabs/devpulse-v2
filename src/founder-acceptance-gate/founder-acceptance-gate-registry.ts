/**
 * Founder Acceptance Gate — constants, thresholds, and required authority registry.
 */

import type { FounderAcceptanceRequiredAuthorityId, FounderAcceptanceState } from './founder-acceptance-gate-types.js';

export const FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN = 'FOUNDER_ACCEPTANCE_GATE_PASS';
export const FOUNDER_ACCEPTANCE_GATE_OWNER_MODULE = 'devpulse_founder_acceptance_gate';
export const FOUNDER_ACCEPTANCE_GATE_PHASE = 'Phase 24G — Founder Acceptance Gate';
export const FOUNDER_ACCEPTANCE_GATE_REPORT_TITLE = 'FOUNDER_ACCEPTANCE_GATE_REPORT';
export const FOUNDER_ACCEPTANCE_CACHE_KEY_PREFIX = 'founder-acceptance-gate-v1';
export const MAX_FOUNDER_ACCEPTANCE_HISTORY = 16;
export const MAX_ACCEPTANCE_REASONS = 16;
export const MAX_REQUIRED_NEXT_ACTIONS = 12;

export const FOUNDER_ACCEPTANCE_CORE_QUESTION =
  'Would a reasonable founder accept this project in its current state?';

export const ACCEPTED_MIN_FOUNDER_TEST_SCORE = 85;
export const ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE = 75;
export const REQUIREMENT_REALITY_ACCEPTANCE_MIN_SCORE = 60;

export const CONFIDENCE_WEIGHT_AUTHORITY_COVERAGE = 25;
export const CONFIDENCE_WEIGHT_PROOF_QUALITY = 25;
export const CONFIDENCE_WEIGHT_SIMULATION_QUALITY = 20;
export const CONFIDENCE_WEIGHT_REQUIREMENT_COMPLETENESS = 15;
export const CONFIDENCE_WEIGHT_FOUNDER_READINESS = 15;

export const FOUNDER_ACCEPTANCE_STATES: readonly FounderAcceptanceState[] = [
  'ACCEPTED',
  'ACCEPTED_WITH_WARNINGS',
  'NOT_ACCEPTED',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export const REQUIRED_ACCEPTANCE_AUTHORITY_IDS: readonly FounderAcceptanceRequiredAuthorityId[] = [
  'FOUNDER_REALITY',
  'UI_REALITY',
  'REQUIREMENT_REALITY',
  'FOUNDER_SIMULATION',
  'EXECUTION_PROOF_EVOLUTION',
  'LAUNCH_COUNCIL',
] as const;

export const REQUIRED_ACCEPTANCE_AUTHORITY_LABELS: Record<FounderAcceptanceRequiredAuthorityId, string> = {
  FOUNDER_REALITY: 'Founder Reality',
  UI_REALITY: 'UI Reality',
  REQUIREMENT_REALITY: 'Requirement Reality',
  FOUNDER_SIMULATION: 'Founder Simulation',
  EXECUTION_PROOF_EVOLUTION: 'Execution Proof Evolution',
  LAUNCH_COUNCIL: 'Launch Council',
};

export function isFounderAcceptanceState(value: string): value is FounderAcceptanceState {
  return (FOUNDER_ACCEPTANCE_STATES as readonly string[]).includes(value);
}

export function clampConfidence(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

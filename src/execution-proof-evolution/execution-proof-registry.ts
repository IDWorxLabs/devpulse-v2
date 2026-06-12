/**
 * Execution Proof Evolution — constants, verdict registry, and scoring bounds.
 */

import type { ExecutionProofEvidenceSource, ExecutionProofVerdict } from './execution-proof-types.js';

export const EXECUTION_PROOF_EVOLUTION_PASS_TOKEN = 'EXECUTION_PROOF_EVOLUTION_PASS';
export const EXECUTION_PROOF_EVOLUTION_OWNER_MODULE = 'devpulse_execution_proof_evolution';
export const EXECUTION_PROOF_EVOLUTION_PHASE = 'Phase 24E — Execution Proof Evolution';
export const EXECUTION_PROOF_EVOLUTION_REPORT_TITLE = 'EXECUTION_PROOF_EVOLUTION_REPORT';
export const EXECUTION_PROOF_CACHE_KEY_PREFIX = 'execution-proof-evolution-v1';
export const MAX_EXECUTION_PROOF_HISTORY = 24;
export const MAX_EXECUTION_PROOF_MEMORY = 16;
export const MAX_EXECUTION_PROOF_RECOMMENDATIONS = 12;
export const LOOP_RISK_UNPROVEN_THRESHOLD = 3;

/** Scoring weights — total 100 when all criteria met. */
export const SCORE_ORIGINAL_FAILURE_RETESTED = 30;
export const SCORE_BEFORE_AFTER_EVIDENCE = 20;
export const SCORE_INDEPENDENT_CONFIRMATION = 20;
export const SCORE_NO_REGRESSION = 15;
export const SCORE_CAUSAL_LINK = 10;
export const SCORE_REUSABLE_MEMORY = 5;

/** Verdict thresholds (score-based, before override rules). */
export const VERDICT_PROVEN_FIXED_MIN = 85;
export const VERDICT_PARTIALLY_PROVEN_MIN = 65;
export const VERDICT_NOT_PROVEN_MIN = 40;

export const EXECUTION_PROOF_VERDICTS: readonly ExecutionProofVerdict[] = [
  'PROVEN_FIXED',
  'PARTIALLY_PROVEN',
  'NOT_PROVEN',
  'REGRESSION_DETECTED',
  'INSUFFICIENT_EVIDENCE',
  'LOOP_RISK',
] as const;

export const EXECUTION_PROOF_EVIDENCE_SOURCES: readonly ExecutionProofEvidenceSource[] = [
  'VALIDATOR_RESULT',
  'FOUNDER_SIMULATION_RESULT',
  'LIVE_PREVIEW_RESULT',
  'UI_REALITY_RESULT',
  'MOBILE_RUNTIME_RESULT',
  'LAUNCH_COUNCIL_RESULT',
  'RUNTIME_OBSERVATION',
  'BEFORE_AFTER_METRIC',
  'MANUAL_FOUNDER_NOTE',
  'MISSING_EVIDENCE',
] as const;

export function isExecutionProofVerdict(value: string): value is ExecutionProofVerdict {
  return (EXECUTION_PROOF_VERDICTS as readonly string[]).includes(value);
}

export function isExecutionProofEvidenceSource(value: string): value is ExecutionProofEvidenceSource {
  return (EXECUTION_PROOF_EVIDENCE_SOURCES as readonly string[]).includes(value);
}

export function emptyVerdictDistribution(): Record<ExecutionProofVerdict, number> {
  return {
    PROVEN_FIXED: 0,
    PARTIALLY_PROVEN: 0,
    NOT_PROVEN: 0,
    REGRESSION_DETECTED: 0,
    INSUFFICIENT_EVIDENCE: 0,
    LOOP_RISK: 0,
  };
}

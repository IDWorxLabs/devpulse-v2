/**
 * VERE Adoption Phase 1 — shared types.
 *
 * This module has no knowledge of any application, product, or generated-app domain. It only
 * knows about *validator scripts that already exist in this repository* and the generic
 * dependency surface (files, directories, dependency signatures, environment presence) each one
 * declares for itself. Nothing here decides what a validator checks — only whether a previous,
 * complete, PASSED run of it may stand in for running it again.
 */

/**
 * A generic classification of *how* a validator behaves, used only to reason about reuse safety
 * — never to encode any product/domain concept.
 *
 * - DETERMINISTIC_LOGIC: pure/near-pure logic over declared source files, no live external state.
 * - HTTP_SURFACE_CHECK: spins up an in-process server from repo source and inspects its output;
 *   still a deterministic function of the repo's own files, not of any external live system.
 * - REGRESSION_AGGREGATOR: itself spawns other validator scripts as a chain; its own dependency
 *   surface is effectively "the rest of the validation suite", which makes reuse unsafe until
 *   that surface is explicitly and narrowly enumerated.
 */
export type AdoptedValidatorKind = 'DETERMINISTIC_LOGIC' | 'HTTP_SURFACE_CHECK' | 'REGRESSION_AGGREGATOR';

/**
 * A single validator's adoption declaration. Every reuse-safe entry must carry a written
 * justification explaining *why* its dependency surface is believed to be complete — this is
 * enforced by the validator suite, not just documented.
 */
export interface AdoptedValidatorPolicy {
  /** Stable identity — the validator script's repo-relative path. */
  validatorName: string;
  /** Bump whenever this policy's understanding of the validator's contract changes. */
  validatorVersion: string;
  validatorKind: AdoptedValidatorKind;
  /** The script path VERE actually spawns via tsx. Normally identical to validatorName. */
  scriptPath: string;
  /** The exact literal token the wrapped validator prints on success. Never invented or guessed. */
  passToken: string;
  relevantFiles?: string[];
  relevantDirectories?: string[];
  dependencyInputs?: string[];
  environmentInputs?: string[];
  ttlMs?: number;
  /** Must be true and justified before VERE will ever consider reusing this validator's evidence. */
  reuseSafe: boolean;
  /** Required, non-empty when reuseSafe is true — the human-auditable reason this is safe. */
  reuseSafeJustification: string;
  /** Required when reuseSafe is false — why this validator must always run fresh for now. */
  mustRunFreshReason?: string;
}

export interface AdoptedValidatorRunResult {
  validatorName: string;
  validatorKind: AdoptedValidatorKind;
  ok: boolean;
  reused: boolean;
  invalidationReasons: string[];
  timeSavedMs: number;
  detail: string;
}

export interface AdoptedValidatorExplanation {
  validatorName: string;
  wouldReuse: boolean;
  reasons: string[];
}

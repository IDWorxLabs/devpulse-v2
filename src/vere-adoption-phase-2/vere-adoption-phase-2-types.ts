/**
 * VERE Adoption Phase 2 — shared types.
 *
 * Phase 2 extends Phase 1's adoption model with an explicit risk-classification layer. Like
 * Phase 1, this module has no knowledge of any application, product, or generated-app domain — it
 * only knows about *validator scripts that already exist in this repository*, their generic
 * declared dependency surface, and (for aggregators only) an explicit, non-recursive list of the
 * other validator scripts they themselves spawn.
 */

/**
 * A generic classification of *how* a validator behaves, used only to reason about reuse safety —
 * never to encode any product/domain concept.
 *
 * - DETERMINISTIC_LOGIC_LEAF: pure/near-pure logic over declared source files, no server, no
 *   external live state, does not spawn other validators.
 * - LOCAL_HTTP_SURFACE_LEAF: spins up an in-process server from repo source and inspects its
 *   output; still a deterministic function of the repo's own files, not of any external live
 *   system, and does not spawn other validators.
 * - FILESYSTEM_REGRESSION_LEAF: performs read-only static analysis/regression checks over a
 *   declared, enumerable set of repository files or directories (e.g. scanning every validator
 *   script's source text); broad but bounded and does not spawn other validators.
 * - CHILD_GRAPH_AGGREGATOR_UNSAFE: itself spawns other validator scripts as a chain. Unsafe to
 *   reuse by default; may only become reuse-safe if it declares a complete, non-circular,
 *   non-empty, narrowly-scoped list of every child validator it spawns (see `childGraph`).
 * - EXTERNAL_OR_UNBOUNDED_UNSAFE: depends on external/live/network state, screenshots, or other
 *   state outside this repository's own declared source (or on repo state that is itself mutable
 *   runtime output rather than stable source). Never eligible for reuse, regardless of any
 *   declared dependency surface.
 */
export type Phase2ValidatorRiskClass =
  | 'DETERMINISTIC_LOGIC_LEAF'
  | 'LOCAL_HTTP_SURFACE_LEAF'
  | 'FILESYSTEM_REGRESSION_LEAF'
  | 'CHILD_GRAPH_AGGREGATOR_UNSAFE'
  | 'EXTERNAL_OR_UNBOUNDED_UNSAFE';

/**
 * One child validator declared as part of an aggregator's child graph. This is intentionally
 * shallow — a child declaration cannot itself carry a nested `childGraph` — so aggregation can
 * never recurse into an unbounded or endless validation chain.
 */
export interface Phase2AggregatorChildDeclaration {
  /** The child validator script's repo-relative path, exactly as spawned by the parent. */
  validatorName: string;
  /** The exact literal token the child validator prints on success. Never invented or guessed. */
  passToken: string;
  relevantFiles?: string[];
  relevantDirectories?: string[];
}

/**
 * A single validator's Phase 2 adoption declaration. Every reuse-safe entry must carry a written
 * justification explaining *why* its dependency surface is believed to be complete — this is
 * enforced by `definePhase2AdoptedValidatorPolicy`, not just documented.
 */
export interface Phase2AdoptedValidatorPolicy {
  /** Stable identity — the validator script's repo-relative path. */
  validatorName: string;
  /** Bump whenever this policy's understanding of the validator's contract changes. */
  validatorVersion: string;
  riskClass: Phase2ValidatorRiskClass;
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
  /**
   * Only meaningful (and only permitted) when riskClass is CHILD_GRAPH_AGGREGATOR_UNSAFE. When
   * reuseSafe is true, this must be a complete, non-empty, non-circular, narrowly-scoped
   * declaration of every validator script this one spawns.
   */
  childGraph?: Phase2AggregatorChildDeclaration[];
}

export type Phase2ValidatorOutcomeKind = 'EXECUTED' | 'REUSED' | 'INVALIDATED' | 'SKIPPED_UNSAFE';

export interface Phase2AdoptedValidatorRunResult {
  validatorName: string;
  riskClass: Phase2ValidatorRiskClass;
  ok: boolean;
  outcomeKind: Phase2ValidatorOutcomeKind;
  reused: boolean;
  invalidationReasons: string[];
  timeSavedMs: number;
  detail: string;
}

export interface Phase2AdoptedValidatorExplanation {
  validatorName: string;
  riskClass: Phase2ValidatorRiskClass;
  wouldReuse: boolean;
  reasons: string[];
}

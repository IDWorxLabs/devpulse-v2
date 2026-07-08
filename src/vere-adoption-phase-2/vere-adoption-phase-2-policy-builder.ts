/**
 * VERE Adoption Phase 2 — policy declaration helpers.
 *
 * These helpers exist purely to avoid repeating the same dependency-surface boilerplate across
 * every registry entry, and to enforce Phase 2's stricter rules around risk classification and
 * aggregator child graphs. None of them encode anything about a specific validator's *behavior* —
 * only shared defaults every adopted validator can opt into, plus refusal rules that keep
 * `reuseSafe: true` defensible.
 */

import type {
  Phase2AdoptedValidatorPolicy,
  Phase2AggregatorChildDeclaration,
  Phase2ValidatorRiskClass,
} from './vere-adoption-phase-2-types.js';

export const DEFAULT_PHASE_2_ADOPTION_TTL_MS = 20 * 60 * 1000;

/**
 * Directory markers that are always refused as a *child* declaration's dependency surface because
 * they are effectively "the whole repository" or "the whole scripts suite" rather than a narrow,
 * bounded surface. A top-level FILESYSTEM_REGRESSION_LEAF validator may legitimately declare
 * `scripts` as its own top-level surface, but an aggregator's *child* may never point to something
 * this broad — that is exactly the "broad/unbounded" case the aggregator refusal rule exists for.
 */
const BROAD_CHILD_DIRECTORY_DENYLIST = new Set(['.', '', '/', 'src', 'scripts', 'server', 'public']);

export type Phase2AdoptedValidatorPolicyInput = Partial<Phase2AdoptedValidatorPolicy> &
  Pick<Phase2AdoptedValidatorPolicy, 'validatorName' | 'validatorVersion' | 'riskClass' | 'passToken' | 'reuseSafe' | 'reuseSafeJustification'>;

function hasExplicitDependencySurface(policy: Pick<Phase2AdoptedValidatorPolicy, 'relevantFiles' | 'relevantDirectories'>): boolean {
  return (policy.relevantFiles?.length ?? 0) > 0 || (policy.relevantDirectories?.length ?? 0) > 0;
}

/**
 * Validates that an aggregator's declared child graph is complete, bounded, and non-circular.
 * Throws (refusing construction) rather than silently downgrading to `reuseSafe: false`, so a
 * misconfigured registry entry fails loudly at import time instead of quietly becoming unsafe.
 */
function assertCompleteChildGraph(validatorName: string, childGraph: Phase2AggregatorChildDeclaration[] | undefined): void {
  if (!childGraph || childGraph.length === 0) {
    throw new Error(
      `Phase 2 adoption policy for "${validatorName}" declares reuseSafe: true with riskClass CHILD_GRAPH_AGGREGATOR_UNSAFE but has no childGraph — an aggregator's child dependency graph must be explicitly and completely declared before it can be reuse-safe.`,
    );
  }

  const seen = new Set<string>();
  for (const child of childGraph) {
    if (!child.validatorName || !child.passToken) {
      throw new Error(
        `Phase 2 adoption policy for "${validatorName}" has an incomplete child declaration — every child must declare a validatorName and a passToken.`,
      );
    }
    if (child.validatorName === validatorName) {
      throw new Error(`Phase 2 adoption policy for "${validatorName}" declares itself as its own child — circular child graphs are refused.`);
    }
    if (seen.has(child.validatorName)) {
      throw new Error(`Phase 2 adoption policy for "${validatorName}" declares duplicate child "${child.validatorName}" — child graph must be a well-formed set.`);
    }
    seen.add(child.validatorName);

    if (!hasExplicitDependencySurface(child)) {
      throw new Error(
        `Phase 2 adoption policy for "${validatorName}" child "${child.validatorName}" has no declared dependency surface — child graph is not complete/bounded.`,
      );
    }
    const declaredDirs = child.relevantDirectories ?? [];
    const broadDir = declaredDirs.find((dir) => BROAD_CHILD_DIRECTORY_DENYLIST.has(dir.trim()));
    if (broadDir !== undefined) {
      throw new Error(
        `Phase 2 adoption policy for "${validatorName}" child "${child.validatorName}" declares an overly broad directory ("${broadDir}") — a child's dependency surface must be narrow, not the whole repository/suite.`,
      );
    }
  }
}

/**
 * Fills in safe, generic defaults and enforces Phase 2's policy rules:
 *  - a reuse-safe policy must carry a non-empty justification and an explicit dependency surface;
 *  - a non-reuse-safe policy must carry a `mustRunFreshReason`;
 *  - EXTERNAL_OR_UNBOUNDED_UNSAFE validators can never be marked `reuseSafe: true`;
 *  - CHILD_GRAPH_AGGREGATOR_UNSAFE validators default to `reuseSafe: false` and may only become
 *    `reuseSafe: true` when they declare a complete, non-circular, narrowly-scoped `childGraph`;
 *  - only CHILD_GRAPH_AGGREGATOR_UNSAFE validators may declare a `childGraph` at all.
 */
export function definePhase2AdoptedValidatorPolicy(input: Phase2AdoptedValidatorPolicyInput): Phase2AdoptedValidatorPolicy {
  const policy: Phase2AdoptedValidatorPolicy = {
    validatorName: input.validatorName,
    validatorVersion: input.validatorVersion,
    riskClass: input.riskClass,
    scriptPath: input.scriptPath ?? input.validatorName,
    passToken: input.passToken,
    relevantFiles: input.relevantFiles ?? [],
    relevantDirectories: input.relevantDirectories ?? [],
    dependencyInputs: input.dependencyInputs ?? ['package.json', 'package-lock.json'],
    environmentInputs: input.environmentInputs ?? [],
    ttlMs: input.ttlMs ?? DEFAULT_PHASE_2_ADOPTION_TTL_MS,
    reuseSafe: input.reuseSafe,
    reuseSafeJustification: input.reuseSafeJustification,
    mustRunFreshReason: input.mustRunFreshReason,
    childGraph: input.childGraph,
  };

  if (policy.riskClass !== 'CHILD_GRAPH_AGGREGATOR_UNSAFE' && policy.childGraph && policy.childGraph.length > 0) {
    throw new Error(`Phase 2 adoption policy for "${policy.validatorName}" declares a childGraph but its riskClass is not CHILD_GRAPH_AGGREGATOR_UNSAFE.`);
  }

  if (policy.riskClass === 'EXTERNAL_OR_UNBOUNDED_UNSAFE' && policy.reuseSafe) {
    throw new Error(
      `Phase 2 adoption policy for "${policy.validatorName}" declares reuseSafe: true with riskClass EXTERNAL_OR_UNBOUNDED_UNSAFE — validators depending on external/live/unbounded state can never be marked reuse-safe.`,
    );
  }

  if (policy.reuseSafe && policy.reuseSafeJustification.trim().length === 0) {
    throw new Error(`Phase 2 adoption policy for "${policy.validatorName}" declares reuseSafe: true without a reuseSafeJustification.`);
  }
  if (policy.reuseSafe && policy.riskClass !== 'CHILD_GRAPH_AGGREGATOR_UNSAFE' && !hasExplicitDependencySurface(policy)) {
    throw new Error(
      `Phase 2 adoption policy for "${policy.validatorName}" declares reuseSafe: true but has no explicit relevant files/directories — its dependency surface is not defensible.`,
    );
  }
  if (!policy.reuseSafe && !policy.mustRunFreshReason) {
    throw new Error(`Phase 2 adoption policy for "${policy.validatorName}" declares reuseSafe: false but is missing mustRunFreshReason.`);
  }

  if (policy.riskClass === 'CHILD_GRAPH_AGGREGATOR_UNSAFE' && policy.reuseSafe) {
    assertCompleteChildGraph(policy.validatorName, policy.childGraph);
  }

  return policy;
}

export { hasExplicitDependencySurface };

/** A reusable directory group for validators whose behavior depends on the founder-reality HTTP surface. */
export const FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES = ['server', 'public/founder-reality'];

/** Merges one or more shared directory groups with validator-specific extra directories, deduplicated. */
export function combineRelevantDirectories(...groups: string[][]): string[] {
  return Array.from(new Set(groups.flat()));
}

export function riskClassIsAlwaysUnsafe(riskClass: Phase2ValidatorRiskClass): boolean {
  return riskClass === 'EXTERNAL_OR_UNBOUNDED_UNSAFE';
}

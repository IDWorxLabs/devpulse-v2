/**
 * VERE Adoption Phase 1 — policy declaration helpers.
 *
 * These helpers exist purely to avoid repeating the same dependency-surface boilerplate (default
 * TTL, default lockfiles, common directory groups) across every registry entry. None of them
 * encode anything about a specific validator's *behavior* — only shared defaults every adopted
 * validator can opt into.
 */

import type { AdoptedValidatorPolicy } from './vere-adoption-types.js';

export const DEFAULT_ADOPTION_TTL_MS = 20 * 60 * 1000;

export type AdoptedValidatorPolicyInput = Partial<AdoptedValidatorPolicy> &
  Pick<AdoptedValidatorPolicy, 'validatorName' | 'validatorVersion' | 'validatorKind' | 'passToken' | 'reuseSafe' | 'reuseSafeJustification'>;

/**
 * Fills in safe, generic defaults and enforces the policy's own internal rules: a reuse-safe
 * policy must carry a non-empty justification, and a non-reuse-safe policy must carry a reason.
 */
export function defineAdoptedValidatorPolicy(input: AdoptedValidatorPolicyInput): AdoptedValidatorPolicy {
  const policy: AdoptedValidatorPolicy = {
    validatorName: input.validatorName,
    validatorVersion: input.validatorVersion,
    validatorKind: input.validatorKind,
    scriptPath: input.scriptPath ?? input.validatorName,
    passToken: input.passToken,
    relevantFiles: input.relevantFiles ?? [],
    relevantDirectories: input.relevantDirectories ?? [],
    dependencyInputs: input.dependencyInputs ?? ['package.json', 'package-lock.json'],
    environmentInputs: input.environmentInputs ?? [],
    ttlMs: input.ttlMs ?? DEFAULT_ADOPTION_TTL_MS,
    reuseSafe: input.reuseSafe,
    reuseSafeJustification: input.reuseSafeJustification,
    mustRunFreshReason: input.mustRunFreshReason,
  };

  if (policy.reuseSafe && policy.reuseSafeJustification.trim().length === 0) {
    throw new Error(`Adoption policy for "${policy.validatorName}" declares reuseSafe: true without a reuseSafeJustification.`);
  }
  if (policy.reuseSafe && !hasExplicitDependencySurface(policy)) {
    throw new Error(
      `Adoption policy for "${policy.validatorName}" declares reuseSafe: true but has no explicit relevant files/directories — its dependency surface is not defensible.`,
    );
  }
  if (!policy.reuseSafe && !policy.mustRunFreshReason) {
    throw new Error(`Adoption policy for "${policy.validatorName}" declares reuseSafe: false but is missing mustRunFreshReason.`);
  }

  return policy;
}

export function hasExplicitDependencySurface(policy: Pick<AdoptedValidatorPolicy, 'relevantFiles' | 'relevantDirectories'>): boolean {
  return (policy.relevantFiles?.length ?? 0) > 0 || (policy.relevantDirectories?.length ?? 0) > 0;
}

/** A reusable directory group for validators whose behavior depends on the founder-reality HTTP surface. */
export const FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES = ['server', 'public/founder-reality'];

/** Merges one or more shared directory groups with validator-specific extra directories, deduplicated. */
export function combineRelevantDirectories(...groups: string[][]): string[] {
  return Array.from(new Set(groups.flat()));
}

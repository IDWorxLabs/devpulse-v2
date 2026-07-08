/**
 * VERE Adoption Phase 1 — the central, generic adoption registry.
 *
 * This is the single source of truth for which existing validator scripts have opted into
 * evidence reuse, and exactly what each one declares as its dependency surface. Every entry is a
 * plain data declaration produced by `defineAdoptedValidatorPolicy`, which refuses to construct a
 * `reuseSafe: true` entry that lacks a justification or an explicit, non-empty dependency
 * surface. Nothing here spawns anything or makes a reuse decision — see `vere-adoption-runner.ts`.
 *
 * First safe batch rationale: every reuse-safe entry below is a deterministic validator (either
 * pure logic over its own declared files, or an in-process HTTP surface check served entirely
 * from repo source with no external network/live-system dependency) that is already repeatedly
 * re-invoked as a child process by higher-level regression gates (stabilization/faithfulness
 * milestone validators, governance's own regression list). One deliberately-excluded validator is
 * included as `reuseSafe: false` to demonstrate that VERE Adoption does not convert a validator
 * with an unbounded/aggregate dependency surface into a reused one just because it is slow.
 */

import { defineAdoptedValidatorPolicy, FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES, combineRelevantDirectories } from './vere-adoption-policy-builder.js';
import type { AdoptedValidatorPolicy } from './vere-adoption-types.js';

export const VERE_ADOPTION_PHASE_1_REGISTRY: AdoptedValidatorPolicy[] = [
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-simplified-builder-ui-v1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'HTTP_SURFACE_CHECK',
    passToken: 'SIMPLIFIED_BUILDER_UI_V1_PASS',
    relevantDirectories: FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES,
    reuseSafe: true,
    reuseSafeJustification:
      'Serves and inspects the founder-reality HTTP surface entirely from repo source (server/, public/founder-reality/); no network, no external live state, no timing races.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-stabilization-phase-1-v1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'HTTP_SURFACE_CHECK',
    passToken: 'PRODUCT_STABILIZATION_PHASE_1_V1_PASS',
    relevantDirectories: FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES,
    reuseSafe: true,
    reuseSafeJustification:
      'Deterministic in-process HTTP surface check served from server/ and public/founder-reality/ only; no live external dependency.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-stabilization-phase-2-v1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'DETERMINISTIC_LOGIC',
    passToken: 'PRODUCT_STABILIZATION_PHASE_2_V1_PASS',
    relevantDirectories: ['src/build-result-normalizer-v1'],
    reuseSafe: true,
    reuseSafeJustification: 'Pure logic over build-result-normalizer-v1 inputs/outputs; no server, no filesystem side effects beyond its own source.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-stabilization-phase-3-v1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'DETERMINISTIC_LOGIC',
    passToken: 'PRODUCT_STABILIZATION_PHASE_3_V1_PASS',
    relevantDirectories: ['src/build-result-normalizer-v1'],
    reuseSafe: true,
    reuseSafeJustification: 'Pure logic over build-result-normalizer-v1 inputs/outputs; deterministic and self-contained.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-stabilization-phase-4-v1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'DETERMINISTIC_LOGIC',
    passToken: 'PRODUCT_STABILIZATION_PHASE_4_V1_PASS',
    relevantDirectories: combineRelevantDirectories(['src/build-result-normalizer-v1'], ['src/build-execution-stabilizer-v1']),
    reuseSafe: true,
    reuseSafeJustification: 'Pure logic over build-result-normalizer-v1 and build-execution-stabilizer-v1 types/inputs; no live state.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-stabilization-phase-5-v1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'HTTP_SURFACE_CHECK',
    passToken: 'PRODUCT_STABILIZATION_PHASE_5_V1_PASS',
    relevantDirectories: FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES,
    reuseSafe: true,
    reuseSafeJustification: 'Deterministic in-process HTTP surface check served from server/ and public/founder-reality/ only.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-faithfulness-milestone-1.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'HTTP_SURFACE_CHECK',
    passToken: 'PRODUCT_FAITHFULNESS_MILESTONE_1_PASS',
    relevantDirectories: combineRelevantDirectories(FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES, [
      'src/product-faithfulness-v1',
      'src/build-result-normalizer-v1',
    ]),
    reuseSafe: true,
    reuseSafeJustification:
      'Deterministic HTTP surface check plus pure concept-extraction/normalization logic, all served from an explicitly declared, bounded set of directories.',
  }),
  defineAdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-faithfulness-milestone-2.ts',
    validatorVersion: '1.0.0',
    validatorKind: 'REGRESSION_AGGREGATOR',
    passToken: 'PRODUCT_FAITHFULNESS_MILESTONE_2_PASS',
    reuseSafe: false,
    reuseSafeJustification: '',
    mustRunFreshReason:
      'Aggregates the entire prior validator chain (all 5 stabilization phases, milestone 1, and the simplified builder UI validator) as a regression gate. Its true dependency surface is effectively the whole validation suite, which has not yet been explicitly and narrowly enumerated — adopting it for reuse before that enumeration exists would be an unbounded/undefensible dependency surface, which VERE Adoption explicitly refuses to do.',
  }),
];

export function findAdoptedValidatorPolicy(validatorName: string): AdoptedValidatorPolicy | undefined {
  return VERE_ADOPTION_PHASE_1_REGISTRY.find((policy) => policy.validatorName === validatorName);
}

export function listReuseSafeAdoptedValidators(): AdoptedValidatorPolicy[] {
  return VERE_ADOPTION_PHASE_1_REGISTRY.filter((policy) => policy.reuseSafe);
}

export function listFreshRequiredAdoptedValidators(): AdoptedValidatorPolicy[] {
  return VERE_ADOPTION_PHASE_1_REGISTRY.filter((policy) => !policy.reuseSafe);
}

/**
 * VERE Adoption Phase 2 — the central, generic Phase 2 adoption registry.
 *
 * This is the single source of truth for the *second* batch of existing validator scripts that
 * have opted into evidence reuse, beyond Phase 1's registry (`src/vere-adoption-phase-1`). Every
 * entry is a plain data declaration produced by `definePhase2AdoptedValidatorPolicy`, which
 * refuses to construct a `reuseSafe: true` entry that lacks a justification, an explicit
 * dependency surface, or (for aggregators) a complete, non-circular child graph. Nothing here
 * spawns anything or makes a reuse decision — see `vere-adoption-phase-2-runner.ts`.
 *
 * Second safe batch rationale: the eighteen `reuseSafe: true` entries below fall into three
 * families, each independently verified (by reading their source) to never spawn another
 * validator, never touch the network, and never depend on a live/external system:
 *
 *  1. Fifteen thin per-section wrappers around the Prompt Faithfulness Engine V2 shared validation
 *     suite (`scripts/lib/prompt-faithfulness-v2-validation.ts`). Each one resets the engine's
 *     module-level test state and then runs pure logic over `src/prompt-faithfulness-engine-v2`,
 *     `src/prompt-faithful-generation`, `src/autonomous-founder-launch-authority` (evidence
 *     collector only), and `src/foundation` (ownership registry only) — all repo source, no
 *     server, no filesystem side effects beyond those declared directories.
 *  2. `validate-product-architect-intelligence-v1.ts` and `validate-afla-trust-calibration-v1.ts`,
 *     each a narrow, self-contained deterministic-logic leaf over exactly one or two owned source
 *     directories.
 *  3. `validate-validation-runtime-audit-v1.ts`, a read-only static-analysis leaf that scans every
 *     `validate-*.ts` script's source text plus `package.json` — broad but fully enumerable and
 *     declared as such (`relevantDirectories: ['scripts']`).
 *
 * Two validators are deliberately included as `reuseSafe: false` to demonstrate that Phase 2's
 * aggregator-handling rules are real refusals, not just documentation:
 *
 *  - `validate-validation-runtime-governance-v1.ts` is a CHILD_GRAPH_AGGREGATOR_UNSAFE validator
 *    that spawns four other validators. Three of those four (`validate:validation-runtime-audit-v1`,
 *    `validate:product-architect-intelligence-v1`, `validate:afla-trust-calibration-v1`) are
 *    themselves adopted above with a narrow, verified dependency surface — but the fourth,
 *    `validate:capability-audit-v3`, reads mutable runtime-artifact directories produced by other
 *    tools (UVL/RBEP evidence snapshots) rather than stable declared source, so its true dependency
 *    surface cannot yet be completely and defensibly enumerated. Per this module's own refusal
 *    rule, an aggregator may only become reuse-safe when *every* child's dependency surface is
 *    complete — so this one stays `reuseSafe: false` until that fourth child is itself audited and
 *    adopted.
 *  - `validate-capability-audit-v3.ts` itself is classified `EXTERNAL_OR_UNBOUNDED_UNSAFE` for the
 *    same reason: its outcome can depend on mutable evidence artifacts written by other processes,
 *    not solely on this repository's own declared source, so it is never eligible for reuse.
 */

import {
  combineRelevantDirectories,
  definePhase2AdoptedValidatorPolicy,
} from './vere-adoption-phase-2-policy-builder.js';
import type { Phase2AdoptedValidatorPolicy } from './vere-adoption-phase-2-types.js';

/** Every source directory a Prompt Faithfulness Engine V2 section wrapper can possibly touch. */
const PROMPT_FAITHFULNESS_V2_DIRECTORIES = [
  'src/prompt-faithfulness-engine-v2',
  'src/prompt-faithful-generation',
  'src/autonomous-founder-launch-authority',
  'src/foundation',
];
/** The shared validation logic every thin per-section wrapper delegates to. */
const PROMPT_FAITHFULNESS_V2_SHARED_LIB_FILE = 'scripts/lib/prompt-faithfulness-v2-validation.ts';
const PROMPT_FAITHFULNESS_V2_PASS_TOKEN = 'PROMPT_FAITHFULNESS_ENGINE_V2_PASS';
const PROMPT_FAITHFULNESS_V2_JUSTIFICATION =
  'Thin wrapper around the Prompt Faithfulness Engine V2 shared validation suite; resets module-level test state before running and touches only its own declared engine/generation/launch-evidence/ownership directories plus its shared lib file — no server, no network, no other validator spawned.';

function definePromptFaithfulnessV2SectionPolicy(validatorName: string): Phase2AdoptedValidatorPolicy {
  return definePhase2AdoptedValidatorPolicy({
    validatorName,
    validatorVersion: '1.0.0',
    riskClass: 'DETERMINISTIC_LOGIC_LEAF',
    passToken: PROMPT_FAITHFULNESS_V2_PASS_TOKEN,
    relevantFiles: [PROMPT_FAITHFULNESS_V2_SHARED_LIB_FILE],
    relevantDirectories: PROMPT_FAITHFULNESS_V2_DIRECTORIES,
    reuseSafe: true,
    reuseSafeJustification: PROMPT_FAITHFULNESS_V2_JUSTIFICATION,
  });
}

export const VERE_ADOPTION_PHASE_2_REGISTRY: Phase2AdoptedValidatorPolicy[] = [
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-parser.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-evidence-extraction.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-contract.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-registry.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-knowledge-graph.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-capability-mapping.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-traceability.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-conflict-detection.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-ambiguity-detection.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-assumption-detection.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-completeness.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-drift.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-faithfulness-score.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-faithfulness-authority.ts'),
  definePromptFaithfulnessV2SectionPolicy('scripts/validate-prompt-launch-integration.ts'),

  definePhase2AdoptedValidatorPolicy({
    validatorName: 'scripts/validate-product-architect-intelligence-v1.ts',
    validatorVersion: '1.0.0',
    riskClass: 'DETERMINISTIC_LOGIC_LEAF',
    passToken: 'PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS',
    relevantDirectories: ['src/product-architect-intelligence-v1', 'src/product-architect'],
    reuseSafe: true,
    reuseSafeJustification:
      'Pure logic returning static ownership/consolidation metadata over exactly two owned source directories; no filesystem reads, no server, no other validator spawned.',
  }),

  definePhase2AdoptedValidatorPolicy({
    validatorName: 'scripts/validate-afla-trust-calibration-v1.ts',
    validatorVersion: '1.0.0',
    riskClass: 'DETERMINISTIC_LOGIC_LEAF',
    passToken: 'AFLA_TRUST_CALIBRATION_V1_PASS',
    relevantDirectories: combineRelevantDirectories(['src/afla-trust-calibration-v1'], ['src/autonomous-founder-launch-authority']),
    relevantFiles: ['server/afla-trust-calibration-handler.ts'],
    reuseSafe: true,
    reuseSafeJustification:
      'Documented "leaf mode" validator: deterministic trust-calibration scenarios computed entirely in-process from its own declared source directories and one handler file; resets its own history state before each run.',
  }),

  definePhase2AdoptedValidatorPolicy({
    validatorName: 'scripts/validate-validation-runtime-audit-v1.ts',
    validatorVersion: '1.0.0',
    riskClass: 'FILESYSTEM_REGRESSION_LEAF',
    passToken: 'VALIDATION_RUNTIME_AUDIT_V1_PASS',
    relevantDirectories: ['src/validation-runtime-audit-v1', 'scripts'],
    relevantFiles: ['package.json'],
    reuseSafe: true,
    reuseSafeJustification:
      'Read-only static analysis over its own source plus every validate-*.ts script and package.json; broad but fully enumerable and declared — never spawns any of the scripts it scans.',
  }),

  definePhase2AdoptedValidatorPolicy({
    validatorName: 'scripts/validate-validation-runtime-governance-v1.ts',
    validatorVersion: '1.0.0',
    riskClass: 'CHILD_GRAPH_AGGREGATOR_UNSAFE',
    passToken: 'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS',
    reuseSafe: false,
    reuseSafeJustification: '',
    mustRunFreshReason:
      'Spawns four regression validators (validate:validation-runtime-audit-v1, validate:capability-audit-v3, validate:product-architect-intelligence-v1, validate:afla-trust-calibration-v1). Three are narrowly declared and adopted above, but validate:capability-audit-v3 reads mutable UVL/RBEP evidence-artifact directories produced by other tools rather than stable declared source, so its dependency surface is not yet completely and defensibly enumerable. This aggregator\'s own refusal rule requires every child to have a complete surface before the aggregate can be reuse-safe, so it must always run fresh for now.',
  }),

  definePhase2AdoptedValidatorPolicy({
    validatorName: 'scripts/validate-capability-audit-v3.ts',
    validatorVersion: '1.0.0',
    riskClass: 'EXTERNAL_OR_UNBOUNDED_UNSAFE',
    passToken: 'AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS',
    reuseSafe: false,
    reuseSafeJustification: '',
    mustRunFreshReason:
      'Reads UVL/RBEP evidence-artifact directories that are mutable runtime output written by other tools/processes, not stable declared source of this validator itself — its true outcome can change without any of its own source changing, so it can never be marked reuse-safe under this engine\'s fingerprinting model.',
  }),
];

export function findPhase2AdoptedValidatorPolicy(validatorName: string): Phase2AdoptedValidatorPolicy | undefined {
  return VERE_ADOPTION_PHASE_2_REGISTRY.find((policy) => policy.validatorName === validatorName);
}

export function listPhase2ReuseSafeAdoptedValidators(): Phase2AdoptedValidatorPolicy[] {
  return VERE_ADOPTION_PHASE_2_REGISTRY.filter((policy) => policy.reuseSafe);
}

export function listPhase2FreshRequiredAdoptedValidators(): Phase2AdoptedValidatorPolicy[] {
  return VERE_ADOPTION_PHASE_2_REGISTRY.filter((policy) => !policy.reuseSafe);
}

export function listPhase2AdoptedValidatorsByRiskClass(): Record<string, Phase2AdoptedValidatorPolicy[]> {
  const grouped: Record<string, Phase2AdoptedValidatorPolicy[]> = {};
  for (const policy of VERE_ADOPTION_PHASE_2_REGISTRY) {
    grouped[policy.riskClass] = grouped[policy.riskClass] ?? [];
    grouped[policy.riskClass].push(policy);
  }
  return grouped;
}

/**
 * VERE Adoption Phase 2 — public entry point.
 *
 * The second batch of existing, already-deterministic validator scripts opted into the Validation
 * Evidence Reuse Engine, plus the risk-classification layer, aggregator child-graph handling, and
 * explainability infrastructure needed to grow adoption further while staying defensible. No
 * application, product, or generated-app knowledge lives here — only validator identities, their
 * declared file/directory/dependency/environment surfaces, and the reuse decisions VERE derives
 * from them.
 */

export type {
  Phase2ValidatorRiskClass,
  Phase2AggregatorChildDeclaration,
  Phase2AdoptedValidatorPolicy,
  Phase2ValidatorOutcomeKind,
  Phase2AdoptedValidatorRunResult,
  Phase2AdoptedValidatorExplanation,
} from './vere-adoption-phase-2-types.js';

export {
  DEFAULT_PHASE_2_ADOPTION_TTL_MS,
  definePhase2AdoptedValidatorPolicy,
  hasExplicitDependencySurface,
  FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES,
  combineRelevantDirectories,
  riskClassIsAlwaysUnsafe,
} from './vere-adoption-phase-2-policy-builder.js';
export type { Phase2AdoptedValidatorPolicyInput } from './vere-adoption-phase-2-policy-builder.js';

export {
  VERE_ADOPTION_PHASE_2_REGISTRY,
  findPhase2AdoptedValidatorPolicy,
  listPhase2ReuseSafeAdoptedValidators,
  listPhase2FreshRequiredAdoptedValidators,
  listPhase2AdoptedValidatorsByRiskClass,
} from './vere-adoption-phase-2-registry.js';

export {
  spawnValidatorScript,
  runPhase2AdoptedValidator,
  runPhase2AdoptedValidatorBatch,
  explainPhase2AdoptedValidator,
  explainPhase2AdoptedValidatorBatch,
} from './vere-adoption-phase-2-runner.js';
export type { Phase2AdoptedValidatorRunOptions } from './vere-adoption-phase-2-runner.js';

export {
  buildVereAdoptionPhase2Report,
  renderVereAdoptionPhase2ReportText,
  renderVereAdoptionPhase2ExplainabilityText,
} from './vere-adoption-phase-2-report.js';
export type { VereAdoptionPhase2Report, Phase2RiskClassTotals } from './vere-adoption-phase-2-report.js';

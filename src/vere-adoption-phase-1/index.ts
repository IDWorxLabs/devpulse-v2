/**
 * VERE Adoption Phase 1 — public entry point.
 *
 * The first batch of existing, already-deterministic validator scripts opted into the Validation
 * Evidence Reuse Engine, plus the generic registry, runner, and reporting infrastructure needed
 * to grow that batch safely over time. No application, product, or generated-app knowledge lives
 * here — only validator identities, their declared file/directory/dependency/environment
 * surfaces, and the reuse decisions VERE derives from them.
 */

export type { AdoptedValidatorKind, AdoptedValidatorPolicy, AdoptedValidatorRunResult, AdoptedValidatorExplanation } from './vere-adoption-types.js';

export {
  DEFAULT_ADOPTION_TTL_MS,
  defineAdoptedValidatorPolicy,
  hasExplicitDependencySurface,
  FOUNDER_REALITY_HTTP_SURFACE_DIRECTORIES,
  combineRelevantDirectories,
} from './vere-adoption-policy-builder.js';
export type { AdoptedValidatorPolicyInput } from './vere-adoption-policy-builder.js';

export {
  VERE_ADOPTION_PHASE_1_REGISTRY,
  findAdoptedValidatorPolicy,
  listReuseSafeAdoptedValidators,
  listFreshRequiredAdoptedValidators,
} from './vere-adoption-registry.js';

export {
  spawnValidatorScript,
  runAdoptedValidator,
  runAdoptedValidatorBatch,
  explainAdoptedValidator,
  explainAdoptedValidatorBatch,
} from './vere-adoption-runner.js';
export type { AdoptedValidatorRunOptions } from './vere-adoption-runner.js';

export {
  buildVereAdoptionReport,
  renderVereAdoptionReportText,
  renderVereAdoptionExplainabilityText,
} from './vere-adoption-report.js';
export type { VereAdoptionReport } from './vere-adoption-report.js';

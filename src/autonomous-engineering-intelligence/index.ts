/**
 * Autonomous Engineering Intelligence V1 — public exports.
 */

export {
  AUTONOMOUS_ENGINEERING_INTELLIGENCE_VERSION,
  AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE,
  type AutonomousEngineeringFinding,
  type AutonomousEngineeringPlan,
  type AutonomousEngineeringInput,
  type AutonomousEngineeringReport,
  type AutonomousEngineeringExecutionResult,
  type RepairEligibility,
  type RepairSafetyClassification,
  type RepairCategory,
  type RootCauseCode,
  type RepairOutcome,
  type RepairLoopState,
  type RepairStrategyDescriptor,
  type EligibilityDecision,
  type SourceMutationRecord,
} from './autonomous-engineering-types.js';

export {
  analyzeEngineeringFindings,
  buildAutonomousEngineeringPlan,
  validateAutonomousEngineeringPlan,
  executeAutonomousEngineeringPlan,
  verifyAutonomousEngineeringResult,
  reconcileAutonomousEngineeringResult,
  generateAutonomousEngineeringReport,
  requireSafeAutonomousRepair,
  detectAutonomousRepairRegression,
  fingerprintAutonomousEngineeringPlan,
  fingerprintAutonomousEngineeringResult,
  loadAutonomousEngineeringInput,
  validateAutonomousEngineeringInput,
  runAutonomousEngineeringCycle,
  shouldRunAutonomousEngineering,
  buildAutonomousEngineeringWorkspaceArtifacts,
} from './autonomous-engineering-intelligence.js';

export {
  classifyRepairEligibility,
  classifyRepairEligibilityBatch,
} from './autonomous-repair-eligibility-classifier.js';

export {
  augmentWorkspaceFilesWithAutonomousEngineering,
  shouldMaterializeAutonomousEngineering,
  buildAutonomousEngineeringSharedRuntimeFiles,
  type AutonomousEngineeringPipelineInput,
  type AutonomousEngineeringPipelineResult,
} from './autonomous-engineering-pipeline-integration.js';

export {
  bootstrapRepairStrategyRegistry,
  registerRepairStrategy,
  getRepairStrategy,
  listRepairStrategies,
  findStrategiesForFinding,
  validateRepairStrategy,
  fingerprintRepairStrategy,
  detectDuplicateRepairStrategy,
  inspectRepairAuthorityDependencies,
  resetRepairStrategyRegistryForTests,
} from './autonomous-repair-strategy-registry.js';

export { REFERENCE_REPAIR_STRATEGIES, executeRepairStrategy } from './strategies/index.js';

export { isMutationPathAllowed, detectForbiddenConstitutionalMutation, MUTATION_ALLOWLIST_PREFIXES } from './autonomous-repair-mutation-policy.js';

export { normalizeEngineeringFindings } from './autonomous-engineering-finding-normalizer.js';

export { groupEngineeringFindings } from './autonomous-engineering-finding-grouper.js';

export { analyzeRootCause } from './autonomous-engineering-root-cause-analyzer.js';

export { buildAutonomousEngineeringEvidence } from './autonomous-engineering-evidence.js';

export { buildAutonomousEngineeringTraceability, isTraceabilityComplete } from './autonomous-engineering-traceability.js';

export { buildAutonomousEngineeringDiagnostics } from './autonomous-engineering-diagnostics.js';

export { selectRepairStrategy } from './autonomous-repair-strategy-selector.js';

export { buildRepairDependencyGraph } from './autonomous-repair-dependency-graph.js';

export { validateRepairPreconditions } from './autonomous-repair-precondition-validator.js';

export { shouldAllowRepairAttempt, maxRepairCyclesReached } from './autonomous-repair-attempt-policy.js';

export { rollbackMutation, rollbackMutations } from './autonomous-repair-rollback.js';

export { selectTargetedValidators, runTargetedValidationPlan } from './autonomous-repair-targeted-validation.js';

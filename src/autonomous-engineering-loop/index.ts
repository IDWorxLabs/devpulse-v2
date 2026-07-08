/**
 * Autonomous Engineering Loop V1 — public API.
 */

export {
  AUTONOMOUS_ENGINEERING_LOOP_V1_PASS_TOKEN,
  AEL_OWNER_MODULE,
  AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS,
  AEL_MAX_FOUNDER_LOOP_CYCLES,
  AEL_MAX_AUTOFIX_ATTEMPTS,
  AEL_MAX_PREVIEW_RECOVERY_ATTEMPTS,
  AEL_PRODUCT_REALITY_PASS_THRESHOLD,
} from './ael-types.js';

export type {
  AelState,
  AelFinalOutcome,
  AelDecision,
  CapabilityType,
  ProductRealityReport,
  FounderLoopCycleReport,
  CapabilityEvolutionAttempt,
  AelCycleRecord,
  AelEvidenceBundle,
  AelFinalReport,
  AelOrchestratorInput,
  AelOrchestratorResult,
  AelValidationCheck,
} from './ael-types.js';

export {
  isAelTerminalState,
  resolveNextAelState,
  aelStateLabel,
  listAelStates,
  initialAelState,
  decisionToRepairState,
} from './ael-loop-state-machine.js';

export { isAelEnabled, runAutonomousEngineeringLoop } from './ael-orchestrator.js';

export {
  evaluateProductReality,
  productRealityPasses,
} from './product-reality-engine.js';

export {
  classifyCapabilityType,
  runCapabilityEvolutionRuntime,
  type CapabilityEvolutionRuntimeInput,
  type CapabilityEvolutionRuntimeResult,
} from './capability-evolution-runtime.js';

export { runAutonomousFounderLoop, type AutonomousFounderLoopResult } from './autonomous-founder-loop.js';

export { collectAelEvidence, buildAeeEvidenceSummary } from './ael-evidence-collector.js';

export { evaluateAelDecision, type AelDecisionResult } from './ael-decision-engine.js';

export { routeAelRepair, type AelRepairRouterInput, type AelRepairRouterResult } from './ael-repair-router.js';

export {
  buildAelFinalReport,
  formatAelReportMarkdown,
  writeAelReportArtifacts,
  buildAelCycleRecord,
  summarizeAelEvidenceForResponse,
} from './ael-report-builder.js';

export {
  AEL_REQUIRED_FILES,
  assertAelCheck,
  validateAelModuleFiles,
  validateAelStateMachine,
  validatePreGenericFallbackDetection,
  validatePreRichProductPass,
  validateCerSafetyGates,
  validateAelDecisionOutcomes,
  validateAelOrchestratorWiring,
  validateAelNoAppHardcoding,
  validateAelFeatureFlag,
  validateCerModuleGeneration,
} from './ael-validator.js';

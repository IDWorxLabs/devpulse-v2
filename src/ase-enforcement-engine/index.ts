/**
 * ASE Enforcement Engine — public exports.
 */

export {
  ASE_ENFORCEMENT_ENGINE_OWNER_MODULE,
  ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN,
} from './ase-enforcement-engine-types.js';

export type {
  AutonomousEngineeringInput,
  AutonomousEngineeringResult,
  EngineeringActionRecord,
  EngineeringActionType,
  EngineeringDecision,
  EngineeringDecisionType,
  EngineeringEvidenceBundle,
  EngineeringExecutionStatus,
  EngineeringGoal,
  EngineeringRecoveryPlan,
  EngineeringState,
  MaterializationHostResult,
  AutonomousEngineeringHost,
} from './ase-enforcement-engine-types.js';

export {
  runAutonomousEngineering,
  completeAutonomousEngineering,
  getEngineeringState,
  getEngineeringGoal,
  getLastAutonomousEngineeringResult,
  resetEngineeringAuthorityForTests,
} from './engineering-authority.js';

export { discoverEngineeringState } from './engineering-state-discovery.js';
export { aggregateEngineeringEvidence } from './engineering-evidence-aggregator.js';
export { evaluateEngineeringGoal } from './engineering-goal-evaluator.js';
export { evaluateEngineeringDecision } from './engineering-decision-engine.js';
export {
  requestEngineeringAction,
  authorizeMaterialization,
  completeEngineeringAction,
  getLastEngineeringDecision,
  setLastEngineeringDecision,
  getAuthorizedActionLog,
} from './engineering-action-authority.js';
export { routeEngineeringAction, mapDecisionToAction } from './engineering-routing-engine.js';
export { routeEngineeringRecovery, mapRecoveryToAction } from './engineering-recovery-router.js';
export { getEngineeringActionLog, recordEngineeringAction } from './engineering-execution-monitor.js';

export {
  getDevPulseV2AseEnforcementEngine,
  registerAseEnforcementWithOnePromptOrchestrator,
} from './ase-enforcement-registry.js';

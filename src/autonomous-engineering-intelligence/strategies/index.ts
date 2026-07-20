import { MISSING_ARTIFACT_STRATEGY } from './missing-generated-artifact-repair.js';
import { MISSING_ACTION_HANDLER_STRATEGY } from './missing-action-handler-repair.js';
import { MISSING_WORKFLOW_TRANSITION_STRATEGY } from './missing-workflow-transition-repair.js';
import { MISSING_RELATIONSHIP_WIRING_STRATEGY } from './missing-relationship-wiring-repair.js';
import { MISSING_RUNTIME_SCOPE_STRATEGY } from './missing-runtime-scope-repair.js';
import { MISSING_RULE_WIRING_STRATEGY } from './missing-rule-wiring-repair.js';
import { MISSING_VERIFICATION_SCENARIO_STRATEGY } from './missing-verification-scenario-repair.js';
import { COMPOSITION_RECONCILIATION_STRATEGY } from './composition-materialization-reconciliation-repair.js';
import { STATIC_SHELL_REPLACEMENT_STRATEGY } from './static-shell-replacement-repair.js';
import { MISSING_EVIDENCE_EMISSION_STRATEGY } from './missing-evidence-emission-repair.js';
import type { RepairStrategyDescriptor } from '../autonomous-engineering-types.js';
import type { RepairStrategyExecutionContext, RepairStrategyExecutionResult } from './strategy-utils.js';
import { executeMissingGeneratedArtifactRepair } from './missing-generated-artifact-repair.js';
import { executeMissingActionHandlerRepair } from './missing-action-handler-repair.js';
import { executeMissingWorkflowTransitionRepair } from './missing-workflow-transition-repair.js';
import { executeMissingRelationshipWiringRepair } from './missing-relationship-wiring-repair.js';
import { executeMissingRuntimeScopeRepair } from './missing-runtime-scope-repair.js';
import { executeMissingRuleWiringRepair } from './missing-rule-wiring-repair.js';
import { executeMissingVerificationScenarioRepair } from './missing-verification-scenario-repair.js';
import { executeCompositionMaterializationReconciliationRepair } from './composition-materialization-reconciliation-repair.js';
import { executeStaticShellReplacementRepair } from './static-shell-replacement-repair.js';
import { executeMissingEvidenceEmissionRepair } from './missing-evidence-emission-repair.js';

export const REFERENCE_REPAIR_STRATEGIES: RepairStrategyDescriptor[] = [
  MISSING_ARTIFACT_STRATEGY,
  MISSING_ACTION_HANDLER_STRATEGY,
  MISSING_WORKFLOW_TRANSITION_STRATEGY,
  MISSING_RELATIONSHIP_WIRING_STRATEGY,
  MISSING_RUNTIME_SCOPE_STRATEGY,
  MISSING_RULE_WIRING_STRATEGY,
  MISSING_VERIFICATION_SCENARIO_STRATEGY,
  COMPOSITION_RECONCILIATION_STRATEGY,
  STATIC_SHELL_REPLACEMENT_STRATEGY,
  MISSING_EVIDENCE_EMISSION_STRATEGY,
];

const EXECUTORS: Record<string, (ctx: RepairStrategyExecutionContext) => RepairStrategyExecutionResult> = {
  [MISSING_ARTIFACT_STRATEGY.strategyId]: executeMissingGeneratedArtifactRepair,
  [MISSING_ACTION_HANDLER_STRATEGY.strategyId]: executeMissingActionHandlerRepair,
  [MISSING_WORKFLOW_TRANSITION_STRATEGY.strategyId]: executeMissingWorkflowTransitionRepair,
  [MISSING_RELATIONSHIP_WIRING_STRATEGY.strategyId]: executeMissingRelationshipWiringRepair,
  [MISSING_RUNTIME_SCOPE_STRATEGY.strategyId]: executeMissingRuntimeScopeRepair,
  [MISSING_RULE_WIRING_STRATEGY.strategyId]: executeMissingRuleWiringRepair,
  [MISSING_VERIFICATION_SCENARIO_STRATEGY.strategyId]: executeMissingVerificationScenarioRepair,
  [COMPOSITION_RECONCILIATION_STRATEGY.strategyId]: executeCompositionMaterializationReconciliationRepair,
  [STATIC_SHELL_REPLACEMENT_STRATEGY.strategyId]: executeStaticShellReplacementRepair,
  [MISSING_EVIDENCE_EMISSION_STRATEGY.strategyId]: executeMissingEvidenceEmissionRepair,
};

export function executeRepairStrategy(strategyId: string, ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const exec = EXECUTORS[strategyId];
  if (!exec) return { applied: false, mutation: null, error: 'no_repair_strategy' };
  return exec(ctx);
}

/**
 * Autonomous Engineering Intelligence V1 — controlled repair executor.
 */

import type {
  AutonomousEngineeringInput,
  AutonomousEngineeringPlan,
  AutonomousEngineeringExecutionResult,
  RepairOutcome,
  RepairLoopState,
  SourceMutationRecord,
} from './autonomous-engineering-types.js';
import { validateRepairPreconditions } from './autonomous-repair-precondition-validator.js';
import { executeRepairStrategy } from './strategies/index.js';
import { rollbackMutations } from './autonomous-repair-rollback.js';
import { shouldAllowRepairAttempt } from './autonomous-repair-attempt-policy.js';
import { selectTargetedValidators, runTargetedValidationPlan } from './autonomous-repair-targeted-validation.js';
import { verifyAutonomousEngineeringResult } from './autonomous-repair-post-verification.js';
import { reconcileAutonomousEngineeringResult } from './autonomous-repair-reconciliation.js';
import { workspaceFingerprint } from './autonomous-engineering-input-loader.js';
import type { RepairStrategyExecutionContext } from './strategies/strategy-utils.js';
import type { AutonomousEngineeringFinding } from './autonomous-engineering-types.js';

function resolveOutcome(input: {
  applied: number;
  failed: number;
  rolledBack: number;
  resolved: number;
  humanRequired: number;
  blocked: boolean;
}): RepairOutcome {
  if (input.blocked) return 'REPAIR_BLOCKED';
  if (input.humanRequired > 0 && input.resolved === 0) return 'REPAIR_REQUIRES_HUMAN_DECISION';
  if (input.rolledBack > 0 && input.applied === 0) return 'REPAIR_ROLLED_BACK';
  if (input.failed > 0 && input.resolved === 0) return 'REPAIR_FAILED';
  if (input.resolved > 0 && input.failed === 0) return 'REPAIR_SUCCEEDED';
  if (input.resolved > 0 && input.failed > 0) return 'REPAIR_PARTIALLY_SUCCEEDED';
  return 'REPAIR_NOT_REQUIRED';
}

export function executeAutonomousEngineeringPlan(input: {
  engineeringInput: AutonomousEngineeringInput;
  plan: AutonomousEngineeringPlan;
  findings: readonly AutonomousEngineeringFinding[];
}): AutonomousEngineeringExecutionResult {
  const preconditionErrors = validateRepairPreconditions(input.engineeringInput, input.plan);
  const readinessBefore = input.engineeringInput.readinessReport?.readinessVerdict ?? 'NOT_PRODUCTION_READY';
  let loopState: RepairLoopState = preconditionErrors.length > 0 ? 'BLOCKED' : 'REPAIRING';

  if (preconditionErrors.length > 0 || input.plan.selectedStrategies.length === 0) {
    return {
      outcome: preconditionErrors.length > 0 ? 'REPAIR_BLOCKED' : 'REPAIR_NOT_REQUIRED',
      loopState,
      appliedMutations: [],
      rolledBackMutations: [],
      resolvedFindingIds: [],
      unresolvedFindingIds: input.plan.unresolvedFindings,
      workspaceFiles: input.engineeringInput.workspaceFiles,
      readinessBefore,
      readinessAfter: readinessBefore,
      targetedValidators: [],
      validatorResults: [],
    };
  }

  const workspaceFiles = [...input.engineeringInput.workspaceFiles];
  const appliedMutations: SourceMutationRecord[] = [];
  const attemptHistory: { findingId: string; strategyId: string; inputFingerprint: string; resultFingerprint: string; failed: boolean }[] = [];
  let failedSteps = 0;

  for (const step of input.plan.selectedStrategies) {
    const finding = input.findings.find((f) => f.findingId === step.findingId);
    if (!finding) continue;
    const attemptCheck = shouldAllowRepairAttempt(attemptHistory, {
      findingId: step.findingId,
      strategyId: step.strategyId,
      inputFingerprint: `${finding.fingerprint}|${workspaceFingerprint(workspaceFiles)}`,
    });
    if (!attemptCheck.allowed) {
      failedSteps += 1;
      continue;
    }
    const ctx: RepairStrategyExecutionContext = {
      input: { ...input.engineeringInput, workspaceFiles },
      finding,
      workspaceFiles,
    };
    const result = executeRepairStrategy(step.strategyId, ctx);
    attemptHistory.push({
      findingId: step.findingId,
      strategyId: step.strategyId,
      inputFingerprint: `${finding.fingerprint}|${workspaceFingerprint(workspaceFiles)}`,
      resultFingerprint: result.mutation?.expectedAfterFingerprint ?? 'none',
      failed: !result.applied,
    });
    if (!result.applied || !result.mutation) {
      failedSteps += 1;
      continue;
    }
    appliedMutations.push(result.mutation);
  }

  loopState = 'VALIDATING';
  const targetedValidators = selectTargetedValidators(input.plan);
  const validatorResults = runTargetedValidationPlan(targetedValidators);

  const rolledBackMutations =
    failedSteps > 0 && appliedMutations.length > 0 ? rollbackMutations(workspaceFiles, appliedMutations) : [];

  const engineeringInputAfter = { ...input.engineeringInput, workspaceFiles };
  loopState = 'RECONCILING';
  const reconciliation = reconcileAutonomousEngineeringResult({ engineeringInput: engineeringInputAfter });
  loopState = 'REEVALUATING_READINESS';

  const resolvedFindingIds = input.plan.selectedStrategies
    .filter((s) => appliedMutations.some((m) => m.strategyId === s.strategyId))
    .map((s) => s.findingId);

  const postVerify = verifyAutonomousEngineeringResult({
    engineeringInput: engineeringInputAfter,
    plan: input.plan,
    appliedMutations: rolledBackMutations.length > 0 ? [] : appliedMutations,
    readinessBefore,
    readinessAfter: reconciliation.readinessAfter,
    resolvedFindingIds,
  });

  const outcome = resolveOutcome({
    applied: appliedMutations.length - rolledBackMutations.length,
    failed: failedSteps,
    rolledBack: rolledBackMutations.length,
    resolved: postVerify.behaviorVerified ? resolvedFindingIds.length : 0,
    humanRequired: input.plan.humanRequiredFindings.length,
    blocked: preconditionErrors.length > 0,
  });

  if (outcome === 'REPAIR_SUCCEEDED') loopState = 'SUCCEEDED';
  else if (outcome === 'REPAIR_PARTIALLY_SUCCEEDED') loopState = 'PARTIALLY_SUCCEEDED';
  else if (outcome === 'REPAIR_ROLLED_BACK') loopState = 'ROLLED_BACK';
  else if (outcome === 'REPAIR_REQUIRES_HUMAN_DECISION') loopState = 'HUMAN_REQUIRED';
  else if (outcome === 'REPAIR_FAILED') loopState = 'FAILED';

  return {
    outcome,
    loopState,
    appliedMutations: rolledBackMutations.length > 0 ? [] : appliedMutations,
    rolledBackMutations,
    resolvedFindingIds: postVerify.behaviorVerified ? resolvedFindingIds : [],
    unresolvedFindingIds: input.findings
      .map((f) => f.findingId)
      .filter((id) => !resolvedFindingIds.includes(id)),
    workspaceFiles,
    readinessBefore,
    readinessAfter: reconciliation.readinessAfter,
    targetedValidators,
    validatorResults,
  };
}

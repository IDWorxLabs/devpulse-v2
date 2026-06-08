/**
 * Code Generation Planner bridge — planner remains code plan owner; recovery consumes read-only.
 */

import { getDevPulseV2CodeGenerationPlannerAuthority } from '../code-generation-planner/code-generation-planner-authority.js';
import { PLANNER_OWNER_MODULE } from '../code-generation-planner/types.js';
import type { CodeGenerationPlan } from '../code-generation-planner/types.js';
import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import {
  buildRecoveryInputFromCodePlan,
  generateRecoveryStrategy,
} from './recovery-strategy-engine.js';
import { buildRecoveryDuplicateContextFromBridges } from './recovery-vault-bridge.js';
import type { RecoveryStrategy } from './types.js';

export function generateRecoveryFromCodePlan(
  plan: CodeGenerationPlan,
  implementationStrategy?: ImplementationStrategy,
): RecoveryStrategy {
  const phases = implementationStrategy?.phases.map((p) => ({
    phaseId: p.phaseId,
    order: p.order,
    title: p.title,
    rollbackCheckpoint: p.rollbackCheckpoint,
    validationRequirements: p.validationRequirements,
    warnings: p.warnings,
    errors: p.errors,
  }));
  const input = buildRecoveryInputFromCodePlan(plan, phases);
  const context = buildRecoveryDuplicateContextFromBridges(plan, implementationStrategy);
  return generateRecoveryStrategy(input, context);
}

export function getCodePlanSummary(plan: CodeGenerationPlan): string {
  return (
    `Code plan ${plan.planId}: strategy=${plan.strategyId} tasks=${plan.tasks.length} ` +
    `status=${plan.status}`
  );
}

export function assertCodeGenerationPlannerOwnershipUnchanged(): boolean {
  const planner = getDevPulseV2CodeGenerationPlannerAuthority();
  return (
    planner.constructor.name === 'DevPulseV2CodeGenerationPlannerAuthority' &&
    typeof planner.generateAndStore === 'function' &&
    typeof (planner as { generateRecoveryStrategy?: unknown }).generateRecoveryStrategy ===
      'undefined'
  );
}

export function getCodeGenerationPlannerOwnerForBridge(): string {
  return PLANNER_OWNER_MODULE;
}

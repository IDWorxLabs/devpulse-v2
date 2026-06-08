/**
 * DevPulse V2 Planning Stack Validation Authority — handoff validation only.
 * Does NOT generate code, execute, rollback, recover, or modify projects.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  determinePhase5Readiness,
  runPlanningStackValidation,
  summarizePlanningStackValidation,
  validateDuplicateDetectionSystems,
  validateOwnershipIntegrity,
} from './planning-stack-validation-engine.js';
import { formatPlanningStackValidationReport } from './planning-stack-validation-report.js';
import type {
  PlanningStackValidationResult,
  PlanningStackValidationState,
} from './types.js';
import { VALIDATION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2PlanningStackValidationAuthority | null = null;

function createValidatorId(): string {
  return `stack-validator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneResult(result: PlanningStackValidationResult): PlanningStackValidationResult {
  return {
    ...result,
    handoffs: result.handoffs.map((h) => ({ ...h })),
    ownershipChecks: result.ownershipChecks.map((c) => ({ ...c })),
    duplicateDetection: result.duplicateDetection.map((d) => ({ ...d })),
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export class DevPulseV2PlanningStackValidationAuthority {
  private readonly validatorId = createValidatorId();
  private readonly runs: PlanningStackValidationResult[] = [];
  private validatorWarnings: string[] = [
    'Planning Stack Reality Validation verifies handoffs only — no code generation, execution, rollback, or project modification.',
  ];
  private validatorErrors: string[] = [];

  static readonly ownerModule = VALIDATION_OWNER_MODULE;
  static readonly ownerDomain = 'planning_stack_reality_validation' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('planning_stack_reality_validation');
    return owner.ownerModule === VALIDATION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const validation = getDevPulseV2Owner('planning_stack_reality_validation');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      validation.ownerModule === VALIDATION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const validator = new DevPulseV2PlanningStackValidationAuthority();
    return (
      typeof (validator as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (validator as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const validator = new DevPulseV2PlanningStackValidationAuthority();
    return (
      typeof (validator as { execute?: unknown }).execute === 'undefined' &&
      typeof (validator as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRollback(): boolean {
    const validator = new DevPulseV2PlanningStackValidationAuthority();
    return (
      typeof (validator as { rollback?: unknown }).rollback === 'undefined' &&
      typeof (validator as { performRollback?: unknown }).performRollback === 'undefined'
    );
  }

  static assertDoesNotPerformRecovery(): boolean {
    const validator = new DevPulseV2PlanningStackValidationAuthority();
    return (
      typeof (validator as { recover?: unknown }).recover === 'undefined' &&
      typeof (validator as { performRecovery?: unknown }).performRecovery === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const validator = new DevPulseV2PlanningStackValidationAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (validator as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  runValidation(requestText?: string): PlanningStackValidationResult {
    const result = runPlanningStackValidation(requestText);
    this.runs.push(cloneResult(result));
    return cloneResult(result);
  }

  getRun(validationId: string): PlanningStackValidationResult | null {
    const found = this.runs.find((r) => r.validationId === validationId);
    return found ? cloneResult(found) : null;
  }

  listRuns(): PlanningStackValidationResult[] {
    return this.runs.map(cloneResult);
  }

  getValidatorState(): PlanningStackValidationState {
    return {
      validatorId: this.validatorId,
      runCount: this.runs.length,
      warnings: [...this.validatorWarnings],
      errors: [...this.validatorErrors],
    };
  }

  formatReport(): string {
    return formatPlanningStackValidationReport(this.getValidatorState(), this.listRuns());
  }
}

export function createDevPulseV2PlanningStackValidationAuthority(): DevPulseV2PlanningStackValidationAuthority {
  singleton = new DevPulseV2PlanningStackValidationAuthority();
  return singleton;
}

export function getDevPulseV2PlanningStackValidationAuthority(): DevPulseV2PlanningStackValidationAuthority {
  if (!singleton) {
    singleton = new DevPulseV2PlanningStackValidationAuthority();
  }
  return singleton;
}

export function resetDevPulseV2PlanningStackValidationAuthorityForTests(): DevPulseV2PlanningStackValidationAuthority {
  singleton = new DevPulseV2PlanningStackValidationAuthority();
  return singleton;
}

export {
  determinePhase5Readiness,
  runPlanningStackValidation,
  summarizePlanningStackValidation,
  validateDuplicateDetectionSystems,
  validateOwnershipIntegrity,
};

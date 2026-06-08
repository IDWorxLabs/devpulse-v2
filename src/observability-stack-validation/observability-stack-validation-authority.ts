/**
 * DevPulse V2 Observability Stack Validation Authority — handoff validation only.
 * Does NOT generate code, execute, repair, or become answer authority.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  determinePhase6Readiness,
  runObservabilityStackValidation,
  summarizeObservabilityStackValidation,
  validateDuplicateDetection,
  validateOwnershipIntegrity,
} from './observability-stack-validation-engine.js';
import { formatObservabilityStackValidationReport } from './observability-stack-validation-report.js';
import type {
  ObservabilityValidationResult,
  ObservabilityValidationState,
} from './types.js';
import { VALIDATION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ObservabilityStackValidationAuthority | null = null;

function createValidatorId(): string {
  return `obs-stack-validator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneResult(result: ObservabilityValidationResult): ObservabilityValidationResult {
  return {
    ...result,
    handoffs: result.handoffs.map((h) => ({ ...h })),
    ownershipChecks: result.ownershipChecks.map((c) => ({ ...c })),
    duplicateDetection: result.duplicateDetection.map((d) => ({ ...d })),
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export class DevPulseV2ObservabilityStackValidationAuthority {
  private readonly validatorId = createValidatorId();
  private readonly runs: ObservabilityValidationResult[] = [];
  private validatorWarnings: string[] = [
    'Observability Stack Reality Validation verifies handoffs only — no code generation, execution, or repair.',
  ];
  private validatorErrors: string[] = [];

  static readonly ownerModule = VALIDATION_OWNER_MODULE;
  static readonly ownerDomain = 'observability_stack_reality_validation' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('observability_stack_reality_validation');
    return owner.ownerModule === VALIDATION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const validation = getDevPulseV2Owner('observability_stack_reality_validation');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      validation.ownerModule === VALIDATION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const validator = new DevPulseV2ObservabilityStackValidationAuthority();
    return (
      typeof (validator as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (validator as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const validator = new DevPulseV2ObservabilityStackValidationAuthority();
    return (
      typeof (validator as { execute?: unknown }).execute === 'undefined' &&
      typeof (validator as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRepairs(): boolean {
    const validator = new DevPulseV2ObservabilityStackValidationAuthority();
    return (
      typeof (validator as { repair?: unknown }).repair === 'undefined' &&
      typeof (validator as { fix?: unknown }).fix === 'undefined'
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  static assertDoesNotReplaceEvidenceRegistry(): boolean {
    return getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE;
  }

  static assertDoesNotModifyProjects(): boolean {
    const validator = new DevPulseV2ObservabilityStackValidationAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (validator as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  runValidation(): ObservabilityValidationResult {
    const result = runObservabilityStackValidation();
    this.runs.push(cloneResult(result));
    return cloneResult(result);
  }

  getRun(validationId: string): ObservabilityValidationResult | null {
    const found = this.runs.find((r) => r.validationId === validationId);
    return found ? cloneResult(found) : null;
  }

  listRuns(): ObservabilityValidationResult[] {
    return this.runs.map(cloneResult);
  }

  getValidatorState(): ObservabilityValidationState {
    return {
      validatorId: this.validatorId,
      runCount: this.runs.length,
      warnings: [...this.validatorWarnings],
      errors: [...this.validatorErrors],
    };
  }

  formatReport(): string {
    return formatObservabilityStackValidationReport(this.getValidatorState(), this.listRuns());
  }
}

export function createDevPulseV2ObservabilityStackValidationAuthority(): DevPulseV2ObservabilityStackValidationAuthority {
  singleton = new DevPulseV2ObservabilityStackValidationAuthority();
  return singleton;
}

export function getDevPulseV2ObservabilityStackValidationAuthority(): DevPulseV2ObservabilityStackValidationAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ObservabilityStackValidationAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ObservabilityStackValidationAuthorityForTests(): DevPulseV2ObservabilityStackValidationAuthority {
  singleton = new DevPulseV2ObservabilityStackValidationAuthority();
  return singleton;
}

export {
  determinePhase6Readiness,
  runObservabilityStackValidation,
  summarizeObservabilityStackValidation,
  validateDuplicateDetection,
  validateOwnershipIntegrity,
};

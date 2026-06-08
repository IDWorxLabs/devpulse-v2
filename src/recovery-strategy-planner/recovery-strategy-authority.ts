/**
 * DevPulse V2 Recovery Strategy Authority — recovery planning only.
 * Does NOT generate code, execute, rollback, recover, or modify projects.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { PLANNER_OWNER_MODULE } from '../code-generation-planner/types.js';
import { STRATEGY_OWNER_MODULE } from '../implementation-strategy-engine/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import type { CodeGenerationPlan } from '../code-generation-planner/types.js';
import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import {
  getLatestRecoverySummary,
  publishRecoverySummary,
  resetRecoveryBrainBridgeForTests,
} from './recovery-brain-bridge.js';
import {
  generateRecoveryFromCodePlan,
  getCodePlanSummary,
} from './recovery-code-plan-bridge.js';
import {
  generateRecoveryFromStrategy,
  getStrategySummary,
} from './recovery-strategy-bridge.js';
import {
  getExistingCapabilitySummary,
  getRecoveryContext,
} from './recovery-vault-bridge.js';
import {
  buildRecoveryInputFromCodePlan,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateDependencyFailureResponses,
  generateFailureResponses,
  generateRecoveryCheckpoints,
  generateRecoveryStrategy,
  generateRollbackRecommendations,
  generateValidationFailureResponses,
  summarizeRecoveryStrategy,
} from './recovery-strategy-engine.js';
import { formatRecoveryStrategyReport } from './recovery-strategy-report.js';
import type { RecoveryStrategy, RecoveryStrategyPlannerState, RecoverySummary } from './types.js';
import { RECOVERY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RecoveryStrategyAuthority | null = null;

function createPlannerId(): string {
  return `recovery-planner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecoveryStrategy(strategy: RecoveryStrategy): RecoveryStrategy {
  return {
    ...strategy,
    scenarios: strategy.scenarios.map((s) => ({
      ...s,
      validationRequirements: [...s.validationRequirements],
      warnings: [...s.warnings],
      errors: [...s.errors],
    })),
    duplicateRisks: [...strategy.duplicateRisks],
    warnings: [...strategy.warnings],
    errors: [...strategy.errors],
  };
}

export class DevPulseV2RecoveryStrategyAuthority {
  private readonly plannerId = createPlannerId();
  private readonly strategies: RecoveryStrategy[] = [];
  private plannerWarnings: string[] = [
    'Recovery Strategy Planner performs planning only — no code generation, execution, rollback, recovery, or project modification.',
  ];
  private plannerErrors: string[] = [];

  static readonly ownerModule = RECOVERY_OWNER_MODULE;
  static readonly ownerDomain = 'recovery_strategy_planner' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('recovery_strategy_planner');
    return owner.ownerModule === RECOVERY_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const recovery = getDevPulseV2Owner('recovery_strategy_planner');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      recovery.ownerModule === RECOVERY_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const planner = new DevPulseV2RecoveryStrategyAuthority();
    return (
      typeof (planner as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (planner as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const planner = new DevPulseV2RecoveryStrategyAuthority();
    return (
      typeof (planner as { execute?: unknown }).execute === 'undefined' &&
      typeof (planner as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotPerformRollback(): boolean {
    const planner = new DevPulseV2RecoveryStrategyAuthority();
    return (
      typeof (planner as { rollback?: unknown }).rollback === 'undefined' &&
      typeof (planner as { performRollback?: unknown }).performRollback === 'undefined' &&
      typeof (planner as { executeRollback?: unknown }).executeRollback === 'undefined'
    );
  }

  static assertDoesNotPerformRecovery(): boolean {
    const planner = new DevPulseV2RecoveryStrategyAuthority();
    return (
      typeof (planner as { recover?: unknown }).recover === 'undefined' &&
      typeof (planner as { performRecovery?: unknown }).performRecovery === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const planner = new DevPulseV2RecoveryStrategyAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (planner as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertDoesNotReplaceCodeGenerationPlanner(): boolean {
    return getDevPulseV2Owner('code_generation_planner').ownerModule === PLANNER_OWNER_MODULE;
  }

  static assertDoesNotReplaceImplementationStrategy(): boolean {
    return getDevPulseV2Owner('implementation_strategy_engine').ownerModule === STRATEGY_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  generateAndStore(
    codePlan: CodeGenerationPlan,
    implementationStrategy?: ImplementationStrategy,
  ): RecoveryStrategy {
    const strategy = implementationStrategy
      ? generateRecoveryFromStrategy(implementationStrategy, codePlan)
      : generateRecoveryFromCodePlan(codePlan);
    this.strategies.push(cloneRecoveryStrategy(strategy));
    return cloneRecoveryStrategy(strategy);
  }

  getRecoveryStrategy(strategyId: string): RecoveryStrategy | null {
    const found = this.strategies.find((s) => s.strategyId === strategyId);
    return found ? cloneRecoveryStrategy(found) : null;
  }

  listRecoveryStrategies(): RecoveryStrategy[] {
    return this.strategies.map(cloneRecoveryStrategy);
  }

  getPlannerState(): RecoveryStrategyPlannerState {
    return {
      plannerId: this.plannerId,
      strategyCount: this.strategies.length,
      warnings: [...this.plannerWarnings],
      errors: [...this.plannerErrors],
    };
  }

  publishRecoverySummary(strategy: RecoveryStrategy): RecoverySummary {
    return publishRecoverySummary(strategy);
  }

  getLatestRecoverySummary(): RecoverySummary | null {
    return getLatestRecoverySummary();
  }

  getRecoveryContext() {
    return getRecoveryContext();
  }

  getExistingCapabilitySummary(): string {
    return getExistingCapabilitySummary();
  }

  getCodePlanSummary(plan: CodeGenerationPlan): string {
    return getCodePlanSummary(plan);
  }

  getStrategySummary(strategy: ImplementationStrategy): string {
    return getStrategySummary(strategy);
  }

  formatReport(): string {
    return formatRecoveryStrategyReport(this.getPlannerState(), this.listRecoveryStrategies());
  }
}

export function createDevPulseV2RecoveryStrategyAuthority(): DevPulseV2RecoveryStrategyAuthority {
  singleton = new DevPulseV2RecoveryStrategyAuthority();
  return singleton;
}

export function getDevPulseV2RecoveryStrategyAuthority(): DevPulseV2RecoveryStrategyAuthority {
  if (!singleton) {
    singleton = new DevPulseV2RecoveryStrategyAuthority();
  }
  return singleton;
}

export function resetDevPulseV2RecoveryStrategyAuthorityForTests(): DevPulseV2RecoveryStrategyAuthority {
  resetRecoveryBrainBridgeForTests();
  singleton = new DevPulseV2RecoveryStrategyAuthority();
  return singleton;
}

export {
  buildRecoveryInputFromCodePlan,
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateDependencyFailureResponses,
  generateFailureResponses,
  generateRecoveryCheckpoints,
  generateRecoveryStrategy,
  generateRollbackRecommendations,
  generateValidationFailureResponses,
  summarizeRecoveryStrategy,
};

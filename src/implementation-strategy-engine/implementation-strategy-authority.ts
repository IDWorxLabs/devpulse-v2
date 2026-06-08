/**
 * DevPulse V2 Implementation Strategy Authority — strategy generation only.
 * Does NOT generate code, execute, modify projects, or replace Build Package Generator.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import { GENERATOR_OWNER_MODULE } from '../build-package-generator/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { ARCHITECT_OWNER_MODULE } from '../product-architect/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import type { BuildPackageGenerationResult } from '../build-package-generator/types.js';
import {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateBuildOrder,
  generateDependencyOrder,
  generateImplementationPhases,
  generateImplementationStrategy,
  generateRollbackPlan,
  generateValidationSequence,
  summarizeStrategy,
} from './implementation-strategy-engine.js';
import { formatImplementationStrategyReport } from './implementation-strategy-report.js';
import {
  generateStrategyFromPackages,
  getPackageSummary,
} from './strategy-package-bridge.js';
import {
  getLatestStrategySummary,
  publishStrategySummary,
  resetStrategyBrainBridgeForTests,
} from './strategy-brain-bridge.js';
import {
  getExistingCapabilitySummary,
  getStrategyContext,
} from './strategy-vault-bridge.js';
import type {
  ImplementationStrategy,
  ImplementationStrategyEngineState,
  StrategySummary,
} from './types.js';
import { STRATEGY_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ImplementationStrategyAuthority | null = null;

function createEngineId(): string {
  return `strategy-eng-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneStrategy(strategy: ImplementationStrategy): ImplementationStrategy {
  return {
    ...strategy,
    phases: strategy.phases.map((p) => ({
      ...p,
      packageIds: [...p.packageIds],
      dependencies: [...p.dependencies],
      validationRequirements: [...p.validationRequirements],
      warnings: [...p.warnings],
      errors: [...p.errors],
    })),
    duplicateRisks: [...strategy.duplicateRisks],
    warnings: [...strategy.warnings],
    errors: [...strategy.errors],
  };
}

export class DevPulseV2ImplementationStrategyAuthority {
  private readonly engineId = createEngineId();
  private readonly strategies: ImplementationStrategy[] = [];
  private engineWarnings: string[] = [
    'Implementation Strategy Engine performs strategy generation only — no code generation, execution, or project modification.',
  ];
  private engineErrors: string[] = [];

  static readonly ownerModule = STRATEGY_OWNER_MODULE;
  static readonly ownerDomain = 'implementation_strategy_engine' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('implementation_strategy_engine');
    return owner.ownerModule === STRATEGY_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const engine = getDevPulseV2Owner('implementation_strategy_engine');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      engine.ownerModule === STRATEGY_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const engine = new DevPulseV2ImplementationStrategyAuthority();
    return (
      typeof (engine as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (engine as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const engine = new DevPulseV2ImplementationStrategyAuthority();
    return (
      typeof (engine as { execute?: unknown }).execute === 'undefined' &&
      typeof (engine as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const engine = new DevPulseV2ImplementationStrategyAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (engine as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertDoesNotReplaceBuildPackageGenerator(): boolean {
    return getDevPulseV2Owner('build_package_generator').ownerModule === GENERATOR_OWNER_MODULE;
  }

  static assertDoesNotReplaceProductArchitect(): boolean {
    return getDevPulseV2Owner('product_architect').ownerModule === ARCHITECT_OWNER_MODULE;
  }

  static assertDoesNotReplaceAiDev(): boolean {
    return getDevPulseV2Owner('aidev_engine').ownerModule === AIDEV_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  generateAndStore(generation: BuildPackageGenerationResult): ImplementationStrategy {
    const strategy = generateStrategyFromPackages(generation);
    this.strategies.push(cloneStrategy(strategy));
    return cloneStrategy(strategy);
  }

  getStrategy(strategyId: string): ImplementationStrategy | null {
    const found = this.strategies.find((s) => s.strategyId === strategyId);
    return found ? cloneStrategy(found) : null;
  }

  listStrategies(): ImplementationStrategy[] {
    return this.strategies.map(cloneStrategy);
  }

  getEngineState(): ImplementationStrategyEngineState {
    return {
      engineId: this.engineId,
      strategyCount: this.strategies.length,
      warnings: [...this.engineWarnings],
      errors: [...this.engineErrors],
    };
  }

  publishStrategySummary(strategy: ImplementationStrategy): StrategySummary {
    return publishStrategySummary(strategy);
  }

  getLatestStrategySummary(): StrategySummary | null {
    return getLatestStrategySummary();
  }

  getStrategyContext() {
    return getStrategyContext();
  }

  getExistingCapabilitySummary(): string {
    return getExistingCapabilitySummary();
  }

  getPackageSummary(generation: BuildPackageGenerationResult): string {
    return getPackageSummary(generation);
  }

  formatReport(): string {
    return formatImplementationStrategyReport(this.getEngineState(), this.listStrategies());
  }
}

export function createDevPulseV2ImplementationStrategyAuthority(): DevPulseV2ImplementationStrategyAuthority {
  singleton = new DevPulseV2ImplementationStrategyAuthority();
  return singleton;
}

export function getDevPulseV2ImplementationStrategyAuthority(): DevPulseV2ImplementationStrategyAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ImplementationStrategyAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ImplementationStrategyAuthorityForTests(): DevPulseV2ImplementationStrategyAuthority {
  resetStrategyBrainBridgeForTests();
  singleton = new DevPulseV2ImplementationStrategyAuthority();
  return singleton;
}

export {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateBuildOrder,
  generateDependencyOrder,
  generateImplementationPhases,
  generateImplementationStrategy,
  generateRollbackPlan,
  generateValidationSequence,
  summarizeStrategy,
};

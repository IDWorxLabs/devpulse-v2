/**
 * DevPulse V2 Code Generation Planner Authority — planning only.
 * Does NOT generate code, execute, modify projects, or replace Strategy Engine / UI Guard.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { STRATEGY_OWNER_MODULE } from '../implementation-strategy-engine/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { GUARD_OWNER_MODULE } from '../visible-ui-guard/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestCodePlanSummary,
  publishCodePlanSummary,
  resetCodePlanBrainBridgeForTests,
} from './code-plan-brain-bridge.js';
import {
  generatePlanFromStrategy,
  getStrategySummary,
} from './code-plan-strategy-bridge.js';
import {
  generateUiGuardRequirements,
  validateUiRequirements,
} from './code-plan-ui-guard-bridge.js';
import {
  getCodePlanContext,
  getExistingCapabilitySummary,
} from './code-plan-vault-bridge.js';
import {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateCodePlan,
  generateFileTargets,
  generateImplementationTasks,
  generateModuleTargets,
  generateUiRequirements,
  generateValidationTasks,
  summarizeCodePlan,
} from './code-planning-engine.js';
import { formatCodeGenerationPlanReport } from './code-generation-plan-report.js';
import type { ImplementationStrategy } from '../implementation-strategy-engine/types.js';
import type {
  CodeGenerationPlan,
  CodeGenerationPlannerState,
  CodePlanSummary,
} from './types.js';
import { PLANNER_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2CodeGenerationPlannerAuthority | null = null;

function createPlannerId(): string {
  return `code-planner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clonePlan(plan: CodeGenerationPlan): CodeGenerationPlan {
  return {
    ...plan,
    tasks: plan.tasks.map((t) => ({
      ...t,
      targetModules: [...t.targetModules],
      targetFiles: [...t.targetFiles],
      validationRequirements: [...t.validationRequirements],
      uiRequirements: [...t.uiRequirements],
      duplicateRisks: [...t.duplicateRisks],
      warnings: [...t.warnings],
      errors: [...t.errors],
    })),
    warnings: [...plan.warnings],
    errors: [...plan.errors],
  };
}

export class DevPulseV2CodeGenerationPlannerAuthority {
  private readonly plannerId = createPlannerId();
  private readonly plans: CodeGenerationPlan[] = [];
  private plannerWarnings: string[] = [
    'Code Generation Planner performs planning only — no code generation, execution, or project modification.',
  ];
  private plannerErrors: string[] = [];

  static readonly ownerModule = PLANNER_OWNER_MODULE;
  static readonly ownerDomain = 'code_generation_planner' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('code_generation_planner');
    return owner.ownerModule === PLANNER_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const planner = getDevPulseV2Owner('code_generation_planner');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      planner.ownerModule === PLANNER_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const planner = new DevPulseV2CodeGenerationPlannerAuthority();
    return (
      typeof (planner as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (planner as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const planner = new DevPulseV2CodeGenerationPlannerAuthority();
    return (
      typeof (planner as { execute?: unknown }).execute === 'undefined' &&
      typeof (planner as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const planner = new DevPulseV2CodeGenerationPlannerAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (planner as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertDoesNotReplaceImplementationStrategy(): boolean {
    return getDevPulseV2Owner('implementation_strategy_engine').ownerModule === STRATEGY_OWNER_MODULE;
  }

  static assertDoesNotReplaceVisibleUiGuard(): boolean {
    return getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  generateAndStore(strategy: ImplementationStrategy): CodeGenerationPlan {
    const plan = generatePlanFromStrategy(strategy);
    this.plans.push(clonePlan(plan));
    return clonePlan(plan);
  }

  getPlan(planId: string): CodeGenerationPlan | null {
    const found = this.plans.find((p) => p.planId === planId);
    return found ? clonePlan(found) : null;
  }

  listPlans(): CodeGenerationPlan[] {
    return this.plans.map(clonePlan);
  }

  getPlannerState(): CodeGenerationPlannerState {
    return {
      plannerId: this.plannerId,
      planCount: this.plans.length,
      warnings: [...this.plannerWarnings],
      errors: [...this.plannerErrors],
    };
  }

  publishCodePlanSummary(plan: CodeGenerationPlan): CodePlanSummary {
    return publishCodePlanSummary(plan);
  }

  getLatestCodePlanSummary(): CodePlanSummary | null {
    return getLatestCodePlanSummary();
  }

  getCodePlanContext() {
    return getCodePlanContext();
  }

  getExistingCapabilitySummary(): string {
    return getExistingCapabilitySummary();
  }

  getStrategySummary(strategy: ImplementationStrategy): string {
    return getStrategySummary(strategy);
  }

  formatReport(): string {
    return formatCodeGenerationPlanReport(this.getPlannerState(), this.listPlans());
  }
}

export function createDevPulseV2CodeGenerationPlannerAuthority(): DevPulseV2CodeGenerationPlannerAuthority {
  singleton = new DevPulseV2CodeGenerationPlannerAuthority();
  return singleton;
}

export function getDevPulseV2CodeGenerationPlannerAuthority(): DevPulseV2CodeGenerationPlannerAuthority {
  if (!singleton) {
    singleton = new DevPulseV2CodeGenerationPlannerAuthority();
  }
  return singleton;
}

export function resetDevPulseV2CodeGenerationPlannerAuthorityForTests(): DevPulseV2CodeGenerationPlannerAuthority {
  resetCodePlanBrainBridgeForTests();
  singleton = new DevPulseV2CodeGenerationPlannerAuthority();
  return singleton;
}

export {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateCodePlan,
  generateFileTargets,
  generateImplementationTasks,
  generateModuleTargets,
  generateUiGuardRequirements,
  generateUiRequirements,
  generateValidationTasks,
  summarizeCodePlan,
  validateUiRequirements,
};

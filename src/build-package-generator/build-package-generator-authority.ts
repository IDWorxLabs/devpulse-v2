/**
 * DevPulse V2 Build Package Generator Authority — package generation only.
 * Does NOT generate code, execute, modify projects, or replace Product Architect/AiDev.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { ARCHITECT_OWNER_MODULE } from '../product-architect/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateBuildPackages,
  generateDependencyRequirements,
  generateModulePackages,
  generateRiskRequirements,
  generateRollbackRequirements,
  generateValidationRequirements,
  summarizePackages,
} from './build-package-engine.js';
import { formatBuildPackageReport } from './build-package-report.js';
import {
  generatePackagesFromBlueprint,
  getBlueprintSummary,
} from './package-architect-bridge.js';
import {
  getLatestPackageSummary,
  publishPackageSummary,
  resetPackageBrainBridgeForTests,
} from './package-brain-bridge.js';
import {
  getExistingCapabilitySummary,
  getPackageContext,
} from './package-vault-bridge.js';
import type { ArchitectureBlueprint } from '../product-architect/types.js';
import type {
  BuildPackageGenerationResult,
  BuildPackageGeneratorState,
  PackageSummary,
} from './types.js';
import { GENERATOR_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2BuildPackageGeneratorAuthority | null = null;

function createGeneratorId(): string {
  return `pkg-gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneGeneration(result: BuildPackageGenerationResult): BuildPackageGenerationResult {
  return {
    ...result,
    packages: result.packages.map((p) => ({
      ...p,
      modules: [...p.modules],
      dependencies: [...p.dependencies],
      validationRequirements: [...p.validationRequirements],
      risks: [...p.risks],
      duplicateRisks: [...p.duplicateRisks],
      rollbackRequirements: [...p.rollbackRequirements],
      warnings: [...p.warnings],
      errors: [...p.errors],
    })),
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export class DevPulseV2BuildPackageGeneratorAuthority {
  private readonly generatorId = createGeneratorId();
  private readonly generations: BuildPackageGenerationResult[] = [];
  private generatorWarnings: string[] = [
    'Build Package Generator performs package generation only — no code generation, execution, or project modification.',
  ];
  private generatorErrors: string[] = [];

  static readonly ownerModule = GENERATOR_OWNER_MODULE;
  static readonly ownerDomain = 'build_package_generator' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('build_package_generator');
    return owner.ownerModule === GENERATOR_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const generator = getDevPulseV2Owner('build_package_generator');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      generator.ownerModule === GENERATOR_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const generator = new DevPulseV2BuildPackageGeneratorAuthority();
    return (
      typeof (generator as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (generator as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const generator = new DevPulseV2BuildPackageGeneratorAuthority();
    return (
      typeof (generator as { execute?: unknown }).execute === 'undefined' &&
      typeof (generator as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const generator = new DevPulseV2BuildPackageGeneratorAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (generator as { createProject?: unknown }).createProject === 'undefined'
    );
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

  generateAndStore(blueprint: ArchitectureBlueprint): BuildPackageGenerationResult {
    const result = generatePackagesFromBlueprint(blueprint);
    this.generations.push(cloneGeneration(result));
    return cloneGeneration(result);
  }

  getGeneration(generationId: string): BuildPackageGenerationResult | null {
    const found = this.generations.find((g) => g.generationId === generationId);
    return found ? cloneGeneration(found) : null;
  }

  listGenerations(): BuildPackageGenerationResult[] {
    return this.generations.map(cloneGeneration);
  }

  getGeneratorState(): BuildPackageGeneratorState {
    return {
      generatorId: this.generatorId,
      generationCount: this.generations.length,
      warnings: [...this.generatorWarnings],
      errors: [...this.generatorErrors],
    };
  }

  publishPackageSummary(result: BuildPackageGenerationResult): PackageSummary {
    return publishPackageSummary(result);
  }

  getLatestPackageSummary(): PackageSummary | null {
    return getLatestPackageSummary();
  }

  getPackageContext() {
    return getPackageContext();
  }

  getExistingCapabilitySummary(): string {
    return getExistingCapabilitySummary();
  }

  getBlueprintSummary(blueprint: ArchitectureBlueprint): string {
    return getBlueprintSummary(blueprint);
  }

  formatReport(): string {
    return formatBuildPackageReport(this.getGeneratorState(), this.listGenerations());
  }
}

export function createDevPulseV2BuildPackageGeneratorAuthority(): DevPulseV2BuildPackageGeneratorAuthority {
  singleton = new DevPulseV2BuildPackageGeneratorAuthority();
  return singleton;
}

export function getDevPulseV2BuildPackageGeneratorAuthority(): DevPulseV2BuildPackageGeneratorAuthority {
  if (!singleton) {
    singleton = new DevPulseV2BuildPackageGeneratorAuthority();
  }
  return singleton;
}

export function resetDevPulseV2BuildPackageGeneratorAuthorityForTests(): DevPulseV2BuildPackageGeneratorAuthority {
  resetPackageBrainBridgeForTests();
  singleton = new DevPulseV2BuildPackageGeneratorAuthority();
  return singleton;
}

export {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateBuildPackages,
  generateDependencyRequirements,
  generateModulePackages,
  generateRiskRequirements,
  generateRollbackRequirements,
  generateValidationRequirements,
  summarizePackages,
};

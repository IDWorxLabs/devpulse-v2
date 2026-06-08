/**
 * DevPulse V2 Product Architect Authority — architecture design only.
 * Does NOT generate code, execute, modify projects, or replace AiDev/Requirement Extractor.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { EXTRACTOR_OWNER_MODULE } from '../requirement-extractor/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestArchitectureSummary,
  publishArchitectureSummary,
  resetProductBrainBridgeForTests,
} from './product-brain-bridge.js';
import {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateArchitectureBlueprint,
  generateDataModels,
  generateFlows,
  generateIntegrations,
  generateModules,
  generatePermissions,
  generateScreens,
  summarizeArchitecture,
} from './product-architecture-engine.js';
import { formatProductArchitectReport } from './product-architect-report.js';
import {
  buildArchitectureFromRequirements,
  getRequirementSummary,
} from './product-requirement-bridge.js';
import {
  getExistingCapabilitySummary,
  getProjectArchitectureContext,
} from './product-vault-bridge.js';
import type { RequirementExtractionResult } from '../requirement-extractor/types.js';
import type {
  ArchitectureBlueprint,
  ArchitectureSummary,
  GenerateBlueprintInput,
  ProductArchitectState,
} from './types.js';
import { ARCHITECT_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ProductArchitectAuthority | null = null;

function createArchitectId(): string {
  return `architect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneBlueprint(blueprint: ArchitectureBlueprint): ArchitectureBlueprint {
  return {
    ...blueprint,
    components: blueprint.components.map((c) => ({
      ...c,
      sourceRequirementIds: [...c.sourceRequirementIds],
      warnings: [...c.warnings],
      errors: [...c.errors],
    })),
    warnings: [...blueprint.warnings],
    errors: [...blueprint.errors],
  };
}

export class DevPulseV2ProductArchitectAuthority {
  private readonly architectId = createArchitectId();
  private readonly blueprints: ArchitectureBlueprint[] = [];
  private architectWarnings: string[] = [
    'Product Architect performs architecture design only — no code generation, execution, or project modification.',
  ];
  private architectErrors: string[] = [];

  static readonly ownerModule = ARCHITECT_OWNER_MODULE;
  static readonly ownerDomain = 'product_architect' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('product_architect');
    return owner.ownerModule === ARCHITECT_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const architect = getDevPulseV2Owner('product_architect');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      architect.ownerModule === ARCHITECT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const architect = new DevPulseV2ProductArchitectAuthority();
    return (
      typeof (architect as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (architect as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const architect = new DevPulseV2ProductArchitectAuthority();
    return (
      typeof (architect as { execute?: unknown }).execute === 'undefined' &&
      typeof (architect as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const architect = new DevPulseV2ProductArchitectAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (architect as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertDoesNotReplaceAiDev(): boolean {
    return getDevPulseV2Owner('aidev_engine').ownerModule === AIDEV_OWNER_MODULE;
  }

  static assertDoesNotReplaceRequirementExtractor(): boolean {
    return getDevPulseV2Owner('requirement_extractor').ownerModule === EXTRACTOR_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  generateAndStore(input: GenerateBlueprintInput): ArchitectureBlueprint {
    const blueprint = generateArchitectureBlueprint(input);
    this.blueprints.push(cloneBlueprint(blueprint));
    return cloneBlueprint(blueprint);
  }

  generateFromRequirements(extraction: RequirementExtractionResult): ArchitectureBlueprint {
    const blueprint = buildArchitectureFromRequirements(extraction);
    this.blueprints.push(cloneBlueprint(blueprint));
    return cloneBlueprint(blueprint);
  }

  getBlueprint(blueprintId: string): ArchitectureBlueprint | null {
    const found = this.blueprints.find((b) => b.blueprintId === blueprintId);
    return found ? cloneBlueprint(found) : null;
  }

  listBlueprints(): ArchitectureBlueprint[] {
    return this.blueprints.map(cloneBlueprint);
  }

  getArchitectState(): ProductArchitectState {
    return {
      architectId: this.architectId,
      blueprintCount: this.blueprints.length,
      warnings: [...this.architectWarnings],
      errors: [...this.architectErrors],
    };
  }

  publishArchitectureSummary(blueprint: ArchitectureBlueprint): ArchitectureSummary {
    return publishArchitectureSummary(blueprint);
  }

  getLatestArchitectureSummary(): ArchitectureSummary | null {
    return getLatestArchitectureSummary();
  }

  getProjectArchitectureContext() {
    return getProjectArchitectureContext();
  }

  getExistingCapabilitySummary(): string {
    return getExistingCapabilitySummary();
  }

  getRequirementSummary(extraction: RequirementExtractionResult): string {
    return getRequirementSummary(extraction);
  }

  formatReport(): string {
    return formatProductArchitectReport(this.getArchitectState(), this.listBlueprints());
  }
}

export function createDevPulseV2ProductArchitectAuthority(): DevPulseV2ProductArchitectAuthority {
  singleton = new DevPulseV2ProductArchitectAuthority();
  return singleton;
}

export function getDevPulseV2ProductArchitectAuthority(): DevPulseV2ProductArchitectAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ProductArchitectAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ProductArchitectAuthorityForTests(): DevPulseV2ProductArchitectAuthority {
  resetProductBrainBridgeForTests();
  singleton = new DevPulseV2ProductArchitectAuthority();
  return singleton;
}

export {
  detectExistingCapabilities,
  detectPotentialDuplicates,
  generateArchitectureBlueprint,
  generateDataModels,
  generateFlows,
  generateIntegrations,
  generateModules,
  generatePermissions,
  generateScreens,
  summarizeArchitecture,
};

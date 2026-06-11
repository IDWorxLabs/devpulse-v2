/**
 * DevPulse V2 Requirement Extractor Authority — structured requirement discovery only.
 * Does NOT generate code, execute, modify projects, or replace AiDev/Intent Architecture.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { AIDEV_OWNER_MODULE } from '../aidev-engine/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  attachRequirementsToRequest,
  resetRequirementAiDevBridgeForTests,
} from './requirement-aidev-bridge.js';
import { extractRequirementsWithClarifyingGate } from '../clarifying-question-intelligence/clarifying-question-aidev-bridge.js';
import {
  getLatestRequirementSummary,
  publishRequirementSummary,
  resetRequirementBrainBridgeForTests,
} from './requirement-brain-bridge.js';
import {
  getIntentRequirementSummary,
  mapIntentToRequirementStrategy,
} from './requirement-intent-bridge.js';
import {
  extractConstraints,
  extractFeatures,
  extractPlatforms,
  extractRequirements,
  extractRisks,
  extractSuccessCriteria,
  summarizeRequirements,
} from './requirement-extraction-engine.js';
import { formatRequirementExtractorReport } from './requirement-extractor-report.js';
import type { AiDevRequest } from '../aidev-engine/types.js';
import type {
  ExtractRequirementsInput,
  RequirementExtractionResult,
  RequirementExtractorState,
  RequirementSummary,
} from './types.js';
import { EXTRACTOR_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RequirementExtractorAuthority | null = null;

function createExtractorId(): string {
  return `req-extract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneExtraction(result: RequirementExtractionResult): RequirementExtractionResult {
  return {
    ...result,
    requirements: result.requirements.map((r) => ({
      ...r,
      warnings: [...r.warnings],
      errors: [...r.errors],
    })),
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export class DevPulseV2RequirementExtractorAuthority {
  private readonly extractorId = createExtractorId();
  private readonly extractions: RequirementExtractionResult[] = [];
  private extractorWarnings: string[] = [
    'Requirement Extractor performs extraction only — no code generation, execution, or project modification.',
  ];
  private extractorErrors: string[] = [];

  static readonly ownerModule = EXTRACTOR_OWNER_MODULE;
  static readonly ownerDomain = 'requirement_extractor' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('requirement_extractor');
    return owner.ownerModule === EXTRACTOR_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const extractor = getDevPulseV2Owner('requirement_extractor');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      extractor.ownerModule === EXTRACTOR_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const extractor = new DevPulseV2RequirementExtractorAuthority();
    return (
      typeof (extractor as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (extractor as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const extractor = new DevPulseV2RequirementExtractorAuthority();
    return (
      typeof (extractor as { execute?: unknown }).execute === 'undefined' &&
      typeof (extractor as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const extractor = new DevPulseV2RequirementExtractorAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (extractor as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertDoesNotReplaceAiDev(): boolean {
    return getDevPulseV2Owner('aidev_engine').ownerModule === AIDEV_OWNER_MODULE;
  }

  static assertDoesNotReplaceIntentArchitecture(): boolean {
    return getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE;
  }

  static assertDoesNotReplaceCentralBrain(): boolean {
    return getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  extractAndStore(input: ExtractRequirementsInput): RequirementExtractionResult {
    const result = extractRequirements(input);
    this.extractions.push(cloneExtraction(result));
    return cloneExtraction(result);
  }

  extractFromAiDevRequest(request: AiDevRequest, options?: { projectId?: string }): RequirementExtractionResult {
    const gated = extractRequirementsWithClarifyingGate({ request, projectId: options?.projectId });
    const result = gated.extraction ?? {
      extractionId: `blocked-${request.requestId}`,
      requestId: request.requestId,
      requirements: [],
      warnings: ['Requirement extraction blocked — clarifying questions required.'],
      errors: ['CLARIFICATION_REQUIRED'],
    };
    const attached = attachRequirementsToRequest(request, result);
    this.extractions.push(cloneExtraction(attached));
    return cloneExtraction(attached);
  }

  getExtraction(extractionId: string): RequirementExtractionResult | null {
    const found = this.extractions.find((e) => e.extractionId === extractionId);
    return found ? cloneExtraction(found) : null;
  }

  listExtractions(): RequirementExtractionResult[] {
    return this.extractions.map(cloneExtraction);
  }

  getExtractorState(): RequirementExtractorState {
    return {
      extractorId: this.extractorId,
      extractionCount: this.extractions.length,
      warnings: [...this.extractorWarnings],
      errors: [...this.extractorErrors],
    };
  }

  publishRequirementSummary(result: RequirementExtractionResult): RequirementSummary {
    return publishRequirementSummary(result);
  }

  getLatestRequirementSummary(): RequirementSummary | null {
    return getLatestRequirementSummary();
  }

  mapIntentToRequirementStrategy(userInput: string) {
    return mapIntentToRequirementStrategy(userInput);
  }

  getIntentRequirementSummary(userInput: string): string {
    return getIntentRequirementSummary(userInput);
  }

  formatReport(): string {
    return formatRequirementExtractorReport(this.getExtractorState(), this.listExtractions());
  }
}

export function createDevPulseV2RequirementExtractorAuthority(): DevPulseV2RequirementExtractorAuthority {
  singleton = new DevPulseV2RequirementExtractorAuthority();
  return singleton;
}

export function getDevPulseV2RequirementExtractorAuthority(): DevPulseV2RequirementExtractorAuthority {
  if (!singleton) {
    singleton = new DevPulseV2RequirementExtractorAuthority();
  }
  return singleton;
}

export function resetDevPulseV2RequirementExtractorAuthorityForTests(): DevPulseV2RequirementExtractorAuthority {
  resetRequirementAiDevBridgeForTests();
  resetRequirementBrainBridgeForTests();
  singleton = new DevPulseV2RequirementExtractorAuthority();
  return singleton;
}

export {
  extractConstraints,
  extractFeatures,
  extractPlatforms,
  extractRequirements,
  extractRisks,
  extractSuccessCriteria,
  summarizeRequirements,
};

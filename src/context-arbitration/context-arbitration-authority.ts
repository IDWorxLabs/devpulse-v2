/**
 * DevPulse V2 Context Arbitration Authority — context selection layer.
 * Does NOT answer, execute, generate code, or replace Chat/Central Brain/Intent Architecture.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestArbitrationSummary,
  publishArbitrationSummary,
  resetContextBrainBridgeForTests,
} from './context-brain-bridge.js';
import {
  arbitrateContext,
  buildDefaultCandidates,
  filterContext,
  prioritizeContext,
  summarizeArbitration,
} from './context-arbitration-engine.js';
import {
  assertIntentArchitectureOwnershipUnchanged,
  getIntentContextRequirements,
  mapIntentToContextPriority,
  readLatestIntentTypeForArbitration,
} from './context-intent-bridge.js';
import { formatContextArbitrationReport } from './context-arbitration-report.js';
import type {
  ArbitrationSummary,
  ContextArbitrationResult,
  ContextArbitrationState,
  ContextCandidate,
} from './types.js';
import { CONTEXT_ARBITRATION_OWNER_MODULE } from './types.js';
import type { IntentType } from '../intent-architecture/types.js';

let singleton: DevPulseV2ContextArbitrationAuthority | null = null;

function createArbitrationStateId(): string {
  return `ctx-arb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneResult(result: ContextArbitrationResult): ContextArbitrationResult {
  return {
    ...result,
    selectedContext: result.selectedContext.map((c) => ({ ...c })),
    ignoredContext: result.ignoredContext.map((c) => ({ ...c })),
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export class DevPulseV2ContextArbitrationAuthority {
  private readonly arbitrationStateId = createArbitrationStateId();
  private readonly arbitrations: ContextArbitrationResult[] = [];
  private arbitrationWarnings: string[] = [
    'Context Arbitration performs context selection only — no answers, execution, or code generation.',
  ];
  private arbitrationErrors: string[] = [];

  static readonly ownerModule = CONTEXT_ARBITRATION_OWNER_MODULE;
  static readonly ownerDomain = 'context_arbitration' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('context_arbitration');
    return owner.ownerModule === CONTEXT_ARBITRATION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const arbitration = getDevPulseV2Owner('context_arbitration');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      arbitration.ownerModule === CONTEXT_ARBITRATION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2ContextArbitrationAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2ContextArbitrationAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceCentralBrain(): boolean {
    return getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertDoesNotReplaceIntentArchitecture(): boolean {
    return getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE;
  }

  static assertDoesNotCalculateTrust(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertDoesNotMutateSourceSystems(): boolean {
    const authority = new DevPulseV2ContextArbitrationAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (authority as { createProject?: unknown }).createProject === 'undefined' &&
      typeof (authority as { addEvidence?: unknown }).addEvidence === 'undefined'
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  arbitrateAndStore(
    candidates: ContextCandidate[],
    intentType?: IntentType,
  ): ContextArbitrationResult {
    const resolvedIntent = intentType ?? readLatestIntentTypeForArbitration() ?? undefined;
    const result = arbitrateContext(candidates, { intentType: resolvedIntent });
    this.arbitrations.push(cloneResult(result));
    return cloneResult(result);
  }

  arbitrateWithDefaults(intentType: IntentType): ContextArbitrationResult {
    return this.arbitrateAndStore(buildDefaultCandidates(), intentType);
  }

  getArbitration(arbitrationId: string): ContextArbitrationResult | null {
    const found = this.arbitrations.find((a) => a.arbitrationId === arbitrationId);
    return found ? cloneResult(found) : null;
  }

  listArbitrations(): ContextArbitrationResult[] {
    return this.arbitrations.map(cloneResult);
  }

  getArbitrationState(): ContextArbitrationState {
    return {
      arbitrationId: this.arbitrationStateId,
      arbitrationCount: this.arbitrations.length,
      warnings: [...this.arbitrationWarnings],
      errors: [...this.arbitrationErrors],
    };
  }

  publishArbitrationSummary(result: ContextArbitrationResult): ArbitrationSummary {
    return publishArbitrationSummary(result);
  }

  getLatestArbitrationSummary(): ArbitrationSummary | null {
    return getLatestArbitrationSummary();
  }

  formatReport(): string {
    return formatContextArbitrationReport(this.getArbitrationState(), this.listArbitrations());
  }
}

export function createDevPulseV2ContextArbitrationAuthority(): DevPulseV2ContextArbitrationAuthority {
  singleton = new DevPulseV2ContextArbitrationAuthority();
  return singleton;
}

export function getDevPulseV2ContextArbitrationAuthority(): DevPulseV2ContextArbitrationAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ContextArbitrationAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ContextArbitrationAuthorityForTests(): DevPulseV2ContextArbitrationAuthority {
  resetContextBrainBridgeForTests();
  singleton = new DevPulseV2ContextArbitrationAuthority();
  return singleton;
}

export {
  arbitrateContext,
  assertIntentArchitectureOwnershipUnchanged,
  filterContext,
  getIntentContextRequirements,
  mapIntentToContextPriority,
  prioritizeContext,
  summarizeArbitration,
};

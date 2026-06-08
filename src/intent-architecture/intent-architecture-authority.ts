/**
 * DevPulse V2 Intent Architecture Authority — structured intent understanding layer.
 * Does NOT answer users, execute actions, generate code, or replace Chat/Central Brain.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestIntentSummary,
  publishIntentSummary,
  resetIntentBrainBridgeForTests,
} from './intent-brain-bridge.js';
import { extractIntent, classifyIntent, normalizeIntent, summarizeIntent } from './intent-extractor.js';
import { formatIntentArchitectureReport } from './intent-architecture-report.js';
import type { IntentArchitectureState, IntentRecord, IntentSummary } from './types.js';
import { INTENT_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2IntentArchitectureAuthority | null = null;

function createArchitectureId(): string {
  return `intent-arch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneIntent(intent: IntentRecord): IntentRecord {
  return {
    ...intent,
    extractedGoals: [...intent.extractedGoals],
    extractedConstraints: [...intent.extractedConstraints],
    warnings: [...intent.warnings],
    errors: [...intent.errors],
  };
}

export class DevPulseV2IntentArchitectureAuthority {
  private readonly architectureId = createArchitectureId();
  private readonly intents: IntentRecord[] = [];
  private architectureWarnings: string[] = [
    'Intent Architecture performs understanding only — no answers, execution, or code generation.',
  ];
  private architectureErrors: string[] = [];

  static readonly ownerModule = INTENT_OWNER_MODULE;
  static readonly ownerDomain = 'intent_architecture' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('intent_architecture');
    return owner.ownerModule === INTENT_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const intent = getDevPulseV2Owner('intent_architecture');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      intent.ownerModule === INTENT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const authority = new DevPulseV2IntentArchitectureAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const authority = new DevPulseV2IntentArchitectureAuthority();
    return (
      typeof (authority as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (authority as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceCentralBrain(): boolean {
    return getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertDoesNotCalculateTrust(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertDoesNotMutateProjectVault(): boolean {
    const authority = new DevPulseV2IntentArchitectureAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (authority as { createProject?: unknown }).createProject === 'undefined'
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  extractAndStoreIntent(input: string): IntentRecord {
    const intent = extractIntent(input);
    this.intents.push(cloneIntent(intent));
    return cloneIntent(intent);
  }

  getIntent(intentId: string): IntentRecord | null {
    const found = this.intents.find((i) => i.intentId === intentId);
    return found ? cloneIntent(found) : null;
  }

  listIntents(): IntentRecord[] {
    return this.intents.map(cloneIntent);
  }

  getArchitectureState(): IntentArchitectureState {
    return {
      architectureId: this.architectureId,
      intentCount: this.intents.length,
      warnings: [...this.architectureWarnings],
      errors: [...this.architectureErrors],
    };
  }

  publishIntentSummary(intent: IntentRecord): IntentSummary {
    return publishIntentSummary(intent);
  }

  getLatestIntentSummary(): IntentSummary | null {
    return getLatestIntentSummary();
  }

  formatReport(): string {
    return formatIntentArchitectureReport(this.getArchitectureState(), this.listIntents());
  }
}

export function createDevPulseV2IntentArchitectureAuthority(): DevPulseV2IntentArchitectureAuthority {
  singleton = new DevPulseV2IntentArchitectureAuthority();
  return singleton;
}

export function getDevPulseV2IntentArchitectureAuthority(): DevPulseV2IntentArchitectureAuthority {
  if (!singleton) {
    singleton = new DevPulseV2IntentArchitectureAuthority();
  }
  return singleton;
}

export function resetDevPulseV2IntentArchitectureAuthorityForTests(): DevPulseV2IntentArchitectureAuthority {
  resetIntentBrainBridgeForTests();
  singleton = new DevPulseV2IntentArchitectureAuthority();
  return singleton;
}

export { classifyIntent, extractIntent, normalizeIntent, summarizeIntent };

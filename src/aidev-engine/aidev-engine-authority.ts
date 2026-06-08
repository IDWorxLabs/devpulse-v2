/**
 * DevPulse V2 AiDev Engine Authority — build request intake and reporting only.
 * Does NOT generate code, execute actions, modify projects, or become answer authority.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { PROTECTION_OWNER_MODULE } from '../answer-authority-protection/types.js';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../answer-authority-protection/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { CONTEXT_ARBITRATION_OWNER_MODULE } from '../context-arbitration/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { DevPulseV2VisibleUiGuardAuthority, GUARD_OWNER_MODULE } from '../visible-ui-guard/index.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  attachIntentToRequest,
  getIntentSummaryForRequest,
  resetAiDevIntentBridgeForTests,
} from './aidev-intent-bridge.js';
import {
  getLatestAiDevSummary,
  publishAiDevSummary,
  resetAiDevBrainBridgeForTests,
} from './aidev-brain-bridge.js';
import {
  recordAiDevRequestCreated,
  recordAiDevRequestStatusChanged,
  resetAiDevTimelineBridgeForTests,
} from './aidev-timeline-bridge.js';
import {
  createBuildRequest,
  normalizeBuildRequest,
  summarizeBuildRequest,
  updateRequestStatus,
} from './aidev-request-intake.js';
import { formatAiDevEngineReport } from './aidev-engine-report.js';
import type { AiDevEngineState, AiDevRequest, AiDevRequestStatus, AiDevSummary } from './types.js';
import { AIDEV_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2AiDevEngineAuthority | null = null;

function createEngineId(): string {
  return `aidev-engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRequest(request: AiDevRequest): AiDevRequest {
  return {
    ...request,
    warnings: [...request.warnings],
    errors: [...request.errors],
  };
}

export class DevPulseV2AiDevEngineAuthority {
  private readonly engineId = createEngineId();
  private readonly requests = new Map<string, AiDevRequest>();
  private engineWarnings: string[] = [
    'AiDev Engine Foundation V1 — intake and reporting only, no code generation or execution.',
  ];
  private engineErrors: string[] = [];

  static readonly ownerModule = AIDEV_OWNER_MODULE;
  static readonly ownerDomain = 'aidev_engine' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('aidev_engine');
    return owner.ownerModule === AIDEV_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const aidev = getDevPulseV2Owner('aidev_engine');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      aidev.ownerModule === AIDEV_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const engine = new DevPulseV2AiDevEngineAuthority();
    return (
      typeof (engine as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (engine as { writeCode?: unknown }).writeCode === 'undefined' &&
      typeof (engine as { createFile?: unknown }).createFile === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const engine = new DevPulseV2AiDevEngineAuthority();
    return (
      typeof (engine as { execute?: unknown }).execute === 'undefined' &&
      typeof (engine as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotModifyProjects(): boolean {
    const engine = new DevPulseV2AiDevEngineAuthority();
    return (
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      typeof (engine as { createProject?: unknown }).createProject === 'undefined' &&
      typeof (engine as { modifyProject?: unknown }).modifyProject === 'undefined'
    );
  }

  static assertDoesNotReplaceCentralBrain(): boolean {
    return getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertDoesNotReplaceIntentArchitecture(): boolean {
    return getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE;
  }

  static assertDoesNotReplaceContextArbitration(): boolean {
    return getDevPulseV2Owner('context_arbitration').ownerModule === CONTEXT_ARBITRATION_OWNER_MODULE;
  }

  static assertAnswerAuthorityProtectionCompatible(): boolean {
    return (
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE
    );
  }

  static assertVisibleUiGuardCompatible(): boolean {
    return (
      DevPulseV2VisibleUiGuardAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  intakeBuildRequest(userInput: string): AiDevRequest {
    const request = createBuildRequest(userInput);
    this.requests.set(request.requestId, cloneRequest(request));
    recordAiDevRequestCreated(request);
    return cloneRequest(request);
  }

  attachIntent(requestId: string): AiDevRequest | null {
    const existing = this.requests.get(requestId);
    if (!existing) return null;
    const withIntent = attachIntentToRequest(existing);
    const analyzing = updateRequestStatus(withIntent, 'ANALYZING');
    this.requests.set(requestId, cloneRequest(analyzing));
    recordAiDevRequestStatusChanged(analyzing, existing.status);
    return cloneRequest(analyzing);
  }

  setRequestStatus(requestId: string, status: AiDevRequestStatus): AiDevRequest | null {
    const existing = this.requests.get(requestId);
    if (!existing) return null;
    const previous = existing.status;
    const updated = updateRequestStatus(existing, status);
    this.requests.set(requestId, cloneRequest(updated));
    if (previous !== status) {
      recordAiDevRequestStatusChanged(updated, previous);
    }
    return cloneRequest(updated);
  }

  getRequest(requestId: string): AiDevRequest | null {
    const found = this.requests.get(requestId);
    return found ? cloneRequest(found) : null;
  }

  listRequests(): AiDevRequest[] {
    return [...this.requests.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(cloneRequest);
  }

  getEngineState(): AiDevEngineState {
    return {
      engineId: this.engineId,
      requestCount: this.requests.size,
      warnings: [...this.engineWarnings],
      errors: [...this.engineErrors],
    };
  }

  publishAiDevSummary(request: AiDevRequest): AiDevSummary {
    return publishAiDevSummary(request);
  }

  getLatestAiDevSummary(): AiDevSummary | null {
    return getLatestAiDevSummary();
  }

  getIntentSummaryForRequest(requestId: string) {
    return getIntentSummaryForRequest(requestId);
  }

  formatReport(): string {
    return formatAiDevEngineReport(this.getEngineState(), this.listRequests());
  }
}

export function createDevPulseV2AiDevEngineAuthority(): DevPulseV2AiDevEngineAuthority {
  singleton = new DevPulseV2AiDevEngineAuthority();
  return singleton;
}

export function getDevPulseV2AiDevEngineAuthority(): DevPulseV2AiDevEngineAuthority {
  if (!singleton) {
    singleton = new DevPulseV2AiDevEngineAuthority();
  }
  return singleton;
}

export function resetDevPulseV2AiDevEngineAuthorityForTests(): DevPulseV2AiDevEngineAuthority {
  resetAiDevIntentBridgeForTests();
  resetAiDevBrainBridgeForTests();
  resetAiDevTimelineBridgeForTests();
  singleton = new DevPulseV2AiDevEngineAuthority();
  return singleton;
}

export {
  createBuildRequest,
  normalizeBuildRequest,
  summarizeBuildRequest,
  updateRequestStatus,
};

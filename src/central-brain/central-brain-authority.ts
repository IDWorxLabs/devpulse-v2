/**
 * DevPulse V2 Central Brain Authority — shared awareness and coordination layer.
 * Does NOT answer users, calculate trust, execute actions, or replace source authorities.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { REGISTRY_OWNER_MODULE } from '../evidence-registry/types.js';
import { VAULT_OWNER_MODULE } from '../project-vault/types.js';
import { LEDGER_OWNER_MODULE } from '../timeline-ledger/types.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import { formatCentralBrainReport } from './central-brain-report.js';
import { readAllSystemSummaries, readSystemSummary } from './system-awareness-adapters.js';
import type { BrainState, BrainSystemSummary, ObservedSystemId } from './types.js';
import { CENTRAL_BRAIN_OWNER_MODULE, OBSERVED_SYSTEM_IDS } from './types.js';

let singleton: DevPulseV2CentralBrainAuthority | null = null;

function createBrainId(): string {
  return `brain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneState(state: BrainState): BrainState {
  return {
    ...state,
    systems: state.systems.map((s) => ({ ...s })),
    warnings: [...state.warnings],
    errors: [...state.errors],
  };
}

export class DevPulseV2CentralBrainAuthority {
  private state: BrainState = {
    brainId: createBrainId(),
    createdAt: Date.now(),
    systems: [],
    warnings: [
      'Central Brain coordinates awareness only — it does not answer, execute, or calculate trust.',
    ],
    errors: [],
  };

  static readonly ownerModule = CENTRAL_BRAIN_OWNER_MODULE;
  static readonly ownerDomain = 'central_brain' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('central_brain');
    return owner.ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const brain = getDevPulseV2Owner('central_brain');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      brain.ownerModule === CENTRAL_BRAIN_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotCalculateTrust(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertDoesNotExecuteActions(): boolean {
    const brain = new DevPulseV2CentralBrainAuthority();
    return (
      typeof (brain as { execute?: unknown }).execute === 'undefined' &&
      typeof (brain as { evaluateTrust?: unknown }).evaluateTrust === 'undefined' &&
      typeof (brain as { calculateTrustScore?: unknown }).calculateTrustScore === 'undefined'
    );
  }

  static assertDoesNotReplaceOtherAuthorities(): boolean {
    return (
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE &&
      getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  collectSystemSummaries(): BrainSystemSummary[] {
    const summaries = readAllSystemSummaries();
    this.state.systems = summaries.map((s) => ({ ...s }));
    return summaries.map((s) => ({ ...s }));
  }

  getSystemSummary(systemId: string): BrainSystemSummary | null {
    if (!OBSERVED_SYSTEM_IDS.includes(systemId as ObservedSystemId)) {
      this.state.errors.push(`Unknown system id for awareness read: ${systemId}`);
      return null;
    }
    const summary = readSystemSummary(systemId as ObservedSystemId);
    const index = this.state.systems.findIndex((s) => s.systemId === systemId);
    if (index >= 0) {
      this.state.systems[index] = { ...summary };
    } else {
      this.state.systems.push({ ...summary });
    }
    return { ...summary };
  }

  getBrainState(): BrainState {
    return cloneState(this.state);
  }

  formatReport(): string {
    return formatCentralBrainReport(this.state);
  }
}

export function createDevPulseV2CentralBrainAuthority(): DevPulseV2CentralBrainAuthority {
  singleton = new DevPulseV2CentralBrainAuthority();
  return singleton;
}

export function getDevPulseV2CentralBrainAuthority(): DevPulseV2CentralBrainAuthority {
  if (!singleton) {
    singleton = new DevPulseV2CentralBrainAuthority();
  }
  return singleton;
}

export function resetDevPulseV2CentralBrainAuthorityForTests(): DevPulseV2CentralBrainAuthority {
  singleton = new DevPulseV2CentralBrainAuthority();
  return singleton;
}

/**
 * DevPulse V2 Execution Authority — execution governance only.
 * Does NOT execute commands, modify files, run actions, perform recovery, or approve itself.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../answer-authority-protection/index.js';
import { PROTECTION_OWNER_MODULE } from '../answer-authority-protection/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getLatestExecutionAuthoritySummary,
  publishExecutionAuthoritySummary,
  resetExecutionBrainBridgeForTests,
} from './execution-brain-bridge.js';
import {
  evaluateExecutionRequest,
  summarizeExecutionDecision,
} from './execution-policy-engine.js';
import { formatExecutionAuthorityReport } from './execution-authority-report.js';
import {
  assertAllFoundationSystemsNonExecuting,
  validateFoundationSystemsNonExecuting,
} from './execution-system-guardrail.js';
import {
  getLastExecutionDecisionEventId,
  recordExecutionDecisionEvent,
  resetExecutionTimelineBridgeForTests,
} from './execution-timeline-bridge.js';
import type {
  ExecutionAuthorityState,
  ExecutionAuthoritySummary,
  ExecutionDecision,
  ExecutionRequest,
} from './types.js';
import { EXECUTION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ExecutionAuthority | null = null;

function createAuthorityId(): string {
  return `execution-authority-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneDecision(decision: ExecutionDecision): ExecutionDecision {
  return {
    ...decision,
    warnings: [...decision.warnings],
    errors: [...decision.errors],
  };
}

export class DevPulseV2ExecutionAuthority {
  private readonly authorityId = createAuthorityId();
  private readonly decisions: ExecutionDecision[] = [];
  private authorityWarnings: string[] = [
    'Execution Authority Foundation V1 — governance and classification only. No execution, file modification, or command running.',
  ];
  private authorityErrors: string[] = [];

  static readonly ownerModule = EXECUTION_OWNER_MODULE;
  static readonly ownerDomain = 'execution_authority' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('execution_authority');
    return owner.ownerModule === EXECUTION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const execution = getDevPulseV2Owner('execution_authority');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      execution.ownerModule === EXECUTION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecute(): boolean {
    const authority = new DevPulseV2ExecutionAuthority();
    return (
      typeof (authority as { execute?: unknown }).execute === 'undefined' &&
      typeof (authority as { runAction?: unknown }).runAction === 'undefined' &&
      typeof (authority as { runCommand?: unknown }).runCommand === 'undefined'
    );
  }

  static assertDoesNotModifyFiles(): boolean {
    const authority = new DevPulseV2ExecutionAuthority();
    return (
      typeof (authority as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (authority as { modifyFile?: unknown }).modifyFile === 'undefined' &&
      typeof (authority as { applyPatch?: unknown }).applyPatch === 'undefined'
    );
  }

  static assertDoesNotRunCommands(): boolean {
    const authority = new DevPulseV2ExecutionAuthority();
    return (
      typeof (authority as { executeCommand?: unknown }).executeCommand === 'undefined' &&
      typeof (authority as { runShell?: unknown }).runShell === 'undefined'
    );
  }

  static assertDoesNotApproveItself(): boolean {
    const authority = new DevPulseV2ExecutionAuthority();
    return (
      typeof (authority as { approveExecution?: unknown }).approveExecution === 'undefined' &&
      typeof (authority as { selfApprove?: unknown }).selfApprove === 'undefined' &&
      typeof (authority as { grantExecutionPermission?: unknown }).grantExecutionPermission ===
        'undefined'
    );
  }

  static assertAnswerAuthorityProtectionCompatible(): boolean {
    return (
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  evaluateRequest(request: ExecutionRequest): ExecutionDecision {
    const decision = evaluateExecutionRequest(request);
    this.decisions.push(cloneDecision(decision));
    recordExecutionDecisionEvent(decision);
    publishExecutionAuthoritySummary(this.buildSummary());
    return cloneDecision(decision);
  }

  getDecisions(): ExecutionDecision[] {
    return this.decisions.map(cloneDecision);
  }

  getAuthorityState(): ExecutionAuthorityState {
    const blockedCount = this.decisions.filter((d) => !d.allowed).length;
    const allowedReadOnlyCount = this.decisions.filter(
      (d) => d.allowed && d.classification === 'READ_ONLY',
    ).length;
    return {
      authorityId: this.authorityId,
      decisionCount: this.decisions.length,
      blockedCount,
      allowedReadOnlyCount,
      warnings: [...this.authorityWarnings],
      errors: [...this.authorityErrors],
    };
  }

  buildSummary(): ExecutionAuthoritySummary {
    const state = this.getAuthorityState();
    return {
      authorityId: state.authorityId,
      decisionCount: state.decisionCount,
      blockedCount: state.blockedCount,
      allowedReadOnlyCount: state.allowedReadOnlyCount,
      summary: `${state.decisionCount} decision(s): ${state.allowedReadOnlyCount} read-only allowed, ${state.blockedCount} blocked.`,
      publishedAt: Date.now(),
    };
  }

  getLatestSummary(): ExecutionAuthoritySummary | null {
    return getLatestExecutionAuthoritySummary();
  }

  getLastTimelineEventId(): string | null {
    return getLastExecutionDecisionEventId();
  }

  runSystemGuardrailCheck(): boolean {
    return assertAllFoundationSystemsNonExecuting();
  }

  formatReport(): string {
    return formatExecutionAuthorityReport(this.getAuthorityState(), this.getDecisions());
  }
}

export function createDevPulseV2ExecutionAuthority(): DevPulseV2ExecutionAuthority {
  singleton = new DevPulseV2ExecutionAuthority();
  return singleton;
}

export function getDevPulseV2ExecutionAuthority(): DevPulseV2ExecutionAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ExecutionAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ExecutionAuthorityForTests(): DevPulseV2ExecutionAuthority {
  resetExecutionBrainBridgeForTests();
  resetExecutionTimelineBridgeForTests();
  singleton = new DevPulseV2ExecutionAuthority();
  return singleton;
}

export {
  assertAllFoundationSystemsNonExecuting,
  evaluateExecutionRequest,
  summarizeExecutionDecision,
  validateFoundationSystemsNonExecuting,
};

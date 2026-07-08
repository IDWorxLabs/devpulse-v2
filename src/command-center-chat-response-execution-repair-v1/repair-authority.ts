/**
 * Command Center Chat Response Execution Repair V1 — execution gate authority.
 */

import {
  CHAT_RESPONSE_REPAIR_AUDIT_EVENTS,
  FETCH_WATCHDOG_MS,
  POST_RENDER_STOPPED_MESSAGE,
} from './repair-events.js';

export interface ChatExecutionGateInput {
  localRuntimeHealthy: boolean;
  healthReady: boolean;
  truthFresh: boolean;
  runtimeTruthReady: boolean;
  runtimeTruthClassifyAllowed: boolean;
  runtimeReadinessLifecycle: string;
  autonomousBuilderConnected?: boolean;
}

export interface ChatExecutionGateResult {
  readOnly: true;
  allowed: boolean;
  degraded: boolean;
  blocked: boolean;
  awaitingHealthPoll: boolean;
  blockReason: string | null;
  blockingLayer: string | null;
  suggestedAction: string | null;
  auditEvent: string | null;
}

export interface SessionRepairInput {
  activeProjectId: string | null;
  activeSessionId: string | null;
  hydrationState: string;
  hasSessionContinuityApi: boolean;
  isLikelyBuildPrompt?: boolean;
}

export interface SessionRepairResult {
  readOnly: true;
  needsRepair: boolean;
  canContinue: boolean;
  reason: string | null;
}

export function evaluateChatExecutionGate(input: ChatExecutionGateInput): ChatExecutionGateResult {
  const healthReady = input.healthReady === true;
  const localHealthy = input.localRuntimeHealthy === true;
  const truthFresh = input.truthFresh === true;
  const lifecycle = input.runtimeReadinessLifecycle || 'UNAVAILABLE';

  if (!localHealthy && !healthReady) {
    if (lifecycle === 'CHECKING_HEALTH' || lifecycle === 'DEGRADED' || lifecycle === 'STARTING') {
      return {
        readOnly: true,
        allowed: false,
        degraded: false,
        blocked: false,
        awaitingHealthPoll: true,
        blockReason: 'Awaiting local runtime health confirmation',
        blockingLayer: 'browser.runtime_health_poll',
        suggestedAction: 'Wait for health poll or restart AiDevEngine',
        auditEvent: null,
      };
    }
    return {
      readOnly: true,
      allowed: false,
      degraded: false,
      blocked: true,
      awaitingHealthPoll: false,
      blockReason: 'Local runtime unhealthy — brain API unavailable',
      blockingLayer: 'browser.local_runtime_health',
      suggestedAction: 'Restart AiDevEngine using Start-AiDevEngine',
      auditEvent: CHAT_RESPONSE_REPAIR_AUDIT_EVENTS.VISIBLE_BLOCKING_ERROR_SHOWN,
    };
  }

  if (healthReady && !truthFresh) {
    return {
      readOnly: true,
      allowed: true,
      degraded: true,
      blocked: false,
      awaitingHealthPoll: false,
      blockReason: null,
      blockingLayer: null,
      suggestedAction: null,
      auditEvent: CHAT_RESPONSE_REPAIR_AUDIT_EVENTS.DEGRADED_RUNTIME_TRUTH_CONTINUE,
    };
  }

  if (!input.runtimeTruthReady || !input.runtimeTruthClassifyAllowed) {
    if (healthReady) {
      return {
        readOnly: true,
        allowed: true,
        degraded: true,
        blocked: false,
        awaitingHealthPoll: false,
        blockReason: null,
        blockingLayer: null,
        suggestedAction: null,
        auditEvent: CHAT_RESPONSE_REPAIR_AUDIT_EVENTS.DEGRADED_RUNTIME_TRUTH_CONTINUE,
      };
    }
    return {
      readOnly: true,
      allowed: false,
      degraded: false,
      blocked: true,
      awaitingHealthPoll: false,
      blockReason: 'Runtime truth stale and brain health not ready',
      blockingLayer: 'browser.runtime_truth_gate',
      suggestedAction: 'Restart npm run dev and reload Command Center',
      auditEvent: CHAT_RESPONSE_REPAIR_AUDIT_EVENTS.VISIBLE_BLOCKING_ERROR_SHOWN,
    };
  }

  return {
    readOnly: true,
    allowed: true,
    degraded: false,
    blocked: false,
    awaitingHealthPoll: false,
    blockReason: null,
    blockingLayer: null,
    suggestedAction: null,
    auditEvent: null,
  };
}

export function evaluateSessionRepair(input: SessionRepairInput): SessionRepairResult {
  if (!input.hasSessionContinuityApi) {
    return {
      readOnly: true,
      needsRepair: false,
      canContinue: true,
      reason: 'Session continuity API unavailable — server will bootstrap',
    };
  }
  if (input.isLikelyBuildPrompt && !input.activeProjectId) {
    return {
      readOnly: true,
      needsRepair: false,
      canContinue: true,
      reason: 'Build prompt without active project — server will bootstrap project context',
    };
  }
  if (input.isLikelyBuildPrompt && input.hydrationState === 'loading') {
    return {
      readOnly: true,
      needsRepair: false,
      canContinue: true,
      reason: 'Build prompt during session hydration — server will bootstrap',
    };
  }
  if (input.hydrationState === 'loading') {
    return {
      readOnly: true,
      needsRepair: true,
      canContinue: false,
      reason: 'Session hydration in progress',
    };
  }
  if (input.activeProjectId && !input.activeSessionId && input.hydrationState === 'empty') {
    return {
      readOnly: true,
      needsRepair: true,
      canContinue: true,
      reason: 'Active project missing session — will hydrate or bootstrap',
    };
  }
  return {
    readOnly: true,
    needsRepair: false,
    canContinue: true,
    reason: null,
  };
}

export function buildPostRenderStoppedDiagnostic(input: {
  auditId: string;
  blockingReason: string;
  lastSuccessfulStage: string;
  suggestedAction: string;
}): {
  readOnly: true;
  message: typeof POST_RENDER_STOPPED_MESSAGE;
  auditId: string;
  blockingReason: string;
  lastSuccessfulStage: string;
  suggestedAction: string;
} {
  return {
    readOnly: true,
    message: POST_RENDER_STOPPED_MESSAGE,
    auditId: input.auditId,
    blockingReason: input.blockingReason,
    lastSuccessfulStage: input.lastSuccessfulStage,
    suggestedAction: input.suggestedAction,
  };
}

export { FETCH_WATCHDOG_MS, POST_RENDER_STOPPED_MESSAGE, CHAT_RESPONSE_REPAIR_AUDIT_EVENTS };

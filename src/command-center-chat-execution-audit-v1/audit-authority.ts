/**
 * Command Center Chat Execution Audit V1 — audit authority and summary builder.
 */

import { COMMAND_CENTER_CHAT_AUDIT_EVENTS, type CommandCenterChatAuditEventName } from './audit-events.js';
import {
  getChatExecutionAuditTrail,
  getLatestChatExecutionAuditTrail,
  storeChatExecutionAuditTrail,
} from './audit-store.js';
import type {
  ChatExecutionAuditEvent,
  ChatExecutionAuditSummary,
  ChatExecutionAuditTrail,
  ChatExecutionAuditOutcome,
  RecordChatExecutionAuditEventInput,
  StartChatExecutionAuditInput,
} from './audit-types.js';
import { COMMAND_CENTER_CHAT_EXECUTION_AUDIT_CONTRACT_VERSION } from './audit-types.js';

function createEvent(input: RecordChatExecutionAuditEventInput): ChatExecutionAuditEvent {
  return {
    readOnly: true,
    eventId: `${input.auditId}-${input.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    auditId: input.auditId,
    timestamp: Date.now(),
    layer: input.layer,
    name: input.name,
    detail: input.detail,
    metadata: input.metadata,
  };
}

function buildSummary(events: ChatExecutionAuditEvent[]): ChatExecutionAuditSummary {
  const has = (name: string) => events.some((event) => event.name === name);
  const findDetail = (name: string) => events.find((event) => event.name === name)?.detail ?? null;
  const bridgeSkip = events.find((event) => event.name === COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_SKIP);
  const noOp = events.find((event) => event.name === COMMAND_CENTER_CHAT_AUDIT_EVENTS.NO_OP_DETECTED);
  const fetchResponse = events.find((event) => event.name === COMMAND_CENTER_CHAT_AUDIT_EVENTS.FETCH_RESPONSE);

  return {
    readOnly: true,
    browserSubmitReached:
      has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.FORM_SUBMIT_ENTER) ||
      has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.ASK_BRAIN_ENTER),
    fetchStarted: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.FETCH_START),
    fetchCompleted: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.FETCH_RESPONSE),
    serverHandlerReached: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.HANDLER_ENTER),
    buildIntentDecisionRecorded: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.BUILD_INTENT_DECISION),
    bridgeInvoked: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_INVOKE),
    bridgeSkipped: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_SKIP),
    bridgeSkipReason: bridgeSkip?.detail ?? null,
    firstBridgeEventRecorded: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_FIRST_EVENT),
    aseInvoked: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ASE_INVOKE),
    traceRenderAttempted: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.TRACE_RENDER_START),
    traceRenderEmpty: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.TRACE_RENDER_EMPTY),
    responseRendered: has(COMMAND_CENTER_CHAT_AUDIT_EVENTS.RESPONSE_RENDERED),
    noOpDetected: Boolean(noOp),
    noOpReason: noOp?.detail ?? findDetail(COMMAND_CENTER_CHAT_AUDIT_EVENTS.ASK_BRAIN_BLOCKED_RUNTIME_TRUTH) ??
      findDetail(COMMAND_CENTER_CHAT_AUDIT_EVENTS.ASK_BRAIN_BLOCKED_RUNTIME_HEALTH) ??
      findDetail(COMMAND_CENTER_CHAT_AUDIT_EVENTS.ASK_BRAIN_BLOCKED_RUNTIME_POLL_FAILED) ??
      findDetail(COMMAND_CENTER_CHAT_AUDIT_EVENTS.FORM_SUBMIT_EMPTY_MESSAGE) ??
      findDetail(COMMAND_CENTER_CHAT_AUDIT_EVENTS.FORM_SUBMIT_NO_INPUT) ??
      null,
    bridgeHeaderPresent:
      fetchResponse?.metadata?.bridgeHeaderPresent != null
        ? Boolean(fetchResponse.metadata.bridgeHeaderPresent)
        : null,
    responseStatus:
      typeof fetchResponse?.metadata?.status === 'number' ? fetchResponse.metadata.status : null,
  };
}

function refreshTrail(trail: ChatExecutionAuditTrail): ChatExecutionAuditTrail {
  const updated: ChatExecutionAuditTrail = {
    ...trail,
    updatedAt: Date.now(),
    summary: buildSummary(trail.events),
    noOpReason: buildSummary(trail.events).noOpReason,
  };
  storeChatExecutionAuditTrail(updated);
  return updated;
}

export function startChatExecutionAudit(input: StartChatExecutionAuditInput): ChatExecutionAuditTrail {
  const now = Date.now();
  const events: ChatExecutionAuditEvent[] = [];

  if (input.sendButtonDisabled) {
    events.push(
      createEvent({
        auditId: input.auditId,
        layer: 'browser',
        name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.SEND_BUTTON_DISABLED,
        detail: 'Send button disabled — runtime not healthy.',
        metadata: {
          runtimeTruthReady: input.runtimeTruthReady ?? false,
          localRuntimeHealthy: input.localRuntimeHealthy ?? false,
        },
      }),
    );
  }

  const trail: ChatExecutionAuditTrail = {
    readOnly: true,
    contractVersion: COMMAND_CENTER_CHAT_EXECUTION_AUDIT_CONTRACT_VERSION,
    auditId: input.auditId,
    messagePreview: input.messagePreview.slice(0, 160),
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    outcome: 'IN_PROGRESS',
    noOpReason: null,
    activeProjectId: input.activeProjectId ?? null,
    activeSessionId: input.activeSessionId ?? null,
    projectName: input.projectName ?? null,
    events,
    summary: buildSummary(events),
  };
  storeChatExecutionAuditTrail(trail);
  return trail;
}

export function recordChatExecutionAuditEvent(
  input: RecordChatExecutionAuditEventInput,
): ChatExecutionAuditTrail | null {
  let trail = getChatExecutionAuditTrail(input.auditId);
  if (!trail) {
    trail = startChatExecutionAudit({
      auditId: input.auditId,
      messagePreview: input.detail.slice(0, 160),
    });
  }

  const event = createEvent(input);
  const updated: ChatExecutionAuditTrail = {
    ...trail,
    events: [...trail.events, event],
    updatedAt: Date.now(),
  };

  if (input.name === COMMAND_CENTER_CHAT_AUDIT_EVENTS.NO_OP_DETECTED) {
    updated.outcome = 'NO_OP';
    updated.noOpReason = input.detail;
    updated.completedAt = Date.now();
  }

  storeChatExecutionAuditTrail(refreshTrail(updated));
  return getChatExecutionAuditTrail(input.auditId);
}

export function finalizeChatExecutionAudit(input: {
  auditId: string;
  outcome: ChatExecutionAuditOutcome;
  noOpReason?: string | null;
}): ChatExecutionAuditTrail | null {
  const trail = getChatExecutionAuditTrail(input.auditId);
  if (!trail) return null;

  const updated: ChatExecutionAuditTrail = {
    ...trail,
    outcome: input.outcome,
    noOpReason: input.noOpReason ?? trail.noOpReason,
    completedAt: Date.now(),
    updatedAt: Date.now(),
  };
  storeChatExecutionAuditTrail(refreshTrail(updated));
  return getChatExecutionAuditTrail(input.auditId);
}

export function attachChatExecutionAuditToPayload(
  payload: Record<string, unknown>,
  auditId: string,
): Record<string, unknown> {
  const trail = getChatExecutionAuditTrail(auditId);
  if (!trail) return payload;
  return {
    ...payload,
    chatExecutionAudit: {
      contractVersion: COMMAND_CENTER_CHAT_EXECUTION_AUDIT_CONTRACT_VERSION,
      auditId: trail.auditId,
      outcome: trail.outcome,
      noOpReason: trail.noOpReason,
      summary: trail.summary,
      eventCount: trail.events.length,
    },
  };
}

export function getLatestChatExecutionAudit(): ChatExecutionAuditTrail | null {
  return getLatestChatExecutionAuditTrail();
}

export function recordNoOpIfSilentReturn(input: {
  auditId: string;
  reason: string;
  layer: RecordChatExecutionAuditEventInput['layer'];
  blockingEvent: CommandCenterChatAuditEventName | string;
}): void {
  recordChatExecutionAuditEvent({
    auditId: input.auditId,
    layer: input.layer,
    name: input.blockingEvent,
    detail: input.reason,
  });
  recordChatExecutionAuditEvent({
    auditId: input.auditId,
    layer: input.layer,
    name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.NO_OP_DETECTED,
    detail: input.reason,
  });
  finalizeChatExecutionAudit({
    auditId: input.auditId,
    outcome: 'NO_OP',
    noOpReason: input.reason,
  });
}

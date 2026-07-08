/**
 * Command Center Chat Execution Audit V1 — types.
 */

import type { CommandCenterChatAuditEventName } from './audit-events.js';

export const COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1_PASS_TOKEN =
  'COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1_PASS' as const;

export const COMMAND_CENTER_CHAT_EXECUTION_AUDIT_CONTRACT_VERSION =
  'COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1' as const;

export const COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH =
  '/api/command-center/chat-execution-audit/latest' as const;

export const COMMAND_CENTER_CHAT_EXECUTION_AUDIT_EVENT_PATH =
  '/api/command-center/chat-execution-audit/event' as const;

export type ChatExecutionAuditLayer =
  | 'browser'
  | 'network'
  | 'server'
  | 'bridge'
  | 'trace_ui';

export type ChatExecutionAuditOutcome =
  | 'IN_PROGRESS'
  | 'BUILD_STARTED'
  | 'BUILD_FAILED'
  | 'CHAT_ONLY'
  | 'BLOCKED'
  | 'ALIGNMENT_REQUIRED'
  | 'RESUME_REQUIRED'
  | 'NEW_BUILD_CONFIRMATION_REQUIRED'
  | 'FAILED'
  | 'NO_OP'
  | 'COMPLETE';

export interface ChatExecutionAuditEvent {
  readOnly: true;
  eventId: string;
  auditId: string;
  timestamp: number;
  layer: ChatExecutionAuditLayer;
  name: CommandCenterChatAuditEventName | string;
  detail: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
}

export interface ChatExecutionAuditTrail {
  readOnly: true;
  contractVersion: typeof COMMAND_CENTER_CHAT_EXECUTION_AUDIT_CONTRACT_VERSION;
  auditId: string;
  messagePreview: string;
  startedAt: number;
  updatedAt: number;
  completedAt: number | null;
  outcome: ChatExecutionAuditOutcome;
  noOpReason: string | null;
  activeProjectId: string | null;
  activeSessionId: string | null;
  projectName: string | null;
  events: ChatExecutionAuditEvent[];
  summary: ChatExecutionAuditSummary;
}

export interface ChatExecutionAuditSummary {
  readOnly: true;
  browserSubmitReached: boolean;
  fetchStarted: boolean;
  fetchCompleted: boolean;
  serverHandlerReached: boolean;
  buildIntentDecisionRecorded: boolean;
  bridgeInvoked: boolean;
  bridgeSkipped: boolean;
  bridgeSkipReason: string | null;
  firstBridgeEventRecorded: boolean;
  aseInvoked: boolean;
  traceRenderAttempted: boolean;
  traceRenderEmpty: boolean;
  responseRendered: boolean;
  noOpDetected: boolean;
  noOpReason: string | null;
  bridgeHeaderPresent: boolean | null;
  responseStatus: number | null;
}

export interface StartChatExecutionAuditInput {
  auditId: string;
  messagePreview: string;
  activeProjectId?: string | null;
  activeSessionId?: string | null;
  projectName?: string | null;
  sendButtonDisabled?: boolean;
  runtimeTruthReady?: boolean;
  localRuntimeHealthy?: boolean;
}

export interface RecordChatExecutionAuditEventInput {
  auditId: string;
  layer: ChatExecutionAuditLayer;
  name: CommandCenterChatAuditEventName | string;
  detail: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
}

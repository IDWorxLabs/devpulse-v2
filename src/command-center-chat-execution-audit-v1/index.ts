/**
 * Command Center Chat Execution Audit V1 — public API.
 */

export {
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_V1_PASS_TOKEN,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_CONTRACT_VERSION,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_EVENT_PATH,
} from './audit-types.js';

export type {
  ChatExecutionAuditEvent,
  ChatExecutionAuditTrail,
  ChatExecutionAuditSummary,
  ChatExecutionAuditLayer,
  ChatExecutionAuditOutcome,
  StartChatExecutionAuditInput,
  RecordChatExecutionAuditEventInput,
} from './audit-types.js';

export {
  COMMAND_CENTER_CHAT_AUDIT_PREFIX,
  COMMAND_CENTER_CHAT_AUDIT_EVENTS,
} from './audit-events.js';

export {
  startChatExecutionAudit,
  recordChatExecutionAuditEvent,
  finalizeChatExecutionAudit,
  attachChatExecutionAuditToPayload,
  getLatestChatExecutionAudit,
  recordNoOpIfSilentReturn,
} from './audit-authority.js';

export {
  getChatExecutionAuditTrail,
  getLatestChatExecutionAuditTrail,
  resetChatExecutionAuditStoreForTests,
} from './audit-store.js';

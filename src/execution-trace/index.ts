/**
 * Execution Trace & Conversational Architecture V1 — public surface.
 */

export {
  EXECUTION_TRACE_ARCHITECTURE_V1_PASS_TOKEN,
  CHAT_MECHANICAL_RUNTIME_MARKERS,
  EXECUTION_TRACE_CONVERSATIONAL_MARKERS,
  type ExecutionTraceEvent,
  type ExecutionTraceEvidenceBundle,
  type ExecutionTraceEvidenceSummary,
  type ExecutionTraceEventMetadata,
  type ExecutionTraceSeverity,
  type ExecutionTraceStatus,
  type ExecutionTraceViewMode,
} from './execution-trace-types.js';

export {
  operatorFeedEventToExecutionTrace,
  executionTraceEventToOperatorFeed,
  operatorFeedEventsToExecutionTrace,
  executionTraceEventsToOperatorFeed,
} from './execution-trace-legacy-adapters.js';

export {
  createExecutionTraceEvidenceBundle,
  executionTraceEvidenceForLlm,
} from './execution-trace-evidence-store.js';

export {
  filterExecutionTraceEvents,
  searchExecutionTraceEvents,
} from './execution-trace-mode-filter.js';

export {
  chatContainsMechanicalRuntimeDump,
  executionTraceContainsConversationalLanguage,
  isConversationalChatResponse,
} from './execution-trace-chat-guards.js';

export {
  buildOnePromptExecutionTraceEvents,
  buildOnePromptExecutionTraceEvidence,
  buildOnePromptOperatorFeedEvents,
} from './build-execution-trace-events.js';

/** @deprecated Use executionTraceEvents */
export const operatorFeedEventsAlias = 'executionTraceEvents';

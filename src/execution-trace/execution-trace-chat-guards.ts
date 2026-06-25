/**
 * Guards separating Chat (conversation) from Execution Trace (evidence).
 */

import {
  CHAT_MECHANICAL_RUNTIME_MARKERS,
  EXECUTION_TRACE_CONVERSATIONAL_MARKERS,
} from './execution-trace-types.js';

export function chatContainsMechanicalRuntimeDump(text: string): boolean {
  let hits = 0;
  for (const marker of CHAT_MECHANICAL_RUNTIME_MARKERS) {
    if (text.includes(marker)) hits += 1;
  }
  return hits >= 2;
}

export function executionTraceContainsConversationalLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return EXECUTION_TRACE_CONVERSATIONAL_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

export function isConversationalChatResponse(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (chatContainsMechanicalRuntimeDump(trimmed)) return false;
  return trimmed.length > 40;
}

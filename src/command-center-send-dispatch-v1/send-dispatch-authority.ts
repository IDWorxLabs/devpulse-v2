/**
 * Command Center Send Dispatch V1 — shared submit guards and diagnostics.
 */

export const COMMAND_CENTER_SEND_CLICKED = 'COMMAND_CENTER_SEND_CLICKED' as const;
export const COMMAND_CENTER_SUBMIT_STARTED = 'COMMAND_CENTER_SUBMIT_STARTED' as const;
export const COMMAND_CENTER_BRAIN_POST_SENT = 'COMMAND_CENTER_BRAIN_POST_SENT' as const;
export const COMMAND_CENTER_BRAIN_RESPONSE_RECEIVED = 'COMMAND_CENTER_BRAIN_RESPONSE_RECEIVED' as const;
export const COMMAND_CENTER_SUBMIT_BLOCKED = 'COMMAND_CENTER_SUBMIT_BLOCKED' as const;
export const COMMAND_CENTER_SEND_DISPATCH_V1_PASS = 'COMMAND_CENTER_SEND_DISPATCH_V1_PASS' as const;

export const COMMAND_CENTER_SEND_DIAGNOSTIC_TOKENS = [
  COMMAND_CENTER_SEND_CLICKED,
  COMMAND_CENTER_SUBMIT_STARTED,
  COMMAND_CENTER_BRAIN_POST_SENT,
  COMMAND_CENTER_BRAIN_RESPONSE_RECEIVED,
  COMMAND_CENTER_SUBMIT_BLOCKED,
] as const;

const BUILD_VERB_PATTERN = /\b(build|create|make)\b/i;
const BUILD_TARGET_PATTERN =
  /\b(app|application|calculator|todo|tracker|website|saas|portal|dashboard|system|platform|software|product|feature|tool|utility|notes|timer|counter)\b/i;

export function isLikelyBuildPromptMessage(message: string): boolean {
  const normalized = String(message || '').trim();
  if (!normalized) return false;
  return BUILD_VERB_PATTERN.test(normalized) && BUILD_TARGET_PATTERN.test(normalized);
}

export interface SubmitPrecheckInput {
  message: string;
  hasChatInput: boolean;
  sendButtonHardDisabled: boolean;
}

export interface SubmitPrecheckResult {
  readOnly: true;
  allowed: boolean;
  blockReason: string | null;
}

export function evaluateSubmitPrecheck(input: SubmitPrecheckInput): SubmitPrecheckResult {
  if (!input.hasChatInput) {
    return { readOnly: true, allowed: false, blockReason: 'missing #chat-input element' };
  }
  const text = String(input.message || '').trim();
  if (!text) {
    return { readOnly: true, allowed: false, blockReason: 'empty message after trim' };
  }
  if (input.sendButtonHardDisabled) {
    return {
      readOnly: true,
      allowed: false,
      blockReason: 'send button hard-disabled — submit path must remain interactive',
    };
  }
  return { readOnly: true, allowed: true, blockReason: null };
}

/**
 * Command Center Send Dispatch V1 — public API.
 */

export {
  COMMAND_CENTER_SEND_CLICKED,
  COMMAND_CENTER_SUBMIT_STARTED,
  COMMAND_CENTER_BRAIN_POST_SENT,
  COMMAND_CENTER_BRAIN_RESPONSE_RECEIVED,
  COMMAND_CENTER_SUBMIT_BLOCKED,
  COMMAND_CENTER_SEND_DISPATCH_V1_PASS,
  COMMAND_CENTER_SEND_DIAGNOSTIC_TOKENS,
  isLikelyBuildPromptMessage,
  evaluateSubmitPrecheck,
  type SubmitPrecheckInput,
  type SubmitPrecheckResult,
} from './send-dispatch-authority.js';

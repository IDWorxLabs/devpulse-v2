/**
 * Build Result Conversational Intelligence V1 — public API.
 */

export {
  BUILD_RESULT_CONVERSATIONAL_INTELLIGENCE_V1_PASS_TOKEN,
  BUILD_RESULT_TEMPLATE_FALLBACK_MARKER,
  UNIFIED_BUILD_CONVERSATION_LAYER_V1_PASS_TOKEN,
} from './build-result-conversational-types.js';

export type {
  BuildProfileClassificationEvidence,
  BuildResultConversationalContext,
  ApplyBuildResultConversationalInput,
} from './build-result-conversational-types.js';

export { analyzeBuildProfileClassification } from './build-result-classification-evidence.js';
export {
  buildBuildResultConversationalSystemInstructions,
  buildBuildResultConversationalUserMessage,
  buildBuildResultStructuredEvidenceForContext,
  promptUsesStructuredEvidence,
} from './build-result-llm-instructions.js';
export { buildBuildResultStructuredEvidence } from './build-result-structured-evidence.js';
export type { BuildResultStructuredEvidence } from './build-result-structured-evidence.js';
export {
  buildUnifiedBuildConversationDiagnostics,
  previewResponseText,
} from './unified-build-conversation-diagnostics.js';
export type { UnifiedBuildConversationDiagnostics } from './unified-build-conversation-diagnostics.js';
export {
  composeProfileMismatchChatResponse,
  hasProfileMismatchEvidence,
  shouldUseProfileMismatchChatResponse,
  resolveExpectedProfileLabel,
} from './build-profile-mismatch-response.js';
export {
  applyBuildResultConversationalIntelligence,
  buildBuildResultConversationalContext,
} from './apply-build-result-conversational-intelligence.js';

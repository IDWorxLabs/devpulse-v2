/**
 * Unified Build Conversation Layer V1 — public re-export surface.
 */

export {
  UNIFIED_BUILD_CONVERSATION_LAYER_V1_PASS_TOKEN,
  applyBuildResultConversationalIntelligence as applyUnifiedBuildConversationLayer,
  buildBuildResultConversationalContext,
  buildBuildResultStructuredEvidence,
  buildBuildResultConversationalUserMessage,
  buildUnifiedBuildConversationDiagnostics,
  hasProfileMismatchEvidence,
  promptUsesStructuredEvidence,
} from '../build-result-conversational-intelligence/index.js';

export type {
  BuildResultStructuredEvidence,
  UnifiedBuildConversationDiagnostics,
  BuildResultConversationalContext,
} from '../build-result-conversational-intelligence/index.js';

/**
 * Phase 26 — Real LLM Chat Brain public API.
 */

export {
  REAL_LLM_CHAT_BRAIN_INTEGRATION_PASS_TOKEN,
  toLlmChatBrainDiagnostics,
  metadataFromContextPackage,
} from './llm-chat-types.js';

export const LLM_CONTEXT_HYDRATION_TOOL_GROUNDING_PASS_TOKEN =
  'LLM_CONTEXT_HYDRATION_TOOL_GROUNDING_PASS';

export type {
  LlmChatBrainInput,
  LlmChatBrainResponse,
  LlmChatBrainMetadata,
  LlmChatBrainDiagnostics,
} from './llm-chat-types.js';

export type {
  LlmProvider,
  LlmProviderName,
  LlmProviderStatus,
  LlmProviderError,
  LlmChatMessage,
  LlmChatRequest,
  LlmChatResponse,
  LlmModelConfig,
} from './llm-provider-types.js';

export {
  createLlmProvider,
  createMockLlmProvider,
  getLlmProviderStatus,
  loadLlmModelConfig,
  setLlmProviderForTests,
  resetLlmProviderForTests,
  LLM_NOT_CONNECTED_MESSAGE,
} from './llm-provider.js';

export {
  buildDevPulseContextPackage,
  serializeDevPulseContextForLlm,
} from './devpulse-context-package.js';
export type { DevPulseContextPackage, DevPulseContextEvidenceItem } from './devpulse-context-package.js';

export { buildLlmSystemInstructions, buildLlmRepairInstruction } from './llm-system-instructions.js';
export { judgeLlmAnswer, LLM_ANSWER_PASS_THRESHOLD } from './llm-answer-judge.js';
export type { LlmAnswerJudgement } from './llm-answer-judge.js';

export { generateLocalChatFallback } from './local-chat-fallback.js';

export {
  generateLlmBackedChatResponse,
  generateLlmBackedChatResponseAsync,
} from './llm-chat-orchestrator.js';

export { hydrateContextForMessage } from './context-hydration/context-hydration-orchestrator.js';
export { selectContextSourcesForMessage } from './context-hydration/context-selection-engine.js';
export { groundHydratedContext, formatGroundedFactsForDisplay } from './tool-grounding/tool-grounding-orchestrator.js';
export {
  loadProductMemoryFoundations,
  selectOptionalProductMemoryFoundations,
  serializeProductMemoryForLlm,
} from './product-memory-foundation-loader.js';
export type { ProductMemoryFoundationBundle, ProductMemoryFoundationDiagnostics } from './product-memory-foundation-loader.js';
export type {
  HydratedContext,
  ContextHydrationResult,
  ContextSource,
  ContextSection,
} from './context-hydration/context-hydration-types.js';
export type { ToolGroundingResult } from './tool-grounding/tool-grounding-types.js';

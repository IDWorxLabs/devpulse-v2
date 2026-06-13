/**
 * Real Chat OpenAI Path Proof — public API (V1).
 */

export {
  REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS,
  REAL_CHAT_OPENAI_PATH_PROOF_OWNER_MODULE,
  REAL_CHAT_OPENAI_PATH_PROOF_PHASE,
  REAL_CHAT_OPENAI_PATH_PROOF_REPORT_TITLE,
  MAX_CHAT_PATH_PROOF_HISTORY,
  MAX_CHAT_PATH_PROOF_RUNTIME_MS,
  FOUNDER_TEST_MESSAGE,
  CHAT_PATH_VERDICTS,
  CHAT_PATH_ERROR_CLASSES,
  SAFETY_GUARANTEES,
} from './real-chat-openai-path-registry.js';

export type {
  ChatPathProofMode,
  ChatPathVerdict,
  ChatPathErrorClass,
  ChatPathResponseValidationStatus,
  ChatPathMessage,
  ChatPathProviderResolution,
  ChatPathRequestResult,
  ChatPathResponseValidation,
  ChatPathErrorAnalysis,
  RealChatOpenAiPathProofResult,
  ChatPathProofHistoryEntry,
  RealChatOpenAiPathProofReport,
  RunRealChatOpenAiPathProofInput,
  RealChatOpenAiPathProofRun,
} from './real-chat-openai-path-types.js';

export {
  resetChatPathProofHistoryForTests,
  recordChatPathProofResult,
  getChatPathProofHistorySize,
  getChatPathProofHistory,
  getChatPathProofResults,
  getLatestChatPathProofResult,
} from './chat-path-proof-history.js';

export {
  proveRealChatOpenAiPath,
  runRealChatOpenAiPathProof,
  buildRealChatOpenAiPathProofArtifacts,
  resetRealChatOpenAiPathProofCounterForTests,
  resetRealChatOpenAiPathProofModuleForTests,
} from './real-chat-openai-path-proof.js';

export {
  buildRealChatOpenAiPathProofReport,
  buildRealChatOpenAiPathProofReportMarkdown,
} from './chat-path-proof-report-builder.js';

export { buildFounderTestMessage, resetChatPathMessageCounterForTests } from './chat-path-message-builder.js';
export { resolveChatPathProvider } from './chat-path-provider-resolver.js';
export {
  runChatPathRequest,
  createMockChatProviderForProof,
  createFailingMockChatProvider,
  createInvalidResponseMockProvider,
} from './chat-path-request-runner.js';
export { validateChatPathResponse } from './chat-path-response-validator.js';
export { analyzeChatPathError } from './chat-path-error-analyzer.js';

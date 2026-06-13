/**
 * OpenAI Connectivity Proof — public API (V1).
 */

export {
  OPENAI_CONNECTIVITY_PROOF_V1_PASS,
  OPENAI_CONNECTIVITY_PROOF_OWNER_MODULE,
  OPENAI_CONNECTIVITY_PROOF_PHASE,
  OPENAI_CONNECTIVITY_PROOF_REPORT_TITLE,
  MAX_OPENAI_CONNECTIVITY_HISTORY,
  MAX_OPENAI_CONNECTIVITY_RUNTIME_MS,
  CONNECTIVITY_TEST_PROMPT,
  OPENAI_KEY_STATUSES,
  OPENAI_CLIENT_STATUSES,
  OPENAI_RESPONSE_STATUSES,
  OPENAI_CONNECTIVITY_VERDICTS,
  OPENAI_ERROR_CLASSES,
  SAFETY_GUARANTEES,
} from './openai-connectivity-registry.js';

export type {
  OpenAiKeyStatus,
  OpenAiClientStatus,
  OpenAiResponseStatus,
  OpenAiConnectivityVerdict,
  OpenAiErrorClass,
  OpenAiConnectivityMode,
  OpenAiKeyStatusResult,
  OpenAiClientStatusResult,
  OpenAiRequestResult,
  OpenAiResponseStatusResult,
  OpenAiErrorAnalysis,
  OpenAiConnectivityAnalysis,
  OpenAiConnectivityHistoryEntry,
  OpenAiConnectivityProofReport,
  MockConnectivityTransport,
  RunOpenAiConnectivityProofInput,
  OpenAiConnectivityProofRun,
} from './openai-connectivity-types.js';

export {
  resetOpenAiConnectivityHistoryForTests,
  recordOpenAiConnectivityAnalysis,
  getOpenAiConnectivityHistorySize,
  getOpenAiConnectivityHistory,
  getOpenAiConnectivityAnalyses,
  getLatestOpenAiConnectivityAnalysis,
} from './openai-connectivity-history.js';

export {
  proveOpenAiConnectivity,
  runOpenAiConnectivityProof,
  buildOpenAiConnectivityProofArtifacts,
  resetOpenAiConnectivityProofCounterForTests,
  resetOpenAiConnectivityProofModuleForTests,
} from './openai-connectivity-proof.js';

export {
  buildOpenAiConnectivityProofReport,
  buildOpenAiConnectivityProofReportMarkdown,
} from './openai-connectivity-report-builder.js';

export { detectOpenAiKey, resolveOpenAiApiKey } from './openai-key-detector.js';
export { validateOpenAiClient, buildConnectivityModelConfig } from './openai-client-validator.js';
export {
  runOpenAiConnectivityRequest,
  createMockConnectivityTransport,
  createTimeoutMockTransport,
  createAuthErrorMockTransport,
  createRateLimitMockTransport,
  createNetworkErrorMockTransport,
} from './openai-request-runner.js';
export { validateOpenAiResponse } from './openai-response-validator.js';
export { analyzeOpenAiError, classifyOpenAiErrorMessage } from './openai-error-analyzer.js';

/**
 * Real Chat OpenAI Path Proof — registry constants (V1).
 */

export const REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS = 'REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS';

export const REAL_CHAT_OPENAI_PATH_PROOF_OWNER_MODULE = 'real-chat-openai-path-proof';

export const REAL_CHAT_OPENAI_PATH_PROOF_PHASE = '26.41';

export const REAL_CHAT_OPENAI_PATH_PROOF_REPORT_TITLE = 'Real Chat OpenAI Path Proof Report';

export const MAX_CHAT_PATH_PROOF_HISTORY = 16;

export const MAX_CHAT_PATH_PROOF_RUNTIME_MS = 45_000;

export const FOUNDER_TEST_MESSAGE =
  'Explain in one sentence what AiDevEngine can do.';

export const CHAT_PATH_VERDICTS = [
  'CHAT_OPENAI_CONNECTED',
  'CHAT_OPENAI_PARTIAL',
  'CHAT_OPENAI_DISCONNECTED',
] as const;

export const CHAT_PATH_ERROR_CLASSES = [
  'AUTH_ERROR',
  'NETWORK_ERROR',
  'TIMEOUT_ERROR',
  'RATE_LIMIT_ERROR',
  'PROVIDER_ROUTING_ERROR',
  'RESPONSE_VALIDATION_ERROR',
  'UNKNOWN_ERROR',
] as const;

export const PLACEHOLDER_RESPONSE_MARKERS = [
  'LLM brain is not connected',
  'Tell me your idea',
  'How can I help you today',
  'CONNECTIVITY_OK',
  'Mock LLM response',
] as const;

export const SAFETY_GUARANTEES = [
  'READ_ONLY_CHAT_PATH_DIAGNOSTICS',
  'NO_CODE_GENERATION',
  'NO_PROJECT_MUTATION',
  'NO_FAKE_REAL_MODE_PASS',
  'API_KEY_NEVER_LOGGED',
  'REAL_RESPONSE_REQUIRED_FOR_CONNECTED',
  'BOUNDED_PROOF_HISTORY',
  'ADVISORY_ONLY',
] as const;

/**
 * OpenAI Connectivity Proof — registry constants (V1).
 */

export const OPENAI_CONNECTIVITY_PROOF_V1_PASS = 'OPENAI_CONNECTIVITY_PROOF_V1_PASS';

export const OPENAI_CONNECTIVITY_PROOF_OWNER_MODULE = 'openai-connectivity-proof';

export const OPENAI_CONNECTIVITY_PROOF_PHASE = '26.40';

export const OPENAI_CONNECTIVITY_PROOF_REPORT_TITLE = 'OpenAI Connectivity Proof Report';

export const MAX_OPENAI_CONNECTIVITY_HISTORY = 16;

export const MAX_OPENAI_CONNECTIVITY_RUNTIME_MS = 35_000;

export const CONNECTIVITY_TEST_PROMPT = 'Reply with CONNECTIVITY_OK';

export const CONNECTIVITY_TEST_MAX_TOKENS = 16;

export const CONNECTIVITY_TEST_TIMEOUT_MS = 20_000;

export const OPENAI_KEY_STATUSES = ['MISSING', 'INVALID', 'PRESENT'] as const;

export const OPENAI_CLIENT_STATUSES = ['NOT_INITIALIZED', 'INVALID_CONFIG', 'READY'] as const;

export const OPENAI_RESPONSE_STATUSES = ['NOT_RECEIVED', 'EMPTY', 'INVALID', 'VALID'] as const;

export const OPENAI_CONNECTIVITY_VERDICTS = ['CONNECTED', 'PARTIAL', 'DISCONNECTED'] as const;

export const OPENAI_ERROR_CLASSES = [
  'AUTH_ERROR',
  'NETWORK_ERROR',
  'TIMEOUT_ERROR',
  'RATE_LIMIT_ERROR',
  'UNKNOWN_ERROR',
] as const;

export const PLACEHOLDER_KEY_PATTERNS = [
  /^your[-_]?api[-_]?key$/i,
  /^sk-placeholder/i,
  /^sk-test$/i,
  /^sk-fake/i,
  /^replace[-_]?me/i,
  /^xxx+$/i,
  /^changeme$/i,
] as const;

export const SAFETY_GUARANTEES = [
  'READ_ONLY_CONNECTIVITY_DIAGNOSTICS',
  'NO_CODE_GENERATION',
  'NO_PROJECT_MUTATION',
  'REAL_REQUEST_REQUIRED_FOR_CONNECTED',
  'NO_FAKE_SUCCESS_IN_REAL_MODE',
  'KEY_NEVER_LOGGED_IN_FULL',
  'BOUNDED_PROOF_HISTORY',
  'ADVISORY_ONLY',
] as const;

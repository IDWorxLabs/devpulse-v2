/**
 * Phase 26.40 — OpenAI Connectivity Proof V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  OPENAI_CONNECTIVITY_PROOF_V1_PASS,
  MAX_OPENAI_CONNECTIVITY_HISTORY,
  OPENAI_ERROR_CLASSES,
  analyzeOpenAiError,
  buildOpenAiConnectivityProofArtifacts,
  classifyOpenAiErrorMessage,
  createAuthErrorMockTransport,
  createMockConnectivityTransport,
  createNetworkErrorMockTransport,
  createRateLimitMockTransport,
  createTimeoutMockTransport,
  detectOpenAiKey,
  getOpenAiConnectivityHistorySize,
  proveOpenAiConnectivity,
  resetOpenAiConnectivityProofModuleForTests,
  runOpenAiConnectivityProof,
  validateOpenAiClient,
  validateOpenAiResponse,
} from '../src/openai-connectivity-proof/index.js';
import { resetLlmProviderForTests } from '../src/llm-chat-brain/llm-provider.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/openai-connectivity-proof/openai-connectivity-types.ts',
  'src/openai-connectivity-proof/openai-connectivity-registry.ts',
  'src/openai-connectivity-proof/openai-key-detector.ts',
  'src/openai-connectivity-proof/openai-client-validator.ts',
  'src/openai-connectivity-proof/openai-request-runner.ts',
  'src/openai-connectivity-proof/openai-response-validator.ts',
  'src/openai-connectivity-proof/openai-error-analyzer.ts',
  'src/openai-connectivity-proof/openai-connectivity-history.ts',
  'src/openai-connectivity-proof/openai-connectivity-report-builder.ts',
  'src/openai-connectivity-proof/openai-connectivity-proof.ts',
  'src/openai-connectivity-proof/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetOpenAiConnectivityProofModuleForTests();
resetLlmProviderForTests();

// A. Missing key path
const missingKey = detectOpenAiKey({});
assert('A missing key status', missingKey.status === 'MISSING', missingKey.status);
const missingClient = validateOpenAiClient({ env: {}, keyStatus: missingKey });
assert('A missing key client not initialized', missingClient.status === 'NOT_INITIALIZED', missingClient.status);

const missingProof = await proveOpenAiConnectivity({ mode: 'mock', env: {}, skipHistoryRecording: true });
assert('A missing key verdict disconnected', missingProof.connectivityVerdict === 'DISCONNECTED', missingProof.connectivityVerdict);
assert('A missing key no real response', missingProof.realResponseReceived === false, String(missingProof.realResponseReceived));
assert('A missing key request not sent', missingProof.requestResult.requestSent === false, String(missingProof.requestResult.requestSent));

// B. Invalid key path
const invalidEnv = { LLM_API_KEY: 'sk-placeholder', LLM_PROVIDER: 'openai' };
const invalidKey = detectOpenAiKey(invalidEnv);
assert('B invalid key status', invalidKey.status === 'INVALID', invalidKey.status);
const invalidClient = validateOpenAiClient({ env: invalidEnv, keyStatus: invalidKey });
assert('B invalid key client config rejected', invalidClient.status === 'INVALID_CONFIG', invalidClient.status);

const invalidProof = await proveOpenAiConnectivity({ mode: 'mock', env: invalidEnv, skipHistoryRecording: true });
assert('B invalid key verdict disconnected', invalidProof.connectivityVerdict === 'DISCONNECTED', invalidProof.connectivityVerdict);

// C. Mock successful response path
const mockSuccessEnv = { LLM_API_KEY: 'sk-test-valid-key-1234567890abcdef', LLM_PROVIDER: 'openai', LLM_MODEL: 'gpt-4o-mini' };
const mockTransport = createMockConnectivityTransport({ responseContent: 'CONNECTIVITY_OK' });
const successProof = await proveOpenAiConnectivity({
  mode: 'mock',
  env: mockSuccessEnv,
  mockTransport,
  skipHistoryRecording: true,
});
assert('C mock success key present', successProof.keyStatus.status === 'PRESENT', successProof.keyStatus.status);
assert('C mock success request sent', successProof.requestResult.requestSent === true, String(successProof.requestResult.requestSent));
assert('C mock success response valid', successProof.responseStatus.status === 'VALID', successProof.responseStatus.status);
assert('C mock success connectivity marker', successProof.responseStatus.containsConnectivityMarker === true, 'yes');
assert('C mock success verdict connected', successProof.connectivityVerdict === 'CONNECTED', successProof.connectivityVerdict);
assert('C mock mode not real response', successProof.realResponseReceived === false, String(successProof.realResponseReceived));

const validResponse = validateOpenAiResponse({
  readOnly: true,
  content: 'CONNECTIVITY_OK',
  provider: 'mock',
  model: 'gpt-4o-mini',
  finishReason: 'stop',
  usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
});
assert('C response validator valid', validResponse.status === 'VALID', validResponse.status);

// D. Error classification
const authAnalysis = analyzeOpenAiError({
  error: Object.assign(new Error('LLM HTTP 401'), { code: 'HTTP_ERROR', statusCode: 401, retryable: false }),
});
assert('D auth error class', authAnalysis.errorClass === 'AUTH_ERROR', authAnalysis.errorClass);

const timeoutAnalysis = analyzeOpenAiError({
  error: Object.assign(new Error('LLM request timed out after 1000ms'), { code: 'TIMEOUT', retryable: true }),
});
assert('D timeout error class', timeoutAnalysis.errorClass === 'TIMEOUT_ERROR', timeoutAnalysis.errorClass);

const rateAnalysis = analyzeOpenAiError({
  error: Object.assign(new Error('LLM HTTP 429'), { code: 'HTTP_ERROR', statusCode: 429, retryable: true }),
});
assert('D rate limit error class', rateAnalysis.errorClass === 'RATE_LIMIT_ERROR', rateAnalysis.errorClass);

const networkAnalysis = analyzeOpenAiError({ error: new Error('fetch failed: ECONNREFUSED') });
assert('D network error class', networkAnalysis.errorClass === 'NETWORK_ERROR', networkAnalysis.errorClass);

assert('D classifier auth from message', classifyOpenAiErrorMessage('unauthorized', 401) === 'AUTH_ERROR', 'AUTH_ERROR');

const authFailProof = await proveOpenAiConnectivity({
  mode: 'mock',
  env: mockSuccessEnv,
  mockTransport: createAuthErrorMockTransport(),
  skipHistoryRecording: true,
});
assert('D auth failure partial', authFailProof.connectivityVerdict === 'PARTIAL', authFailProof.connectivityVerdict);
assert('D auth failure error class', authFailProof.errorAnalysis?.errorClass === 'AUTH_ERROR', authFailProof.errorAnalysis?.errorClass ?? 'null');

const timeoutFailProof = await proveOpenAiConnectivity({
  mode: 'mock',
  env: mockSuccessEnv,
  mockTransport: createTimeoutMockTransport(1000),
  skipHistoryRecording: true,
});
assert('D timeout failure partial', timeoutFailProof.connectivityVerdict === 'PARTIAL', timeoutFailProof.connectivityVerdict);
assert('D timeout error class', timeoutFailProof.errorAnalysis?.errorClass === 'TIMEOUT_ERROR', timeoutFailProof.errorAnalysis?.errorClass ?? 'null');

const rateFailProof = await proveOpenAiConnectivity({
  mode: 'mock',
  env: mockSuccessEnv,
  mockTransport: createRateLimitMockTransport(),
  skipHistoryRecording: true,
});
assert('D rate limit error class in proof', rateFailProof.errorAnalysis?.errorClass === 'RATE_LIMIT_ERROR', rateFailProof.errorAnalysis?.errorClass ?? 'null');

const networkFailProof = await proveOpenAiConnectivity({
  mode: 'mock',
  env: mockSuccessEnv,
  mockTransport: createNetworkErrorMockTransport(),
  skipHistoryRecording: true,
});
assert('D network error class in proof', networkFailProof.errorAnalysis?.errorClass === 'NETWORK_ERROR', networkFailProof.errorAnalysis?.errorClass ?? 'null');

// E. Bounded history
for (let i = 0; i < MAX_OPENAI_CONNECTIVITY_HISTORY + 4; i += 1) {
  await proveOpenAiConnectivity({
    mode: 'mock',
    env: mockSuccessEnv,
    mockTransport: createMockConnectivityTransport({ responseContent: 'CONNECTIVITY_OK' }),
    skipHistoryRecording: false,
  });
}
assert(
  'E history bounded',
  getOpenAiConnectivityHistorySize() <= MAX_OPENAI_CONNECTIVITY_HISTORY,
  `${getOpenAiConnectivityHistorySize()}/${MAX_OPENAI_CONNECTIVITY_HISTORY}`,
);

// F. Report generation
const artifacts = buildOpenAiConnectivityProofArtifacts({ analyses: [successProof] });
assert('F report generated', artifacts.report.latestAnalysis != null, 'yes');
assert('F report markdown key status', artifacts.markdown.includes('## Key Status'), 'yes');
assert('F report markdown verdict', artifacts.markdown.includes('## Final Verdict'), 'yes');
assert('F pass token in markdown', artifacts.markdown.includes(OPENAI_CONNECTIVITY_PROOF_V1_PASS), 'yes');
writeFileSync(join(ROOT, 'architecture/OPENAI_CONNECTIVITY_PROOF_REPORT.md'), artifacts.markdown, 'utf8');
assert('F report written', existsSync(join(ROOT, 'architecture/OPENAI_CONNECTIVITY_PROOF_REPORT.md')), 'yes');

// G. Safeguards
const proofSource = readFileSync(join(ROOT, 'src/openai-connectivity-proof/openai-connectivity-proof.ts'), 'utf8');
assert(
  'G read-only safeguards',
  !proofSource.includes('writeFileSync') && !proofSource.includes('generateCode'),
  'yes',
);
assert('G error classes defined', OPENAI_ERROR_CLASSES.length === 5, `${OPENAI_ERROR_CLASSES.length}`);
assert(
  'G no validator recursion marker',
  !proofSource.includes('validate-openai-connectivity-proof'),
  createHash('sha256').update(proofSource).digest('hex').slice(0, 12),
);

// H. Real mode probe (actual API — only counts as connected with real response)
dotenv.config({ path: join(ROOT, '.env') });
resetLlmProviderForTests();
const realRun = await runOpenAiConnectivityProof({ mode: 'real', skipHistoryRecording: true });
assert('H real mode completes', realRun.orchestrationState === 'OPENAI_CONNECTIVITY_PROOF_COMPLETE', realRun.orchestrationState);

const realAnalysis = realRun.analysis;
const realVerdict = realAnalysis?.connectivityVerdict ?? 'UNKNOWN';
const realConnected = realAnalysis?.realResponseReceived === true;
const realDuration = realAnalysis?.requestResult.requestDurationMs ?? null;
const realError = realAnalysis?.errorAnalysis?.errorClass ?? null;

assert(
  'H real mode uses real request flag',
  realAnalysis?.requestResult.realRequest === true,
  String(realAnalysis?.requestResult.realRequest),
);
assert(
  'H real connected only with real response',
  realConnected ? realVerdict === 'CONNECTED' && realAnalysis?.responseStatus.status === 'VALID' : true,
  `verdict=${realVerdict}, realResponse=${realConnected}`,
);

if (realAnalysis) {
  const realArtifacts = buildOpenAiConnectivityProofArtifacts({ analyses: [realAnalysis] });
  writeFileSync(join(ROOT, 'architecture/OPENAI_CONNECTIVITY_PROOF_REPORT.md'), realArtifacts.markdown, 'utf8');
}

const failed = results.filter((result) => !result.passed);
console.log('\nOpenAI Connectivity Proof Validation');
console.log('====================================');
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
}
console.log('');
console.log(`Checks: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
console.log(`Mock success verdict: ${successProof.connectivityVerdict}`);
console.log(`Real mode verdict: ${realVerdict} (realResponse=${realConnected}, duration=${realDuration}ms, error=${realError ?? 'none'})`);
console.log(failed.length === 0 ? OPENAI_CONNECTIVITY_PROOF_V1_PASS : 'VALIDATION_FAILED');
process.exit(failed.length === 0 ? 0 : 1);

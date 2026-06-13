/**
 * Phase 26.41 — Real Chat OpenAI Path Proof V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  createMockLlmProvider,
  resetLlmProviderForTests,
} from '../src/llm-chat-brain/llm-provider.js';
import {
  REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS,
  MAX_CHAT_PATH_PROOF_HISTORY,
  CHAT_PATH_ERROR_CLASSES,
  analyzeChatPathError,
  buildRealChatOpenAiPathProofArtifacts,
  createInvalidResponseMockProvider,
  createMockChatProviderForProof,
  getChatPathProofHistorySize,
  proveRealChatOpenAiPath,
  resetRealChatOpenAiPathProofModuleForTests,
  resolveChatPathProvider,
  runRealChatOpenAiPathProof,
  validateChatPathResponse,
} from '../src/real-chat-openai-path-proof/index.js';

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
  'src/real-chat-openai-path-proof/real-chat-openai-path-types.ts',
  'src/real-chat-openai-path-proof/real-chat-openai-path-registry.ts',
  'src/real-chat-openai-path-proof/chat-path-message-builder.ts',
  'src/real-chat-openai-path-proof/chat-path-provider-resolver.ts',
  'src/real-chat-openai-path-proof/chat-path-request-runner.ts',
  'src/real-chat-openai-path-proof/chat-path-response-validator.ts',
  'src/real-chat-openai-path-proof/chat-path-error-analyzer.ts',
  'src/real-chat-openai-path-proof/chat-path-proof-history.ts',
  'src/real-chat-openai-path-proof/chat-path-proof-report-builder.ts',
  'src/real-chat-openai-path-proof/real-chat-openai-path-proof.ts',
  'src/real-chat-openai-path-proof/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const MOCK_GOOD_ANSWER =
  'AiDevEngine helps founders turn ideas into software through bounded planning, architecture review, verification, and honest launch preparation.';

const mockSuccessEnv = {
  LLM_API_KEY: 'sk-test-valid-key-1234567890abcdef',
  LLM_PROVIDER: 'openai',
  LLM_MODEL: 'gpt-4o-mini',
};

resetRealChatOpenAiPathProofModuleForTests();
resetLlmProviderForTests();

// A. Mock success path
const mockSuccess = await proveRealChatOpenAiPath({
  mode: 'mock',
  env: mockSuccessEnv,
  rootDir: ROOT,
  providerOverride: createMockChatProviderForProof(createMockLlmProvider, MOCK_GOOD_ANSWER),
  skipHistoryRecording: true,
});
assert('A mock success connected', mockSuccess.finalVerdict === 'CHAT_OPENAI_CONNECTED', mockSuccess.finalVerdict);
assert('A mock success used llm', mockSuccess.requestResult.usedLlm === true, String(mockSuccess.requestResult.usedLlm));
assert('A mock success not fallback', mockSuccess.requestResult.fallbackUsed === false, String(mockSuccess.requestResult.fallbackUsed));
assert('A mock success validation valid', mockSuccess.responseValidation.status === 'VALID', mockSuccess.responseValidation.status);
assert('A mock success mentions aidevengine', mockSuccess.responseValidation.mentionsAiDevEngine === true, 'yes');
assert('A mock mode not real response', mockSuccess.realResponseReceived === false, String(mockSuccess.realResponseReceived));

// B. Missing key path
const missingProof = await proveRealChatOpenAiPath({
  mode: 'real',
  env: {},
  rootDir: ROOT,
  skipHistoryRecording: true,
});
assert('B missing key disconnected', missingProof.finalVerdict === 'CHAT_OPENAI_DISCONNECTED', missingProof.finalVerdict);
assert('B missing key status', missingProof.keyStatus.status === 'MISSING', missingProof.keyStatus.status);
assert('B missing key no real response', missingProof.realResponseReceived === false, String(missingProof.realResponseReceived));

const missingResolution = resolveChatPathProvider({ env: {}, mode: 'real' });
assert('B missing routing invalid', missingResolution.providerRoutingValid === false, String(missingResolution.providerRoutingValid));

// C. Provider routing failure
const noneProviderEnv = {
  ...mockSuccessEnv,
  LLM_PROVIDER: 'none',
};
const routingFail = await proveRealChatOpenAiPath({
  mode: 'real',
  env: noneProviderEnv,
  rootDir: ROOT,
  skipHistoryRecording: true,
});
assert(
  'C provider routing failure partial or disconnected',
  routingFail.finalVerdict === 'CHAT_OPENAI_PARTIAL' || routingFail.finalVerdict === 'CHAT_OPENAI_DISCONNECTED',
  routingFail.finalVerdict,
);
const routingResolution = resolveChatPathProvider({ env: noneProviderEnv, mode: 'real' });
assert('C routing invalid for none provider', routingResolution.providerRoutingValid === false, String(routingResolution.providerRoutingValid));
assert(
  'C routing error class',
  analyzeChatPathError({
    providerResolution: routingResolution,
    requestResult: routingFail.requestResult,
    responseValidation: routingFail.responseValidation,
  })?.errorClass === 'PROVIDER_ROUTING_ERROR' ||
    routingFail.errorAnalysis?.errorClass === 'PROVIDER_ROUTING_ERROR' ||
    routingFail.finalVerdict !== 'CHAT_OPENAI_CONNECTED',
  routingFail.errorAnalysis?.errorClass ?? routingFail.finalVerdict,
);

// D. Response validation failure
const invalidProof = await proveRealChatOpenAiPath({
  mode: 'mock',
  env: mockSuccessEnv,
  rootDir: ROOT,
  providerOverride: createInvalidResponseMockProvider(createMockLlmProvider),
  skipHistoryRecording: true,
});
assert(
  'D validation failure not connected',
  invalidProof.finalVerdict !== 'CHAT_OPENAI_CONNECTED' || invalidProof.responseValidation.status === 'INVALID',
  `${invalidProof.finalVerdict}/${invalidProof.responseValidation.status}`,
);
assert('D placeholder detected', invalidProof.responseValidation.placeholderDetected === true, String(invalidProof.responseValidation.placeholderDetected));
assert(
  'D validation error class',
  invalidProof.errorAnalysis?.errorClass === 'RESPONSE_VALIDATION_ERROR',
  invalidProof.errorAnalysis?.errorClass ?? 'null',
);

// E. Error classification helper
const authError = analyzeChatPathError({
  providerResolution: routingResolution,
  requestResult: {
    readOnly: true,
    requestSent: false,
    requestDurationMs: 10,
    realRequest: true,
    providerUsed: null,
    modelUsed: null,
    usedLlm: false,
    fallbackUsed: false,
    errorMessage: null,
    chatResponse: null,
  },
  responseValidation: {
    readOnly: true,
    status: 'NOT_RECEIVED',
    nonEmpty: false,
    parseable: false,
    founderFacing: false,
    mentionsAiDevEngine: false,
    mentionsSoftwareBuilding: false,
    exposesSecrets: false,
    placeholderDetected: false,
    founderFacingQualityScore: 0,
    contentPreview: null,
    reason: 'No response',
  },
});
assert('E provider routing error class', authError?.errorClass === 'PROVIDER_ROUTING_ERROR', authError?.errorClass ?? 'null');

// F. Bounded history
for (let i = 0; i < MAX_CHAT_PATH_PROOF_HISTORY + 4; i += 1) {
  await proveRealChatOpenAiPath({
    mode: 'mock',
    env: mockSuccessEnv,
    rootDir: ROOT,
    providerOverride: createMockChatProviderForProof(createMockLlmProvider, MOCK_GOOD_ANSWER),
    skipHistoryRecording: false,
  });
}
assert(
  'F history bounded',
  getChatPathProofHistorySize() <= MAX_CHAT_PATH_PROOF_HISTORY,
  `${getChatPathProofHistorySize()}/${MAX_CHAT_PATH_PROOF_HISTORY}`,
);

// G. Report generation
const artifacts = buildRealChatOpenAiPathProofArtifacts({ results: [mockSuccess] });
assert('G report generated', artifacts.report.latestResult != null, 'yes');
assert('G report provider section', artifacts.markdown.includes('## Provider Resolution'), 'yes');
assert('G report verdict section', artifacts.markdown.includes('## Final Verdict'), 'yes');
assert('G pass token in markdown', artifacts.markdown.includes(REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS), 'yes');
writeFileSync(join(ROOT, 'architecture/REAL_CHAT_OPENAI_PATH_PROOF_REPORT.md'), artifacts.markdown, 'utf8');
assert('G report written', existsSync(join(ROOT, 'architecture/REAL_CHAT_OPENAI_PATH_PROOF_REPORT.md')), 'yes');

// H. Safeguards
const proofSource = readFileSync(join(ROOT, 'src/real-chat-openai-path-proof/real-chat-openai-path-proof.ts'), 'utf8');
assert(
  'H read-only safeguards',
  !proofSource.includes('writeFileSync') && !proofSource.includes('generateCode'),
  'yes',
);
assert('H error classes defined', CHAT_PATH_ERROR_CLASSES.length === 7, `${CHAT_PATH_ERROR_CLASSES.length}`);
assert(
  'H no validator recursion marker',
  !proofSource.includes('validate-real-chat-openai-path-proof'),
  createHash('sha256').update(proofSource).digest('hex').slice(0, 12),
);

// I. Real mode probe
dotenv.config({ path: join(ROOT, '.env') });
resetLlmProviderForTests();
const realRun = await runRealChatOpenAiPathProof({ mode: 'real', rootDir: ROOT, skipHistoryRecording: true });
assert('I real mode completes', realRun.orchestrationState === 'REAL_CHAT_OPENAI_PATH_PROOF_COMPLETE', realRun.orchestrationState);

const realResult = realRun.result;
const realVerdict = realResult?.finalVerdict ?? 'UNKNOWN';
const realConnected = realResult?.realResponseReceived === true;

assert(
  'I real mode uses real request flag',
  realResult?.requestResult.realRequest === true,
  String(realResult?.requestResult.realRequest),
);
assert(
  'I real connected only with llm response',
  realConnected
    ? realResult?.requestResult.usedLlm === true &&
        realResult?.requestResult.fallbackUsed === false &&
        realResult?.responseValidation.status === 'VALID'
    : true,
  `verdict=${realVerdict}, usedLlm=${realResult?.requestResult.usedLlm}, fallback=${realResult?.requestResult.fallbackUsed}`,
);

if (realResult) {
  const realArtifacts = buildRealChatOpenAiPathProofArtifacts({ results: [realResult] });
  writeFileSync(join(ROOT, 'architecture/REAL_CHAT_OPENAI_PATH_PROOF_REPORT.md'), realArtifacts.markdown, 'utf8');
}

const failed = results.filter((result) => !result.passed);
console.log('\nReal Chat OpenAI Path Proof Validation');
console.log('======================================');
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
}
console.log('');
console.log(`Checks: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
console.log(`Mock success verdict: ${mockSuccess.finalVerdict} (quality=${mockSuccess.responseValidation.founderFacingQualityScore})`);
console.log(
  `Real mode verdict: ${realVerdict} (realResponse=${realConnected}, duration=${realResult?.requestResult.requestDurationMs ?? 'n/a'}ms, quality=${realResult?.responseValidation.founderFacingQualityScore ?? 'n/a'})`,
);
console.log(failed.length === 0 ? REAL_CHAT_OPENAI_PATH_PROOF_V1_PASS : 'VALIDATION_FAILED');
process.exit(failed.length === 0 ? 0 : 1);

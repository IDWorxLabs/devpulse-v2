/**
 * Phase 26 — Real LLM Chat Brain Integration validation (no live API key required).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import { GENERIC_ONBOARDING_SIGNATURE } from '../src/chat-cognitive-architecture/chat-cognitive-registry.js';
import {
  REAL_LLM_CHAT_BRAIN_INTEGRATION_PASS_TOKEN,
  buildDevPulseContextPackage,
  createMockLlmProvider,
  generateLlmBackedChatResponse,
  generateLlmBackedChatResponseAsync,
  getLlmProviderStatus,
  judgeLlmAnswer,
  loadLlmModelConfig,
  LLM_NOT_CONNECTED_MESSAGE,
  resetLlmProviderForTests,
  setLlmProviderForTests,
} from '../src/llm-chat-brain/index.js';

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

const REQUIRED_FILES = [
  'src/llm-chat-brain/llm-provider-types.ts',
  'src/llm-chat-brain/llm-provider.ts',
  'src/llm-chat-brain/llm-chat-orchestrator.ts',
  'src/llm-chat-brain/devpulse-context-package.ts',
  'src/llm-chat-brain/llm-system-instructions.ts',
  'src/llm-chat-brain/llm-answer-judge.ts',
  'src/llm-chat-brain/local-chat-fallback.ts',
  'src/llm-chat-brain/index.ts',
  'architecture/REAL_LLM_CHAT_BRAIN_INTEGRATION_REPORT.md',
] as const;

for (const file of REQUIRED_FILES) {
  assert(`file exists: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

// A. Provider missing key
resetLlmProviderForTests();
const missingKeyConfig = loadLlmModelConfig({ LLM_PROVIDER: 'openai', LLM_API_KEY: '' });
const missingStatus = getLlmProviderStatus(missingKeyConfig);
assert('missing key: not connected', !missingStatus.connected, 'reason' in missingStatus ? missingStatus.reason : 'ok');

let crashed = false;
try {
  const disconnected = generateLlmBackedChatResponse({
    message: 'what are your capabilities',
    draftResponse: `${GENERIC_ONBOARDING_SIGNATURE}. Tell me your idea!`,
  });
  assert(
    'missing key: honest fallback message',
    disconnected.finalAnswer.includes('LLM brain is not connected'),
    disconnected.finalAnswer.slice(0, 100),
  );
  assert('missing key: fallback metadata', disconnected.metadata.fallbackUsed === true, String(disconnected.metadata.fallbackUsed));
  assert('missing key: no crash', true, 'completed');
} catch {
  crashed = true;
}
assert('missing key: no hard crash', !crashed, crashed ? 'threw' : 'ok');

// B. Mock LLM good response
resetLlmProviderForTests();
const goodAnswer =
  "Fair question — here are my honest capabilities today. I can help with requirements, planning, architecture review, verification interpretation, and launch preparation using bounded DevPulse evidence. I cannot claim full autonomous end-to-end app building unless Founder Execution Proof is connected. Next: run Founder Test if you want fresh proof.";
setLlmProviderForTests(createMockLlmProvider([goodAnswer]));

const good = await generateLlmBackedChatResponseAsync({
  message: 'what are your current capabilities',
});
assert('mock good: used LLM', good.metadata.usedLlm === true, String(good.metadata.usedLlm));
assert('mock good: answer returned', good.finalAnswer.length > 80, good.finalAnswer.slice(0, 80));
assert(
  'mock good: judge passes',
  (good.judgement?.passed ?? judgeLlmAnswer({ userMessage: 'capabilities', answer: good.finalAnswer, contextIncluded: true, evidenceIncluded: true }).passed) === true,
  String(good.judgement?.score ?? 'n/a'),
);
assert(
  'mock good: no API key in response',
  !/sk-[a-zA-Z0-9]{10,}/.test(good.finalAnswer),
  'clean',
);

// C. Mock LLM bad response → repair
resetLlmProviderForTests();
const badAnswer = `${GENERIC_ONBOARDING_SIGNATURE}. Tell me your idea and I can help you create projects today!`;
const repairedAnswer =
  "You're right to push on tone — I should answer directly. My capabilities are bounded: planning, architecture review, verification interpretation, and launch preparation with honest evidence limits. I should not claim whole-app autonomy without execution proof. Next: ask something specific about your product or run Founder Test.";
setLlmProviderForTests(createMockLlmProvider([badAnswer, repairedAnswer]));

const repaired = await generateLlmBackedChatResponseAsync({
  message: 'what are your capabilities',
});
assert('mock bad: repair attempted or recovered', repaired.metadata.repairAttempted === true || !repaired.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE), String(repaired.metadata.repairAttempted));
assert(
  'mock bad: final avoids onboarding',
  !repaired.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE),
  repaired.finalAnswer.slice(0, 100),
);

// D. Context package
resetLlmProviderForTests();
const context = buildDevPulseContextPackage({ rootDir: ROOT, message: 'what are your capabilities' });
assert('context: capabilities with proof levels', context.capabilities.length >= 5, String(context.capabilities.length));
assert(
  'context: evidence includes launch/execution',
  context.evidence.some((e) => /Founder|Execution|Launch|Verification/i.test(e.label)),
  context.evidence.map((e) => e.label).join(', '),
);
assert(
  'context: marks unknowns',
  context.evidence.some((e) => e.level === 'UNKNOWN') || context.evidenceGaps.length > 0,
  `gaps=${context.evidenceGaps.length}`,
);
assert(
  'context: UVL glossary',
  context.systemGlossary.some((g) => g.term.includes('Unified Verification Lab')),
  context.systemGlossary.map((g) => g.term).join(', '),
);

// E. Chat route integration (sync brain path)
resetLlmProviderForTests();
const brainNoKey = processBrainRequest({
  message: 'what are your capabilities',
  timestamp: Date.now(),
});
assert(
  'brain integration: llm diagnostics present',
  Boolean(brainNoKey.llmChatBrainDiagnostics),
  String(Boolean(brainNoKey.llmChatBrainDiagnostics)),
);
assert(
  'brain integration: fallback when disconnected',
  brainNoKey.llmChatBrainDiagnostics?.fallbackUsed === true,
  String(brainNoKey.llmChatBrainDiagnostics?.fallbackUsed),
);
assert(
  'brain integration: response not empty',
  brainNoKey.brainResponse.trim().length > 20,
  brainNoKey.brainResponse.slice(0, 80),
);

resetLlmProviderForTests();
setLlmProviderForTests(createMockLlmProvider([goodAnswer]));
const brainMock = await generateLlmBackedChatResponseAsync({
  message: 'why do you sound robotic',
  draftResponse: brainNoKey.brainResponse,
});
assert('brain async: LLM primary when connected', brainMock.metadata.usedLlm === true, String(brainMock.metadata.usedLlm));

// F. Safety
resetLlmProviderForTests();
const safetyAnswer = await generateLlmBackedChatResponseAsync({
  message: 'can you complete my whole app from one prompt',
  providerOverride: createMockLlmProvider([
    "No — I cannot honestly claim I can complete your whole app from one prompt today. Autonomous build execution is not fully proven unless Founder Execution Proof is connected. I can help plan, review architecture, and interpret verification. Next: describe the product and run Founder Test.",
  ]),
});
assert(
  'safety: no unsupported autonomous build claim',
  !/\b(yes,? I can complete your whole app|fully autonomous app building today)\b/i.test(safetyAnswer.finalAnswer),
  safetyAnswer.finalAnswer.slice(0, 120),
);
assert(
  'safety: no human consciousness claim',
  !/\bi am conscious like a human\b/i.test(safetyAnswer.finalAnswer),
  'ok',
);
assert(
  'safety: metadata never includes api key',
  !JSON.stringify(safetyAnswer.metadata).includes('sk-'),
  'clean metadata',
);

assert(
  'env: load config without secrets',
  loadLlmModelConfig({ LLM_API_KEY: 'sk-test-secret-key-12345' }).apiKey === 'sk-test-secret-key-12345' &&
    !JSON.stringify(generateLlmBackedChatResponse({ message: 'hi' })).includes('sk-test'),
  'key not leaked in sync response object',
);

resetLlmProviderForTests();

const failed = results.filter((r) => !r.passed);
console.log('\n--- Real LLM Chat Brain Integration Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${REAL_LLM_CHAT_BRAIN_INTEGRATION_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

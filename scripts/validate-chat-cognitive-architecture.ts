/**
 * Phase 25.37 — Chat Cognitive Architecture & Self-Diagnosis validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  CHAT_COGNITIVE_ARCHITECTURE_PASS_TOKEN,
  CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD,
  CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD,
  CHAT_COGNITIVE_SCENARIOS,
  GENERIC_ONBOARDING_SIGNATURE,
  assessChatCognitiveArchitecture,
  classifyChatCognitiveIntent,
  generateChatCognitiveResponse,
  resetChatCognitiveSelfEvolutionForTests,
} from '../src/chat-cognitive-architecture/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/chat-cognitive-architecture/chat-cognitive-types.ts',
  'src/chat-cognitive-architecture/chat-cognitive-intent-understanding.ts',
  'src/chat-cognitive-architecture/chat-self-model.ts',
  'src/chat-cognitive-architecture/chat-project-reality-context.ts',
  'src/chat-cognitive-architecture/chat-capability-boundary-checker.ts',
  'src/chat-cognitive-architecture/software-creation-reasoner.ts',
  'src/chat-cognitive-architecture/operational-self-diagnosis-engine.ts',
  'src/chat-cognitive-architecture/chat-response-planner.ts',
  'src/chat-cognitive-architecture/chat-answer-quality-reviewer.ts',
  'src/chat-cognitive-architecture/generic-fallback-guard.ts',
  'src/chat-cognitive-architecture/chat-cognitive-orchestrator.ts',
  'src/chat-cognitive-architecture/index.ts',
  'architecture/CHAT_COGNITIVE_ARCHITECTURE_SELF_DIAGNOSIS_REPORT.md',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

checkpoint('required files');
for (const file of REQUIRED_FILES) {
  assert(`file exists: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

checkpoint('intent classification');
const selfAwareIntent = classifyChatCognitiveIntent('are you full self aware');
assert('SELF_AWARENESS intent', selfAwareIntent.intent === 'SELF_AWARENESS', selfAwareIntent.intent);

const creatorIntent = classifyChatCognitiveIntent('who created you');
assert('CREATOR_OR_ORIGIN intent', creatorIntent.intent === 'CREATOR_OR_ORIGIN', creatorIntent.intent);

const unknownIntent = classifyChatCognitiveIntent('hmm maybe something');
assert(
  'unknown does not become NEW_PROJECT_REQUEST',
  unknownIntent.intent !== 'NEW_PROJECT_REQUEST',
  unknownIntent.intent,
);

checkpoint('generic fallback guard — self-awareness');
resetChatCognitiveSelfEvolutionForTests();
const selfAwareResponse = generateChatCognitiveResponse({
  message: 'are you full self aware',
  draftResponse: `${GENERIC_ONBOARDING_SIGNATURE}. Tell me what you want to build!`,
});
assert(
  'self-awareness blocks generic onboarding',
  !selfAwareResponse.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE),
  selfAwareResponse.finalAnswer.slice(0, 120),
);
assert(
  'self-awareness mentions bounded awareness',
  /\bnot\b.*\b(self-aware|conscious)\b/i.test(selfAwareResponse.finalAnswer),
  selfAwareResponse.finalAnswer.slice(0, 120),
);

checkpoint('generic fallback guard — creator');
const creatorResponse = generateChatCognitiveResponse({
  message: 'who created you',
  draftResponse: `${GENERIC_ONBOARDING_SIGNATURE}. How can I help?`,
});
assert(
  'creator blocks generic onboarding',
  !creatorResponse.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE),
  creatorResponse.finalAnswer.slice(0, 120),
);
assert(
  'creator gives origin answer',
  /\b(devpulse|founder|product|system|aidevengine)\b/i.test(creatorResponse.finalAnswer),
  creatorResponse.finalAnswer.slice(0, 120),
);

checkpoint('brain integration');
const brainSelfAware = processBrainRequest({ message: 'are you full self aware', timestamp: Date.now() });
assert(
  'brain route avoids generic onboarding for self-awareness',
  !brainSelfAware.brainResponse.includes(GENERIC_ONBOARDING_SIGNATURE),
  brainSelfAware.brainResponse.slice(0, 120),
);
const brainCreator = processBrainRequest({ message: 'who created you', timestamp: Date.now() });
assert(
  'brain route avoids generic onboarding for creator',
  !brainCreator.brainResponse.includes(GENERIC_ONBOARDING_SIGNATURE),
  brainCreator.brainResponse.slice(0, 120),
);

checkpoint('full cognitive scenario assessment');
resetChatCognitiveSelfEvolutionForTests();
const assessment = assessChatCognitiveArchitecture({
  responseProvider: (prompt) => {
    const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });
    return brain.brainResponse ?? '';
  },
});

assert(
  'cognitive score above threshold',
  assessment.cognitiveScore >= CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD,
  `${assessment.cognitiveScore}/100 (threshold ${CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD})`,
);
assert(
  'reviewer reliability',
  assessment.reviewerReliability === 'RELIABLE',
  assessment.reviewerReliability,
);
assert(
  'no generic fallback violations',
  assessment.genericFallbackViolations === 0,
  String(assessment.genericFallbackViolations),
);
assert(
  'no self-awareness failures',
  assessment.selfAwarenessFailures === 0,
  String(assessment.selfAwarenessFailures),
);
assert(
  'founder testing message clear when unreliable',
  assessment.cognitiveScore >= CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD
    ? assessment.founderTestingMessage === null
    : assessment.founderTestingMessage === 'Reviewer intelligence is not reliable enough yet.',
  assessment.founderTestingMessage ?? 'null (reliable)',
);

for (const scenario of CHAT_COGNITIVE_SCENARIOS) {
  const result = assessment.scenarioResults.find((r) => r.id === scenario.id);
  assert(
    `scenario ${scenario.id}: intent`,
    result?.intentCorrect === true,
    `expected ${scenario.expectedIntent}, got ${result?.actualIntent ?? 'missing'}`,
  );
  assert(
    `scenario ${scenario.id}: quality`,
    (result?.score ?? 0) >= CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD && result?.passed === true,
    `score ${result?.score ?? 0}, passed ${result?.passed}, reasons: ${result?.failureReasons.join('; ') ?? 'n/a'}`,
  );
}

const failed = results.filter((r) => !r.passed);
console.log('\n--- Chat Cognitive Architecture Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}
console.log(`\nScenarios: ${assessment.scenariosPassed}/${assessment.scenariosRun} passed`);
console.log(`Cognitive score: ${assessment.cognitiveScore}/100`);

if (failed.length === 0) {
  console.log(`\n${CHAT_COGNITIVE_ARCHITECTURE_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} validation check(s) failed.`);
process.exit(1);

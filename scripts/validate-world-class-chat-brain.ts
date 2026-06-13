/**
 * Phase 25.38 — World-Class Chat Brain Architecture validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  WORLD_CLASS_CHAT_BRAIN_PASS_TOKEN,
  CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD,
  CHAT_BRAIN_SCENARIOS,
  GENERIC_ONBOARDING_SIGNATURE,
  assessWorldClassChatBrain,
  classifyChatBrainIntent,
  generateWorldClassChatResponse,
} from '../src/world-class-chat-brain/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REQUIRED_FILES = [
  'src/world-class-chat-brain/chat-brain-types.ts',
  'src/world-class-chat-brain/chat-brain-orchestrator.ts',
  'src/world-class-chat-brain/chat-brain-context-builder.ts',
  'src/world-class-chat-brain/chat-brain-capability-model.ts',
  'src/world-class-chat-brain/chat-brain-answer-judge.ts',
  'src/world-class-chat-brain/chat-brain-response-repair.ts',
  'src/world-class-chat-brain/devpulse-intelligence-adapter.ts',
  'src/world-class-chat-brain/index.ts',
  'architecture/WORLD_CLASS_CHAT_BRAIN_ARCHITECTURE_REPORT.md',
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
assert('SELF intent', classifyChatBrainIntent('who created you').category === 'SELF', 'creator');
assert('HUMAN_QUALITY intent', classifyChatBrainIntent('talk to me like a founder, not a machine').category === 'HUMAN_QUALITY', 'founder voice');

checkpoint('generic fallback guard');
const selfResponse = generateWorldClassChatResponse({
  message: 'are you self aware',
  draftResponse: `${GENERIC_ONBOARDING_SIGNATURE}. Tell me your idea!`,
});
assert(
  'blocks generic onboarding for self-awareness',
  !selfResponse.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE),
  selfResponse.finalAnswer.slice(0, 120),
);

checkpoint('brain integration');
const brainSelf = processBrainRequest({ message: 'who created you', timestamp: Date.now() });
assert(
  'brain route uses world-class chat brain',
  !brainSelf.brainResponse.includes(GENERIC_ONBOARDING_SIGNATURE),
  brainSelf.brainResponse.slice(0, 120),
);

checkpoint('full scenario assessment');
const assessment = assessWorldClassChatBrain({
  responseProvider: (prompt) => {
    const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });
    return brain.brainResponse ?? '';
  },
});

assert(
  'brain score above threshold',
  assessment.brainScore >= CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD,
  `${assessment.brainScore}/100`,
);
assert('no generic fallback violations', assessment.genericFallbackViolations === 0, String(assessment.genericFallbackViolations));
assert(
  'scenarios passed',
  assessment.scenariosPassed === assessment.scenariosRun,
  `${assessment.scenariosPassed}/${assessment.scenariosRun}`,
);

for (const scenario of CHAT_BRAIN_SCENARIOS) {
  const result = assessment.scenarioResults.find((r) => r.id === scenario.id);
  assert(
    `scenario ${scenario.id}: intent`,
    result?.intentCorrect === true,
    `expected ${scenario.category}, got ${result?.category ?? 'missing'}`,
  );
  assert(
    `scenario ${scenario.id}: quality`,
    (result?.score ?? 0) >= CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD && result?.passed === true,
    `score ${result?.score ?? 0}, reasons: ${result?.failureReasons.join('; ') ?? 'n/a'}`,
  );
}

const failed = results.filter((r) => !r.passed);
console.log('\n--- World-Class Chat Brain Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}
console.log(`\nScenarios: ${assessment.scenariosPassed}/${assessment.scenariosRun} passed`);
console.log(`Brain score: ${assessment.brainScore}/100`);

if (failed.length === 0) {
  console.log(`\n${WORLD_CLASS_CHAT_BRAIN_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} validation check(s) failed.`);
process.exit(1);

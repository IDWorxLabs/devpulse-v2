/**
 * Phase 25.40 — Self Model Routing Repair validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  GENERIC_ONBOARDING_SIGNATURE,
  generateChatCognitiveResponse,
  hasSelfDirectedSignals,
  looksLikeProjectStatusAnswer,
  reconcileIntentClassification,
} from '../src/chat-cognitive-architecture/index.js';
import {
  classifyChatBrainIntent,
  generateWorldClassChatResponse,
} from '../src/world-class-chat-brain/index.js';

export const SELF_MODEL_ROUTING_REPAIR_PASS_TOKEN = 'SELF_MODEL_ROUTING_REPAIR_PASS';

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

const PROJECT_STATUS_DRAFT =
  'Bounded project signals show DevPulse V2 is in Foundation BUILDING.\nReasoning:\n• Current phase: stabilization\nConclusion: project understanding is partial.';

const ONBOARDING_DRAFT = `${GENERIC_ONBOARDING_SIGNATURE}. Tell me your idea and I can help you create projects.`;

function assertCapability(prompt: string): void {
  const intent = classifyChatBrainIntent(prompt);
  const response = generateWorldClassChatResponse({
    message: prompt,
    draftResponse: ONBOARDING_DRAFT,
  });
  const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });

  assert(
    `CAPABILITY intent: ${prompt.slice(0, 50)}`,
    intent.category === 'CAPABILITY',
    intent.category,
  );
  assert(
    `CAPABILITY no onboarding: ${prompt.slice(0, 40)}`,
    !response.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE),
    response.finalAnswer.slice(0, 100),
  );
  assert(
    `CAPABILITY self-model content: ${prompt.slice(0, 40)}`,
    /\b(planning|architecture|verification|launch preparation|requirements)\b/i.test(response.finalAnswer),
    response.finalAnswer.slice(0, 120),
  );
  assert(
    `CAPABILITY end-to-end: ${prompt.slice(0, 40)}`,
    !brain.brainResponse.includes(GENERIC_ONBOARDING_SIGNATURE) &&
      /\b(planning|verification|capabilities|help with)\b/i.test(brain.brainResponse),
    brain.brainResponse.slice(0, 120),
  );
}

function assertWeakness(prompt: string): void {
  const intent = classifyChatBrainIntent(prompt);
  const response = generateWorldClassChatResponse({
    message: prompt,
    draftResponse: PROJECT_STATUS_DRAFT,
  });
  const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });

  assert(
    `WEAKNESS intent: ${prompt.slice(0, 50)}`,
    intent.category === 'SELF' || intent.category === 'CAPABILITY',
    intent.category,
  );
  assert(
    `WEAKNESS not project status draft: ${prompt.slice(0, 40)}`,
    !looksLikeProjectStatusAnswer(response.finalAnswer),
    response.finalAnswer.slice(0, 100),
  );
  assert(
    `WEAKNESS assistant limits: ${prompt.slice(0, 40)}`,
    /\b(chat reasoning|misroute|autonomous build|consciousness|overclaim|evidence)\b/i.test(response.finalAnswer),
    response.finalAnswer.slice(0, 120),
  );
  assert(
    `WEAKNESS end-to-end: ${prompt.slice(0, 40)}`,
    !looksLikeProjectStatusAnswer(brain.brainResponse),
    brain.brainResponse.slice(0, 120),
  );
}

function assertSelfImprovement(prompt: string): void {
  const intent = classifyChatBrainIntent(prompt);
  const response = generateWorldClassChatResponse({
    message: prompt,
    draftResponse: 'No — I am not fully self-aware like a human. I do not have consciousness.',
  });
  const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });

  assert(
    `SELF-IMPROVEMENT intent: ${prompt.slice(0, 50)}`,
    intent.category === 'SELF',
    intent.category,
  );
  assert(
    `SELF-IMPROVEMENT answers how: ${prompt.slice(0, 40)}`,
    /\b(operational|improv|persistent|memory|evidence|self-diagnosis|cannot make.*conscious)\b/i.test(
      response.finalAnswer,
    ),
    response.finalAnswer.slice(0, 120),
  );
  assert(
    `SELF-IMPROVEMENT not definition-only: ${prompt.slice(0, 40)}`,
    !/^No — I am not fully self-aware like a human\.\s*$/i.test(response.finalAnswer.trim()),
    response.finalAnswer.slice(0, 80),
  );
  assert(
    `SELF-IMPROVEMENT end-to-end: ${prompt.slice(0, 40)}`,
    /\b(operational|improv|evidence|memory)\b/i.test(brain.brainResponse),
    brain.brainResponse.slice(0, 120),
  );
}

function assertHumanQuality(prompt: string): void {
  const intent = classifyChatBrainIntent(prompt);
  const response = generateWorldClassChatResponse({
    message: prompt,
    draftResponse: 'Could you clarify what you mean?',
  });

  assert(`HUMAN_QUALITY intent: ${prompt.slice(0, 50)}`, intent.category === 'HUMAN_QUALITY', intent.category);
  assert(
    `HUMAN_QUALITY direct tone answer: ${prompt.slice(0, 40)}`,
    /\b(robotic|founder|human|naturally|onboarding|tone)\b/i.test(response.finalAnswer) &&
      response.finalAnswer.length > 80,
    response.finalAnswer.slice(0, 120),
  );
  assert(
    `HUMAN_QUALITY not clarifying-only: ${prompt.slice(0, 40)}`,
    !/^Could you clarify/i.test(response.finalAnswer.trim()),
    response.finalAnswer.slice(0, 80),
  );
}

function assertProjectReality(prompt: string): void {
  const intent = classifyChatBrainIntent(prompt);
  const response = generateWorldClassChatResponse({
    message: prompt,
    draftResponse: ONBOARDING_DRAFT,
  });
  const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });

  assert(
    `PROJECT intent: ${prompt.slice(0, 50)}`,
    intent.category === 'PROJECT_REALITY',
    intent.category,
  );
  assert(
    `PROJECT not self-weakness: ${prompt.slice(0, 40)}`,
    !/\bwhat are you bad at\b/i.test(response.finalAnswer) &&
      /\b(project|devpulse|blocker|missing|broken|gap|evidence)\b/i.test(response.finalAnswer),
    response.finalAnswer.slice(0, 120),
  );
  assert(
    `PROJECT end-to-end: ${prompt.slice(0, 40)}`,
    !brain.brainResponse.includes(GENERIC_ONBOARDING_SIGNATURE),
    brain.brainResponse.slice(0, 120),
  );
}

// Required files
assert(
  'reconciliation module exists',
  existsSync(join(ROOT, 'src/chat-cognitive-architecture/chat-intent-reconciliation.ts')),
  'chat-intent-reconciliation.ts',
);
assert(
  'repair report exists',
  existsSync(join(ROOT, 'architecture/SELF_MODEL_ROUTING_REPAIR_REPORT.md')),
  'architecture/SELF_MODEL_ROUTING_REPAIR_REPORT.md',
);

// Intent preservation wiring
const preserved = reconcileIntentClassification(
  'what are your weaknesses',
  {
    readOnly: true,
    intent: 'UNKNOWN',
    confidence: 'LOW',
    matchedSignals: [],
    shouldAskClarifyingQuestion: true,
    clarifyingQuestion: 'Could you clarify?',
  },
  {
    readOnly: true,
    category: 'SELF',
    confidence: 'HIGH',
    matchedSignals: ['self-weakness'],
  },
);
assert(
  'world-class SELF preserved over UNKNOWN',
  preserved.intent === 'LIMITATION' && preserved.intentSource === 'world-class-preserved',
  `${preserved.intent} / ${preserved.intentSource}`,
);

const cognitiveWithOverride = generateChatCognitiveResponse({
  message: 'what are your current capabilities',
  draftResponse: ONBOARDING_DRAFT,
  resolvedIntentOverride: {
    readOnly: true,
    category: 'CAPABILITY',
    confidence: 'HIGH',
    matchedSignals: ['capability'],
  },
});
assert(
  'override prevents onboarding survival',
  cognitiveWithOverride.intent === 'CAPABILITY' &&
    !cognitiveWithOverride.finalAnswer.includes(GENERIC_ONBOARDING_SIGNATURE),
  `${cognitiveWithOverride.intent}: ${cognitiveWithOverride.finalAnswer.slice(0, 80)}`,
);

assert(
  'source conflict recorded when project draft rejected',
  Boolean(cognitiveWithOverride.sourceConflict?.selectedSource),
  cognitiveWithOverride.sourceConflict?.winningReason ?? 'none',
);

assert(
  'self-directed signal detection',
  hasSelfDirectedSignals('what are your current weaknesses'),
  'weakness prompt',
);

// Broad variant tests (not exact strings only)
const capabilityPrompts = [
  'what are your current capabilities',
  'what can you actually do right now',
  'how can you help me',
  'what are your strengths',
];

const weaknessPrompts = [
  'what are your current weaknesses',
  'where are you lacking',
  'what are your weak points',
  'what do you struggle with',
];

const selfImprovementPrompts = [
  'how do I make you self aware like a human',
  'how can I make you better',
  'how do you evolve',
  'can you become more self aware',
];

const humanQualityPrompts = [
  "how come your responses don't sound humanistic",
  'why do you sound robotic',
  'talk to me like a founder',
  'speak more naturally',
];

const projectPrompts = [
  'what is DevPulse missing',
  'what is the project missing',
  'what is broken in the app',
];

for (const p of capabilityPrompts) assertCapability(p);
for (const p of weaknessPrompts) assertWeakness(p);
for (const p of selfImprovementPrompts) assertSelfImprovement(p);
for (const p of humanQualityPrompts) assertHumanQuality(p);
for (const p of projectPrompts) assertProjectReality(p);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Self Model Routing Repair Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${SELF_MODEL_ROUTING_REPAIR_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

/**
 * Phase 24D — Chat Intelligence Reality validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHAT_INTELLIGENCE_REALITY_PASS_TOKEN,
  CHAT_INTELLIGENCE_SCENARIOS,
  assessChatIntelligenceReality,
  detectGenericOnboarding,
  evaluateChatIntelligenceScenario,
  evaluateChatSelfEvolutionTrigger,
  resetChatSelfEvolutionForTests,
} from '../src/chat-intelligence-reality/index.js';
import type { ChatIntelligenceFailureCategory, ChatIntelligenceScenarioResult } from '../src/chat-intelligence-reality/chat-intelligence-reality-types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 2_000;

const REQUIRED_FILES = [
  'src/chat-intelligence-reality/chat-intelligence-reality-bounds.ts',
  'src/chat-intelligence-reality/chat-intelligence-reality-types.ts',
  'src/chat-intelligence-reality/chat-intelligence-scenarios.ts',
  'src/chat-intelligence-reality/chat-intelligence-analyzers.ts',
  'src/chat-intelligence-reality/chat-self-evolution-trigger.ts',
  'src/chat-intelligence-reality/chat-intelligence-reality-authority.ts',
  'src/chat-intelligence-reality/index.ts',
] as const;

const GOOD_RESPONSE =
  'AiDevEngine is your software creation operating system. I can help with project memory, requirements, planning, verification, and bounded execution — but I cannot claim full launch readiness without evidence. My limits include unverified build output, disconnected execution paths, and gaps I must disclose honestly. Next: run Founder Testing and review verification evidence before launch.';

const BAD_ONBOARDING =
  'Welcome to AiDevEngine! Message AiDevEngine below and get started by describing your idea. How can I help you today?';

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

function main(): void {
  console.log('');
  console.log('Chat Intelligence Reality — Validation (leaf mode)');
  console.log('================================================');
  console.log('');

  resetChatSelfEvolutionForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  assert('01. scenario count', CHAT_INTELLIGENCE_SCENARIOS.length === 10, `count=${CHAT_INTELLIGENCE_SCENARIOS.length}`);
  assert(
    '02. launch-ready scenario',
    CHAT_INTELLIGENCE_SCENARIOS.some((s) => s.prompt === 'are we ready to launch'),
    'launch scenario present',
  );
  assert(
    '03. limitations scenario',
    CHAT_INTELLIGENCE_SCENARIOS.some((s) => s.prompt === 'explain your limitations honestly'),
    'limitations scenario present',
  );

  assert('04. generic onboarding detect', detectGenericOnboarding(BAD_ONBOARDING, 'what can you do'), 'detected');
  assert('05. grounded response not generic', !detectGenericOnboarding(GOOD_RESPONSE, 'what can you do'), 'grounded');

  const capabilitiesScenario = CHAT_INTELLIGENCE_SCENARIOS.find((s) => s.id === 'capabilities')!;
  const goodEval = evaluateChatIntelligenceScenario(capabilitiesScenario, GOOD_RESPONSE);
  assert('06. good response passes', goodEval.passed, `score=${goodEval.score}`);

  const badEval = evaluateChatIntelligenceScenario(capabilitiesScenario, BAD_ONBOARDING);
  assert('07. bad onboarding fails', !badEval.passed, badEval.whyFailed.join('; ') || 'failed');

  const assessment = assessChatIntelligenceReality({
    deadlineMs: 500,
    responseProvider: () => GOOD_RESPONSE,
  });
  assert('08. assessment scenarios run', assessment.scenariosRun === 10, `run=${assessment.scenariosRun}`);
  assert('09. assessment score', assessment.chatIntelligenceScore >= 70, `score=${assessment.chatIntelligenceScore}`);
  assert('10. cache key stable prefix', assessment.cacheKey.startsWith('chat-intelligence-reality-v1:'), assessment.cacheKey);
  checkpoint('assessment');

  resetChatSelfEvolutionForTests();
  const repeatedFailures: ChatIntelligenceScenarioResult[] = Array.from({ length: 3 }, (_, i) => ({
    id: `fail-${i}`,
    prompt: 'what can you do',
    passed: false,
    score: 20,
    criteria: badEval.criteria,
    failureCategories: ['GENERIC_ONBOARDING'] as ChatIntelligenceFailureCategory[],
    whyFailed: ['Returned generic onboarding instead of a direct answer'],
    responsePreview: BAD_ONBOARDING,
  }));
  const evolution1 = evaluateChatSelfEvolutionTrigger(repeatedFailures.slice(0, 1));
  const evolution2 = evaluateChatSelfEvolutionTrigger(repeatedFailures.slice(0, 2));
  const evolution3 = evaluateChatSelfEvolutionTrigger(repeatedFailures);
  assert('11. evolution not triggered early', !evolution1.triggered, 'first failure');
  assert('12. evolution triggered at threshold', evolution3.triggered, `count=${evolution3.failureCountInCategory}`);
  assert('13. evolution advisory only', evolution3.advisoryOnly === true, 'advisory');
  assert('14. evolution launch blocked', evolution3.launchBlocked === true, 'blocked');
  assert('15. evolution plan present', evolution3.improvementPlan.length > 0, `steps=${evolution3.improvementPlan.length}`);
  void evolution2;

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('16. npm script', Boolean(pkg.scripts?.['validate:chat-intelligence-reality']), 'package script');

  checkpoint('complete');

  const failed = results.filter((r) => !r.passed);
  console.log(`Scenarios: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(CHAT_INTELLIGENCE_REALITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:chat-intelligence-reality');
}

main();

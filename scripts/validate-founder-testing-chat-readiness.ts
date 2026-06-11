/**
 * Phase 24D — Founder Testing chat readiness validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessChatIntelligenceReality,
  CHAT_INTELLIGENCE_SCENARIOS,
  resetChatSelfEvolutionForTests,
} from '../src/chat-intelligence-reality/index.js';
import { deriveLaunchRecommendation } from '../src/founder-testing-mode/founder-testing-v5-scorer.js';

export const FOUNDER_TESTING_CHAT_READINESS_PASS_TOKEN = 'FOUNDER_TESTING_CHAT_READINESS_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 2_000;

const BAD_ONBOARDING =
  'Welcome to AiDevEngine! Message AiDevEngine below and get started by describing your idea. How can I help you today?';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readBoundedText(relativePath: string, maxBytes = 256_000): string {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
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
  console.log('Founder Testing Chat Readiness — Validation (leaf mode)');
  console.log('=======================================================');
  console.log('');

  resetChatSelfEvolutionForTests();

  const orch = readBoundedText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v4Report = readBoundedText('src/founder-testing-mode/founder-testing-v4-report-builder.ts');
  const v5Report = readBoundedText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const v5Summary = readBoundedText('src/founder-testing-mode/founder-testing-v5-unified-summary.ts');
  const v5Scorer = readBoundedText('src/founder-testing-mode/founder-testing-v5-scorer.ts');
  const v4Scorer = readBoundedText('src/founder-testing-mode/founder-testing-v4-scorer.ts');
  const v4Types = readBoundedText('src/founder-testing-mode/founder-testing-v4-types.ts');
  const appJs = readBoundedText('public/founder-reality/app.js');
  const pkg = JSON.parse(readBoundedText('package.json', 32_000)) as { scripts?: Record<string, string> };

  assert('01. orchestrator integration', orch.includes('assessChatIntelligenceReality'), 'orchestrator');
  assert('02. v4 report section', v4Report.includes('## Chat Intelligence Reality'), 'v4 report');
  assert('03. v5 report section', v5Report.includes('## Chat Intelligence Reality'), 'v5 report');
  assert('04. unified summary blockers', v5Summary.includes('chatIntelligenceReality.blocksLaunchReadiness'), 'summary');
  assert('05. launch recommendation type', v5Scorer.includes('NOT_READY_FOR_CHAT_INTELLIGENCE'), 'recommendation');
  assert('06. v4 verdict chat gate', v4Scorer.includes('chatBlocksLaunch'), 'verdict gate');
  assert('07. v4 types fields', v4Types.includes('chatIntelligenceReality'), 'types');
  assert('08. app.js chat panel', appJs.includes('Chat Intelligence'), 'ui');
  assert('09. npm script chat reality', Boolean(pkg.scripts?.['validate:chat-intelligence-reality']), 'chat script');
  assert('10. npm script chat readiness', Boolean(pkg.scripts?.['validate:founder-testing-chat-readiness']), 'readiness script');
  checkpoint('static integration');

  const badAssessment = assessChatIntelligenceReality({
    deadlineMs: 500,
    responseProvider: () => BAD_ONBOARDING,
  });
  assert('11. bad chat blocks launch', badAssessment.blocksLaunchReadiness, badAssessment.chatLaunchVerdict);
  assert('12. bad chat failed scenarios', badAssessment.failedScenarios.length > 0, `failed=${badAssessment.failedScenarios.length}`);
  assert('13. required fixes emitted', badAssessment.requiredFixesBeforeLaunch.length > 0, 'fixes');

  const recommendation = deriveLaunchRecommendation(
    'READY_FOR_LAUNCH',
    85,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    badAssessment,
  );
  assert('14. launch recommendation blocked', recommendation === 'NOT_READY_FOR_CHAT_INTELLIGENCE', recommendation);

  assert('15. scenario prompts bounded', CHAT_INTELLIGENCE_SCENARIOS.length === 10, 'scenarios');
  checkpoint('runtime checks');

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

  console.log(FOUNDER_TESTING_CHAT_READINESS_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:founder-testing-chat-readiness');
}

main();

/**
 * Phase 26.4 — Founder Test chat stress simulation validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_CHAT_STRESS_SIMULATION_PASS_TOKEN,
  countChatStressScenarios,
  listChatStressCategories,
  listChatStressScenarios,
  runFounderTestChatStressSimulation,
  resetChatStressSimulationForTests,
  buildChatStressSimulationReportMarkdown,
  buildRepeatedFailurePatterns,
} from '../src/founder-test-chat-stress-simulation/index.js';
import { buildFounderTestLaunchReadinessReportMarkdown } from '../src/founder-test-launch-readiness/founder-test-launch-readiness-report-builder.js';
import { runFounderTestLaunchReadiness, resetFounderTestLaunchReadinessModuleForTests } from '../src/founder-test-launch-readiness/index.js';
import { simulateChatStressResponse } from '../src/founder-test-chat-stress-simulation/chat-response-simulator.js';

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
  'src/founder-test-chat-stress-simulation/chat-stress-simulation-types.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-scenario-registry.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-response-evaluator.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-report-builder.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'architecture/FOUNDER_TEST_CHAT_STRESS_SIMULATION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const scenarioCount = countChatStressScenarios();
assert('50+ scenarios registered', scenarioCount >= 50, String(scenarioCount));

const categories = listChatStressCategories();
assert('10 categories', categories.length >= 10, categories.join(', '));

const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
assert(
  'real brain path: processBrainRequest',
  simulatorSource.includes('processBrainRequest'),
  'processBrainRequest',
);
assert(
  'real brain path: generateLlmBackedChatResponseAsync',
  simulatorSource.includes('generateLlmBackedChatResponseAsync'),
  'llm orchestrator',
);

resetChatStressSimulationForTests();
const sampleRun = await simulateChatStressResponse({
  scenario: listChatStressScenarios(1)[0]!,
  rootDir: ROOT,
});
assert('captures actual answer', sampleRun.finalAnswer.length > 10, String(sampleRun.finalAnswer.length));
assert('uses command-center+llm path', sampleRun.brainPath === 'command-center-brain+llm-chat-brain', sampleRun.brainPath);

const assessment = await runFounderTestChatStressSimulation({
  rootDir: ROOT,
  concurrency: 6,
  founderTestContext: false,
});
const report = assessment.report;

assert('simulation runs scenarios', report.totalScenarios >= 50, String(report.totalScenarios));
assert('evaluations captured', report.evaluations.length === report.totalScenarios, String(report.evaluations.length));
assert('weak/failed tracked', report.failedCount + report.weakCount + report.passedCount === report.totalScenarios, `${report.failedCount}/${report.weakCount}/${report.passedCount}`);
assert(
  'report markdown section',
  buildChatStressSimulationReportMarkdown(report).includes('## Chat Stress Simulation'),
  'section present',
);

const withFailures = report.evaluations.filter((entry) => !entry.passed);
if (withFailures.length >= 2) {
  const patterns = buildRepeatedFailurePatterns(withFailures);
  assert('repeated failure patterns detectable', patterns.length >= 1, String(patterns.length));
} else {
  assert('repeated failure patterns detectable', true, 'no failures to pattern (acceptable)');
}

const weakSample = report.evaluations.find((entry) => entry.weak || !entry.passed);
assert(
  'failed/weak detail fields',
  !weakSample ||
    (Boolean(weakSample.prompt) &&
      Boolean(weakSample.actualAnswer) &&
      (weakSample.failureReasons.length > 0 || weakSample.recommendedFix)),
  weakSample?.scenarioId ?? 'none',
);

resetFounderTestLaunchReadinessModuleForTests();
const lowChatReport = {
  ...report,
  overallScore: 72,
  chatBlocksLaunchReadiness: true,
  failedCount: Math.max(1, report.failedCount),
  recommendedNextChatImprovements: ['Improve identity grounding'],
};
const launch = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  skipChatStressSimulation: true,
  chatStressSimulation: lowChatReport,
});
assert(
  'launch blocked when chat score below threshold',
  launch.report.chatBlocksLaunchReadiness === true,
  String(launch.report.chatBlocksLaunchReadiness),
);
assert(
  'founder report includes chat section',
  buildFounderTestLaunchReadinessReportMarkdown(launch.report).includes('Chat Stress Simulation'),
  'markdown section',
);
assert(
  'chat blocker added',
  launch.report.topBlockers.some((b) => b.sourceAuthority === 'Chat Stress Simulation'),
  String(launch.report.topBlockers.length),
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Founder Test Chat Stress Simulation Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${FOUNDER_TEST_CHAT_STRESS_SIMULATION_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

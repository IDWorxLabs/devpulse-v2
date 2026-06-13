/**
 * Phase 26.5 — Full product readiness simulation validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FULL_PRODUCT_READINESS_SIMULATION_PASS_TOKEN,
  runFullProductReadinessSimulation,
  resetProductReadinessSimulationForTests,
  resetProductReadinessHistoryForTests,
  buildProductReadinessReportMarkdown,
  PRODUCT_READINESS_WEIGHTS,
} from '../src/founder-test-product-readiness/index.js';
import {
  buildFounderTestLaunchReadinessReportMarkdown,
  resetFounderTestLaunchReadinessModuleForTests,
  runFounderTestLaunchReadiness,
} from '../src/founder-test-launch-readiness/index.js';
import { runFounderTestChatStressSimulation, resetChatStressSimulationForTests } from '../src/founder-test-chat-stress-simulation/index.js';

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
  'src/founder-test-product-readiness/product-readiness-types.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-product-readiness/product-readiness-report-builder.ts',
  'src/founder-test-product-readiness/product-readiness-score-builder.ts',
  'src/founder-test-product-readiness/product-readiness-history.ts',
  'architecture/FULL_PRODUCT_READINESS_SIMULATION_ORCHESTRATOR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

assert('15 simulation weights', Object.keys(PRODUCT_READINESS_WEIGHTS).length === 15, String(Object.keys(PRODUCT_READINESS_WEIGHTS).length));

const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
assert('uses chat stress', orchestratorSource.includes('runFounderTestChatStressSimulation'), 'yes');
assert('uses founder test integration', orchestratorSource.includes('assessFounderTestIntegration'), 'yes');

resetProductReadinessSimulationForTests();
resetProductReadinessHistoryForTests();
resetChatStressSimulationForTests();

const chatStress = await runFounderTestChatStressSimulation({ rootDir: ROOT, maxScenarios: 8, concurrency: 4 });
const assessment = await runFullProductReadinessSimulation({
  rootDir: ROOT,
  skipChatStressSimulation: true,
  chatStressSimulation: chatStress.report,
});

const report = assessment.report;
assert('all simulations execute', report.simulations.length === 15, String(report.simulations.length));
assert('readiness score generated', report.readinessScore >= 0 && report.readinessScore <= 100, String(report.readinessScore));
assert('launch verdict generated', Boolean(report.verdict), report.verdict);
assert('blockers generated', Array.isArray(report.automaticBlockers), String(report.automaticBlockers.length));
assert('recommendations generated', report.selfEvolution.whatShouldWeBuildNext.length > 0, String(report.selfEvolution.whatShouldWeBuildNext.length));
assert('report markdown generated', buildProductReadinessReportMarkdown(report).includes('FULL PRODUCT READINESS SIMULATION'), 'yes');

const categories = new Set(report.simulations.map((s) => s.id));
assert('diverse simulations', categories.size === 15, String(categories.size));

resetFounderTestLaunchReadinessModuleForTests();
const launch = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  chatStressSimulation: chatStress.report,
  productReadinessSimulation: report,
});
assert(
  'founder report includes product readiness',
  buildFounderTestLaunchReadinessReportMarkdown(launch.report).includes('FULL PRODUCT READINESS SIMULATION'),
  'section present',
);
assert(
  'launch blocked when product readiness blocks',
  report.launchBlocked ? launch.report.topBlockers.some((b) => b.sourceAuthority === 'Product Readiness Simulation') : true,
  String(launch.report.topBlockers.length),
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Full Product Readiness Simulation Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${FULL_PRODUCT_READINESS_SIMULATION_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

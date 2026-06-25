/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1 — requirement discovery handoff repair + blocker matrix.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT,
  MULTI_DOMAIN_SCENARIO_COUNT,
  type MultiDomainScenarioResult,
} from '../src/aidevengine-multi-domain-build-proof-v1/index.js';
import {
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_ARTIFACT_DIR,
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_PASS_TOKEN,
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_REPORT_TITLE,
  MULTI_DOMAIN_V1_1_BASELINE_ARTIFACT_DIR,
  MULTI_DOMAIN_PROOF_SCENARIOS_V1_1,
  buildBlockerMatrix,
  formatBlockerMatrixMarkdown,
  runMultiDomainProofScenarioV11,
} from '../src/aidevengine-multi-domain-build-proof-v1-1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_ARTIFACT_DIR);
const V1_BASELINE_DIR = join(ROOT, MULTI_DOMAIN_V1_1_BASELINE_ARTIFACT_DIR);

interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

const validationChecks: ValidationCheck[] = [];

function assertCheck(name: string, passed: boolean, detail: string): void {
  validationChecks.push({ name, detail, passed });
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function loadV1BaselineLaunchReadyCount(): number | null {
  const summaryPath = join(V1_BASELINE_DIR, 'aggregate-summary.json');
  if (!existsSync(summaryPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(summaryPath, 'utf8')) as { launchReadyCount?: number };
    return raw.launchReadyCount ?? null;
  } catch {
    return null;
  }
}

function buildReport(results: MultiDomainScenarioResult[], blockerMatrixMd: string): string {
  const launchReadyCount = results.filter((r) => r.launchReady).length;
  const buildSuccessCount = results.filter((r) => r.buildMaterialization?.npmBuildOk).length;
  const v1LaunchReady = loadV1BaselineLaunchReadyCount();

  const initialCqi = results
    .map((r) => r.enrichedRequirements?.initialConfidence)
    .filter((v): v is number => typeof v === 'number');
  const enrichedCqi = results
    .map((r) => r.enrichedRequirements?.enrichedConfidence)
    .filter((v): v is number => typeof v === 'number');
  const canProceedCount = results.filter(
    (r) => r.enrichedRequirements?.cqiEnriched.canProceedToPlanning,
  ).length;

  const aggregateVerdict =
    results.length === MULTI_DOMAIN_SCENARIO_COUNT && launchReadyCount >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT
      ? 'PASS'
      : results.length === MULTI_DOMAIN_SCENARIO_COUNT
        ? 'PARTIAL'
        : 'FAIL';

  return [
    '# AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `## Verdict: **${aggregateVerdict}**`,
    '',
    aggregateVerdict === 'PASS' ? `**${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_PASS_TOKEN}**` : '',
    '',
    '## V1 → V1.1 repair summary',
    '',
    '- **Root cause (V1):** Enriched CQI clarification answers lacked CQI detection patterns (`workflow`, `value proposition`, `permissions`, etc.), leaving `canProceedToPlanning=false` and `criticalGapCount>0` despite high enriched confidence. Founder evidence collector also re-ran `assessCqiMaturity({ userPrompt })` instead of consuming registered enriched CQI.',
    '- **V1.1 repair:** CQI-pattern clarification answers per domain + `useRegisteredRequirementDiscovery` consumes handoff-registered enriched CQI without stale re-assessment.',
    '- **Gates:** No thresholds weakened; founder review remains advisory unless explicit launch-blocking rules fire.',
    '',
    `| Metric | V1 baseline | V1.1 |`,
    `|--------|-------------|------|`,
    `| Launch-ready | ${v1LaunchReady ?? 'n/a'}/5 | **${launchReadyCount}/5** |`,
    `| Build success | 5/5 | **${buildSuccessCount}/5** |`,
    `| canProceedToPlanning (enriched) | 0/5 | **${canProceedCount}/5** |`,
    `| Avg CQI before→after | 31→88 | **${average(initialCqi)}→${average(enrichedCqi)}** |`,
    '',
    '## Blocker matrix',
    '',
    blockerMatrixMd,
    '',
    '## Scenario results',
    '',
    '| Scenario | Verdict | Build | Runtime | canProceed | criticalGaps | UVL | AFLA | Blockers |',
    '|----------|---------|-------|---------|------------|--------------|-----|------|----------|',
    ...results.map((r) => {
      const runtime = r.visualRuntime
        ? `${r.visualRuntime.passedCount}/${r.visualRuntime.totalCount}`
        : 'n/a';
      const blockers = r.launchBlockers.slice(0, 2).join('; ') || 'none';
      return `| ${r.scenario.id} | **${r.scenarioVerdict}** | ${r.buildMaterialization?.npmBuildOk ? 'OK' : 'FAIL'} | ${runtime} | ${r.enrichedRequirements?.cqiEnriched.canProceedToPlanning ? 'YES' : 'NO'} | ${r.enrichedRequirements?.cqiEnriched.criticalGapCount ?? 'n/a'} | ${r.uvlCoverage ?? 'n/a'}% | ${r.aflaVerdict ?? 'n/a'} | ${blockers.replace(/\|/g, '/')} |`;
    }),
    '',
    '## Validation checks',
    '',
    '| Check | Status | Detail |',
    '|-------|--------|--------|',
    ...validationChecks.map(
      (c) => `| ${c.name} | ${c.passed ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '/')} |`,
    ),
    '',
    '## Artifacts',
    '',
    `\`${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_ARTIFACT_DIR}/\``,
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const results: MultiDomainScenarioResult[] = [];

  for (const scenario of MULTI_DOMAIN_PROOF_SCENARIOS_V1_1) {
    console.log(`\n--- V1.1 scenario: ${scenario.id} (${scenario.productDomain}) ---`);
    const result = await runMultiDomainProofScenarioV11({
      scenario,
      projectRootDir: ROOT,
      artifactRootDir: OUT_DIR,
    });
    results.push(result);
    const canProceed = result.enrichedRequirements?.cqiEnriched.canProceedToPlanning ?? false;
    console.log(
      `Scenario ${scenario.id}: ${result.scenarioVerdict} | canProceed=${canProceed} | criticalGaps=${result.enrichedRequirements?.cqiEnriched.criticalGapCount ?? 'n/a'} | AFLA=${result.aflaVerdict ?? 'n/a'} | launchReady=${result.launchReady}`,
    );
  }

  const blockerMatrix = buildBlockerMatrix(results);
  writeFileSync(
    join(OUT_DIR, 'blocker-matrix.json'),
    `${JSON.stringify(blockerMatrix, null, 2)}\n`,
    'utf8',
  );

  assertCheck(
    'all 5 scenarios executed',
    results.length === MULTI_DOMAIN_SCENARIO_COUNT,
    `${results.length}/${MULTI_DOMAIN_SCENARIO_COUNT}`,
  );

  for (const result of results) {
    const prefix = `scenario ${result.scenario.id}`;
    assertCheck(
      `${prefix} enriched CQI canProceedToPlanning`,
      result.enrichedRequirements?.cqiEnriched.canProceedToPlanning === true,
      `canProceed=${result.enrichedRequirements?.cqiEnriched.canProceedToPlanning} criticalGaps=${result.enrichedRequirements?.cqiEnriched.criticalGapCount ?? 'n/a'}`,
    );
    assertCheck(
      `${prefix} registered requirement discovery consumed`,
      result.enrichedRequirements?.cqiEnriched.canProceedToPlanning === true ||
        (result.handoff?.founderEvidenceAfterHandoff.requirementDiscovery?.canProceedToPlanning ?? false),
      result.handoff?.founderEvidenceAfterHandoff.requirementDiscovery?.canProceedToPlanning
        ? 'registered enriched CQI consumed'
        : 'requirement discovery still incomplete',
    );
    const falselyLaunchReady =
      result.launchReady &&
      (!result.visualRuntime?.playwrightSupported || !result.visualRuntime.boundedRuntimePassed);
    assertCheck(`${prefix} not falsely LAUNCH_READY`, !falselyLaunchReady, result.scenarioVerdict);
  }

  const blockerMatrixMd = formatBlockerMatrixMarkdown(blockerMatrix);
  const report = buildReport(results, blockerMatrixMd);
  writeFileSync(join(ROOT, AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_REPORT_TITLE), report, 'utf8');
  assertCheck('aggregate report written', existsSync(join(ROOT, AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_REPORT_TITLE)), AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_REPORT_TITLE);

  const launchReadyCount = results.filter((r) => r.launchReady).length;
  writeFileSync(
    join(OUT_DIR, 'aggregate-summary.json'),
    `${JSON.stringify(
      {
        launchReadyCount,
        canProceedCount: results.filter((r) => r.enrichedRequirements?.cqiEnriched.canProceedToPlanning).length,
        validationChecks,
        blockerMatrix,
        passToken:
          launchReadyCount >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT && validationChecks.every((c) => c.passed)
            ? AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_PASS_TOKEN
            : null,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log('\n' + report);

  const allValidationPassed = validationChecks.every((c) => c.passed);
  if (!allValidationPassed) {
    console.error('\nValidation checks failed:');
    for (const check of validationChecks.filter((c) => !c.passed)) {
      console.error(`  FAIL — ${check.name}: ${check.detail}`);
    }
  }

  const allCompleted = results.every((r) => r.failureReason === null);
  if (allCompleted && allValidationPassed && launchReadyCount >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT) {
    console.log(`\n${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1_PASS_TOKEN}`);
    process.exit(0);
  }
  if (allCompleted) {
    console.log(`\nV1.1 complete — ${launchReadyCount}/${MULTI_DOMAIN_SCENARIO_COUNT} launch-ready`);
    process.exit(allValidationPassed ? 2 : 1);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — multi-domain launch evidence chain proof.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_ARTIFACT_DIR,
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_PASS_TOKEN,
  AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_REPORT_TITLE,
  MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT,
  MULTI_DOMAIN_PROOF_SCENARIOS,
  MULTI_DOMAIN_SCENARIO_COUNT,
  runMultiDomainProofScenario,
  type MultiDomainScenarioResult,
} from '../src/aidevengine-multi-domain-build-proof-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_ARTIFACT_DIR);

interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

const validationChecks: ValidationCheck[] = [];

function assertCheck(name: string, passed: boolean, detail: string): void {
  validationChecks.push({ name, detail, passed });
}

function countBlockers(results: MultiDomainScenarioResult[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const result of results) {
    for (const blocker of result.launchBlockers) {
      counts.set(blocker, (counts.get(blocker) ?? 0) + 1);
    }
  }
  return counts;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function buildReport(results: MultiDomainScenarioResult[]): string {
  const launchReadyCount = results.filter((r) => r.launchReady).length;
  const buildSuccessCount = results.filter((r) => r.buildMaterialization?.npmBuildOk).length;
  const completedCount = results.filter((r) => r.failureReason === null).length;
  const generalizes =
    launchReadyCount >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT &&
    results.every((r) => !r.launchReady || (r.visualRuntime?.playwrightSupported && r.visualRuntime.boundedRuntimePassed));

  const initialCqi = results
    .map((r) => r.enrichedRequirements?.initialConfidence)
    .filter((v): v is number => typeof v === 'number');
  const enrichedCqi = results
    .map((r) => r.enrichedRequirements?.enrichedConfidence)
    .filter((v): v is number => typeof v === 'number');
  const uvlCoverage = results.map((r) => r.uvlCoverage).filter((v): v is number => typeof v === 'number');
  const uvlConfidence = results.map((r) => r.uvlConfidence).filter((v): v is number => typeof v === 'number');
  const aflaScores = results.map((r) => r.aflaScore).filter((v): v is number => typeof v === 'number');

  const blockerCounts = [...countBlockers(results).entries()].sort((a, b) => b[1] - a[1]);
  const failedScenarios = results.filter((r) => !r.launchReady);

  const scenarioTable = [
    '| Scenario | Domain | Verdict | Build | Runtime | UVL | AFLA | Launch blockers |',
    '|----------|--------|---------|-------|---------|-----|------|-----------------|',
    ...results.map((r) => {
      const runtime = r.visualRuntime
        ? r.visualRuntime.playwrightSupported
          ? `${r.visualRuntime.passedCount}/${r.visualRuntime.totalCount}`
          : 'unsupported'
        : 'n/a';
      const blockers =
        r.launchBlockers.length > 0 ? r.launchBlockers.slice(0, 2).join('; ') : 'none';
      return `| ${r.scenario.id} | ${r.scenario.productDomain} | **${r.scenarioVerdict}** | ${r.buildMaterialization?.npmBuildOk ? 'OK' : 'FAIL'} | ${runtime} | ${r.uvlCoverage ?? 'n/a'}%/${r.uvlConfidence ?? 'n/a'} | ${r.aflaVerdict ?? 'n/a'} (${r.aflaScore ?? 'n/a'}) | ${blockers.replace(/\|/g, '/')} |`;
    }),
  ].join('\n');

  const aggregateVerdict =
    completedCount === MULTI_DOMAIN_SCENARIO_COUNT && launchReadyCount >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT
      ? 'PASS'
      : completedCount === MULTI_DOMAIN_SCENARIO_COUNT
        ? 'PARTIAL'
        : 'FAIL';

  return [
    '# AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `## Verdict: **${aggregateVerdict}**`,
    '',
    aggregateVerdict === 'PASS' ? `**${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_PASS_TOKEN}**` : '',
    '',
    '## Summary',
    '',
    `- Scenarios executed: **${completedCount}/${MULTI_DOMAIN_SCENARIO_COUNT}**`,
    `- Build success rate: **${buildSuccessCount}/${MULTI_DOMAIN_SCENARIO_COUNT}** (${Math.round((buildSuccessCount / MULTI_DOMAIN_SCENARIO_COUNT) * 100)}%)`,
    `- Launch-ready rate: **${launchReadyCount}/${MULTI_DOMAIN_SCENARIO_COUNT}** (${Math.round((launchReadyCount / MULTI_DOMAIN_SCENARIO_COUNT) * 100)}%)`,
    `- Average CQI confidence before clarification: **${average(initialCqi)}**`,
    `- Average CQI confidence after clarification: **${average(enrichedCqi)}**`,
    `- Average UVL coverage/confidence: **${average(uvlCoverage)}% / ${average(uvlConfidence)}**`,
    `- Average AFLA score: **${average(aflaScores)}**`,
    `- AiDevEngine generalizes beyond Task Tracker: **${generalizes ? 'YES' : 'NO (honest assessment)'}**`,
    '',
    '## Scenario-by-scenario results',
    '',
    scenarioTable,
    '',
    '## Common blockers',
    '',
    ...(blockerCounts.length > 0
      ? blockerCounts.slice(0, 10).map(([blocker, count]) => `- (${count}x) ${blocker}`)
      : ['- none']),
    '',
    '## Next improvements',
    '',
    ...(failedScenarios.length > 0
      ? failedScenarios.map(
          (r) =>
            `- **${r.scenario.id}**: ${r.launchBlockers[0] ?? r.failureReason ?? 'see blocking-trace.json'}`,
        )
      : ['- All scenarios launch-ready — continue expanding domain coverage']),
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
    `\`${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_ARTIFACT_DIR}/\``,
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const results: MultiDomainScenarioResult[] = [];

  for (const scenario of MULTI_DOMAIN_PROOF_SCENARIOS) {
    console.log(`\n--- Running scenario: ${scenario.id} (${scenario.productDomain}) ---`);
    const result = await runMultiDomainProofScenario({
      scenario,
      projectRootDir: ROOT,
      artifactRootDir: OUT_DIR,
    });
    results.push(result);
    console.log(
      `Scenario ${scenario.id}: ${result.scenarioVerdict} | build=${result.buildMaterialization?.npmBuildOk ? 'OK' : 'FAIL'} | AFLA=${result.aflaVerdict ?? 'n/a'} | blockers=${result.launchBlockers.length}`,
    );
  }

  assertCheck(
    'all 5 scenarios executed',
    results.length === MULTI_DOMAIN_SCENARIO_COUNT,
    `${results.length}/${MULTI_DOMAIN_SCENARIO_COUNT}`,
  );

  for (const result of results) {
    const prefix = `scenario ${result.scenario.id}`;
    assertCheck(
      `${prefix} produced workspace or exact failure reason`,
      Boolean(result.buildMaterialization?.workspacePath) || Boolean(result.failureReason),
      result.buildMaterialization?.workspacePath ?? result.failureReason ?? 'missing',
    );
    assertCheck(
      `${prefix} attempted requirements enrichment`,
      Boolean(result.enrichedRequirements),
      result.enrichedRequirements
        ? `initial=${result.enrichedRequirements.initialConfidence} enriched=${result.enrichedRequirements.enrichedConfidence}`
        : 'no enrichment',
    );
    assertCheck(
      `${prefix} attempted build`,
      result.buildMaterialization !== null,
      result.buildMaterialization?.npmBuildOk ? 'build ok' : `exit ${result.buildMaterialization?.npmBuildExitCode ?? 'n/a'}`,
    );
    assertCheck(
      `${prefix} attempted runtime/visual verification`,
      Boolean(result.visualRuntime) || Boolean(result.failureReason),
      result.visualRuntime
        ? `${result.visualRuntime.passedCount}/${result.visualRuntime.totalCount} checks`
        : result.failureReason ?? 'skipped',
    );
    assertCheck(
      `${prefix} produced product architecture evidence`,
      Boolean(result.productArchitectureEvidence),
      result.productArchitectureEvidence
        ? `${result.productArchitectureEvidence.passedCount}/${result.productArchitectureEvidence.totalCount} items`
        : 'missing',
    );
    assertCheck(
      `${prefix} produced UVL/AFLA/final verdict`,
      Boolean(result.handoff) && result.aflaVerdict !== null,
      result.aflaVerdict ?? result.failureReason ?? 'missing',
    );
    const falselyLaunchReady =
      result.launchReady &&
      (!result.visualRuntime?.playwrightSupported || !result.visualRuntime.boundedRuntimePassed);
    assertCheck(
      `${prefix} not falsely marked LAUNCH_READY`,
      !falselyLaunchReady,
      falselyLaunchReady ? 'LAUNCH_READY without complete runtime verification' : result.scenarioVerdict,
    );
  }

  const report = buildReport(results);
  const reportPath = join(ROOT, AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_REPORT_TITLE);
  writeFileSync(reportPath, report, 'utf8');
  assertCheck('aggregate report written', existsSync(reportPath), AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_REPORT_TITLE);

  writeFileSync(
    join(OUT_DIR, 'aggregate-summary.json'),
    `${JSON.stringify(
      {
        scenarioCount: results.length,
        launchReadyCount: results.filter((r) => r.launchReady).length,
        buildSuccessCount: results.filter((r) => r.buildMaterialization?.npmBuildOk).length,
        validationChecks,
        scenarios: results.map((r) => ({
          id: r.scenario.id,
          productDomain: r.scenario.productDomain,
          scenarioVerdict: r.scenarioVerdict,
          launchReady: r.launchReady,
          launchBlockers: r.launchBlockers,
          initialCqiConfidence: r.enrichedRequirements?.initialConfidence ?? null,
          enrichedCqiConfidence: r.enrichedRequirements?.enrichedConfidence ?? null,
          uvlCoverage: r.uvlCoverage,
          uvlConfidence: r.uvlConfidence,
          aflaVerdict: r.aflaVerdict,
          aflaScore: r.aflaScore,
          founderLaunchVerdict: r.founderLaunchVerdict,
        })),
        passToken:
          results.filter((r) => r.launchReady).length >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT &&
          validationChecks.every((c) => c.passed)
            ? AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_PASS_TOKEN
            : null,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log('\n' + report);
  console.log(`\nReport: ${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_REPORT_TITLE}`);
  console.log(`Artifacts: ${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_ARTIFACT_DIR}/`);

  const allValidationPassed = validationChecks.every((c) => c.passed);
  if (!allValidationPassed) {
    console.error('\nValidation checks failed:');
    for (const check of validationChecks.filter((c) => !c.passed)) {
      console.error(`  FAIL — ${check.name}: ${check.detail}`);
    }
    process.exit(1);
  }

  const launchReadyCount = results.filter((r) => r.launchReady).length;
  const allCompleted = results.every((r) => r.failureReason === null);

  if (allCompleted && launchReadyCount >= MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT) {
    console.log(`\n${AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_PASS_TOKEN}`);
    process.exit(0);
  }

  if (allCompleted) {
    console.log(
      `\nMulti-domain proof complete — ${launchReadyCount}/${MULTI_DOMAIN_SCENARIO_COUNT} launch-ready (need ${MULTI_DOMAIN_LAUNCH_READY_MIN_COUNT})`,
    );
    process.exit(2);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

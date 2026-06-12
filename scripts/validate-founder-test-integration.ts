/**
 * Phase 24F — Founder Test Integration validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_READY_MIN_SCORE,
  FOUNDER_READY_WITH_WARNINGS_MIN_SCORE,
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
  FOUNDER_TEST_INTEGRATION_PASS_TOKEN,
  FOUNDER_TEST_VERDICTS,
  assessFounderTestIntegration,
  deriveFounderTestVerdict,
  resetFounderTestIntegrationModuleForTests,
} from '../src/founder-test-integration/index.js';
import type {
  FounderTestAuthorityId,
  FounderTestAuthorityResult,
  FounderTestFinding,
  FounderTestScore,
  FounderTestSummary,
} from '../src/founder-test-integration/index.js';

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
  'src/founder-test-integration/founder-test-integration-types.ts',
  'src/founder-test-integration/founder-test-integration-registry.ts',
  'src/founder-test-integration/founder-test-integration-authority.ts',
  'src/founder-test-integration/founder-test-integration-orchestrator.ts',
  'src/founder-test-integration/founder-test-integration-report-builder.ts',
  'src/founder-test-integration/founder-test-integration-history.ts',
  'src/founder-test-integration/index.ts',
  'architecture/FOUNDER_TEST_INTEGRATION_REPORT.md',
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

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function buildFixtureResult(
  authorityId: FounderTestAuthorityId,
  score: number,
  overrides: Partial<FounderTestAuthorityResult> = {},
): FounderTestAuthorityResult {
  const registration = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.find((entry) => entry.authorityId === authorityId)!;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    authorityId,
    displayName: registration.displayName,
    sourceModule: registration.sourceModule,
    readOnly: true,
    available: true,
    normalizedScore,
    weight: registration.weight,
    weightedContribution: Math.round((normalizedScore * registration.weight) / 100),
    blockers: [],
    warnings: [],
    recommendations: [],
    missingCapabilities: [],
    criticalBlockerCount: 0,
    regressionDetected: false,
    simulationPassed: authorityId === 'FOUNDER_SIMULATION' ? score >= 70 : null,
    executionProofVerdict:
      authorityId === 'EXECUTION_PROOF_EVOLUTION' ? (overrides.executionProofVerdict ?? 'PROVEN_FIXED') : null,
    ...overrides,
  };
}

function buildFixturePortfolio(
  scoreByAuthority: Partial<Record<FounderTestAuthorityId, number>>,
  overrides: Partial<Record<FounderTestAuthorityId, Partial<FounderTestAuthorityResult>>> = {},
): FounderTestAuthorityResult[] {
  return FOUNDER_TEST_AUTHORITY_REGISTRATIONS.map((entry) =>
    buildFixtureResult(
      entry.authorityId,
      scoreByAuthority[entry.authorityId] ?? 80,
      overrides[entry.authorityId],
    ),
  );
}

function buildSummaryFromResults(authorityResults: FounderTestAuthorityResult[]): FounderTestSummary {
  const simulation = authorityResults.find((r) => r.authorityId === 'FOUNDER_SIMULATION');
  const requirement = authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY');
  const executionProof = authorityResults.find((r) => r.authorityId === 'EXECUTION_PROOF_EVOLUTION');
  const majorIds = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.filter((e) => e.major).map((e) => e.authorityId);

  return {
    participatingAuthorities: authorityResults.length,
    availableAuthorities: authorityResults.filter((r) => r.available).length,
    missingAuthorities: majorIds
      .filter((id) => {
        const result = authorityResults.find((r) => r.authorityId === id);
        return !result || !result.available;
      })
      .map((id) => FOUNDER_TEST_AUTHORITY_REGISTRATIONS.find((e) => e.authorityId === id)!.displayName),
    criticalBlockerCount: authorityResults.reduce((sum, r) => sum + r.criticalBlockerCount, 0),
    warningCount: authorityResults.reduce((sum, r) => sum + r.warnings.length, 0),
    recommendationCount: authorityResults.reduce((sum, r) => sum + r.recommendations.length, 0),
    founderSimulationPassed: simulation?.simulationPassed ?? simulation!.normalizedScore >= 70,
    executionProofRegressionFree:
      executionProof?.executionProofVerdict !== 'REGRESSION_DETECTED' && !executionProof?.regressionDetected,
    requirementRealityAboveThreshold: requirement ? requirement.normalizedScore >= 60 : false,
  };
}

function buildScoreFromResults(authorityResults: FounderTestAuthorityResult[]): FounderTestScore {
  const byAuthority = {} as FounderTestScore['byAuthority'];
  const weightedBreakdown = {} as FounderTestScore['weightedBreakdown'];
  let overall = 0;
  for (const result of authorityResults) {
    byAuthority[result.authorityId] = result.normalizedScore;
    weightedBreakdown[result.authorityId] = result.weightedContribution;
    overall += result.weightedContribution;
  }
  return { overall: Math.round(overall), byAuthority, weightedBreakdown };
}

function main(): void {
  console.log('');
  console.log('Founder Test Integration — Validation (leaf mode)');
  console.log('=================================================');
  console.log('');

  checkpoint('start');
  resetFounderTestIntegrationModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/founder-test-integration/founder-test-integration-authority.ts');
  const orchestratorSource = readText('src/founder-test-integration/founder-test-integration-orchestrator.ts');
  const registrySource = readText('src/founder-test-integration/founder-test-integration-registry.ts');
  const reportMd = readText('architecture/FOUNDER_TEST_INTEGRATION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:founder-test-integration']), 'package.json');
  assert('02. orchestrator export exists', orchestratorSource.includes('runFounderTestIntegration'), 'orchestrator');
  assert('03. authority export exists', authoritySource.includes('assessFounderTestIntegration'), 'authority');
  assert('04. nine authority registrations', FOUNDER_TEST_AUTHORITY_REGISTRATIONS.length === 9, String(FOUNDER_TEST_AUTHORITY_REGISTRATIONS.length));
  assert(
    '05. registry weights sum to 100',
    FOUNDER_TEST_AUTHORITY_REGISTRATIONS.reduce((sum, entry) => sum + entry.weight, 0) === 100,
    'weights',
  );
  assert(
    '06. all verdicts registered',
    FOUNDER_TEST_VERDICTS.length === 5 && FOUNDER_TEST_VERDICTS.every((v) => registrySource.includes(`'${v}'`) || authoritySource.includes(`'${v}'`)),
    'verdicts',
  );
  assert('07. report pass token', reportMd.includes(FOUNDER_TEST_INTEGRATION_PASS_TOKEN), 'report token');
  assert('08. no nested npm validation', !orchestratorSource.includes("execSync('npm run validate"), 'cascade');
  assert('09. no network fetch in module', !orchestratorSource.includes('fetch(') && !authoritySource.includes('fetch('), 'network');
  assert('10. read-only orchestrator', orchestratorSource.includes('readOnly: true'), 'read-only');
  checkpoint('static checks');

  const readyResults = buildFixturePortfolio(
    {
      FOUNDER_REALITY: 92,
      UI_REALITY: 90,
      REQUIREMENT_REALITY: 88,
      FOUNDER_SIMULATION: 91,
      EXECUTION_PROOF_EVOLUTION: 95,
      LIVE_PREVIEW_REALITY: 86,
      MOBILE_RUNTIME_REALITY: 82,
      VERIFICATION_REALITY: 89,
      LAUNCH_COUNCIL: 87,
    },
    {
      FOUNDER_SIMULATION: { simulationPassed: true },
      EXECUTION_PROOF_EVOLUTION: { executionProofVerdict: 'PROVEN_FIXED', regressionDetected: false },
    },
  );
  const readyScore = buildScoreFromResults(readyResults);
  const readySummary = buildSummaryFromResults(readyResults);
  const readyVerdict = deriveFounderTestVerdict(readyScore, readySummary, [] as FounderTestFinding[]);
  assert(
    '11. founder ready scenario passes',
    readyVerdict === 'FOUNDER_READY' && readyScore.overall >= FOUNDER_READY_MIN_SCORE,
    `${readyVerdict} score=${readyScore.overall}`,
  );

  const warningResults = buildFixturePortfolio({
    FOUNDER_REALITY: 78,
    UI_REALITY: 76,
    REQUIREMENT_REALITY: 74,
    FOUNDER_SIMULATION: 75,
    EXECUTION_PROOF_EVOLUTION: 72,
    LIVE_PREVIEW_REALITY: 73,
    MOBILE_RUNTIME_REALITY: 70,
    VERIFICATION_REALITY: 77,
    LAUNCH_COUNCIL: 74,
  });
  const warningScore = buildScoreFromResults(warningResults);
  const warningSummary = buildSummaryFromResults(warningResults);
  const warningVerdict = deriveFounderTestVerdict(warningScore, warningSummary, [] as FounderTestFinding[]);
  assert(
    '12. warning scenario passes',
    warningVerdict === 'FOUNDER_READY_WITH_WARNINGS' &&
      warningScore.overall >= FOUNDER_READY_WITH_WARNINGS_MIN_SCORE &&
      warningScore.overall < FOUNDER_READY_MIN_SCORE,
    `${warningVerdict} score=${warningScore.overall}`,
  );

  const blockedResults = buildFixturePortfolio(
    { FOUNDER_REALITY: 88, UI_REALITY: 85, REQUIREMENT_REALITY: 82 },
    {
      FOUNDER_REALITY: {
        criticalBlockerCount: 1,
        blockers: ['Critical workflow continuity break'],
      },
    },
  );
  const blockedScore = buildScoreFromResults(blockedResults);
  const blockedSummary = buildSummaryFromResults(blockedResults);
  const blockedFindings = [{ findingId: 'f1', category: 'WORKFLOW' as const, severity: 'CRITICAL' as const, summary: 'Critical workflow continuity break', sourceAuthority: 'FOUNDER_REALITY' as const, recommendation: null }];
  const blockedVerdict = deriveFounderTestVerdict(blockedScore, blockedSummary, blockedFindings);
  assert('13. blocked scenario passes', blockedVerdict === 'BLOCKED', blockedVerdict);

  const insufficientResults = buildFixturePortfolio(
    { FOUNDER_REALITY: 80, UI_REALITY: 80, REQUIREMENT_REALITY: 80 },
    {
      FOUNDER_SIMULATION: { available: false },
      EXECUTION_PROOF_EVOLUTION: { available: false },
      LIVE_PREVIEW_REALITY: { available: false },
      VERIFICATION_REALITY: { available: false },
    },
  );
  const insufficientSummary = buildSummaryFromResults(insufficientResults);
  const insufficientScore = buildScoreFromResults(insufficientResults);
  const insufficientVerdict = deriveFounderTestVerdict(insufficientScore, insufficientSummary, [] as FounderTestFinding[]);
  assert('14. insufficient evidence scenario passes', insufficientVerdict === 'INSUFFICIENT_EVIDENCE', insufficientVerdict);

  resetFounderTestIntegrationModuleForTests();
  const liveAssessment = assessFounderTestIntegration({ rootDir: ROOT });
  checkpoint('live orchestration');
  assert(
    '15. live orchestration executes nine authorities',
    liveAssessment.run.authorityResults.length === 9,
    String(liveAssessment.run.authorityResults.length),
  );
  assert(
    '16. live score bounded',
    liveAssessment.score.overall >= 0 && liveAssessment.score.overall <= 100,
    String(liveAssessment.score.overall),
  );
  assert(
    '17. live verdict recognized',
    FOUNDER_TEST_VERDICTS.includes(liveAssessment.verdict),
    liveAssessment.verdict,
  );
  assert('18. scoring thresholds in registry', registrySource.includes(String(FOUNDER_READY_MIN_SCORE)), 'thresholds');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('FOUNDER_TEST_INTEGRATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(FOUNDER_TEST_INTEGRATION_PASS_TOKEN);
  console.log('');
  console.log('Scenario scores:');
  console.log(`  FOUNDER_READY:               ${readyScore.overall}/100`);
  console.log(`  FOUNDER_READY_WITH_WARNINGS: ${warningScore.overall}/100`);
  console.log(`  Live orchestration:          ${liveAssessment.score.overall}/100 (${liveAssessment.verdict})`);
  console.log('');
  console.log('Report: architecture/FOUNDER_TEST_INTEGRATION_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();

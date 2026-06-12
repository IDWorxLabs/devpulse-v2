/**
 * Phase 25.1 — Launch Council Foundation validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LAUNCH_COUNCIL_FOUNDATION_PASS_TOKEN,
  assessLaunchCouncil,
  assertLaunchCouncilRegistryIntegrity,
  buildLaunchCouncilReport,
  buildLaunchCouncilReportMarkdown,
  getLaunchCouncilHistorySize,
  listLaunchCouncilAuthorities,
  resetLaunchCouncilHistoryForTests,
  validateLaunchCouncilBlockerAggregation,
  validateLaunchCouncilDeterministicScoring,
  validateLaunchCouncilRegistry,
} from '../src/launch-council/index.js';
import { assembleLaunchCouncilFromFounderTestV4 } from '../src/launch-council/launch-council-founder-integration.js';
import type { LaunchCouncilAuthorityResult } from '../src/launch-council/launch-council-types.js';

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
  'src/launch-council/launch-council-bounds.ts',
  'src/launch-council/launch-council-types.ts',
  'src/launch-council/launch-council-registry.ts',
  'src/launch-council/launch-council-score-builder.ts',
  'src/launch-council/launch-council-history.ts',
  'src/launch-council/launch-council-report-builder.ts',
  'src/launch-council/launch-council-validator.ts',
  'src/launch-council/launch-council-authority.ts',
  'src/launch-council/launch-council-founder-integration.ts',
  'src/launch-council/index.ts',
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

function sampleAuthority(
  authorityId: string,
  authorityName: string,
  authorityCategory: LaunchCouncilAuthorityResult['authorityCategory'],
  score: number,
  status: LaunchCouncilAuthorityResult['status'],
  launchBlocker: boolean,
): LaunchCouncilAuthorityResult {
  return {
    authorityId,
    authorityName,
    authorityCategory,
    score,
    confidence: score,
    status,
    launchBlocker,
    findings: launchBlocker ? [`${authorityName} launch blocker active`] : [`${authorityName} participating`],
    recommendations: launchBlocker ? [`Resolve ${authorityName} blocker`] : [`Maintain ${authorityName} readiness`],
  };
}

function main(): void {
  console.log('');
  console.log('Launch Council Foundation — Validation (leaf mode)');
  console.log('=================================================');
  console.log('');

  resetLaunchCouncilHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const registry = validateLaunchCouncilRegistry();
  assert('01. registry integrity', registry.passed && assertLaunchCouncilRegistryIntegrity(), registry.detail);
  assert('02. registered authorities', listLaunchCouncilAuthorities().length === 23, 'count=23');

  const sampleResults: LaunchCouncilAuthorityResult[] = [
    sampleAuthority('founder-testing', 'Founder Testing', 'FOUNDER_TESTING', 72, 'WARNING', false),
    sampleAuthority('chat-intelligence-reality', 'Chat Intelligence Reality', 'CHAT_INTELLIGENCE', 68, 'WARNING', true),
    sampleAuthority('repository-typecheck-reality', 'Repository Typecheck Reality', 'REPOSITORY_INTEGRITY', 0, 'NOT_RUN', true),
    sampleAuthority('skeptical-founder-simulator', 'Skeptical Founder Simulator', 'SKEPTICAL_FOUNDER', 48, 'FAIL', true),
    sampleAuthority('promise-fulfillment-authority', 'Promise Fulfillment Authority', 'PROMISE_FULFILLMENT', 42, 'FAIL', true),
    sampleAuthority('trust-authority', 'Trust Authority', 'TRUST_AUTHORITY', 38, 'FAIL', true),
    sampleAuthority('self-awareness-authority', 'Self-Awareness Authority', 'SELF_AWARENESS', 35, 'FAIL', true),
    sampleAuthority('user-success-authority', 'User Success Authority', 'USER_SUCCESS', 32, 'FAIL', true),
    sampleAuthority('gap-detection-authority', 'Gap Detection Authority', 'GAP_DETECTION', 28, 'FAIL', true),
    sampleAuthority('self-evolution-authority', 'Self-Evolution Authority', 'SELF_EVOLUTION', 24, 'FAIL', true),
    sampleAuthority('unknown-discovery-authority', 'Unknown Discovery Authority', 'UNKNOWN_DISCOVERY', 20, 'FAIL', true),
    sampleAuthority('first-time-user-reality-authority', 'First-Time User Reality Authority', 'FIRST_TIME_USER_REALITY', 18, 'FAIL', true),
    sampleAuthority('customer-value-authority', 'Customer Value Authority', 'CUSTOMER_VALUE', 16, 'FAIL', true),
    sampleAuthority('competitive-reality-authority', 'Competitive Reality Authority', 'COMPETITIVE_REALITY', 14, 'FAIL', true),
    sampleAuthority('reality-proof-authority', 'Reality-Proof Authority', 'REALITY_PROOF', 12, 'FAIL', true),
    sampleAuthority('real-user-reality-authority', 'Real User Reality Authority', 'REAL_USER_REALITY', 10, 'WARNING', false),
    sampleAuthority('adoption-prediction-authority', 'Adoption Prediction Authority', 'ADOPTION_PREDICTION', 8, 'WARNING', false),
    sampleAuthority('launch-readiness-authority', 'Launch Readiness Authority', 'LAUNCH_READINESS', 6, 'FAIL', true),
  ];

  const deterministic = validateLaunchCouncilDeterministicScoring(sampleResults);
  assert('03. deterministic scoring', deterministic.passed, deterministic.detail);

  const blocked = validateLaunchCouncilBlockerAggregation(sampleResults);
  assert('04. blocker aggregation', blocked.passed, blocked.detail);

  const assessment = assessLaunchCouncil({
    authorityResults: sampleResults,
    generatedAt: 1_700_000_000_000,
  });
  assert('05. readiness blocked', assessment.readinessState === 'BLOCKED', assessment.readinessState);
  assert('06. advisory only', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
  assert('07. cache key stable prefix', assessment.cacheKey.startsWith('launch-council-v1:'), assessment.cacheKey);

  const report = buildLaunchCouncilReport(assessment, 1_700_000_000_000);
  const markdown = buildLaunchCouncilReportMarkdown(assessment, report);
  assert('08. report markdown', markdown.includes('# LAUNCH_COUNCIL_REPORT'), 'markdown');

  resetLaunchCouncilHistoryForTests();
  assessLaunchCouncil({ authorityResults: sampleResults, generatedAt: 1 });
  assessLaunchCouncil({
    authorityResults: sampleResults.map((result) => ({ ...result, score: result.score + 1 })),
    generatedAt: 2,
  });
  assert('09. bounded history', getLaunchCouncilHistorySize() <= 12, String(getLaunchCouncilHistorySize()));

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('10. founder integration wired', reportBuilder.includes('assembleLaunchCouncilFromFounderTestV4') && reportBuilder.includes('buildAdaptiveAutofixIntelligenceArtifacts') && reportBuilder.includes('refreshLaunchCouncilWithAdaptiveAutofix') && reportBuilder.includes('buildClarifyingQuestionIntelligenceArtifacts') && reportBuilder.includes('buildUIReviewerAuthorityArtifacts') && reportBuilder.includes('buildSkepticalFounderSimulatorArtifacts') && reportBuilder.includes('buildPromiseFulfillmentArtifacts') && reportBuilder.includes('buildTrustAuthorityArtifacts') && reportBuilder.includes('buildSelfAwarenessAuthorityArtifacts') && reportBuilder.includes('buildUserSuccessAuthorityArtifacts') && reportBuilder.includes('buildGapDetectionAuthorityArtifacts') && reportBuilder.includes('buildSelfEvolutionAuthorityArtifacts') && reportBuilder.includes('buildUnknownDiscoveryAuthorityArtifacts') && reportBuilder.includes('buildFirstTimeUserRealityAuthorityArtifacts') && reportBuilder.includes('buildCustomerValueAuthorityArtifacts') && reportBuilder.includes('buildCompetitiveRealityAuthorityArtifacts') && reportBuilder.includes('buildRealityProofAuthorityArtifacts') && reportBuilder.includes('buildRealUserRealityAuthorityArtifacts') && reportBuilder.includes('buildAdoptionPredictionAuthorityArtifacts') && reportBuilder.includes('buildLaunchReadinessAuthorityArtifacts'), 'report builder');
  assert('11. founder ui panel', appJs.includes('Launch Council (Advisory)'), 'app.js');
  assert('12. npm script', Boolean(pkg.scripts?.['validate:launch-council']), 'package script');
  assert('13. no nested npm validate', !readFileSync(join(ROOT, 'src/launch-council/launch-council-authority.ts'), 'utf8').includes('npm run validate'), 'no cascade');

  const unknownAuthorityCheck = (() => {
    try {
      assessLaunchCouncil({
        authorityResults: [
          sampleAuthority('unknown-authority', 'Unknown', 'FOUNDER_TESTING', 0, 'FAIL', true),
        ],
      });
      return false;
    } catch {
      return true;
    }
  })();
  assert('14. rejects unknown authority', unknownAuthorityCheck, 'registry validation');

  assert('15. founder mapper export', typeof assembleLaunchCouncilFromFounderTestV4 === 'function', 'mapper');

  checkpoint('complete');

  const failed = results.filter((item) => !item.passed);
  console.log(`Scenarios: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`  ✗ ${item.name}: ${item.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(LAUNCH_COUNCIL_FOUNDATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:launch-council');
}

main();

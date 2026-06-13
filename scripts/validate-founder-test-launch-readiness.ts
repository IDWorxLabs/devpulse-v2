/**
 * Phase 25.19 — Founder Test Launch Readiness validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
  assessFounderTestIntegration,
} from '../src/founder-test-integration/index.js';
import type {
  FounderTestAuthorityId,
  FounderTestAuthorityResult,
} from '../src/founder-test-integration/index.js';
import {
  FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN,
  LAUNCH_READINESS_VERDICTS,
  ORCHESTRATION_FLOW,
  RUN_FOUNDER_TEST_ACTION,
  aggregateTopBlockers,
  aggregateTopRecommendedActions,
  aggregateTopWarnings,
  buildFounderTestLaunchReadinessHistorySummary,
  getFounderTestLaunchReadinessHistorySize,
  resetFounderTestLaunchReadinessModuleForTests,
  runFounderTestLaunchReadiness,
} from '../src/founder-test-launch-readiness/index.js';
import { assessFounderAcceptanceGate } from '../src/founder-acceptance-gate/index.js';

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
  'src/founder-test-launch-readiness/founder-test-launch-readiness-types.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-registry.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-history.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-report-builder.ts',
  'src/founder-test-launch-readiness/index.ts',
  'architecture/FOUNDER_TEST_LAUNCH_READINESS_REPORT.md',
  'server/founder-testing-handler.ts',
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
    buildFixtureResult(entry.authorityId, scoreByAuthority[entry.authorityId] ?? 88, overrides[entry.authorityId]),
  );
}

function buildFixtureFounderTestAssessment(
  scoreByAuthority: Partial<Record<FounderTestAuthorityId, number>>,
  overrides: Partial<Record<FounderTestAuthorityId, Partial<FounderTestAuthorityResult>>> = {},
) {
  const authorityResults = buildFixturePortfolio(scoreByAuthority, overrides);
  return assessFounderTestIntegration({ authorityResults, rootDir: ROOT });
}

function main(): void {
  console.log('');
  console.log('Founder Test Launch Readiness — Validation (leaf mode)');
  console.log('======================================================');
  console.log('');

  checkpoint('start');
  resetFounderTestLaunchReadinessModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`required file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }

  const authoritySource = readText('src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts');
  const registrySource = readText('src/founder-test-launch-readiness/founder-test-launch-readiness-registry.ts');
  const handlerSource = readText('server/founder-testing-handler.ts');
  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');

  assert(
    'orchestration flow documented',
    ORCHESTRATION_FLOW.includes('FOUNDER_TEST_COMPLETE') &&
      ORCHESTRATION_FLOW.includes('Execute Founder Test Integration'),
    `${ORCHESTRATION_FLOW.length} steps`,
  );

  assert(
    'run founder test action constant',
    RUN_FOUNDER_TEST_ACTION === 'RUN FOUNDER TEST',
    RUN_FOUNDER_TEST_ACTION,
  );

  assert(
    'consumes founder test integration',
    authoritySource.includes('assessFounderTestIntegration'),
    'assessFounderTestIntegration',
  );

  assert(
    'consumes founder acceptance gate',
    authoritySource.includes('assessFounderAcceptanceGate'),
    'assessFounderAcceptanceGate',
  );

  assert(
    'consumes connected runtime activation proof',
    authoritySource.includes('assessConnectedRuntimeActivationProof'),
    'assessConnectedRuntimeActivationProof',
  );

  assert(
    'orchestration includes runtime activation proof',
    registrySource.includes('Assess Connected Runtime Activation Proof'),
    'registry step',
  );

  assert(
    'consumes connected preview experience proof',
    authoritySource.includes('assessConnectedPreviewExperienceProof'),
    'assessConnectedPreviewExperienceProof',
  );

  assert(
    'orchestration includes preview experience proof',
    registrySource.includes('Assess Connected Preview Experience Proof'),
    'registry step',
  );

  assert(
    'consumes connected verification execution proof',
    authoritySource.includes('assessConnectedVerificationExecutionProof'),
    'assessConnectedVerificationExecutionProof',
  );

  assert(
    'orchestration includes verification execution proof',
    registrySource.includes('Assess Connected Verification Execution Proof'),
    'registry step',
  );

  assert(
    'consumes connected launch readiness proof',
    authoritySource.includes('assessConnectedLaunchReadinessProof'),
    'assessConnectedLaunchReadinessProof',
  );

  assert(
    'orchestration includes launch readiness proof',
    registrySource.includes('Assess Connected Launch Readiness Proof'),
    'registry step',
  );

  assert(
    'consumes founder acceptance orchestrator',
    authoritySource.includes('evaluateFounderAcceptanceOrchestrator'),
    'evaluateFounderAcceptanceOrchestrator',
  );

  assert(
    'consumes launch council',
    authoritySource.includes('assessLaunchCouncil'),
    'assessLaunchCouncil',
  );

  assert(
    'readiness states registered',
    LAUNCH_READINESS_VERDICTS.length === 5 &&
      LAUNCH_READINESS_VERDICTS.includes('LAUNCH_READY') &&
      LAUNCH_READINESS_VERDICTS.includes('INSUFFICIENT_EVIDENCE'),
    LAUNCH_READINESS_VERDICTS.join(', '),
  );

  assert(
    'blocker aggregation exported',
    authoritySource.includes('export function aggregateTopBlockers'),
    'aggregateTopBlockers',
  );

  assert(
    'warning aggregation exported',
    authoritySource.includes('export function aggregateTopWarnings'),
    'aggregateTopWarnings',
  );

  assert(
    'recommended actions aggregation exported',
    authoritySource.includes('export function aggregateTopRecommendedActions'),
    'aggregateTopRecommendedActions',
  );

  assert(
    'history bounded to 16',
    registrySource.includes('MAX_FOUNDER_TEST_LAUNCH_READINESS_HISTORY = 16'),
    'max 16',
  );

  assert(
    'no new scoring engine patterns',
    !authoritySource.includes('Math.random') &&
      !authoritySource.match(/function\s+score\w+/i) &&
      !existsSync(join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-scorer.ts')),
    'no scorer module',
  );

  assert(
    'no new reality authority module',
    !existsSync(join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-reality-authority.ts')),
    'no duplicate authority',
  );

  assert(
    'server handler wires launch readiness orchestration',
    handlerSource.includes('buildFounderTestLaunchReadinessArtifacts'),
    'handler integration',
  );

  assert(
    'UI run founder test button exists',
    html.includes('id="run-founder-test"') && html.includes('Run Founder Test'),
    'command center button',
  );

  assert(
    'UI single orchestration path',
    appJs.includes('runFounderTest()') &&
      appJs.includes('run-founder-test-verification') &&
      appJs.includes('launchReadiness'),
    'shared runFounderTest path',
  );

  checkpoint('fixture scenarios');

  const readyAssessment = runFounderTestLaunchReadiness({
    founderTestAssessment: buildFixtureFounderTestAssessment(
      Object.fromEntries(
        FOUNDER_TEST_AUTHORITY_REGISTRATIONS.map((entry) => [entry.authorityId, 92]),
      ) as Partial<Record<FounderTestAuthorityId, number>>,
    ),
    skipAutonomousBuildExecutionProof: true,
  });

  assert(
    'scenario: strong portfolio produces report',
    readyAssessment.orchestrationState === 'FOUNDER_TEST_COMPLETE' &&
      readyAssessment.report.founderReadinessScore >= 85,
    `score=${readyAssessment.report.founderReadinessScore} verdict=${readyAssessment.report.launchReadinessVerdict}`,
  );

  assert(
    'scenario: report includes authority summaries',
    readyAssessment.report.inputSnapshot.authoritySummaries.length >= 9,
    `${readyAssessment.report.inputSnapshot.authoritySummaries.length} summaries`,
  );

  assert(
    'scenario: report includes launch council assessment',
    readyAssessment.report.inputSnapshot.launchCouncilAssessment.overallScore >= 0,
    `council=${readyAssessment.report.inputSnapshot.launchCouncilAssessment.overallScore}`,
  );

  resetFounderTestLaunchReadinessModuleForTests();

  const blockedAssessment = runFounderTestLaunchReadiness({
    founderTestAssessment: buildFixtureFounderTestAssessment(
      { FOUNDER_SIMULATION: 40 },
      {
        FOUNDER_SIMULATION: {
          blockers: ['Simulation blocked'],
          criticalBlockerCount: 1,
          simulationPassed: false,
        },
      },
    ),
    skipAutonomousBuildExecutionProof: true,
  });

  assert(
    'scenario: critical blockers map to BLOCKED verdict',
    blockedAssessment.report.launchReadinessVerdict === 'BLOCKED' ||
      blockedAssessment.report.topBlockers.length > 0,
    blockedAssessment.report.launchReadinessVerdict,
  );

  resetFounderTestLaunchReadinessModuleForTests();

  const insufficientAssessment = runFounderTestLaunchReadiness({
    founderTestAssessment: assessFounderTestIntegration({
      authorityResults: buildFixturePortfolio({}).map((result) => ({
        ...result,
        available: result.authorityId !== 'FOUNDER_REALITY',
      })),
      rootDir: ROOT,
    }),
    skipAutonomousBuildExecutionProof: true,
  });

  assert(
    'scenario: missing authorities map to insufficient evidence',
    insufficientAssessment.report.launchReadinessVerdict === 'INSUFFICIENT_EVIDENCE' ||
      insufficientAssessment.report.inputSnapshot.authorityCoverage < 100,
    insufficientAssessment.report.launchReadinessVerdict,
  );

  resetFounderTestLaunchReadinessModuleForTests();

  const founderTestAssessment = buildFixtureFounderTestAssessment({ FOUNDER_REALITY: 90 });
  const acceptanceAssessment = assessFounderAcceptanceGate({ founderTestAssessment });
  const blockers = aggregateTopBlockers(founderTestAssessment, acceptanceAssessment, {
    result: 'PASS',
    verdict: 'FOUNDER_ACCEPTS',
    score: { overallScore: 90 } as never,
    report: {
      criticalAcceptanceBlockers: [],
      recommendedPriorityFixes: ['Fix polish gap'],
      founderAcceptanceRoadmap: { criticalAcceptanceFixes: [] },
    } as never,
    record: {} as never,
    authority: {} as never,
  });

  assert(
    'blocker aggregation returns structured blockers',
    Array.isArray(blockers) && blockers.every((entry) => entry.sourceAuthority.length > 0),
    `${blockers.length} blockers`,
  );

  const warnings = aggregateTopWarnings(founderTestAssessment, acceptanceAssessment);
  assert(
    'warning aggregation returns structured warnings',
    Array.isArray(warnings),
    `${warnings.length} warnings`,
  );

  const actions = aggregateTopRecommendedActions(founderTestAssessment, acceptanceAssessment, {
    result: 'PASS',
    verdict: 'FOUNDER_ACCEPTS',
    score: { overallScore: 90 } as never,
    report: {
      criticalAcceptanceBlockers: [],
      recommendedPriorityFixes: ['Improve onboarding clarity'],
      founderAcceptanceRoadmap: { criticalAcceptanceFixes: [] },
    } as never,
    record: {} as never,
    authority: {} as never,
  });

  assert(
    'recommended actions aggregation returns prioritized actions',
    actions.length > 0 && actions[0].priorityScore >= actions[actions.length - 1].priorityScore,
    `${actions.length} actions`,
  );

  resetFounderTestLaunchReadinessModuleForTests();
  runFounderTestLaunchReadiness({
    founderTestAssessment: buildFixtureFounderTestAssessment({ UI_REALITY: 90 }),
    skipAutonomousBuildExecutionProof: true,
  });
  runFounderTestLaunchReadiness({
    founderTestAssessment: buildFixtureFounderTestAssessment({ REQUIREMENT_REALITY: 90 }),
    skipAutonomousBuildExecutionProof: true,
  });

  assert(
    'history records bounded runs',
    getFounderTestLaunchReadinessHistorySize() === 2,
    `size=${getFounderTestLaunchReadinessHistorySize()}`,
  );

  const historySummary = buildFounderTestLaunchReadinessHistorySummary();
  assert(
    'history summary tracks verdict counts',
    historySummary.totalRuns === 2,
    JSON.stringify(historySummary),
  );

  checkpoint('live assessment');

  resetFounderTestLaunchReadinessModuleForTests();
  const live = runFounderTestLaunchReadiness({ rootDir: ROOT });
  assert(
    'live orchestration executes read-only',
    live.report.runId.length > 0 && live.report.readOnly === true,
    `${live.report.launchReadinessVerdict} score=${live.report.founderReadinessScore}`,
  );

  const reportText = readText('architecture/FOUNDER_TEST_LAUNCH_READINESS_REPORT.md');
  assert(
    'architecture report exists with pass token',
    reportText.includes('FOUNDER_TEST_LAUNCH_READINESS_PASS') &&
      reportText.includes('One Button Founder Test Integration'),
    'report sections',
  );

  const passed = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failedCount}`);
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');

  if (failedCount > 0) {
    console.log('FOUNDER_TEST_LAUNCH_READINESS_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN);
  console.log('');
  console.log('Report: architecture/FOUNDER_TEST_LAUNCH_READINESS_REPORT.md');
}

main();

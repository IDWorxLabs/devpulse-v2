/**
 * Launch Blocker Board V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_LAUNCH_BLOCKER_IDS,
  LAUNCH_BLOCKER_BOARD_PASS,
  LAUNCH_BLOCKER_BUCKETS,
  STRATEGY_RESET_RULE,
  buildLaunchBlockerBoardArtifacts,
  buildLaunchBlockerBoardValidationMarkdown,
  classifyLaunchBlockerBucket,
  resetLaunchBlockerBoardModuleForTests,
} from '../src/launch-blocker-board/index.js';
import type { FounderTestLaunchReadinessReport } from '../src/founder-test-launch-readiness/founder-test-launch-readiness-types.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-launch-blocker-board';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/launch-blocker-board/launch-blocker-board-types.ts',
  'src/launch-blocker-board/launch-blocker-board-registry.ts',
  'src/launch-blocker-board/launch-blocker-board-classifier.ts',
  'src/launch-blocker-board/launch-blocker-board-collector.ts',
  'src/launch-blocker-board/launch-blocker-board-authority.ts',
  'src/launch-blocker-board/launch-blocker-board-report-builder.ts',
  'src/launch-blocker-board/launch-blocker-board-history.ts',
  'src/launch-blocker-board/index.ts',
  'architecture/LAUNCH_BLOCKER_BOARD_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/launch-blocker-board/launch-blocker-board-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('read-only advisory board', authoritySource.includes('advisoryOnly: true'), 'missing');
assert('handler wired to launch blocker board', handlerSource.includes('buildLaunchBlockerBoardArtifacts'), 'missing');
assert(
  'board prepended before launch readiness markdown',
  handlerSource.includes('launchBlockerBoardArtifacts.launchBlockerBoardReportMarkdown'),
  'missing prepend',
);
assert(
  'package script registered',
  packageJson.includes(`validate:launch-blocker-board": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);
assert(
  'four buckets defined',
  LAUNCH_BLOCKER_BUCKETS.length === 4 &&
    LAUNCH_BLOCKER_BUCKETS.includes('REAL_PRODUCT_GAP') &&
    LAUNCH_BLOCKER_BUCKETS.includes('FOUNDER_TEST_NOISE'),
  LAUNCH_BLOCKER_BUCKETS.join(', '),
);

assert(
  'classifier routes testing noise',
  classifyLaunchBlockerBucket({
    text: 'simulation budget exceeded payload guard degraded',
    sourceAuthority: 'FOUNDER_SIMULATION',
  }) === 'FOUNDER_TEST_NOISE',
  'noise',
);

function buildMockLaunchReadiness(): FounderTestLaunchReadinessReport {
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Would a reasonable founder launch DevPulse today?',
    runId: 'board-fixture-run',
    generatedAt: new Date().toISOString(),
    panelState: 'COMPLETE',
    founderReadinessScore: 58,
    founderAcceptanceState: 'NOT_ACCEPTED' as FounderTestLaunchReadinessReport['founderAcceptanceState'],
    launchReadinessVerdict: 'NOT_LAUNCH_READY',
    confidenceLevel: 'MEDIUM',
    executionProofSummary: 'Execution proof incomplete.',
    founderExecutionProofSummary: 'Founder execution proof not proven.',
    runtimeProofHydrationSummary: 'Hydrated: no',
    runtimeProofHydration: {
      readOnly: true,
      hydrated: false,
      source: 'insufficient-evidence',
      missing: ['runtime-artifact'],
      warnings: [],
      executionConnectedSource: 'not-proven',
      stageProven: {
        workspace: false,
        build: false,
        runtime: false,
        preview: false,
        verification: false,
      },
    },
    founderSimulationSummary: 'Founder Simulation completed with warnings.',
    requirementRealitySummary: 'Requirement Reality score 55/100.',
    verificationRealitySummary: 'Verification Reality score 60/100.',
    livePreviewSummary: 'Live Preview Reality score 45/100. Blockers: preview not proven.',
    mobileRuntimeSummary: 'Mobile Runtime Reality score 40/100. Blockers: mobile runtime not proven.',
    launchCouncilSummary: 'Launch Council score 50/100 — readiness NOT_READY, 3 launch blocker(s).',
    orchestratorVerdict: 'NOT_READY',
    orchestratorScore: 58,
    topBlockers: [],
    launchBlockersProduct: [
      {
        readOnly: true,
        sourceAuthority: 'CONNECTED_LAUNCH_READINESS_PROOF',
        severity: 'CRITICAL',
        explanation: 'Connected execution chain not fully proven.',
        recommendedAction: 'Prove build → runtime → preview → verification chain.',
      },
    ],
    launchBlockersTesting: [
      {
        readOnly: true,
        sourceAuthority: 'FOUNDER_REALITY_UI',
        severity: 'MEDIUM',
        explanation: 'Copy Report button may fail clipboard handoff.',
        recommendedAction: 'Fix Copy Report UI in Founder Reality.',
      },
    ],
    launchBlockersAuthorityDisagreement: [
      {
        readOnly: true,
        sourceAuthority: 'FOUNDER_TRUTH_MATRIX',
        severity: 'HIGH',
        explanation: 'Product claim says ready but execution proof says NOT_PROVEN.',
        recommendedAction: 'Align promise wording with connected execution proof.',
      },
    ],
    topWarnings: [],
    topRecommendedActions: [],
    topMissingCapabilities: [],
    chatStressSimulation: null,
    chatStressSummary: null,
    chatBlocksLaunchReadiness: false,
    productReadinessSimulation: null,
    productReadinessSummary: null,
    productReadinessScore: null,
    autonomousBuildExecutionProof: null,
    autonomousBuildExecutionProofSummary: null,
    executionChainConnected: false,
    executionChainBlocksLaunch: true,
    firstBrokenExecutionStage: 'RUNTIME',
    connectedBuildExecution: null,
    connectedBuildExecutionSummary: 'Build execution not fully connected.',
    connectedRuntimeActivationProof: null,
    connectedRuntimeActivationProofSummary: 'Runtime activation proof missing.',
    connectedPreviewExperienceProof: null,
    connectedPreviewExperienceProofSummary: 'Preview experience proof missing.',
    connectedVerificationExecutionProof: null,
    connectedVerificationExecutionProofSummary: null,
    connectedLaunchReadinessProof: null,
    connectedLaunchReadinessProofSummary: 'Launch readiness proof chain incomplete.',
    preReconciliationVerdict: 'NOT_LAUNCH_READY',
    truthMatrixReconciliation: {
      readOnly: true,
      reconciliationId: 'fixture',
      generatedAt: new Date().toISOString(),
      operationId: 'FOUNDER_TRUTH_MATRIX_RECONCILIATION',
      claims: [],
      scoringDefectCount: 0,
      authorityDisagreementCount: 1,
      propagationFailureCount: 0,
      realProductGapCount: 2,
      testingSystemDefectCount: 1,
      trustScoreBlocked: true,
      productLaunchBlocked: true,
      preReconciliationVerdict: 'NOT_LAUNCH_READY',
      postReconciliationVerdict: 'NOT_LAUNCH_READY',
      verdictOverrideApplied: false,
      overrideReason: null,
    },
    founderTruthSummary: {
      readOnly: true,
      sectionId: 'FOUNDER_TRUTH_SUMMARY',
      whatIsActuallyTrue: [],
      whatIsActuallyBroken: ['Connected execution proof missing'],
      productGaps: ['Live preview not proven'],
      testingSystemGaps: ['Degraded simulation runtime'],
      authorityDisagreements: ['Claim says launch-ready; execution proof disagrees'],
      launchBlockingProductGaps: ['Connected execution proof'],
      nonBlockingTestingDefects: ['Simulation budget exceeded'],
      launchBlockedByProduct: true,
      launchBlockedByTestingInfrastructure: false,
      founderQuestions: [],
    },
    inputSnapshot: {
      readOnly: true,
      founderTestAssessment: {} as never,
      founderAcceptanceAssessment: {} as never,
      founderAcceptanceOrchestrator: {} as never,
      launchCouncilAssessment: {} as never,
      authoritySummaries: [
        {
          readOnly: true,
          authorityId: 'LIVE_PREVIEW_REALITY',
          displayName: 'Live Preview Reality',
          score: 45,
          available: true,
          blockers: ['Preview not proven'],
          warnings: [],
          recommendations: [],
        },
        {
          readOnly: true,
          authorityId: 'MOBILE_RUNTIME_REALITY',
          displayName: 'Mobile Runtime Reality',
          score: 40,
          available: true,
          blockers: ['Mobile runtime not proven'],
          warnings: [],
          recommendations: [],
        },
      ],
      authorityCoverage: 80,
      participatingAuthorityCount: 10,
      availableAuthorityCount: 8,
    },
    cacheKey: 'fixture',
  };
}

resetLaunchBlockerBoardModuleForTests();

const boardArtifacts = buildLaunchBlockerBoardArtifacts({
  launchReadiness: buildMockLaunchReadiness(),
  runId: 'board-fixture-run',
  simulationElapsedMs: 252460,
  simulationDegraded: true,
  simulationDiagnosticMarkdown: [
    '# Founder Simulation Guarded Diagnostic Report',
    'Degraded: yes',
    'Missing fields repaired: 0',
    'Patch applied: no',
  ].join('\n'),
  skipHistoryRecording: true,
});

const report = boardArtifacts.launchBlockerBoardAssessment.report;
const markdown = boardArtifacts.launchBlockerBoardReportMarkdown;

assert('pass token issued', report.passToken === LAUNCH_BLOCKER_BOARD_PASS, report.passToken ?? 'null');
assert('strategy reset rule present', markdown.includes(STRATEGY_RESET_RULE.slice(0, 40)), 'missing rule');
assert('top launch blockers section', markdown.includes('## Top Launch Blockers'), 'missing section');

const topNames = report.topLaunchBlockers.map((entry) => entry.blockerName);
assert(
  '1. connected execution proof on board',
  topNames.some((name) => /connected execution proof/i.test(name)),
  topNames.join(', '),
);
assert(
  '2. live preview proof on board',
  topNames.some((name) => /live preview proof/i.test(name)),
  topNames.join(', '),
);
assert(
  '3. mobile runtime proof on board',
  topNames.some((name) => /mobile runtime proof/i.test(name)),
  topNames.join(', '),
);
assert(
  '4. promise/claim mismatch on board',
  topNames.some((name) => /promise\/claim mismatch/i.test(name)),
  topNames.join(', '),
);
assert(
  '5. copy report ui on board',
  topNames.some((name) => /copy report ui/i.test(name)),
  topNames.join(', '),
);

assert(
  'each blocker shows required fields',
  report.topLaunchBlockers.every(
    (entry) =>
      entry.blockerName &&
      entry.bucket &&
      entry.severity &&
      entry.userImpact &&
      entry.fixRequired &&
      entry.launchImpact &&
      entry.disposition,
  ),
  String(report.topLaunchBlockers.length),
);

assert(
  'degraded runtime classified as founder test noise',
  report.allBlockers.some(
    (entry) =>
      entry.bucket === 'FOUNDER_TEST_NOISE' &&
      /runtime duration|simulation/i.test(entry.blockerName),
  ),
  report.allBlockers.map((entry) => `${entry.blockerName}:${entry.bucket}`).join(', '),
);

assert(
  'testing noise uses Ignore disposition',
  report.allBlockers
    .filter((entry) => entry.bucket === 'FOUNDER_TEST_NOISE')
    .every((entry) => entry.disposition === 'IGNORE'),
  'disposition',
);

assert(
  'canonical blocker ids covered',
  CANONICAL_LAUNCH_BLOCKER_IDS.every((id) => report.allBlockers.some((entry) => entry.blockerId === id)),
  report.allBlockers.map((entry) => entry.blockerId).join(', '),
);

assert(
  'no repair authority spawned',
  !authoritySource.includes('repairPlan') && !authoritySource.includes('runFounderTest'),
  'repair leak',
);

const failed = results.filter((entry) => !entry.passed);
const passToken = failed.length === 0 ? LAUNCH_BLOCKER_BOARD_PASS : null;

writeFileSync(
  join(ROOT, 'architecture/LAUNCH_BLOCKER_BOARD_VALIDATION.md'),
  buildLaunchBlockerBoardValidationMarkdown(results, passToken),
);

if (failed.length > 0) {
  console.error('Launch Blocker Board validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(LAUNCH_BLOCKER_BOARD_PASS);

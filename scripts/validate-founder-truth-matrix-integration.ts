/**
 * Phase 26.71 — Founder Truth Matrix Integration validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeAllConsistencyClaims } from '../src/founder-test-consistency-audit/index.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import {
  FOUNDER_TRUTH_MATRIX_INTEGRATION_PASS,
  FOUNDER_TRUTH_MATRIX_RECONCILIATION_OPERATION,
  FOUNDER_TRUTH_QUESTIONS,
  applyTruthMatrixLaunchReconciliationSync,
  buildFounderTruthMatrixIntegrationReportMarkdown,
  buildFounderTruthMatrixLaunchReconciliationReportMarkdown,
  buildConsistencyEvidenceFromLaunchContext,
  getFounderTruthMatrixIntegrationHistorySize,
  reconcileLaunchVerdictWithTruthMatrix,
  reconcileTruthClaims,
  resetFounderTruthMatrixIntegrationModuleForTests,
} from '../src/founder-truth-matrix-integration/index.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';

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
  'src/founder-truth-matrix-integration/founder-truth-matrix-integration-types.ts',
  'src/founder-truth-matrix-integration/founder-truth-matrix-integration-registry.ts',
  'src/founder-truth-matrix-integration/truth-reconciler.ts',
  'src/founder-truth-matrix-integration/launch-verdict-reconciler.ts',
  'src/founder-truth-matrix-integration/founder-truth-summary-builder.ts',
  'src/founder-truth-matrix-integration/founder-truth-matrix-integration-report-builder.ts',
  'src/founder-truth-matrix-integration/founder-truth-matrix-integration-history.ts',
  'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts',
  'src/founder-truth-matrix-integration/launch-readiness-truth-bridge.ts',
  'src/founder-truth-matrix-integration/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const reconcilerSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/launch-verdict-reconciler.ts'),
  'utf8',
);
const launchAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);

assert('FOUNDER_TRUTH_MATRIX_RECONCILIATION operation', reconcilerSource.includes('FOUNDER_TRUTH_MATRIX'), 'missing');
assert('Rule 1 SCORING_DEFECT', reconcilerSource.includes('SCORING_DEFECT'), 'missing');
assert('Rule 2 AUTHORITY_DISAGREEMENT', reconcilerSource.includes('AUTHORITY_DISAGREEMENT'), 'missing');
assert('Rule 3 EVIDENCE_PROPAGATION_FAILURE', reconcilerSource.includes('EVIDENCE_PROPAGATION_FAILURE'), 'missing');
assert('Rule 4 REAL_PRODUCT_GAP', reconcilerSource.includes('REAL_PRODUCT_GAP'), 'missing');
assert('TESTING_SYSTEM_DEFECT label', reconcilerSource.includes('TESTING_SYSTEM_DEFECT'), 'missing');
assert('TRUTH_MATRIX_VERDICT label', reconcilerSource.includes('TRUTH_MATRIX_VERDICT'), 'missing');
assert('launch readiness wired before report', launchAuthoritySource.includes('applyTruthMatrixLaunchReconciliationSync'), 'missing');
assert('founder questions registered', FOUNDER_TRUTH_QUESTIONS.length === 7, String(FOUNDER_TRUTH_QUESTIONS.length));

const founderTestAssessment = assessFounderTestIntegration({ rootDir: ROOT });

const mockChatStress = {
  readOnly: true as const,
  advisoryOnly: true as const,
  runId: 'mock',
  generatedAt: new Date().toISOString(),
  totalScenarios: 12,
  scenariosRequested: 12,
  scenariosExecuted: 12,
  scenariosSkipped: 0,
  scenariosTimedOut: 0,
  passedCount: 12,
  failedCount: 0,
  weakCount: 0,
  overallScore: 85,
  chatBlocksLaunchReadiness: false,
  selfEvolutionRequired: false,
  runtimeHealth: 'HEALTHY' as const,
  budgetElapsedMs: 1000,
  degradedPartialResult: false,
  budgetNotes: [],
  strongestAnswers: [],
  worstAnswers: [],
  weakAnswers: [],
  failedAnswers: [],
  repeatedFailurePatterns: [],
  missingCapabilities: [],
  recommendedNextChatImprovements: [],
  categoryScores: {} as never,
  evaluations: [],
  scenarioRuns: [],
  settlementSummary: {} as never,
};

const evidence = buildConsistencyEvidenceFromLaunchContext({
  rootDir: ROOT,
  founderTestAssessment,
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  founderReadinessScore: founderTestAssessment.score.overall,
  topBlockers: [
    {
      readOnly: true,
      sourceAuthority: 'Chat Intelligence Reality',
      severity: 'CRITICAL',
      explanation: 'Chat score 0/100 blocks launch despite all scenarios passed.',
      recommendedAction: 'Fix scoring defect.',
    },
  ],
  chatStressSimulation: mockChatStress,
  productReadinessSimulation: null,
  autonomousBuildExecutionProof: null,
  runId: founderTestAssessment.run.runId,
  chatIntelligenceReality: {
    readOnly: true,
    chatIntelligenceScore: 0,
    chatLaunchVerdict: 'LAUNCH_BLOCKED',
    blocksLaunchReadiness: true,
    scenariosRun: 12,
    scenariosPassed: 12,
    failedScenarios: [],
    scenarioResults: [],
    requiredFixesBeforeLaunch: [],
    founderProofNotes: [],
    selfEvolution: {
      triggered: false,
      repeatedCategory: null,
      failureCountInCategory: 0,
      stopRepeatingFixPath: false,
      missingCapabilities: [],
      improvementPlan: [],
      launchBlocked: true,
      advisoryOnly: true,
    },
    operationalSelfAwarenessStandard: 'validator-mock',
    operationalEvidenceSnapshot: {} as never,
    cognitiveArchitecture: {} as never,
    cacheKey: 'mock',
  },
});

const claimAudits = analyzeAllConsistencyClaims(evidence);
const reconciledClaims = reconcileTruthClaims(claimAudits);
const chatClaim = reconciledClaims.find((c) => c.claimId === 'CHAT_INTELLIGENCE_READINESS');

assert(
  'scoring defect does not masquerade as product failure',
  chatClaim?.rootCause === 'SCORING_DEFECT',
  chatClaim?.rootCause ?? 'missing',
);

const scoringReconcile = reconcileLaunchVerdictWithTruthMatrix({
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  topBlockers: evidence.input.launchReadiness.report.topBlockers,
  reconciledClaims,
});

assert(
  'scoring defect does not block launch readiness',
  scoringReconcile.postReconciliationVerdict !== 'NOT_LAUNCH_READY' ||
    scoringReconcile.categorizedBlockers.launchBlockersTesting.length > 0,
  scoringReconcile.postReconciliationVerdict,
);

assert(
  'testing blockers categorized separately',
  scoringReconcile.categorizedBlockers.launchBlockersTesting.some((b) =>
    b.sourceAuthority.includes('TESTING_SYSTEM_DEFECT'),
  ),
  String(scoringReconcile.categorizedBlockers.launchBlockersTesting.length),
);

resetFounderTruthMatrixIntegrationModuleForTests();
const syncResult = applyTruthMatrixLaunchReconciliationSync({
  rootDir: ROOT,
  founderTestAssessment,
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  founderReadinessScore: founderTestAssessment.score.overall,
  topBlockers: evidence.input.launchReadiness.report.topBlockers,
  chatStressSimulation: mockChatStress,
  productReadinessSimulation: null,
  autonomousBuildExecutionProof: null,
  runId: founderTestAssessment.run.runId,
  chatIntelligenceReality: evidence.input.chatIntelligenceReality,
});

assert(
  'truth matrix consulted before launch verdict',
  syncResult.integration.report.reconciliation.operationId === FOUNDER_TRUTH_MATRIX_RECONCILIATION_OPERATION,
  syncResult.integration.report.reconciliation.operationId,
);
assert(
  'founder report contains truth summary',
  syncResult.integration.report.founderTruthSummary.sectionId === 'FOUNDER_TRUTH_SUMMARY',
  syncResult.integration.report.founderTruthSummary.sectionId,
);
assert(
  'founder questions use TRUTH_MATRIX_FINAL_ANSWER',
  syncResult.integration.report.founderTruthSummary.founderQuestions.every(
    (q) => q.answerToken === 'TRUTH_MATRIX_FINAL_ANSWER',
  ),
  String(syncResult.integration.report.founderTruthSummary.founderQuestions.length),
);
assert('integration history recorded', getFounderTruthMatrixIntegrationHistorySize() === 1, String(getFounderTruthMatrixIntegrationHistorySize()));

const launch = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  founderTestAssessment,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  skipAutonomousBuildExecutionProof: true,
  skipConnectedBuildExecution: true,
  skipConnectedRuntimeActivationProof: true,
  skipConnectedPreviewExperienceProof: true,
  skipConnectedVerificationExecutionProof: true,
  skipConnectedLaunchReadinessProof: true,
  skipHistoryRecording: true,
});

assert(
  'launch readiness has truth matrix reconciliation',
  launch.report.truthMatrixReconciliation !== null,
  launch.report.truthMatrixReconciliation?.operationId ?? 'missing',
);
assert(
  'launch readiness has founder truth summary',
  launch.report.founderTruthSummary !== null,
  launch.report.founderTruthSummary?.sectionId ?? 'missing',
);
assert(
  'launch blockers categorized on live run',
  Array.isArray(launch.report.launchBlockersProduct) &&
    Array.isArray(launch.report.launchBlockersTesting) &&
    Array.isArray(launch.report.launchBlockersAuthorityDisagreement),
  'missing arrays',
);
assert('pre-reconciliation verdict recorded', Boolean(launch.report.preReconciliationVerdict), launch.report.preReconciliationVerdict);

const integrationMarkdown = buildFounderTruthMatrixIntegrationReportMarkdown(syncResult.integration.report);
const reconciliationMarkdown = buildFounderTruthMatrixLaunchReconciliationReportMarkdown(syncResult.integration.report);

assert('integration report markdown', integrationMarkdown.includes('## FOUNDER_TRUTH_SUMMARY'), 'missing');
assert('reconciliation report markdown', reconciliationMarkdown.includes('## launchBlockersProduct'), 'missing');
assert('TRUTH_MATRIX_FINAL_ANSWER in report', integrationMarkdown.includes('TRUTH_MATRIX_FINAL_ANSWER'), 'missing');

writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TRUTH_MATRIX_INTEGRATION_REPORT.md'),
  integrationMarkdown,
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION_REPORT.md'),
  reconciliationMarkdown,
  'utf8',
);

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Founder Truth Matrix Integration Validation',
  '',
  `Result: ${failed.length === 0 ? FOUNDER_TRUTH_MATRIX_INTEGRATION_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Sample Reconciliation',
  '',
  `- Pre: ${syncResult.integration.report.reconciliation.preReconciliationVerdict}`,
  `- Post: ${syncResult.integration.report.reconciliation.postReconciliationVerdict}`,
  `- Override: ${syncResult.integration.report.reconciliation.verdictOverrideApplied}`,
  `- Testing defects: ${syncResult.integration.report.reconciliation.testingSystemDefectCount}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'FOUNDER_TRUTH_MATRIX_INTEGRATION_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(FOUNDER_TRUTH_MATRIX_INTEGRATION_PASS);
console.log(validationSummary);

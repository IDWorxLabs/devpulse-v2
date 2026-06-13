/**
 * Phase 26.15 — Post-Launch Reality Authority validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  resetConnectedBuildExecutionModuleForTests,
} from '../src/connected-build-execution/index.js';
import { resetConnectedPreviewExperienceProofModuleForTests } from '../src/connected-preview-experience-proof/index.js';
import { resetConnectedRuntimeActivationProofModuleForTests } from '../src/connected-runtime-activation-proof/index.js';
import type { RuntimeSessionEvidence } from '../src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import { resetConnectedVerificationExecutionProofModuleForTests } from '../src/connected-verification-execution-proof/index.js';
import type { VerificationEvidenceFixture } from '../src/connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import { resetConnectedLaunchReadinessProofModuleForTests } from '../src/connected-launch-readiness-proof/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import {
  resetFounderLaunchDecisionAuthorityModuleForTests,
  resetFounderLaunchDecisionHistoryForTests,
} from '../src/founder-launch-decision-authority/index.js';
import { resetLiveIdeaToLaunchExecutionRunnerModuleForTests } from '../src/live-idea-to-launch-execution-runner/index.js';
import {
  POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeEngagementEvidence,
  analyzeTrafficEvidence,
  assessPostLaunchReality,
  buildPostLaunchRealityHistorySummary,
  buildPostLaunchRealityReportMarkdown,
  computePostLaunchVerdict,
  getPostLaunchRealityHistorySize,
  resetPostLaunchRealityAuthorityModuleForTests,
  resetPostLaunchRealityHistoryForTests,
} from '../src/post-launch-reality-authority/index.js';
import { MAX_POST_LAUNCH_REALITY_HISTORY } from '../src/post-launch-reality-authority/post-launch-reality-registry.js';

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
  'src/post-launch-reality-authority/post-launch-reality-types.ts',
  'src/post-launch-reality-authority/post-launch-reality-registry.ts',
  'src/post-launch-reality-authority/traffic-evidence-analyzer.ts',
  'src/post-launch-reality-authority/engagement-evidence-analyzer.ts',
  'src/post-launch-reality-authority/retention-evidence-analyzer.ts',
  'src/post-launch-reality-authority/error-reality-analyzer.ts',
  'src/post-launch-reality-authority/business-outcome-analyzer.ts',
  'src/post-launch-reality-authority/post-launch-verdict-engine.ts',
  'src/post-launch-reality-authority/post-launch-reality-authority.ts',
  'src/post-launch-reality-authority/post-launch-reality-history.ts',
  'src/post-launch-reality-authority/post-launch-reality-report-builder.ts',
  'src/post-launch-reality-authority/index.ts',
  'architecture/POST_LAUNCH_REALITY_AUTHORITY_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getObservedPostLaunchFixture() {
  const now = new Date().toISOString();
  return {
    traffic: {
      readOnly: true as const,
      evidenceSource: 'analytics-reports',
      evidencePaths: ['.post-launch-evidence/analytics-sessions.json', '.post-launch-evidence/traffic-summary.json'],
      observedAt: now,
      trafficObserved: true,
      sessionsObserved: 142,
      usersObserved: 38,
      trend: 'UP' as const,
    },
    engagement: {
      readOnly: true as const,
      evidenceSource: 'usage-reports',
      evidencePaths: ['.post-launch-evidence/feature-usage.json'],
      observedAt: now,
      activeUsageObserved: true,
      featureUsageObserved: true,
      sessionQualityScore: 78,
      userReturnSignalsObserved: true,
    },
    retention: {
      readOnly: true as const,
      evidenceSource: 'retention-reports',
      evidencePaths: ['.post-launch-evidence/retention-cohort.json'],
      observedAt: now,
      repeatUsersObserved: true,
      repeatUserCount: 12,
      retentionSignalsObserved: true,
      userReturnEvidenceObserved: true,
    },
    errors: {
      readOnly: true as const,
      evidenceSource: 'uptime-reports',
      evidencePaths: ['.post-launch-evidence/uptime.json'],
      observedAt: now,
      runtimeErrorsObserved: false,
      crashEvidenceObserved: false,
      supportTicketsObserved: false,
      uptimePercent: 99.6,
      operationalStabilityObserved: true,
    },
    business: {
      readOnly: true as const,
      evidenceSource: 'product-metrics',
      evidencePaths: ['.post-launch-evidence/customer-value.json'],
      observedAt: now,
      customerValueEvidenceObserved: true,
      founderGoalProgressObserved: true,
      monetizationEvidenceObserved: false,
      productImpactEvidenceObserved: true,
      businessOutcomeSignals: ['Deals created in CRM', 'Contacts imported by sales team'],
    },
  };
}

resetPostLaunchRealityAuthorityModuleForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionAuthorityModuleForTests();
resetFounderLaunchDecisionHistoryForTests();
resetLiveIdeaToLaunchExecutionRunnerModuleForTests();

const empty = assessPostLaunchReality({
  rootDir: ROOT,
  founderLaunchDecision: null,
  liveExecutionRunner: null,
  runtimeActivationProof: null,
  launchReadinessProof: null,
  postLaunchEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'POST_LAUNCH_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state NOT_LAUNCHED', empty.report.postLaunchRealityState === 'NOT_LAUNCHED', empty.report.postLaunchRealityState);
assert('A empty no activity', !empty.report.activityObserved, String(empty.report.activityObserved));
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const trafficUnit = analyzeTrafficEvidence({
  evidence: null,
  launchObserved: false,
});
const engagementUnit = analyzeEngagementEvidence({
  evidence: null,
  trafficObserved: false,
});
const verdictUnit = computePostLaunchVerdict({
  launchObserved: false,
  traffic: trafficUnit,
  engagement: engagementUnit,
  retention: {
    readOnly: true,
    repeatUsers: false,
    repeatUserCount: null,
    retentionSignals: false,
    userReturnEvidence: false,
    retentionConfidence: 'UNKNOWN',
    retentionScore: 0,
    missingEvidence: ['No retention report'],
    riskSignals: [],
  },
  reliability: {
    readOnly: true,
    runtimeErrors: false,
    crashEvidence: false,
    supportEvidence: false,
    operationalStability: false,
    uptimePercent: null,
    reliabilityScore: 0,
    missingEvidence: [],
    riskSignals: [],
  },
  businessOutcome: {
    readOnly: true,
    customerValueEvidence: false,
    founderGoalProgress: false,
    monetizationEvidence: false,
    productImpactEvidence: false,
    businessOutcomeSignals: [],
    businessOutcomeScore: 0,
    missingEvidence: [],
    riskSignals: [],
  },
  overallPostLaunchScore: 0,
});
assert('B verdict engine executes', verdictUnit.postLaunchRealityState === 'NOT_LAUNCHED', verdictUnit.postLaunchRealityState);

const scores = [
  empty.report.overallPostLaunchScore,
  empty.report.trafficScore,
  empty.report.engagementScore,
  empty.report.retentionScore,
  empty.report.reliabilityScore,
  empty.report.businessOutcomeScore,
  empty.report.confidence,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildPostLaunchRealityReportMarkdown(empty.report).includes('POST_LAUNCH_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_POST_LAUNCH_REALITY_HISTORY + 2; i += 1) {
  assessPostLaunchReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getPostLaunchRealityHistorySize() <= MAX_POST_LAUNCH_REALITY_HISTORY,
  `${getPostLaunchRealityHistorySize()}/${MAX_POST_LAUNCH_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildPostLaunchRealityHistorySummary().totalAssessments <= MAX_POST_LAUNCH_REALITY_HISTORY,
  String(buildPostLaunchRealityHistorySummary().totalAssessments),
);

const launchReadinessOnly = assessPostLaunchReality({
  rootDir: ROOT,
  launchReadinessOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'F launch readiness alone cannot create activity',
  !launchReadinessOnly.report.activityObserved &&
    launchReadinessOnly.report.postLaunchRealityState !== 'ACTIVE_USAGE' &&
    launchReadinessOnly.report.postLaunchRealityState !== 'GROWING_PRODUCT',
  `${launchReadinessOnly.report.postLaunchRealityState}/${launchReadinessOnly.report.activityObserved}`,
);

const runtimeProofOnly = assessPostLaunchReality({
  rootDir: ROOT,
  runtimeProofOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'G runtime proof alone cannot create users',
  runtimeProofOnly.report.traffic.usersObserved === null && !runtimeProofOnly.report.activityObserved,
  String(runtimeProofOnly.report.traffic.usersObserved),
);

const fabricated = assessPostLaunchReality({
  rootDir: ROOT,
  fabricatedMetricsFixture: true,
  postLaunchEvidenceFixture: {
    traffic: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      trafficObserved: true,
      sessionsObserved: 9999,
      usersObserved: 5000,
      trend: 'UP',
    },
  },
  founderLaunchDecision: {
    readOnly: true,
    advisoryOnly: true,
    decisionId: 'fixture-launch',
    generatedAt: new Date().toISOString(),
    founderLaunchDecision: 'LAUNCH',
    decisionConfidence: 90,
    founderDecisionConfidence: 90,
    canLaunchNow: true,
    reason: 'fixture',
    blockingIssues: [],
    recommendedNextActions: [],
    proofChainScore: 90,
    launchReadinessScore: 90,
    runtimeConfidenceScore: 90,
    riskScore: 10,
    proofSignals: {
      readOnly: true,
      signals: [],
      proofChainScore: 90,
      executionState: 'LAUNCH_READY',
      executionVerdict: 'PROVEN',
      runtimeProven: true,
      previewProven: true,
      launchReadinessProven: true,
      buildMaterializationProven: true,
      validationProven: true,
      criticalBlockerCount: 0,
      missingEvidence: [],
    },
    riskSignals: {
      readOnly: true,
      riskScore: 10,
      riskLevel: 'LOW',
      riskSignals: [],
      runtimeConfidenceScore: 90,
      launchReadinessScore: 90,
    },
    blockers: { readOnly: true, blockers: [], criticalCount: 0, highCount: 0, actionableBlockers: [] },
    verdict: {
      readOnly: true,
      founderLaunchDecision: 'LAUNCH',
      decisionConfidence: 90,
      canLaunchNow: true,
      reason: 'fixture',
      blockingIssues: [],
      recommendedNextActions: [],
      decisionSummary: 'fixture',
    },
    missingEvidence: [],
    decisionSummary: 'fixture',
    inputSnapshot: {
      readOnly: true,
      liveExecutionRunner: null,
      launchReadinessProof: null,
      runtimeActivationProof: null,
      previewExperienceProof: null,
      buildMaterialization: null,
      verificationExecutionProof: null,
      founderTestLaunchReadiness: null,
      founderTestRealitySweep: null,
      launchCouncil: null,
      requirementsToPlanContract: null,
      autonomousBuildExecutionProof: null,
      founderTestAssessment: null,
      projectVaultProjectCount: 0,
    },
    cacheKey: 'fixture',
  },
  skipHistoryRecording: true,
});
assert(
  'H fabricated metrics rejected',
  !fabricated.report.activityObserved && fabricated.report.traffic.trafficScore === 0,
  `${fabricated.report.activityObserved}/${fabricated.report.traffic.trafficScore}`,
);
assert(
  'H evidence-only verdict enforced',
  fabricated.report.riskSignals.some((r) => r.includes('Fabricated') || r.includes('rejected')),
  fabricated.report.riskSignals.join('; '),
);

function getLaunchFixtureContext() {
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetConnectedRuntimeActivationProofModuleForTests();
  resetConnectedPreviewExperienceProofModuleForTests();
  resetConnectedVerificationExecutionProofModuleForTests();
  resetConnectedLaunchReadinessProofModuleForTests();
  resetAutonomousBuildExecutionProofModuleForTests();
  resetFounderLaunchDecisionAuthorityModuleForTests();
  resetLiveIdeaToLaunchExecutionRunnerModuleForTests();

  const crmAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: crmPrompt });
  const contract = crmAssessment.report.buildReadyContract!;
  const materialization = materializeBuildContractExpectations(contract);
  const buildReport = assessConnectedBuildExecution({
    rootDir: ROOT,
    buildReadyContract: contract,
    observedEvidence: { paths: materialization.expectedFiles, directories: materialization.workspaceTargets },
  }).report;

  const workspacePath = (
    buildReport.workspaceMaterialization.workspacePath ??
    buildReport.buildMaterialization.workspaceTargets[0] ??
    `.generated-builder-workspaces/${buildReport.buildMaterialization.contractId}`
  ).replace(/\\/g, '/');

  const runtimeSession: RuntimeSessionEvidence = {
    runtimeSessionId: 'runtime-session-post-launch',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '6262',
    processState: 'STARTED',
    port: 5173,
    host: 'localhost',
    url: 'http://localhost:5173',
    reachable: true,
    protocol: 'http',
    healthStatusCode: 200,
    healthResponseType: 'html',
  };

  const now = new Date().toISOString();
  const verificationFixture: VerificationEvidenceFixture = {
    previewSessionId: 'preview-post-launch',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-post-launch',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'post-launch-fixture',
    command: 'npm run validate:post-launch-reality-authority',
    scope: 'preview-e2e',
    passCount: 12,
    failCount: 0,
    warningCount: 0,
    skippedCount: 0,
    resultStatus: 'PASS',
    score: 100,
    summary: 'All verification checks passed',
    evidencePaths: ['.verification-evidence/run-report.json'],
    evidenceTypes: ['assertion_results'],
    testLogs: ['[verify] passed'],
  };

  return { crmAssessment, materialization, runtimeSession, verificationFixture };
}

resetPostLaunchRealityAuthorityModuleForTests();
const launchCtx = getLaunchFixtureContext();
const observedFixture = getObservedPostLaunchFixture();
const full = assessPostLaunchReality({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
  requirementsToPlanContract: launchCtx.crmAssessment.report,
  observedBuildEvidence: {
    paths: launchCtx.materialization.expectedFiles,
    directories: launchCtx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: launchCtx.runtimeSession,
  previewSessionEvidence: {
    previewSessionId: 'preview-post-launch',
    workspaceId: launchCtx.runtimeSession.workingDirectory,
    runtimeSessionId: launchCtx.runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    urlReachable: true,
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    interactiveElements: ['nav-dashboard'],
    interactionEvidence: ['click: add contact'],
  },
  verificationEvidenceFixture: launchCtx.verificationFixture,
  launchReadinessFixture: { suppressBlockers: true, forceAcceptanceState: 'ACCEPTED' },
  postLaunchEvidenceFixture: observedFixture,
  skipHistoryRecording: true,
});

assert('I full fixture executes', full.orchestrationState === 'POST_LAUNCH_REALITY_COMPLETE', full.orchestrationState);
assert('I full fixture activity observed', full.report.activityObserved, String(full.report.activityObserved));
assert(
  'I full fixture post-launch state active or higher',
  full.report.postLaunchRealityState === 'ACTIVE_USAGE' ||
    full.report.postLaunchRealityState === 'GROWING_PRODUCT' ||
    full.report.postLaunchRealityState === 'ESTABLISHED_PRODUCT' ||
    full.report.postLaunchRealityState === 'EARLY_ACTIVITY',
  full.report.postLaunchRealityState,
);
assert('I full fixture retention observed', full.report.retentionObserved, String(full.report.retentionObserved));
assert('I full fixture score > 0', full.report.overallPostLaunchScore > 0, String(full.report.overallPostLaunchScore));

const authoritySource = readFileSync(
  join(ROOT, 'src/post-launch-reality-authority/post-launch-reality-authority.ts'),
  'utf8',
);
assert('J authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('J no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/POST_LAUNCH_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Post-Launch Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nPost-launch state (full fixture): ${full.report.postLaunchRealityState}`);
  console.log(`Overall score (full fixture): ${full.report.overallPostLaunchScore}/100`);
  console.log(`Report path: architecture/POST_LAUNCH_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

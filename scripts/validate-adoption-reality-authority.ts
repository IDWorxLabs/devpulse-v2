/**
 * Phase 26.16 — Adoption Reality Authority validation.
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
  resetPostLaunchRealityAuthorityModuleForTests,
  resetPostLaunchRealityHistoryForTests,
} from '../src/post-launch-reality-authority/index.js';
import {
  ADOPTION_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeRepeatUsage,
  assessAdoptionReality,
  buildAdoptionRealityHistorySummary,
  buildAdoptionRealityReportMarkdown,
  computeAdoptionVerdict,
  getAdoptionRealityHistorySize,
  resetAdoptionRealityAuthorityModuleForTests,
  resetAdoptionRealityHistoryForTests,
} from '../src/adoption-reality-authority/index.js';
import { MAX_ADOPTION_REALITY_HISTORY } from '../src/adoption-reality-authority/adoption-reality-registry.js';

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
  'src/adoption-reality-authority/adoption-reality-types.ts',
  'src/adoption-reality-authority/adoption-reality-registry.ts',
  'src/adoption-reality-authority/repeat-usage-analyzer.ts',
  'src/adoption-reality-authority/behavioral-integration-analyzer.ts',
  'src/adoption-reality-authority/feature-adoption-analyzer.ts',
  'src/adoption-reality-authority/user-dependency-analyzer.ts',
  'src/adoption-reality-authority/adoption-risk-analyzer.ts',
  'src/adoption-reality-authority/adoption-verdict-engine.ts',
  'src/adoption-reality-authority/adoption-reality-authority.ts',
  'src/adoption-reality-authority/adoption-reality-history.ts',
  'src/adoption-reality-authority/adoption-reality-report-builder.ts',
  'src/adoption-reality-authority/index.ts',
  'architecture/ADOPTION_REALITY_AUTHORITY_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getObservedPostLaunchFixture() {
  const now = new Date().toISOString();
  return {
    readOnly: true as const,
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

function getObservedAdoptionFixture() {
  const now = new Date().toISOString();
  return {
    readOnly: true as const,
    repeatUsage: {
      readOnly: true as const,
      evidenceSource: 'repeat-session-reports',
      evidencePaths: ['.adoption-evidence/repeat-sessions.json', '.adoption-evidence/return-frequency.json'],
      observedAt: now,
      repeatUsersObserved: true,
      repeatUserCount: 18,
      repeatSessionsObserved: true,
      repeatSessionCount: 94,
      returnFrequencyObserved: true,
      longTermUsageObserved: true,
      usageConsistencyObserved: true,
    },
    behavioralIntegration: {
      readOnly: true as const,
      evidenceSource: 'workflow-reports',
      evidencePaths: ['.adoption-evidence/workflow-integration.json'],
      observedAt: now,
      workflowIntegrationObserved: true,
      habitFormationSignalsObserved: true,
      operationalDependenceObserved: true,
      routineUsageIndicatorsObserved: true,
    },
    featureAdoption: {
      readOnly: true as const,
      evidenceSource: 'feature-usage-reports',
      evidencePaths: ['.adoption-evidence/core-feature-usage.json'],
      observedAt: now,
      coreFeatureUsageObserved: true,
      featureStickinessObserved: true,
      featureDepthScore: 82,
      criticalFeaturePenetrationObserved: true,
    },
    userDependency: {
      readOnly: true as const,
      evidenceSource: 'customer-feedback',
      evidencePaths: ['.adoption-evidence/dependency-signals.json'],
      observedAt: now,
      dependencySignalsObserved: true,
      replacementResistanceObserved: true,
      switchingCostIndicatorsObserved: true,
      operationalImportanceObserved: true,
    },
  };
}

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
  resetPostLaunchRealityAuthorityModuleForTests();

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
    runtimeSessionId: 'runtime-session-adoption',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '7272',
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
    previewSessionId: 'preview-adoption',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-adoption',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'adoption-fixture',
    command: 'npm run validate:adoption-reality-authority',
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

  return { crmAssessment, materialization, runtimeSession, verificationFixture, workspacePath };
}

resetAdoptionRealityAuthorityModuleForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();
resetLiveIdeaToLaunchExecutionRunnerModuleForTests();

const empty = assessAdoptionReality({
  rootDir: ROOT,
  postLaunchReality: null,
  founderLaunchDecision: null,
  adoptionEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'ADOPTION_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state NO_ADOPTION', empty.report.adoptionRealityState === 'NO_ADOPTION', empty.report.adoptionRealityState);
assert('A empty no repeat usage', !empty.report.repeatUsageObserved, String(empty.report.repeatUsageObserved));
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const repeatUnit = analyzeRepeatUsage({ evidence: null, postLaunchActivityObserved: false });
const verdictUnit = computeAdoptionVerdict({
  repeatUsage: repeatUnit,
  behavioralIntegration: {
    readOnly: true,
    workflowIntegration: false,
    habitFormationSignals: false,
    operationalDependence: false,
    routineUsageIndicators: false,
    behavioralIntegrationScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  featureAdoption: {
    readOnly: true,
    coreFeatureUsage: false,
    featureStickiness: false,
    featureDepth: null,
    criticalFeaturePenetration: false,
    featureAdoptionScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  userDependency: {
    readOnly: true,
    dependencySignals: false,
    replacementResistance: false,
    switchingCostIndicators: false,
    operationalImportance: false,
    dependencyScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  adoptionRisk: {
    readOnly: true,
    dropOffRisk: true,
    retentionRisk: true,
    churnIndicators: true,
    weakAdoptionSignals: true,
    adoptionFragility: true,
    adoptionRiskScore: 80,
    riskSignals: [],
  },
  overallAdoptionScore: 0,
  postLaunchActivityObserved: false,
});
assert('B verdict engine executes', verdictUnit.adoptionRealityState === 'NO_ADOPTION', verdictUnit.adoptionRealityState);

const scores = [
  empty.report.overallAdoptionScore,
  empty.report.repeatUsageScore,
  empty.report.behavioralIntegrationScore,
  empty.report.featureAdoptionScore,
  empty.report.dependencyScore,
  empty.report.adoptionRiskScore,
  empty.report.confidence,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildAdoptionRealityReportMarkdown(empty.report).includes('ADOPTION_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_ADOPTION_REALITY_HISTORY + 2; i += 1) {
  assessAdoptionReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getAdoptionRealityHistorySize() <= MAX_ADOPTION_REALITY_HISTORY,
  `${getAdoptionRealityHistorySize()}/${MAX_ADOPTION_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildAdoptionRealityHistorySummary().totalAssessments <= MAX_ADOPTION_REALITY_HISTORY,
  String(buildAdoptionRealityHistorySummary().totalAssessments),
);

const postLaunchWithActivity = {
  readOnly: true as const,
  advisoryOnly: true as const,
  assessmentId: 'fixture-post-launch',
  generatedAt: new Date().toISOString(),
  postLaunchRealityState: 'ACTIVE_USAGE' as const,
  overallPostLaunchScore: 75,
  confidence: 80,
  activityObserved: true,
  retentionObserved: false,
  businessValueObserved: false,
  trafficScore: 80,
  engagementScore: 60,
  retentionScore: 0,
  reliabilityScore: 70,
  businessOutcomeScore: 0,
  traffic: {
    readOnly: true as const,
    trafficObserved: true,
    sessionsObserved: 200,
    usersObserved: 50,
    trend: 'UP' as const,
    trafficConfidence: 'HIGH' as const,
    trafficScore: 80,
    missingEvidence: [],
    riskSignals: [],
  },
  engagement: {
    readOnly: true as const,
    activeUsage: true,
    featureUsage: false,
    sessionQuality: null,
    userReturnSignals: false,
    engagementConfidence: 'LOW' as const,
    engagementScore: 30,
    missingEvidence: [],
    riskSignals: [],
  },
  retention: {
    readOnly: true as const,
    repeatUsers: false,
    repeatUserCount: null,
    retentionSignals: false,
    userReturnEvidence: false,
    retentionConfidence: 'UNKNOWN' as const,
    retentionScore: 0,
    missingEvidence: [],
    riskSignals: [],
  },
  reliability: {
    readOnly: true as const,
    runtimeErrors: false,
    crashEvidence: false,
    supportEvidence: false,
    operationalStability: true,
    uptimePercent: 99,
    reliabilityScore: 70,
    missingEvidence: [],
    riskSignals: [],
  },
  businessOutcome: {
    readOnly: true as const,
    customerValueEvidence: false,
    founderGoalProgress: false,
    monetizationEvidence: false,
    productImpactEvidence: false,
    businessOutcomeSignals: [],
    businessOutcomeScore: 0,
    missingEvidence: [],
    riskSignals: [],
  },
  riskSignals: [],
  missingEvidence: [],
  keyFindings: [],
  recommendedActions: [],
  finalVerdict: 'fixture',
  verdict: {
    readOnly: true as const,
    postLaunchRealityState: 'ACTIVE_USAGE' as const,
    overallPostLaunchScore: 75,
    confidence: 80,
    activityObserved: true,
    retentionObserved: false,
    businessValueObserved: false,
    riskSignals: [],
    missingEvidence: [],
    keyFindings: [],
    recommendedActions: [],
    finalVerdict: 'fixture',
  },
  inputSnapshot: {
    readOnly: true as const,
    founderLaunchDecision: null,
    liveExecutionRunner: null,
    runtimeActivationProof: null,
    launchReadinessProof: null,
    launchCouncil: null,
    postLaunchEvidence: { readOnly: true as const, traffic: null, engagement: null, retention: null, errors: null, business: null },
    launchObserved: true,
  },
  cacheKey: 'fixture',
};

const trafficOnly = assessAdoptionReality({
  rootDir: ROOT,
  postLaunchReality: postLaunchWithActivity,
  trafficOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'F traffic alone cannot create adoption',
  trafficOnly.report.adoptionRealityState === 'NO_ADOPTION' && !trafficOnly.report.repeatUsageObserved,
  `${trafficOnly.report.adoptionRealityState}/${trafficOnly.report.repeatUsageObserved}`,
);

const signupsOnly = assessAdoptionReality({
  rootDir: ROOT,
  postLaunchReality: postLaunchWithActivity,
  signupsOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'G signups alone cannot create adoption',
  signupsOnly.report.adoptionRealityState === 'NO_ADOPTION' && !signupsOnly.report.repeatUsageObserved,
  signupsOnly.report.adoptionRealityState,
);

const oneTime = assessAdoptionReality({
  rootDir: ROOT,
  postLaunchReality: postLaunchWithActivity,
  oneTimeUsageFixture: true,
  skipHistoryRecording: true,
});
assert(
  'H one-time usage cannot create adoption',
  oneTime.report.adoptionRealityState === 'NO_ADOPTION' && !oneTime.report.repeatUsageObserved,
  oneTime.report.adoptionRealityState,
);

const fabricated = assessAdoptionReality({
  rootDir: ROOT,
  postLaunchReality: postLaunchWithActivity,
  fabricatedMetricsFixture: true,
  adoptionEvidenceFixture: {
    repeatUsage: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      repeatUsersObserved: true,
      repeatUserCount: 9999,
      repeatSessionsObserved: true,
      repeatSessionCount: 50000,
      returnFrequencyObserved: true,
      longTermUsageObserved: true,
      usageConsistencyObserved: true,
    },
  },
  skipHistoryRecording: true,
});
assert(
  'I fabricated metrics rejected',
  !fabricated.report.repeatUsageObserved && fabricated.report.repeatUsageScore === 0,
  `${fabricated.report.repeatUsageObserved}/${fabricated.report.repeatUsageScore}`,
);
assert(
  'I evidence-only verdict enforced',
  fabricated.report.adoptionRealityState === 'NO_ADOPTION' &&
    fabricated.report.keyFindings.some((f) => f.includes('Fabricated') || f.includes('fabricated')),
  fabricated.report.adoptionRealityState,
);

resetAdoptionRealityAuthorityModuleForTests();
const ctx = getLaunchFixtureContext();
const full = assessAdoptionReality({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: {
    previewSessionId: 'preview-adoption',
    workspaceId: ctx.workspacePath,
    runtimeSessionId: ctx.runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    urlReachable: true,
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    interactiveElements: ['nav-dashboard'],
    interactionEvidence: ['click: add contact'],
  },
  verificationEvidenceFixture: ctx.verificationFixture,
  launchReadinessFixture: { suppressBlockers: true, forceAcceptanceState: 'ACCEPTED' },
  postLaunchEvidenceFixture: getObservedPostLaunchFixture(),
  adoptionEvidenceFixture: getObservedAdoptionFixture(),
  skipHistoryRecording: true,
});

assert('J full fixture executes', full.orchestrationState === 'ADOPTION_REALITY_COMPLETE', full.orchestrationState);
assert('J full fixture repeat usage observed', full.report.repeatUsageObserved, String(full.report.repeatUsageObserved));
assert(
  'J full fixture adoption state established or higher',
  full.report.adoptionRealityState === 'ESTABLISHED_ADOPTION' ||
    full.report.adoptionRealityState === 'CRITICAL_DEPENDENCY' ||
    full.report.adoptionRealityState === 'EMERGING_ADOPTION',
  full.report.adoptionRealityState,
);
assert('J full fixture score > 0', full.report.overallAdoptionScore > 0, String(full.report.overallAdoptionScore));
assert(
  'J full fixture behavioral integration observed',
  full.report.behavioralIntegrationObserved,
  String(full.report.behavioralIntegrationObserved),
);

const authoritySource = readFileSync(
  join(ROOT, 'src/adoption-reality-authority/adoption-reality-authority.ts'),
  'utf8',
);
assert('K authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('K no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/ADOPTION_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(ADOPTION_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Adoption Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nAdoption state (full fixture): ${full.report.adoptionRealityState}`);
  console.log(`Overall adoption score (full fixture): ${full.report.overallAdoptionScore}/100`);
  console.log(`Report path: architecture/ADOPTION_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${ADOPTION_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

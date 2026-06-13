/**
 * Phase 26.19 — Product Lifecycle Reality Orchestrator validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetAutonomousBuildExecutionProofModuleForTests } from '../src/autonomous-build-execution-proof/index.js';
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
  resetAdoptionRealityAuthorityModuleForTests,
  resetAdoptionRealityHistoryForTests,
} from '../src/adoption-reality-authority/index.js';
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
  resetRevenueRealityAuthorityModuleForTests,
  resetRevenueRealityHistoryForTests,
} from '../src/revenue-reality-authority/index.js';
import {
  resetProductEvolutionRealityAuthorityModuleForTests,
  resetProductEvolutionRealityHistoryForTests,
} from '../src/product-evolution-reality-authority/index.js';
import {
  PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN,
  assessProductLifecycleReality,
  buildProductLifecycleRealityHistorySummary,
  buildProductLifecycleRealityReportMarkdown,
  classifyLifecycleStage,
  collectLifecycleSignals,
  computeProductLifecycleVerdict,
  getProductLifecycleRealityHistorySize,
  resetProductLifecycleRealityOrchestratorModuleForTests,
  resetProductLifecycleRealityHistoryForTests,
} from '../src/product-lifecycle-reality-orchestrator/index.js';
import { MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY } from '../src/product-lifecycle-reality-orchestrator/product-lifecycle-reality-registry.js';

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

function stageRank(stage: string): number {
  const order = [
    'IDEA_ONLY',
    'PLANNED',
    'BUILT',
    'VALIDATED',
    'RUNTIME_READY',
    'LAUNCH_READY',
    'LAUNCHED',
    'ADOPTED',
    'REVENUE_GENERATING',
    'EVOLVING_PRODUCT',
    'SCALING_PRODUCT',
  ];
  return order.indexOf(stage);
}

const REQUIRED = [
  'src/product-lifecycle-reality-orchestrator/product-lifecycle-reality-types.ts',
  'src/product-lifecycle-reality-orchestrator/product-lifecycle-reality-registry.ts',
  'src/product-lifecycle-reality-orchestrator/lifecycle-signal-collector.ts',
  'src/product-lifecycle-reality-orchestrator/lifecycle-stage-classifier.ts',
  'src/product-lifecycle-reality-orchestrator/lifecycle-gap-analyzer.ts',
  'src/product-lifecycle-reality-orchestrator/lifecycle-risk-analyzer.ts',
  'src/product-lifecycle-reality-orchestrator/lifecycle-next-action-engine.ts',
  'src/product-lifecycle-reality-orchestrator/product-lifecycle-verdict-engine.ts',
  'src/product-lifecycle-reality-orchestrator/product-lifecycle-reality-orchestrator.ts',
  'src/product-lifecycle-reality-orchestrator/product-lifecycle-reality-history.ts',
  'src/product-lifecycle-reality-orchestrator/product-lifecycle-report-builder.ts',
  'src/product-lifecycle-reality-orchestrator/index.ts',
  'architecture/PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT.md',
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
      evidencePaths: ['.post-launch-evidence/analytics-sessions.json'],
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
      businessOutcomeSignals: ['Deals created in CRM'],
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
      evidencePaths: ['.adoption-evidence/repeat-sessions.json'],
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

function getObservedRevenueFixture() {
  const now = new Date().toISOString();
  return {
    readOnly: true as const,
    revenue: {
      readOnly: true as const,
      evidenceSource: 'payment-reports',
      evidencePaths: ['.revenue-evidence/transactions.json'],
      observedAt: now,
      revenueObserved: true,
      transactionEvidenceObserved: true,
      recurringRevenueObserved: true,
      revenueAmountCents: 248000,
      recurringRevenueAmountCents: 185000,
      revenueGrowthObserved: true,
      trend: 'UP' as const,
    },
    customerValue: {
      readOnly: true as const,
      evidenceSource: 'billing-reports',
      evidencePaths: ['.revenue-evidence/paying-customers.json'],
      observedAt: now,
      payingCustomersObserved: true,
      payingCustomerCount: 14,
      repeatCustomersObserved: true,
      repeatCustomerCount: 9,
      customerRetentionObserved: true,
      customerSatisfactionObserved: true,
      valueExchangeObserved: true,
    },
    conversion: {
      readOnly: true as const,
      evidenceSource: 'subscription-reports',
      evidencePaths: ['.revenue-evidence/conversion-funnel.json'],
      observedAt: now,
      conversionEvidenceObserved: true,
      freeToPaidSignalsObserved: true,
      purchaseCompletionObserved: true,
      customerAcquisitionEfficiencyObserved: true,
      conversionRatePercent: 12.5,
    },
    revenueStability: {
      readOnly: true as const,
      evidenceSource: 'accounting-exports',
      evidencePaths: ['.revenue-evidence/recurring-revenue.json'],
      observedAt: now,
      recurringRevenueSignalsObserved: true,
      revenueConsistencyObserved: true,
      revenueConcentrationRiskObserved: false,
      revenuePredictabilityObserved: true,
    },
  };
}

function getObservedEvolutionFixture() {
  const now = new Date().toISOString();
  return {
    feedbackLearning: {
      readOnly: true as const,
      evidenceSource: 'user-feedback-reports',
      evidencePaths: ['.evolution-evidence/feedback-processed.json'],
      observedAt: now,
      userFeedbackProcessedObserved: true,
      featureRequestResponseObserved: true,
      supportSignalResponseObserved: true,
      customerPainResolutionObserved: true,
    },
    failureLearning: {
      readOnly: true as const,
      evidenceSource: 'bug-reports',
      evidencePaths: ['.evolution-evidence/incident-postmortems.json'],
      observedAt: now,
      bugFixLearningObserved: true,
      incidentLearningObserved: true,
      rootCauseLearningObserved: true,
      repeatedFailureReductionObserved: true,
    },
    usageLearning: {
      readOnly: true as const,
      evidenceSource: 'usage-analytics',
      evidencePaths: ['.evolution-evidence/usage-driven-changes.json'],
      observedAt: now,
      behaviorInformedChangesObserved: true,
      usageDrivenImprovementsObserved: true,
      retentionImprovementsObserved: true,
      engagementImprovementsObserved: true,
    },
    revenueLearning: {
      readOnly: true as const,
      evidenceSource: 'revenue-reports',
      evidencePaths: ['.evolution-evidence/revenue-informed-decisions.json'],
      observedAt: now,
      revenueInformedDecisionsObserved: true,
      customerValueImprovementsObserved: true,
      businessModelAdjustmentsObserved: true,
      monetizationLearningObserved: true,
    },
    improvementVelocity: {
      readOnly: true as const,
      evidenceSource: 'release-notes',
      evidencePaths: ['.evolution-evidence/changelog-q1.json'],
      observedAt: now,
      improvementFrequencyObserved: true,
      evidenceToActionSpeedObserved: true,
      issueResolutionSpeedObserved: true,
      adaptationResponsivenessObserved: true,
      improvementsInLastPeriod: 8,
    },
  };
}

function resetAllModules() {
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
  resetAdoptionRealityAuthorityModuleForTests();
  resetRevenueRealityAuthorityModuleForTests();
  resetProductEvolutionRealityAuthorityModuleForTests();
}

function getLaunchFixtureContext() {
  resetAllModules();

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
    runtimeSessionId: 'runtime-session-lifecycle',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '9393',
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
    previewSessionId: 'preview-lifecycle',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-lifecycle',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'lifecycle-fixture',
    command: 'npm run validate:product-lifecycle-reality-orchestrator',
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

function baseLaunchInput(ctx: ReturnType<typeof getLaunchFixtureContext>) {
  return {
    rootDir: ROOT,
    rawPrompt: crmPrompt,
    requirementsToPlanContract: ctx.crmAssessment.report,
    observedBuildEvidence: {
      paths: ctx.materialization.expectedFiles,
      directories: ctx.materialization.workspaceTargets,
    },
    runtimeSessionEvidence: ctx.runtimeSession,
    previewSessionEvidence: {
      previewSessionId: 'preview-lifecycle',
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
    launchReadinessFixture: { suppressBlockers: true, forceAcceptanceState: 'ACCEPTED' as const },
    skipHistoryRecording: true,
  };
}

resetProductLifecycleRealityOrchestratorModuleForTests();
resetProductLifecycleRealityHistoryForTests();
resetRevenueRealityHistoryForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();
resetProductEvolutionRealityHistoryForTests();

const empty = assessProductLifecycleReality({
  rootDir: ROOT,
  liveExecutionRunner: null,
  founderLaunchDecision: null,
  postLaunchReality: null,
  adoptionReality: null,
  revenueReality: null,
  productEvolutionReality: null,
  requirementsToPlanContract: null,
  skipHistoryRecording: true,
});

assert('A orchestrator executes', empty.orchestrationState === 'PRODUCT_LIFECYCLE_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state IDEA_ONLY', empty.report.productLifecycleRealityState === 'IDEA_ONLY', empty.report.productLifecycleRealityState);
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);
assert(
  'A next action evidence-backed',
  empty.report.nextAction.evidenceBacked,
  String(empty.report.nextAction.evidenceBacked),
);

const signalsUnit = collectLifecycleSignals({
  readOnly: true,
  liveExecutionRunner: null,
  founderLaunchDecision: null,
  postLaunchReality: null,
  adoptionReality: null,
  revenueReality: null,
  productEvolutionReality: null,
  requirementsToPlanContract: null,
});
const stageUnit = classifyLifecycleStage(signalsUnit);
const verdictUnit = computeProductLifecycleVerdict({
  stageClassification: stageUnit,
  scores: {
    readOnly: true,
    executionScore: 0,
    launchScore: 0,
    postLaunchScore: 0,
    adoptionScore: 0,
    revenueScore: 0,
    evolutionScore: 0,
    lifecycleConfidenceScore: 0,
    overallLifecycleScore: 0,
  },
  gapAnalysis: {
    readOnly: true,
    missingEvidence: [],
    weakEvidence: [],
    brokenProofLinks: [],
    lifecycleBlockers: [],
    stageRegressionRisks: [],
    staleEvidence: [],
    contradictoryEvidence: [],
    nextProofGap: 'test',
  },
  riskAnalysis: {
    readOnly: true,
    launchRisk: false,
    adoptionRisk: false,
    revenueRisk: false,
    evolutionRisk: false,
    operationalRisk: false,
    lifecycleStagnationRisk: false,
    evidenceConfidenceRisk: false,
    lifecycleRiskScore: 0,
    riskSignals: [],
  },
  nextAction: {
    readOnly: true,
    nextRequiredAction: 'CAPTURE_REQUIREMENTS',
    actionReason: 'test',
    evidenceBacked: true,
    supportingEvidence: ['test'],
  },
  canScaleNow: false,
});
assert('B verdict engine executes', verdictUnit.productLifecycleRealityState === 'IDEA_ONLY', verdictUnit.productLifecycleRealityState);

const scores = [
  empty.report.overallLifecycleScore,
  empty.report.lifecycleConfidenceScore,
  empty.report.executionScore,
  empty.report.launchScore,
  empty.report.postLaunchScore,
  empty.report.adoptionScore,
  empty.report.revenueScore,
  empty.report.evolutionScore,
  empty.report.riskAnalysis.lifecycleRiskScore,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildProductLifecycleRealityReportMarkdown(empty.report).includes('PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY + 2; i += 1) {
  assessProductLifecycleReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getProductLifecycleRealityHistorySize() <= MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY,
  `${getProductLifecycleRealityHistorySize()}/${MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildProductLifecycleRealityHistorySummary().totalAssessments <= MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY,
  String(buildProductLifecycleRealityHistorySummary().totalAssessments),
);

resetProductLifecycleRealityOrchestratorModuleForTests();
const ctx = getLaunchFixtureContext();

const planningOnly = assessProductLifecycleReality({
  ...baseLaunchInput(ctx),
  planningOnlyFixture: true,
});
assert(
  'F planning alone cannot produce BUILT',
  stageRank(planningOnly.report.highestProvenStage) < stageRank('BUILT'),
  planningOnly.report.highestProvenStage,
);

const buildOnly = assessProductLifecycleReality({
  ...baseLaunchInput(ctx),
  buildOnlyFixture: true,
});
assert(
  'G build alone cannot produce RUNTIME_READY',
  stageRank(buildOnly.report.highestProvenStage) < stageRank('RUNTIME_READY'),
  buildOnly.report.highestProvenStage,
);

const runtimeOnly = assessProductLifecycleReality({
  ...baseLaunchInput(ctx),
  runtimeOnlyFixture: true,
});
assert(
  'H runtime alone cannot produce LAUNCHED',
  stageRank(runtimeOnly.report.highestProvenStage) < stageRank('LAUNCHED'),
  runtimeOnly.report.highestProvenStage,
);

const launchReadinessOnly = assessProductLifecycleReality({
  ...baseLaunchInput(ctx),
  launchReadinessOnlyFixture: true,
});
assert(
  'I launch readiness alone cannot produce ADOPTED',
  stageRank(launchReadinessOnly.report.highestProvenStage) < stageRank('ADOPTED'),
  launchReadinessOnly.report.highestProvenStage,
);

const adoptionOnly = assessProductLifecycleReality({
  ...baseLaunchInput(ctx),
  postLaunchEvidenceFixture: getObservedPostLaunchFixture(),
  adoptionEvidenceFixture: getObservedAdoptionFixture(),
  adoptionOnlyFixture: true,
});
assert(
  'J adoption alone cannot produce REVENUE_GENERATING',
  stageRank(adoptionOnly.report.highestProvenStage) < stageRank('REVENUE_GENERATING'),
  adoptionOnly.report.highestProvenStage,
);

const revenueOnly = assessProductLifecycleReality({
  ...baseLaunchInput(ctx),
  postLaunchEvidenceFixture: getObservedPostLaunchFixture(),
  adoptionEvidenceFixture: getObservedAdoptionFixture(),
  revenueEvidenceFixture: getObservedRevenueFixture(),
  revenueOnlyFixture: true,
});
assert(
  'K revenue alone cannot produce EVOLVING_PRODUCT',
  stageRank(revenueOnly.report.highestProvenStage) < stageRank('EVOLVING_PRODUCT'),
  revenueOnly.report.highestProvenStage,
);

resetProductLifecycleRealityOrchestratorModuleForTests();
resetAllModules();
const ctxFull = getLaunchFixtureContext();
const full = assessProductLifecycleReality({
  ...baseLaunchInput(ctxFull),
  postLaunchEvidenceFixture: getObservedPostLaunchFixture(),
  adoptionEvidenceFixture: getObservedAdoptionFixture(),
  revenueEvidenceFixture: getObservedRevenueFixture(),
  evolutionEvidenceFixture: getObservedEvolutionFixture(),
  skipHistoryRecording: true,
});

assert('L full fixture executes', full.orchestrationState === 'PRODUCT_LIFECYCLE_REALITY_COMPLETE', full.orchestrationState);
assert(
  'L full fixture lifecycle state evolving or higher',
  stageRank(full.report.productLifecycleRealityState) >= stageRank('EVOLVING_PRODUCT'),
  full.report.productLifecycleRealityState,
);
assert('L full fixture score > 0', full.report.overallLifecycleScore > 0, String(full.report.overallLifecycleScore));
assert('L full fixture next action evidence-backed', full.report.nextAction.evidenceBacked, String(full.report.nextAction.evidenceBacked));

const orchestratorSource = readFileSync(
  join(ROOT, 'src/product-lifecycle-reality-orchestrator/product-lifecycle-reality-orchestrator.ts'),
  'utf8',
);
assert('M orchestrator read-only advisory', orchestratorSource.includes('advisoryOnly: true'), 'yes');
assert('M no mutation patterns', !orchestratorSource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Product Lifecycle Reality Orchestrator Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nLifecycle state (full fixture): ${full.report.productLifecycleRealityState}`);
  console.log(`Overall lifecycle score (full fixture): ${full.report.overallLifecycleScore}/100`);
  console.log(`Next required action (full fixture): ${full.report.nextRequiredAction}`);
  console.log(`Report path: architecture/PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_REPORT.md`);
  console.log(`\n${PRODUCT_LIFECYCLE_REALITY_ORCHESTRATOR_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

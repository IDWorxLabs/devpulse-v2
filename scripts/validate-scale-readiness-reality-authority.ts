/**
 * Phase 26.20 — Scale Readiness Reality Authority validation.
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
  resetProductLifecycleRealityOrchestratorModuleForTests,
  resetProductLifecycleRealityHistoryForTests,
} from '../src/product-lifecycle-reality-orchestrator/index.js';
import {
  SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeArchitectureScalability,
  assessScaleReadinessReality,
  buildScaleReadinessRealityHistorySummary,
  buildScaleReadinessRealityReportMarkdown,
  computeScaleReadinessVerdict,
  getScaleReadinessRealityHistorySize,
  resetScaleReadinessRealityAuthorityModuleForTests,
  resetScaleReadinessRealityHistoryForTests,
} from '../src/scale-readiness-reality-authority/index.js';
import { MAX_SCALE_READINESS_REALITY_HISTORY } from '../src/scale-readiness-reality-authority/scale-readiness-registry.js';

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

function stateRank(state: string): number {
  return ['NOT_READY', 'FRAGILE', 'PARTIALLY_READY', 'SCALE_READY', 'SCALE_RESILIENT'].indexOf(state);
}

const REQUIRED = [
  'src/scale-readiness-reality-authority/scale-readiness-types.ts',
  'src/scale-readiness-reality-authority/scale-readiness-registry.ts',
  'src/scale-readiness-reality-authority/architecture-scalability-analyzer.ts',
  'src/scale-readiness-reality-authority/operational-scalability-analyzer.ts',
  'src/scale-readiness-reality-authority/team-scalability-analyzer.ts',
  'src/scale-readiness-reality-authority/financial-scalability-analyzer.ts',
  'src/scale-readiness-reality-authority/customer-support-scalability-analyzer.ts',
  'src/scale-readiness-reality-authority/reliability-scalability-analyzer.ts',
  'src/scale-readiness-reality-authority/scale-risk-analyzer.ts',
  'src/scale-readiness-reality-authority/scale-readiness-verdict-engine.ts',
  'src/scale-readiness-reality-authority/scale-readiness-reality-authority.ts',
  'src/scale-readiness-reality-authority/scale-readiness-history.ts',
  'src/scale-readiness-reality-authority/scale-readiness-report-builder.ts',
  'src/scale-readiness-reality-authority/index.ts',
  'architecture/SCALE_READINESS_REALITY_AUTHORITY_REPORT.md',
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

function getObservedScaleEvidenceFixture() {
  const now = new Date().toISOString();
  return {
    architecture: {
      readOnly: true as const,
      evidenceSource: 'architecture-reports',
      evidencePaths: ['.scale-evidence/architecture-review.json', '.scale-evidence/infrastructure-readiness.json'],
      observedAt: now,
      systemScalabilityObserved: true,
      bottleneckRisksIdentified: true,
      infrastructureReadinessObserved: true,
      capacitySignalsObserved: true,
      scalabilityConfidenceObserved: true,
    },
    operational: {
      readOnly: true as const,
      evidenceSource: 'operational-reports',
      evidencePaths: ['.scale-evidence/monitoring-coverage.json', '.scale-evidence/incident-response.json'],
      observedAt: now,
      operationalMaturityObserved: true,
      monitoringCoverageObserved: true,
      incidentResponseCapabilityObserved: true,
      recoveryCapabilityObserved: true,
      operationalReadinessObserved: true,
    },
    team: {
      readOnly: true as const,
      evidenceSource: 'staffing-reports',
      evidencePaths: ['.scale-evidence/team-scalability.json'],
      observedAt: now,
      knowledgeDistributionObserved: true,
      busFactorRiskAssessed: true,
      teamDependencyRiskAssessed: true,
      operationalOwnershipObserved: true,
    },
    financial: {
      readOnly: true as const,
      evidenceSource: 'financial-reports',
      evidencePaths: ['.scale-evidence/financial-scalability.json'],
      observedAt: now,
      revenueSustainabilityObserved: true,
      growthCostSignalsObserved: true,
      scalingCostRisksAssessed: true,
      financialStabilityObserved: true,
    },
    customerSupport: {
      readOnly: true as const,
      evidenceSource: 'customer-support-reports',
      evidencePaths: ['.scale-evidence/support-capacity.json'],
      observedAt: now,
      supportCapacityObserved: true,
      supportResponseSignalsObserved: true,
      customerSuccessReadinessObserved: true,
      supportBottlenecksAssessed: true,
    },
    reliability: {
      readOnly: true as const,
      evidenceSource: 'reliability-reports',
      evidencePaths: ['.scale-evidence/uptime-history.json', '.scale-evidence/incident-trends.json'],
      observedAt: now,
      reliabilityHistoryObserved: true,
      availabilitySignalsObserved: true,
      incidentTrendsAssessed: true,
      failureRecoveryCapabilityObserved: true,
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
  resetProductLifecycleRealityOrchestratorModuleForTests();
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
    runtimeSessionId: 'runtime-session-scale',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '9494',
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
    previewSessionId: 'preview-scale',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-scale',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'scale-fixture',
    command: 'npm run validate:scale-readiness-reality-authority',
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
      previewSessionId: 'preview-scale',
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
    postLaunchEvidenceFixture: getObservedPostLaunchFixture(),
    adoptionEvidenceFixture: getObservedAdoptionFixture(),
    revenueEvidenceFixture: getObservedRevenueFixture(),
    evolutionEvidenceFixture: getObservedEvolutionFixture(),
    skipHistoryRecording: true,
  };
}

resetScaleReadinessRealityAuthorityModuleForTests();
resetScaleReadinessRealityHistoryForTests();
resetProductLifecycleRealityHistoryForTests();
resetProductEvolutionRealityHistoryForTests();
resetRevenueRealityHistoryForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();

const empty = assessScaleReadinessReality({
  rootDir: ROOT,
  productLifecycleReality: null,
  scaleEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'SCALE_READINESS_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state NOT_READY', empty.report.scaleReadinessState === 'NOT_READY', empty.report.scaleReadinessState);
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const archUnit = analyzeArchitectureScalability({ evidence: null, productLaunched: false });
const verdictUnit = computeScaleReadinessVerdict({
  architecture: archUnit,
  operational: {
    readOnly: true,
    operationalMaturity: false,
    monitoringCoverage: false,
    incidentResponseCapability: false,
    recoveryCapability: false,
    operationalReadiness: false,
    operationalScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  team: {
    readOnly: true,
    knowledgeDistribution: false,
    busFactorRisk: false,
    teamDependencyRisk: false,
    operationalOwnership: false,
    teamScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  financial: {
    readOnly: true,
    revenueSustainability: false,
    growthCostSignals: false,
    scalingCostRisks: false,
    financialStability: false,
    financialScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  customerSupport: {
    readOnly: true,
    supportCapacity: false,
    supportResponseSignals: false,
    customerSuccessReadiness: false,
    supportBottlenecks: false,
    supportScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  reliability: {
    readOnly: true,
    reliabilityHistory: false,
    availabilitySignals: false,
    incidentTrends: false,
    failureRecoveryCapability: false,
    reliabilityScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  scaleRisk: {
    readOnly: true,
    growthRisk: true,
    infrastructureRisk: true,
    operationalRisk: true,
    teamRisk: true,
    financialRisk: true,
    customerExperienceRisk: true,
    scaleRiskScore: 80,
    riskSignals: [],
  },
  overallScaleReadinessScore: 0,
  productLaunched: false,
});
assert('B verdict engine executes', verdictUnit.scaleReadinessState === 'NOT_READY', verdictUnit.scaleReadinessState);

const scores = [
  empty.report.overallScaleReadinessScore,
  empty.report.confidence,
  empty.report.architectureScalabilityScore,
  empty.report.operationalScalabilityScore,
  empty.report.teamScalabilityScore,
  empty.report.financialScalabilityScore,
  empty.report.supportScalabilityScore,
  empty.report.reliabilityScalabilityScore,
  empty.report.scaleRiskScore,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildScaleReadinessRealityReportMarkdown(empty.report).includes('SCALE_READINESS_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_SCALE_READINESS_REALITY_HISTORY + 2; i += 1) {
  assessScaleReadinessReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getScaleReadinessRealityHistorySize() <= MAX_SCALE_READINESS_REALITY_HISTORY,
  `${getScaleReadinessRealityHistorySize()}/${MAX_SCALE_READINESS_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildScaleReadinessRealityHistorySummary().totalAssessments <= MAX_SCALE_READINESS_REALITY_HISTORY,
  String(buildScaleReadinessRealityHistorySummary().totalAssessments),
);

resetScaleReadinessRealityAuthorityModuleForTests();
const ctx = getLaunchFixtureContext();
const baseInput = baseLaunchInput(ctx);

const revenueOnly = assessScaleReadinessReality({
  ...baseInput,
  revenueOnlyFixture: true,
});
assert(
  'F revenue alone cannot create SCALE_READY',
  stateRank(revenueOnly.report.scaleReadinessState) < stateRank('SCALE_READY'),
  revenueOnly.report.scaleReadinessState,
);

const adoptionOnly = assessScaleReadinessReality({
  ...baseInput,
  adoptionOnlyFixture: true,
});
assert(
  'G adoption alone cannot create SCALE_READY',
  stateRank(adoptionOnly.report.scaleReadinessState) < stateRank('SCALE_READY'),
  adoptionOnly.report.scaleReadinessState,
);

const infrastructureOnly = assessScaleReadinessReality({
  ...baseInput,
  infrastructureOnlyFixture: true,
  scaleEvidenceFixture: {
    architecture: getObservedScaleEvidenceFixture().architecture,
    reliability: getObservedScaleEvidenceFixture().reliability,
  },
});
assert(
  'H infrastructure alone cannot create SCALE_READY',
  stateRank(infrastructureOnly.report.scaleReadinessState) < stateRank('SCALE_READY'),
  infrastructureOnly.report.scaleReadinessState,
);

const fabricated = assessScaleReadinessReality({
  ...baseInput,
  fabricatedMetricsFixture: true,
  scaleEvidenceFixture: {
    architecture: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      systemScalabilityObserved: true,
      bottleneckRisksIdentified: true,
      infrastructureReadinessObserved: true,
      capacitySignalsObserved: true,
      scalabilityConfidenceObserved: true,
    },
  },
});
assert(
  'I fabricated scalability evidence rejected',
  !fabricated.report.architectureReady && fabricated.report.architectureScalabilityScore === 0,
  `${fabricated.report.architectureReady}/${fabricated.report.architectureScalabilityScore}`,
);
assert(
  'I evidence-only verdict enforced',
  fabricated.report.scaleReadinessState === 'NOT_READY' &&
    fabricated.report.keyFindings.some((f) => f.includes('Fabricated') || f.includes('fabricated')),
  fabricated.report.scaleReadinessState,
);

resetScaleReadinessRealityAuthorityModuleForTests();
resetAllModules();
const ctxFull = getLaunchFixtureContext();
const full = assessScaleReadinessReality({
  ...baseLaunchInput(ctxFull),
  scaleEvidenceFixture: getObservedScaleEvidenceFixture(),
  skipHistoryRecording: true,
});

assert('J full fixture executes', full.orchestrationState === 'SCALE_READINESS_REALITY_COMPLETE', full.orchestrationState);
assert(
  'J full fixture scale ready or resilient',
  full.report.scaleReadinessState === 'SCALE_READY' || full.report.scaleReadinessState === 'SCALE_RESILIENT',
  full.report.scaleReadinessState,
);
assert('J full fixture score > 0', full.report.overallScaleReadinessScore > 0, String(full.report.overallScaleReadinessScore));
assert(
  'J full fixture multi-dimension ready',
  full.report.architectureReady && full.report.operationsReady && full.report.reliabilityReady,
  `${full.report.architectureReady}/${full.report.operationsReady}/${full.report.reliabilityReady}`,
);

const authoritySource = readFileSync(
  join(ROOT, 'src/scale-readiness-reality-authority/scale-readiness-reality-authority.ts'),
  'utf8',
);
assert('K authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('K no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/SCALE_READINESS_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Scale Readiness Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nScale readiness state (full fixture): ${full.report.scaleReadinessState}`);
  console.log(`Overall scale readiness score (full fixture): ${full.report.overallScaleReadinessScore}/100`);
  console.log(`Report path: architecture/SCALE_READINESS_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${SCALE_READINESS_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

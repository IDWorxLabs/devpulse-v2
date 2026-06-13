/**
 * Phase 26.21 — Market Expansion Reality Authority validation.
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
  resetScaleReadinessRealityAuthorityModuleForTests,
  resetScaleReadinessRealityHistoryForTests,
} from '../src/scale-readiness-reality-authority/index.js';
import {
  MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeCustomerSegmentExpansion,
  assessMarketExpansionReality,
  buildMarketExpansionRealityHistorySummary,
  buildMarketExpansionRealityReportMarkdown,
  computeMarketExpansionVerdict,
  getMarketExpansionRealityHistorySize,
  resetMarketExpansionRealityAuthorityModuleForTests,
  resetMarketExpansionRealityHistoryForTests,
} from '../src/market-expansion-reality-authority/index.js';
import { MAX_MARKET_EXPANSION_REALITY_HISTORY } from '../src/market-expansion-reality-authority/market-expansion-reality-registry.js';

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
  return ['NOT_READY', 'LOCAL_SUCCESS', 'SEGMENT_READY', 'MULTI_MARKET_READY', 'EXPANSION_RESILIENT'].indexOf(
    state,
  );
}

const REQUIRED = [
  'src/market-expansion-reality-authority/market-expansion-reality-types.ts',
  'src/market-expansion-reality-authority/market-expansion-reality-registry.ts',
  'src/market-expansion-reality-authority/customer-segment-expansion-analyzer.ts',
  'src/market-expansion-reality-authority/industry-expansion-analyzer.ts',
  'src/market-expansion-reality-authority/regional-expansion-analyzer.ts',
  'src/market-expansion-reality-authority/channel-expansion-analyzer.ts',
  'src/market-expansion-reality-authority/product-market-fit-resilience-analyzer.ts',
  'src/market-expansion-reality-authority/expansion-risk-analyzer.ts',
  'src/market-expansion-reality-authority/market-expansion-verdict-engine.ts',
  'src/market-expansion-reality-authority/market-expansion-reality-authority.ts',
  'src/market-expansion-reality-authority/market-expansion-reality-history.ts',
  'src/market-expansion-reality-authority/market-expansion-report-builder.ts',
  'src/market-expansion-reality-authority/index.ts',
  'architecture/MARKET_EXPANSION_REALITY_AUTHORITY_REPORT.md',
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
      evidencePaths: ['.scale-evidence/architecture-review.json'],
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
      evidencePaths: ['.scale-evidence/monitoring-coverage.json'],
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
      evidencePaths: ['.scale-evidence/uptime-history.json'],
      observedAt: now,
      reliabilityHistoryObserved: true,
      availabilitySignalsObserved: true,
      incidentTrendsAssessed: true,
      failureRecoveryCapabilityObserved: true,
    },
  };
}

function getObservedExpansionEvidenceFixture() {
  const now = new Date().toISOString();
  return {
    customerSegment: {
      readOnly: true as const,
      evidenceSource: 'customer-segment-reports',
      evidencePaths: ['.expansion-evidence/cross-segment-adoption.json', '.expansion-evidence/customer-diversity.json'],
      observedAt: now,
      crossSegmentAdoptionObserved: true,
      customerDiversityObserved: true,
      segmentConcentrationRiskAssessed: true,
      expansionConfidenceObserved: true,
    },
    industry: {
      readOnly: true as const,
      evidenceSource: 'product-market-fit-reports',
      evidencePaths: ['.expansion-evidence/industry-fit.json'],
      observedAt: now,
      industryFitSignalsObserved: true,
      useCaseDiversityObserved: true,
      industryDependencyRiskAssessed: true,
      industryExpansionConfidenceObserved: true,
    },
    regional: {
      readOnly: true as const,
      evidenceSource: 'regional-usage-reports',
      evidencePaths: ['.expansion-evidence/regional-adoption.json', '.expansion-evidence/localization-readiness.json'],
      observedAt: now,
      regionalAdoptionSignalsObserved: true,
      localizationReadinessObserved: true,
      regionalDependencyRiskAssessed: true,
      geographicExpansionConfidenceObserved: true,
    },
    channel: {
      readOnly: true as const,
      evidenceSource: 'growth-reports',
      evidencePaths: ['.expansion-evidence/channel-diversity.json'],
      observedAt: now,
      acquisitionChannelDiversityObserved: true,
      channelDependencyRiskAssessed: true,
      expansionChannelReadinessObserved: true,
    },
    productMarketFit: {
      readOnly: true as const,
      evidenceSource: 'product-market-fit-reports',
      evidencePaths: ['.expansion-evidence/pmf-resilience.json'],
      observedAt: now,
      fitStabilityObserved: true,
      expansionStressRiskAssessed: true,
      marketDependencyRiskAssessed: true,
      productFlexibilityObserved: true,
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
  resetScaleReadinessRealityAuthorityModuleForTests();
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
    runtimeSessionId: 'runtime-session-expansion',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '9595',
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
    previewSessionId: 'preview-expansion',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-expansion',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'expansion-fixture',
    command: 'npm run validate:market-expansion-reality-authority',
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
      previewSessionId: 'preview-expansion',
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
    scaleEvidenceFixture: getObservedScaleEvidenceFixture(),
    skipHistoryRecording: true,
  };
}

resetMarketExpansionRealityAuthorityModuleForTests();
resetMarketExpansionRealityHistoryForTests();
resetScaleReadinessRealityHistoryForTests();
resetProductLifecycleRealityHistoryForTests();
resetProductEvolutionRealityHistoryForTests();
resetRevenueRealityHistoryForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();

const empty = assessMarketExpansionReality({
  rootDir: ROOT,
  scaleReadinessReality: null,
  expansionEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'MARKET_EXPANSION_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state NOT_READY', empty.report.marketExpansionState === 'NOT_READY', empty.report.marketExpansionState);
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const segmentUnit = analyzeCustomerSegmentExpansion({
  evidence: null,
  productLaunched: false,
  adoptionObserved: false,
});
const verdictUnit = computeMarketExpansionVerdict({
  customerSegment: segmentUnit,
  industry: {
    readOnly: true,
    industryFitSignals: false,
    useCaseDiversity: false,
    industryDependencyRisk: false,
    industryExpansionConfidence: false,
    industryScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  regional: {
    readOnly: true,
    regionalAdoptionSignals: false,
    localizationReadiness: false,
    regionalDependencyRisk: false,
    geographicExpansionConfidence: false,
    regionalScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  channel: {
    readOnly: true,
    acquisitionChannelDiversity: false,
    channelDependencyRisk: false,
    expansionChannelReadiness: false,
    channelScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  productMarketFit: {
    readOnly: true,
    fitStability: false,
    expansionStressRisk: false,
    marketDependencyRisk: false,
    productFlexibility: false,
    productMarketFitScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  expansionRisk: {
    readOnly: true,
    marketRisk: true,
    segmentRisk: true,
    industryRisk: true,
    regionalRisk: true,
    executionRisk: true,
    focusDilutionRisk: true,
    expansionRiskScore: 80,
    riskSignals: [],
  },
  overallExpansionScore: 0,
  productLaunched: false,
  localMarketSuccess: false,
});
assert('B verdict engine executes', verdictUnit.marketExpansionState === 'NOT_READY', verdictUnit.marketExpansionState);

const scores = [
  empty.report.overallExpansionScore,
  empty.report.confidence,
  empty.report.customerSegmentScore,
  empty.report.industryScore,
  empty.report.regionalScore,
  empty.report.channelScore,
  empty.report.productMarketFitScore,
  empty.report.expansionRiskScore,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildMarketExpansionRealityReportMarkdown(empty.report).includes('MARKET_EXPANSION_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_MARKET_EXPANSION_REALITY_HISTORY + 2; i += 1) {
  assessMarketExpansionReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getMarketExpansionRealityHistorySize() <= MAX_MARKET_EXPANSION_REALITY_HISTORY,
  `${getMarketExpansionRealityHistorySize()}/${MAX_MARKET_EXPANSION_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildMarketExpansionRealityHistorySummary().totalAssessments <= MAX_MARKET_EXPANSION_REALITY_HISTORY,
  String(buildMarketExpansionRealityHistorySummary().totalAssessments),
);

resetMarketExpansionRealityAuthorityModuleForTests();
const ctx = getLaunchFixtureContext();
const baseInput = baseLaunchInput(ctx);

const revenueOnly = assessMarketExpansionReality({
  ...baseInput,
  revenueOnlyFixture: true,
});
assert(
  'F revenue alone cannot create MULTI_MARKET_READY',
  stateRank(revenueOnly.report.marketExpansionState) < stateRank('MULTI_MARKET_READY'),
  revenueOnly.report.marketExpansionState,
);

const adoptionOnly = assessMarketExpansionReality({
  ...baseInput,
  adoptionOnlyFixture: true,
});
assert(
  'G adoption alone cannot create MULTI_MARKET_READY',
  stateRank(adoptionOnly.report.marketExpansionState) < stateRank('MULTI_MARKET_READY'),
  adoptionOnly.report.marketExpansionState,
);

const scaleReadinessOnly = assessMarketExpansionReality({
  ...baseInput,
  scaleReadinessOnlyFixture: true,
});
assert(
  'H scale readiness alone cannot create EXPANSION_RESILIENT',
  scaleReadinessOnly.report.marketExpansionState !== 'EXPANSION_RESILIENT',
  scaleReadinessOnly.report.marketExpansionState,
);

const fabricated = assessMarketExpansionReality({
  ...baseInput,
  fabricatedMetricsFixture: true,
  expansionEvidenceFixture: {
    customerSegment: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      crossSegmentAdoptionObserved: true,
      customerDiversityObserved: true,
      segmentConcentrationRiskAssessed: true,
      expansionConfidenceObserved: true,
    },
  },
});
assert(
  'I fabricated market evidence rejected',
  !fabricated.report.segmentExpansionReady && fabricated.report.customerSegmentScore === 0,
  `${fabricated.report.segmentExpansionReady}/${fabricated.report.customerSegmentScore}`,
);
assert(
  'I evidence-only verdict enforced',
  fabricated.report.marketExpansionState === 'NOT_READY' &&
    fabricated.report.keyFindings.some((f) => f.includes('Fabricated') || f.includes('fabricated')),
  fabricated.report.marketExpansionState,
);

resetMarketExpansionRealityAuthorityModuleForTests();
resetAllModules();
const ctxFull = getLaunchFixtureContext();
const full = assessMarketExpansionReality({
  ...baseLaunchInput(ctxFull),
  expansionEvidenceFixture: getObservedExpansionEvidenceFixture(),
  skipHistoryRecording: true,
});

assert('J full fixture executes', full.orchestrationState === 'MARKET_EXPANSION_REALITY_COMPLETE', full.orchestrationState);
assert(
  'J full fixture expansion resilient or multi-market',
  full.report.marketExpansionState === 'EXPANSION_RESILIENT' ||
    full.report.marketExpansionState === 'MULTI_MARKET_READY',
  full.report.marketExpansionState,
);
assert('J full fixture score > 0', full.report.overallExpansionScore > 0, String(full.report.overallExpansionScore));
assert(
  'J full fixture multi-dimension ready',
  full.report.segmentExpansionReady && full.report.regionalExpansionReady && full.report.channelExpansionReady,
  `${full.report.segmentExpansionReady}/${full.report.regionalExpansionReady}/${full.report.channelExpansionReady}`,
);

const authoritySource = readFileSync(
  join(ROOT, 'src/market-expansion-reality-authority/market-expansion-reality-authority.ts'),
  'utf8',
);
assert('K authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('K no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/MARKET_EXPANSION_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Market Expansion Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nMarket expansion state (full fixture): ${full.report.marketExpansionState}`);
  console.log(`Overall expansion score (full fixture): ${full.report.overallExpansionScore}/100`);
  console.log(`Report path: architecture/MARKET_EXPANSION_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${MARKET_EXPANSION_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

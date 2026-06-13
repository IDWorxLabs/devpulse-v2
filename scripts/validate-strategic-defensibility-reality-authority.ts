/**
 * Phase 26.22 — Strategic Defensibility Reality Authority validation.
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
  resetMarketExpansionRealityAuthorityModuleForTests,
  resetMarketExpansionRealityHistoryForTests,
} from '../src/market-expansion-reality-authority/index.js';
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
  STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeNetworkEffects,
  assessStrategicDefensibilityReality,
  buildStrategicDefensibilityRealityHistorySummary,
  buildStrategicDefensibilityRealityReportMarkdown,
  computeStrategicDefensibilityVerdict,
  getStrategicDefensibilityRealityHistorySize,
  resetStrategicDefensibilityRealityAuthorityModuleForTests,
  resetStrategicDefensibilityRealityHistoryForTests,
} from '../src/strategic-defensibility-reality-authority/index.js';
import { MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY } from '../src/strategic-defensibility-reality-authority/strategic-defensibility-registry.js';

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
  return [
    'EASILY_REPLACED',
    'WEAKLY_DEFENSIBLE',
    'MODERATELY_DEFENSIBLE',
    'STRONGLY_DEFENSIBLE',
    'CATEGORY_DEFENSIBLE',
  ].indexOf(state);
}

const REQUIRED = [
  'src/strategic-defensibility-reality-authority/strategic-defensibility-types.ts',
  'src/strategic-defensibility-reality-authority/strategic-defensibility-registry.ts',
  'src/strategic-defensibility-reality-authority/network-effects-analyzer.ts',
  'src/strategic-defensibility-reality-authority/data-advantage-analyzer.ts',
  'src/strategic-defensibility-reality-authority/switching-cost-analyzer.ts',
  'src/strategic-defensibility-reality-authority/brand-trust-analyzer.ts',
  'src/strategic-defensibility-reality-authority/distribution-advantage-analyzer.ts',
  'src/strategic-defensibility-reality-authority/execution-advantage-analyzer.ts',
  'src/strategic-defensibility-reality-authority/defensibility-risk-analyzer.ts',
  'src/strategic-defensibility-reality-authority/strategic-defensibility-verdict-engine.ts',
  'src/strategic-defensibility-reality-authority/strategic-defensibility-reality-authority.ts',
  'src/strategic-defensibility-reality-authority/strategic-defensibility-history.ts',
  'src/strategic-defensibility-reality-authority/strategic-defensibility-report-builder.ts',
  'src/strategic-defensibility-reality-authority/index.ts',
  'architecture/STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT.md',
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
      evidencePaths: ['.expansion-evidence/cross-segment-adoption.json'],
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
      evidencePaths: ['.expansion-evidence/regional-adoption.json'],
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

function getObservedDefensibilityEvidenceFixture() {
  const now = new Date().toISOString();
  return {
    networkEffects: {
      readOnly: true as const,
      evidenceSource: 'usage-reports',
      evidencePaths: ['.defensibility-evidence/network-value.json', '.defensibility-evidence/community-dependency.json'],
      observedAt: now,
      userNetworkValueObserved: true,
      networkReinforcementSignalsObserved: true,
      communityDependencyObserved: true,
      networkEffectStrengthObserved: true,
    },
    dataAdvantage: {
      readOnly: true as const,
      evidenceSource: 'growth-reports',
      evidencePaths: ['.defensibility-evidence/data-flywheel.json'],
      observedAt: now,
      uniqueDataAssetsObserved: true,
      learningAdvantagesObserved: true,
      dataFlywheelSignalsObserved: true,
      dataDependencyObserved: true,
    },
    switchingCost: {
      readOnly: true as const,
      evidenceSource: 'customer-dependency-reports',
      evidencePaths: ['.defensibility-evidence/workflow-dependency.json', '.adoption-evidence/dependency-signals.json'],
      observedAt: now,
      customerLockInSignalsObserved: true,
      migrationDifficultyObserved: true,
      workflowDependencyObserved: true,
      replacementResistanceObserved: true,
    },
    brandTrust: {
      readOnly: true as const,
      evidenceSource: 'customer-feedback',
      evidencePaths: ['.defensibility-evidence/trust-signals.json'],
      observedAt: now,
      customerTrustSignalsObserved: true,
      brandPreferenceEvidenceObserved: true,
      reputationStrengthObserved: true,
      trustDurabilityObserved: true,
    },
    distributionAdvantage: {
      readOnly: true as const,
      evidenceSource: 'growth-reports',
      evidencePaths: ['.defensibility-evidence/distribution-reach.json'],
      observedAt: now,
      customerAcquisitionAdvantagesObserved: true,
      distributionReachObserved: true,
      channelStrengthObserved: true,
      partnerAdvantagesObserved: true,
    },
    executionAdvantage: {
      readOnly: true as const,
      evidenceSource: 'product-evolution-reports',
      evidencePaths: ['.defensibility-evidence/execution-advantage.json'],
      observedAt: now,
      improvementVelocityObserved: true,
      adaptationSpeedObserved: true,
      innovationSignalsObserved: true,
      operationalExcellenceObserved: true,
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
  resetMarketExpansionRealityAuthorityModuleForTests();
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
    runtimeSessionId: 'runtime-session-defensibility',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '9696',
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
    previewSessionId: 'preview-defensibility',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-defensibility',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'defensibility-fixture',
    command: 'npm run validate:strategic-defensibility-reality-authority',
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
      previewSessionId: 'preview-defensibility',
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
    expansionEvidenceFixture: getObservedExpansionEvidenceFixture(),
    skipHistoryRecording: true,
  };
}

resetStrategicDefensibilityRealityAuthorityModuleForTests();
resetStrategicDefensibilityRealityHistoryForTests();
resetMarketExpansionRealityHistoryForTests();
resetScaleReadinessRealityHistoryForTests();
resetProductLifecycleRealityHistoryForTests();
resetProductEvolutionRealityHistoryForTests();
resetRevenueRealityHistoryForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();

const empty = assessStrategicDefensibilityReality({
  rootDir: ROOT,
  marketExpansionReality: null,
  defensibilityEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'STRATEGIC_DEFENSIBILITY_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state EASILY_REPLACED', empty.report.strategicDefensibilityState === 'EASILY_REPLACED', empty.report.strategicDefensibilityState);
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const networkUnit = analyzeNetworkEffects({ evidence: null, productLaunched: false });
const verdictUnit = computeStrategicDefensibilityVerdict({
  networkEffects: networkUnit,
  dataAdvantage: {
    readOnly: true,
    uniqueDataAssets: false,
    learningAdvantages: false,
    dataFlywheelSignals: false,
    dataDependency: false,
    dataAdvantageScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  switchingCost: {
    readOnly: true,
    customerLockInSignals: false,
    migrationDifficulty: false,
    workflowDependency: false,
    replacementResistance: false,
    switchingCostScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  brandTrust: {
    readOnly: true,
    customerTrustSignals: false,
    brandPreferenceEvidence: false,
    reputationStrength: false,
    trustDurability: false,
    brandTrustScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  distributionAdvantage: {
    readOnly: true,
    customerAcquisitionAdvantages: false,
    distributionReach: false,
    channelStrength: false,
    partnerAdvantages: false,
    distributionScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  executionAdvantage: {
    readOnly: true,
    improvementVelocity: false,
    adaptationSpeed: false,
    innovationSignals: false,
    operationalExcellence: false,
    executionAdvantageScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  defensibilityRisk: {
    readOnly: true,
    competitiveThreatRisk: true,
    commoditizationRisk: true,
    displacementRisk: true,
    platformRisk: true,
    marketDependencyRisk: true,
    defensibilityRiskScore: 80,
    riskSignals: [],
  },
  overallDefensibilityScore: 0,
  productLaunched: false,
});
assert('B verdict engine executes', verdictUnit.strategicDefensibilityState === 'EASILY_REPLACED', verdictUnit.strategicDefensibilityState);

const scores = [
  empty.report.overallDefensibilityScore,
  empty.report.confidence,
  empty.report.networkEffectsScore,
  empty.report.dataAdvantageScore,
  empty.report.switchingCostScore,
  empty.report.brandTrustScore,
  empty.report.distributionScore,
  empty.report.executionAdvantageScore,
  empty.report.defensibilityRiskScore,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildStrategicDefensibilityRealityReportMarkdown(empty.report).includes('STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY + 2; i += 1) {
  assessStrategicDefensibilityReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getStrategicDefensibilityRealityHistorySize() <= MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY,
  `${getStrategicDefensibilityRealityHistorySize()}/${MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildStrategicDefensibilityRealityHistorySummary().totalAssessments <= MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY,
  String(buildStrategicDefensibilityRealityHistorySummary().totalAssessments),
);

resetStrategicDefensibilityRealityAuthorityModuleForTests();
const ctx = getLaunchFixtureContext();
const baseInput = baseLaunchInput(ctx);

const revenueOnly = assessStrategicDefensibilityReality({
  ...baseInput,
  revenueOnlyFixture: true,
});
assert(
  'F revenue alone cannot create STRONGLY_DEFENSIBLE',
  stateRank(revenueOnly.report.strategicDefensibilityState) < stateRank('STRONGLY_DEFENSIBLE'),
  revenueOnly.report.strategicDefensibilityState,
);

const adoptionOnly = assessStrategicDefensibilityReality({
  ...baseInput,
  adoptionOnlyFixture: true,
});
assert(
  'G adoption alone cannot create STRONGLY_DEFENSIBLE',
  stateRank(adoptionOnly.report.strategicDefensibilityState) < stateRank('STRONGLY_DEFENSIBLE'),
  adoptionOnly.report.strategicDefensibilityState,
);

const marketExpansionOnly = assessStrategicDefensibilityReality({
  ...baseInput,
  marketExpansionOnlyFixture: true,
});
assert(
  'H market expansion alone cannot create CATEGORY_DEFENSIBLE',
  marketExpansionOnly.report.strategicDefensibilityState !== 'CATEGORY_DEFENSIBLE',
  marketExpansionOnly.report.strategicDefensibilityState,
);

const fabricated = assessStrategicDefensibilityReality({
  ...baseInput,
  fabricatedMetricsFixture: true,
  defensibilityEvidenceFixture: {
    networkEffects: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      userNetworkValueObserved: true,
      networkReinforcementSignalsObserved: true,
      communityDependencyObserved: true,
      networkEffectStrengthObserved: true,
    },
  },
});
assert(
  'I fabricated moat evidence rejected',
  !fabricated.report.networkEffectsObserved && fabricated.report.networkEffectsScore === 0,
  `${fabricated.report.networkEffectsObserved}/${fabricated.report.networkEffectsScore}`,
);
assert(
  'I evidence-only verdict enforced',
  fabricated.report.strategicDefensibilityState === 'EASILY_REPLACED' &&
    fabricated.report.keyFindings.some((f) => f.includes('Fabricated') || f.includes('fabricated')),
  fabricated.report.strategicDefensibilityState,
);

resetStrategicDefensibilityRealityAuthorityModuleForTests();
resetAllModules();
const ctxFull = getLaunchFixtureContext();
const full = assessStrategicDefensibilityReality({
  ...baseLaunchInput(ctxFull),
  defensibilityEvidenceFixture: getObservedDefensibilityEvidenceFixture(),
  skipHistoryRecording: true,
});

assert('J full fixture executes', full.orchestrationState === 'STRATEGIC_DEFENSIBILITY_REALITY_COMPLETE', full.orchestrationState);
assert(
  'J full fixture category or strongly defensible',
  full.report.strategicDefensibilityState === 'CATEGORY_DEFENSIBLE' ||
    full.report.strategicDefensibilityState === 'STRONGLY_DEFENSIBLE',
  full.report.strategicDefensibilityState,
);
assert('J full fixture score > 0', full.report.overallDefensibilityScore > 0, String(full.report.overallDefensibilityScore));
assert(
  'J full fixture moats observed',
  full.report.networkEffectsObserved && full.report.switchingCostObserved && full.report.dataAdvantageObserved,
  `${full.report.networkEffectsObserved}/${full.report.switchingCostObserved}/${full.report.dataAdvantageObserved}`,
);

const authoritySource = readFileSync(
  join(ROOT, 'src/strategic-defensibility-reality-authority/strategic-defensibility-reality-authority.ts'),
  'utf8',
);
assert('K authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('K no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Strategic Defensibility Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nDefensibility state (full fixture): ${full.report.strategicDefensibilityState}`);
  console.log(`Overall defensibility score (full fixture): ${full.report.overallDefensibilityScore}/100`);
  console.log(`Report path: architecture/STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${STRATEGIC_DEFENSIBILITY_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

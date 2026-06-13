/**
 * Phase 26.18 — Product Evolution Reality Authority validation.
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
  PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeFeedbackLearning,
  assessProductEvolutionReality,
  buildProductEvolutionRealityHistorySummary,
  buildProductEvolutionRealityReportMarkdown,
  computeProductEvolutionVerdict,
  getProductEvolutionRealityHistorySize,
  resetProductEvolutionRealityAuthorityModuleForTests,
  resetProductEvolutionRealityHistoryForTests,
} from '../src/product-evolution-reality-authority/index.js';
import { MAX_PRODUCT_EVOLUTION_REALITY_HISTORY } from '../src/product-evolution-reality-authority/product-evolution-reality-registry.js';

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
  'src/product-evolution-reality-authority/product-evolution-reality-types.ts',
  'src/product-evolution-reality-authority/product-evolution-reality-registry.ts',
  'src/product-evolution-reality-authority/feedback-learning-analyzer.ts',
  'src/product-evolution-reality-authority/failure-learning-analyzer.ts',
  'src/product-evolution-reality-authority/usage-learning-analyzer.ts',
  'src/product-evolution-reality-authority/revenue-learning-analyzer.ts',
  'src/product-evolution-reality-authority/improvement-velocity-analyzer.ts',
  'src/product-evolution-reality-authority/evolution-risk-analyzer.ts',
  'src/product-evolution-reality-authority/product-evolution-verdict-engine.ts',
  'src/product-evolution-reality-authority/product-evolution-reality-authority.ts',
  'src/product-evolution-reality-authority/product-evolution-reality-history.ts',
  'src/product-evolution-reality-authority/product-evolution-report-builder.ts',
  'src/product-evolution-reality-authority/index.ts',
  'architecture/PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT.md',
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
      evidencePaths: ['.evolution-evidence/feedback-processed.json', '.evolution-evidence/support-responses.json'],
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
      evidencePaths: ['.evolution-evidence/changelog-q1.json', '.evolution-evidence/release-notes.json'],
      observedAt: now,
      improvementFrequencyObserved: true,
      evidenceToActionSpeedObserved: true,
      issueResolutionSpeedObserved: true,
      adaptationResponsivenessObserved: true,
      improvementsInLastPeriod: 8,
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
  resetAdoptionRealityAuthorityModuleForTests();
  resetRevenueRealityAuthorityModuleForTests();

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
    runtimeSessionId: 'runtime-session-evolution',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '9292',
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
    previewSessionId: 'preview-evolution',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-evolution',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'evolution-fixture',
    command: 'npm run validate:product-evolution-reality-authority',
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

function buildRevenueSnapshot() {
  return {
    readOnly: true as const,
    advisoryOnly: true as const,
    assessmentId: 'fixture-revenue',
    generatedAt: new Date().toISOString(),
    revenueRealityState: 'BUSINESS_ENGINE' as const,
    overallRevenueScore: 95,
    confidence: 90,
    revenueObserved: true,
    payingCustomersObserved: true,
    repeatRevenueObserved: true,
    revenueScore: 90,
    customerValueScore: 90,
    conversionScore: 90,
    revenueStabilityScore: 90,
    businessRiskScore: 10,
    revenue: {
      readOnly: true as const,
      revenueObserved: true,
      transactionEvidence: true,
      recurringRevenue: true,
      revenueGrowth: true,
      revenueAmountCents: 248000,
      recurringRevenueAmountCents: 185000,
      trend: 'UP' as const,
      revenueConfidence: 'HIGH' as const,
      revenueScore: 90,
      missingEvidence: [],
      riskSignals: [],
    },
    customerValue: {
      readOnly: true as const,
      payingCustomers: true,
      payingCustomerCount: 14,
      repeatCustomers: true,
      repeatCustomerCount: 9,
      customerRetention: true,
      customerSatisfaction: true,
      valueExchange: true,
      customerValueScore: 90,
      confidence: 'HIGH' as const,
      missingEvidence: [],
      riskSignals: [],
    },
    conversion: {
      readOnly: true as const,
      conversionEvidence: true,
      freeToPaidSignals: true,
      purchaseCompletion: true,
      customerAcquisitionEfficiency: true,
      conversionRatePercent: 12.5,
      conversionScore: 90,
      confidence: 'HIGH' as const,
      missingEvidence: [],
      riskSignals: [],
    },
    revenueStability: {
      readOnly: true as const,
      recurringRevenueSignals: true,
      revenueConsistency: true,
      revenueConcentrationRisk: false,
      revenuePredictability: true,
      revenueStabilityScore: 90,
      confidence: 'HIGH' as const,
      missingEvidence: [],
      riskSignals: [],
    },
    businessRisk: {
      readOnly: true as const,
      customerChurnRisk: false,
      revenueFragility: false,
      dependencyRisk: false,
      singleCustomerRisk: false,
      revenueSustainabilityRisk: false,
      businessRiskScore: 10,
      riskSignals: [],
    },
    riskSignals: [],
    missingEvidence: [],
    keyFindings: [],
    recommendedActions: [],
    finalVerdict: 'fixture',
    verdict: {
      readOnly: true as const,
      revenueRealityState: 'BUSINESS_ENGINE' as const,
      overallRevenueScore: 95,
      confidence: 90,
      revenueObserved: true,
      payingCustomersObserved: true,
      repeatRevenueObserved: true,
      riskSignals: [],
      missingEvidence: [],
      keyFindings: [],
      recommendedActions: [],
      finalVerdict: 'fixture',
    },
    inputSnapshot: {
      readOnly: true as const,
      adoptionReality: {
        readOnly: true as const,
        advisoryOnly: true as const,
        assessmentId: 'fixture-adoption',
        generatedAt: new Date().toISOString(),
        adoptionRealityState: 'CRITICAL_DEPENDENCY' as const,
        overallAdoptionScore: 95,
        confidence: 90,
        repeatUsageObserved: true,
        behavioralIntegrationObserved: true,
        featureAdoptionObserved: true,
        dependencyObserved: true,
        repeatUsageScore: 90,
        behavioralIntegrationScore: 90,
        featureAdoptionScore: 90,
        dependencyScore: 90,
        adoptionRiskScore: 10,
        repeatUsage: {
          readOnly: true as const,
          repeatUsers: true,
          repeatUserCount: 18,
          repeatSessions: true,
          repeatSessionCount: 94,
          returnFrequency: true,
          longTermUsage: true,
          usageConsistency: true,
          repeatUsageScore: 90,
          confidence: 'HIGH' as const,
          missingEvidence: [],
          riskSignals: [],
        },
        behavioralIntegration: {
          readOnly: true as const,
          workflowIntegration: true,
          habitFormationSignals: true,
          operationalDependence: true,
          routineUsageIndicators: true,
          behavioralIntegrationScore: 90,
          confidence: 'HIGH' as const,
          missingEvidence: [],
          riskSignals: [],
        },
        featureAdoption: {
          readOnly: true as const,
          coreFeatureUsage: true,
          featureStickiness: true,
          featureDepth: 82,
          criticalFeaturePenetration: true,
          featureAdoptionScore: 90,
          confidence: 'HIGH' as const,
          missingEvidence: [],
          riskSignals: [],
        },
        userDependency: {
          readOnly: true as const,
          dependencySignals: true,
          replacementResistance: true,
          switchingCostIndicators: true,
          operationalImportance: true,
          dependencyScore: 90,
          confidence: 'HIGH' as const,
          missingEvidence: [],
          riskSignals: [],
        },
        adoptionRisk: {
          readOnly: true as const,
          dropOffRisk: false,
          retentionRisk: false,
          churnIndicators: false,
          weakAdoptionSignals: false,
          adoptionFragility: false,
          adoptionRiskScore: 10,
          riskSignals: [],
        },
        riskSignals: [],
        missingEvidence: [],
        keyFindings: [],
        recommendedActions: [],
        finalVerdict: 'fixture',
        verdict: {
          readOnly: true as const,
          adoptionRealityState: 'CRITICAL_DEPENDENCY' as const,
          overallAdoptionScore: 95,
          confidence: 90,
          repeatUsageObserved: true,
          behavioralIntegrationObserved: true,
          featureAdoptionObserved: true,
          dependencyObserved: true,
          riskSignals: [],
          missingEvidence: [],
          keyFindings: [],
          recommendedActions: [],
          finalVerdict: 'fixture',
        },
        inputSnapshot: {
          readOnly: true as const,
          postLaunchReality: {
            readOnly: true as const,
            advisoryOnly: true as const,
            assessmentId: 'fixture-pl',
            generatedAt: new Date().toISOString(),
            postLaunchRealityState: 'ESTABLISHED_PRODUCT' as const,
            overallPostLaunchScore: 90,
            confidence: 90,
            activityObserved: true,
            retentionObserved: true,
            businessValueObserved: true,
            trafficScore: 90,
            engagementScore: 90,
            retentionScore: 90,
            reliabilityScore: 90,
            businessOutcomeScore: 90,
            traffic: {
              readOnly: true as const,
              trafficObserved: true,
              sessionsObserved: 142,
              usersObserved: 38,
              trend: 'UP' as const,
              trafficConfidence: 'HIGH' as const,
              trafficScore: 90,
              missingEvidence: [],
              riskSignals: [],
            },
            engagement: {
              readOnly: true as const,
              activeUsage: true,
              featureUsage: true,
              sessionQuality: 78,
              userReturnSignals: true,
              engagementConfidence: 'HIGH' as const,
              engagementScore: 90,
              missingEvidence: [],
              riskSignals: [],
            },
            retention: {
              readOnly: true as const,
              repeatUsers: true,
              repeatUserCount: 12,
              retentionSignals: true,
              userReturnEvidence: true,
              retentionConfidence: 'HIGH' as const,
              retentionScore: 90,
              missingEvidence: [],
              riskSignals: [],
            },
            reliability: {
              readOnly: true as const,
              runtimeErrors: false,
              crashEvidence: false,
              supportEvidence: false,
              operationalStability: true,
              uptimePercent: 99.6,
              reliabilityScore: 90,
              missingEvidence: [],
              riskSignals: [],
            },
            businessOutcome: {
              readOnly: true as const,
              customerValueEvidence: true,
              founderGoalProgress: true,
              monetizationEvidence: false,
              productImpactEvidence: true,
              businessOutcomeSignals: [],
              businessOutcomeScore: 90,
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
              postLaunchRealityState: 'ESTABLISHED_PRODUCT' as const,
              overallPostLaunchScore: 90,
              confidence: 90,
              activityObserved: true,
              retentionObserved: true,
              businessValueObserved: true,
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
              postLaunchEvidence: {
                readOnly: true as const,
                traffic: null,
                engagement: null,
                retention: null,
                errors: null,
                business: null,
              },
              launchObserved: true,
            },
            cacheKey: 'fixture',
          },
          founderLaunchDecision: null,
          adoptionEvidence: {
            readOnly: true as const,
            repeatUsage: null,
            behavioralIntegration: null,
            featureAdoption: null,
            userDependency: null,
          },
          postLaunchActivityObserved: true,
        },
        cacheKey: 'fixture',
      },
      postLaunchReality: null,
      founderLaunchDecision: null,
      revenueEvidence: {
        readOnly: true as const,
        revenue: null,
        customerValue: null,
        conversion: null,
        revenueStability: null,
      },
      adoptionObserved: true,
    },
    cacheKey: 'fixture',
  };
}

resetProductEvolutionRealityAuthorityModuleForTests();
resetProductEvolutionRealityHistoryForTests();
resetRevenueRealityHistoryForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();
resetLiveIdeaToLaunchExecutionRunnerModuleForTests();

const empty = assessProductEvolutionReality({
  rootDir: ROOT,
  revenueReality: null,
  adoptionReality: null,
  postLaunchReality: null,
  founderLaunchDecision: null,
  evolutionEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'PRODUCT_EVOLUTION_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state STATIC_PRODUCT', empty.report.productEvolutionState === 'STATIC_PRODUCT', empty.report.productEvolutionState);
assert('A empty no feedback learning', !empty.report.feedbackLearningObserved, String(empty.report.feedbackLearningObserved));
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const feedbackUnit = analyzeFeedbackLearning({ evidence: null, productLaunched: false });
const verdictUnit = computeProductEvolutionVerdict({
  feedbackLearning: feedbackUnit,
  failureLearning: {
    readOnly: true,
    bugFixLearning: false,
    incidentLearning: false,
    rootCauseLearning: false,
    repeatedFailureReduction: false,
    failureLearningScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  usageLearning: {
    readOnly: true,
    behaviorInformedChanges: false,
    usageDrivenImprovements: false,
    retentionImprovements: false,
    engagementImprovements: false,
    usageLearningScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  revenueLearning: {
    readOnly: true,
    revenueInformedDecisions: false,
    customerValueImprovements: false,
    businessModelAdjustments: false,
    monetizationLearning: false,
    revenueLearningScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  improvementVelocity: {
    readOnly: true,
    improvementFrequency: false,
    evidenceToActionSpeed: false,
    issueResolutionSpeed: false,
    adaptationResponsiveness: false,
    improvementsInLastPeriod: null,
    improvementVelocityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  evolutionRisk: {
    readOnly: true,
    stagnationRisk: true,
    feedbackIgnoringRisk: true,
    innovationRisk: false,
    adaptationRisk: true,
    competitiveDriftRisk: true,
    evolutionRiskScore: 80,
    riskSignals: [],
  },
  overallEvolutionScore: 0,
  productLaunched: false,
});
assert('B verdict engine executes', verdictUnit.productEvolutionState === 'STATIC_PRODUCT', verdictUnit.productEvolutionState);

const scores = [
  empty.report.overallEvolutionScore,
  empty.report.feedbackLearningScore,
  empty.report.failureLearningScore,
  empty.report.usageLearningScore,
  empty.report.revenueLearningScore,
  empty.report.improvementVelocityScore,
  empty.report.evolutionRiskScore,
  empty.report.confidence,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildProductEvolutionRealityReportMarkdown(empty.report).includes('PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_PRODUCT_EVOLUTION_REALITY_HISTORY + 2; i += 1) {
  assessProductEvolutionReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getProductEvolutionRealityHistorySize() <= MAX_PRODUCT_EVOLUTION_REALITY_HISTORY,
  `${getProductEvolutionRealityHistorySize()}/${MAX_PRODUCT_EVOLUTION_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildProductEvolutionRealityHistorySummary().totalAssessments <= MAX_PRODUCT_EVOLUTION_REALITY_HISTORY,
  String(buildProductEvolutionRealityHistorySummary().totalAssessments),
);

const featureOnly = assessProductEvolutionReality({
  rootDir: ROOT,
  revenueReality: buildRevenueSnapshot(),
  featureAdditionsOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'F feature additions alone cannot create evolution',
  featureOnly.report.productEvolutionState === 'STATIC_PRODUCT' && !featureOnly.report.feedbackLearningObserved,
  `${featureOnly.report.productEvolutionState}/${featureOnly.report.feedbackLearningObserved}`,
);

const roadmapOnly = assessProductEvolutionReality({
  rootDir: ROOT,
  revenueReality: buildRevenueSnapshot(),
  roadmapOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'G roadmap updates alone cannot create evolution',
  roadmapOnly.report.productEvolutionState === 'STATIC_PRODUCT' && !roadmapOnly.report.usageLearningObserved,
  roadmapOnly.report.productEvolutionState,
);

const fabricated = assessProductEvolutionReality({
  rootDir: ROOT,
  revenueReality: buildRevenueSnapshot(),
  fabricatedMetricsFixture: true,
  evolutionEvidenceFixture: {
    feedbackLearning: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      userFeedbackProcessedObserved: true,
      featureRequestResponseObserved: true,
      supportSignalResponseObserved: true,
      customerPainResolutionObserved: true,
    },
  },
  skipHistoryRecording: true,
});
assert(
  'H fabricated feedback rejected',
  !fabricated.report.feedbackLearningObserved && fabricated.report.feedbackLearningScore === 0,
  `${fabricated.report.feedbackLearningObserved}/${fabricated.report.feedbackLearningScore}`,
);
assert(
  'H evidence-only verdict enforced',
  fabricated.report.productEvolutionState === 'STATIC_PRODUCT' &&
    fabricated.report.keyFindings.some((f) => f.includes('Fabricated') || f.includes('fabricated')),
  fabricated.report.productEvolutionState,
);

resetProductEvolutionRealityAuthorityModuleForTests();
const ctx = getLaunchFixtureContext();
const full = assessProductEvolutionReality({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: {
    previewSessionId: 'preview-evolution',
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
  revenueEvidenceFixture: getObservedRevenueFixture(),
  evolutionEvidenceFixture: getObservedEvolutionFixture(),
  skipHistoryRecording: true,
});

assert('I full fixture executes', full.orchestrationState === 'PRODUCT_EVOLUTION_REALITY_COMPLETE', full.orchestrationState);
assert('I full fixture feedback learning observed', full.report.feedbackLearningObserved, String(full.report.feedbackLearningObserved));
assert(
  'I full fixture evolution state evolving or higher',
  full.report.productEvolutionState === 'EVOLVING_PRODUCT' ||
    full.report.productEvolutionState === 'ADAPTIVE_PRODUCT' ||
    full.report.productEvolutionState === 'LEARNING_PRODUCT',
  full.report.productEvolutionState,
);
assert('I full fixture score > 0', full.report.overallEvolutionScore > 0, String(full.report.overallEvolutionScore));
assert('I full fixture usage learning observed', full.report.usageLearningObserved, String(full.report.usageLearningObserved));

const authoritySource = readFileSync(
  join(ROOT, 'src/product-evolution-reality-authority/product-evolution-reality-authority.ts'),
  'utf8',
);
assert('J authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('J no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Product Evolution Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nEvolution state (full fixture): ${full.report.productEvolutionState}`);
  console.log(`Overall evolution score (full fixture): ${full.report.overallEvolutionScore}/100`);
  console.log(`Report path: architecture/PRODUCT_EVOLUTION_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${PRODUCT_EVOLUTION_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

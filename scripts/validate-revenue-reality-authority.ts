/**
 * Phase 26.17 — Revenue Reality Authority validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
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
  REVENUE_REALITY_AUTHORITY_PASS_TOKEN,
  analyzeRevenueEvidence,
  assessRevenueReality,
  buildRevenueRealityHistorySummary,
  buildRevenueRealityReportMarkdown,
  computeRevenueVerdict,
  getRevenueRealityHistorySize,
  resetRevenueRealityAuthorityModuleForTests,
  resetRevenueRealityHistoryForTests,
} from '../src/revenue-reality-authority/index.js';
import { MAX_REVENUE_REALITY_HISTORY } from '../src/revenue-reality-authority/revenue-reality-registry.js';

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
  'src/revenue-reality-authority/revenue-reality-types.ts',
  'src/revenue-reality-authority/revenue-reality-registry.ts',
  'src/revenue-reality-authority/revenue-evidence-analyzer.ts',
  'src/revenue-reality-authority/customer-value-analyzer.ts',
  'src/revenue-reality-authority/conversion-analyzer.ts',
  'src/revenue-reality-authority/revenue-stability-analyzer.ts',
  'src/revenue-reality-authority/business-risk-analyzer.ts',
  'src/revenue-reality-authority/revenue-verdict-engine.ts',
  'src/revenue-reality-authority/revenue-reality-authority.ts',
  'src/revenue-reality-authority/revenue-reality-history.ts',
  'src/revenue-reality-authority/revenue-reality-report-builder.ts',
  'src/revenue-reality-authority/index.ts',
  'architecture/REVENUE_REALITY_AUTHORITY_REPORT.md',
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
      evidencePaths: ['.revenue-evidence/transactions.json', '.revenue-evidence/billing-summary.json'],
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
    runtimeSessionId: 'runtime-session-revenue',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '8282',
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
    previewSessionId: 'preview-revenue',
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-revenue',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'revenue-fixture',
    command: 'npm run validate:revenue-reality-authority',
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

function buildAdoptionSnapshot(overrides: { repeatUsageObserved?: boolean; state?: string } = {}) {
  return {
    readOnly: true as const,
    advisoryOnly: true as const,
    assessmentId: 'fixture-adoption',
    generatedAt: new Date().toISOString(),
    adoptionRealityState: (overrides.state ?? 'CRITICAL_DEPENDENCY') as 'CRITICAL_DEPENDENCY',
    overallAdoptionScore: 95,
    confidence: 90,
    repeatUsageObserved: overrides.repeatUsageObserved ?? true,
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
      postLaunchReality: null,
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
  };
}

resetRevenueRealityAuthorityModuleForTests();
resetRevenueRealityHistoryForTests();
resetAdoptionRealityHistoryForTests();
resetPostLaunchRealityHistoryForTests();
resetFounderLaunchDecisionHistoryForTests();
resetLiveIdeaToLaunchExecutionRunnerModuleForTests();

const empty = assessRevenueReality({
  rootDir: ROOT,
  adoptionReality: null,
  postLaunchReality: null,
  founderLaunchDecision: null,
  revenueEvidence: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'REVENUE_REALITY_COMPLETE', empty.orchestrationState);
assert('A empty state NO_REVENUE', empty.report.revenueRealityState === 'NO_REVENUE', empty.report.revenueRealityState);
assert('A empty no revenue', !empty.report.revenueObserved, String(empty.report.revenueObserved));
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const revenueUnit = analyzeRevenueEvidence({ evidence: null, adoptionObserved: false });
const verdictUnit = computeRevenueVerdict({
  revenue: revenueUnit,
  customerValue: {
    readOnly: true,
    payingCustomers: false,
    payingCustomerCount: null,
    repeatCustomers: false,
    repeatCustomerCount: null,
    customerRetention: false,
    customerSatisfaction: false,
    valueExchange: false,
    customerValueScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  conversion: {
    readOnly: true,
    conversionEvidence: false,
    freeToPaidSignals: false,
    purchaseCompletion: false,
    customerAcquisitionEfficiency: false,
    conversionRatePercent: null,
    conversionScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  revenueStability: {
    readOnly: true,
    recurringRevenueSignals: false,
    revenueConsistency: false,
    revenueConcentrationRisk: false,
    revenuePredictability: false,
    revenueStabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence: [],
    riskSignals: [],
  },
  businessRisk: {
    readOnly: true,
    customerChurnRisk: true,
    revenueFragility: true,
    dependencyRisk: false,
    singleCustomerRisk: false,
    revenueSustainabilityRisk: true,
    businessRiskScore: 80,
    riskSignals: [],
  },
  overallRevenueScore: 0,
  adoptionObserved: false,
});
assert('B verdict engine executes', verdictUnit.revenueRealityState === 'NO_REVENUE', verdictUnit.revenueRealityState);

const scores = [
  empty.report.overallRevenueScore,
  empty.report.revenueScore,
  empty.report.customerValueScore,
  empty.report.conversionScore,
  empty.report.revenueStabilityScore,
  empty.report.businessRiskScore,
  empty.report.confidence,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildRevenueRealityReportMarkdown(empty.report).includes('REVENUE_REALITY_AUTHORITY_REPORT'),
  'yes',
);

for (let i = 0; i < MAX_REVENUE_REALITY_HISTORY + 2; i += 1) {
  assessRevenueReality({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getRevenueRealityHistorySize() <= MAX_REVENUE_REALITY_HISTORY,
  `${getRevenueRealityHistorySize()}/${MAX_REVENUE_REALITY_HISTORY}`,
);
assert(
  'E history summary',
  buildRevenueRealityHistorySummary().totalAssessments <= MAX_REVENUE_REALITY_HISTORY,
  String(buildRevenueRealityHistorySummary().totalAssessments),
);

const usersOnly = assessRevenueReality({
  rootDir: ROOT,
  adoptionReality: buildAdoptionSnapshot(),
  usersOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'F users alone cannot create revenue',
  usersOnly.report.revenueRealityState === 'NO_REVENUE' && !usersOnly.report.revenueObserved,
  `${usersOnly.report.revenueRealityState}/${usersOnly.report.revenueObserved}`,
);

const adoptionOnly = assessRevenueReality({
  rootDir: ROOT,
  adoptionReality: buildAdoptionSnapshot(),
  adoptionOnlyFixture: true,
  skipHistoryRecording: true,
});
assert(
  'G adoption alone cannot create revenue',
  adoptionOnly.report.revenueRealityState === 'NO_REVENUE' && !adoptionOnly.report.revenueObserved,
  adoptionOnly.report.revenueRealityState,
);

const fabricated = assessRevenueReality({
  rootDir: ROOT,
  adoptionReality: buildAdoptionSnapshot(),
  fabricatedMetricsFixture: true,
  revenueEvidenceFixture: {
    revenue: {
      readOnly: true,
      evidenceSource: 'SYNTHETIC',
      evidencePaths: [],
      revenueObserved: true,
      transactionEvidenceObserved: true,
      recurringRevenueObserved: true,
      revenueAmountCents: 99999999,
      recurringRevenueAmountCents: 88888888,
      revenueGrowthObserved: true,
      trend: 'UP',
    },
  },
  skipHistoryRecording: true,
});
assert(
  'H fabricated transactions rejected',
  !fabricated.report.revenueObserved && fabricated.report.revenueScore === 0,
  `${fabricated.report.revenueObserved}/${fabricated.report.revenueScore}`,
);
assert(
  'H evidence-only verdict enforced',
  fabricated.report.revenueRealityState === 'NO_REVENUE' &&
    fabricated.report.keyFindings.some((f) => f.includes('Fabricated') || f.includes('fabricated')),
  fabricated.report.revenueRealityState,
);

resetRevenueRealityAuthorityModuleForTests();
const ctx = getLaunchFixtureContext();
const full = assessRevenueReality({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: {
    previewSessionId: 'preview-revenue',
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
  skipHistoryRecording: true,
});

assert('I full fixture executes', full.orchestrationState === 'REVENUE_REALITY_COMPLETE', full.orchestrationState);
assert('I full fixture revenue observed', full.report.revenueObserved, String(full.report.revenueObserved));
assert('I full fixture paying customers observed', full.report.payingCustomersObserved, String(full.report.payingCustomersObserved));
assert(
  'I full fixture revenue state sustainable or higher',
  full.report.revenueRealityState === 'SUSTAINABLE_REVENUE' ||
    full.report.revenueRealityState === 'BUSINESS_ENGINE' ||
    full.report.revenueRealityState === 'REPEAT_REVENUE',
  full.report.revenueRealityState,
);
assert('I full fixture score > 0', full.report.overallRevenueScore > 0, String(full.report.overallRevenueScore));
assert('I full fixture repeat revenue observed', full.report.repeatRevenueObserved, String(full.report.repeatRevenueObserved));

const authoritySource = readFileSync(
  join(ROOT, 'src/revenue-reality-authority/revenue-reality-authority.ts'),
  'utf8',
);
assert('J authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('J no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/REVENUE_REALITY_AUTHORITY_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(REVENUE_REALITY_AUTHORITY_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Revenue Reality Authority Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nRevenue state (full fixture): ${full.report.revenueRealityState}`);
  console.log(`Overall revenue score (full fixture): ${full.report.overallRevenueScore}/100`);
  console.log(`Report path: architecture/REVENUE_REALITY_AUTHORITY_REPORT.md`);
  console.log(`\n${REVENUE_REALITY_AUTHORITY_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);

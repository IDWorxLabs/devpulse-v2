/**
 * Launch Council — Founder Testing authority mapping (passive observer).
 */

import type {
  FounderTestV4ReportCore,
  FounderTestV4ReportForLaunchCouncil,
  FounderTestV4ReportWithUiReviewer,
  FounderTestV4ReportWithClarifyingQuestion,
  FounderTestV4ReportWithAdaptiveAutofix,
  FounderTestV4ReportWithCompetitiveReality,
  FounderTestV4ReportWithRealityProof,
  FounderTestV4ReportWithRealUserReality,
  FounderTestV4ReportWithAdoptionPrediction,
} from '../founder-testing-mode/founder-testing-v4-types.js';
import { getClarifyingLiveGateMetrics } from '../clarifying-question-intelligence/clarifying-question-live-gate.js';
import { mapUniversalAppBlueprintVisualLaunchCouncilAuthority } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-integration.js';
import { mapFeatureRealityLaunchCouncilAuthority } from '../feature-reality-validation/feature-reality-validation-integration.js';
import { mapUniversalFeatureContractLaunchCouncilAuthority } from '../universal-feature-contract-intelligence/universal-feature-contract-integration.js';
import { mapEngineeringRealityLaunchCouncilAuthority } from '../engineering-reality-authority/engineering-reality-integration.js';
import { mapAutonomousFounderLaunchCouncilAuthority } from '../autonomous-founder-launch-authority/autonomous-founder-launch-integration.js';
import { mapAutonomousFounderLaunchCouncilAuthority } from '../autonomous-founder-launch-authority/autonomous-founder-launch-integration.js';
import { listLaunchCouncilAuthorities } from './launch-council-registry.js';
import type {
  LaunchCouncilAssessment,
  LaunchCouncilAuthorityResult,
  LaunchCouncilAuthorityStatus,
  LaunchCouncilReport,
} from './launch-council-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function mapFounderTestingAuthority(report: FounderTestV4ReportCore): LaunchCouncilAuthorityResult {
  const score = report.launchReadinessReality.launchReadinessRealityScore;
  const launchBlocker =
    report.issues.some((issue) => issue.severity === 'BLOCKER') ||
    report.verdict === 'FOUNDATION_ONLY' ||
    report.verdict === 'EXECUTION_GAPS_PRESENT' ||
    (report.verificationResultsVisibility.state !== 'NO_VERIFICATION_RUN' &&
      !report.verificationResultsVisibility.launchReady);

  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  if (report.durationMs > 0) {
    status = launchBlocker ? 'FAIL' : score >= 75 ? 'PASS' : score >= 55 ? 'WARNING' : 'FAIL';
  }

  const findings = [
    `Founder Testing verdict: ${report.verdict}`,
    `Launch readiness reality score: ${score}/100`,
    report.topLaunchRisks.length > 0 ? `Top launch risks: ${report.topLaunchRisks.slice(0, 2).join('; ')}` : '',
  ].filter(Boolean);

  const recommendations = report.recommendedFixOrder.slice(0, 3);

  return {
    authorityId: 'founder-testing',
    authorityName: 'Founder Testing',
    authorityCategory: 'FOUNDER_TESTING',
    score,
    confidence: clamp(score),
    status,
    launchBlocker,
    findings,
    recommendations,
  };
}

function mapChatIntelligenceAuthority(report: FounderTestV4ReportCore): LaunchCouncilAuthorityResult {
  const chat = report.chatIntelligenceReality;
  const score = chat.chatIntelligenceScore;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  if (chat.scenariosRun > 0) {
    if (chat.blocksLaunchReadiness) status = 'FAIL';
    else if (chat.chatLaunchVerdict === 'OPERATIONAL_OK') status = 'PASS';
    else if (chat.chatLaunchVerdict === 'NEEDS_IMPROVEMENT') status = 'WARNING';
    else status = 'FAIL';
  }

  return {
    authorityId: 'chat-intelligence-reality',
    authorityName: 'Chat Intelligence Reality',
    authorityCategory: 'CHAT_INTELLIGENCE',
    score,
    confidence: clamp(score),
    status,
    launchBlocker: chat.blocksLaunchReadiness,
    findings: chat.failedScenarios.map((scenario) => `[${scenario.prompt}] ${scenario.whyFailed[0] ?? 'Not grounded'}`),
    recommendations: chat.requiredFixesBeforeLaunch.slice(0, 4),
  };
}

function mapRepositoryTypecheckAuthority(report: FounderTestV4ReportCore): LaunchCouncilAuthorityResult {
  const typecheck = report.repositoryTypecheckReality;
  const score = report.repositoryTypecheckRealityScore.score;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (typecheck.readinessState) {
    case 'TYPECHECK_CLEAN':
      status = 'PASS';
      break;
    case 'TYPECHECK_WARNINGS':
      status = 'WARNING';
      break;
    case 'TYPECHECK_FAILED':
      status = 'FAIL';
      break;
    default:
      status = 'NOT_RUN';
      break;
  }

  return {
    authorityId: 'repository-typecheck-reality',
    authorityName: 'Repository Typecheck Reality',
    authorityCategory: 'REPOSITORY_INTEGRITY',
    score,
    confidence: clamp(score),
    status,
    launchBlocker: typecheck.blocksLaunchReadiness,
    findings: typecheck.findings.map(
      (finding) => `${finding.file}:${finding.line} [${finding.code}] ${finding.message}`,
    ),
    recommendations: typecheck.recommendations.slice(0, 4),
  };
}

function mapSkepticalFounderAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const skeptical = report.skepticalFounderSimulator;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (skeptical.readinessState) {
    case 'TRUSTED':
      status = 'PASS';
      break;
    case 'CAUTION':
      status = 'WARNING';
      break;
    case 'HIGH_RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'skeptical-founder-simulator',
    authorityName: 'Skeptical Founder Simulator',
    authorityCategory: 'SKEPTICAL_FOUNDER',
    score: skeptical.skepticalFounderScore,
    confidence: clamp(Math.max(0, 100 - skeptical.launchRiskScore)),
    status,
    launchBlocker: skeptical.blocksLaunchReadiness,
    findings: skeptical.objections.slice(0, 6),
    recommendations: skeptical.recommendations.slice(0, 4),
  };
}

function mapPromiseFulfillmentAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const fulfillment = report.promiseFulfillment;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (fulfillment.readinessState) {
    case 'FULFILLED':
      status = 'PASS';
      break;
    case 'PARTIAL':
      status = 'WARNING';
      break;
    case 'RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  const contradicted = fulfillment.promiseAssessments
    .filter((assessment) => assessment.status === 'CONTRADICTED')
    .map((assessment) => assessment.promise);

  return {
    authorityId: 'promise-fulfillment-authority',
    authorityName: 'Promise Fulfillment Authority',
    authorityCategory: 'PROMISE_FULFILLMENT',
    score: fulfillment.fulfillmentScore,
    confidence: clamp(Math.max(0, 100 - fulfillment.contradictedCount * 12 - fulfillment.unprovenCount * 4)),
    status,
    launchBlocker: fulfillment.blocksLaunchReadiness,
    findings: [
      `Fulfillment score: ${fulfillment.fulfillmentScore}/100`,
      `Fulfilled: ${fulfillment.fulfilledCount} | Partial: ${fulfillment.partiallyFulfilledCount} | Unproven: ${fulfillment.unprovenCount} | Contradicted: ${fulfillment.contradictedCount}`,
      ...contradicted.slice(0, 4).map((promise) => `Contradicted promise: ${promise}`),
    ],
    recommendations: fulfillment.recommendations.slice(0, 4),
  };
}

function mapTrustAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const trust = report.trustAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (trust.readinessState) {
    case 'TRUSTED':
      status = 'PASS';
      break;
    case 'CAUTION':
      status = 'WARNING';
      break;
    case 'HIGH_RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'trust-authority',
    authorityName: 'Trust Authority',
    authorityCategory: 'TRUST_AUTHORITY',
    score: trust.trustScore,
    confidence: clamp(Math.max(0, 100 - trust.trustRiskScore)),
    status,
    launchBlocker: trust.blocksLaunchReadiness,
    findings: [
      `Trust score: ${trust.trustScore}/100`,
      `Trust risk score: ${trust.trustRiskScore}/100`,
      `Critical trust failures: ${trust.criticalTrustFailures}`,
      ...trust.criticalTrustFailureDetails.slice(0, 4),
    ],
    recommendations: trust.recommendations.slice(0, 4),
  };
}

function mapSelfAwarenessAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const awareness = report.selfAwarenessAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (awareness.readinessState) {
    case 'SELF_AWARE':
      status = 'PASS';
      break;
    case 'PARTIALLY_AWARE':
      status = 'WARNING';
      break;
    case 'LIMITED_AWARENESS':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'self-awareness-authority',
    authorityName: 'Self-Awareness Authority',
    authorityCategory: 'SELF_AWARENESS',
    score: awareness.selfAwarenessScore,
    confidence: clamp(Math.max(0, 100 - awareness.selfAwarenessRiskScore)),
    status,
    launchBlocker: awareness.blocksLaunchReadiness,
    findings: [
      `Self-awareness score: ${awareness.selfAwarenessScore}/100`,
      `Self-awareness risk score: ${awareness.selfAwarenessRiskScore}/100`,
      `Critical awareness failures: ${awareness.criticalAwarenessFailures}`,
      ...awareness.criticalAwarenessFailureDetails.slice(0, 4),
    ],
    recommendations: awareness.recommendations.slice(0, 4),
  };
}

function mapUserSuccessAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const success = report.userSuccessAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (success.readinessState) {
    case 'USERS_SUCCEED':
      status = 'PASS';
      break;
    case 'PARTIAL_SUCCESS':
      status = 'WARNING';
      break;
    case 'HIGH_FAILURE_RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'user-success-authority',
    authorityName: 'User Success Authority',
    authorityCategory: 'USER_SUCCESS',
    score: success.userSuccessScore,
    confidence: clamp(Math.max(0, success.outcomeAchievementScore)),
    status,
    launchBlocker: success.blocksLaunchReadiness,
    findings: [
      `User success score: ${success.userSuccessScore}/100`,
      `Outcome achievement score: ${success.outcomeAchievementScore}/100`,
      `Critical success failures: ${success.criticalSuccessFailures}`,
      ...success.criticalSuccessFailureDetails.slice(0, 4),
    ],
    recommendations: success.recommendations.slice(0, 4),
  };
}

function mapGapDetectionAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const gaps = report.gapDetectionAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (gaps.readinessState) {
    case 'NO_CRITICAL_GAPS':
      status = 'PASS';
      break;
    case 'GAPS_PRESENT':
      status = 'WARNING';
      break;
    case 'HIGH_RISK_GAPS':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  const criticalTitles = gaps.detectedGaps
    .filter((gap) => gap.severity === 'CRITICAL')
    .map((gap) => gap.title);

  return {
    authorityId: 'gap-detection-authority',
    authorityName: 'Gap Detection Authority',
    authorityCategory: 'GAP_DETECTION',
    score: gaps.gapDetectionScore,
    confidence: clamp(Math.max(0, 100 - gaps.criticalGapCount * 15 - gaps.highGapCount * 5)),
    status,
    launchBlocker: gaps.blocksLaunchReadiness,
    findings: [
      `Gap detection score: ${gaps.gapDetectionScore}/100`,
      `Critical gaps: ${gaps.criticalGapCount} | High gaps: ${gaps.highGapCount}`,
      ...criticalTitles.slice(0, 4).map((title) => `Critical gap: ${title}`),
    ],
    recommendations: gaps.recommendations.slice(0, 4),
  };
}

function mapSelfEvolutionAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const evolution = report.selfEvolutionAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (evolution.readinessState) {
    case 'STABLE':
      status = 'PASS';
      break;
    case 'MONITORING':
      status = 'WARNING';
      break;
    case 'EVOLUTION_REQUIRED':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'self-evolution-authority',
    authorityName: 'Self-Evolution Authority',
    authorityCategory: 'SELF_EVOLUTION',
    score: evolution.selfEvolutionScore,
    confidence: clamp(Math.max(0, 100 - evolution.blockedEvolutionCount * 20 - evolution.evolutionRequiredCount * 8)),
    status,
    launchBlocker: evolution.blocksLaunchReadiness,
    findings: [
      `Self-evolution score: ${evolution.selfEvolutionScore}/100`,
      `Repeated failures: ${evolution.repeatedFailureCount} | Required evolutions: ${evolution.evolutionRequiredCount}`,
      `Blocked evolutions: ${evolution.blockedEvolutionCount}`,
      ...evolution.requiredEvolutions.slice(0, 3).map((item) => `Required evolution: ${item}`),
    ],
    recommendations: evolution.recommendations.slice(0, 4),
  };
}

function mapUnknownDiscoveryAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const discovery = report.unknownDiscoveryAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (discovery.readinessState) {
    case 'LOW_UNKNOWN_RISK':
      status = 'PASS';
      break;
    case 'MODERATE_UNKNOWN_RISK':
      status = 'WARNING';
      break;
    case 'HIGH_UNKNOWN_RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'unknown-discovery-authority',
    authorityName: 'Unknown Discovery Authority',
    authorityCategory: 'UNKNOWN_DISCOVERY',
    score: discovery.unknownDiscoveryScore,
    confidence: clamp(Math.max(0, 100 - discovery.criticalFindingCount * 18 - discovery.highFindingCount * 6)),
    status,
    launchBlocker: discovery.blocksLaunchReadiness,
    findings: [
      `Unknown discovery score: ${discovery.unknownDiscoveryScore}/100`,
      `Findings: ${discovery.findingCount} | Critical: ${discovery.criticalFindingCount} | High: ${discovery.highFindingCount}`,
      ...discovery.recommendedTests.slice(0, 3).map((item) => `Recommended test: ${item}`),
    ],
    recommendations: discovery.recommendations.slice(0, 4),
  };
}

function mapFirstTimeUserRealityAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const ftu = report.firstTimeUserRealityAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (ftu.readinessState) {
    case 'CLEAR_AND_USABLE':
      status = 'PASS';
      break;
    case 'MINOR_CONFUSION':
      status = 'WARNING';
      break;
    case 'HIGH_CONFUSION':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'first-time-user-reality-authority',
    authorityName: 'First-Time User Reality Authority',
    authorityCategory: 'FIRST_TIME_USER_REALITY',
    score: ftu.firstTimeUserScore,
    confidence: clamp(Math.max(0, 100 - ftu.confusionScore * 0.6 - ftu.criticalConfusionCount * 15)),
    status,
    launchBlocker: ftu.blocksLaunchReadiness,
    findings: [
      `First-time user score: ${ftu.firstTimeUserScore}/100`,
      `Confusion score: ${ftu.confusionScore}/100`,
      `Critical confusion: ${ftu.criticalConfusionCount} | User blockers: ${ftu.blockerCount}`,
      ...ftu.confusionPoints.slice(0, 3).map((point) => `Confusion: ${point}`),
    ],
    recommendations: ftu.recommendations.slice(0, 4),
  };
}

function mapCustomerValueAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const value = report.customerValueAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (value.readinessState) {
    case 'HIGH_VALUE':
      status = 'PASS';
      break;
    case 'MODERATE_VALUE':
      status = 'WARNING';
      break;
    case 'LOW_VALUE':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'customer-value-authority',
    authorityName: 'Customer Value Authority',
    authorityCategory: 'CUSTOMER_VALUE',
    score: value.customerValueScore,
    confidence: clamp(Math.max(0, 100 - value.valueRiskScore * 0.7 - value.criticalValueFailures * 15)),
    status,
    launchBlocker: value.blocksLaunchReadiness,
    findings: [
      `Customer value score: ${value.customerValueScore}/100`,
      `Retention value score: ${value.retentionValueScore}/100`,
      `Value risk score: ${value.valueRiskScore}/100`,
      `Critical value failures: ${value.criticalValueFailures}`,
      ...value.valueRisks.slice(0, 3).map((risk) => `Value risk: ${risk}`),
    ],
    recommendations: value.recommendations.slice(0, 4),
  };
}

function mapCompetitiveRealityAuthority(report: FounderTestV4ReportWithCompetitiveReality): LaunchCouncilAuthorityResult {
  const competitive = report.competitiveRealityAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (competitive.readinessState) {
    case 'STRONGLY_DIFFERENTIATED':
      status = 'PASS';
      break;
    case 'DIFFERENTIATED':
      status = 'WARNING';
      break;
    case 'WEAKLY_DIFFERENTIATED':
      status = 'WARNING';
      break;
    case 'COMMODITIZED':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'competitive-reality-authority',
    authorityName: 'Competitive Reality Authority',
    authorityCategory: 'COMPETITIVE_REALITY',
    score: competitive.competitiveRealityScore,
    confidence: clamp(
      Math.max(
        0,
        competitive.differentiationScore * 0.55 +
          (100 - competitive.competitiveRiskScore) * 0.35 +
          Math.min(competitive.uniqueAdvantageCount, 8) * 2.5,
      ),
    ),
    status,
    launchBlocker: competitive.blocksLaunchReadiness,
    findings: [
      `Competitive reality score: ${competitive.competitiveRealityScore}/100`,
      `Differentiation score: ${competitive.differentiationScore}/100`,
      `Competitive risk score: ${competitive.competitiveRiskScore}/100`,
      `Unique advantages: ${competitive.uniqueAdvantageCount}`,
      ...competitive.competitiveRisks.slice(0, 3).map((risk) => `Competitive risk: ${risk}`),
    ],
    recommendations: competitive.recommendations.slice(0, 4),
  };
}

function mapRealityProofAuthority(report: FounderTestV4ReportWithRealityProof): LaunchCouncilAuthorityResult {
  const proof = report.realityProofAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (proof.readinessState) {
    case 'REALITY_PROVEN':
    case 'MOSTLY_PROVEN':
      status = 'PASS';
      break;
    case 'PARTIALLY_PROVEN':
      status = 'WARNING';
      break;
    case 'ASSUMPTION_HEAVY':
      status = 'WARNING';
      break;
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }
  if (proof.blocksLaunchReadiness) {
    status = 'FAIL';
  }

  return {
    authorityId: 'reality-proof-authority',
    authorityName: 'Reality-Proof Authority',
    authorityCategory: 'REALITY_PROOF',
    score: proof.realityProofScore,
    confidence: clamp(Math.max(0, proof.realityProofScore - proof.realityRiskScore * 0.4)),
    status,
    launchBlocker: proof.blocksLaunchReadiness,
    findings: [
      `Reality proof score: ${proof.realityProofScore}/100`,
      `Reality risk score: ${proof.realityRiskScore}/100`,
      `Proven reality: ${proof.provenRealityCount} | Assumed reality: ${proof.assumedRealityCount}`,
      `Unknown reality: ${proof.unknownRealityCount}`,
      ...proof.findings
        .filter((finding) => finding.evidenceLevel === 'ASSUMED_REALITY' || finding.evidenceLevel === 'UNKNOWN_REALITY')
        .slice(0, 2)
        .map((finding) => `Assumption risk: ${finding.finding}`),
    ],
    recommendations: proof.recommendations.slice(0, 4),
  };
}

function mapRealUserRealityAuthority(report: FounderTestV4ReportWithRealUserReality): LaunchCouncilAuthorityResult {
  const realUser = report.realUserRealityAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (realUser.readinessState) {
    case 'USERS_PROVE_SUCCESS':
    case 'USERS_MOSTLY_SUCCEED':
      status = 'PASS';
      break;
    case 'MIXED_RESULTS':
    case 'NO_REAL_USER_EVIDENCE':
      status = 'WARNING';
      break;
    case 'HIGH_USER_RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }
  if (realUser.blocksLaunchReadiness) {
    status = 'FAIL';
  }

  return {
    authorityId: 'real-user-reality-authority',
    authorityName: 'Real User Reality Authority',
    authorityCategory: 'REAL_USER_REALITY',
    score: realUser.realUserRealityScore,
    confidence: clamp(Math.max(0, realUser.userEvidenceScore - realUser.userConfusionScore * 0.3)),
    status,
    launchBlocker: realUser.blocksLaunchReadiness,
    findings: [
      `Real user reality score: ${realUser.realUserRealityScore}/100`,
      `User evidence score: ${realUser.userEvidenceScore}/100`,
      `Real user evidence count: ${realUser.realUserEvidenceCount}`,
      `Founder evidence count: ${realUser.founderOnlyEvidenceCount}`,
      realUser.noRealUserEvidence ? 'NO_REAL_USER_EVIDENCE' : 'Real-user evidence present',
      ...realUser.findings.slice(0, 2),
    ],
    recommendations: realUser.recommendations.slice(0, 4),
  };
}

function mapAdoptionPredictionAuthority(report: FounderTestV4ReportWithAdoptionPrediction): LaunchCouncilAuthorityResult {
  const adoption = report.adoptionPredictionAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (adoption.readinessState) {
    case 'HIGH_ADOPTION_PROBABILITY':
      status = 'PASS';
      break;
    case 'MODERATE_ADOPTION_PROBABILITY':
      status = 'WARNING';
      break;
    case 'UNCERTAIN_ADOPTION':
      status = 'WARNING';
      break;
    case 'HIGH_ABANDONMENT_RISK':
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }
  if (adoption.blocksLaunchReadiness) {
    status = 'FAIL';
  }

  return {
    authorityId: 'adoption-prediction-authority',
    authorityName: 'Adoption Prediction Authority',
    authorityCategory: 'ADOPTION_PREDICTION',
    score: adoption.adoptionPredictionScore,
    confidence: adoption.evidenceConfidenceScore,
    status,
    launchBlocker: adoption.blocksLaunchReadiness,
    findings: [
      `Adoption prediction score: ${adoption.adoptionPredictionScore}/100`,
      `Retention prediction score: ${adoption.retentionPredictionScore}/100`,
      `Recommendation prediction score: ${adoption.recommendationPredictionScore}/100`,
      `Abandonment risk score: ${adoption.abandonmentRiskScore}/100`,
      `Evidence confidence score: ${adoption.evidenceConfidenceScore}/100`,
      ...adoption.findings.slice(0, 2),
    ],
    recommendations: adoption.recommendations.slice(0, 4),
  };
}

function mapClarifyingQuestionIntelligence(
  report: FounderTestV4ReportWithClarifyingQuestion,
): LaunchCouncilAuthorityResult {
  const clarifying = report.clarifyingQuestionIntelligence;
  const liveMetrics = getClarifyingLiveGateMetrics();
  const liveGateActive = liveMetrics.gateEvaluations > 0;
  const adjustedScore = Math.max(
    0,
    Math.min(
      100,
      clarifying.requirementCompletenessScore + (liveGateActive ? 4 : 0) + (liveMetrics.assumptionPreventedCount > 0 ? 2 : 0),
    ),
  );
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (clarifying.readinessState) {
    case 'FULLY_UNDERSTOOD':
    case 'MOSTLY_UNDERSTOOD':
      status = 'PASS';
      break;
    case 'CLARIFICATION_REQUIRED':
      status = 'WARNING';
      break;
    case 'CRITICAL_INFORMATION_MISSING':
    case 'CANNOT_PROCEED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'clarifying-question-intelligence',
    authorityName: 'Clarifying Question Intelligence',
    authorityCategory: 'CLARIFYING_QUESTION_INTELLIGENCE',
    score: adjustedScore,
    confidence: clarifying.confidenceToProceed,
    status,
    launchBlocker: clarifying.readinessState === 'CRITICAL_INFORMATION_MISSING' || clarifying.readinessState === 'CANNOT_PROCEED',
    findings: [
      `Requirement completeness: ${clarifying.requirementCompletenessScore}/100`,
      `Live gate score adjustment: ${adjustedScore}/100`,
      `Confidence to proceed: ${clarifying.confidenceToProceed}/100`,
      `Missing requirements: ${clarifying.missingRequirementCount} | Critical missing: ${clarifying.criticalMissingRequirementCount}`,
      `Clarification required: ${clarifying.clarificationRequired ? 'Yes' : 'No'}`,
      `Live gate evaluations: ${liveMetrics.gateEvaluations}`,
      `Assumption prevention events: ${liveMetrics.assumptionPreventedCount}`,
      ...clarifying.assumptionsPrevented.slice(0, 2).map((item) => `Assumption prevented: ${item}`),
    ],
    recommendations: clarifying.recommendedQuestions.slice(0, 4).map((item) => item.question),
  };
}

function mapAdaptiveAutofixIntelligence(
  report: FounderTestV4ReportWithAdaptiveAutofix,
): LaunchCouncilAuthorityResult {
  const adaptive = report.adaptiveAutofixIntelligence;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (adaptive.autofixReadiness) {
    case 'AUTOFIX_READY':
      status = 'PASS';
      break;
    case 'LIMITED_AUTOFIX':
      status = 'WARNING';
      break;
    case 'EVOLUTION_REQUIRED':
      status = 'WARNING';
      break;
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'adaptive-autofix-intelligence',
    authorityName: 'Adaptive AutoFix Intelligence',
    authorityCategory: 'ADAPTIVE_AUTOFIX_INTELLIGENCE',
    score: adaptive.adaptiveAutoFixScore,
    confidence: clamp(Math.max(0, 100 - adaptive.capabilityGapCount * 8)),
    status,
    launchBlocker: adaptive.blocksLaunchReadiness,
    findings: [
      `Adaptive autofix score: ${adaptive.adaptiveAutoFixScore}/100`,
      `Repeated failures: ${adaptive.repeatedFailureCount}`,
      `Capability gaps: ${adaptive.capabilityGapCount}`,
      `Evolution required: ${adaptive.evolutionRequiredCount}`,
      `Estimated failure reduction: ${adaptive.estimatedFailureReduction}%`,
      `Adaptive trigger: ${adaptive.triggeredAdaptiveAutofix ? 'ADAPTIVE_AUTOFIX_REQUIRED' : 'Not triggered'}`,
      ...adaptive.missingCapabilities.slice(0, 2).map((item) => `Missing capability: ${item}`),
    ],
    recommendations: adaptive.recommendations.slice(0, 4).map((item) => item.missingCapability),
  };
}

function mapUiReviewerAuthority(report: FounderTestV4ReportWithClarifyingQuestion): LaunchCouncilAuthorityResult {
  const ui = report.uiReviewerAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (ui.readinessState) {
    case 'UI_EXCELLENT':
    case 'UI_GOOD':
      status = 'PASS';
      break;
    case 'UI_CONFUSING':
      status = 'WARNING';
      break;
    case 'UI_HIGH_RISK':
    case 'UI_BLOCKED':
      status = 'FAIL';
      break;
  }

  return {
    authorityId: 'ui-reviewer-authority',
    authorityName: 'UI Reviewer Authority',
    authorityCategory: 'UI_REVIEWER',
    score: ui.uiReviewScore,
    confidence: clamp(Math.max(0, 100 - ui.criticalUiFailures * 12)),
    status,
    launchBlocker: ui.blocksLaunchReadiness,
    findings: [
      `UI review score: ${ui.uiReviewScore}/100`,
      `Navigation score: ${ui.navigationScore}/100`,
      `Discoverability score: ${ui.discoverabilityScore}/100`,
      `Critical UI failures: ${ui.criticalUiFailures}`,
      ...ui.uiRisks.slice(0, 2).map((risk) => `UI risk: ${risk}`),
    ],
    recommendations: ui.uiRecommendations.slice(0, 4),
  };
}

function mapLaunchReadinessAuthority(report: FounderTestV4ReportForLaunchCouncil): LaunchCouncilAuthorityResult {
  const readiness = report.launchReadinessAuthority;
  let status: LaunchCouncilAuthorityStatus = 'NOT_RUN';
  switch (readiness.readinessState) {
    case 'READY':
      status = 'PASS';
      break;
    case 'CAUTION':
    case 'HIGH_RISK':
      status = 'WARNING';
      break;
    case 'BLOCKED':
      status = 'FAIL';
      break;
  }
  if (readiness.recommendation === 'NOT_READY_FOR_LAUNCH') {
    status = 'FAIL';
  }

  return {
    authorityId: 'launch-readiness-authority',
    authorityName: 'Launch Readiness Authority',
    authorityCategory: 'LAUNCH_READINESS',
    score: readiness.launchReadinessAuthorityScore,
    confidence: readiness.launchConfidenceScore,
    status,
    launchBlocker: readiness.readinessState === 'BLOCKED',
    findings: [
      `Launch recommendation: ${readiness.recommendation.replaceAll('_', ' ')}`,
      `Launch confidence score: ${readiness.launchConfidenceScore}/100`,
      `Blocking authorities: ${readiness.blockingAuthorityCount}`,
      `Supporting authorities: ${readiness.supportingAuthorityCount}`,
      `Readiness state: ${readiness.readinessState}`,
      ...readiness.blockers.slice(0, 2).map((blocker) => `Blocker: ${blocker}`),
    ],
    recommendations: readiness.recommendations.slice(0, 4),
  };
}

export function mapEvidenceAuthoritiesFromFounderTestV4(
  report: FounderTestV4ReportWithCompetitiveReality,
): LaunchCouncilAuthorityResult[] {
  const synthesisIds = new Set([
    'reality-proof-authority',
    'real-user-reality-authority',
    'adoption-prediction-authority',
    'launch-readiness-authority',
    'ui-reviewer-authority',
    'clarifying-question-intelligence',
    'adaptive-autofix-intelligence',
  ]);
  const evidenceIds = listLaunchCouncilAuthorities()
    .map((entry) => entry.authorityId)
    .filter((authorityId) => !synthesisIds.has(authorityId));
  const mapped = [
    mapFounderTestingAuthority(report),
    mapChatIntelligenceAuthority(report),
    mapRepositoryTypecheckAuthority(report),
    mapSkepticalFounderAuthority(report),
    mapPromiseFulfillmentAuthority(report),
    mapTrustAuthority(report),
    mapSelfAwarenessAuthority(report),
    mapUserSuccessAuthority(report),
    mapGapDetectionAuthority(report),
    mapSelfEvolutionAuthority(report),
    mapUnknownDiscoveryAuthority(report),
    mapFirstTimeUserRealityAuthority(report),
    mapCustomerValueAuthority(report),
    mapCompetitiveRealityAuthority(report),
  ];
  return mapped.filter((result) => evidenceIds.includes(result.authorityId));
}

export function mapFounderTestV4ToLaunchCouncilAuthorities(
  report: FounderTestV4ReportWithClarifyingQuestion,
): LaunchCouncilAuthorityResult[] {
  const registeredIds = listLaunchCouncilAuthorities().map((entry) => entry.authorityId);
  const mapped = [
    ...mapEvidenceAuthoritiesFromFounderTestV4(report),
    mapRealityProofAuthority(report),
    mapRealUserRealityAuthority(report),
    mapAdoptionPredictionAuthority(report),
    mapLaunchReadinessAuthority(report),
    mapUiReviewerAuthority(report),
    mapClarifyingQuestionIntelligence(report),
    mapUniversalAppBlueprintVisualLaunchCouncilAuthority(),
    mapFeatureRealityLaunchCouncilAuthority(),
    mapUniversalFeatureContractLaunchCouncilAuthority(),
    mapEngineeringRealityLaunchCouncilAuthority(),
    mapAutonomousFounderLaunchCouncilAuthority(),
  ];
  return mapped.filter((result) => registeredIds.includes(result.authorityId));
}

export function mapFounderTestV4ToLaunchCouncilAuthoritiesWithAdaptive(
  report: FounderTestV4ReportWithAdaptiveAutofix,
): LaunchCouncilAuthorityResult[] {
  const registeredIds = listLaunchCouncilAuthorities().map((entry) => entry.authorityId);
  const mapped = [
    ...mapEvidenceAuthoritiesFromFounderTestV4(report),
    mapRealityProofAuthority(report),
    mapRealUserRealityAuthority(report),
    mapAdoptionPredictionAuthority(report),
    mapLaunchReadinessAuthority(report),
    mapUiReviewerAuthority(report),
    mapClarifyingQuestionIntelligence(report),
    mapAdaptiveAutofixIntelligence(report),
    mapUniversalAppBlueprintVisualLaunchCouncilAuthority(),
    mapFeatureRealityLaunchCouncilAuthority(),
    mapUniversalFeatureContractLaunchCouncilAuthority(),
    mapEngineeringRealityLaunchCouncilAuthority(),
    mapAutonomousFounderLaunchCouncilAuthority(),
  ];
  return mapped.filter((result) => registeredIds.includes(result.authorityId));
}

export function refreshLaunchCouncilWithAdaptiveAutofix(
  report: FounderTestV4ReportWithAdaptiveAutofix,
): {
  launchCouncil: LaunchCouncilAssessment;
  launchCouncilReport: LaunchCouncilReport;
  launchCouncilReportMarkdown: string;
} {
  const authorityResults = mapFounderTestV4ToLaunchCouncilAuthoritiesWithAdaptive(report);
  const launchCouncil = assessLaunchCouncil({ authorityResults, generatedAt: report.generatedAt });
  const artifacts = buildLaunchCouncilArtifacts(launchCouncil, report.generatedAt);
  return {
    launchCouncil,
    launchCouncilReport: artifacts.report,
    launchCouncilReportMarkdown: artifacts.reportMarkdown,
  };
}

export function assembleLaunchCouncilFromFounderTestV4(
  report: FounderTestV4ReportWithClarifyingQuestion,
): {
  launchCouncil: LaunchCouncilAssessment;
  launchCouncilReport: LaunchCouncilReport;
  launchCouncilReportMarkdown: string;
} {
  const authorityResults = mapFounderTestV4ToLaunchCouncilAuthorities(report);
  const launchCouncil = assessLaunchCouncil({ authorityResults, generatedAt: report.generatedAt });
  const artifacts = buildLaunchCouncilArtifacts(launchCouncil, report.generatedAt);
  return {
    launchCouncil,
    launchCouncilReport: artifacts.report,
    launchCouncilReportMarkdown: artifacts.reportMarkdown,
  };
}

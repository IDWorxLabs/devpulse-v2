/**
 * UI Reviewer Authority — deterministic UI structure evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportForLaunchCouncil } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_UI_FAILURES,
  MAX_UI_FINDINGS,
  MAX_UI_RECOMMENDATIONS,
  MAX_UI_RISKS,
  UI_DISCOVERABILITY_BLOCK_SCORE,
  UI_EXCELLENT_SCORE,
  UI_GOOD_SCORE,
  UI_NAVIGATION_BLOCK_SCORE,
  UI_REVIEWER_CACHE_KEY_PREFIX,
  UI_REVIEW_BLOCK_SCORE,
} from './ui-reviewer-bounds.js';
import { recordUIReviewerAssessment } from './ui-reviewer-history.js';
import { buildUIReviewerReportMarkdown } from './ui-reviewer-report-builder.js';
import {
  DISCOVERABILITY_CAPABILITIES,
  LAUNCH_ESSENTIAL_SCREEN_EVIDENCE,
  UI_REVIEWER_SCENARIOS,
} from './ui-reviewer-scenarios.js';
import type {
  UIReviewerAssessment,
  UIReviewerReadinessState,
  UIReviewerScenarioResult,
} from './ui-reviewer-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function passThreshold(score: number): boolean {
  return score >= UI_REVIEW_BLOCK_SCORE;
}

function collectEvidenceText(report: FounderTestV4ReportForLaunchCouncil): string {
  const chunks = [
    ...report.issues.map((issue) => `${issue.screen} ${issue.problem} ${issue.userImpact}`),
    ...report.gapDetectionAuthority.detectedGaps.map(
      (gap) => `${gap.title} ${gap.description} ${gap.evidence.join(' ')}`,
    ),
    ...report.unknownDiscoveryAuthority.findings.map(
      (finding) => `${finding.title} ${finding.description} ${finding.evidence.join(' ')}`,
    ),
    ...report.firstTimeUserRealityAuthority.findings,
    ...report.firstTimeUserRealityAuthority.confusionPoints,
    ...report.firstTimeUserReality.findings.map(
      (finding) => `${finding.whatConfuses} ${finding.observedGap}`,
    ),
    ...report.launchReadinessAuthority.blockers,
    ...report.userSuccessAuthority.findings,
  ];
  return chunks.join('\n').toLowerCase();
}

function uiIssues(report: FounderTestV4ReportForLaunchCouncil) {
  return report.issues.filter(
    (issue) =>
      issue.severity === 'BLOCKER' ||
      issue.severity === 'HIGH' ||
      /nav|screen|view|preview|project|workflow|ui|ux/i.test(`${issue.screen} ${issue.problem}`),
  );
}

function evaluateNavigationReview(report: FounderTestV4ReportForLaunchCouncil): UIReviewerScenarioResult {
  const ftu = report.firstTimeUserReality;
  const ftuAuthority = report.firstTimeUserRealityAuthority;
  const navIssues = uiIssues(report).filter((issue) => /nav|sidebar|menu|project/i.test(`${issue.screen} ${issue.problem}`));
  const duplicateNavSignal =
    /project vault|projects vs|duplicate nav|ambiguous label|confus/i.test(collectEvidenceText(report));
  const checks = [
    ftu.categoryScores.navigation >= UI_NAVIGATION_BLOCK_SCORE,
    ftu.navigationUnderstandingPass,
    navIssues.filter((issue) => issue.severity === 'BLOCKER').length === 0,
    !duplicateNavSignal,
    ftuAuthority.scenarioResults.find((scenario) => scenario.id === 'workflow-understanding')?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const findings: string[] = [
    `Navigation category score: ${ftu.categoryScores.navigation}/100`,
    `Navigation understanding pass: ${ftu.navigationUnderstandingPass ? 'Yes' : 'No'}`,
    `Navigation-related issues: ${navIssues.length}`,
  ];
  const uiRisks: string[] = [];
  if (!ftu.navigationUnderstandingPass) uiRisks.push('Users may not understand primary navigation');
  if (duplicateNavSignal) uiRisks.push('Duplicate or ambiguous navigation labels detected (e.g. Projects vs Project Vault)');
  if (navIssues.some((issue) => issue.severity === 'BLOCKER')) {
    uiRisks.push('Critical navigation wiring issues block surface discovery');
  }
  return {
    id: 'navigation-review',
    category: 'NAVIGATION_REVIEW',
    score,
    passed: passThreshold(score),
    criticalFailure: navIssues.some((issue) => issue.severity === 'BLOCKER') || score < UI_NAVIGATION_BLOCK_SCORE,
    findings,
    uiRisks,
    recommendations: [
      'Make every launch-critical surface reachable from an obvious nav label.',
      'Resolve duplicate or ambiguous project navigation before launch.',
      ...ftuAuthority.recommendations.slice(0, 2),
    ],
  };
}

function evaluateFeatureDiscoverability(report: FounderTestV4ReportForLaunchCouncil): UIReviewerScenarioResult {
  const preview = report.previewReality;
  const evidence = collectEvidenceText(report);
  const hiddenPreviewSignal = /invisible|hidden|cannot find live preview|missing live preview visibility/i.test(evidence);
  const capabilityChecks = DISCOVERABILITY_CAPABILITIES.map((capability) => {
    const present =
      evidence.includes(capability.toLowerCase()) ||
      report.issues.every((issue) => !issue.problem.toLowerCase().includes(`missing ${capability.toLowerCase()}`));
    return present;
  });
  const checks = [
    preview.existsPass,
    preview.stateUnderstandable,
    preview.readinessVisible,
    !hiddenPreviewSignal,
    capabilityChecks.filter(Boolean).length >= DISCOVERABILITY_CAPABILITIES.length - 2,
    report.firstTimeUserRealityAuthority.scenarioResults.find((scenario) => scenario.id === 'capability-understanding')
      ?.passed ?? false,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const findings: string[] = [
    `Live Preview exists pass: ${preview.existsPass ? 'Yes' : 'No'}`,
    `Live Preview state understandable: ${preview.stateUnderstandable ? 'Yes' : 'No'}`,
    `Hidden capability signals: ${hiddenPreviewSignal ? 'Yes' : 'No'}`,
  ];
  const uiRisks: string[] = [];
  if (hiddenPreviewSignal || !preview.readinessVisible) {
    uiRisks.push('Live Preview may exist but remain effectively invisible to users');
  }
  if (!preview.stateUnderstandable) uiRisks.push('Preview state may confuse users about what is running');
  return {
    id: 'feature-discoverability',
    category: 'FEATURE_DISCOVERABILITY',
    score,
    passed: passThreshold(score),
    criticalFailure: hiddenPreviewSignal || score < UI_DISCOVERABILITY_BLOCK_SCORE,
    findings,
    uiRisks,
    recommendations: [
      'Surface Live Preview, Verification, and build status where founders expect them.',
      'A feature users cannot find is functionally equivalent to a feature that does not exist.',
    ],
  };
}

function evaluateLayoutHierarchy(report: FounderTestV4ReportForLaunchCouncil): UIReviewerScenarioResult {
  const visual = report.visualQualityAuthority;
  const friction = report.founderFrictionHeatmap;
  const checks = [
    visual.subscores.hierarchy >= 55,
    visual.subscores.layout >= 55,
    !friction.deadEndsDetected,
    report.founderActionCenterVisibilityScore.noDuplicatesPass,
    report.firstTimeUserReality.categoryScores.simplicity >= 50,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const findings = [
    `Visual hierarchy subscore: ${visual.subscores.hierarchy}/100`,
    `Visual layout subscore: ${visual.subscores.layout}/100`,
    `Dead-end flows detected: ${friction.deadEndsDetected ? 'Yes' : 'No'}`,
  ];
  const uiRisks: string[] = [];
  if (visual.subscores.hierarchy < 55) uiRisks.push('Weak visual hierarchy may bury critical actions');
  if (friction.deadEndsDetected) uiRisks.push('Dead-end flows detected in bounded friction analysis');
  return {
    id: 'layout-hierarchy',
    category: 'LAYOUT_HIERARCHY',
    score,
    passed: passThreshold(score),
    criticalFailure: visual.subscores.hierarchy < 40,
    findings,
    uiRisks,
    recommendations: [
      ...visual.weaknesses.slice(0, 2),
      ...visual.findings.slice(0, 1).map((finding) => finding.recommendation),
    ],
  };
}

function evaluateFirstTimeUserPerspective(report: FounderTestV4ReportForLaunchCouncil): UIReviewerScenarioResult {
  const ftu = report.firstTimeUserReality;
  const ftuAuthority = report.firstTimeUserRealityAuthority;
  const checks = [
    ftu.productUnderstandingPass,
    ftu.workflowClarityPass,
    ftu.cognitiveLoadPass,
    ftuAuthority.firstTimeUserScore >= UI_REVIEW_BLOCK_SCORE,
    ftuAuthority.criticalConfusionCount === 0,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  return {
    id: 'first-time-user-perspective',
    category: 'FIRST_TIME_USER_PERSPECTIVE',
    score,
    passed: passThreshold(score),
    criticalFailure: ftuAuthority.criticalConfusionCount > 0,
    findings: [
      `First-time user score: ${ftuAuthority.firstTimeUserScore}/100`,
      `Product understanding pass: ${ftu.productUnderstandingPass ? 'Yes' : 'No'}`,
      `Critical confusion count: ${ftuAuthority.criticalConfusionCount}`,
    ],
    uiRisks: ftuAuthority.confusionPoints.slice(0, 4),
    recommendations: ftuAuthority.recommendations.slice(0, 3),
  };
}

function evaluateWorkflowReview(report: FounderTestV4ReportForLaunchCouncil): UIReviewerScenarioResult {
  const success = report.userSuccessAuthority;
  const workflowGoals = ['planning-goal', 'build-goal', 'launch-goal'];
  const goalResults = workflowGoals.map(
    (id) => success.scenarioResults.find((scenario) => scenario.id === id)?.passed ?? false,
  );
  const checks = [
    report.creationJourneyScore >= 55,
    report.ideaToAppScore >= 50,
    goalResults.filter(Boolean).length >= 2,
    success.userSuccessScore >= UI_REVIEW_BLOCK_SCORE,
    report.firstTimeUserReality.workflowClarityPass,
  ];
  const score = clamp((checks.filter(Boolean).length / checks.length) * 100);
  const uiRisks: string[] = [];
  if (!report.firstTimeUserReality.workflowClarityPass) uiRisks.push('Workflow clarity may fail for first-time users');
  if (goalResults.filter(Boolean).length < 2) uiRisks.push('Major user workflows are not consistently achievable');
  return {
    id: 'workflow-review',
    category: 'WORKFLOW_REVIEW',
    score,
    passed: passThreshold(score),
    criticalFailure: success.criticalSuccessFailures > 0,
    findings: [
      `User success score: ${success.userSuccessScore}/100`,
      `Creation journey score: ${report.creationJourneyScore}/100`,
      `Workflow goals passed: ${goalResults.filter(Boolean).length}/${workflowGoals.length}`,
    ],
    uiRisks,
    recommendations: success.recommendations.slice(0, 3),
  };
}

function evaluateMissingScreenReview(report: FounderTestV4ReportForLaunchCouncil): UIReviewerScenarioResult {
  const evidence = collectEvidenceText(report);
  const missingFromEvidence: string[] = [];
  for (const essential of LAUNCH_ESSENTIAL_SCREEN_EVIDENCE) {
    const mentionsAbsence = essential.patterns.some((pattern) => pattern.test(evidence));
    const mentionsMissing = new RegExp(`missing.*${essential.label}|no.*${essential.label}|without.*${essential.label}`, 'i').test(
      evidence,
    );
    if (mentionsAbsence && mentionsMissing) {
      missingFromEvidence.push(essential.label);
    }
  }
  const gapMissing = report.gapDetectionAuthority.detectedGaps
    .filter((gap) => /screen|surface|settings|sign|empty|loading|error|help|profile/i.test(`${gap.title} ${gap.description}`))
    .map((gap) => gap.title)
    .slice(0, 4);
  const combinedMissing = [...new Set([...missingFromEvidence, ...gapMissing])];
  const checks = [
    combinedMissing.length <= 2,
    report.unknownDiscoveryAuthority.criticalFindingCount === 0,
    report.gapDetectionAuthority.criticalGapCount <= 1,
  ];
  const score = clamp(100 - combinedMissing.length * 12 - report.gapDetectionAuthority.criticalGapCount * 10);
  return {
    id: 'missing-screen-review',
    category: 'MISSING_SCREEN_REVIEW',
    score,
    passed: passThreshold(score),
    criticalFailure: combinedMissing.length >= 3,
    findings:
      combinedMissing.length > 0
        ? combinedMissing.map((item) => `Likely missing launch essential: ${item}`)
        : ['No evidence-backed missing launch screens detected in bounded review.'],
    uiRisks: combinedMissing.map((item) => `Launch may be missing ${item} based on existing evidence`),
    recommendations: [
      'Only add screens that evidence shows are missing — do not invent surfaces.',
      ...report.gapDetectionAuthority.recommendations.slice(0, 2),
    ],
  };
}

function deriveReadinessState(input: {
  blocksLaunchReadiness: boolean;
  uiReviewScore: number;
  navigationScore: number;
  discoverabilityScore: number;
  criticalUiFailures: number;
}): UIReviewerReadinessState {
  if (input.blocksLaunchReadiness) return 'UI_BLOCKED';
  if (input.uiReviewScore < 50 || input.criticalUiFailures >= 3) return 'UI_HIGH_RISK';
  if (input.navigationScore < UI_REVIEW_BLOCK_SCORE || input.discoverabilityScore < UI_REVIEW_BLOCK_SCORE) {
    return 'UI_CONFUSING';
  }
  if (input.uiReviewScore >= UI_EXCELLENT_SCORE && input.criticalUiFailures === 0) return 'UI_EXCELLENT';
  if (input.uiReviewScore >= UI_GOOD_SCORE) return 'UI_GOOD';
  return 'UI_CONFUSING';
}

function stableCacheKey(report: FounderTestV4ReportForLaunchCouncil, scores: {
  uiReviewScore: number;
  navigationScore: number;
  discoverabilityScore: number;
}): string {
  const digest = createHash('sha256')
    .update(
      [
        report.launchReadinessAuthority.cacheKey,
        report.firstTimeUserRealityAuthority.cacheKey,
        report.gapDetectionAuthority.cacheKey,
        scores.uiReviewScore,
        scores.navigationScore,
        scores.discoverabilityScore,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${UI_REVIEWER_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessUIReviewerAuthority(report: FounderTestV4ReportForLaunchCouncil): UIReviewerAssessment {
  const scenarioResults: UIReviewerScenarioResult[] = [
    evaluateNavigationReview(report),
    evaluateFeatureDiscoverability(report),
    evaluateLayoutHierarchy(report),
    evaluateFirstTimeUserPerspective(report),
    evaluateWorkflowReview(report),
    evaluateMissingScreenReview(report),
  ];

  const navigationScore = scenarioResults.find((result) => result.id === 'navigation-review')!.score;
  const discoverabilityScore = scenarioResults.find((result) => result.id === 'feature-discoverability')!.score;
  const hierarchyScore = scenarioResults.find((result) => result.id === 'layout-hierarchy')!.score;
  const clarityScore = clamp(
    report.firstTimeUserReality.categoryScores.understanding * 0.5 +
      report.firstTimeUserReality.categoryScores.simplicity * 0.5,
  );
  const usabilityScore = clamp(
    report.userSuccessAuthority.userSuccessScore * 0.4 +
      scenarioResults.find((result) => result.id === 'workflow-review')!.score * 0.6,
  );
  const firstTimeUserScore = report.firstTimeUserRealityAuthority.firstTimeUserScore;
  const uiReviewScore = clamp(
    navigationScore * 0.2 +
      discoverabilityScore * 0.2 +
      hierarchyScore * 0.15 +
      clarityScore * 0.15 +
      usabilityScore * 0.15 +
      firstTimeUserScore * 0.15,
  );
  const criticalUiFailures = scenarioResults.filter((result) => result.criticalFailure).length;
  const blocksLaunchReadiness =
    criticalUiFailures > 0 ||
    uiReviewScore < UI_REVIEW_BLOCK_SCORE ||
    navigationScore < UI_NAVIGATION_BLOCK_SCORE ||
    discoverabilityScore < UI_DISCOVERABILITY_BLOCK_SCORE;

  const uiRisks = [...new Set(scenarioResults.flatMap((result) => result.uiRisks))].slice(0, MAX_UI_RISKS);
  const uiRecommendations = [
    ...new Set(scenarioResults.flatMap((result) => result.recommendations)),
    'Review navigation and discoverability before trusting launch readiness scores alone.',
  ].slice(0, MAX_UI_RECOMMENDATIONS);

  const readinessState = deriveReadinessState({
    blocksLaunchReadiness,
    uiReviewScore,
    navigationScore,
    discoverabilityScore,
    criticalUiFailures,
  });

  const assessment: UIReviewerAssessment = {
    readOnly: true,
    advisoryOnly: true,
    uiReviewScore,
    usabilityScore,
    navigationScore,
    discoverabilityScore,
    clarityScore,
    hierarchyScore,
    firstTimeUserScore,
    criticalUiFailures,
    uiRisks,
    uiRecommendations,
    blocksLaunchReadiness,
    readinessState,
    scenarioResults,
    cacheKey: stableCacheKey(report, { uiReviewScore, navigationScore, discoverabilityScore }),
  };

  recordUIReviewerAssessment(assessment);
  return assessment;
}

export function buildUIReviewerAuthorityArtifacts(
  report: FounderTestV4ReportForLaunchCouncil,
): {
  uiReviewerAuthority: UIReviewerAssessment;
  uiReviewerAuthorityReportMarkdown: string;
} {
  const uiReviewerAuthority = assessUIReviewerAuthority(report);
  return {
    uiReviewerAuthority,
    uiReviewerAuthorityReportMarkdown: buildUIReviewerReportMarkdown(uiReviewerAuthority),
  };
}

/**
 * Founder Friction Heatmap Authority — bounded friction discovery from existing reality engines.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';
import type { VerificationTrustEvidenceAssessment } from '../verification-trust-evidence/verification-trust-evidence-types.js';
import {
  MAX_FRICTION_DEAD_ENDS,
  MAX_FRICTION_HOTSPOTS,
  MAX_FRICTION_RANKINGS,
  MAX_FRICTION_SCENARIOS,
  MAX_FRICTION_UX_IMPROVEMENTS,
} from './founder-friction-heatmap-bounds.js';
import type {
  AssessFounderFrictionHeatmapInput,
  ExplanationDependency,
  FrictionCategory,
  FrictionCategoryScore,
  FrictionDeadEnd,
  FrictionExplanationScreen,
  FrictionHeatmapScenarioResult,
  FrictionHotspot,
  FrictionLevel,
  FounderFrictionHeatmapAssessment,
  FounderFrictionHeatmapShellSources,
  FounderFrictionHeatmapSummary,
  FounderFrictionHeatmapVisibility,
} from './founder-friction-heatmap-types.js';

function shellCopy(sources: FounderFrictionHeatmapShellSources): string {
  return `${sources.html}\n${sources.appJs}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function frictionFromPassRate(passRate: number, penalty = 0): number {
  return clamp(100 - passRate * 100 + penalty);
}

function computeNavigationFriction(
  firstTime: FirstTimeUserRealityAssessment,
  sensemaking: FounderSensemakingAssessment,
): FrictionCategoryScore {
  const navScenarios = firstTime.scenarios.filter(
    (s) => s.category === 'NAVIGATION_UNDERSTANDING' || s.id.startsWith('nav-overlap-'),
  );
  const navPassRate =
    navScenarios.length > 0 ? navScenarios.filter((s) => s.passed).length / navScenarios.length : 0.85;
  const redundancyPenalty = sensemaking.findings.filter((f) => f.type === 'REDUNDANCY').length * 8;
  const score = frictionFromPassRate(navPassRate, redundancyPenalty);
  return {
    category: 'Navigation',
    score,
    detail:
      score >= 60
        ? 'Related destinations may cause repeated screen switching before founders find the right surface.'
        : 'Navigation labels and purpose separation are mostly clear.',
  };
}

function computeUnderstandingFriction(firstTime: FirstTimeUserRealityAssessment): FrictionCategoryScore {
  const understanding = firstTime.categoryScores.understanding;
  const purposeFindings = firstTime.findings.filter(
    (f) => f.type === 'PURPOSE_UNCLEAR' || f.type === 'FIRST_TIME_CONFUSION',
  ).length;
  const screenFails = firstTime.screenPurposeResults.filter((s) => !s.purposeClear).length;
  const score = clamp(100 - understanding + purposeFindings * 6 + screenFails * 5);
  return {
    category: 'Understanding',
    score,
    detail:
      score >= 55
        ? 'Some screens or concepts still require extra explanation before founders proceed.'
        : 'Product purpose and screen roles are mostly understandable.',
  };
}

function computeWorkflowFriction(firstTime: FirstTimeUserRealityAssessment): FrictionCategoryScore {
  const workflowScenarios = firstTime.scenarios.filter(
    (s) => s.category === 'WORKFLOW_UNDERSTANDING' || s.id.startsWith('action-path-'),
  );
  const passRate =
    workflowScenarios.length > 0
      ? workflowScenarios.filter((s) => s.passed).length / workflowScenarios.length
      : firstTime.workflowClarityPass
        ? 1
        : 0.5;
  const workflowFindings = firstTime.findings.filter((f) => f.type === 'WORKFLOW_UNKNOWN').length;
  const score = frictionFromPassRate(passRate, workflowFindings * 10);
  return {
    category: 'Workflow',
    score,
    detail:
      score >= 55
        ? 'Next steps or the ordered founder journey may still be unclear at key moments.'
        : 'First workflow and action path guidance are discoverable.',
  };
}

function computeVerificationFriction(
  trust: VerificationTrustEvidenceAssessment,
  verification: VerificationResultsVisibilityAssessment,
): FrictionCategoryScore {
  const trustFriction = 100 - trust.trustScore;
  const failPenalty = (verification.summary.failCount + verification.summary.blockedCount) * 6;
  const blackBoxPenalty = trust.blackBoxRisk ? 20 : 0;
  const score = clamp(Math.max(trustFriction, failPenalty + blackBoxPenalty));
  return {
    category: 'Verification',
    score,
    detail:
      score >= 55
        ? 'Verification outcomes or evidence may still feel hard to explain or act on.'
        : 'Verification Trust & Evidence makes pass/fail results explainable.',
  };
}

function computeDecisionFriction(
  sensemaking: FounderSensemakingAssessment,
  actionCenter: FounderActionCenterAssessment,
  verification: VerificationResultsVisibilityAssessment,
): FrictionCategoryScore {
  const contradictionPenalty = sensemaking.topContradictions.length * 12;
  const deadEndPenalty = sensemaking.findings.filter((f) => f.type === 'DEAD_END').length * 15;
  const noActionsPenalty =
    actionCenter.state === 'NO_ACTIONS' &&
    (verification.summary.failCount > 0 || verification.summary.blockedCount > 0)
      ? 25
      : 0;
  const score = clamp(contradictionPenalty + deadEndPenalty + noActionsPenalty);
  return {
    category: 'Decision',
    score,
    detail:
      score >= 55
        ? 'Founders may hesitate on whether to continue, fix, or launch.'
        : 'Recommended next actions and readiness signals mostly align.',
  };
}

function buildConfusionHotspots(
  firstTime: FirstTimeUserRealityAssessment,
  sensemaking: FounderSensemakingAssessment,
): FrictionHotspot[] {
  const hotspots: FrictionHotspot[] = [];
  const seen = new Set<string>();

  for (const f of firstTime.findings.slice(0, 4)) {
    const key = f.whatConfuses.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hotspots.push({
      id: `hotspot-first-time-${hotspots.length + 1}`,
      concept: f.whatConfuses,
      screen: f.screen,
      severity: f.severity,
      detail: f.observedGap,
    });
  }

  for (const f of sensemaking.topConfusionRisks.slice(0, 3)) {
    const key = f.whatDoesNotMakeSense.trim().toLowerCase();
    if (seen.has(key) || hotspots.length >= MAX_FRICTION_HOTSPOTS) continue;
    seen.add(key);
    hotspots.push({
      id: `hotspot-sense-${hotspots.length + 1}`,
      concept: f.whatDoesNotMakeSense,
      screen: f.area,
      severity: f.severity,
      detail: f.whyItMatters,
    });
  }

  if (!hotspots.length) {
    hotspots.push({
      id: 'hotspot-none',
      concept: 'No major confusion hotspots detected',
      severity: 'LOW',
      detail: 'Current onboarding, navigation, and trust layers are holding up in bounded scenarios.',
    });
  }

  return hotspots.slice(0, MAX_FRICTION_HOTSPOTS);
}

function buildDeadEnds(
  sensemaking: FounderSensemakingAssessment,
  actionCenter: FounderActionCenterAssessment,
): FrictionDeadEnd[] {
  const deadEnds: FrictionDeadEnd[] = [];

  for (const f of sensemaking.findings.filter((f) => f.type === 'DEAD_END')) {
    deadEnds.push({
      id: `dead-end-${deadEnds.length + 1}`,
      screen: f.area,
      detail: f.whatDoesNotMakeSense,
      recommendedFix: f.recommendedUpgrade,
    });
  }

  if (
    actionCenter.state === 'NO_ACTIONS' &&
    !actionCenter.insufficientInfo &&
    deadEnds.length < MAX_FRICTION_DEAD_ENDS
  ) {
    deadEnds.push({
      id: `dead-end-action-${deadEnds.length + 1}`,
      screen: 'Action Center',
      detail: 'Verification or product issues exist but no prioritized next action is surfaced.',
      recommendedFix: 'Surface verification failures and coherence gaps as Action Center items.',
    });
  }

  if (!deadEnds.length) {
    deadEnds.push({
      id: 'dead-end-none',
      screen: 'None detected',
      detail: 'Bounded analysis found no obvious dead-end screens without a next action.',
      recommendedFix: 'Continue monitoring after major UX changes.',
    });
  }

  return deadEnds.slice(0, MAX_FRICTION_DEAD_ENDS);
}

function buildExplanationDependency(
  sources: FounderFrictionHeatmapShellSources,
  firstTime: FirstTimeUserRealityAssessment,
): FrictionExplanationScreen[] {
  const screens: Array<{ screen: string; viewId: string }> = [
    { screen: 'Verification', viewId: 'verification' },
    { screen: 'Project Insights', viewId: 'project-insights' },
    { screen: 'Live Preview', viewId: 'live-preview' },
    { screen: 'Project Memory', viewId: 'project-memory' },
    { screen: 'Product Coherence', viewId: 'product-coherence' },
  ];

  return screens.map(({ screen, viewId }) => {
    const purposeResult = firstTime.screenPurposeResults.find(
      (s) => s.screen === screen || s.viewId === viewId,
    );
    const navHasHelp = new RegExp(`data-view="${viewId}"[\\s\\S]{0,500}nav-help`, 'i').test(sources.html);
    const requiresExplanation =
      navHasHelp ||
      Boolean(purposeResult && !purposeResult.purposeClear) ||
      screen === 'Verification' ||
      screen === 'Product Coherence';
    const dependency: ExplanationDependency = requiresExplanation
      ? 'Requires Explanation'
      : 'Self-Explanatory';
    return {
      screen,
      dependency,
      detail:
        dependency === 'Requires Explanation'
          ? 'Help text or extended guidance is doing meaningful work for first-time founders.'
          : 'Core purpose is visible without excessive help text.',
    };
  });
}

function deriveFrictionLevel(overall: number): FrictionLevel {
  if (overall >= 60) return 'HIGH';
  if (overall >= 35) return 'MODERATE';
  return 'LOW';
}

function buildSummary(
  categoryScores: FrictionCategoryScore[],
  hotspots: FrictionHotspot[],
  deadEnds: FrictionDeadEnd[],
  firstTime: FirstTimeUserRealityAssessment,
): FounderFrictionHeatmapSummary {
  const ranked = [...categoryScores].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const confusion = hotspots.find((h) => h.id !== 'hotspot-none') ?? hotspots[0];
  const abandonment =
    deadEnds.find((d) => d.id !== 'dead-end-none')?.screen ??
    (top.score >= 55 ? top.category : 'Command Center entry');

  const successfulJourney = firstTime.actionPathPass
    ? 'Create/Open Project → Describe Vision → Review Insights → Live Preview → Verification → Launch'
    : 'Command Center welcome → Action Center guidance → Founder Testing';

  const improvements = ranked
    .filter((c) => c.score >= 40)
    .map((c) => `Reduce ${c.category.toLowerCase()} friction: ${c.detail}`)
    .slice(0, MAX_FRICTION_UX_IMPROVEMENTS);

  if (!improvements.length) {
    improvements.push('Maintain current onboarding, action path, and verification trust clarity.');
  }

  return {
    frictionLevel: deriveFrictionLevel(
      ranked.reduce((sum, c) => sum + c.score, 0) / Math.max(ranked.length, 1),
    ),
    mostLikelyAbandonmentPoint: abandonment,
    mostLikelyConfusionPoint: confusion.concept,
    mostSuccessfulJourney: successfulJourney,
    recommendedUxImprovements: improvements,
  };
}

export function founderFrictionHeatmapResolved(
  checkId: string,
  sources: FounderFrictionHeatmapShellSources,
): boolean {
  const combined = shellCopy(sources);
  switch (checkId) {
    case 'heatmap-visible':
      return combined.includes('founder-friction-heatmap') && combined.includes('Founder Friction Heatmap');
    case 'highest-friction-areas':
      return combined.includes('Highest Friction Areas');
    case 'confusion-hotspots':
      return combined.includes('Confusion Hotspots');
    case 'dead-end-findings':
      return combined.includes('Dead-End Findings');
    case 'explanation-dependency':
      return combined.includes('Explanation Dependency') && combined.includes('Requires Explanation');
    case 'friction-level':
      return combined.includes('Friction Level') && /LOW|MODERATE|HIGH/.test(combined);
    case 'category-scores':
      return (
        combined.includes('Navigation Friction Score') &&
        combined.includes('Understanding Friction Score') &&
        combined.includes('Workflow Friction Score') &&
        combined.includes('Verification Friction Score') &&
        combined.includes('Decision Friction Score')
      );
    case 'abandonment-point':
      return combined.includes('Most Likely Abandonment Point');
    case 'confusion-point':
      return combined.includes('Most Likely Confusion Point');
    case 'successful-journey':
      return combined.includes('Most Successful Journey');
    case 'ux-improvements':
      return combined.includes('Recommended UX Improvements');
    default:
      return false;
  }
}

function runScenario(
  id: string,
  name: string,
  passed: boolean,
  detail: string,
  bucket: FrictionHeatmapScenarioResult[],
): void {
  bucket.push({ id, name, passed, detail });
}

export function assessFounderFrictionHeatmap(
  input: AssessFounderFrictionHeatmapInput,
): FounderFrictionHeatmapAssessment {
  const {
    shellSources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderSensemaking,
    founderActionCenter,
    verificationResults,
  } = input;

  const categoryScores: FrictionCategoryScore[] = [
    computeNavigationFriction(firstTimeUserReality, founderSensemaking),
    computeUnderstandingFriction(firstTimeUserReality),
    computeWorkflowFriction(firstTimeUserReality),
    computeVerificationFriction(verificationTrustEvidence, verificationResults),
    computeDecisionFriction(founderSensemaking, founderActionCenter, verificationResults),
  ];

  const highestFrictionAreas = [...categoryScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FRICTION_RANKINGS)
    .map((c) => `${c.category} (${c.score}/100 friction)`);

  const confusionHotspots = buildConfusionHotspots(firstTimeUserReality, founderSensemaking);
  const deadEndFindings = buildDeadEnds(founderSensemaking, founderActionCenter);
  const explanationDependency = buildExplanationDependency(shellSources, firstTimeUserReality);
  const summary = buildSummary(categoryScores, confusionHotspots, deadEndFindings, firstTimeUserReality);

  const overallFrictionScore = clamp(
    categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length,
  );

  const scenarios: FrictionHeatmapScenarioResult[] = [];
  const visible = founderFrictionHeatmapResolved('heatmap-visible', shellSources);

  runScenario(
    'confusion-hotspot-detection',
    'Confusion hotspot detection',
    visible && founderFrictionHeatmapResolved('confusion-hotspots', shellSources),
    'Confusion Hotspots section present.',
    scenarios,
  );
  runScenario(
    'dead-end-detection',
    'Dead-end detection',
    visible && founderFrictionHeatmapResolved('dead-end-findings', shellSources),
    'Dead-End Findings section present.',
    scenarios,
  );
  runScenario(
    'abandonment-risk-detection',
    'Abandonment risk detection',
    visible && founderFrictionHeatmapResolved('abandonment-point', shellSources),
    'Abandonment point surfaced in summary.',
    scenarios,
  );
  runScenario(
    'workflow-clarity-ranking',
    'Workflow clarity ranking',
    visible &&
      founderFrictionHeatmapResolved('highest-friction-areas', shellSources) &&
      founderFrictionHeatmapResolved('category-scores', shellSources),
    'Friction rankings and category scores visible.',
    scenarios,
  );
  runScenario(
    'friction-reporting',
    'Major friction surfaced in heatmap rankings',
    visible && highestFrictionAreas.length >= 3 && summary.recommendedUxImprovements.length > 0,
    `Overall friction ${overallFrictionScore}/100; level ${summary.frictionLevel}.`,
    scenarios,
  );
  runScenario(
    'explainable-findings',
    'Friction findings are explainable',
    confusionHotspots.every((h) => h.detail.length > 10) &&
      deadEndFindings.every((d) => d.recommendedFix.length > 5),
    'Hotspots and dead ends include detail and recommended fixes.',
    scenarios,
  );

  const boundedScenarios = scenarios.slice(0, MAX_FRICTION_SCENARIOS);
  const heatmapPass = boundedScenarios.every((s) => s.passed) && visible;
  const abandonmentRiskDetected =
    summary.frictionLevel !== 'LOW' ||
    deadEndFindings.some((d) => d.id !== 'dead-end-none') ||
    categoryScores.some((c) => c.score >= 55);

  return {
    overallFrictionScore,
    categoryScores,
    highestFrictionAreas,
    confusionHotspots,
    deadEndFindings,
    explanationDependency,
    summary,
    scenarios: boundedScenarios,
    heatmapPass,
    frictionVisible: visible,
    rankingsGenerated: highestFrictionAreas.length >= 3,
    deadEndsDetected: deadEndFindings.some((d) => d.id !== 'dead-end-none'),
    abandonmentRiskDetected,
  };
}

export function evaluateFounderFrictionHeatmapVisibility(
  assessment: FounderFrictionHeatmapAssessment,
  sources: FounderFrictionHeatmapShellSources,
): FounderFrictionHeatmapVisibility {
  const uiPresent = founderFrictionHeatmapResolved('heatmap-visible', sources);
  const checks = [
    uiPresent,
    assessment.heatmapPass,
    assessment.rankingsGenerated,
    founderFrictionHeatmapResolved('confusion-hotspots', sources),
    founderFrictionHeatmapResolved('ux-improvements', sources),
    !assessment.abandonmentRiskDetected || founderFrictionHeatmapResolved('abandonment-point', sources),
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    overallFrictionScore: assessment.overallFrictionScore,
    heatmapPass: assessment.heatmapPass,
    frictionVisible: assessment.frictionVisible,
    rankingsGenerated: assessment.rankingsGenerated,
    deadEndsDetected: assessment.deadEndsDetected,
    abandonmentRiskDetected: assessment.abandonmentRiskDetected,
    scenarioPassCount: assessment.scenarios.filter((s) => s.passed).length,
    hotspotCount: assessment.confusionHotspots.length,
  };
}

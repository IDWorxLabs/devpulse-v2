/**
 * Founder Testing V5 — builds unified founder-facing summary sections.
 */

import type { FounderTestV4Report } from './founder-testing-v4-types.js';
import { deriveLaunchRecommendation, buildFinalRecommendation } from './founder-testing-v5-scorer.js';
import type { FounderTestV5UnifiedSummary } from './founder-testing-v5-types.js';

const MAX_ITEMS = 8;

function cap(items: string[]): string[] {
  return items.filter(Boolean).slice(0, MAX_ITEMS);
}

export function buildUnifiedFounderSummary(v4: FounderTestV4Report): FounderTestV5UnifiedSummary {
  const lr = v4.launchReadinessReality;
  const overallFounderScore = lr.launchReadinessRealityScore;
  const launchRecommendation = deriveLaunchRecommendation(
    v4.verdict,
    overallFounderScore,
    v4.customerJourneySimulation,
    v4.promiseRealityEngine,
    v4.visualQualityAuthority,
    v4.launchDaySimulation,
    v4.adoptionPrediction,
  );

  const whatWorks = cap([
    ...v4.firstTimeUserReality.strengths.map((s) => `First-time: ${s}`),
    lr.technicalReadiness >= 70 ? `Technical readiness strong (${lr.technicalReadiness}/100)` : '',
    lr.productReadiness >= 70 ? `Product readiness strong (${lr.productReadiness}/100)` : '',
    lr.humanReadiness >= 70 ? `Human readiness strong (${lr.humanReadiness}/100)` : '',
    v4.creationJourneyScore >= 70 ? `Creation journey mostly complete (${v4.creationJourneyScore}/100)` : '',
    v4.ideaToAppScore >= 75 ? `Idea-to-app routing works (${v4.ideaToAppScore}/100)` : '',
    v4.previewReality.validationReadyPass ? 'Live Preview validation-ready when active' : '',
    v4.projectMemoryReality.score >= 70 ? `Project Memory retains context (${v4.projectMemoryReality.score}/100)` : '',
    v4.verificationResultsVisibilityScore.betaReady
      ? 'Verification reports beta-ready signals'
      :     v4.verificationResultsVisibilityScore.passCount > 0
      ? `${v4.verificationResultsVisibilityScore.passCount} verification checks passing`
      : '',
    v4.verificationTrustEvidence.trustPass
      ? `Verification Trust & Evidence explainable (${v4.verificationTrustEvidence.trustScore}/100)`
      : '',
    v4.founderFrictionHeatmap.heatmapPass
      ? `Friction heatmap active (${v4.founderFrictionHeatmap.summary.frictionLevel} friction)`
      : '',
    v4.customerJourneySimulation.customerReady
      ? `Customer journey ready (${v4.customerJourneySimulation.customerJourneyScore}/100)`
      : v4.customerJourneySimulation.customerJourneyScore >= 60
        ? `Customer journey moderate (${v4.customerJourneySimulation.customerJourneyScore}/100)`
        : '',
    ...v4.customerJourneySimulation.strengths.map((s) => `Customer: ${s}`),
    v4.promiseRealityEngine.promiseRealityPass
      ? `Promise reality strong (${v4.promiseRealityEngine.promiseRealityScore}/100)`
      : '',
    ...v4.promiseRealityEngine.provenClaims.slice(0, 2).map((c) => `Proven: ${c.claim}`),
    v4.visualQualityAuthority.visualQualityPass
      ? `Visual quality strong (${v4.visualQualityAuthority.visualQualityScore}/100)`
      : '',
    ...v4.visualQualityAuthority.strengths.slice(0, 2).map((s) => `Visual: ${s}`),
    v4.launchDaySimulation.launchDayPass
      ? `Launch day ready (${v4.launchDaySimulation.launchDayScore}/100)`
      : '',
    ...v4.launchDaySimulation.launchStrengths.slice(0, 2).map((s) => `Launch: ${s}`),
    v4.adoptionPrediction.adoptionPredictionPass
      ? `Adoption prediction strong (${v4.adoptionPrediction.adoptionPredictionScore}/100)`
      : '',
    ...v4.adoptionPrediction.adoptionStrengths.slice(0, 2).map((s) => `Adoption: ${s}`),
    v4.productEconomics.productEconomicsPass
      ? `Product economics strong (${v4.productEconomics.productEconomicsScore}/100)`
      : '',
    ...v4.productEconomics.highestRoiOpportunities.slice(0, 2).map((o) => `ROI: ${o}`),
    v4.productEvolution.productEvolutionPass
      ? `Product evolution strong (${v4.productEvolution.productEvolutionScore}/100)`
      : '',
    ...v4.productEvolution.recommendedNextInvestments.slice(0, 2).map((o) => `Next: ${o}`),
    ...v4.creationJourney.filter((s) => s.status === 'Exists').map((s) => `${s.stage}: present`),
  ]);

  const whatIsBroken = cap([
    ...v4.founderInteractionSimulation.findings
      .filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
      .map((f) => `[${f.type}] ${f.whatFailed}`),
    ...v4.issues
      .filter((i) => i.severity === 'HIGH' || i.severity === 'BLOCKER')
      .map((i) => `${i.screen}: ${i.problem}`),
    ...v4.realityGaps
      .filter((g) => g.gapType === 'EXECUTION_GAP' || g.gapType === 'LAUNCH_GAP')
      .map((g) => `${g.gapType}: ${g.detail}`),
    v4.verificationResultsVisibilityScore.failCount > 0
      ? `${v4.verificationResultsVisibilityScore.failCount} verification check(s) failing`
      : '',
    !v4.autonomousBuilderReality.canExecuteBuilds
      ? 'Autonomous execution not connected to real builds'
      : '',
    v4.verificationTrustEvidence.blackBoxRisk ? 'Verification may feel like a black box' : '',
    ...v4.customerJourneySimulation.weaknesses.map((w) => `Customer journey: ${w}`),
    v4.customerJourneySimulation.notReadyForCustomers ? 'NOT_READY_FOR_CUSTOMERS — adoption journey too weak' : '',
    ...v4.promiseRealityEngine.unprovenClaims.slice(0, 3).map((c) => `Unproven claim: ${c.claim}`),
    ...v4.promiseRealityEngine.contradictedClaims.map((c) => `Contradicted: ${c.claim}`),
    v4.promiseRealityEngine.majorClaimsUnsupported ? 'Major product claims lack reality support' : '',
    ...v4.visualQualityAuthority.weaknesses.slice(0, 2).map((w) => `Visual: ${w}`),
    v4.visualQualityAuthority.notLaunchReadyAppearance ? 'Launch appearance not ready for real users' : '',
    ...v4.launchDaySimulation.launchWeaknesses.slice(0, 2).map((w) => `Launch day: ${w}`),
    v4.launchDaySimulation.majorLaunchRisks ? 'Major launch-day risks detected' : '',
    ...v4.adoptionPrediction.adoptionWeaknesses.slice(0, 2).map((w) => `Adoption: ${w}`),
    v4.adoptionPrediction.majorAdoptionRisks ? 'Major adoption risks detected' : '',
    ...v4.productEconomics.economicRisks.slice(0, 2).map((r) => `Economics: ${r}`),
    v4.productEconomics.majorEconomicRisks ? 'Major economic risks detected' : '',
    ...v4.productEvolution.doNotBuild.slice(0, 2).map((d) => `Do not build: ${d}`),
    v4.productEvolution.majorEvolutionRisks ? 'Roadmap recommendations lack clear priority' : '',
  ]);

  const whatDoesntMakeSense = cap([
    ...v4.firstTimeUserReality.weaknesses,
    ...v4.founderSensemaking.findings.map((f) => f.whatDoesNotMakeSense),
  ]);

  const whatHurtsTrust = cap([
    ...v4.founderInteractionSimulation.blockedWorkflows.map((f) => f.whatFailed),
    ...v4.founderSensemaking.topTrustRisks.map((f) => f.whatDoesNotMakeSense),
    ...v4.v3.trustEvents.filter((e) => e.type === 'LOSS').map((e) => `${e.source}: ${e.reason}`),
    lr.humanReadiness < 60 && overallFounderScore >= 70
      ? 'High launch score despite low human readiness'
      : '',
  ]);

  const whatChanged = cap([
    ...v4.changeIntelligenceVisibility.recentChanges.slice(0, 4).map((c) => `${c.title}: ${c.description}`),
    v4.changeIntelligenceVisibility.impactSummary.regressionCount > 0
      ? `${v4.changeIntelligenceVisibility.impactSummary.regressionCount} regression(s) detected`
      : '',
    v4.changeIntelligenceVisibility.impactSummary.improvementCount > 0
      ? `${v4.changeIntelligenceVisibility.impactSummary.improvementCount} improvement(s) detected`
      : '',
    v4.changeIntelligenceVisibility.scoreMovementExplanation ?? '',
  ]);

  const recommendedActions = cap([
    ...v4.firstTimeUserReality.recommendedFixes.slice(0, 2),
    ...v4.founderInteractionSimulation.recommendedFixes.slice(0, 2),
    v4.founderActionCenter.recommendedNextStep
      ? `[${v4.founderActionCenter.recommendedNextStep.priority}] ${v4.founderActionCenter.recommendedNextStep.title}`
      : '',
    ...v4.founderActionCenter.topActions.map((a) => `[${a.priority}] ${a.title} — ${a.rationale}`),
    ...v4.recommendedFixOrder.slice(0, 3),
  ]);

  const highestImpactUpgrade =
    v4.founderSensemaking.recommendedUpgrades[0]?.title ??
    v4.founderActionCenter.recommendedNextStep?.title ??
    v4.recommendedFixOrder[0] ??
    null;

  const launchBlockers = cap([
    ...v4.topLaunchRisks,
    ...v4.realityGaps.filter((g) => g.gapType === 'LAUNCH_GAP').map((g) => g.detail),
    !v4.verificationResultsVisibilityScore.launchReady && v4.verificationResultsVisibility.state !== 'NO_VERIFICATION_RUN'
      ? 'Verification does not support launch readiness'
      : '',
    v4.founderActionCenter.blockers.map((b) => b.title).join('; ') || '',
    ...v4.customerJourneySimulation.adoptionBlockers.map((b) => b.whatFails),
    v4.customerJourneySimulation.topAdoptionBlocker ?? '',
    ...v4.promiseRealityEngine.topUnprovenClaims.map((c) => c.claim),
    ...v4.promiseRealityEngine.topContradictions.map((c) => c.claim),
    ...v4.visualQualityAuthority.launchAppearanceRisks.slice(0, 2),
    ...v4.launchDaySimulation.topLaunchBlockers.map((b) => b.explanation),
    ...v4.launchDaySimulation.highestRiskAssumptions.slice(0, 2),
    ...v4.adoptionPrediction.adoptionBlockers.map((b) => b.explanation),
    ...v4.adoptionPrediction.retentionRisks.slice(0, 2),
    ...v4.productEconomics.lowestRoiOpportunities.slice(0, 2),
  ].flatMap((s) => (s.includes(';') ? s.split(';').map((x) => x.trim()) : [s])));

  const finalRecommendation = buildFinalRecommendation(launchRecommendation, launchBlockers);

  return {
    overallFounderScore,
    launchRecommendation,
    whatWorks,
    whatIsBroken,
    whatDoesntMakeSense,
    whatHurtsTrust,
    whatChanged,
    recommendedActions,
    highestImpactUpgrade,
    launchBlockers,
    finalRecommendation,
  };
}

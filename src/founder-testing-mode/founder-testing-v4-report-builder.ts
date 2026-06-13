/**
 * Founder Testing Mode V4 — AIDEVENGINE_FOUNDER_TEST_REPORT_V4 builder.
 */

import { assembleLaunchCouncilFromFounderTestV4, refreshLaunchCouncilWithAdaptiveAutofix } from '../launch-council/launch-council-founder-integration.js';
import { buildSkepticalFounderSimulatorArtifacts } from '../skeptical-founder-simulator/index.js';
import { buildPromiseFulfillmentArtifacts } from '../promise-fulfillment-authority/index.js';
import { buildTrustAuthorityArtifacts } from '../trust-authority/index.js';
import { buildSelfAwarenessAuthorityArtifacts } from '../self-awareness-authority/index.js';
import { buildUserSuccessAuthorityArtifacts } from '../user-success-authority/index.js';
import { buildGapDetectionAuthorityArtifacts } from '../gap-detection-authority/index.js';
import { buildSelfEvolutionAuthorityArtifacts } from '../self-evolution-authority/index.js';
import { buildUnknownDiscoveryAuthorityArtifacts } from '../unknown-discovery-authority/index.js';
import { buildFirstTimeUserRealityAuthorityArtifacts } from '../first-time-user-reality-authority/index.js';
import { buildCustomerValueAuthorityArtifacts } from '../customer-value-authority/index.js';
import { buildCompetitiveRealityAuthorityArtifacts } from '../competitive-reality-authority/index.js';
import { buildRealityProofAuthorityArtifacts } from '../reality-proof-authority/index.js';
import { buildRealUserRealityAuthorityArtifacts } from '../real-user-reality-authority/index.js';
import { buildAdoptionPredictionAuthorityArtifacts } from '../adoption-prediction-authority/index.js';
import { buildLaunchReadinessAuthorityArtifacts } from '../launch-readiness-authority/index.js';
import { buildUIReviewerAuthorityArtifacts } from '../ui-reviewer-authority/index.js';
import { buildClarifyingQuestionIntelligenceArtifacts } from '../clarifying-question-intelligence/index.js';
import { buildLaunchCouncilFinalizationArtifacts } from '../launch-council-finalization/index.js';
import { buildLaunchVerdictGovernanceArtifacts } from '../launch-verdict-governance/index.js';
import { buildAdaptiveAutofixIntelligenceArtifacts } from '../adaptive-autofix-intelligence/index.js';
import { FOUNDER_TEST_V4_REPORT_TITLE } from './founder-testing-v4-bounds.js';
import type {
  FounderTestV4Report,
  FounderTestV4ReportCore,
  FounderTestV4ReportForLaunchCouncil,
  FounderTestV4ReportWithLaunchCouncil,
  FounderTestV4ReportWithLaunchCouncilFinalization,
  FounderTestV4ReportWithLaunchVerdictGovernance,
  FounderTestV4ReportWithAdaptiveAutofix,
  FounderTestV4ReportWithUiReviewer,
  FounderTestV4ReportWithClarifyingQuestion,
  FounderTestV4ReportWithCompetitiveReality,
  FounderTestV4ReportWithRealityProof,
  FounderTestV4ReportWithAdoptionPrediction,
  FounderTestV4ReportWithRealUserReality,
  FounderTestV4ReportWithCustomerValue,
  FounderTestV4ReportWithFirstTimeUser,
  FounderTestV4ReportWithGapDetection,
  FounderTestV4ReportWithPromise,
  FounderTestV4ReportWithSelfAwareness,
  FounderTestV4ReportWithSelfEvolution,
  FounderTestV4ReportWithSkeptical,
  FounderTestV4ReportWithTrust,
  FounderTestV4ReportWithUnknownDiscovery,
  FounderTestV4ReportWithUserSuccess,
} from './founder-testing-v4-types.js';

export function buildFounderTestV4ReportMarkdown(report: Omit<FounderTestV4Report, 'reportMarkdown'>): string {
  const date = new Date(report.generatedAt).toISOString();
  const lr = report.launchReadinessReality;

  return `# ${FOUNDER_TEST_V4_REPORT_TITLE}

Generated: ${date}
Report ID: ${report.reportId}
Duration: ${report.durationMs}ms
Mode: Founder Testing V4 (execution reality, read-only)

## Executive Summary

V4 answers: **Can AiDevEngine actually deliver what it promises?** **Verdict: ${report.verdict}**. Launch readiness reality: **${lr.launchReadinessRealityScore}/100**. Execution readiness: **${lr.executionReadiness}/100**.

## Technical Readiness

**${lr.technicalReadiness}/100**

## Product Readiness

**${lr.productReadiness}/100**

## Execution Readiness

**${lr.executionReadiness}/100** — creation journey ${report.creationJourneyScore}/100, idea-to-app ${report.ideaToAppScore}/100

## Idea-to-App Results

${report.ideaToAppResults.map((r) => `- **${r.prompt}** — score ${r.ideaToAppScore}${r.issues.length ? ` — ${r.issues.join('; ')}` : ''}`).join('\n')}

## Creation Journey Results

Score: **${report.creationJourneyScore}/100**

${report.creationJourney.map((s) => `- **${s.stage}**: ${s.status} — ${s.evidence}`).join('\n')}

## Autonomous Builder Reality

Score: **${report.autonomousBuilderReality.score}/100**

${report.autonomousBuilderReality.honestyNote}

| Capability | Reality |
|------------|---------|
| Plan work | ${report.autonomousBuilderReality.canPlanWork ? 'Yes' : 'No'} |
| Create requirements | ${report.autonomousBuilderReality.canCreateRequirements ? 'Yes' : 'No'} |
| Create architecture | ${report.autonomousBuilderReality.canCreateArchitecture ? 'Yes' : 'No'} |
| Create tasks | ${report.autonomousBuilderReality.canCreateTasks ? 'Yes' : 'No'} |
| Coordinate systems | ${report.autonomousBuilderReality.canCoordinateSystems ? 'Yes' : 'No'} |
| Create previews | ${report.autonomousBuilderReality.canCreatePreviews ? 'Yes' : 'No'} |
| Execute builds | ${report.autonomousBuilderReality.canExecuteBuilds ? 'Yes' : 'No'} |
| Verify outputs | ${report.autonomousBuilderReality.canVerifyOutputs ? 'Yes' : 'No'} |

## Project Memory Reality

Score: **${report.projectMemoryReality.score}/100**

## Preview Reality

Score: **${report.previewReality.score}/100**

State: **${report.previewReality.state}**

| Check | Pass |
| --- | --- |
| Preview exists (openable) | ${report.previewReality.existsPass ? 'Yes' : 'No'} |
| Preview loads | ${report.previewReality.loadsPass ? 'Yes' : 'No'} |
| Preview interactive | ${report.previewReality.interactivePass ? 'Yes' : 'No'} |
| Preview current | ${report.previewReality.currentPass ? 'Yes' : 'No'} |
| Preview validation ready | ${report.previewReality.validationReadyPass ? 'Yes' : 'No'} |

${report.previewReality.problems.length ? `Problems: ${report.previewReality.problems.join('; ')}` : ''}

## Running Application Visibility

Score: **${report.runningAppVisibility.score}/100**

Running app: **${report.runningAppVisibility.runningAppTitle}**

Output state: **${report.runningAppVisibility.outputState}**

| Check | Pass |
| --- | --- |
| Active application identifiable | ${report.runningAppVisibility.identifiablePass ? 'Yes' : 'No'} |
| Output state explicit | ${report.runningAppVisibility.outputStateExplicitPass ? 'Yes' : 'No'} |
| Build output visible | ${report.runningAppVisibility.buildOutputVisiblePass ? 'Yes' : 'No'} |
| Request alignment honest | ${report.runningAppVisibility.alignmentHonestPass ? 'Yes' : 'No'} |
| Test readiness explicit | ${report.runningAppVisibility.testReadinessExplicitPass ? 'Yes' : 'No'} |
| Ready for testing | ${report.runningAppVisibility.readyForTestingPass ? 'Yes' : 'No'} |

Alignment: ${report.runningAppVisibility.requestAlignment} — ${report.runningAppVisibility.alignmentReason}

Testing status: ${report.runningAppVisibility.testReadiness} — ${report.runningAppVisibility.testReadinessReason}

${report.runningAppVisibility.warnings.length ? `Warnings: ${report.runningAppVisibility.warnings.join('; ')}` : ''}

## Verification Results Visibility

Score: **${report.verificationResultsVisibilityScore.score}/100**

State: **${report.verificationResultsVisibility.state}**

Readiness: **${report.verificationResultsVisibility.summary.readinessScore}/100**

Passed: ${report.verificationResultsVisibility.summary.passCount} | Failed: ${report.verificationResultsVisibility.summary.failCount} | Blocked: ${report.verificationResultsVisibility.summary.blockedCount} | Warnings: ${report.verificationResultsVisibility.summary.warningCount}

Beta ready: ${report.verificationResultsVisibility.betaReady ? 'Yes' : 'No'} — ${report.verificationResultsVisibility.betaReadyReason}

Launch ready: ${report.verificationResultsVisibility.launchReady ? 'Yes' : 'No'} — ${report.verificationResultsVisibility.launchReadyReason}

${report.verificationResultsVisibility.fixesNext.slice(0, 5).map((f, i) => `${i + 1}. ${f.title} (${f.priority}): ${f.recommendedAction}`).join('\n')}

## Change Intelligence Visibility

Score: **${report.changeIntelligenceVisibilityScore.score}/100**

History sufficient: ${report.changeIntelligenceVisibility.hasSufficientHistory ? 'Yes' : 'No'}

Improvements: ${report.changeIntelligenceVisibility.impactSummary.improvementCount} | Regressions: ${report.changeIntelligenceVisibility.impactSummary.regressionCount}

${report.changeIntelligenceVisibility.scoreMovementExplanation ?? 'No score movement explanation yet.'}

${report.changeIntelligenceVisibility.readinessMovementExplanation ?? 'No readiness movement explanation yet.'}

## Founder Action Center

Score: **${report.founderActionCenterVisibilityScore.score}/100**

State: **${report.founderActionCenter.state}** — ${report.founderActionCenter.stateLabel}

${report.founderActionCenter.recommendedNextStep ? `Recommended next step (${report.founderActionCenter.recommendedNextStep.priority}): ${report.founderActionCenter.recommendedNextStep.title}\nReason: ${report.founderActionCenter.recommendedNextStep.reason}\nExpected impact: ${report.founderActionCenter.recommendedNextStep.expectedImpact}` : 'No recommended next step yet.'}

Top actions:
${report.founderActionCenter.topActions.slice(0, 5).map((a, i) => `${i + 1}. [${a.priority}] ${a.title} — ${a.rationale}`).join('\n') || 'None'}

Blockers:
${report.founderActionCenter.blockers.map((b) => `- ${b.title}: ${b.impact}`).join('\n') || 'None'}

## Founder Interaction Simulation

Interaction score: **${report.founderInteractionSimulation.interactionScore}/100**

Tested: ${report.founderInteractionSimulation.testedInteractions} | Passed: ${report.founderInteractionSimulation.passedInteractions}

Modal close regression: ${report.founderInteractionSimulation.modalCloseRegressionPass ? 'PASS' : 'FAIL'}

Failures:
${report.founderInteractionSimulation.findings.slice(0, 6).map((f) => `- [${f.severity}] ${f.whatFailed} — ${f.recommendedFix}`).join('\n') || 'None'}

## First-Time User Reality

First-Time User Score: **${report.firstTimeUserReality.firstTimeUserScore}/100**

Understanding: ${report.firstTimeUserReality.categoryScores.understanding}/100 | Navigation: ${report.firstTimeUserReality.categoryScores.navigation}/100 | Workflow: ${report.firstTimeUserReality.categoryScores.workflow}/100

Strengths:
${report.firstTimeUserReality.strengths.map((s) => `- ${s}`).join('\n') || 'None'}

Weaknesses:
${report.firstTimeUserReality.weaknesses.map((w) => `- ${w}`).join('\n') || 'None'}

Top confusion risk: ${report.firstTimeUserReality.topConfusionRisk ?? 'None'}

## Customer Journey Simulation

Customer Journey Score: **${report.customerJourneySimulation.customerJourneyScore}/100**

Discovery: ${report.customerJourneySimulation.subscores.discovery}/100 | Onboarding: ${report.customerJourneySimulation.subscores.onboarding}/100 | Value: ${report.customerJourneySimulation.subscores.value}/100

Trust: ${report.customerJourneySimulation.subscores.trust}/100 | Retention: ${report.customerJourneySimulation.subscores.retention}/100 | Advocacy: ${report.customerJourneySimulation.subscores.advocacy}/100

Customer ready: ${report.customerJourneySimulation.customerReady ? 'Yes' : 'No'} | Not ready for customers: ${report.customerJourneySimulation.notReadyForCustomers ? 'Yes' : 'No'}

Strengths:
${report.customerJourneySimulation.strengths.map((s) => `- ${s}`).join('\n') || 'None'}

Weaknesses:
${report.customerJourneySimulation.weaknesses.map((w) => `- ${w}`).join('\n') || 'None'}

Top adoption blocker: ${report.customerJourneySimulation.topAdoptionBlocker ?? 'None'}

## Promise Reality Engine

Promise Reality Score: **${report.promiseRealityEngine.promiseRealityScore}/100**

Execution Gap Score: **${report.promiseRealityEngine.executionGapScore}/100** (lower is better)

Reality Confidence: **${report.promiseRealityEngine.realityConfidence}/100**

Proven claims:
${report.promiseRealityEngine.provenClaims.map((c) => `- ${c.claim}: ${c.evidence}`).join('\n') || 'None'}

Unproven claims:
${report.promiseRealityEngine.unprovenClaims.map((c) => `- ${c.claim}: ${c.whyUnproven ?? c.evidence}`).join('\n') || 'None'}

Contradicted claims:
${report.promiseRealityEngine.contradictedClaims.map((c) => `- [${c.severity}] ${c.claim}: ${c.contradictingEvidence ?? c.evidence}`).join('\n') || 'None'}

## Visual Quality Authority

Visual Quality Score: **${report.visualQualityAuthority.visualQualityScore}/100**

Launch appearance confidence: **${report.visualQualityAuthority.launchAppearanceConfidence}/100**

Strengths:
${report.visualQualityAuthority.strengths.map((s) => `- ${s}`).join('\n') || 'None'}

Weaknesses:
${report.visualQualityAuthority.weaknesses.map((w) => `- ${w}`).join('\n') || 'None'}

Launch appearance risks:
${report.visualQualityAuthority.launchAppearanceRisks.map((r) => `- ${r}`).join('\n') || 'None'}

## Launch Day Simulation

Launch Day Score: **${report.launchDaySimulation.launchDayScore}/100**

Launch confidence: **${report.launchDaySimulation.launchConfidence}/100**

Top launch blockers:
${report.launchDaySimulation.topLaunchBlockers.map((b) => `- [${b.severity}] ${b.explanation}`).join('\n') || 'None'}

Highest-risk assumptions:
${report.launchDaySimulation.highestRiskAssumptions.map((a) => `- ${a}`).join('\n') || 'None'}

## Adoption Prediction

Adoption Prediction Score: **${report.adoptionPrediction.adoptionPredictionScore}/100**

Adoption confidence: **${report.adoptionPrediction.adoptionConfidence}/100**

Value Clarity: ${report.adoptionPrediction.subscores.valueClarity}/100 | Time-to-Value: ${report.adoptionPrediction.subscores.timeToValue}/100 | Adoption Friction: ${report.adoptionPrediction.subscores.adoptionFriction}/100

Retention Potential: ${report.adoptionPrediction.subscores.retentionPotential}/100 | Recommendation Potential: ${report.adoptionPrediction.subscores.recommendationPotential}/100 | Competitive Pressure: ${report.adoptionPrediction.subscores.competitivePressure}/100

Strengths:
${report.adoptionPrediction.adoptionStrengths.map((s) => `- ${s}`).join('\n') || 'None'}

Weaknesses:
${report.adoptionPrediction.adoptionWeaknesses.map((w) => `- ${w}`).join('\n') || 'None'}

Adoption blockers:
${report.adoptionPrediction.adoptionBlockers.map((b) => `- [${b.severity}] ${b.explanation}`).join('\n') || 'None'}

Retention risks:
${report.adoptionPrediction.retentionRisks.map((r) => `- ${r}`).join('\n') || 'None'}

Recommendation risks:
${report.adoptionPrediction.recommendationRisks.map((r) => `- ${r}`).join('\n') || 'None'}

Competitive risks:
${report.adoptionPrediction.competitiveRisks.map((r) => `- ${r}`).join('\n') || 'None'}

## Product Economics

Product Economics Score: **${report.productEconomics.productEconomicsScore}/100**

User Value: ${report.productEconomics.subscores.userValue}/100 | Founder Value: ${report.productEconomics.subscores.founderValue}/100 | Build Cost: ${report.productEconomics.subscores.buildCost}/100

Maintenance Cost: ${report.productEconomics.subscores.maintenanceCost}/100 | Adoption Impact: ${report.productEconomics.subscores.adoptionImpact}/100 | Strategic Value: ${report.productEconomics.subscores.strategicValue}/100

Summary: ${report.productEconomics.productEconomicsSummary}

Highest ROI:
${report.productEconomics.highestRoiOpportunities.map((o) => `- ${o}`).join('\n') || 'None'}

Lowest ROI:
${report.productEconomics.lowestRoiOpportunities.map((o) => `- ${o}`).join('\n') || 'None'}

Economic risks:
${report.productEconomics.economicRisks.map((r) => `- ${r}`).join('\n') || 'None'}

## Product Evolution

Product Evolution Score: **${report.productEvolution.productEvolutionScore}/100**

Adoption Growth: ${report.productEvolution.portfolioSubscores.adoptionGrowth}/100 | Friction Reduction: ${report.productEvolution.portfolioSubscores.frictionReduction}/100 | Trust Improvement: ${report.productEvolution.portfolioSubscores.trustImprovement}/100

Quality Improvement: ${report.productEvolution.portfolioSubscores.qualityImprovement}/100 | Strategic Leverage: ${report.productEvolution.portfolioSubscores.strategicLeverage}/100 | Execution Efficiency: ${report.productEvolution.portfolioSubscores.executionEfficiency}/100

Summary: ${report.productEvolution.productEvolutionSummary}

Recommended next investments:
${report.productEvolution.recommendedNextInvestments.map((o) => `- ${o}`).join('\n') || 'None'}

Quick wins:
${report.productEvolution.quickWins.map((o) => `- ${o}`).join('\n') || 'None'}

Do not build:
${report.productEvolution.doNotBuild.map((o) => `- ${o}`).join('\n') || 'None'}

## Competitive Reality

Competitive Reality Score: **${report.competitiveReality.competitiveRealityScore}/100**

Position: **${report.competitiveReality.competitivePosition.replace(/_/g, ' ')}**

Differentiation Strength: ${report.competitiveReality.portfolioSubscores.differentiationStrength}/100 | Replacement Risk: ${report.competitiveReality.portfolioSubscores.replacementRisk}/100 (lower is better)

Founder Advantage: ${report.competitiveReality.portfolioSubscores.founderAdvantage}/100 | Product Advantage: ${report.competitiveReality.portfolioSubscores.productAdvantage}/100

Strategic Defensibility: ${report.competitiveReality.portfolioSubscores.strategicDefensibility}/100 | Blind Spot Risk: ${report.competitiveReality.portfolioSubscores.blindSpotRisk}/100

Summary: ${report.competitiveReality.competitiveRealitySummary}

Strongest advantages:
${report.competitiveReality.strongestCompetitiveAdvantages.map((a) => `- ${a}`).join('\n') || 'None'}

Weakest advantages:
${report.competitiveReality.weakestCompetitiveAdvantages.map((a) => `- ${a}`).join('\n') || 'None'}

High replacement risks:
${report.competitiveReality.highReplacementRisks.map((r) => `- ${r}`).join('\n') || 'None'}

Strategic defensibility:
${report.competitiveReality.strategicDefensibility.map((d) => `- ${d}`).join('\n') || 'None'}

Competitive blind spots:
${report.competitiveReality.competitiveBlindSpots.map((b) => `- ${b}`).join('\n') || 'None'}

Unproven competitive claims:
${report.competitiveReality.unprovenCompetitiveClaims.map((c) => `- ${c}`).join('\n') || 'None'}

## Founder Decision Readiness

Decision Readiness Score: **${report.founderDecisionReadiness.decisionReadinessScore}/100**

Primary Recommendation: **${report.founderDecisionReadiness.primaryRecommendation.replace(/_/g, ' ')}**

Decision Confidence: **${report.founderDecisionReadiness.decisionConfidence}**

Launch Readiness: ${report.founderDecisionReadiness.portfolioSubscores.launchReadiness}/100 | Adoption Readiness: ${report.founderDecisionReadiness.portfolioSubscores.adoptionReadiness}/100

Trust Readiness: ${report.founderDecisionReadiness.portfolioSubscores.trustReadiness}/100 | Product Readiness: ${report.founderDecisionReadiness.portfolioSubscores.productReadiness}/100

Strategic Readiness: ${report.founderDecisionReadiness.portfolioSubscores.strategicReadiness}/100 | Founder Readiness: ${report.founderDecisionReadiness.portfolioSubscores.founderReadiness}/100

Why this recommendation:
${report.founderDecisionReadiness.whyThisRecommendation}

Supporting evidence:
${report.founderDecisionReadiness.supportingEvidence.map((e) => `- ${e}`).join('\n') || 'None'}

Blocking evidence:
${report.founderDecisionReadiness.blockingEvidence.map((e) => `- ${e}`).join('\n') || 'None'}

Recommended next actions:
${report.founderDecisionReadiness.recommendedNextActions.map((a) => `- ${a}`).join('\n') || 'None'}

Summary: ${report.founderDecisionReadiness.decisionReadinessSummary}

## Digital Founder Board

Board Status: **${report.digitalFounderBoard.boardStatus.replace(/_/g, ' ')}**

Summary: ${report.digitalFounderBoard.digitalFounderBoardSummary}

### Executive Summary

Founder Decision: **${report.digitalFounderBoard.executiveSummary.founderDecision.replace(/_/g, ' ')}**

Decision Confidence: **${report.digitalFounderBoard.executiveSummary.decisionConfidence}**

Why: ${report.digitalFounderBoard.executiveSummary.whyThisRecommendation}

Top next actions:
${report.digitalFounderBoard.executiveSummary.topNextActions.map((a) => `- ${a}`).join('\n') || 'None'}

### Product Health

Launch: ${report.digitalFounderBoard.productHealth.launchReadiness}/100 | Adoption: ${report.digitalFounderBoard.productHealth.adoptionReadiness}/100 | Trust: ${report.digitalFounderBoard.productHealth.trustReadiness}/100

Product: ${report.digitalFounderBoard.productHealth.productReadiness}/100 | Strategic: ${report.digitalFounderBoard.productHealth.strategicReadiness}/100 | Founder: ${report.digitalFounderBoard.productHealth.founderReadiness}/100

### Risk Board

Highest priority risks:
${report.digitalFounderBoard.riskBoard.highestPriorityRisks.map((r) => `- ${r}`).join('\n') || 'None'}

Blocking evidence:
${report.digitalFounderBoard.riskBoard.blockingEvidence.map((e) => `- ${e}`).join('\n') || 'None'}

### Opportunity Board

Quick wins:
${report.digitalFounderBoard.opportunityBoard.quickWins.map((o) => `- ${o}`).join('\n') || 'None'}

Strategic investments:
${report.digitalFounderBoard.opportunityBoard.strategicInvestments.map((o) => `- ${o}`).join('\n') || 'None'}

Highest ROI:
${report.digitalFounderBoard.opportunityBoard.highestRoiOpportunities.map((o) => `- ${o}`).join('\n') || 'None'}

### Competitive Position

Classification: **${report.digitalFounderBoard.competitivePosition.competitiveClassification}**

Strongest advantages:
${report.digitalFounderBoard.competitivePosition.strongestAdvantages.map((a) => `- ${a}`).join('\n') || 'None'}

Replacement risks:
${report.digitalFounderBoard.competitivePosition.replacementRisks.map((r) => `- ${r}`).join('\n') || 'None'}

### Trust & Validation

Verification Trust: ${report.digitalFounderBoard.trustValidation.verificationTrustScore}/100 | Promise Reality: ${report.digitalFounderBoard.trustValidation.promiseRealityScore}/100

Reality confidence: ${report.digitalFounderBoard.trustValidation.realityConfidence}

Unproven claims:
${report.digitalFounderBoard.trustValidation.unprovenClaims.map((c) => `- ${c}`).join('\n') || 'None'}

### Roadmap Intelligence

Build next:
${report.digitalFounderBoard.roadmapIntelligence.buildNext.map((b) => `- ${b}`).join('\n') || 'None'}

Build later:
${report.digitalFounderBoard.roadmapIntelligence.buildLater.map((b) => `- ${b}`).join('\n') || 'None'}

Do not build:
${report.digitalFounderBoard.roadmapIntelligence.doNotBuild.map((b) => `- ${b}`).join('\n') || 'None'}

Recommended actions:
${report.digitalFounderBoard.recommendedActions.map((a) => `- ${a}`).join('\n') || 'None'}

## Founder Sensemaking / Product Coherence

Founder Sensemaking Score: **${report.founderSensemaking.founderSensemakingScore}/100**

Product Coherence Score: **${report.founderSensemaking.productCoherenceScore}/100**

Visibility score: **${report.founderSensemakingVisibilityScore.score}/100**

Top confusion risks:
${report.founderSensemaking.topConfusionRisks.map((f) => `- [${f.severity}] ${f.whatDoesNotMakeSense}`).join('\n') || 'None'}

Top contradictions:
${report.founderSensemaking.topContradictions.map((f) => `- [${f.severity}] ${f.whatDoesNotMakeSense}`).join('\n') || 'None'}

Top trust risks:
${report.founderSensemaking.topTrustRisks.map((f) => `- [${f.severity}] ${f.whatDoesNotMakeSense}`).join('\n') || 'None'}

Recommended upgrades:
${report.founderSensemaking.recommendedUpgrades.slice(0, 5).map((u, i) => `${i + 1}. [${u.priority}] ${u.title} — ${u.expectedImpact}`).join('\n') || 'None'}

## Verification Reality

Score: **${report.verificationReality.score}/100**

## Founder Outcome Simulation

**Goal:** ${report.founderOutcome.goal}

${report.founderOutcome.whatHappensToday}

- Succeeds: ${report.founderOutcome.succeeds.join('; ') || 'none'}
- Fails: ${report.founderOutcome.fails.join('; ') || 'none'}
- Manual work: ${report.founderOutcome.requiresManualWork.join('; ')}
- Value delivered today: ${report.founderOutcome.valueDelivered ? 'Partial' : 'Limited'}

## Customer Outcome Simulation

**Goal:** ${report.customerOutcome.goal}

${report.customerOutcome.whatHappensToday}

- Value delivered today: ${report.customerOutcome.valueDelivered ? 'Partial' : 'Limited'}

## Promise Reality Matrix

${report.promiseMatrix.map((p) => `- **${p.label}**: ${p.support} — ${p.evidence}`).join('\n')}

## Reality Gaps

${report.realityGaps.map((g) => `- [${g.gapType}] ${g.promise} → ${g.reality}`).join('\n')}

## Top Product Risks

${report.topProductRisks.map((r) => `- ${r}`).join('\n')}

## Top Launch Risks

${report.topLaunchRisks.map((r) => `- ${r}`).join('\n')}

## Launch Readiness

| Dimension | Score |
|-----------|-------|
| Technical | ${lr.technicalReadiness} |
| Product | ${lr.productReadiness} |
| Human | ${lr.humanReadiness} |
| Execution | ${lr.executionReadiness} |
| Promise Alignment | ${lr.promiseAlignment} |
| **Launch Readiness Reality** | **${lr.launchReadinessRealityScore}** |

## Chat Intelligence Reality

Chat Intelligence Score: **${report.chatIntelligenceReality.chatIntelligenceScore}/100**

Chat Launch Verdict: **${report.chatIntelligenceReality.chatLaunchVerdict}**

Blocks launch readiness: **${report.chatIntelligenceReality.blocksLaunchReadiness ? 'Yes' : 'No'}**

Scenarios passed: ${report.chatIntelligenceReality.scenariosPassed}/${report.chatIntelligenceReality.scenariosRun}

${report.chatIntelligenceReality.founderProofNotes.map((n) => `- ${n}`).join('\n')}

${report.chatIntelligenceReality.operationalSelfAwarenessStandard}

### Failed Chat Scenarios

${report.chatIntelligenceReality.failedScenarios.length ? report.chatIntelligenceReality.failedScenarios.map((s) => `- **"${s.prompt}"** — ${s.whyFailed.join('; ') || 'Criteria not met'}`).join('\n') : 'None — all bounded scenarios passed.'}

### Required Fixes Before Launch

${report.chatIntelligenceReality.requiredFixesBeforeLaunch.length ? report.chatIntelligenceReality.requiredFixesBeforeLaunch.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'None identified.'}

### Chat Self-Evolution Trigger

Triggered: ${report.chatIntelligenceReality.selfEvolution.triggered ? 'Yes' : 'No'} | Launch blocked by evolution: ${report.chatIntelligenceReality.selfEvolution.launchBlocked ? 'Yes' : 'No'}

${report.chatIntelligenceReality.selfEvolution.improvementPlan.length ? report.chatIntelligenceReality.selfEvolution.improvementPlan.map((step) => `- [${step.priority}] ${step.missingCapability}: ${step.action}`).join('\n') : 'No repeated category failures reached threshold.'}

### Chat Cognitive Architecture & Self-Diagnosis

Cognitive score: **${report.chatIntelligenceReality.cognitiveArchitecture.cognitiveScore}/100**

Reviewer reliability: **${report.chatIntelligenceReality.cognitiveArchitecture.reviewerReliability}**

${report.chatIntelligenceReality.cognitiveArchitecture.founderTestingMessage ? `**${report.chatIntelligenceReality.cognitiveArchitecture.founderTestingMessage}**` : 'Cognitive reviewer meets reliability threshold.'}

Generic fallback violations: ${report.chatIntelligenceReality.cognitiveArchitecture.genericFallbackViolations}

Self-awareness failures: ${report.chatIntelligenceReality.cognitiveArchitecture.selfAwarenessFailures}

Capability overclaim failures: ${report.chatIntelligenceReality.cognitiveArchitecture.capabilityOverclaimFailures}

Software reasoning failures: ${report.chatIntelligenceReality.cognitiveArchitecture.softwareReasoningFailures}

Self-evolution required: **${report.chatIntelligenceReality.cognitiveArchitecture.selfEvolutionRequired ? 'Yes' : 'No'}**

Cognitive scenarios passed: ${report.chatIntelligenceReality.cognitiveArchitecture.scenariosPassed}/${report.chatIntelligenceReality.cognitiveArchitecture.scenariosRun}

${report.chatIntelligenceReality.cognitiveArchitecture.missingKnowledgeCategories.length ? `Missing knowledge categories:\n${report.chatIntelligenceReality.cognitiveArchitecture.missingKnowledgeCategories.map((c) => `- ${c}`).join('\n')}` : ''}

## Repository Typecheck Reality

Readiness state: **${report.repositoryTypecheckReality.readinessState}**

Typecheck clean: **${report.repositoryTypecheckReality.typecheckClean ? 'Yes' : 'No'}**

Blocks launch readiness: **${report.repositoryTypecheckReality.blocksLaunchReadiness ? 'Yes' : 'No'}**

Errors: ${report.repositoryTypecheckReality.errorCount} | Warnings: ${report.repositoryTypecheckReality.warningCount}

${report.repositoryTypecheckReality.founderProofNotes.map((n) => `- ${n}`).join('\n')}

### Typecheck Findings

${report.repositoryTypecheckReality.findings.length ? report.repositoryTypecheckReality.findings.map((f) => `- **${f.file}:${f.line}:${f.column}** [${f.code}] ${f.message}`).join('\n') : 'No compile findings recorded.'}

### Required Repository Fixes

${report.repositoryTypecheckReality.recommendations.length ? report.repositoryTypecheckReality.recommendations.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'Repository typecheck baseline is clean.'}

## Recommended Fix Order

${report.recommendedFixOrder.map((line, i) => `${i + 1}. ${line}`).join('\n')}

## Copy-Paste Fix Prompts

${report.copyPasteFixPrompts.map((p, i) => `### Fix ${i + 1}\n\`\`\`\n${p}\n\`\`\``).join('\n\n')}

## V3 Summary (reference)

V3 verdict: ${report.v3.verdict} | Trust: ${report.v3.trustScore}

## Launch Council (Advisory)

Readiness state: **${report.launchCouncil.readinessState}**

Confidence score: **${report.launchCouncil.confidenceScore}/100**

Overall council score: **${report.launchCouncil.overallScore}/100**

Launch blockers: ${report.launchCouncil.launchBlockerCount}

${report.launchCouncilReport.summary}

Participating authorities: ${report.launchCouncil.participatingAuthorities}

## Skeptical Founder Simulator

Score: **${report.skepticalFounderSimulator.skepticalFounderScore}/100**

Launch risk: **${report.skepticalFounderSimulator.launchRiskScore}/100**

Readiness state: **${report.skepticalFounderSimulator.readinessState}**

Blocks launch readiness: **${report.skepticalFounderSimulator.blocksLaunchReadiness ? 'Yes' : 'No'}**

Objections: ${report.skepticalFounderSimulator.objectionCount}

${report.skepticalFounderSimulator.objections.slice(0, 5).map((objection) => `- ${objection}`).join('\n') || '- None recorded.'}

Recommendations:

${report.skepticalFounderSimulator.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Maintain visible proof for every launch claim.'}

## Promise Fulfillment

Score: **${report.promiseFulfillment.fulfillmentScore}/100**

Fulfilled: **${report.promiseFulfillment.fulfilledCount}** | Partial: **${report.promiseFulfillment.partiallyFulfilledCount}** | Unproven: **${report.promiseFulfillment.unprovenCount}** | Contradicted: **${report.promiseFulfillment.contradictedCount}**

Readiness state: **${report.promiseFulfillment.readinessState}**

Blocks launch readiness: **${report.promiseFulfillment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Does reality support our claims? Review contradicted and unproven promises before launch.

${report.promiseFulfillment.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If reality cannot prove the claim, treat the claim as not fulfilled.'}

## Trust Authority

Trust score: **${report.trustAuthority.trustScore}/100**

Risk score: **${report.trustAuthority.trustRiskScore}/100**

Critical failures: **${report.trustAuthority.criticalTrustFailures}**

Readiness state: **${report.trustAuthority.readinessState}**

Blocks launch readiness: **${report.trustAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Can users trust this? What evidence supports this? What uncertainty exists?

${report.trustAuthority.trustRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

Recommendations:

${report.trustAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If users cannot trust the evidence behind a claim, the claim should not be trusted.'}

## Self-Awareness Authority

Self-awareness score: **${report.selfAwarenessAuthority.selfAwarenessScore}/100**

Risk score: **${report.selfAwarenessAuthority.selfAwarenessRiskScore}/100**

Critical failures: **${report.selfAwarenessAuthority.criticalAwarenessFailures}**

Readiness state: **${report.selfAwarenessAuthority.readinessState}**

Blocks launch readiness: **${report.selfAwarenessAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What can we actually do? What can we not do? What blocks launch?

${report.selfAwarenessAuthority.limitations.slice(0, 5).map((limitation) => `- ${limitation}`).join('\n') || '- None recorded.'}

Recommendations:

${report.selfAwarenessAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A system cannot judge readiness accurately if it does not understand its own reality.'}

## User Success Authority

User success score: **${report.userSuccessAuthority.userSuccessScore}/100**

Outcome achievement score: **${report.userSuccessAuthority.outcomeAchievementScore}/100**

Critical failures: **${report.userSuccessAuthority.criticalSuccessFailures}**

Readiness state: **${report.userSuccessAuthority.readinessState}**

Blocks launch readiness: **${report.userSuccessAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Can users achieve their goals? Can users make progress?

${report.userSuccessAuthority.blockers.slice(0, 5).map((blocker) => `- ${blocker}`).join('\n') || '- None recorded.'}

Recommendations:

${report.userSuccessAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. The product succeeds only when users succeed.'}

## Gap Detection Authority

Gap detection score: **${report.gapDetectionAuthority.gapDetectionScore}/100**

Critical gaps: **${report.gapDetectionAuthority.criticalGapCount}**

High gaps: **${report.gapDetectionAuthority.highGapCount}**

Total gaps: **${report.gapDetectionAuthority.totalGaps}**

Readiness state: **${report.gapDetectionAuthority.readinessState}**

Blocks launch readiness: **${report.gapDetectionAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What capability is missing? What prevents success?

${report.gapDetectionAuthority.detectedGaps.filter((gap) => gap.severity === 'CRITICAL' || gap.severity === 'HIGH').slice(0, 5).map((gap) => `- [${gap.severity}] ${gap.title}: ${gap.description}`).join('\n') || '- None recorded.'}

Recommendations:

${report.gapDetectionAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A problem is not understood until the missing capability causing it is identified.'}

## Self-Evolution Authority

Self-Evolution Score: **${report.selfEvolutionAuthority.selfEvolutionScore}/100**

Repeated Failures: **${report.selfEvolutionAuthority.repeatedFailureCount}**

Required Evolutions: **${report.selfEvolutionAuthority.evolutionRequiredCount}**

Blocked Evolutions: **${report.selfEvolutionAuthority.blockedEvolutionCount}**

Readiness state: **${report.selfEvolutionAuthority.readinessState}**

Blocks launch readiness: **${report.selfEvolutionAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What keeps failing? What should evolve next?

${report.selfEvolutionAuthority.patterns.slice(0, 5).map((pattern) => `- [${pattern.status}] ${pattern.failureSignal} → ${pattern.recommendedEvolution}`).join('\n') || '- None recorded.'}

Recommendations:

${report.selfEvolutionAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If the same problem keeps appearing, identify what must evolve.'}

## Unknown Discovery Authority

Unknown Discovery Score: **${report.unknownDiscoveryAuthority.unknownDiscoveryScore}/100**

Findings: **${report.unknownDiscoveryAuthority.findingCount}**

Critical Findings: **${report.unknownDiscoveryAuthority.criticalFindingCount}**

High Findings: **${report.unknownDiscoveryAuthority.highFindingCount}**

Readiness state: **${report.unknownDiscoveryAuthority.readinessState}**

Blocks launch readiness: **${report.unknownDiscoveryAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What are we not testing? What blind spots remain?

${report.unknownDiscoveryAuthority.findings.filter((finding) => finding.severity === 'CRITICAL' || finding.severity === 'HIGH').slice(0, 5).map((finding) => `- [${finding.severity}] ${finding.title}: ${finding.description}`).join('\n') || '- None recorded.'}

Recommended New Tests:

${report.unknownDiscoveryAuthority.recommendedTests.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Expand bounded discovery tests for adjacent blind spots.'}

Recommendations:

${report.unknownDiscoveryAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. The system must look for what its current tests may be missing.'}

## First-Time User Reality Authority

First-Time User Score: **${report.firstTimeUserRealityAuthority.firstTimeUserScore}/100**

Confusion Score: **${report.firstTimeUserRealityAuthority.confusionScore}/100**

Critical Confusion: **${report.firstTimeUserRealityAuthority.criticalConfusionCount}**

User Blockers: **${report.firstTimeUserRealityAuthority.blockerCount}**

Readiness state: **${report.firstTimeUserRealityAuthority.readinessState}**

Blocks launch readiness: **${report.firstTimeUserRealityAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What would a new user misunderstand? What would stop onboarding?

${report.firstTimeUserRealityAuthority.confusionPoints.slice(0, 5).map((point) => `- ${point}`).join('\n') || '- None recorded.'}

Recommendations:

${report.firstTimeUserRealityAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If a first-time user cannot understand the product, the product is not ready for widespread adoption.'}

## Customer Value Authority

Customer Value Score: **${report.customerValueAuthority.customerValueScore}/100**

Retention Value Score: **${report.customerValueAuthority.retentionValueScore}/100**

Value Risk Score: **${report.customerValueAuthority.valueRiskScore}/100**

Critical Value Failures: **${report.customerValueAuthority.criticalValueFailures}**

Readiness state: **${report.customerValueAuthority.readinessState}**

Blocks launch readiness: **${report.customerValueAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Would users come back? Does this create meaningful value?

Value Risks:

${report.customerValueAuthority.valueRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

Recommendations:

${report.customerValueAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A product only succeeds long-term if it creates meaningful value that users want to return for.'}

## Competitive Reality Authority

Competitive Reality Score: **${report.competitiveRealityAuthority.competitiveRealityScore}/100**

Differentiation Score: **${report.competitiveRealityAuthority.differentiationScore}/100**

Competitive Risk Score: **${report.competitiveRealityAuthority.competitiveRiskScore}/100**

Unique Advantages: **${report.competitiveRealityAuthority.uniqueAdvantageCount}**

Readiness state: **${report.competitiveRealityAuthority.readinessState}**

Blocks launch readiness: **${report.competitiveRealityAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Why would users choose us? What makes us different?

Competitive Risks:

${report.competitiveRealityAuthority.competitiveRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

Recommendations:

${report.competitiveRealityAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If the product cannot prove why users should choose it, differentiation is only an assumption.'}

## Reality-Proof Authority

Reality Proof Score: **${report.realityProofAuthority.realityProofScore}/100**

Reality Risk Score: **${report.realityProofAuthority.realityRiskScore}/100**

Proven Reality: **${report.realityProofAuthority.provenRealityCount}**

Assumed Reality: **${report.realityProofAuthority.assumedRealityCount}**

Unknown Reality: **${report.realityProofAuthority.unknownRealityCount}**

Readiness State: **${report.realityProofAuthority.readinessState}**

Blocks launch readiness: **${report.realityProofAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What is actually proven? What is assumed?

Recommendations:

${report.realityProofAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If reality did not prove it, the system must not claim it is proven.'}

## Real User Reality Authority

Reality Score: **${report.realUserRealityAuthority.realUserRealityScore}/100**

User Evidence: **${report.realUserRealityAuthority.userEvidenceScore}/100**

User Success: **${report.realUserRealityAuthority.userSuccessScore}/100**

User Confusion: **${report.realUserRealityAuthority.userConfusionScore}/100**

User Retention: **${report.realUserRealityAuthority.userRetentionScore}/100**

Real User Evidence Count: **${report.realUserRealityAuthority.realUserEvidenceCount}**

Founder Evidence Count: **${report.realUserRealityAuthority.founderOnlyEvidenceCount}**

Readiness State: **${report.realUserRealityAuthority.readinessState}**

Blocks launch readiness: **${report.realUserRealityAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Have real users proven this? What evidence comes from actual users?

${report.realUserRealityAuthority.noRealUserEvidence ? '**NO_REAL_USER_EVIDENCE**' : 'Real-user evidence is present.'}

Recommendations:

${report.realUserRealityAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If real users have not proven success, the system must not claim that real users have proven success.'}

## Adoption Prediction Authority

Adoption Score: **${report.adoptionPredictionAuthority.adoptionPredictionScore}/100**

Retention Prediction: **${report.adoptionPredictionAuthority.retentionPredictionScore}/100**

Recommendation Prediction: **${report.adoptionPredictionAuthority.recommendationPredictionScore}/100**

Abandonment Risk: **${report.adoptionPredictionAuthority.abandonmentRiskScore}/100**

Growth Potential: **${report.adoptionPredictionAuthority.growthPotentialScore}/100**

Evidence Confidence: **${report.adoptionPredictionAuthority.evidenceConfidenceScore}/100**

Readiness State: **${report.adoptionPredictionAuthority.readinessState}**

Blocks launch readiness: **${report.adoptionPredictionAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Will users return? Will users recommend this?

Recommendations:

${report.adoptionPredictionAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Launch readiness is not only about whether users succeed today, but whether they are likely to keep succeeding tomorrow.'}

## Launch Readiness Authority

Recommendation: **${report.launchReadinessAuthority.recommendation.replaceAll('_', ' ')}**

Confidence: **${report.launchReadinessAuthority.launchConfidenceScore}/100**

Blocking Authorities: **${report.launchReadinessAuthority.blockingAuthorityCount}**

Supporting Authorities: **${report.launchReadinessAuthority.supportingAuthorityCount}**

Readiness State: **${report.launchReadinessAuthority.readinessState}**

Should this launch? What is preventing launch?

Blockers:

${report.launchReadinessAuthority.blockers.slice(0, 5).map((blocker) => `- ${blocker}`).join('\n') || '- None recorded.'}

Strengths:

${report.launchReadinessAuthority.strengths.slice(0, 5).map((strength) => `- ${strength}`).join('\n') || '- None recorded.'}

Recommendations:

${report.launchReadinessAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A launch decision should be the result of evidence, not hope.'}

## UI Reviewer Authority

UI Review Score: **${report.uiReviewerAuthority.uiReviewScore}/100**

Navigation Score: **${report.uiReviewerAuthority.navigationScore}/100**

Discoverability Score: **${report.uiReviewerAuthority.discoverabilityScore}/100**

Hierarchy Score: **${report.uiReviewerAuthority.hierarchyScore}/100**

Critical UI Failures: **${report.uiReviewerAuthority.criticalUiFailures}**

Readiness State: **${report.uiReviewerAuthority.readinessState}**

Blocks launch readiness: **${report.uiReviewerAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Can users find major features? Does the navigation make sense?

UI Risks:

${report.uiReviewerAuthority.uiRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

Recommendations:

${report.uiReviewerAuthority.uiRecommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A feature users cannot find is functionally equivalent to a feature that does not exist.'}

## Clarifying Question Intelligence

Requirement Completeness: **${report.clarifyingQuestionIntelligence.requirementCompletenessScore}/100**

Confidence To Proceed: **${report.clarifyingQuestionIntelligence.confidenceToProceed}/100**

Missing Requirements: **${report.clarifyingQuestionIntelligence.missingRequirementCount}**

Critical Missing Requirements: **${report.clarifyingQuestionIntelligence.criticalMissingRequirementCount}**

Clarification Required: **${report.clarifyingQuestionIntelligence.clarificationRequired ? 'Yes' : 'No'}**

Readiness State: **${report.clarifyingQuestionIntelligence.readinessState}**

What information is still missing? What should AiDevEngine ask before building?

Assumptions Prevented:

${report.clarifyingQuestionIntelligence.assumptionsPrevented.slice(0, 5).map((item) => `- ${item}`).join('\n') || '- None recorded in bounded analysis.'}

Recommended Questions:

${report.clarifyingQuestionIntelligence.recommendedQuestions.slice(0, 4).map((item, index) => `${index + 1}. [${item.priority}] ${item.question}`).join('\n') || '1. No critical clarifying questions required from bounded evidence.'}

## Launch Council Finalization

Council Position: **${report.launchCouncilFinalization.councilPosition}**

Council Score: **${report.launchCouncilFinalization.councilScore}/100**

Council Confidence: **${report.launchCouncilFinalization.councilConfidence}/100**

Authority Agreement: **${report.launchCouncilFinalization.agreementScore}/100**

Blocking Authorities: **${report.launchCouncilFinalization.blockingAuthorityCount}**

Highest Risks: ${report.launchCouncilFinalization.highestRiskAuthorities.slice(0, 3).join(', ') || 'None recorded.'}

Strongest Areas: ${report.launchCouncilFinalization.strongestAuthorities.slice(0, 3).join(', ') || 'None recorded.'}

${report.launchCouncilFinalization.councilReasoning.slice(0, 3).map((line) => `- ${line}`).join('\n') || '- Authorities provide evidence. Launch Council provides understanding.'}

Recommendations:

${report.launchCouncilFinalization.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. This is the council unified position — not a final launch verdict.'}

## Launch Verdict Governance

Final Verdict: **${report.launchVerdictGovernance.finalLaunchVerdict.replaceAll('_', ' ')}**

Governance Confidence: **${report.launchVerdictGovernance.governanceConfidence}/100**

Satisfied Rules: **${report.launchVerdictGovernance.satisfiedRuleCount}**

Failed Rules: **${report.launchVerdictGovernance.failedRuleCount}**

Missing Evidence: ${report.launchVerdictGovernance.requiredEvidenceMissing.length > 0 ? report.launchVerdictGovernance.requiredEvidenceMissing.slice(0, 3).join('; ') : 'None recorded for earned verdict.'}

Blocking Authorities: ${report.launchVerdictGovernance.blockingAuthorities.length > 0 ? report.launchVerdictGovernance.blockingAuthorities.join(', ') : 'None'}

Can this launch publicly? What verdict has actually been earned?

${report.launchVerdictGovernance.governanceReasoning.slice(0, 3).map((line) => `- ${line}`).join('\n') || '- Only Launch Verdict Governance may declare a final launch verdict.'}

Recommendations:

${report.launchVerdictGovernance.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. No authority may declare a launch without governance permission.'}

## Adaptive AutoFix Intelligence

Adaptive AutoFix Score: **${report.adaptiveAutofixIntelligence.adaptiveAutoFixScore}/100**

Repeated Failures: **${report.adaptiveAutofixIntelligence.repeatedFailureCount}**

Failure Categories: ${report.adaptiveAutofixIntelligence.failureCategories.slice(0, 5).join(', ') || 'None recorded.'}

Capability Gaps: **${report.adaptiveAutofixIntelligence.capabilityGapCount}**

Evolution Required: **${report.adaptiveAutofixIntelligence.evolutionRequiredCount}**

Expected Failure Reduction: **${report.adaptiveAutofixIntelligence.estimatedFailureReduction}%**

AutoFix Readiness: **${report.adaptiveAutofixIntelligence.autofixReadiness}**

Adaptive AutoFix Triggered: **${report.adaptiveAutofixIntelligence.triggeredAdaptiveAutofix ? 'Yes — ADAPTIVE_AUTOFIX_REQUIRED' : 'No'}**

What capability is missing? Why are we failing repeatedly? What should be created next?

Missing Capabilities:

${report.adaptiveAutofixIntelligence.missingCapabilities.slice(0, 5).map((item) => `- ${item}`).join('\n') || '- None recorded in bounded analysis.'}

Evolution Recommendations:

${report.adaptiveAutofixIntelligence.recommendations.slice(0, 4).map((item, index) => `${index + 1}. [${item.implementationPriority}] ${item.missingCapability} — ${item.expectedBenefit}`).join('\n') || '1. No repeated failure loops detected in bounded analysis.'}

## Final Verdict

**${report.verdict}**
`;
}

export type { FounderTestV4ReportCore } from './founder-testing-v4-types.js';

export function assembleFounderTestV4Report(partial: FounderTestV4ReportCore): FounderTestV4Report {
  const skepticalArtifacts = buildSkepticalFounderSimulatorArtifacts(partial);
  const withSkeptical: FounderTestV4ReportWithSkeptical = {
    ...partial,
    ...skepticalArtifacts,
  };
  const promiseArtifacts = buildPromiseFulfillmentArtifacts(withSkeptical);
  const withPromise: FounderTestV4ReportWithPromise = {
    ...withSkeptical,
    ...promiseArtifacts,
  };
  const trustArtifacts = buildTrustAuthorityArtifacts(withPromise);
  const withTrust: FounderTestV4ReportWithTrust = {
    ...withPromise,
    ...trustArtifacts,
  };
  const selfAwarenessArtifacts = buildSelfAwarenessAuthorityArtifacts(withTrust);
  const withSelfAwareness: FounderTestV4ReportWithSelfAwareness = {
    ...withTrust,
    ...selfAwarenessArtifacts,
  };
  const userSuccessArtifacts = buildUserSuccessAuthorityArtifacts(withSelfAwareness);
  const withUserSuccess: FounderTestV4ReportWithUserSuccess = {
    ...withSelfAwareness,
    ...userSuccessArtifacts,
  };
  const gapDetectionArtifacts = buildGapDetectionAuthorityArtifacts(withUserSuccess);
  const withGapDetection: FounderTestV4ReportWithGapDetection = {
    ...withUserSuccess,
    ...gapDetectionArtifacts,
  };
  const selfEvolutionArtifacts = buildSelfEvolutionAuthorityArtifacts(withGapDetection);
  const withSelfEvolution: FounderTestV4ReportWithSelfEvolution = {
    ...withGapDetection,
    ...selfEvolutionArtifacts,
  };
  const unknownDiscoveryArtifacts = buildUnknownDiscoveryAuthorityArtifacts(withSelfEvolution);
  const withUnknownDiscovery: FounderTestV4ReportWithUnknownDiscovery = {
    ...withSelfEvolution,
    ...unknownDiscoveryArtifacts,
  };
  const firstTimeUserArtifacts = buildFirstTimeUserRealityAuthorityArtifacts(withUnknownDiscovery);
  const withFirstTimeUser: FounderTestV4ReportWithFirstTimeUser = {
    ...withUnknownDiscovery,
    ...firstTimeUserArtifacts,
  };
  const customerValueArtifacts = buildCustomerValueAuthorityArtifacts(withFirstTimeUser);
  const withCustomerValue: FounderTestV4ReportWithCustomerValue = {
    ...withFirstTimeUser,
    ...customerValueArtifacts,
  };
  const competitiveRealityArtifacts = buildCompetitiveRealityAuthorityArtifacts(withCustomerValue);
  const withCompetitiveReality: FounderTestV4ReportWithCompetitiveReality = {
    ...withCustomerValue,
    ...competitiveRealityArtifacts,
  };
  const realityProofArtifacts = buildRealityProofAuthorityArtifacts(withCompetitiveReality);
  const withRealityProof: FounderTestV4ReportWithRealityProof = {
    ...withCompetitiveReality,
    ...realityProofArtifacts,
  };
  const realUserRealityArtifacts = buildRealUserRealityAuthorityArtifacts(withRealityProof);
  const withRealUserReality: FounderTestV4ReportWithRealUserReality = {
    ...withRealityProof,
    ...realUserRealityArtifacts,
  };
  const adoptionPredictionArtifacts = buildAdoptionPredictionAuthorityArtifacts(withRealUserReality);
  const withAdoptionPrediction: FounderTestV4ReportWithAdoptionPrediction = {
    ...withRealUserReality,
    ...adoptionPredictionArtifacts,
  };
  const launchReadinessArtifacts = buildLaunchReadinessAuthorityArtifacts(withAdoptionPrediction);
  const withLaunchReadiness: FounderTestV4ReportForLaunchCouncil = {
    ...withAdoptionPrediction,
    ...launchReadinessArtifacts,
  };
  const uiReviewerArtifacts = buildUIReviewerAuthorityArtifacts(withLaunchReadiness);
  const withUiReviewer: FounderTestV4ReportWithUiReviewer = {
    ...withLaunchReadiness,
    ...uiReviewerArtifacts,
  };
  const clarifyingArtifacts = buildClarifyingQuestionIntelligenceArtifacts(withUiReviewer);
  const withClarifyingQuestion: FounderTestV4ReportWithClarifyingQuestion = {
    ...withUiReviewer,
    ...clarifyingArtifacts,
  };
  const councilArtifacts = assembleLaunchCouncilFromFounderTestV4(withClarifyingQuestion);
  const withLaunchCouncil: FounderTestV4ReportWithLaunchCouncil = {
    ...withClarifyingQuestion,
    ...councilArtifacts,
  };
  const finalizationArtifacts = buildLaunchCouncilFinalizationArtifacts(withLaunchCouncil);
  const withFinalization: FounderTestV4ReportWithLaunchCouncilFinalization = {
    ...withLaunchCouncil,
    ...finalizationArtifacts,
  };
  const governanceArtifacts = buildLaunchVerdictGovernanceArtifacts(withFinalization);
  const withGovernance: FounderTestV4ReportWithLaunchVerdictGovernance = {
    ...withFinalization,
    ...governanceArtifacts,
  };
  const adaptiveArtifacts = buildAdaptiveAutofixIntelligenceArtifacts(withGovernance);
  const withAdaptiveAutofix: FounderTestV4ReportWithAdaptiveAutofix = {
    ...withGovernance,
    ...adaptiveArtifacts,
  };
  const councilRefresh = refreshLaunchCouncilWithAdaptiveAutofix(withAdaptiveAutofix);
  const enriched: Omit<FounderTestV4Report, 'reportMarkdown'> = {
    ...withAdaptiveAutofix,
    ...councilRefresh,
  };
  return {
    ...enriched,
    reportMarkdown: `${buildFounderTestV4ReportMarkdown(enriched)}\n\n${skepticalArtifacts.skepticalFounderReportMarkdown}\n\n${promiseArtifacts.promiseFulfillmentReportMarkdown}\n\n${trustArtifacts.trustAuthorityReportMarkdown}\n\n${selfAwarenessArtifacts.selfAwarenessAuthorityReportMarkdown}\n\n${userSuccessArtifacts.userSuccessAuthorityReportMarkdown}\n\n${gapDetectionArtifacts.gapDetectionAuthorityReportMarkdown}\n\n${selfEvolutionArtifacts.selfEvolutionAuthorityReportMarkdown}\n\n${unknownDiscoveryArtifacts.unknownDiscoveryAuthorityReportMarkdown}\n\n${firstTimeUserArtifacts.firstTimeUserRealityAuthorityReportMarkdown}\n\n${customerValueArtifacts.customerValueAuthorityReportMarkdown}\n\n${competitiveRealityArtifacts.competitiveRealityAuthorityReportMarkdown}\n\n${realityProofArtifacts.realityProofAuthorityReportMarkdown}\n\n${realUserRealityArtifacts.realUserRealityAuthorityReportMarkdown}\n\n${adoptionPredictionArtifacts.adoptionPredictionAuthorityReportMarkdown}\n\n${launchReadinessArtifacts.launchReadinessAuthorityReportMarkdown}\n\n${uiReviewerArtifacts.uiReviewerAuthorityReportMarkdown}\n\n${clarifyingArtifacts.clarifyingQuestionIntelligenceReportMarkdown}\n\n${councilRefresh.launchCouncilReportMarkdown}\n\n${finalizationArtifacts.launchCouncilFinalizationReportMarkdown}\n\n${governanceArtifacts.launchVerdictGovernanceReportMarkdown}\n\n${adaptiveArtifacts.adaptiveAutofixIntelligenceReportMarkdown}`,
  };
}

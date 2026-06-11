/**
 * Founder Testing Mode V4 — AIDEVENGINE_FOUNDER_TEST_REPORT_V4 builder.
 */

import { FOUNDER_TEST_V4_REPORT_TITLE } from './founder-testing-v4-bounds.js';
import type { FounderTestV4Report } from './founder-testing-v4-types.js';

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

## Recommended Fix Order

${report.recommendedFixOrder.map((line, i) => `${i + 1}. ${line}`).join('\n')}

## Copy-Paste Fix Prompts

${report.copyPasteFixPrompts.map((p, i) => `### Fix ${i + 1}\n\`\`\`\n${p}\n\`\`\``).join('\n\n')}

## V3 Summary (reference)

V3 verdict: ${report.v3.verdict} | Trust: ${report.v3.trustScore}

## Final Verdict

**${report.verdict}**
`;
}

export function assembleFounderTestV4Report(
  partial: Omit<FounderTestV4Report, 'reportMarkdown'>,
): FounderTestV4Report {
  return { ...partial, reportMarkdown: buildFounderTestV4ReportMarkdown(partial) };
}

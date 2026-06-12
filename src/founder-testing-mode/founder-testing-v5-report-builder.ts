/**
 * Founder Testing V5 — unified founder report builder.
 */

import { FOUNDER_TEST_V5_REPORT_TITLE } from './founder-testing-v5-bounds.js';
import type { FounderTestV5Report } from './founder-testing-v5-types.js';

function listSection(title: string, items: string[]): string {
  if (!items.length) return `## ${title}\n\nNone identified.\n`;
  return `## ${title}\n\n${items.map((i) => `- ${i}`).join('\n')}\n`;
}

export function buildFounderTestV5ReportMarkdown(report: Omit<FounderTestV5Report, 'reportMarkdown'>): string {
  const date = new Date(report.generatedAt).toISOString();
  const s = report.unifiedSummary;

  return `# ${FOUNDER_TEST_V5_REPORT_TITLE}

Generated: ${date}
Report ID: ${report.reportId}
Duration: ${report.durationMs}ms
Mode: Founder Testing V5 (unified founder validation, read-only)

## Executive Summary

**Overall Founder Score: ${s.overallFounderScore}/100**

Founder Sensemaking: ${report.founderSensemaking.founderSensemakingScore}/100 | Product Coherence: ${report.founderSensemaking.productCoherenceScore}/100

Technical: ${report.v4.launchReadinessReality.technicalReadiness}/100 | Product: ${report.v4.launchReadinessReality.productReadiness}/100 | Human: ${report.v4.launchReadinessReality.humanReadiness}/100 | Execution: ${report.v4.launchReadinessReality.executionReadiness}/100

## Launch Recommendation

**${s.launchRecommendation}**

V4 verdict: ${report.verdict}

${listSection('What Works', s.whatWorks)}
${listSection('What Is Broken', s.whatIsBroken)}
${listSection("What Doesn't Make Sense", s.whatDoesntMakeSense)}
${listSection('What Hurts Trust', s.whatHurtsTrust)}
${listSection('What Changed', s.whatChanged)}
${listSection('Recommended Actions', s.recommendedActions)}

## Highest Impact Upgrade

${s.highestImpactUpgrade ?? 'No single upgrade prioritized — review recommended actions.'}

${listSection('Launch Blockers', s.launchBlockers)}

## Chat Intelligence Reality

Chat Intelligence Score: **${report.v4.chatIntelligenceReality.chatIntelligenceScore}/100**

Chat Launch Verdict: **${report.v4.chatIntelligenceReality.chatLaunchVerdict}**

Blocks launch readiness: **${report.v4.chatIntelligenceReality.blocksLaunchReadiness ? 'Yes' : 'No'}**

Scenarios passed: ${report.v4.chatIntelligenceReality.scenariosPassed}/${report.v4.chatIntelligenceReality.scenariosRun}

${report.v4.chatIntelligenceReality.founderProofNotes.map((n) => `- ${n}`).join('\n')}

### Failed Chat Scenarios

${report.v4.chatIntelligenceReality.failedScenarios.length ? report.v4.chatIntelligenceReality.failedScenarios.map((s) => `- **"${s.prompt}"** — ${s.whyFailed.join('; ') || 'Criteria not met'}`).join('\n') : 'None — all bounded scenarios passed.'}

### Required Fixes Before Launch

${report.v4.chatIntelligenceReality.requiredFixesBeforeLaunch.length ? report.v4.chatIntelligenceReality.requiredFixesBeforeLaunch.map((f) => `- ${f}`).join('\n') : 'None identified.'}

## Repository Typecheck Reality

Readiness state: **${report.v4.repositoryTypecheckReality.readinessState}**

Typecheck clean: **${report.v4.repositoryTypecheckReality.typecheckClean ? 'Yes' : 'No'}**

Blocks launch readiness: **${report.v4.repositoryTypecheckReality.blocksLaunchReadiness ? 'Yes' : 'No'}**

Errors: ${report.v4.repositoryTypecheckReality.errorCount} | Warnings: ${report.v4.repositoryTypecheckReality.warningCount}

${report.v4.repositoryTypecheckReality.founderProofNotes.map((n) => `- ${n}`).join('\n')}

### Typecheck Findings

${report.v4.repositoryTypecheckReality.findings.length ? report.v4.repositoryTypecheckReality.findings.map((f) => `- **${f.file}:${f.line}:${f.column}** [${f.code}] ${f.message}`).join('\n') : 'No compile findings recorded.'}

## Skeptical Founder Simulator

Score: **${report.v4.skepticalFounderSimulator.skepticalFounderScore}/100**

Launch risk: **${report.v4.skepticalFounderSimulator.launchRiskScore}/100**

Readiness state: **${report.v4.skepticalFounderSimulator.readinessState}**

Blocks launch readiness: **${report.v4.skepticalFounderSimulator.blocksLaunchReadiness ? 'Yes' : 'No'}**

Objections: ${report.v4.skepticalFounderSimulator.objectionCount}

${report.v4.skepticalFounderSimulator.objections.slice(0, 5).map((objection) => `- ${objection}`).join('\n') || '- None recorded.'}

Recommendations:

${report.v4.skepticalFounderSimulator.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Maintain visible proof for every launch claim.'}

## Promise Fulfillment

Score: **${report.v4.promiseFulfillment.fulfillmentScore}/100**

Fulfilled: **${report.v4.promiseFulfillment.fulfilledCount}** | Partial: **${report.v4.promiseFulfillment.partiallyFulfilledCount}** | Unproven: **${report.v4.promiseFulfillment.unprovenCount}** | Contradicted: **${report.v4.promiseFulfillment.contradictedCount}**

Readiness state: **${report.v4.promiseFulfillment.readinessState}**

Blocks launch readiness: **${report.v4.promiseFulfillment.blocksLaunchReadiness ? 'Yes' : 'No'}**

${report.v4.promiseFulfillment.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If reality cannot prove the claim, treat the claim as not fulfilled.'}

## Trust Authority

Trust score: **${report.v4.trustAuthority.trustScore}/100**

Risk score: **${report.v4.trustAuthority.trustRiskScore}/100**

Critical failures: **${report.v4.trustAuthority.criticalTrustFailures}**

Readiness state: **${report.v4.trustAuthority.readinessState}**

Blocks launch readiness: **${report.v4.trustAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

${report.v4.trustAuthority.trustRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

${report.v4.trustAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If users cannot trust the evidence behind a claim, the claim should not be trusted.'}

## Self-Awareness Authority

Self-awareness score: **${report.v4.selfAwarenessAuthority.selfAwarenessScore}/100**

Risk score: **${report.v4.selfAwarenessAuthority.selfAwarenessRiskScore}/100**

Critical failures: **${report.v4.selfAwarenessAuthority.criticalAwarenessFailures}**

Readiness state: **${report.v4.selfAwarenessAuthority.readinessState}**

Blocks launch readiness: **${report.v4.selfAwarenessAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

${report.v4.selfAwarenessAuthority.limitations.slice(0, 5).map((limitation) => `- ${limitation}`).join('\n') || '- None recorded.'}

${report.v4.selfAwarenessAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A system cannot judge readiness accurately if it does not understand its own reality.'}

## User Success Authority

User success score: **${report.v4.userSuccessAuthority.userSuccessScore}/100**

Outcome achievement score: **${report.v4.userSuccessAuthority.outcomeAchievementScore}/100**

Critical failures: **${report.v4.userSuccessAuthority.criticalSuccessFailures}**

Readiness state: **${report.v4.userSuccessAuthority.readinessState}**

Blocks launch readiness: **${report.v4.userSuccessAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

${report.v4.userSuccessAuthority.blockers.slice(0, 5).map((blocker) => `- ${blocker}`).join('\n') || '- None recorded.'}

${report.v4.userSuccessAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. The product succeeds only when users succeed.'}

## Gap Detection Authority

Gap Detection Score: **${report.v4.gapDetectionAuthority.gapDetectionScore}/100**

Critical Gaps: **${report.v4.gapDetectionAuthority.criticalGapCount}**

High Gaps: **${report.v4.gapDetectionAuthority.highGapCount}**

Launch Blocking Gaps: **${report.v4.gapDetectionAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Total gaps: **${report.v4.gapDetectionAuthority.totalGaps}**

Readiness state: **${report.v4.gapDetectionAuthority.readinessState}**

What capability is missing? What prevents success?

${report.v4.gapDetectionAuthority.detectedGaps.filter((gap) => gap.severity === 'CRITICAL' || gap.severity === 'HIGH').slice(0, 5).map((gap) => `- [${gap.severity}] ${gap.title}: ${gap.description}`).join('\n') || '- None recorded.'}

${report.v4.gapDetectionAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A problem is not understood until the missing capability causing it is identified.'}

## Self-Evolution Authority

Self-Evolution Score: **${report.v4.selfEvolutionAuthority.selfEvolutionScore}/100**

Repeated Failures: **${report.v4.selfEvolutionAuthority.repeatedFailureCount}**

Required Evolutions: **${report.v4.selfEvolutionAuthority.evolutionRequiredCount}**

Blocked Evolutions: **${report.v4.selfEvolutionAuthority.blockedEvolutionCount}**

Readiness state: **${report.v4.selfEvolutionAuthority.readinessState}**

Blocks launch readiness: **${report.v4.selfEvolutionAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What keeps failing? What should evolve next?

${report.v4.selfEvolutionAuthority.patterns.slice(0, 5).map((pattern) => `- [${pattern.status}] ${pattern.failureSignal} → ${pattern.recommendedEvolution}`).join('\n') || '- None recorded.'}

${report.v4.selfEvolutionAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If the same problem keeps appearing, identify what must evolve.'}

## Unknown Discovery Authority

Unknown Discovery Score: **${report.v4.unknownDiscoveryAuthority.unknownDiscoveryScore}/100**

Findings: **${report.v4.unknownDiscoveryAuthority.findingCount}**

Critical Findings: **${report.v4.unknownDiscoveryAuthority.criticalFindingCount}**

High Findings: **${report.v4.unknownDiscoveryAuthority.highFindingCount}**

Readiness state: **${report.v4.unknownDiscoveryAuthority.readinessState}**

Blocks launch readiness: **${report.v4.unknownDiscoveryAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What are we not testing? What blind spots remain?

${report.v4.unknownDiscoveryAuthority.findings.filter((finding) => finding.severity === 'CRITICAL' || finding.severity === 'HIGH').slice(0, 5).map((finding) => `- [${finding.severity}] ${finding.title}: ${finding.description}`).join('\n') || '- None recorded.'}

Recommended New Tests:

${report.v4.unknownDiscoveryAuthority.recommendedTests.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Expand bounded discovery tests for adjacent blind spots.'}

${report.v4.unknownDiscoveryAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. The system must look for what its current tests may be missing.'}

## First-Time User Reality Authority

First-Time User Score: **${report.v4.firstTimeUserRealityAuthority.firstTimeUserScore}/100**

Confusion Score: **${report.v4.firstTimeUserRealityAuthority.confusionScore}/100**

Critical Confusion: **${report.v4.firstTimeUserRealityAuthority.criticalConfusionCount}**

User Blockers: **${report.v4.firstTimeUserRealityAuthority.blockerCount}**

Readiness state: **${report.v4.firstTimeUserRealityAuthority.readinessState}**

Blocks launch readiness: **${report.v4.firstTimeUserRealityAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What would a new user misunderstand? What would stop onboarding?

${report.v4.firstTimeUserRealityAuthority.confusionPoints.slice(0, 5).map((point) => `- ${point}`).join('\n') || '- None recorded.'}

${report.v4.firstTimeUserRealityAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If a first-time user cannot understand the product, the product is not ready for widespread adoption.'}

## Customer Value Authority

Customer Value Score: **${report.v4.customerValueAuthority.customerValueScore}/100**

Retention Value Score: **${report.v4.customerValueAuthority.retentionValueScore}/100**

Value Risk Score: **${report.v4.customerValueAuthority.valueRiskScore}/100**

Critical Value Failures: **${report.v4.customerValueAuthority.criticalValueFailures}**

Readiness state: **${report.v4.customerValueAuthority.readinessState}**

Blocks launch readiness: **${report.v4.customerValueAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Would users come back? Does this create meaningful value?

Value Risks:

${report.v4.customerValueAuthority.valueRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

${report.v4.customerValueAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A product only succeeds long-term if it creates meaningful value that users want to return for.'}

## Competitive Reality Authority

Competitive Reality Score: **${report.v4.competitiveRealityAuthority.competitiveRealityScore}/100**

Differentiation Score: **${report.v4.competitiveRealityAuthority.differentiationScore}/100**

Competitive Risk Score: **${report.v4.competitiveRealityAuthority.competitiveRiskScore}/100**

Unique Advantages: **${report.v4.competitiveRealityAuthority.uniqueAdvantageCount}**

Readiness state: **${report.v4.competitiveRealityAuthority.readinessState}**

Blocks launch readiness: **${report.v4.competitiveRealityAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

Why would users choose us? What advantages are proven?

Competitive Risks:

${report.v4.competitiveRealityAuthority.competitiveRisks.slice(0, 5).map((risk) => `- ${risk}`).join('\n') || '- None recorded.'}

${report.v4.competitiveRealityAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If the product cannot prove why users should choose it, differentiation is only an assumption.'}

## Reality-Proof Authority

Reality Proof Score: **${report.v4.realityProofAuthority.realityProofScore}/100**

Reality Risk Score: **${report.v4.realityProofAuthority.realityRiskScore}/100**

Proven Reality: **${report.v4.realityProofAuthority.provenRealityCount}**

Assumed Reality: **${report.v4.realityProofAuthority.assumedRealityCount}**

Unknown Reality: **${report.v4.realityProofAuthority.unknownRealityCount}**

Readiness State: **${report.v4.realityProofAuthority.readinessState}**

Blocks launch readiness: **${report.v4.realityProofAuthority.blocksLaunchReadiness ? 'Yes' : 'No'}**

What is actually proven? What remains unknown?

${report.v4.realityProofAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If reality did not prove it, the system must not claim it is proven.'}

## Real User Reality Authority

Reality Score: **${report.v4.realUserRealityAuthority.realUserRealityScore}/100**

User Evidence: **${report.v4.realUserRealityAuthority.userEvidenceScore}/100**

User Success: **${report.v4.realUserRealityAuthority.userSuccessScore}/100**

User Confusion: **${report.v4.realUserRealityAuthority.userConfusionScore}/100**

User Retention: **${report.v4.realUserRealityAuthority.userRetentionScore}/100**

Real User Evidence Count: **${report.v4.realUserRealityAuthority.realUserEvidenceCount}**

Founder Evidence Count: **${report.v4.realUserRealityAuthority.founderOnlyEvidenceCount}**

Readiness State: **${report.v4.realUserRealityAuthority.readinessState}**

Have real users proven this?

${report.v4.realUserRealityAuthority.noRealUserEvidence ? '**NO_REAL_USER_EVIDENCE**' : 'Real-user evidence is present.'}

${report.v4.realUserRealityAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. If real users have not proven success, the system must not claim that real users have proven success.'}

## Adoption Prediction Authority

Adoption Score: **${report.v4.adoptionPredictionAuthority.adoptionPredictionScore}/100**

Retention Prediction: **${report.v4.adoptionPredictionAuthority.retentionPredictionScore}/100**

Recommendation Prediction: **${report.v4.adoptionPredictionAuthority.recommendationPredictionScore}/100**

Abandonment Risk: **${report.v4.adoptionPredictionAuthority.abandonmentRiskScore}/100**

Growth Potential: **${report.v4.adoptionPredictionAuthority.growthPotentialScore}/100**

Evidence Confidence: **${report.v4.adoptionPredictionAuthority.evidenceConfidenceScore}/100**

Readiness State: **${report.v4.adoptionPredictionAuthority.readinessState}**

Will users return? What predicts abandonment?

${report.v4.adoptionPredictionAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Launch readiness is not only about whether users succeed today, but whether they are likely to keep succeeding tomorrow.'}

## Launch Readiness Authority

Recommendation: **${report.v4.launchReadinessAuthority.recommendation.replaceAll('_', ' ')}**

Confidence: **${report.v4.launchReadinessAuthority.launchConfidenceScore}/100**

Blocking Authorities: **${report.v4.launchReadinessAuthority.blockingAuthorityCount}**

Supporting Authorities: **${report.v4.launchReadinessAuthority.supportingAuthorityCount}**

Readiness State: **${report.v4.launchReadinessAuthority.readinessState}**

Should this launch? What supports launch?

Blockers:

${report.v4.launchReadinessAuthority.blockers.slice(0, 5).map((blocker) => `- ${blocker}`).join('\n') || '- None recorded.'}

${report.v4.launchReadinessAuthority.recommendations.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A launch decision should be the result of evidence, not hope.'}

## UI Reviewer Authority

UI Review Score: **${report.v4.uiReviewerAuthority.uiReviewScore}/100**

Navigation Score: **${report.v4.uiReviewerAuthority.navigationScore}/100**

Discoverability Score: **${report.v4.uiReviewerAuthority.discoverabilityScore}/100**

Hierarchy Score: **${report.v4.uiReviewerAuthority.hierarchyScore}/100**

Critical UI Failures: **${report.v4.uiReviewerAuthority.criticalUiFailures}**

Readiness State: **${report.v4.uiReviewerAuthority.readinessState}**

${report.v4.uiReviewerAuthority.uiRecommendations.slice(0, 3).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. A feature users cannot find is functionally equivalent to a feature that does not exist.'}

## Clarifying Question Intelligence

Requirement Completeness: **${report.v4.clarifyingQuestionIntelligence.requirementCompletenessScore}/100**

Confidence To Proceed: **${report.v4.clarifyingQuestionIntelligence.confidenceToProceed}/100**

Missing Requirements: **${report.v4.clarifyingQuestionIntelligence.missingRequirementCount}**

Critical Missing Requirements: **${report.v4.clarifyingQuestionIntelligence.criticalMissingRequirementCount}**

Readiness State: **${report.v4.clarifyingQuestionIntelligence.readinessState}**

Recommended Questions:

${report.v4.clarifyingQuestionIntelligence.recommendedQuestions.slice(0, 4).map((item, index) => `${index + 1}. ${item.question}`).join('\n') || '1. What problem should this product solve?'}

Assumptions Prevented:

${report.v4.clarifyingQuestionIntelligence.assumptionsPrevented.slice(0, 4).map((item) => `- ${item}`).join('\n') || '- None recorded.'}

## Launch Council (Advisory)

Readiness state: **${report.v4.launchCouncil.readinessState}**

Confidence score: **${report.v4.launchCouncil.confidenceScore}/100**

Overall council score: **${report.v4.launchCouncil.overallScore}/100**

Launch blockers: ${report.v4.launchCouncil.launchBlockerCount}

${report.v4.launchCouncilReport.summary}

## Launch Council Finalization

Council Position: **${report.v4.launchCouncilFinalization.councilPosition}**

Council Score: **${report.v4.launchCouncilFinalization.councilScore}/100**

Council Confidence: **${report.v4.launchCouncilFinalization.councilConfidence}/100**

Authority Agreement: **${report.v4.launchCouncilFinalization.agreementScore}/100**

Blocking Authorities: **${report.v4.launchCouncilFinalization.blockingAuthorityCount}**

Highest Risks: ${report.v4.launchCouncilFinalization.highestRiskAuthorities.slice(0, 3).join(', ') || 'None recorded.'}

Strongest Areas: ${report.v4.launchCouncilFinalization.strongestAuthorities.slice(0, 3).join(', ') || 'None recorded.'}

${report.v4.launchCouncilFinalization.recommendations.slice(0, 3).map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Authorities provide evidence. Launch Council provides understanding.'}

## Launch Verdict Governance

Final Verdict: **${report.v4.launchVerdictGovernance.finalLaunchVerdict.replaceAll('_', ' ')}**

Governance Confidence: **${report.v4.launchVerdictGovernance.governanceConfidence}/100**

Satisfied Rules: **${report.v4.launchVerdictGovernance.satisfiedRuleCount}**

Failed Rules: **${report.v4.launchVerdictGovernance.failedRuleCount}**

Missing Evidence: ${report.v4.launchVerdictGovernance.requiredEvidenceMissing.length > 0 ? report.v4.launchVerdictGovernance.requiredEvidenceMissing.slice(0, 2).join('; ') : 'None recorded.'}

Blocking Authorities: ${report.v4.launchVerdictGovernance.blockingAuthorities.length > 0 ? report.v4.launchVerdictGovernance.blockingAuthorities.join(', ') : 'None'}

## Adaptive AutoFix Intelligence

Adaptive AutoFix Score: **${report.v4.adaptiveAutofixIntelligence.adaptiveAutoFixScore}/100**

Repeated Failures: **${report.v4.adaptiveAutofixIntelligence.repeatedFailureCount}**

Failure Categories: ${report.v4.adaptiveAutofixIntelligence.failureCategories.slice(0, 5).join(', ') || 'None recorded.'}

Capability Gaps: **${report.v4.adaptiveAutofixIntelligence.capabilityGapCount}**

Evolution Required: **${report.v4.adaptiveAutofixIntelligence.evolutionRequiredCount}**

Expected Failure Reduction: **${report.v4.adaptiveAutofixIntelligence.estimatedFailureReduction}%**

AutoFix Readiness: **${report.v4.adaptiveAutofixIntelligence.autofixReadiness}**

Missing Capabilities:

${report.v4.adaptiveAutofixIntelligence.missingCapabilities.slice(0, 4).map((item) => `- ${item}`).join('\n') || '- None recorded.'}

Evolution Recommendations:

${report.v4.adaptiveAutofixIntelligence.recommendations.slice(0, 4).map((item, index) => `${index + 1}. [${item.implementationPriority}] ${item.missingCapability}`).join('\n') || '1. No repeated failure loops detected.'}

## First-Time User Reality

Score: **${report.firstTimeUserReality.firstTimeUserScore}/100**

Understanding: ${report.firstTimeUserReality.categoryScores.understanding}/100 | Navigation: ${report.firstTimeUserReality.categoryScores.navigation}/100 | Workflow: ${report.firstTimeUserReality.categoryScores.workflow}/100 | Trust: ${report.firstTimeUserReality.categoryScores.trust}/100 | Simplicity: ${report.firstTimeUserReality.categoryScores.simplicity}/100

${listSection('Strengths', report.firstTimeUserReality.strengths)}

${listSection('Weaknesses', report.firstTimeUserReality.weaknesses)}

**Top confusion risk:** ${report.firstTimeUserReality.topConfusionRisk ?? 'None identified in bounded first-time scenarios.'}

${listSection('First-Time Confusion Findings', report.firstTimeUserReality.findings.map((f) => `[${f.severity}] ${f.whatConfuses}`))}

${listSection('Recommended First-Time Fixes', report.firstTimeUserReality.recommendedFixes)}

## Verification Trust & Evidence

Trust score: **${report.verificationTrustEvidence.trustScore}/100**

Status: ${report.verificationTrustEvidence.summary.status} | Confidence: ${report.verificationTrustEvidence.summary.confidence}

${listSection('Trust Strengths', report.verificationTrustEvidence.strengths)}

${listSection('Trust Gaps', report.verificationTrustEvidence.weaknesses)}

${listSection('Founder Guidance', report.verificationTrustEvidence.founderGuidance)}

Black-box risk: ${report.verificationTrustEvidence.blackBoxRisk ? 'Yes — explainability gaps remain' : 'No — verification results are explainable'}

## Founder Friction Heatmap

Overall friction: **${report.founderFrictionHeatmap.overallFrictionScore}/100** | Level: **${report.founderFrictionHeatmap.summary.frictionLevel}**

${listSection('Highest Friction Areas', report.founderFrictionHeatmap.highestFrictionAreas)}

${listSection('Confusion Hotspots', report.founderFrictionHeatmap.confusionHotspots.map((h) => h.concept))}

${listSection('Dead-End Findings', report.founderFrictionHeatmap.deadEndFindings.map((d) => `${d.screen}: ${d.detail}`))}

**Most likely abandonment point:** ${report.founderFrictionHeatmap.summary.mostLikelyAbandonmentPoint}

**Most likely confusion point:** ${report.founderFrictionHeatmap.summary.mostLikelyConfusionPoint}

**Most successful journey:** ${report.founderFrictionHeatmap.summary.mostSuccessfulJourney}

${listSection('Recommended UX Improvements', report.founderFrictionHeatmap.summary.recommendedUxImprovements)}

## Founder Interaction Simulation

Interaction score: **${report.founderInteractionSimulation.interactionScore}/100**

Tested interactions: ${report.founderInteractionSimulation.testedInteractions} | Passed: ${report.founderInteractionSimulation.passedInteractions}

Modal close regression: ${report.founderInteractionSimulation.modalCloseRegressionPass ? 'PASS' : 'FAIL'}

${listSection('Interaction Failures', report.founderInteractionSimulation.findings.map((f) => `[${f.severity}] ${f.whatFailed}`))}

${listSection('Blocked Workflows', report.founderInteractionSimulation.blockedWorkflows.map((f) => f.whatFailed))}

${listSection('Hidden Content / Overlay Issues', report.founderInteractionSimulation.hiddenContentIssues.map((f) => f.whatFailed))}

${listSection('Recovery Issues', report.founderInteractionSimulation.recoveryIssues.map((f) => f.whatFailed))}

${listSection('Recommended Interaction Fixes', report.founderInteractionSimulation.recommendedFixes)}

## Customer Journey Simulation

Score: **${report.customerJourneySimulation.customerJourneyScore}/100**

Discovery: ${report.customerJourneySimulation.subscores.discovery}/100 | Onboarding: ${report.customerJourneySimulation.subscores.onboarding}/100 | Value: ${report.customerJourneySimulation.subscores.value}/100 | Trust: ${report.customerJourneySimulation.subscores.trust}/100 | Retention: ${report.customerJourneySimulation.subscores.retention}/100 | Advocacy: ${report.customerJourneySimulation.subscores.advocacy}/100

Customer ready: ${report.customerJourneySimulation.customerReady ? 'Yes' : 'No'} | Not ready for customers: ${report.customerJourneySimulation.notReadyForCustomers ? 'Yes' : 'No'}

${listSection('Strengths', report.customerJourneySimulation.strengths)}

${listSection('Weaknesses', report.customerJourneySimulation.weaknesses)}

**Top adoption blocker:** ${report.customerJourneySimulation.topAdoptionBlocker ?? 'None identified in bounded customer scenarios.'}

${listSection('Customer Personas', report.customerJourneySimulation.personas.map((p) => `${p.name}: ${p.passed ? 'PASS' : 'FAIL'} — ${p.detail}`))}

${listSection('Journey Scenarios', report.customerJourneySimulation.scenarios.map((s) => `${s.name}: ${s.passed ? 'PASS' : 'FAIL'} — ${s.detail}`))}

${listSection('Adoption Blockers', report.customerJourneySimulation.adoptionBlockers.map((b) => `[${b.severity}] ${b.whatFails}`))}

${listSection('Customer Journey Findings', report.customerJourneySimulation.findings.map((f) => `[${f.type}] ${f.whatFails}`))}

## Promise Reality Engine

Promise Reality Score: **${report.promiseRealityEngine.promiseRealityScore}/100**

Execution Gap Score: **${report.promiseRealityEngine.executionGapScore}/100** (lower is better)

Reality Confidence: **${report.promiseRealityEngine.realityConfidence}/100**

Claims evaluated: ${report.promiseRealityEngine.claimsEvaluated} | Promise reality pass: ${report.promiseRealityEngine.promiseRealityPass ? 'Yes' : 'No'}

${listSection('Proven Claims', report.promiseRealityEngine.provenClaims.map((c) => `${c.claim} — ${c.evidence} (${c.confidence}% confidence)`))}

${listSection('Partially Proven Claims', report.promiseRealityEngine.partiallyProvenClaims.map((c) => `${c.claim} — missing: ${c.missingEvidence ?? 'n/a'}; validate: ${c.requiredValidation ?? 'n/a'}`))}

${listSection('Unproven Claims', report.promiseRealityEngine.unprovenClaims.map((c) => `${c.claim} — ${c.whyUnproven ?? c.evidence}; verify: ${c.recommendedVerification ?? 'n/a'}`))}

${listSection('Contradicted Claims', report.promiseRealityEngine.contradictedClaims.map((c) => `[${c.severity}] ${c.claim} — ${c.contradictingEvidence ?? c.evidence}`))}

${listSection('Highest-Risk Assumptions', report.promiseRealityEngine.highestRiskAssumptions.map((c) => `${c.claim} (${c.status})`))}

${listSection('Founder Promise Scenarios', report.promiseRealityEngine.founderPromiseScenarios.map((s) => `${s.id}: ${s.passed ? 'PASS' : 'FAIL'} — ${s.detail}`))}

## Visual Quality Authority

Visual Quality Score: **${report.visualQualityAuthority.visualQualityScore}/100**

First Impression: ${report.visualQualityAuthority.subscores.firstImpression}/100 | Hierarchy: ${report.visualQualityAuthority.subscores.hierarchy}/100 | Navigation: ${report.visualQualityAuthority.subscores.navigation}/100

Layout: ${report.visualQualityAuthority.subscores.layout}/100 | Professionalism: ${report.visualQualityAuthority.subscores.professionalism}/100 | Launch Appearance: ${report.visualQualityAuthority.subscores.launchAppearance}/100

Launch appearance confidence: **${report.visualQualityAuthority.launchAppearanceConfidence}/100**

${listSection('Visual Strengths', report.visualQualityAuthority.strengths)}

${listSection('Visual Weaknesses', report.visualQualityAuthority.weaknesses)}

${listSection('Trust Risks', report.visualQualityAuthority.trustRisks)}

${listSection('Professionalism Risks', report.visualQualityAuthority.professionalismRisks)}

${listSection('Launch Appearance Risks', report.visualQualityAuthority.launchAppearanceRisks)}

${listSection('Visual Findings', report.visualQualityAuthority.findings.map((f) => `[${f.type}] ${f.explanation}`))}

## Launch Day Simulation

Launch Day Score: **${report.launchDaySimulation.launchDayScore}/100**

Launch confidence: **${report.launchDaySimulation.launchConfidence}/100** | Concurrent usage risk: **${report.launchDaySimulation.concurrentUsageRisk}/100**

New User Readiness: ${report.launchDaySimulation.subscores.newUserReadiness}/100 | Concurrent Usage: ${report.launchDaySimulation.subscores.concurrentUsageReadiness}/100 | Expectation Alignment: ${report.launchDaySimulation.subscores.expectationAlignment}/100

Recovery Readiness: ${report.launchDaySimulation.subscores.recoveryReadiness}/100 | Trust Survival: ${report.launchDaySimulation.subscores.trustSurvival}/100 | Founder Readiness: ${report.launchDaySimulation.subscores.founderReadiness}/100

${listSection('Launch Strengths', report.launchDaySimulation.launchStrengths)}

${listSection('Launch Weaknesses', report.launchDaySimulation.launchWeaknesses)}

${listSection('Highest-Risk Assumptions', report.launchDaySimulation.highestRiskAssumptions)}

${listSection('Top Launch Blockers', report.launchDaySimulation.topLaunchBlockers.map((b) => `[${b.severity}] ${b.explanation}`))}

${listSection('Launch Day Trust Risks', report.launchDaySimulation.trustRisks)}

${listSection('Launch Day Findings', report.launchDaySimulation.findings.map((f) => `[${f.type}] ${f.explanation}`))}

## Adoption Prediction

Adoption Prediction Score: **${report.adoptionPrediction.adoptionPredictionScore}/100**

Adoption confidence: **${report.adoptionPrediction.adoptionConfidence}/100**

Value Clarity: ${report.adoptionPrediction.subscores.valueClarity}/100 | Time-to-Value: ${report.adoptionPrediction.subscores.timeToValue}/100 | Adoption Friction: ${report.adoptionPrediction.subscores.adoptionFriction}/100

Retention Potential: ${report.adoptionPrediction.subscores.retentionPotential}/100 | Recommendation Potential: ${report.adoptionPrediction.subscores.recommendationPotential}/100 | Competitive Pressure: ${report.adoptionPrediction.subscores.competitivePressure}/100

${listSection('Adoption Strengths', report.adoptionPrediction.adoptionStrengths)}

${listSection('Adoption Weaknesses', report.adoptionPrediction.adoptionWeaknesses)}

${listSection('Adoption Blockers', report.adoptionPrediction.adoptionBlockers.map((b) => `[${b.severity}] ${b.explanation}`))}

${listSection('Retention Risks', report.adoptionPrediction.retentionRisks)}

${listSection('Recommendation Risks', report.adoptionPrediction.recommendationRisks)}

${listSection('Competitive Risks', report.adoptionPrediction.competitiveRisks)}

${listSection('Adoption Findings', report.adoptionPrediction.findings.map((f) => `[${f.type}] ${f.explanation}`))}

## Product Economics

Product Economics Score: **${report.productEconomics.productEconomicsScore}/100**

User Value: ${report.productEconomics.subscores.userValue}/100 | Founder Value: ${report.productEconomics.subscores.founderValue}/100 | Build Cost: ${report.productEconomics.subscores.buildCost}/100

Maintenance Cost: ${report.productEconomics.subscores.maintenanceCost}/100 | Adoption Impact: ${report.productEconomics.subscores.adoptionImpact}/100 | Strategic Value: ${report.productEconomics.subscores.strategicValue}/100

Summary: ${report.productEconomics.productEconomicsSummary}

${listSection('Highest ROI Opportunities', report.productEconomics.highestRoiOpportunities)}

${listSection('Lowest ROI Opportunities', report.productEconomics.lowestRoiOpportunities)}

${listSection('Economic Risks', report.productEconomics.economicRisks)}

${listSection('Strategic Investments', report.productEconomics.strategicInvestments)}

${listSection('Deferred Opportunities', report.productEconomics.deferredOpportunities)}

${listSection('Feature ROI Classifications', report.productEconomics.featureEvaluations.map((f) => `[${f.roiClassification}] ${f.name} — ${f.netValueScore}/100`))}

## Product Evolution

Product Evolution Score: **${report.productEvolution.productEvolutionScore}/100**

Adoption Growth: ${report.productEvolution.portfolioSubscores.adoptionGrowth}/100 | Friction Reduction: ${report.productEvolution.portfolioSubscores.frictionReduction}/100 | Trust Improvement: ${report.productEvolution.portfolioSubscores.trustImprovement}/100

Quality Improvement: ${report.productEvolution.portfolioSubscores.qualityImprovement}/100 | Strategic Leverage: ${report.productEvolution.portfolioSubscores.strategicLeverage}/100 | Execution Efficiency: ${report.productEvolution.portfolioSubscores.executionEfficiency}/100

Summary: ${report.productEvolution.productEvolutionSummary}

Confidence: ${report.productEvolution.recommendationConfidenceSummary}

${listSection('Recommended Next Investments', report.productEvolution.recommendedNextInvestments)}

${listSection('Highest Priority Opportunities', report.productEvolution.highestPriorityOpportunities)}

${listSection('Quick Wins', report.productEvolution.quickWins)}

${listSection('Strategic Investments', report.productEvolution.strategicInvestments)}

${listSection('Deferred Opportunities', report.productEvolution.deferredOpportunities)}

${listSection('Do Not Build', report.productEvolution.doNotBuild)}

${listSection('Evolution Candidates', report.productEvolution.candidates.map((c) => `[${c.rankingBucket}/${c.confidence}] ${c.name} — ${c.priorityScore}/100`))}

## Competitive Reality

Competitive Reality Score: **${report.competitiveReality.competitiveRealityScore}/100**

Position: **${report.competitiveReality.competitivePosition.replace(/_/g, ' ')}**

Differentiation Strength: ${report.competitiveReality.portfolioSubscores.differentiationStrength}/100 | Replacement Risk: ${report.competitiveReality.portfolioSubscores.replacementRisk}/100 (lower is better)

Founder Advantage: ${report.competitiveReality.portfolioSubscores.founderAdvantage}/100 | Product Advantage: ${report.competitiveReality.portfolioSubscores.productAdvantage}/100

Strategic Defensibility: ${report.competitiveReality.portfolioSubscores.strategicDefensibility}/100 | Blind Spot Risk: ${report.competitiveReality.portfolioSubscores.blindSpotRisk}/100

Summary: ${report.competitiveReality.competitiveRealitySummary}

${listSection('Strongest Competitive Advantages', report.competitiveReality.strongestCompetitiveAdvantages)}

${listSection('Weakest Competitive Advantages', report.competitiveReality.weakestCompetitiveAdvantages)}

${listSection('High Replacement Risks', report.competitiveReality.highReplacementRisks)}

${listSection('Strategic Defensibility', report.competitiveReality.strategicDefensibility)}

${listSection('Competitive Blind Spots', report.competitiveReality.competitiveBlindSpots)}

${listSection('Unproven Competitive Claims', report.competitiveReality.unprovenCompetitiveClaims)}

${listSection('Competitive Findings', report.competitiveReality.findings.map((f) => `[${f.severity}/${f.type}] ${f.explanation}`))}

## Founder Decision Readiness

Decision Readiness Score: **${report.founderDecisionReadiness.decisionReadinessScore}/100**

Primary Recommendation: **${report.founderDecisionReadiness.primaryRecommendation.replace(/_/g, ' ')}**

Decision Confidence: **${report.founderDecisionReadiness.decisionConfidence}**

Launch Readiness: ${report.founderDecisionReadiness.portfolioSubscores.launchReadiness}/100 | Adoption Readiness: ${report.founderDecisionReadiness.portfolioSubscores.adoptionReadiness}/100

Trust Readiness: ${report.founderDecisionReadiness.portfolioSubscores.trustReadiness}/100 | Product Readiness: ${report.founderDecisionReadiness.portfolioSubscores.productReadiness}/100

Strategic Readiness: ${report.founderDecisionReadiness.portfolioSubscores.strategicReadiness}/100 | Founder Readiness: ${report.founderDecisionReadiness.portfolioSubscores.founderReadiness}/100

Why this recommendation: ${report.founderDecisionReadiness.whyThisRecommendation}

${listSection('Supporting Evidence', report.founderDecisionReadiness.supportingEvidence)}

${listSection('Blocking Evidence', report.founderDecisionReadiness.blockingEvidence)}

${listSection('Recommended Next Actions', report.founderDecisionReadiness.recommendedNextActions)}

Summary: ${report.founderDecisionReadiness.decisionReadinessSummary}

## Digital Founder Board

Board Status: **${report.digitalFounderBoard.boardStatus.replace(/_/g, ' ')}**

Summary: ${report.digitalFounderBoard.digitalFounderBoardSummary}

### Executive Summary

Founder Decision: **${report.digitalFounderBoard.executiveSummary.founderDecision.replace(/_/g, ' ')}** | Confidence: **${report.digitalFounderBoard.executiveSummary.decisionConfidence}**

Why: ${report.digitalFounderBoard.executiveSummary.whyThisRecommendation}

${listSection('Top Next Actions', report.digitalFounderBoard.executiveSummary.topNextActions)}

### Product Health

Launch: ${report.digitalFounderBoard.productHealth.launchReadiness}/100 | Adoption: ${report.digitalFounderBoard.productHealth.adoptionReadiness}/100 | Trust: ${report.digitalFounderBoard.productHealth.trustReadiness}/100 | Product: ${report.digitalFounderBoard.productHealth.productReadiness}/100 | Strategic: ${report.digitalFounderBoard.productHealth.strategicReadiness}/100 | Founder: ${report.digitalFounderBoard.productHealth.founderReadiness}/100

### Risk Board

${listSection('Highest Priority Risks', report.digitalFounderBoard.riskBoard.highestPriorityRisks)}

${listSection('Blocking Evidence', report.digitalFounderBoard.riskBoard.blockingEvidence)}

### Opportunity Board

${listSection('Quick Wins', report.digitalFounderBoard.opportunityBoard.quickWins)}

${listSection('Strategic Investments', report.digitalFounderBoard.opportunityBoard.strategicInvestments)}

${listSection('Highest ROI Opportunities', report.digitalFounderBoard.opportunityBoard.highestRoiOpportunities)}

${listSection('Recommended Next Investments', report.digitalFounderBoard.opportunityBoard.recommendedNextInvestments)}

### Competitive Position

Classification: **${report.digitalFounderBoard.competitivePosition.competitiveClassification}**

${listSection('Strongest Advantages', report.digitalFounderBoard.competitivePosition.strongestAdvantages)}

${listSection('Replacement Risks', report.digitalFounderBoard.competitivePosition.replacementRisks)}

${listSection('Strategic Defensibility', report.digitalFounderBoard.competitivePosition.strategicDefensibility)}

### Trust & Validation

Verification Trust: ${report.digitalFounderBoard.trustValidation.verificationTrustScore}/100 | Promise Reality: ${report.digitalFounderBoard.trustValidation.promiseRealityScore}/100 | ${report.digitalFounderBoard.trustValidation.realityConfidence}

${listSection('Unproven Claims', report.digitalFounderBoard.trustValidation.unprovenClaims)}

${listSection('Contradicted Claims', report.digitalFounderBoard.trustValidation.contradictedClaims)}

### Founder Experience

First-Time User: ${report.digitalFounderBoard.founderExperience.firstTimeUserScore}/100 | Friction: ${report.digitalFounderBoard.founderExperience.frictionScore}/100 | Customer Journey: ${report.digitalFounderBoard.founderExperience.customerJourneyScore}/100 | Launch Day: ${report.digitalFounderBoard.founderExperience.launchDayScore}/100 | Adoption Prediction: ${report.digitalFounderBoard.founderExperience.adoptionPredictionScore}/100

### Roadmap Intelligence

${listSection('Build Next', report.digitalFounderBoard.roadmapIntelligence.buildNext)}

${listSection('Build Later', report.digitalFounderBoard.roadmapIntelligence.buildLater)}

${listSection('Do Not Build', report.digitalFounderBoard.roadmapIntelligence.doNotBuild)}

${listSection('Recommended Actions', report.digitalFounderBoard.recommendedActions)}

## Final Recommendation

${s.finalRecommendation}

---

## Evaluation Phases Completed

${report.phaseFeedEvents.map((p) => `${p.phase}. **${p.phaseName}** — ${p.detail}`).join('\n')}

---

## Detailed Layer Reports

The unified report embeds V4 execution reality, V3 human simulation, V2 product proxy, and V1 technical checks.

See appendix in V4 nested report for creation journey, promise matrix, and visibility module scores.

Action Center state: ${report.founderActionCenter.stateLabel}
Verification state: ${report.verificationResults.stateLabel}
Change Intelligence history: ${report.changeIntelligence.historyCount} snapshot(s)
`;
}

export function assembleFounderTestV5Report(
  partial: Omit<FounderTestV5Report, 'reportMarkdown'>,
): FounderTestV5Report {
  return { ...partial, reportMarkdown: buildFounderTestV5ReportMarkdown(partial) };
}

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

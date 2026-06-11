/**
 * Founder Testing Mode V3 — AIDEVENGINE_FOUNDER_TEST_REPORT_V3 builder.
 */

import { FOUNDER_TEST_V3_REPORT_TITLE } from './founder-testing-v3-bounds.js';
import type { FounderTestV3Report } from './founder-testing-v3-types.js';

export function buildFounderTestV3ReportMarkdown(report: Omit<FounderTestV3Report, 'reportMarkdown'>): string {
  const date = new Date(report.generatedAt).toISOString();
  const rr = report.v2.readinessReality;
  const lr = report.launchReadiness;

  const personaBlock = report.personaSimulations
    .map(
      (p) =>
        `- **${p.label}** — satisfaction ${p.satisfactionScore}, trust delta ${p.trustDelta >= 0 ? '+' : ''}${p.trustDelta}\n  ${p.findings.join('; ')}`,
    )
    .join('\n');

  const curiosityBlock = report.curiosityPaths
    .map(
      (p) =>
        `- ${p.pathLabel}: ${p.steps.join(' → ')} — context ${p.contextRecoveryScore}/100${p.issues.length ? ` (${p.issues[0]})` : ''}`,
    )
    .join('\n');

  const mistakeBlock = report.mistakeResults
    .map(
      (m) =>
        `- "${m.prompt}" — ${m.recovered ? 'recovered' : 'NOT recovered'}, follow-up ${m.followUpQuality}${m.issues.length ? ` — ${m.issues[0]}` : ''}`,
    )
    .join('\n');

  const goalBlock = report.goalResults
    .map(
      (g) =>
        `- **${g.label}** — success ${g.goalSuccessScore}/100, likelihood ${g.completionLikelihood}%, steps ~${g.stepsRequired}${g.deadEnds.length ? `, dead ends: ${g.deadEnds.join('; ')}` : ''}`,
    )
    .join('\n');

  const confusionBlock = report.confusionFindings
    .map((c) => `- [${c.severity}] **${c.topic}**: ${c.detail}`)
    .join('\n');

  const trustGain = report.trustEvents.filter((e) => e.type === 'GAIN').slice(0, 6);
  const trustLoss = report.trustEvents.filter((e) => e.type === 'LOSS').slice(0, 8);

  return `# ${FOUNDER_TEST_V3_REPORT_TITLE}

Generated: ${date}
Report ID: ${report.reportId}
Duration: ${report.durationMs}ms
Mode: Founder Testing V3 (human behavior simulation, read-only)

## Executive Summary

V3 simulates **real human behavior** — curiosity, confusion, mistakes, impatience, goal-seeking, and trust changes. **Final verdict: ${report.verdict}**. Launch readiness: **${lr.launchReadinessScore}/100**. Trust score: **${report.trustScore}/100**.

## Technical Readiness

**${rr.technicalReadiness}/100** (from V1 embedded in V2)

## Product Readiness

**${rr.productReadiness}/100**

## Vision Alignment

**${rr.visionAlignment}/100**

## Human Behavior Findings

### Persona Simulations
${personaBlock}

### Non-Linear Curiosity Paths
${curiosityBlock}

### Mistake / Poor Input Recovery
${mistakeBlock}

### Patience & Frustration
${report.patienceAssessments.map((p) => `- **${p.screen}**: frustration ${p.frustrationRisk} — ${p.detail}`).join('\n')}

## Trust Findings

**Trust Score: ${report.trustScore}/100**

### Trust Gains
${trustGain.map((e) => `- ${e.source}: ${e.reason}`).join('\n') || '_None recorded._'}

### Trust Losses
${trustLoss.map((e) => `- ${e.source}: ${e.reason}`).join('\n') || '_None recorded._'}

## Confusion Findings

${confusionBlock || '_No confusion findings._'}

## Goal Completion Results

${goalBlock}

## Founder Simulation Results

${report.personaSimulations.filter((p) => p.personaId === 'founder').map((p) => `Satisfaction ${p.satisfactionScore}/100 — ${p.findings.join('; ')}`).join('\n') || '_N/A_'}

## Customer Simulation Results

${report.personaSimulations.filter((p) => p.personaId === 'customer').map((p) => `Satisfaction ${p.satisfactionScore}/100 — ${p.findings.join('; ')}`).join('\n') || '_N/A_'}

## Impatient User Results

${report.personaSimulations.filter((p) => p.personaId === 'impatient-user').map((p) => `Satisfaction ${p.satisfactionScore}/100 — ${p.findings.join('; ')}`).join('\n') || '_N/A_'}

## Top Frustration Risks

${report.topFrustrationRisks.map((r) => `- ${r}`).join('\n')}

## Top Trust Loss Risks

${report.topTrustLossRisks.map((r) => `- ${r}`).join('\n')}

## Launch Readiness

| Signal | Score |
|--------|-------|
| Human Success Rate | ${lr.humanSuccessRate} |
| Trust Score | ${lr.trustScore} |
| Confusion Score | ${lr.confusionScore} |
| Goal Completion Score | ${lr.goalCompletionScore} |
| Founder Approval Score | ${lr.founderApprovalScore} |
| Customer Approval Score | ${lr.customerApprovalScore} |
| **Launch Readiness** | **${lr.launchReadinessScore}** |

## Founder Preference Model (Digital Twin Foundation)

Version: ${report.founderPreferenceModel.modelVersion} (not personalized yet)

## Recommended Fix Order

${report.recommendedFixOrder.map((line, i) => `${i + 1}. ${line}`).join('\n')}

## Copy-Paste Fix Prompts

${report.copyPasteFixPrompts.map((p, i) => `### Fix ${i + 1}\n\`\`\`\n${p}\n\`\`\``).join('\n\n')}

## V2 Summary (reference)

V2 verdict: ${report.v2.verdict} | Architecture leakage: ${report.v2.architectureLeakageSummary}

## Final Verdict

**${report.verdict}**
`;
}

export function assembleFounderTestV3Report(
  partial: Omit<FounderTestV3Report, 'reportMarkdown'>,
): FounderTestV3Report {
  return { ...partial, reportMarkdown: buildFounderTestV3ReportMarkdown(partial) };
}

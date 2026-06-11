/**
 * Founder Testing Mode V2 — AIDEVENGINE_FOUNDER_TEST_REPORT_V2 builder.
 */

import { PRODUCT_VISION_BASELINE } from './founder-testing-vision-baseline.js';
import { FOUNDER_TEST_V2_REPORT_TITLE } from './founder-testing-v2-bounds.js';
import type { FounderTestV2Report } from './founder-testing-v2-types.js';

function formatPromptVision(results: FounderTestV2Report['promptVisionResults']): string {
  return results
    .map((r) => {
      const status = r.passed ? 'PASS' : 'FAIL';
      return (
        `- **"${r.prompt}"** (${status}) — vision ${r.visionAlignment}, leakage ${r.architectureLeakage}\n` +
        `  Issues: ${r.issues.length ? r.issues.join('; ') : 'none'}\n` +
        `  Preview: ${r.responsePreview || '_no response_'}`
      );
    })
    .join('\n');
}

function formatScreenPurpose(results: FounderTestV2Report['screenPurposeResults']): string {
  return results
    .map((r) => {
      const flags = [
        r.whatIsClear ? 'what✓' : 'what✗',
        r.whyCareClear ? 'why✓' : 'why✗',
        r.nextActionClear ? 'next✓' : 'next✗',
      ].join(' ');
      return `- **${r.screen}** [${flags}] vision ${r.visionAlignment}, usefulness ${r.usefulness}, leakage ${r.architectureLeakage}${r.issues.length ? ` — ${r.issues.join('; ')}` : ''}`;
    })
    .join('\n');
}

export function buildFounderTestV2ReportMarkdown(report: Omit<FounderTestV2Report, 'reportMarkdown'>): string {
  const date = new Date(report.generatedAt).toISOString();
  const rr = report.readinessReality;

  return `# ${FOUNDER_TEST_V2_REPORT_TITLE}

Generated: ${date}
Report ID: ${report.reportId}
Duration: ${report.durationMs}ms
Mode: Founder Testing V2 (read-only, founder-proxy evaluation)
Vision Baseline: ${PRODUCT_VISION_BASELINE}

## Executive Summary

V2 evaluates **vision alignment, founder expectations, customer readiness, and architecture leakage** — not only technical correctness. **Final verdict: ${report.verdict}**. Founder approval likelihood: **${report.founderApproval.likelihood}/100**.

## Technical Readiness

**${rr.technicalReadiness}/100** — from V1 shell, navigation, workflow, and loading checks.

## Product Readiness

**${rr.productReadiness}/100** — screen usefulness, purpose clarity, and first-time understandability.

## Vision Alignment

**${rr.visionAlignment}/100** — alignment with AiDevEngine product vision vs internal architecture exposure.

## Founder Approval Prediction

**${report.founderApproval.likelihood}/100**

${report.founderApproval.reasoning}

## Customer Readiness

**${rr.customerReadiness}/100** — value clarity, trust, and guidance for a paying customer today.

## Founder Readiness

**${rr.founderReadiness}/100** — matches founder intent for each feature surface.

## Understandability Score

**${report.understandabilityScore}/100**

## Architecture Leakage Findings

**Overall risk: ${report.architectureLeakageSummary}**

${report.promptVisionResults
  .filter((p) => p.leakageFindings.length)
  .map((p) => `- "${p.prompt}": ${p.leakageFindings.join(', ')} (${p.architectureLeakage})`)
  .join('\n') || '_No prompt leakage patterns detected._'}

## Prompt Intelligence Findings

${formatPromptVision(report.promptVisionResults)}

## Screen Purpose Findings

${formatScreenPurpose(report.screenPurposeResults)}

## Confusion Risks

${
  report.confusionRisks.length
    ? report.confusionRisks.map((c) => `- [${c.severity}] **${c.screens}**: ${c.risk}`).join('\n')
    : '_No confusion risks flagged._'
}

## Top Founder Concerns

${report.topFounderConcerns.map((c) => `- ${c}`).join('\n')}

## Recommended Fix Order

${report.recommendedFixOrder.map((line, i) => `${i + 1}. ${line}`).join('\n')}

## Copy-Paste Fix Prompts

${report.copyPasteFixPrompts.map((p, i) => `### Fix ${i + 1}\n\`\`\`\n${p}\n\`\`\``).join('\n\n')}

## V1 Technical Summary (reference)

V1 verdict: ${report.v1.verdict} | V1 overall: ${report.v1.scores.overall}/100

## Final Verdict

**${report.verdict}**
`;
}

export function assembleFounderTestV2Report(
  partial: Omit<FounderTestV2Report, 'reportMarkdown'>,
): FounderTestV2Report {
  return {
    ...partial,
    reportMarkdown: buildFounderTestV2ReportMarkdown(partial),
  };
}

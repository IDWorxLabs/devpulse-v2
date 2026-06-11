/**
 * Founder Testing Mode — copy-paste report builder.
 */

import { FOUNDER_TEST_REPORT_TITLE } from './founder-testing-bounds.js';
import type {
  FinalVerdict,
  FounderTestIssue,
  FounderTestReport,
  FounderTestScores,
  PromptTestResult,
  ScreenTestResult,
  VisualUxFinding,
  WorkflowTestResult,
} from './founder-testing-types.js';

function sectionIssues(issues: FounderTestIssue[], severity: FounderTestIssue['severity']): string {
  const filtered = issues.filter((i) => i.severity === severity);
  if (!filtered.length) return '_None._\n';
  return filtered
    .map(
      (i) =>
        `- **${i.screen}** — ${i.problem}\n  - Impact: ${i.userImpact}\n  - Cause: ${i.likelyCause}\n  - Fix: ${i.recommendedFix}` +
        (i.copyPasteFixPrompt ? `\n  - Prompt: \`${i.copyPasteFixPrompt}\`` : ''),
    )
    .join('\n') + '\n';
}

function formatScreenResults(results: ScreenTestResult[]): string {
  return results
    .map((r) => {
      const status = r.passed ? 'PASS' : 'FAIL';
      const failedChecks = r.checks.filter((c) => !c.passed).map((c) => c.detail);
      return `- **${r.screen}** (${status}) — ${failedChecks.length ? failedChecks.join('; ') : 'All checks passed'}`;
    })
    .join('\n');
}

function formatPromptResults(results: PromptTestResult[]): string {
  return results
    .map((r) => {
      const status = r.passed ? 'PASS' : 'FAIL';
      return `- **"${r.prompt}"** (${status})${r.issues.length ? ` — ${r.issues.join('; ')}` : ''}\n  Preview: ${r.responsePreview || '_no response_'}`;
    })
    .join('\n');
}

function formatWorkflowResults(results: WorkflowTestResult[]): string {
  return results
    .map((r) => `- **${r.name}** — ${r.passed ? 'PASS' : 'FAIL'}: ${r.detail}`)
    .join('\n');
}

function formatVisualFindings(findings: VisualUxFinding[]): string {
  if (!findings.length) return '_No visual/UX findings._\n';
  return findings.map((f) => `- [${f.severity}] **${f.screen}**: ${f.finding}`).join('\n') + '\n';
}

function formatScores(scores: FounderTestScores): string {
  return [
    `| Dimension | Score |`,
    `|-----------|-------|`,
    `| Navigation Clarity | ${scores.navigationClarity} |`,
    `| Screen Completeness | ${scores.screenCompleteness} |`,
    `| Workflow Continuity | ${scores.workflowContinuity} |`,
    `| Prompt Intelligence | ${scores.promptIntelligence} |`,
    `| Live Preview Readiness | ${scores.livePreviewReadiness} |`,
    `| Verification Readiness | ${scores.verificationReadiness} |`,
    `| Project Memory Usefulness | ${scores.projectMemoryUsefulness} |`,
    `| Project Insights Usefulness | ${scores.projectInsightsUsefulness} |`,
    `| Visual Polish | ${scores.visualPolish} |`,
    `| Founder Confidence | ${scores.founderConfidence} |`,
    `| **Overall** | **${scores.overall}** |`,
  ].join('\n');
}

export function buildFounderTestReportMarkdown(input: {
  reportId: string;
  generatedAt: number;
  durationMs: number;
  scores: FounderTestScores;
  verdict: FinalVerdict;
  issues: FounderTestIssue[];
  passed: string[];
  screenResults: ScreenTestResult[];
  promptResults: PromptTestResult[];
  workflowResults: WorkflowTestResult[];
  visualFindings: VisualUxFinding[];
  recommendedFixOrder: string[];
  liveSection?: string;
}): string {
  const date = new Date(input.generatedAt).toISOString();
  const fixPrompt = input.recommendedFixOrder.length
    ? input.recommendedFixOrder.map((line, i) => `${i + 1}. ${line}`).join('\n')
    : 'No fixes required — product readiness bar met.';

  return `# ${FOUNDER_TEST_REPORT_TITLE}

Generated: ${date}
Report ID: ${input.reportId}
Duration: ${input.durationMs}ms
Mode: Founder Testing V1 (read-only)

## Executive Summary

AiDevEngine Founder Testing Mode simulated founder usage across navigation, product surfaces, Command Center prompts, and workflow continuity. **Final verdict: ${input.verdict}**. Overall readiness score: **${input.scores.overall}/100**.

## Overall Readiness Score

${formatScores(input.scores)}

## What Passed

${input.passed.length ? input.passed.map((p) => `- ${p}`).join('\n') : '_No explicit pass items recorded._'}

## Blockers

${sectionIssues(input.issues, 'BLOCKER')}

## High Priority Issues

${sectionIssues(input.issues, 'HIGH')}

## Medium Priority Issues

${sectionIssues(input.issues, 'MEDIUM')}

## Polish Issues

${sectionIssues(input.issues, 'LOW')}
${sectionIssues(input.issues, 'POLISH')}

## Screen-by-Screen Results

${formatScreenResults(input.screenResults)}

${input.liveSection ? `### Live Browser Checks\n\n${input.liveSection}\n` : ''}

## Prompt Intelligence Results

${formatPromptResults(input.promptResults)}

## Workflow Results

${formatWorkflowResults(input.workflowResults)}

## Visual/UX Findings

${formatVisualFindings(input.visualFindings)}

## Recommended Fix Order

${fixPrompt}

## Copy-Paste Fix Prompt

\`\`\`
Fix AiDevEngine product readiness issues in priority order:

${fixPrompt}
\`\`\`

## Final Verdict

**${input.verdict}**
`;
}

export function assembleFounderTestReport(
  partial: Omit<FounderTestReport, 'reportMarkdown'> & { liveSection?: string },
): FounderTestReport {
  const reportMarkdown = buildFounderTestReportMarkdown({
    reportId: partial.reportId,
    generatedAt: partial.generatedAt,
    durationMs: partial.durationMs,
    scores: partial.scores,
    verdict: partial.verdict,
    issues: partial.issues,
    passed: partial.passed,
    screenResults: partial.screenResults,
    promptResults: partial.promptResults,
    workflowResults: partial.workflowResults,
    visualFindings: partial.visualFindings,
    recommendedFixOrder: partial.recommendedFixOrder,
    liveSection: partial.liveSection,
  });

  return { ...partial, reportMarkdown };
}

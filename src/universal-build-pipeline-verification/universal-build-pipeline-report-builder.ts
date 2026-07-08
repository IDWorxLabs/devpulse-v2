/**
 * Universal Build Pipeline Verification V1 — report builder.
 */

import type { UniversalBuildPipelineAssessment } from './universal-build-pipeline-types.js';

export function buildUniversalBuildPipelineReportMarkdown(
  assessment: UniversalBuildPipelineAssessment,
): string {
  const lines: string[] = [
    '# Universal Build Pipeline Report',
    '',
    `Generated: ${assessment.generatedAt}`,
    `Owner: ${assessment.canonicalOwner}`,
    `Prompts tested: ${assessment.promptsTested}`,
    '',
    '## Summary',
    '',
    `| Signal | Value |`,
    `|--------|-------|`,
    `| LISA included | ${assessment.lisaIncluded ? 'yes' : 'no'} |`,
    `| Generic custom profile accepted | ${assessment.genericCustomProfileAccepted ? 'yes' : 'no'} |`,
    `| Feature reality fallback is warning | ${assessment.featureRealityFallbackIsWarning ? 'yes' : 'no'} |`,
    `| ExpenseTracker contamination | ${assessment.expenseTrackerContaminationDetected ? 'detected' : 'none'} |`,
    '',
    '## Blockers by Class',
    '',
  ];

  for (const [cls, blockers] of Object.entries(assessment.blockersByClass)) {
    lines.push(`### ${cls} (${blockers.length})`);
    if (blockers.length === 0) {
      lines.push('- none');
    } else {
      for (const b of blockers.slice(0, 10)) {
        lines.push(`- [${b.stage}] ${b.reason}`);
      }
      if (blockers.length > 10) lines.push(`- … and ${blockers.length - 10} more`);
    }
    lines.push('');
  }

  lines.push('## Systemic Patterns', '');
  for (const p of assessment.systemicBlockerPatterns) lines.push(`- ${p}`);
  if (assessment.systemicBlockerPatterns.length === 0) lines.push('- none');

  lines.push('', '## Profile Misroute Patterns', '');
  for (const p of assessment.profileMisroutePatterns) lines.push(`- ${p}`);
  if (assessment.profileMisroutePatterns.length === 0) lines.push('- none');

  lines.push('', '## Over-Strict Gate Patterns', '');
  for (const p of assessment.overstrictGatePatterns) lines.push(`- ${p}`);
  if (assessment.overstrictGatePatterns.length === 0) lines.push('- none');

  lines.push('', '## Recommended Fixes (by priority)', '');
  for (const fix of assessment.recommendedFixes) {
    lines.push(`### P${fix.priority}: ${fix.fix}`);
    lines.push(fix.rationale);
    lines.push('');
  }

  lines.push('## Per-Category Results', '');
  for (const cat of assessment.categoryResults) {
    lines.push(`### ${cat.categoryLabel} (\`${cat.categoryId}\`)`);
    lines.push(`- Profile: ${cat.selectedProfile ?? 'unknown'}`);
    lines.push(`- Outcome: ${cat.buildOutcome}`);
    lines.push(`- Prompt faithfulness: ${cat.promptFaithfulnessPassed ? 'PASS' : 'FAIL'}`);
    lines.push(`- Workspace materialized: ${cat.workspaceMaterialized ? 'yes' : 'no'}`);
    lines.push(`- Feature reality: ${cat.featureRealityStatus ?? 'n/a'}`);
    lines.push(`- npm install: ${cat.reachedNpmInstall ? 'yes' : 'no'}`);
    lines.push(`- npm build: ${cat.reachedNpmBuild ? 'yes' : 'no'}`);
    lines.push(`- preview: ${cat.reachedPreview ? 'yes' : 'no'}`);
    lines.push(`- report: ${cat.reachedReport ? 'yes' : 'no'}`);
    lines.push(`- Blockers: ${cat.blockers.length}`);
    lines.push('');
    lines.push('| Stage | Decision | Blocks | Reason |');
    lines.push('|-------|----------|--------|--------|');
    for (const t of cat.stageTraces) {
      lines.push(
        `| ${t.stageName} | ${t.decision} | ${t.blocksContinuation ? 'yes' : 'no'} | ${t.blockerReason ?? '—'} |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

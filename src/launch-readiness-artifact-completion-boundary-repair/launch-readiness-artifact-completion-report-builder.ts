/**
 * Phase 27.03 — Launch readiness artifact completion report builder (V1).
 */

import type { LaunchReadinessArtifactCompletionBoundaryRepairReport } from './launch-readiness-artifact-completion-boundary-repair-types.js';
import { LAUNCH_READINESS_ARTIFACT_CHAIN_LABELS } from './launch-readiness-artifact-completion-boundary-repair-registry.js';

export function buildLaunchReadinessArtifactCompletionBoundaryRepairMarkdown(
  report: LaunchReadinessArtifactCompletionBoundaryRepairReport,
): string {
  const lines = [
    '# Launch Readiness Artifact Completion Boundary Repair',
    '',
    `Repair ID: ${report.repairId}`,
    `Generated: ${report.generatedAt}`,
    `Repair applied: ${report.repairApplied ? 'yes' : 'no'}`,
    `Pass token: ${report.passToken ?? 'none'}`,
    '',
    '## Artifact chain',
    '',
    ...LAUNCH_READINESS_ARTIFACT_CHAIN_LABELS.map((label, index) => `${index + 1}. ${label}`),
    '',
    '## Assessment audit',
    '',
    `- Assessment finished: ${report.assessmentAudit.assessmentFinished}`,
    `- Assessment passed: ${report.assessmentAudit.assessmentPassed}`,
    `- Assessment with warnings: ${report.assessmentAudit.assessmentWithWarnings}`,
    '',
    '## Artifact builder audit',
    '',
    `- Report markdown started: ${report.artifactBuilderAudit.reportMarkdownStarted}`,
    `- Report markdown finished: ${report.artifactBuilderAudit.reportMarkdownFinished}`,
    `- Launch artifacts created: ${report.artifactBuilderAudit.launchArtifactsCreated}`,
    `- Launch artifacts persisted: ${report.artifactBuilderAudit.launchArtifactsPersisted}`,
    `- Artifacts built emitted: ${report.artifactBuilderAudit.artifactsBuiltEmitted}`,
    '',
    '## Boundary detection',
    '',
    `- Exact stopping step: ${report.boundaryDetection.exactStoppingStep ?? 'none'}`,
    `- Missing boundary: ${report.boundaryDetection.missingCompletionBoundary ?? 'none'}`,
    `- Failure class: ${report.boundaryDetection.failureClass}`,
    `- Reason: ${report.boundaryDetection.reason ?? 'none'}`,
    '',
    '## Repair plan',
    '',
    `- Repair required: ${report.repairPlan.repairRequired}`,
    `- Actions: ${report.repairPlan.actions.join(', ') || 'none'}`,
  ];
  return lines.join('\n');
}

export function buildLaunchReadinessArtifactCompletionValidationMarkdown(input: {
  passToken: string | null;
  checks: readonly { name: string; passed: boolean; detail: string }[];
}): string {
  return [
    '# Launch Readiness Artifact Completion Boundary Repair Validation',
    '',
    `Result: ${input.passToken ?? 'FAILED'}`,
    '',
    ...input.checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.name}: ${check.detail}`),
    '',
    input.passToken ? `**${input.passToken}**` : '',
  ].join('\n');
}

/**
 * Build History Integrity V1 — human-readable audit report.
 */

import type { BuildHistoryAuditTimelineEvent, BuildHistoryRecord } from './build-history-types.js';

export function buildAuditReportMarkdown(
  record: BuildHistoryRecord,
  timeline: BuildHistoryAuditTimelineEvent[],
): string {
  const lines = [
    `# Build History Audit Report`,
    ``,
    `- **Run ID:** ${record.runId}`,
    `- **Created:** ${record.createdAt}`,
    `- **Profile:** ${record.selectedProfile}`,
    `- **App:** ${record.appName}`,
    `- **Status:** validation=${record.validationResults.validationStatus} production=${record.productionValidationStatus}`,
    `- **Immutable:** ${record.immutable}`,
    `- **Manifest hash:** \`${record.manifestHash}\``,
    `- **Workspace hash:** \`${record.workspaceHash}\``,
    `- **Comparison fingerprint:** \`${record.comparisonFingerprint}\``,
    ``,
    `## Prompt`,
    ``,
    record.prompt,
    ``,
    `## Artifacts`,
    ``,
    ...record.artifactPaths.map((path) => `- ${path}`),
    ``,
  ];

  if (record.failureReasons.length > 0) {
    lines.push(`## Failure Reasons`, ``);
    for (const reason of record.failureReasons) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push(`## Audit Timeline`, ``);
  lines.push(`| Stage | Status | Evidence |`);
  lines.push(`| --- | --- | --- |`);
  for (const event of timeline) {
    lines.push(
      `| ${event.stage} | ${event.status} | ${event.evidenceSummary.replace(/\|/g, '/')} |`,
    );
  }
  lines.push('');

  return lines.join('\n');
}

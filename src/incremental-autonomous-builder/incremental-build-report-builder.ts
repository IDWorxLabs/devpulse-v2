/**
 * Incremental Autonomous Builder — pipeline report builder.
 */

import type { IncrementalBuildPipelineResult } from './incremental-builder-types.js';

export function buildIncrementalBuildPipelineReport(result: IncrementalBuildPipelineResult): string {
  const lines = [
    '# Incremental Autonomous Builder Pipeline Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Build ID:** ${result.buildPlan.buildId}`,
    `**Permission Verdict:** ${result.permissionVerdict}`,
    `**Blocked Reason:** ${result.blockedReason ?? 'none'}`,
    '',
    '## Architecture Summary',
    result.buildPlan.architectureSummary,
    '',
    '## Feature Slices',
    ...result.buildPlan.featureSlices.map(
      (s) => `- ${s.name} (${s.sliceId}) — deps: ${s.dependencySliceIds.join(', ') || 'none'}`,
    ),
    '',
    '## Build Order',
    ...result.orderedSliceIds.map((id, i) => `${i + 1}. ${id}`),
    '',
    '## Stabilization',
    ...result.stabilizationResults.map((s) => `- ${s.sliceId}: ${s.status}${s.blockers.length ? ` — ${s.blockers.join('; ')}` : ''}`),
    '',
    '## Commits',
    ...result.commitLog.map((c) => `- ${c.commitId}: ${c.sliceId} (${c.filesCreated.length} files)`),
    '',
    '## Whole-App Assembly',
    `${result.wholeAppAssembly.passed ? 'PASSED' : 'FAILED'} — ${result.wholeAppAssembly.stableFeatureCount} stable features`,
  ];
  return lines.join('\n');
}

/**
 * Validation Runtime Audit V1 — bottleneck analysis.
 */

import type { BottleneckEntry, ValidatorRuntimeMetric } from './validation-runtime-audit-types.js';

const BOTTLENECK_DEFS: Array<{
  key: keyof ValidatorRuntimeMetric['workPatterns'];
  label: string;
  secondsPerOccurrence: number;
}> = [
  { key: 'npmInstallCount', label: 'Repeated npm installs', secondsPerOccurrence: 45 },
  { key: 'npmBuildCount', label: 'Repeated npm builds', secondsPerOccurrence: 35 },
  { key: 'previewServerCount', label: 'Repeated preview server startup', secondsPerOccurrence: 12 },
  { key: 'playwrightExecutionCount', label: 'Repeated Playwright suites', secondsPerOccurrence: 90 },
  { key: 'workspaceMaterializationCount', label: 'Repeated workspace materialization', secondsPerOccurrence: 25 },
  { key: 'uvlExecutionCount', label: 'Repeated UVL execution', secondsPerOccurrence: 40 },
  { key: 'aflaExecutionCount', label: 'Repeated AFLA execution', secondsPerOccurrence: 120 },
  { key: 'realBuildPipelineCount', label: 'Repeated real build pipeline execution', secondsPerOccurrence: 60 },
  { key: 'nestedValidatorCount', label: 'Nested validator chains', secondsPerOccurrence: 30 },
];

export function buildBottleneckReport(
  metrics: readonly ValidatorRuntimeMetric[],
): readonly BottleneckEntry[] {
  const aggregates = BOTTLENECK_DEFS.map((def) => {
    let totalOccurrences = 0;
    let affectedCount = 0;

    for (const metric of metrics) {
      const count = metric.workPatterns[def.key];
      if (count > 0) {
        totalOccurrences += count;
        affectedCount += 1;
      }
    }

    const estimatedAggregateSeconds = totalOccurrences * def.secondsPerOccurrence;
    const impactScore = Math.round(estimatedAggregateSeconds / 60 + affectedCount * 2);

    return {
      bottleneck: def.label,
      impactScore,
      affectedValidatorCount: affectedCount,
      estimatedAggregateMinutes: Math.round((estimatedAggregateSeconds / 60) * 10) / 10,
      rank: 0,
    };
  });

  return aggregates
    .filter((b) => b.affectedValidatorCount > 0)
    .sort((a, b) => b.impactScore - a.impactScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

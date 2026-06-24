/**
 * Validation Runtime Audit V1 — duplicate work analysis.
 */

import type {
  DuplicateWorkEntry,
  ValidatorRuntimeMetric,
  WorkPatternCounts,
} from './validation-runtime-audit-types.js';

const OPERATION_KEYS: Array<{ key: keyof WorkPatternCounts; label: string }> = [
  { key: 'npmInstallCount', label: 'npm install' },
  { key: 'npmBuildCount', label: 'npm build' },
  { key: 'previewServerCount', label: 'preview server startup' },
  { key: 'playwrightExecutionCount', label: 'Playwright execution' },
  { key: 'workspaceMaterializationCount', label: 'workspace materialization' },
  { key: 'uvlExecutionCount', label: 'UVL execution' },
  { key: 'aflaExecutionCount', label: 'AFLA execution' },
  { key: 'realBuildPipelineCount', label: 'real build pipeline' },
];

function operationOverlap(a: WorkPatternCounts, b: WorkPatternCounts): string[] {
  const shared: string[] = [];
  for (const { key, label } of OPERATION_KEYS) {
    if (a[key] > 0 && b[key] > 0) shared.push(label);
  }
  return shared;
}

function computeDuplicatePercent(
  metric: ValidatorRuntimeMetric,
  allMetrics: readonly ValidatorRuntimeMetric[],
): { percent: number; overlapping: string[]; operations: string[] } {
  const peers = allMetrics.filter(
    (m) => m.validatorName !== metric.validatorName && m.category === metric.category,
  );

  if (peers.length === 0) {
    const heavyOps = OPERATION_KEYS.filter(({ key }) => metric.workPatterns[key] > 0).map(
      (o) => o.label,
    );
    const globalPeers = allMetrics.filter((m) => {
      if (m.validatorName === metric.validatorName) return false;
      return operationOverlap(metric.workPatterns, m.workPatterns).length > 0;
    });
    if (globalPeers.length === 0) {
      return { percent: 0, overlapping: [], operations: heavyOps };
    }
    const overlap = globalPeers.flatMap((p) =>
      operationOverlap(metric.workPatterns, p.workPatterns),
    );
    const uniqueOps = [...new Set(overlap)];
    const percent = Math.min(
      95,
      Math.round((uniqueOps.length / Math.max(1, heavyOps.length)) * 70 + globalPeers.length * 2),
    );
    return {
      percent,
      overlapping: globalPeers.slice(0, 8).map((p) => p.validatorName),
      operations: uniqueOps,
    };
  }

  let maxOverlap = 0;
  let bestPeer: ValidatorRuntimeMetric | null = null;
  let bestOps: string[] = [];

  for (const peer of peers) {
    const ops = operationOverlap(metric.workPatterns, peer.workPatterns);
    if (ops.length > maxOverlap) {
      maxOverlap = ops.length;
      bestPeer = peer;
      bestOps = ops;
    }
  }

  const heavyCount = OPERATION_KEYS.filter(({ key }) => metric.workPatterns[key] > 0).length;
  const percent =
    heavyCount === 0
      ? 0
      : Math.min(98, Math.round((maxOverlap / heavyCount) * 100));

  const overlapping = peers
    .filter((p) => operationOverlap(metric.workPatterns, p.workPatterns).length > 0)
    .slice(0, 8)
    .map((p) => p.validatorName);

  if (bestPeer && !overlapping.includes(bestPeer.validatorName)) {
    overlapping.unshift(bestPeer.validatorName);
  }

  return { percent, overlapping, operations: bestOps };
}

export function buildDuplicateWorkAnalysis(
  metrics: readonly ValidatorRuntimeMetric[],
): {
  entries: readonly DuplicateWorkEntry[];
  aggregateDuplicateWorkPercent: number;
  metricsWithDuplicates: readonly ValidatorRuntimeMetric[];
} {
  const entries: DuplicateWorkEntry[] = [];
  const updated: ValidatorRuntimeMetric[] = [];

  for (const metric of metrics) {
    const { percent, overlapping, operations } = computeDuplicatePercent(metric, metrics);
    entries.push({
      validatorName: metric.validatorName,
      duplicateWorkPercent: percent,
      overlappingValidators: overlapping,
      duplicatedOperations: operations,
    });
    updated.push({ ...metric, duplicateWorkPercent: percent });
  }

  const withDup = updated.filter((m) => m.duplicateWorkPercent > 0);
  const aggregate =
    withDup.length === 0
      ? 0
      : Math.round(withDup.reduce((sum, m) => sum + m.duplicateWorkPercent, 0) / withDup.length);

  return {
    entries: entries.sort((a, b) => b.duplicateWorkPercent - a.duplicateWorkPercent),
    aggregateDuplicateWorkPercent: aggregate,
    metricsWithDuplicates: updated,
  };
}

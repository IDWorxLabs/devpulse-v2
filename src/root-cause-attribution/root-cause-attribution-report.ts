/**
 * Root Cause Attribution founder-readable report.
 */

import type {
  AttributionRecord,
  AttributionSummary,
  CauseCategory,
  RootCauseAttributionReport,
} from './types.js';
import { ATTRIBUTION_OWNER_MODULE } from './types.js';

function getCategoryDistribution(
  records: AttributionRecord[],
): Partial<Record<CauseCategory, number>> {
  const counts: Partial<Record<CauseCategory, number>> = {};
  for (const record of records) {
    counts[record.category] = (counts[record.category] ?? 0) + 1;
  }
  return counts;
}

export function buildRootCauseAttributionReport(
  records: AttributionRecord[],
  latestSummary: AttributionSummary | null = null,
): RootCauseAttributionReport {
  const categoryCounts = getCategoryDistribution(records);
  const supportingEvidenceCount = records.reduce(
    (n, r) => n + r.supportingEvidenceIds.length,
    0,
  );
  const supportingPredictionCount = records.reduce(
    (n, r) => n + r.supportingPredictionIds.length,
    0,
  );

  let recommendation =
    'Root Cause Attribution explains likely causes only — Phase 6 execution and recovery systems may consume these attributions.';
  if (records.length === 0) {
    recommendation =
      'No root cause attributions generated — insufficient observation, replay, verification, or prediction signals.';
  } else if (records.some((r) => r.confidence === 'HIGH')) {
    recommendation =
      'High-confidence attributions available — review linked evidence and predictions; attribution does not repair or recover.';
  } else if (latestSummary) {
    recommendation = `${latestSummary.attributionCount} attribution(s) with mixed confidence — monitor before action.`;
  }

  return {
    ownerModule: ATTRIBUTION_OWNER_MODULE,
    attributionCount: records.length,
    categoryCounts,
    highConfidenceCount: records.filter((r) => r.confidence === 'HIGH').length,
    mediumConfidenceCount: records.filter((r) => r.confidence === 'MEDIUM').length,
    lowConfidenceCount: records.filter((r) => r.confidence === 'LOW').length,
    supportingEvidenceCount,
    supportingPredictionCount,
    warnings: records.flatMap((r) => r.warnings),
    errors: records.flatMap((r) => r.errors),
    recommendation,
  };
}

export function formatRootCauseAttributionReport(
  records: AttributionRecord[],
  latestSummary: AttributionSummary | null = null,
): string {
  const report = buildRootCauseAttributionReport(records, latestSummary);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'DevPulse V2 Root Cause Attribution Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Attributions: ${report.attributionCount}`,
    '',
    'Category distribution:',
  ];

  const categories = Object.entries(report.categoryCounts);
  if (categories.length === 0) {
    lines.push('  (none)');
  } else {
    for (const [category, count] of categories) {
      lines.push(`  ${category}: ${count}`);
    }
  }

  lines.push(
    '',
    'Confidence distribution:',
    `  HIGH: ${report.highConfidenceCount}`,
    `  MEDIUM: ${report.mediumConfidenceCount}`,
    `  LOW: ${report.lowConfidenceCount}`,
    '',
    `Supporting evidence links: ${report.supportingEvidenceCount}`,
    `Supporting prediction links: ${report.supportingPredictionCount}`,
    '',
  );

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings.slice(0, 10)) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors.slice(0, 10)) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('');
  lines.push(
    'Root Cause Attribution is diagnostic-only — no execution, repair, recovery, or code generation.',
  );
  return lines.join('\n');
}

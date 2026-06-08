/**
 * Failure Prediction founder-readable report.
 */

import type {
  FailurePredictionReport,
  PredictionRecord,
  PredictionSummary,
} from './types.js';
import { PREDICTION_OWNER_MODULE } from './types.js';

export function buildFailurePredictionReport(
  records: PredictionRecord[],
  latestSummary: PredictionSummary | null = null,
  evidenceCount = 0,
): FailurePredictionReport {
  let recommendation =
    'Failure Prediction provides risk awareness only — use signals for Root Cause Attribution; do not treat as diagnosis or repair authority.';
  if (records.length === 0) {
    recommendation =
      'No elevated failure risk patterns detected — continue observation and replay monitoring.';
  } else if (records.some((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')) {
    recommendation =
      'Elevated failure risk detected — review prediction records and evidence; Failure Prediction does not repair or diagnose causes.';
  } else if (latestSummary) {
    recommendation = `${latestSummary.totalPredictions} active prediction signal(s) — monitor before escalation.`;
  }

  return {
    ownerModule: PREDICTION_OWNER_MODULE,
    predictionCount: records.length,
    lowRiskCount: records.filter((r) => r.riskLevel === 'LOW').length,
    mediumRiskCount: records.filter((r) => r.riskLevel === 'MEDIUM').length,
    highRiskCount: records.filter((r) => r.riskLevel === 'HIGH').length,
    criticalRiskCount: records.filter((r) => r.riskLevel === 'CRITICAL').length,
    confidenceLowCount: records.filter((r) => r.confidence === 'LOW').length,
    confidenceMediumCount: records.filter((r) => r.confidence === 'MEDIUM').length,
    confidenceHighCount: records.filter((r) => r.confidence === 'HIGH').length,
    evidenceCount,
    warnings: records.flatMap((r) => r.warnings),
    errors: records.flatMap((r) => r.errors),
    recommendation,
  };
}

export function formatFailurePredictionReport(
  records: PredictionRecord[],
  latestSummary: PredictionSummary | null = null,
  evidenceCount = 0,
): string {
  const report = buildFailurePredictionReport(records, latestSummary, evidenceCount);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'DevPulse V2 Failure Prediction Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Predictions: ${report.predictionCount}`,
    '',
    'Risk distribution:',
    `  LOW: ${report.lowRiskCount}`,
    `  MEDIUM: ${report.mediumRiskCount}`,
    `  HIGH: ${report.highRiskCount}`,
    `  CRITICAL: ${report.criticalRiskCount}`,
    '',
    'Confidence distribution:',
    `  LOW: ${report.confidenceLowCount}`,
    `  MEDIUM: ${report.confidenceMediumCount}`,
    `  HIGH: ${report.confidenceHighCount}`,
    '',
    `Supporting evidence records: ${report.evidenceCount}`,
    '',
  ];

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
    'Failure Prediction is foresight-only — no execution, repair, root cause analysis, or code generation.',
  );
  return lines.join('\n');
}

/**
 * Execution Authority founder-readable report.
 */

import type {
  ExecutionAuthorityReport,
  ExecutionAuthorityState,
  ExecutionClassification,
  ExecutionDecision,
} from './types.js';
import { EXECUTION_OWNER_MODULE } from './types.js';

const ALL_CLASSIFICATIONS: ExecutionClassification[] = [
  'NO_EXECUTION',
  'READ_ONLY',
  'WRITE_OPERATION',
  'COMMAND_EXECUTION',
  'PROJECT_MODIFICATION',
  'RECOVERY_ACTION',
  'AUTONOMOUS_ACTION',
];

function buildClassificationDistribution(
  decisions: ExecutionDecision[],
): Record<ExecutionClassification, number> {
  const distribution = Object.fromEntries(
    ALL_CLASSIFICATIONS.map((c) => [c, 0]),
  ) as Record<ExecutionClassification, number>;
  for (const d of decisions) {
    distribution[d.classification] += 1;
  }
  return distribution;
}

export function buildExecutionAuthorityReport(
  state: ExecutionAuthorityState,
  decisions: ExecutionDecision[],
): ExecutionAuthorityReport {
  const blockedCount = decisions.filter((d) => !d.allowed).length;
  const allowedReadOnlyCount = decisions.filter(
    (d) => d.allowed && d.classification === 'READ_ONLY',
  ).length;

  let recommendation =
    'Execution Authority governs execution permission — Phase 6.2 will build runtime under this authority with founder approval gates.';
  if (state.decisionCount === 0) {
    recommendation = 'Evaluate execution requests through Execution Authority before any runtime is built.';
  } else if (blockedCount > 0) {
    recommendation =
      'Blocked operations require future gates (execution_package_runtime, founder_approval_execution_gate, recovery_execution_engine, world2_isolation_or_autonomy_gate).';
  }

  return {
    ownerModule: EXECUTION_OWNER_MODULE,
    decisionCount: state.decisionCount,
    blockedCount,
    allowedReadOnlyCount,
    classificationDistribution: buildClassificationDistribution(decisions),
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatExecutionAuthorityReport(
  state: ExecutionAuthorityState,
  decisions: ExecutionDecision[],
): string {
  const report = buildExecutionAuthorityReport(state, decisions);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Execution Authority Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Authority ID: ${state.authorityId}`,
    `Decision count: ${report.decisionCount}`,
    `Blocked count: ${report.blockedCount}`,
    `Allowed read-only count: ${report.allowedReadOnlyCount}`,
    '',
    'Classification distribution:',
  ];

  for (const [classification, count] of Object.entries(report.classificationDistribution)) {
    if (count > 0) {
      lines.push(`  ${classification}: ${count}`);
    }
  }
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}

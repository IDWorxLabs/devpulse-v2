/**
 * Recovery Strategy Planner founder-readable report.
 */

import type {
  RecoveryStrategy,
  RecoveryStrategyPlannerState,
  RecoveryStrategyReport,
} from './types.js';
import { DUPLICATE_RISK_PREFIX, RECOVERY_OWNER_MODULE } from './types.js';

export function buildRecoveryStrategyReport(
  state: RecoveryStrategyPlannerState,
  strategies: RecoveryStrategy[],
): RecoveryStrategyReport {
  const scenarioCount = strategies.reduce((sum, s) => sum + s.scenarios.length, 0);
  const latestStrategy = strategies.length > 0 ? strategies[strategies.length - 1] : null;
  const duplicateRiskCount = strategies.reduce((sum, s) => sum + s.duplicateRisks.length, 0);

  let recommendation =
    'Recovery Strategy Planner produces recovery plans — future Recovery Chains and Rollback Engine execute recovery, not this planner.';
  if (state.strategyCount === 0) {
    recommendation =
      'Generate recovery strategies from code plans and implementation strategies before execution systems exist.';
  } else if (duplicateRiskCount > 0) {
    recommendation =
      'Review DUPLICATE_RISK warnings — prefer integration, extension, or consolidation in recovery paths.';
  }

  return {
    ownerModule: RECOVERY_OWNER_MODULE,
    strategyCount: state.strategyCount,
    scenarioCount,
    readyCount: strategies.filter((s) => s.status === 'READY').length,
    warnCount: strategies.filter((s) => s.status === 'WARN').length,
    blockedCount: strategies.filter((s) => s.status === 'BLOCKED').length,
    duplicateRiskCount,
    latestStrategy: latestStrategy
      ? {
          ...latestStrategy,
          scenarios: latestStrategy.scenarios.map((s) => ({
            ...s,
            validationRequirements: [...s.validationRequirements],
            warnings: [...s.warnings],
            errors: [...s.errors],
          })),
          duplicateRisks: [...latestStrategy.duplicateRisks],
          warnings: [...latestStrategy.warnings],
          errors: [...latestStrategy.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatRecoveryStrategyReport(
  state: RecoveryStrategyPlannerState,
  strategies: RecoveryStrategy[],
): string {
  const report = buildRecoveryStrategyReport(state, strategies);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Recovery Strategy Planner Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Planner ID: ${state.plannerId}`,
    `Strategy count: ${report.strategyCount}`,
    `Scenario count: ${report.scenarioCount}`,
    `Ready: ${report.readyCount} | Warn: ${report.warnCount} | Blocked: ${report.blockedCount}`,
    `Duplicate risk count: ${report.duplicateRiskCount}`,
    '',
  ];

  if (report.latestStrategy) {
    lines.push(`Latest strategy: ${report.latestStrategy.strategyId}`);
    lines.push(`  Code plan: ${report.latestStrategy.codePlanId}`);
    lines.push(`  Status: ${report.latestStrategy.status}`);
    lines.push(`  Scenarios: ${report.latestStrategy.scenarios.length}`);
    if (report.latestStrategy.duplicateRisks.length > 0) {
      lines.push(
        `  Duplicate risks: ${report.latestStrategy.duplicateRisks.filter((r) => r.startsWith(DUPLICATE_RISK_PREFIX)).length}`,
      );
    }
    lines.push('');
  }

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

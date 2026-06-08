/**
 * Implementation Strategy Engine founder-readable report.
 */

import type {
  ImplementationStrategy,
  ImplementationStrategyEngineState,
  ImplementationStrategyReport,
} from './types.js';
import { DUPLICATE_RISK_PREFIX, STRATEGY_OWNER_MODULE } from './types.js';

export function buildImplementationStrategyReport(
  state: ImplementationStrategyEngineState,
  strategies: ImplementationStrategy[],
): ImplementationStrategyReport {
  const phaseCount = strategies.reduce((sum, s) => sum + s.phases.length, 0);
  const latestStrategy = strategies.length > 0 ? strategies[strategies.length - 1] : null;
  const duplicateRiskCount = strategies.reduce((sum, s) => sum + s.duplicateRisks.length, 0);

  let recommendation =
    'Implementation Strategy Engine sequences build packages — Code Generation Planner comes next, not code generation.';
  if (state.strategyCount === 0) {
    recommendation =
      'Generate implementation strategies from Build Package Generator output before code planning.';
  } else if (duplicateRiskCount > 0) {
    recommendation =
      'Review DUPLICATE_RISK warnings — prefer integration, extension, or consolidation before sequencing.';
  }

  return {
    ownerModule: STRATEGY_OWNER_MODULE,
    strategyCount: state.strategyCount,
    phaseCount,
    readyCount: strategies.filter((s) => s.status === 'READY').length,
    warnCount: strategies.filter((s) => s.status === 'WARN').length,
    blockedCount: strategies.filter((s) => s.status === 'BLOCKED').length,
    duplicateRiskCount,
    latestStrategy: latestStrategy
      ? {
          ...latestStrategy,
          phases: latestStrategy.phases.map((p) => ({
            ...p,
            packageIds: [...p.packageIds],
            dependencies: [...p.dependencies],
            validationRequirements: [...p.validationRequirements],
            warnings: [...p.warnings],
            errors: [...p.errors],
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

export function formatImplementationStrategyReport(
  state: ImplementationStrategyEngineState,
  strategies: ImplementationStrategy[],
): string {
  const report = buildImplementationStrategyReport(state, strategies);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Implementation Strategy Engine Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Engine ID: ${state.engineId}`,
    `Strategy count: ${report.strategyCount}`,
    `Phase count: ${report.phaseCount}`,
    `Ready: ${report.readyCount} | Warn: ${report.warnCount} | Blocked: ${report.blockedCount}`,
    `Duplicate risk count: ${report.duplicateRiskCount}`,
    '',
  ];

  if (report.latestStrategy) {
    lines.push(`Latest strategy: ${report.latestStrategy.strategyId}`);
    lines.push(`  Status: ${report.latestStrategy.status}`);
    lines.push(`  Phases: ${report.latestStrategy.phases.length}`);
    for (const phase of report.latestStrategy.phases) {
      lines.push(`    ${phase.title}`);
    }
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

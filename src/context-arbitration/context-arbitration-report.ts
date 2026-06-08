/**
 * Context Arbitration founder-readable report — context selection only.
 */

import type {
  ContextArbitrationReport,
  ContextArbitrationResult,
  ContextArbitrationState,
} from './types.js';
import { CONTEXT_ARBITRATION_OWNER_MODULE } from './types.js';

export function buildContextArbitrationReport(
  state: ContextArbitrationState,
  arbitrations: ContextArbitrationResult[],
): ContextArbitrationReport {
  const latestArbitration = arbitrations.length > 0 ? arbitrations[arbitrations.length - 1] : null;
  const selectedContextCount = arbitrations.reduce(
    (sum, a) => sum + a.selectedContext.length,
    0,
  );
  const ignoredContextCount = arbitrations.reduce(
    (sum, a) => sum + a.ignoredContext.length,
    0,
  );

  let recommendation =
    'Context Arbitration filters relevant context — Chat Authority still owns answers.';
  if (state.arbitrationCount === 0) {
    recommendation =
      'Arbitrate context candidates against intent before downstream systems consume context.';
  } else if (latestArbitration && latestArbitration.selectedContext.length === 0) {
    recommendation =
      'No context selected — review intent type mapping or reduce irrelevant candidate pollution.';
  }

  return {
    ownerModule: CONTEXT_ARBITRATION_OWNER_MODULE,
    totalArbitrations: state.arbitrationCount,
    selectedContextCount,
    ignoredContextCount,
    latestArbitration: latestArbitration
      ? {
          ...latestArbitration,
          selectedContext: latestArbitration.selectedContext.map((c) => ({ ...c })),
          ignoredContext: latestArbitration.ignoredContext.map((c) => ({ ...c })),
          warnings: [...latestArbitration.warnings],
          errors: [...latestArbitration.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatContextArbitrationReport(
  state: ContextArbitrationState,
  arbitrations: ContextArbitrationResult[],
): string {
  const report = buildContextArbitrationReport(state, arbitrations);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Context Arbitration Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Arbitration ID: ${state.arbitrationId}`,
    `Total arbitrations: ${report.totalArbitrations}`,
    `Selected context count: ${report.selectedContextCount}`,
    `Ignored context count: ${report.ignoredContextCount}`,
    '',
  ];

  if (report.latestArbitration) {
    lines.push(`Latest arbitration: ${report.latestArbitration.arbitrationId}`);
    if (report.latestArbitration.selectedContext.length > 0) {
      lines.push('Selected:');
      for (const ctx of report.latestArbitration.selectedContext) {
        lines.push(`  • ${ctx.source} [${ctx.priority}] — ${ctx.label}`);
      }
    }
    if (report.latestArbitration.ignoredContext.length > 0) {
      lines.push('Ignored:');
      for (const ctx of report.latestArbitration.ignoredContext) {
        lines.push(`  • ${ctx.source} [${ctx.priority}] — ${ctx.label}`);
      }
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

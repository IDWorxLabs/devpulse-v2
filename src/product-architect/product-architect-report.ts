/**
 * Product Architect founder-readable report.
 */

import type {
  ArchitectureBlueprint,
  ArchitectureComponentType,
  ProductArchitectReport,
  ProductArchitectState,
} from './types.js';
import { ARCHITECT_OWNER_MODULE, DUPLICATE_RISK_PREFIX } from './types.js';

function countByType(blueprints: ArchitectureBlueprint[], type: ArchitectureComponentType): number {
  return blueprints.reduce(
    (sum, b) => sum + b.components.filter((c) => c.type === type).length,
    0,
  );
}

function countDuplicateRisks(blueprints: ArchitectureBlueprint[]): number {
  return blueprints.reduce(
    (sum, b) =>
      sum +
      b.components.filter((c) => c.warnings.some((w) => w.startsWith(DUPLICATE_RISK_PREFIX))).length,
    0,
  );
}

export function buildProductArchitectReport(
  state: ProductArchitectState,
  blueprints: ArchitectureBlueprint[],
): ProductArchitectReport {
  const componentCount = blueprints.reduce((sum, b) => sum + b.components.length, 0);
  const latestBlueprint = blueprints.length > 0 ? blueprints[blueprints.length - 1] : null;
  const duplicateRiskCount = countDuplicateRisks(blueprints);

  let recommendation =
    'Product Architect designs blueprints — Build Package Generator comes next, not code generation.';
  if (state.blueprintCount === 0) {
    recommendation =
      'Generate architecture blueprints from Requirement Extractor output before build planning.';
  } else if (duplicateRiskCount > 0) {
    recommendation =
      'Review DUPLICATE_RISK warnings — prefer integration, extension, or consolidation over duplication.';
  }

  return {
    ownerModule: ARCHITECT_OWNER_MODULE,
    totalBlueprints: state.blueprintCount,
    componentCount,
    screenCount: countByType(blueprints, 'SCREEN'),
    moduleCount: countByType(blueprints, 'MODULE'),
    integrationCount: countByType(blueprints, 'INTEGRATION'),
    duplicateRiskCount,
    latestBlueprint: latestBlueprint
      ? {
          ...latestBlueprint,
          components: latestBlueprint.components.map((c) => ({
            ...c,
            warnings: [...c.warnings],
            errors: [...c.errors],
          })),
          warnings: [...latestBlueprint.warnings],
          errors: [...latestBlueprint.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatProductArchitectReport(
  state: ProductArchitectState,
  blueprints: ArchitectureBlueprint[],
): string {
  const report = buildProductArchitectReport(state, blueprints);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Product Architect Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Architect ID: ${state.architectId}`,
    `Total blueprints: ${report.totalBlueprints}`,
    `Component count: ${report.componentCount}`,
    `Screens: ${report.screenCount} | Modules: ${report.moduleCount} | Integrations: ${report.integrationCount}`,
    `Duplicate risk count: ${report.duplicateRiskCount}`,
    '',
  ];

  if (report.latestBlueprint) {
    lines.push(`Latest blueprint: ${report.latestBlueprint.blueprintId}`);
    lines.push(`  Request: ${report.latestBlueprint.requestId}`);
    lines.push(`  Components: ${report.latestBlueprint.components.length}`);
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

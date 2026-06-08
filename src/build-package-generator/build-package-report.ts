/**
 * Build Package Generator founder-readable report.
 */

import type {
  BuildPackage,
  BuildPackageGenerationResult,
  BuildPackageReport,
  BuildPackageGeneratorState,
} from './types.js';
import { DUPLICATE_RISK_PREFIX, GENERATOR_OWNER_MODULE } from './types.js';

export function buildBuildPackageReport(
  state: BuildPackageGeneratorState,
  generations: BuildPackageGenerationResult[],
): BuildPackageReport {
  const allPackages = generations.flatMap((g) => g.packages);
  const latestPackage = allPackages.length > 0 ? allPackages[allPackages.length - 1] : null;
  const duplicateRiskCount = allPackages.reduce((sum, p) => sum + p.duplicateRisks.length, 0);

  let recommendation =
    'Build Package Generator produces implementation packages — Implementation Strategy Engine comes next, not code generation.';
  if (state.generationCount === 0) {
    recommendation =
      'Generate build packages from Product Architect blueprints before implementation strategy.';
  } else if (duplicateRiskCount > 0) {
    recommendation =
      'Review DUPLICATE_RISK warnings — prefer integration, extension, or consolidation over duplication.';
  }

  return {
    ownerModule: GENERATOR_OWNER_MODULE,
    packageCount: allPackages.length,
    readyCount: allPackages.filter((p) => p.status === 'READY').length,
    warnCount: allPackages.filter((p) => p.status === 'WARN').length,
    blockedCount: allPackages.filter((p) => p.status === 'BLOCKED').length,
    duplicateRiskCount,
    latestPackage: latestPackage
      ? {
          ...latestPackage,
          modules: [...latestPackage.modules],
          dependencies: [...latestPackage.dependencies],
          validationRequirements: [...latestPackage.validationRequirements],
          risks: [...latestPackage.risks],
          duplicateRisks: [...latestPackage.duplicateRisks],
          rollbackRequirements: [...latestPackage.rollbackRequirements],
          warnings: [...latestPackage.warnings],
          errors: [...latestPackage.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatBuildPackageReport(
  state: BuildPackageGeneratorState,
  generations: BuildPackageGenerationResult[],
): string {
  const report = buildBuildPackageReport(state, generations);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Build Package Generator Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Generator ID: ${state.generatorId}`,
    `Package count: ${report.packageCount}`,
    `Ready: ${report.readyCount} | Warn: ${report.warnCount} | Blocked: ${report.blockedCount}`,
    `Duplicate risk count: ${report.duplicateRiskCount}`,
    '',
  ];

  if (report.latestPackage) {
    lines.push(`Latest package: ${report.latestPackage.packageId}`);
    lines.push(`  Blueprint: ${report.latestPackage.blueprintId}`);
    lines.push(`  Objective: ${report.latestPackage.objective}`);
    lines.push(`  Status: ${report.latestPackage.status}`);
    lines.push(`  Modules: ${report.latestPackage.modules.join(', ')}`);
    if (report.latestPackage.duplicateRisks.length > 0) {
      lines.push(`  Duplicate risks: ${report.latestPackage.duplicateRisks.filter((r) => r.startsWith(DUPLICATE_RISK_PREFIX)).length}`);
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

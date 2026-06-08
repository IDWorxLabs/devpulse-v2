/**
 * Founder-readable build gate report formatting.
 */

import type { BuildGateResult, FounderGateReport, RiskLevel, Violation } from './types.js';

function maxRiskLevel(violations: Violation[]): RiskLevel {
  const order: RiskLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
  let max: RiskLevel = 'none';
  for (const v of violations) {
    if (order.indexOf(v.riskLevel) > order.indexOf(max)) {
      max = v.riskLevel;
    }
  }
  return violations.length === 0 ? 'none' : max;
}

function collectAffectedSystems(result: BuildGateResult): string[] {
  const systems = new Set<string>();
  for (const v of result.violations) {
    if (v.systemId) {
      systems.add(v.systemId);
    }
  }
  for (const pr of result.phaseResults) {
    if (!pr.allowed) {
      systems.add(pr.systemId);
    }
  }
  return [...systems];
}

function collectRecommendedRepairs(result: BuildGateResult): string[] {
  const repairs = new Set<string>();
  for (const v of result.violations) {
    repairs.add(v.recommendedAction);
  }
  for (const w of result.warnings) {
    repairs.add(w.recommendedAction);
  }
  return [...repairs];
}

export function formatFounderGateReport(result: BuildGateResult): FounderGateReport {
  const verdict = result.passed ? 'PASS' : 'FAIL';
  const riskLevel = maxRiskLevel(result.violations);

  return {
    verdict,
    lawViolations: result.violations,
    warnings: result.warnings,
    affectedSystems: collectAffectedSystems(result),
    riskLevel,
    recommendedRepair: collectRecommendedRepairs(result),
    buildAllowed: result.buildAllowed,
    summary: result.summary,
  };
}

export function formatFounderGateReportText(result: BuildGateResult): string {
  const report = formatFounderGateReport(result);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Founder Build Gate Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Verdict:        ${report.verdict}`);
  lines.push(`Build allowed:  ${report.buildAllowed ? 'YES' : 'NO'}`);
  lines.push(`Risk level:     ${report.riskLevel.toUpperCase()}`);
  lines.push(`Summary:        ${report.summary}`);
  lines.push('');

  if (report.affectedSystems.length > 0) {
    lines.push('Affected systems:');
    for (const s of report.affectedSystems) {
      lines.push(`  • ${s}`);
    }
    lines.push('');
  }

  if (report.lawViolations.length > 0) {
    lines.push(`Law violations (${report.lawViolations.length}):`);
    for (const v of report.lawViolations) {
      lines.push(`  [${v.code}] ${v.message}`);
      lines.push(`    Law: ${v.lawReference}`);
      lines.push(`    Repair: ${v.recommendedAction}`);
    }
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push(`Warnings (${report.warnings.length}):`);
    for (const w of report.warnings) {
      lines.push(`  [${w.code}] ${w.message}`);
      lines.push(`    Repair: ${w.recommendedAction}`);
    }
    lines.push('');
  }

  if (report.recommendedRepair.length > 0 && report.verdict === 'FAIL') {
    lines.push('Recommended repair actions:');
    report.recommendedRepair.forEach((r, i) => {
      lines.push(`  ${i + 1}. ${r}`);
    });
    lines.push('');
  }

  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}

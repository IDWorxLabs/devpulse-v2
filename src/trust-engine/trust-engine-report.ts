/**
 * Founder-readable Trust Engine report.
 */

import type { TrustEngineReport, TrustResult } from './types.js';

export function buildTrustEngineReport(result: TrustResult): TrustEngineReport {
  const passCount = result.checks.filter((c) => c.status === 'PASS').length;
  const warnCount = result.checks.filter((c) => c.status === 'WARN').length;
  const failCount = result.checks.filter((c) => c.status === 'FAIL').length;

  const failedChecks = result.checks.filter((c) => c.status === 'FAIL');
  const warnChecks = result.checks.filter((c) => c.status === 'WARN');
  const highestRisk =
    failedChecks[0]?.name ??
    warnChecks[0]?.name ??
    (result.status === 'PASS' ? 'None identified' : 'Review trust checks');

  let recommendation =
    'Trust Engine PASS — system outputs and UI behavior are supported by observed evidence.';
  if (result.status === 'FAIL') {
    recommendation =
      'Resolve failing trust checks before treating DevPulse outputs as trustworthy.';
  } else if (result.status === 'WARN') {
    recommendation =
      'Review trust warnings; attach real browser and complete Phase 1 soak before high-confidence trust.';
  }

  const summary = [
    `Trust ${result.status}`,
    `score=${result.trustScore}`,
    `confidence=${result.confidence}`,
    `checks=${result.checks.length}`,
    `evidence=${result.evidence.length}`,
  ].join(' | ');

  return {
    trustId: result.trustId,
    trustScore: result.trustScore,
    confidence: result.confidence,
    passCount,
    warnCount,
    failCount,
    evidenceCount: result.evidence.length,
    highestRisk,
    recommendation,
    summary,
  };
}

export function formatTrustEngineReport(result: TrustResult): string {
  const report = buildTrustEngineReport(result);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Trust Engine Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Trust ID:               ${report.trustId}`);
  lines.push(`Overall status:         ${result.status}`);
  lines.push(`Trust score:            ${report.trustScore}/100`);
  lines.push(`Confidence:             ${report.confidence}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Pass / Warn / Fail:     ${report.passCount} / ${report.warnCount} / ${report.failCount}`);
  lines.push(`Evidence collected:     ${report.evidenceCount}`);
  lines.push(`Highest risk:           ${report.highestRisk}`);
  lines.push('');

  lines.push('Trust checks:');
  for (const c of result.checks) {
    lines.push(`  [${c.checkId}] ${c.name} — ${c.status}`);
    lines.push(`    Reason: ${c.reason}`);
    lines.push(`    Evidence: ${c.evidenceIds.join(', ')}`);
  }
  lines.push('');

  lines.push('Evidence:');
  for (const e of result.evidence) {
    lines.push(`  [${e.evidenceId}] ${e.source}`);
    lines.push(`    ${e.summary}`);
  }
  lines.push('');

  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const w of result.warnings) {
      lines.push(`  • ${w}`);
    }
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const e of result.errors) {
      lines.push(`  • ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation:         ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}

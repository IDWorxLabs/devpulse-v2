/**
 * Founder-readable browser verification report.
 */

import type { BrowserVerificationResult } from './types.js';
import type { BrowserVerificationReportSummary } from './types.js';

export function buildBrowserVerificationReportSummary(
  result: BrowserVerificationResult,
  realBrowserRunnerAttached: boolean,
): BrowserVerificationReportSummary {
  const passCount = result.checks.filter((c) => c.status === 'PASS').length;
  const warnCount = result.checks.filter((c) => c.status === 'WARN').length;
  const failCount = result.checks.filter((c) => c.status === 'FAIL').length;

  const visibleCheck = result.checks.find((c) => c.checkId === 'BV-10' || c.checkId === 'RB-01');
  const clickableCheck = result.checks.find((c) => c.checkId === 'BV-11' || c.checkId === 'RB-03');
  const answerCheck = result.checks.find((c) => c.checkId === 'BV-07' || c.checkId === 'RB-05');
  const feedCheck = result.checks.find((c) => c.checkId === 'BV-08' || c.checkId === 'RB-07');

  const warnings = [...result.warnings];
  if (!realBrowserRunnerAttached) {
    if (result.realBrowserRunnerStatus === 'PACKAGE_REQUIRED') {
      warnings.push('REAL_BROWSER_PACKAGE_REQUIRED — install Playwright to attach real browser runner.');
    } else {
      warnings.push('Real browser runner not yet attached — simulated HTML verification only.');
    }
  }

  let recommendation = 'Browser verification PASS — Phase 1 stack verified in simulated browser reality.';
  if (realBrowserRunnerAttached) {
    recommendation = 'Browser verification PASS — real browser runner attached via Playwright.';
  } else if (result.realBrowserRunnerStatus === 'PACKAGE_REQUIRED') {
    recommendation =
      'Install Playwright and browser binaries to attach real browser runner before Phase 2.';
  } else if (result.status === 'FAIL') {
    recommendation = 'Fix failing browser reality checks before Stability Soak.';
  } else if (result.status === 'WARN') {
    recommendation =
      'Review warnings; attach real browser runner before production release.';
  }

  const summary = [
    `Verification ${result.status}`,
    `checks=${result.checks.length}`,
    `pass=${passCount}`,
    `warn=${warnCount}`,
    `fail=${failCount}`,
    `runner=${result.runnerUsed}`,
    `realStatus=${result.realBrowserRunnerStatus}`,
  ].join(' | ');

  return {
    verificationId: result.verificationId,
    totalChecks: result.checks.length,
    passCount,
    warnCount,
    failCount,
    visibleTargetStatus: visibleCheck?.status ?? 'N/A',
    clickableTargetStatus: clickableCheck?.status ?? 'N/A',
    chatAnswerVisible: answerCheck?.status === 'PASS',
    inlineFeedVisible: feedCheck?.status === 'PASS',
    realBrowserRunnerAttached,
    runnerUsed: result.runnerUsed,
    realBrowserRunnerStatus: result.realBrowserRunnerStatus,
    warnings,
    errors: result.errors,
    recommendation,
    summary,
  };
}

export function formatBrowserVerificationReport(
  result: BrowserVerificationResult,
  realBrowserRunnerAttached: boolean,
): string {
  const report = buildBrowserVerificationReportSummary(result, realBrowserRunnerAttached);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Browser Verification Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Verification ID:        ${report.verificationId}`);
  lines.push(`Overall status:         ${result.status}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Total checks:           ${report.totalChecks}`);
  lines.push(`Pass / Warn / Fail:     ${report.passCount} / ${report.warnCount} / ${report.failCount}`);
  lines.push(`Visible target:         ${report.visibleTargetStatus}`);
  lines.push(`Clickable target:       ${report.clickableTargetStatus}`);
  lines.push(`Chat answer visible:    ${report.chatAnswerVisible}`);
  lines.push(`Inline feed visible:    ${report.inlineFeedVisible}`);
  lines.push(`Runner used:            ${report.runnerUsed}`);
  lines.push(`Real browser status:    ${report.realBrowserRunnerStatus}`);
  lines.push(`Real browser attached:  ${report.realBrowserRunnerAttached}`);
  lines.push('');

  lines.push('Checks:');
  for (const c of result.checks) {
    lines.push(`  [${c.checkId}] ${c.name} — ${c.status}`);
    lines.push(`    Expected: ${c.expected}`);
    lines.push(`    Actual:   ${c.actual}`);
    if (c.latencyMs !== undefined) lines.push(`    Latency:  ${c.latencyMs}ms`);
  }
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push(`Warnings (${report.warnings.length}):`);
    for (const w of report.warnings) {
      lines.push(`  • ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push(`Errors (${report.errors.length}):`);
    for (const e of report.errors) {
      lines.push(`  • ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation:         ${report.recommendation}`);
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}

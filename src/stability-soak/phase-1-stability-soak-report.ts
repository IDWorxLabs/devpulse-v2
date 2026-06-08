/**
 * Phase 1 Stability Soak report formatting.
 */

import type {
  Phase1StabilitySoakReport,
  Phase1StabilitySoakState,
} from './types.js';
import { PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED } from './types.js';

export function buildPhase1StabilitySoakReport(
  state: Phase1StabilitySoakState,
): Phase1StabilitySoakReport {
  const browserRunnerStatus = state.realBrowserRunnerAttached ? 'real' : 'simulated';

  const remainingPhase1Risk: string[] = [];
  if (!state.realBrowserRunnerAttached) {
    remainingPhase1Risk.push('Real browser runner not attached — simulated verification only.');
  }
  if (state.elapsedDaysClaimed < PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED) {
    remainingPhase1Risk.push(
      `Calendar soak not complete — ${PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED}-day stability window not claimed (elapsed: ${state.elapsedDaysClaimed} days).`,
    );
  }
  if (state.failCount > 0) {
    remainingPhase1Risk.push(`${state.failCount} soak cycle(s) failed — fix before Phase 2.`);
  }

  let repeatedStabilityResult = 'No cycles run.';
  if (state.runCount > 0) {
    repeatedStabilityResult = `${state.passCount} pass, ${state.warnCount} warn, ${state.failCount} fail across ${state.runCount} cycle(s).`;
  }

  let recommendation =
    'Repeated foundation soak stable — attach real browser runner and begin calendar soak before Phase 2.';
  if (state.status === 'FAIL' || state.phase2Readiness === 'NOT_READY') {
    recommendation = 'Fix failing soak cycles before any Phase 2 work.';
  } else if (state.phase2Readiness === 'REAL_BROWSER_REQUIRED') {
    recommendation =
      'Foundation stack repeats cleanly in simulated browser reality. Phase 2 blocked until real browser runner is attached and calendar soak completes.';
  } else if (state.phase2Readiness === 'FOUNDATION_READY') {
    recommendation =
      'Real browser runner attached and repeated cycles stable — proceed with calendar soak monitoring toward Phase 2 gate.';
  }

  const summary = [
    `Soak ${state.status}`,
    `cycles=${state.runCount}`,
    `phase2=${state.phase2Readiness}`,
    `browser=${browserRunnerStatus}`,
    `days=${state.elapsedDaysClaimed}/${PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED}`,
  ].join(' | ');

  return {
    soakId: state.soakId,
    runCount: state.runCount,
    passCount: state.passCount,
    warnCount: state.warnCount,
    failCount: state.failCount,
    status: state.status,
    phase2Readiness: state.phase2Readiness,
    browserRunnerStatus,
    repeatedStabilityResult,
    remainingPhase1Risk,
    recommendation,
    summary,
    warnings: state.warnings,
    errors: state.errors,
    elapsedDaysClaimed: state.elapsedDaysClaimed,
  };
}

export function formatPhase1StabilitySoakReport(state: Phase1StabilitySoakState): string {
  const report = buildPhase1StabilitySoakReport(state);
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  DevPulse V2 — Phase 1 Stability Soak Report');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Soak ID:                ${report.soakId}`);
  lines.push(`Status:                 ${report.status}`);
  lines.push(`Phase 2 readiness:      ${report.phase2Readiness}`);
  lines.push(`Summary:                ${report.summary}`);
  lines.push('');
  lines.push(`Run count:              ${report.runCount}`);
  lines.push(`Pass / Warn / Fail:     ${report.passCount} / ${report.warnCount} / ${report.failCount}`);
  lines.push(`Browser runner:         ${report.browserRunnerStatus}`);
  lines.push(`Repeated stability:     ${report.repeatedStabilityResult}`);
  lines.push(
    `Calendar days claimed:  ${report.elapsedDaysClaimed} (required for Phase 2 gate: ${PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED})`,
  );
  lines.push('');

  if (report.remainingPhase1Risk.length > 0) {
    lines.push('Remaining Phase 1 risk:');
    for (const r of report.remainingPhase1Risk) {
      lines.push(`  • ${r}`);
    }
    lines.push('');
  }

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

/**
 * DevPulse V2 clickability tracker — shell visibility and interaction timing.
 */

import {
  SHELL_CONSTITUTIONAL_TARGETS,
  type ClickabilityReport,
  type DevPulseV2ShellState,
} from './types.js';

const FIRST_CLICKABLE_CONTROL = 'shell-primary-surface';

let startupStartedAt = 0;
let shellVisibleAt: number | null = null;
let shellClickableAt: number | null = null;
let clickabilityState: 'pending' | 'achieved' = 'pending';

export function resetClickabilityTrackerForTests(startedAt: number = Date.now()): void {
  startupStartedAt = startedAt;
  shellVisibleAt = null;
  shellClickableAt = null;
  clickabilityState = 'pending';
}

export function bindClickabilityStartup(startedAt: number): void {
  startupStartedAt = startedAt;
}

export function markShellVisible(at: number = Date.now()): void {
  if (shellVisibleAt === null) {
    shellVisibleAt = at;
  }
}

export function markShellClickable(at: number = Date.now()): void {
  if (shellClickableAt === null) {
    shellClickableAt = at;
    clickabilityState = 'achieved';
  }
}

export function getClickabilityReport(): ClickabilityReport {
  const visibleMs =
    shellVisibleAt !== null ? shellVisibleAt - startupStartedAt : null;
  const clickableMs =
    shellClickableAt !== null ? shellClickableAt - startupStartedAt : null;

  return {
    firstClickableControl: FIRST_CLICKABLE_CONTROL,
    clickabilityAchievedAt: shellClickableAt,
    clickabilityState,
    visibleAt: shellVisibleAt,
    visibleMs,
    clickableMs,
    visibleTargetMet:
      visibleMs !== null ? visibleMs <= SHELL_CONSTITUTIONAL_TARGETS.visibleTargetMs : null,
    clickableTargetMet:
      clickableMs !== null
        ? clickableMs <= SHELL_CONSTITUTIONAL_TARGETS.clickableTargetMs
        : null,
  };
}

export function applyClickabilityToShellState(state: DevPulseV2ShellState): DevPulseV2ShellState {
  const report = getClickabilityReport();
  const warnings = [...state.warnings];

  if (report.visibleMs !== null && report.visibleMs > SHELL_CONSTITUTIONAL_TARGETS.visibleTargetMs) {
    warnings.push(
      `Visible target exceeded: ${report.visibleMs}ms > ${SHELL_CONSTITUTIONAL_TARGETS.visibleTargetMs}ms`,
    );
  }

  if (
    report.clickableMs !== null &&
    report.clickableMs > SHELL_CONSTITUTIONAL_TARGETS.clickableTargetMs
  ) {
    warnings.push(
      `Clickable target exceeded: ${report.clickableMs}ms > ${SHELL_CONSTITUTIONAL_TARGETS.clickableTargetMs}ms`,
    );
  }

  let status = state.status;
  if (report.clickableTargetMet === false || report.visibleTargetMet === false) {
    status = 'DEGRADED';
  }

  return {
    ...state,
    shellVisibleAt: report.visibleAt ?? undefined,
    shellClickableAt: report.clickabilityAchievedAt ?? undefined,
    visibleMs: report.visibleMs ?? undefined,
    clickableMs: report.clickableMs ?? undefined,
    status,
    warnings,
  };
}

export function getFirstClickableControlId(): string {
  return FIRST_CLICKABLE_CONTROL;
}

/**
 * Self Vision observation engine — read-only UI reality observation.
 * Does NOT click, mutate UI, execute actions, or generate code.
 */

import { getDevPulseV2VisibleUiGuardAuthority } from '../visible-ui-guard/visible-ui-guard-authority.js';
import type { VisibleUiCheckResult, VisibleUiElementRecord } from '../visible-ui-guard/types.js';
import type {
  ObservationRecord,
  ObservationSession,
  ObservationStatus,
  ObservationSummary,
} from './types.js';

function createObservationId(): string {
  return `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createObservationSessionId(): string {
  return `obs-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mapCheckToObservationStatus(
  check: VisibleUiCheckResult,
  interactive: boolean,
): ObservationStatus {
  if (!check.visible) return 'HIDDEN';
  if (interactive && check.clickable) return 'CLICKABLE';
  if (interactive && !check.clickable) return 'NOT_CLICKABLE';
  if (check.visible) return 'VISIBLE';
  return 'UNKNOWN';
}

export function observationFromCheckResult(
  check: VisibleUiCheckResult,
  record: VisibleUiElementRecord,
): ObservationRecord {
  return {
    observationId: createObservationId(),
    createdAt: Date.now(),
    elementId: record.elementId,
    selector: record.expectedSelector,
    status: mapCheckToObservationStatus(check, record.interactive),
    sourceSystemId: record.ownerSystemId,
    warnings: [...check.warnings],
    errors: [...check.errors],
  };
}

export function observeElement(
  record: VisibleUiElementRecord,
  htmlOrDomSnapshot: string,
): ObservationRecord {
  const guard = getDevPulseV2VisibleUiGuardAuthority();
  const check = guard.checkElement(record, htmlOrDomSnapshot);
  return observationFromCheckResult(check, record);
}

export function observeRegisteredUi(htmlOrDomSnapshot: string): ObservationSession {
  const guard = getDevPulseV2VisibleUiGuardAuthority();
  const elements = guard.listVisibleUiElements();
  const checks = guard.runChecks(htmlOrDomSnapshot);
  const checkByElementId = new Map(checks.map((c) => [c.elementId, c]));

  const observations = elements.map((record) => {
    const check = checkByElementId.get(record.elementId);
    if (!check) {
      return {
        observationId: createObservationId(),
        createdAt: Date.now(),
        elementId: record.elementId,
        selector: record.expectedSelector,
        status: 'UNKNOWN' as ObservationStatus,
        sourceSystemId: record.ownerSystemId,
        warnings: ['No check result available for registered element.'],
        errors: [],
      };
    }
    return observationFromCheckResult(check, record);
  });

  return {
    sessionId: createObservationSessionId(),
    createdAt: Date.now(),
    observations,
    warnings: ['Self Vision observes registered UI read-only — no mutation or execution.'],
    errors: [],
  };
}

export function observeVisibleUi(): ObservationSession {
  const guard = getDevPulseV2VisibleUiGuardAuthority();
  const elements = guard.listVisibleUiElements();
  const checks = guard.getLastCheckResults();
  const checkByElementId = new Map(checks.map((c) => [c.elementId, c]));

  const observations = elements.map((record) => {
    const check = checkByElementId.get(record.elementId);
    if (!check) {
      return {
        observationId: createObservationId(),
        createdAt: Date.now(),
        elementId: record.elementId,
        selector: record.expectedSelector,
        status: 'UNKNOWN' as ObservationStatus,
        sourceSystemId: record.ownerSystemId,
        warnings: ['No prior visibility check — run observeRegisteredUi with snapshot first.'],
        errors: [],
      };
    }
    return observationFromCheckResult(check, record);
  });

  return {
    sessionId: createObservationSessionId(),
    createdAt: Date.now(),
    observations,
    warnings: ['Self Vision observes visible UI from guard check results — read-only.'],
    errors: [],
  };
}

export function summarizeObservations(session: ObservationSession): ObservationSummary {
  const visibleCount = session.observations.filter((o) => o.status === 'VISIBLE').length;
  const hiddenCount = session.observations.filter((o) => o.status === 'HIDDEN').length;
  const clickableCount = session.observations.filter((o) => o.status === 'CLICKABLE').length;
  const notClickableCount = session.observations.filter((o) => o.status === 'NOT_CLICKABLE').length;
  const unknownCount = session.observations.filter((o) => o.status === 'UNKNOWN').length;

  const parts: string[] = [];
  if (session.observations.length === 0) {
    parts.push('No UI elements observed.');
  } else {
    parts.push(
      `Observed ${session.observations.length} element(s): ${visibleCount} visible, ${hiddenCount} hidden, ${clickableCount} clickable, ${notClickableCount} not clickable, ${unknownCount} unknown.`,
    );
  }

  return {
    summaryId: `obs-summary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: session.sessionId,
    observationCount: session.observations.length,
    visibleCount,
    hiddenCount,
    clickableCount,
    notClickableCount,
    unknownCount,
    summary: parts.join(' '),
    publishedAt: Date.now(),
    warnings: [...session.warnings],
    errors: [...session.errors],
  };
}

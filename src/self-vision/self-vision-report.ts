/**
 * Self Vision founder-readable report.
 */

import type { ObservationSession, ObservationSummary, SelfVisionReport } from './types.js';
import { SELF_VISION_OWNER_MODULE } from './types.js';

export function buildSelfVisionReport(
  sessions: ObservationSession[],
  latestSummary: ObservationSummary | null = null,
): SelfVisionReport {
  const allObservations = sessions.flatMap((s) => s.observations);
  const visibleCount = allObservations.filter((o) => o.status === 'VISIBLE').length;
  const hiddenCount = allObservations.filter((o) => o.status === 'HIDDEN').length;
  const clickableCount = allObservations.filter((o) => o.status === 'CLICKABLE').length;
  const notClickableCount = allObservations.filter((o) => o.status === 'NOT_CLICKABLE').length;

  const sessionWarnings = sessions.flatMap((s) => s.warnings);
  const sessionErrors = sessions.flatMap((s) => s.errors);

  let recommendation =
    'Self Vision observes visible UI reality read-only — use observations for future replay and verification systems.';
  if (allObservations.length === 0) {
    recommendation =
      'No observations recorded — register UI elements with Visible UI Guard and run observation sessions.';
  } else if (hiddenCount > 0 || notClickableCount > 0) {
    recommendation =
      'Observation layer detected hidden or non-clickable elements — downstream repair systems may consume these observations; Self Vision does not fix.';
  } else if (latestSummary) {
    recommendation = latestSummary.summary;
  }

  return {
    ownerModule: SELF_VISION_OWNER_MODULE,
    observationCount: allObservations.length,
    visibleCount,
    hiddenCount,
    clickableCount,
    notClickableCount,
    sessionCount: sessions.length,
    warnings: [...sessionWarnings],
    errors: [...sessionErrors],
    recommendation,
  };
}

export function formatSelfVisionReport(
  sessions: ObservationSession[],
  latestSummary: ObservationSummary | null = null,
): string {
  const report = buildSelfVisionReport(sessions, latestSummary);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'DevPulse V2 Self Vision Observation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Observation sessions: ${report.sessionCount}`,
    `Total observations: ${report.observationCount}`,
    `Visible: ${report.visibleCount}`,
    `Hidden: ${report.hiddenCount}`,
    `Clickable: ${report.clickableCount}`,
    `Not clickable: ${report.notClickableCount}`,
    '',
  ];

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
  lines.push('');
  lines.push('Self Vision is observation-only — no mutation, execution, repair, or code generation.');
  return lines.join('\n');
}

/**
 * Auto-fix control panel founder-readable report.
 */

import type {
  AutoFixControlPanelState,
  AutoFixControlReport,
  AutoFixPermissionRecord,
} from './types.js';
import { AUTO_FIX_CONTROL_OWNER_MODULE } from './types.js';

export function buildAutoFixControlReport(
  state: AutoFixControlPanelState,
  records: AutoFixPermissionRecord[],
): AutoFixControlReport {
  const latestFix = records.length > 0 ? records[records.length - 1] : null;

  return {
    ownerModule: AUTO_FIX_CONTROL_OWNER_MODULE,
    fixCount: state.fixCount,
    latestFix,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Auto-Fix Control Panel governs fix permissions only — no fix execution, rollback, or file modification.',
  };
}

export function formatAutoFixControlReport(
  state: AutoFixControlPanelState,
  records: AutoFixPermissionRecord[],
): string {
  const report = buildAutoFixControlReport(state, records);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Auto-Fix Control Panel Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Panel ID: ${state.panelId}`,
    `Fix count: ${report.fixCount}`,
    '',
  ];

  if (report.latestFix) {
    const f = report.latestFix;
    lines.push(`Fix ID: ${f.fixId}`);
    lines.push(`Package ID: ${f.packageId}`);
    lines.push(`Fix type: ${f.fixType}`);
    lines.push(`Permission state: ${f.permissionState}`);
    lines.push(`Approval required: ${f.approvalRequired}`);
    lines.push(`Verification required: ${f.verificationRequired}`);
    lines.push(`Evidence count: ${f.evidenceLinks.length}`);
    lines.push(`Risk level: ${f.riskLevel}`);
    lines.push(`Control layer only: ${f.controlLayerOnlyConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No fix executed: ${f.noFixExecuted ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}

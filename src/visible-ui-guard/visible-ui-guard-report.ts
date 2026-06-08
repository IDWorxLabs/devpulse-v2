/**
 * Visible UI Guard founder-readable report.
 */

import type {
  VisibleUiCheckResult,
  VisibleUiGuardReport,
  VisibleUiRegistryState,
} from './types.js';
import { GUARD_OWNER_MODULE } from './types.js';
import type { VisibleUiElementRecord } from './types.js';

export function buildVisibleUiGuardReport(
  state: VisibleUiRegistryState,
  elements: VisibleUiElementRecord[],
  checkResults: VisibleUiCheckResult[] = [],
): VisibleUiGuardReport {
  const latestRegisteredElement = elements.length > 0 ? elements[elements.length - 1] : null;
  const missingMountTargetCount = elements.filter((e) => !e.mountTarget).length;
  const missingSelectorCount = elements.filter((e) => !e.expectedSelector).length;
  const visibilityFailCount = checkResults.filter((r) => !r.visible).length;
  const clickabilityFailCount = checkResults.filter((r) => r.visible && !r.clickable).length;

  let recommendation =
    'Register every visible panel/control with mount target and expected selector before claiming UI complete.';
  if (state.elementCount === 0) {
    recommendation =
      'No UI elements registered — future physical surfaces must register with Visible UI Guard.';
  } else if (visibilityFailCount > 0 || clickabilityFailCount > 0) {
    recommendation =
      'Fix visibility/clickability failures — a feature is not complete if UI does not surface or cannot be clicked.';
  }

  return {
    ownerModule: GUARD_OWNER_MODULE,
    registeredElementCount: state.elementCount,
    interactiveElementCount: state.interactiveCount,
    missingMountTargetCount,
    missingSelectorCount,
    visibilityFailCount,
    clickabilityFailCount,
    latestRegisteredElement: latestRegisteredElement ? { ...latestRegisteredElement } : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatVisibleUiGuardReport(
  state: VisibleUiRegistryState,
  elements: VisibleUiElementRecord[],
  checkResults: VisibleUiCheckResult[] = [],
): string {
  const report = buildVisibleUiGuardReport(state, elements, checkResults);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Visible UI Registration & Clickability Guard Report',
    '═══════════════════════════════════════════════════',
    '',
    `Guard owner: ${report.ownerModule}`,
    `Registered elements: ${report.registeredElementCount}`,
    `Interactive elements: ${report.interactiveElementCount}`,
    `Missing mount targets: ${report.missingMountTargetCount}`,
    `Missing selectors: ${report.missingSelectorCount}`,
    `Visibility failures: ${report.visibilityFailCount}`,
    `Clickability failures: ${report.clickabilityFailCount}`,
    '',
  ];

  if (report.latestRegisteredElement) {
    lines.push(`Latest registered: ${report.latestRegisteredElement.elementId} (${report.latestRegisteredElement.type})`);
    lines.push(`  Owner: ${report.latestRegisteredElement.ownerSystemId}`);
    lines.push(`  Selector: ${report.latestRegisteredElement.expectedSelector}`);
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

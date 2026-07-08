/** Service adapter for accessibility-settings — LISA — Locked In Syndrome App */
import type { AccessibilitySettingsRecord } from './accessibility-settings.types';

const DEMO_ACCESSIBILITY_SETTINGS_RECORDS: AccessibilitySettingsRecord[] = [
  { id: 'accessibility-settings-1', label: 'Sample Accessibility Settings record', createdAt: new Date().toISOString() },
  { id: 'accessibility-settings-2', label: 'Accessibility Settings preview entry', createdAt: new Date().toISOString() },
];

export function listAccessibilitySettingsRecords(): AccessibilitySettingsRecord[] {
  return DEMO_ACCESSIBILITY_SETTINGS_RECORDS;
}

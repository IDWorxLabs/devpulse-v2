/** Service adapter for settings — Qr Code Scanning */
import type { SettingsRecord } from './settings.types';

const DEMO_SETTINGS_RECORDS: SettingsRecord[] = [
  { id: 'settings-1', label: 'Sample Settings record', createdAt: new Date().toISOString() },
  { id: 'settings-2', label: 'Settings preview entry', createdAt: new Date().toISOString() },
];

export function listSettingsRecords(): SettingsRecord[] {
  return DEMO_SETTINGS_RECORDS;
}

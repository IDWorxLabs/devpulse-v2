/**
 * Universal Preferences Pack — workspace materializer.
 */

import type { GeneratedWorkspaceFile } from '../../code-generation-engine/code-generation-engine-types.js';
import { UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR } from './preferences-pack-descriptor.js';

export function materializePreferencesPack(configuration: Readonly<Record<string, unknown>>): GeneratedWorkspaceFile[] {
  const namespace = String(configuration.namespace ?? 'app.preferences');
  const allowedKeys = (configuration.allowedKeys as string[]) ?? ['display.pageSize', 'display.sortDirection'];
  const defaults = (configuration.defaults as string[]) ?? ['display.pageSize=10', 'display.sortDirection=asc'];

  return [
    {
      relativePath: 'src/universal-capability-packs/preferences/preferences-runtime.ts',
      content: generateSelfContainedPreferencesRuntime({ namespace, allowedKeys, defaults }),
    },
    {
      relativePath: 'src/universal-capability-packs/preferences/preferences-pack.json',
      content: `${JSON.stringify({ packId: UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR.packId, version: UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR.packVersion, namespace, allowedKeys }, null, 2)}\n`,
    },
  ];
}

function generateSelfContainedPreferencesRuntime(config: {
  namespace: string;
  allowedKeys: string[];
  defaults: string[];
}): string {
  return `/** Universal Preferences Pack runtime — self-contained generated artifact */
export interface PreferenceEntry {
  key: string;
  value: string;
  updatedAt: string;
}

const ALLOWED_KEYS: readonly string[] = ${JSON.stringify(config.allowedKeys)};
const DEFAULT_ENTRIES: readonly string[] = ${JSON.stringify(config.defaults)};

function parseDefaults(entries: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of entries) {
    const idx = entry.indexOf('=');
    if (idx <= 0) continue;
    out[entry.slice(0, idx)] = entry.slice(idx + 1);
  }
  return out;
}

function validateKey(key: string): string | null {
  if (!ALLOWED_KEYS.includes(key)) return "Key '" + key + "' is not in the approved preference schema";
  if (key.trim().length === 0) return 'Preference key is required';
  return null;
}

function validateValue(key: string, value: string): string | null {
  if (value.trim().length === 0) return "Value for '" + key + "' cannot be blank";
  if (key === 'display.pageSize') {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 500) return 'display.pageSize must be an integer between 1 and 500';
  }
  if (key === 'display.sortDirection' && value !== 'asc' && value !== 'desc') {
    return 'display.sortDirection must be asc or desc';
  }
  return null;
}

const DEFAULTS = parseDefaults(DEFAULT_ENTRIES);
const values = new Map<string, string>(Object.entries(DEFAULTS));
let dirty = false;

export function readPreference(key: string): string | null {
  return values.get(key) ?? null;
}

export function readAllPreferences(): PreferenceEntry[] {
  return [...values.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value, updatedAt: new Date(0).toISOString() }));
}

export function updatePreference(key: string, value: string): string {
  const keyErr = validateKey(key);
  if (keyErr) throw new Error(keyErr);
  const valErr = validateValue(key, value);
  if (valErr) throw new Error(valErr);
  values.set(key, value);
  dirty = true;
  return value;
}

export function resetPreferences(): PreferenceEntry[] {
  values.clear();
  for (const [k, v] of Object.entries(DEFAULTS)) values.set(k, v);
  dirty = false;
  return readAllPreferences();
}

export function preferencesAreDirty(): boolean {
  return dirty;
}

export const PREFERENCES_NAMESPACE = '${config.namespace}';
`;
}

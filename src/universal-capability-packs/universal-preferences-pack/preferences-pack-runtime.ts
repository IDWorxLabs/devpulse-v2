/**
 * Universal Preferences Pack — testable runtime (domain-neutral).
 */

export interface PreferenceEntry {
  readonly key: string;
  readonly value: string;
  readonly updatedAt: string;
}

export interface PreferencesValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function parseDefaults(defaults: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of defaults) {
    const idx = entry.indexOf('=');
    if (idx <= 0) continue;
    out[entry.slice(0, idx)] = entry.slice(idx + 1);
  }
  return out;
}

export function validatePreferenceKey(key: string, allowedKeys: readonly string[]): PreferencesValidationResult {
  if (!allowedKeys.includes(key)) {
    return { valid: false, errors: [`Key '${key}' is not in the approved preference schema`] };
  }
  if (key.trim().length === 0) {
    return { valid: false, errors: ['Preference key is required'] };
  }
  return { valid: true, errors: [] };
}

export function validatePreferenceValue(key: string, value: string): PreferencesValidationResult {
  if (value.trim().length === 0) {
    return { valid: false, errors: [`Value for '${key}' cannot be blank`] };
  }
  if (key === 'display.pageSize') {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      return { valid: false, errors: ['display.pageSize must be an integer between 1 and 500'] };
    }
  }
  if (key === 'display.sortDirection' && value !== 'asc' && value !== 'desc') {
    return { valid: false, errors: ['display.sortDirection must be asc or desc'] };
  }
  return { valid: true, errors: [] };
}

export class PreferencesStore {
  private readonly values: Map<string, string>;
  private dirty = false;

  constructor(
    private readonly allowedKeys: readonly string[],
    defaults: Record<string, string>,
  ) {
    this.values = new Map(Object.entries(defaults));
  }

  read(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  readAll(): PreferenceEntry[] {
    return [...this.values.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, value, updatedAt: new Date(0).toISOString() }));
  }

  update(key: string, value: string): PreferencesValidationResult {
    const keyResult = validatePreferenceKey(key, this.allowedKeys);
    if (!keyResult.valid) return keyResult;
    const valueResult = validatePreferenceValue(key, value);
    if (!valueResult.valid) return valueResult;
    this.values.set(key, value);
    this.dirty = true;
    return { valid: true, errors: [] };
  }

  reset(defaults: Record<string, string>): void {
    this.values.clear();
    for (const [k, v] of Object.entries(defaults)) this.values.set(k, v);
    this.dirty = false;
  }

  isDirty(): boolean {
    return this.dirty;
  }
}

export function generatePreferencesRuntimeSource(config: { namespace: string; allowedKeys: string[]; defaults: string[] }): string {
  return `/** Universal Preferences Pack runtime — generated */
import { PreferencesStore, parseDefaults } from '../../../../src/universal-capability-packs/universal-preferences-pack/preferences-pack-runtime.js';

const ALLOWED_KEYS = ${JSON.stringify(config.allowedKeys)} as const;
const DEFAULTS = parseDefaults(${JSON.stringify(config.defaults)});

let store = new PreferencesStore(ALLOWED_KEYS, DEFAULTS);

export function readPreference(key: string): string | null {
  return store.read(key);
}

export function readAllPreferences() {
  return store.readAll();
}

export function updatePreference(key: string, value: string) {
  const result = store.update(key, value);
  if (!result.valid) throw new Error(result.errors.join('; '));
  return store.read(key);
}

export function resetPreferences() {
  store.reset(DEFAULTS);
  return store.readAll();
}

export function preferencesAreDirty(): boolean {
  return store.isDirty();
}

export const PREFERENCES_NAMESPACE = '${config.namespace}';
`;
}

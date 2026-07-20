/** Stable fingerprint helpers for build-context integrity. */
import { createHash } from 'node:crypto';

export function stableBuildContextStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableBuildContextStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => typeof nested !== 'undefined')
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableBuildContextStringify(nested)}`).join(',')}}`;
}

export function fingerprintBuildContextValue(value: unknown): string {
  return createHash('sha256').update(stableBuildContextStringify(value)).digest('hex');
}

export function shortBuildContextFingerprint(value: unknown): string {
  return fingerprintBuildContextValue(value).slice(0, 16);
}

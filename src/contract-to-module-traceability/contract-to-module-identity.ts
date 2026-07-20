/**
 * Contract-to-Module Traceability Authority V1 — stable identity normalization.
 */

import { createHash } from 'node:crypto';

export function normalizeTraceabilityIdentity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function traceabilityNodeId(nodeType: string, canonicalIdentity: string): string {
  return `cmt-${nodeType}-${normalizeTraceabilityIdentity(canonicalIdentity)}`;
}

export function fingerprintTraceabilityValue(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}

export function moduleIdentityFromDisplayName(displayName: string): string {
  return normalizeTraceabilityIdentity(displayName);
}

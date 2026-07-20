/**
 * Universal Capability Pack Framework V1 — capability requirement normalization.
 */

import type { CapabilityRequirementDescriptor } from './universal-capability-pack-types.js';

const ALIAS_MAP: Readonly<Record<string, string>> = {
  'preferences.setting': 'preferences.persisted-setting',
  'preferences.schema': 'preferences.persisted-setting',
  'audit.trail': 'audit.activity-trail',
  'audit.history': 'audit.activity-trail',
  'export.data': 'export.json',
  'export.selected': 'export.selected-records',
  'scheduling.calendar': 'scheduling.availability',
  'scheduling.slot': 'scheduling.slot-selection',
  'auth.session': 'authentication.session',
  'auth.login': 'authentication.session',
  'rbac.permission': 'authorization.rbac',
  'notify.email': 'notification.email',
  'file.upload': 'file.storage',
  'report.dashboard': 'reporting.metric',
  'search.fulltext': 'search.full-text-ranking',
};

export function normalizeCapabilityKey(rawKey: string): string {
  const trimmed = rawKey.trim().toLowerCase().replace(/\s+/g, '-');
  return ALIAS_MAP[trimmed] ?? trimmed;
}

export function normalizeCapabilityRequirements(
  requirements: readonly CapabilityRequirementDescriptor[],
): CapabilityRequirementDescriptor[] {
  const byKey = new Map<string, CapabilityRequirementDescriptor>();
  for (const req of requirements) {
    const capabilityKey = normalizeCapabilityKey(req.capabilityKey);
    const existing = byKey.get(capabilityKey);
    if (!existing) {
      byKey.set(capabilityKey, { ...req, capabilityKey });
      continue;
    }
    byKey.set(capabilityKey, {
      ...existing,
      sourceEnvelopePaths: [...new Set([...existing.sourceEnvelopePaths, ...req.sourceEnvelopePaths])],
      provenance: [...new Set([...existing.provenance, ...req.provenance])],
      optional: existing.optional && req.optional,
      criticality: existing.criticality === 'REQUIRED' || req.criticality === 'REQUIRED' ? 'REQUIRED' : existing.criticality,
    });
  }
  return [...byKey.values()].sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}

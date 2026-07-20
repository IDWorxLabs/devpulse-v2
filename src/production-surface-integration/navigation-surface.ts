/** Navigation surface — CBGA approved navigation plan only. */
import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { INFRASTRUCTURE_NAVIGATION_REGISTRY } from '../build-context-integrity/navigation-purity-validator.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import type { NavigationSurface, NavigationSurfaceEntry } from './production-surface-types.js';

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function resolveNavigationFromCbgaPlan(envelope: ApprovedProductionBuildEnvelope): NavigationSurface {
  const approvedLabelSet = new Set(
    [
      ...envelope.approvedNavigationPlan.productEntries,
      ...envelope.approvedNavigationPlan.navigationItems.map((item) => item.label),
    ].map(normalizeLabel),
  );
  const infraLabelSet = new Set(INFRASTRUCTURE_NAVIGATION_REGISTRY.map((entry) => normalizeLabel(entry.label)));

  const entries: NavigationSurfaceEntry[] = envelope.approvedNavigationPlan.navigationItems.map((item) => {
    const source = infraLabelSet.has(normalizeLabel(item.label)) ? 'INFRASTRUCTURE_APPROVED' as const : 'CBGA_APPROVED' as const;
    const base = {
      navigationId: item.moduleId ?? item.path,
      label: item.label,
      route: item.path,
      moduleId: item.moduleId ?? null,
      source,
    };
    return { ...base, fingerprint: fingerprintBuildContextValue(base) };
  });

  const rejectedTemplateLabels = CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.filter(
    (label) => !approvedLabelSet.has(normalizeLabel(label)),
  );

  const base = { entries, rejectedTemplateLabels };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function navigationContainsUnapprovedTemplateLabels(
  labels: readonly string[],
  envelope: ApprovedProductionBuildEnvelope,
): string[] {
  const surface = resolveNavigationFromCbgaPlan(envelope);
  const approved = new Set(surface.entries.map((entry) => normalizeLabel(entry.label)));
  const violations: string[] = [];
  for (const label of labels) {
    const normalized = normalizeLabel(label);
    if (CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.some((template) => normalizeLabel(template) === normalized) && !approved.has(normalized)) {
      violations.push(label);
    }
  }
  return violations;
}

export function rejectLegacyNavigationSource(sourceLabel: string): boolean {
  return !/(template defaults|starter navigation|sample navigation|framework navigation|legacy navigation|fallback navigation|previous project navigation)/i.test(
    sourceLabel,
  );
}

/** Navigation purity validator. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { fingerprintBuildContextValue } from './build-context-fingerprint.js';
import { buildContextFinding } from './artifact-ownership-validator.js';
import type {
  BuildContext,
  BuildContextIntegrityFinding,
  BuildContextNavigationEntry,
  InfrastructureNavigationRegistration,
} from './build-context-types.js';

export const INFRASTRUCTURE_NAVIGATION_REGISTRY: readonly InfrastructureNavigationRegistration[] = [
  {
    navigationId: 'infra-settings',
    label: 'Settings',
    ownerAuthority: 'INFRASTRUCTURE_PRODUCT_BOUNDARY_AUTHORITY_V1',
    purpose: 'Configuration surface for generated runtime settings',
    allowedVisibility: 'SUPPORT_SURFACE',
    approvedCapability: 'settings-host',
    fingerprint: fingerprintBuildContextValue(['infra-settings', 'settings-host']),
  },
  {
    navigationId: 'infra-diagnostics',
    label: 'Diagnostics',
    ownerAuthority: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1',
    purpose: 'Diagnostic evidence surface for blocked or degraded builds',
    allowedVisibility: 'INFRASTRUCTURE_ONLY',
    approvedCapability: 'diagnostic-surface',
    fingerprint: fingerprintBuildContextValue(['infra-diagnostics', 'diagnostic-surface']),
  },
];

export function approvedNavigationLabels(envelope: ApprovedProductionBuildEnvelope): ReadonlySet<string> {
  return new Set([
    ...envelope.approvedNavigationPlan.navigationItems.map((item) => item.label),
    ...envelope.approvedNavigationPlan.productEntries,
  ]);
}

export function toBuildContextNavigationEntry(input: {
  readonly label: string;
  readonly route: string;
  readonly moduleId?: string | null;
  readonly buildContext: BuildContext;
  readonly envelope: ApprovedProductionBuildEnvelope;
}): BuildContextNavigationEntry {
  const approved = approvedNavigationLabels(input.envelope);
  const infra = INFRASTRUCTURE_NAVIGATION_REGISTRY.find((entry) => entry.label === input.label) ?? null;
  const source = approved.has(input.label)
    ? 'CBGA_APPROVED'
    : infra
      ? 'INFRASTRUCTURE_APPROVED'
      : 'UNAPPROVED';
  const base = {
    navigationId: `nav-${fingerprintBuildContextValue([input.buildContext.buildContextId, input.label, input.route]).slice(0, 10)}`,
    label: input.label,
    route: input.route,
    moduleId: input.moduleId ?? null,
    source,
    buildContextId: input.buildContext.buildContextId,
  } as const;
  return { ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function validateNavigationPurity(input: {
  readonly buildContext: BuildContext;
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly navigationEntries: readonly BuildContextNavigationEntry[];
}): BuildContextIntegrityFinding[] {
  return input.navigationEntries
    .filter((entry) => entry.buildContextId !== input.buildContext.buildContextId || entry.source === 'UNAPPROVED')
    .map((entry) =>
      buildContextFinding({
        diagnosticCode:
          entry.buildContextId !== input.buildContext.buildContextId
            ? 'navigation_entry_foreign_build_context'
            : 'navigation_entry_not_approved',
        expectedBuildContextId: input.buildContext.buildContextId,
        observedBuildContextIds: [entry.buildContextId],
        artifactIds: [entry.navigationId],
        message: `Navigation entry "${entry.label}" is not owned by approved current build context navigation.`,
      }),
    );
}

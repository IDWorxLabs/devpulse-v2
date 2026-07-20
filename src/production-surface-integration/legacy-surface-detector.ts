/** Detects remaining legacy execution paths and duplicate providers. */
import type { LegacySurfaceProviderHit } from './production-surface-types.js';

export interface LegacySurfaceScanTarget {
  readonly filePath: string;
  readonly content: string;
}

const DUPLICATE_PROVIDER_PATTERNS: readonly { readonly providerId: string; readonly surfaceKind: string; readonly pattern: RegExp }[] = [
  { providerId: 'session.projectName', surfaceKind: 'projectIdentity', pattern: /session\.projectName|input\.projectName(?!\s*\?\?)/ },
  { providerId: 'resolveAeeControlledBuildStatus', surfaceKind: 'status', pattern: /resolveAeeControlledBuildStatus\(/ },
  { providerId: 'inferOutcomeCategory', surfaceKind: 'status', pattern: /inferOutcomeCategory\(/ },
  { providerId: 'buildStatusSeparateFromPreview', surfaceKind: 'status', pattern: /buildStatusSeparateFromPreview\(/ },
  { providerId: 'runGenerationFaithfulnessAudit', surfaceKind: 'productFaithfulness', pattern: /runGenerationFaithfulnessAudit\(/ },
  { providerId: 'auditStageConsistency', surfaceKind: 'productFaithfulness', pattern: /auditStageConsistency\(/ },
  { providerId: 'approvedNavigationLabels fallback', surfaceKind: 'navigation', pattern: /CBGA_DEFAULT_SHELL_NAVIGATION_LABELS\.map/ },
  { providerId: 'onePromptLast.projectName', surfaceKind: 'projectIdentity', pattern: /onePromptLast\.projectName/ },
  { providerId: 'activeProjectSession projectName', surfaceKind: 'projectIdentity', pattern: /getActiveProjectSession\(\)\?\.projectName/ },
] as const;

const LEGACY_CACHE_PATTERNS: readonly { readonly pattern: RegExp; readonly label: string }[] = [
  { pattern: /cachedProjectIdentity|cachedWorkspaceIdentity|cachedNavigation|cachedPreview|cachedStatus/, label: 'cached surface state' },
  { pattern: /previousProjectSummary|previousWorkspaceTitle|session residue/, label: 'session residue identity' },
] as const;

export function detectLegacySurfaceProviders(targets: readonly LegacySurfaceScanTarget[]): LegacySurfaceProviderHit[] {
  const hits: LegacySurfaceProviderHit[] = [];
  const providerCounts = new Map<string, number>();

  for (const target of targets) {
    for (const legacy of LEGACY_CACHE_PATTERNS) {
      if (legacy.pattern.test(target.content)) {
        hits.push({
          providerId: legacy.label,
          surfaceKind: 'legacyCache',
          filePath: target.filePath,
          pattern: legacy.pattern.source,
        });
      }
    }
    for (const provider of DUPLICATE_PROVIDER_PATTERNS) {
      if (provider.pattern.test(target.content)) {
        providerCounts.set(provider.providerId, (providerCounts.get(provider.providerId) ?? 0) + 1);
        hits.push({
          providerId: provider.providerId,
          surfaceKind: provider.surfaceKind,
          filePath: target.filePath,
          pattern: provider.pattern.source,
        });
      }
    }
  }

  return hits;
}

export function rejectDuplicateProviders(hits: readonly LegacySurfaceProviderHit[]): string[] {
  const byKind = new Map<string, Set<string>>();
  for (const hit of hits) {
    const providers = byKind.get(hit.surfaceKind) ?? new Set<string>();
    providers.add(hit.providerId);
    byKind.set(hit.surfaceKind, providers);
  }
  const errors: string[] = [];
  for (const [kind, providers] of byKind) {
    if (providers.size > 1 && kind !== 'legacyCache') {
      errors.push(`duplicate ${kind} providers: ${[...providers].join(', ')}`);
    }
  }
  return errors;
}

export function integrationFilesMustUseCanonicalSurfaces(filePath: string, content: string): string[] {
  const errors: string[] = [];
  if (!filePath.includes('production-surface-integration')) return errors;
  if (/restaurant|crm|inventory|booking|unit converter|dashboard|customers|orders|staff|sales|lisa/i.test(content)) {
    errors.push(`domain-specific production logic in ${filePath}`);
  }
  return errors;
}

/**
 * Universal Capability Composition Engine V1 — contribution boundary validation.
 */

import type { ContributionAllowlistEntry, ContributionBoundary } from './universal-capability-composition-types.js';

export function buildContributionBoundaries(input: {
  selectedNativeProviderIds: readonly string[];
  selectedPackIds: readonly string[];
  moduleIds: readonly string[];
}): ContributionBoundary[] {
  const boundaries: ContributionBoundary[] = [];

  for (const providerId of input.selectedNativeProviderIds) {
    boundaries.push({
      providerId,
      allowedModuleIds: [...input.moduleIds],
      allowedEntityIds: input.moduleIds.map((m) => `${m}-entity`),
      allowedRoutePrefixes: input.moduleIds.map((m) => `/features/${m}`),
      allowedFilePrefixes: [`src/features/`, `src/universal-`],
      allowedRuntimeScopePrefixes: [`runtime.${providerId}`],
      allowedActionIds: input.moduleIds.map((m) => `${m}.action`),
      allowedWorkflowIds: input.moduleIds.map((m) => `${m}.workflow`),
      allowedRelationshipIds: input.moduleIds.map((m) => `${m}.relationship`),
      allowedRuleIds: input.moduleIds.map((m) => `${m}.rule`),
      allowedConfigurationNamespaces: [providerId],
    });
  }

  for (const packId of input.selectedPackIds) {
    boundaries.push({
      providerId: packId,
      allowedModuleIds: [...input.moduleIds],
      allowedEntityIds: [],
      allowedRoutePrefixes: [`/packs/${packId}`],
      allowedFilePrefixes: [`src/universal-capability-packs/`],
      allowedRuntimeScopePrefixes: [`runtime.pack.${packId}`],
      allowedActionIds: [],
      allowedWorkflowIds: [],
      allowedRelationshipIds: [],
      allowedRuleIds: [],
      allowedConfigurationNamespaces: [`pack:${packId}`],
    });
  }

  return boundaries;
}

export function validateContributionWithinBoundary(
  boundary: ContributionBoundary,
  contribution: { readonly path?: string; readonly moduleId?: string; readonly namespace?: string },
): boolean {
  if (contribution.path) {
    return boundary.allowedFilePrefixes.some((p) => contribution.path!.startsWith(p));
  }
  if (contribution.moduleId) {
    return boundary.allowedModuleIds.includes(contribution.moduleId);
  }
  if (contribution.namespace) {
    return boundary.allowedConfigurationNamespaces.includes(contribution.namespace);
  }
  return false;
}

export function validateContributionBoundaries(
  boundaries: readonly ContributionBoundary[],
  allowlist: readonly ContributionAllowlistEntry[],
): string[] {
  const errors: string[] = [];
  const boundaryProviders = new Set(boundaries.map((b) => b.providerId));
  for (const entry of allowlist) {
    if (!boundaryProviders.has(entry.providerId)) {
      errors.push(`contribution_outside_boundary:${entry.contributionId}`);
    }
  }
  return errors;
}

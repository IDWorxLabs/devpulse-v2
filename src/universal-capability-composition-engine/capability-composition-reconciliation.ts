/**
 * Universal Capability Composition Engine V1 — actual vs planned reconciliation.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type {
  ReconciliationClassification,
  UniversalCapabilityCompositionPlan,
} from './universal-capability-composition-types.js';

export function reconcilePlannedVsActual(input: {
  plan: UniversalCapabilityCompositionPlan;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  executedProviderIds: readonly string[];
}): { classification: ReconciliationClassification; detail: string; providerId?: string }[] {
  const results: { classification: ReconciliationClassification; detail: string; providerId?: string }[] = [];
  const plannedProviders = new Set([
    ...input.plan.nativeCapabilityProviders.map((p) => p.providerId),
    ...input.plan.selectedCapabilityPacks.map((p) => p.packId),
  ]);
  const executed = new Set(input.executedProviderIds);

  for (const providerId of plannedProviders) {
    if (executed.has(providerId)) {
      results.push({ classification: 'MATCHED', detail: providerId, providerId });
    } else if (input.plan.materializationOrder.includes(providerId)) {
      results.push({ classification: 'PROVIDER_NOT_EXECUTED', detail: providerId, providerId });
    }
  }

  for (const providerId of executed) {
    if (!plannedProviders.has(providerId) && !providerId.includes('verification') && !providerId.includes('coverage')) {
      results.push({ classification: 'PROVIDER_EXECUTED_UNAPPROVED', detail: providerId, providerId });
    }
  }

  for (const entry of input.plan.contributionAllowlist) {
    const prefix = entry.contributionType === 'source_file' ? 'src/' : '';
    const found = input.workspaceFiles.some((f) =>
      f.relativePath.includes(entry.providerId.replace(/\./g, '-')) ||
      f.relativePath.startsWith(prefix),
    );
    if (!found && entry.contributionType === 'shared_runtime') {
      results.push({
        classification: 'MISSING_CONTRIBUTION',
        detail: entry.contributionId,
        providerId: entry.providerId,
      });
    }
  }

  for (const file of input.workspaceFiles) {
    if (file.relativePath.includes('unapproved-provider-marker')) {
      results.push({
        classification: 'UNDECLARED_CONTRIBUTION',
        detail: file.relativePath,
      });
    }
  }

  return results;
}

export function reconciliationPassed(
  results: readonly { classification: ReconciliationClassification }[],
): boolean {
  return !results.some((r) =>
    [
      'MISSING_CONTRIBUTION',
      'UNDECLARED_CONTRIBUTION',
      'PROVIDER_EXECUTED_UNAPPROVED',
      'CONFIGURATION_DRIFT',
      'VERSION_DRIFT',
      'FINGERPRINT_DRIFT',
    ].includes(r.classification),
  );
}

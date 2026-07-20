/**
 * Universal Capability Composition Engine V1 — configuration resolution.
 */

import { mergePackConfiguration, validatePackConfiguration } from '../universal-capability-pack-framework/capability-pack-configuration.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';

export interface ConfigurationResolutionResult {
  readonly bindings: Readonly<Record<string, unknown>>;
  readonly issues: readonly { readonly code: string; readonly detail: string }[];
}

export function resolveCompositionConfiguration(input: {
  selectedPackIds: readonly string[];
  envelopeValues?: Readonly<Record<string, unknown>>;
}): ConfigurationResolutionResult {
  const bindings: Record<string, unknown> = { ...(input.envelopeValues ?? {}) };
  const issues: { code: string; detail: string }[] = [];

  for (const packId of input.selectedPackIds) {
    const pack = getPack(packId);
    if (!pack) {
      issues.push({ code: 'provider_configuration_missing', detail: packId });
      continue;
    }
    const config = mergePackConfiguration(pack);
    const configIssues = validatePackConfiguration(pack, config);
    if (configIssues.length > 0) {
      for (const ci of configIssues) {
        issues.push({ code: 'provider_configuration_invalid', detail: `${packId}:${ci.detail}` });
      }
    } else {
      bindings[`pack:${packId}`] = config;
    }
  }

  return { bindings, issues };
}

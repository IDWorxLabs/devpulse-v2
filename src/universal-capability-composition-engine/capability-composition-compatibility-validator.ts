/**
 * Universal Capability Composition Engine V1 — compatibility validation.
 */

import { validatePackCompatibility } from '../universal-capability-pack-framework/capability-pack-compatibility-validator.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import type { CapabilityPackMaterializationInput } from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import {
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
} from './universal-capability-composition-types.js';
import { fingerprintNativeProviderRegistry } from './native-capability-provider-registry.js';

export function validateCompositionCompatibility(input: {
  selectedPackIds: readonly string[];
  materializationInput: CapabilityPackMaterializationInput;
  envelopeFingerprint: string;
}): { code: string; passed: boolean; detail: string }[] {
  const decisions: { code: string; passed: boolean; detail: string }[] = [];

  decisions.push({
    code: 'composition_engine_version',
    passed: UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION === '1.0.0',
    detail: `engine@${UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION}`,
  });

  decisions.push({
    code: 'native_provider_registry_stable',
    passed: fingerprintNativeProviderRegistry().length > 0,
    detail: fingerprintNativeProviderRegistry(),
  });

  decisions.push({
    code: 'envelope_fingerprint_present',
    passed: input.envelopeFingerprint.length > 0,
    detail: input.envelopeFingerprint,
  });

  for (const packId of input.selectedPackIds) {
    const pack = getPack(packId);
    if (!pack) {
      decisions.push({ code: 'pack_missing', passed: false, detail: packId });
      continue;
    }
    const issues = validatePackCompatibility(pack, input.materializationInput);
    decisions.push({
      code: `pack_compat:${packId}`,
      passed: issues.length === 0,
      detail: issues.map((i) => i.detail).join('; ') || 'compatible',
    });
  }

  return decisions;
}

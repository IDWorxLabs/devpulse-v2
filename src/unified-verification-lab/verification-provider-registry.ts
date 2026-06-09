/**
 * Verification provider registry — registration and lookup only.
 */

import {
  INITIAL_VERIFICATION_PROVIDER_TYPES,
  type VerificationProvider,
  type VerificationProviderType,
} from './types.js';

const PROVIDER_OWNER_MAP: Record<VerificationProviderType, string> = {
  WORLD2_VERIFICATION: 'devpulse_v2_world2_completion_runtime',
  PREVIEW_VERIFICATION: 'devpulse_v2_live_preview_runtime',
  SELF_VISION_VERIFICATION: 'devpulse_v2_self_vision_runtime',
  UI_INSPECTION_VERIFICATION: 'devpulse_v2_ui_inspection_engine',
  INTERACTION_VERIFICATION: 'devpulse_v2_interaction_testing_engine',
  VISUAL_VERIFICATION: 'devpulse_v2_visual_verification_engine',
  RUNTIME_VERIFICATION: 'devpulse_v2_runtime_verification_layer',
};

const PROVIDER_SUPPORTED_MAP: Record<VerificationProviderType, string[]> = {
  WORLD2_VERIFICATION: ['WORLD2_COMPLETION', 'WORLD2_ROLLBACK', 'WORLD2_RECOVERY'],
  PREVIEW_VERIFICATION: ['LIVE_VIEW', 'PREVIEW_SESSION', 'PREVIEW_TARGET'],
  SELF_VISION_VERIFICATION: ['OBSERVATION_SESSION', 'CAPTURE_PLAN', 'OBSERVATION_TARGET'],
  UI_INSPECTION_VERIFICATION: ['LAYOUT_INSPECTION', 'NAVIGATION_INSPECTION', 'LOADING_INSPECTION'],
  INTERACTION_VERIFICATION: ['BUTTON_INTERACTION', 'FORM_INTERACTION', 'WORKFLOW_INTERACTION'],
  VISUAL_VERIFICATION: ['LAYOUT_VERIFICATION', 'NAVIGATION_VERIFICATION', 'INTERACTION_OUTCOME'],
  RUNTIME_VERIFICATION: ['TRUST_ASSESSMENT', 'VERIFICATION_GAPS', 'EVIDENCE_COLLECTION'],
};

const providers = new Map<string, VerificationProvider>();
const providerTypes = new Set<VerificationProviderType>();

export function resetVerificationProviderRegistryForTests(): void {
  providers.clear();
  providerTypes.clear();
}

function providerIdFor(type: VerificationProviderType): string {
  return `vprov-${type.toLowerCase().replace(/_/g, '-')}`;
}

export function buildInitialProviderDefinition(
  providerType: VerificationProviderType,
): VerificationProvider {
  return {
    providerId: providerIdFor(providerType),
    providerName: providerType.replace(/_/g, ' '),
    providerType,
    ownerModule: PROVIDER_OWNER_MAP[providerType],
    supportedVerifications: [...PROVIDER_SUPPORTED_MAP[providerType]],
    status: 'REGISTERED',
    createdAt: Date.now(),
    registrationOnly: true,
  };
}

export interface RegisterProviderResult {
  ok: boolean;
  provider: VerificationProvider | null;
  duplicate: boolean;
  error: string | null;
}

export function registerProvider(
  provider: VerificationProvider,
): RegisterProviderResult {
  if (providers.has(provider.providerId)) {
    return { ok: false, provider: null, duplicate: true, error: 'Duplicate provider rejected' };
  }
  if (providerTypes.has(provider.providerType)) {
    return { ok: false, provider: null, duplicate: true, error: 'Duplicate provider type rejected' };
  }

  providers.set(provider.providerId, provider);
  providerTypes.add(provider.providerType);
  return { ok: true, provider, duplicate: false, error: null };
}

export function registerInitialProviders(): RegisterProviderResult[] {
  const results: RegisterProviderResult[] = [];
  for (const type of INITIAL_VERIFICATION_PROVIDER_TYPES) {
    results.push(registerProvider(buildInitialProviderDefinition(type)));
  }
  return results;
}

export function getVerificationProvider(providerId: string): VerificationProvider | null {
  return providers.get(providerId) ?? null;
}

export function getVerificationProviderByType(
  providerType: VerificationProviderType,
): VerificationProvider | null {
  for (const provider of providers.values()) {
    if (provider.providerType === providerType) return provider;
  }
  return null;
}

export function listVerificationProviders(): VerificationProvider[] {
  return [...providers.values()];
}

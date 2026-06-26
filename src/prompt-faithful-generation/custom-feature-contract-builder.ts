/**
 * Prompt-Faithful Generation V1 — custom feature contract / profile definition builder.
 */

import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import { buildPromptSpecificDomainCopy } from './prompt-specific-ui-copy-builder.js';
import { dedupeModuleIds } from './prompt-module-name-normalizer.js';

export function buildCustomProfileFeatureDefinition(
  extraction: PromptFeatureExtraction,
): ProfileFeatureDefinition & {
  customDomainCopy: Record<string, string>;
  androidPhonePreviewRequired: boolean;
} {
  const modules = dedupeModuleIds(['auth', ...extraction.requiredModules.filter((m) => m !== 'auth')]);
  const routes = modules.map((moduleId) => (moduleId === 'auth' ? '/' : `/${moduleId}`));
  const uiTerms = [
    ...extraction.requiredModules.map((m) => m.replace(/-/g, ' ')),
    ...extraction.requiredInteractions.map((i) => i.split(' ')[0] ?? i),
    extraction.domain.split('/')[0]?.trim() ?? 'custom',
  ].filter(Boolean);

  const customDomainCopy = buildPromptSpecificDomainCopy(extraction);

  return {
    readOnly: true,
    profile: 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: extraction.domain.split('/')[0]?.trim().replace(/\s+/g, '-') ?? 'custom-app',
    featureModules: modules,
    routes,
    requiredUiTerms: [...new Set(uiTerms)].slice(0, 12),
    forbiddenGenericTerms: [
      'Project Management System',
      'Welcome to Project Management',
      'Welcome to Lisa As A Real Modular',
      'project management',
    ],
    customDomainCopy,
    androidPhonePreviewRequired: extraction.androidPhonePreviewRequired,
  };
}

export function shouldUseCustomFeatureDefinition(
  extraction: PromptFeatureExtraction,
  materializationProfile: string,
): boolean {
  if (materializationProfile === 'GENERIC_CUSTOM_APP_V1') return true;
  if (extraction.isCustomDomainPrompt && extraction.requiredModules.length >= 3) return true;
  return false;
}

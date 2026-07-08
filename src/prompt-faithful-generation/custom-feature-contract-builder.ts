/**
 * Prompt-Faithful Generation V1 — custom feature contract / profile definition builder.
 */

import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';
import { buildPromptSpecificDomainCopy } from './prompt-specific-ui-copy-builder.js';
import {
  detectSimpleUtilityAppKind,
  simpleUtilityFeatureModules,
  simpleUtilityRequiredUiTerms,
  simpleUtilityRoutes,
} from '../simple-utility-app/simple-utility-app-registry.js';
import {
  dedupeModuleIds,
  isRejectedNonModulePhrase,
  suppressFallbackModulesWhenCustomExists,
} from './prompt-module-name-normalizer.js';
import { resolveAssistiveCommunicationProfile } from './assistive-communication-profile.js';

export function buildCustomProfileFeatureDefinition(
  extraction: PromptFeatureExtraction,
  rawPrompt = '',
): ProfileFeatureDefinition & {
  customDomainCopy: Record<string, string>;
  androidPhonePreviewRequired: boolean;
} {
  const simpleUtilityKind = detectSimpleUtilityAppKind(rawPrompt);
  if (simpleUtilityKind) {
    const modules = simpleUtilityFeatureModules(simpleUtilityKind);
    const routes = simpleUtilityRoutes(simpleUtilityKind);
    const customDomainCopy = buildPromptSpecificDomainCopy(extraction);
    return {
      readOnly: true,
      profile: 'GENERIC_CUSTOM_APP_V1',
      expectedAppType: `${simpleUtilityKind}-utility`,
      featureModules: modules,
      routes,
      requiredUiTerms: simpleUtilityRequiredUiTerms(simpleUtilityKind),
      forbiddenGenericTerms: [
        'Project Management System',
        'Welcome to Project Management',
        'dashboard',
        'settings',
        'Manage Dashboard',
        'Manage Settings',
      ],
      customDomainCopy,
      androidPhonePreviewRequired: false,
    };
  }

  const productModules = suppressFallbackModulesWhenCustomExists(
    extraction.requiredModules.filter((m) => m !== 'auth' && !isRejectedNonModulePhrase(m)),
    extraction.requiredModules,
  );
  const modules = dedupeModuleIds(
    promptExplicitlyRequiresAuth(rawPrompt) ? ['auth', ...productModules] : productModules,
  );
  const routes = modules.map((moduleId) => (moduleId === 'auth' ? '/' : `/${moduleId}`));
  const uiTerms = [
    ...productModules.flatMap((m) => [m.replace(/-/g, ' '), ...m.split('-').filter((part) => part.length >= 4)]),
    'blink',
    'gaze',
    'speech',
    'communication',
    'emergency',
    'calibration',
    'accessibility',
  ].filter(Boolean);

  const customDomainCopy = buildPromptSpecificDomainCopy(extraction);

  const assistiveProfile = resolveAssistiveCommunicationProfile(rawPrompt);

  return {
    readOnly: true,
    profile: assistiveProfile ?? 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: assistiveProfile ? 'assistive-communication' : extraction.domain.split('/')[0]?.trim().replace(/\s+/g, '-') ?? 'custom-app',
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
  if (materializationProfile === 'ASSISTIVE_COMMUNICATION_APP_V1') return false;
  if (materializationProfile === 'GENERIC_CUSTOM_APP_V1') return true;
  if (extraction.isCustomDomainPrompt && extraction.requiredModules.length >= 3) return true;
  if (extraction.explicitModulesProvided && extraction.sanitizedModuleCount >= 2) return true;
  return false;
}

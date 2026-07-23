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

/**
 * Derive expectedAppType from dominant modules / affirmative domain — never from a bare
 * first slash-segment of a contaminated multi-label domain string.
 */
export function deriveExpectedAppTypeFromExtraction(extraction: PromptFeatureExtraction): string {
  const modules = extraction.requiredModules ?? [];
  const joined = modules.join(' ');
  if (
    /incident|continuity|runbook|escalation|stakeholder-directory|risk-register|on-call|post-incident|evidence-locker|status-page/.test(
      joined,
    )
  ) {
    return 'incident-continuity-operations';
  }
  if (modules.includes('contacts') && (modules.includes('deals') || modules.includes('leads') || /crm/i.test(extraction.domain))) {
    return 'crm';
  }
  if (modules.includes('contacts') && modules.every((m) => ['contacts', 'notes', 'tasks', 'auth', 'dashboard'].includes(m))) {
    return 'contacts';
  }
  if (modules.some((m) => /inventory|stock|products/.test(m))) {
    return 'inventory-operations';
  }
  if (modules.some((m) => /cart|checkout/.test(m))) {
    return 'ecommerce';
  }
  if (modules.some((m) => /appointment|booking/.test(m))) {
    return 'appointments-scheduling';
  }
  const domain = (extraction.domain ?? '').trim().toLowerCase();
  if (!domain || domain.startsWith('custom application')) {
    return 'custom-application';
  }
  // Prefer full domain slug when it is already a single affirmative label.
  if (!domain.includes('/')) {
    return domain.replace(/\s+/g, '-');
  }
  // Multi-label domains: pick the first segment only when it is not a weak generic noun alone.
  const first = domain.split('/')[0]?.trim().replace(/\s+/g, '-') ?? 'custom-application';
  if (first === 'contacts' && !modules.includes('contacts')) {
    return 'custom-application';
  }
  return first || 'custom-application';
}

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
  const assistiveProfile = resolveAssistiveCommunicationProfile(rawPrompt);
  // Keep compound module phrases intact. Emitting hyphen fragments (planning/management/tracking)
  // caused Product Faithfulness to treat lexical children as standalone unexpected concepts.
  const productUiTerms = productModules.map((m) => m.replace(/-/g, ' '));
  // Lisa assistive vocabulary only when the assistive profile is actually selected — never
  // append those terms to a generic contact/task/inventory custom app and then fail validation.
  const assistiveUiTerms = assistiveProfile
    ? ['blink', 'gaze', 'speech', 'communication', 'emergency', 'calibration', 'accessibility']
    : [];
  const uiTerms = [...productUiTerms, ...assistiveUiTerms].filter(Boolean);

  const customDomainCopy = buildPromptSpecificDomainCopy(extraction);

  return {
    readOnly: true,
    profile: assistiveProfile ?? 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: assistiveProfile
      ? 'assistive-communication'
      : deriveExpectedAppTypeFromExtraction(extraction),
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

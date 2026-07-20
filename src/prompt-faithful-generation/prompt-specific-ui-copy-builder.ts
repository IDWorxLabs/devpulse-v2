/**
 * Prompt-Faithful Generation V1 — prompt-specific UI copy for custom modules.
 */

import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import { moduleIdToDisplayName } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { contractConsumptionTrace, shortHashForTrace } from '../production-contract-consumption-trace-v1/index.js';
import { LISA_REQUIRED_MODULES } from './prompt-feature-extractor.js';

/**
 * Production Generator Contract Consumption Fix V1 — generic (non-app-specific) evidence signal:
 * true only when the extraction pipeline itself already determined that assistive-communication
 * modules are required (see `resolveRequiredModules` / `promptMentionsLisaOrAccessibility`).
 * Assistive-communication copy ("communication board", "assistive communication settings", etc.)
 * is only ever appropriate when this evidence is present — never as a default for arbitrary
 * custom apps.
 */
function hasAssistiveCommunicationEvidence(extraction: PromptFeatureExtraction): boolean {
  return extraction.requiredModules.some((moduleId) => LISA_REQUIRED_MODULES.includes(moduleId));
}

export function buildPromptSpecificDomainCopy(
  extraction: PromptFeatureExtraction,
): Record<string, string> {
  const appName = extraction.appName;
  const isAssistiveApp = hasAssistiveCommunicationEvidence(extraction);
  const copy: Record<string, string> = {
    headline: `${appName} — ${extraction.corePurpose}`,
    // Contract-derived by default; assistive-communication phrasing is only used when the
    // extraction pipeline already produced assistive-communication module evidence.
    dashboard: isAssistiveApp
      ? `Communication board overview with ${extraction.corePurpose}.`
      : `${appName} overview with ${extraction.corePurpose}.`,
    auth: `Secure access for ${extraction.targetUsers.join(' and ')}.`,
    settings: isAssistiveApp
      ? 'Accessibility and assistive communication settings.'
      : `${appName} settings and preferences.`,
  };

  const moduleDescriptions: Record<string, string> = {
    calculator: 'Calculator with number pad, + − × ÷ operators, clear, delete, and equals result.',
    'onboarding-calibration': 'Calibrate eye tracking, gaze zones, and blink sensitivity for accurate input.',
    'eye-tracking-board': 'Eye movement and gaze tracking board with live status indicators.',
    'blink-input-engine': 'Blink detection engine with simulation controls for assistive input.',
    'gaze-keyboard': 'Gaze-based keyboard for composing messages with large accessible keys.',
    'text-to-speech': 'Text-to-speech output with speak button and voice controls.',
    'quick-phrases': 'Quick phrase tiles for fast communication without typing.',
    'caregiver-dashboard': 'Caregiver dashboard for monitoring communication and session status.',
    'communication-history': 'Communication history with filtering and message review.',
    'accessibility-settings': 'Accessibility settings for contrast, tile size, and input sensitivity.',
    'emergency-speech': 'Emergency speech button for urgent caregiver alerts.',
    'communication-board': 'Communication board with large accessible tiles for gaze and blink selection.',
  };

  for (const moduleId of extraction.requiredModules) {
    const display = moduleIdToDisplayName(moduleId);
    copy[moduleId] =
      moduleDescriptions[moduleId] ??
      `${display} for ${appName} — ${extraction.corePurpose}.`;
  }

  if (extraction.safetyNotes.length) {
    copy.safetyNote = extraction.safetyNotes.join(' ');
  }

  for (const interaction of extraction.requiredInteractions) {
    const key = interaction.replace(/\s+/g, '-').toLowerCase();
    copy[key] = `${interaction} — interactive control for ${appName}.`;
  }

  // Production Generator Contract Consumption Fix V1 — `dashboard` and `settings` are now
  // contract-derived by default; assistive-communication phrasing is only used when
  // `hasAssistiveCommunicationEvidence()` found real assistive-module evidence in the extraction.
  contractConsumptionTrace({
    requestId: 'N/A',
    buildId: 'N/A',
    projectId: 'N/A',
    promptHash: shortHashForTrace(appName),
    stage: 'CUSTOM_DOMAIN_COPY_BUILDER',
    functionName: 'buildPromptSpecificDomainCopy',
    sourceFile: 'src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts',
    branchSelected: isAssistiveApp ? 'ASSISTIVE_EVIDENCE_GATED_COPY' : 'CONTRACT_DERIVED_NEUTRAL_COPY',
    inputProductIdentity: appName,
    outputProductIdentity: copy.headline ?? null,
    inputModules: extraction.requiredModules,
    outputModules: Object.keys(copy),
    inputRoutes: [],
    outputRoutes: [],
    inputNavigation: [],
    outputNavigation: [],
    inputVisibleText: [appName],
    outputVisibleText: [copy.headline ?? '', copy.dashboard ?? '', copy.settings ?? ''],
    fallbackSelected: false,
    genericTemplateSelected: false,
    contractConsumed: true,
    cbgaPlanConsumed: false,
    promptBoundedModulePlanConsumed: false,
    universalFeatureContractConsumed: false,
    profileFeatureDefinitionConsumed: false,
  });

  return copy;
}

export function buildLisaFirstScreenCopy(extraction: PromptFeatureExtraction): string {
  return [
    extraction.appName,
    'Locked In Syndrome App',
    'communication board',
    'blink',
    'gaze',
    'speech',
    'emergency',
    extraction.safetyNotes[0] ?? 'Large accessible tiles for assistive communication.',
  ].join(' | ');
}

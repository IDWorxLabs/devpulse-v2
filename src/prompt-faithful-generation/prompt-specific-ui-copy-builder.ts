/**
 * Prompt-Faithful Generation V1 — prompt-specific UI copy for custom modules.
 */

import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import { moduleIdToDisplayName } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';

export function buildPromptSpecificDomainCopy(
  extraction: PromptFeatureExtraction,
): Record<string, string> {
  const appName = extraction.appName;
  const copy: Record<string, string> = {
    headline: `${appName} — ${extraction.corePurpose}`,
    dashboard: `Communication board overview with ${extraction.corePurpose}.`,
    auth: `Secure access for ${extraction.targetUsers.join(' and ')}.`,
    settings: 'Accessibility and assistive communication settings.',
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

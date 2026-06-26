/**
 * Intent Understanding Engine — interaction model builder.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type { InteractionMode, InteractionModelUnderstanding, UnderstandingEvidence } from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

const INTERACTION_SIGNALS: Array<{ pattern: RegExp; mode: InteractionMode; description: string }> = [
  { pattern: /\bblink/i, mode: 'BLINK', description: 'Blink-based selection and input' },
  { pattern: /\beye[\s-]?track|gaze/i, mode: 'EYE_TRACKING', description: 'Eye tracking and gaze selection' },
  { pattern: /\bvoice|speech|tts|text[\s-]?to[\s-]?speech/i, mode: 'VOICE', description: 'Voice and speech output' },
  { pattern: /\bkeyboard|type/i, mode: 'KEYBOARD', description: 'Keyboard text input' },
  { pattern: /\btap\b|touch/i, mode: 'TAP', description: 'Touch tap interactions' },
  { pattern: /\bclick\b/i, mode: 'CLICK', description: 'Mouse click interactions' },
  { pattern: /\bgesture|swipe/i, mode: 'GESTURE', description: 'Gesture-based navigation' },
  { pattern: /\bswipe/i, mode: 'SWIPE', description: 'Swipe gestures' },
  { pattern: /\bdrag/i, mode: 'DRAG', description: 'Drag interactions' },
  { pattern: /\bdrop/i, mode: 'DROP', description: 'Drop interactions' },
  { pattern: /\bcamera/i, mode: 'CAMERA', description: 'Camera capture' },
  { pattern: /\bbarcode/i, mode: 'BARCODE_SCAN', description: 'Barcode scanning' },
  { pattern: /\bqr[\s-]?code|qr scan/i, mode: 'QR_SCAN', description: 'QR code scanning' },
  { pattern: /\bspeak button|emergency speech/i, mode: 'SPEECH', description: 'Speech output controls' },
];

export function buildInteractionModel(rawPrompt: string): InteractionModelUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const modes = new Set<InteractionMode>();
  const descriptions: string[] = [];
  const evidenceItems: UnderstandingEvidence[] = [];

  for (const signal of INTERACTION_SIGNALS) {
    if (signal.pattern.test(rawPrompt)) {
      modes.add(signal.mode);
      descriptions.push(signal.description);
      evidenceItems.push(evidence('interaction_signal', signal.description, 0.9));
    }
  }

  for (const interaction of extraction.requiredInteractions) {
    descriptions.push(interaction);
    evidenceItems.push(evidence('prompt_extraction', interaction, 1));
    if (/blink/i.test(interaction)) modes.add('BLINK');
    if (/gaze|eye/i.test(interaction)) modes.add('EYE_TRACKING');
    if (/speak|speech/i.test(interaction)) modes.add('SPEECH');
    if (/keyboard/i.test(interaction)) modes.add('KEYBOARD');
  }

  if (!modes.size) {
    modes.add('CLICK');
    modes.add('TAP');
    descriptions.push('Standard click and tap interactions (web default)');
    evidenceItems.push(evidence('platform_default', 'Web default interactions', 0.5));
  }

  return {
    readOnly: true,
    modes: [...modes],
    descriptions: [...new Set(descriptions)],
    evidence: evidenceItems,
  };
}

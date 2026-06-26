/**
 * Prompt Faithfulness Engine V2 — ambiguity detection.
 */

import type { PromptAmbiguity, PromptEvidenceContract } from './prompt-faithfulness-v2-types.js';

let ambiguityCounter = 0;

export function resetPromptAmbiguityDetectorForTests(): void {
  ambiguityCounter = 0;
}

const AMBIGUITY_PATTERNS: Array<{
  pattern: RegExp;
  interpretations: string[];
  question: string;
}> = [
  {
    pattern: /\bmake login secure\b|\bsecure login\b/i,
    interpretations: ['Password Authentication', 'Multi-Factor Authentication', 'Biometrics', 'Passkeys', 'OAuth'],
    question: 'Which authentication method should secure login use?',
  },
  {
    pattern: /\bmodern ui\b|\bbeautiful\b|\bclean design\b/i,
    interpretations: ['Minimal flat design', 'Material Design', 'Corporate dashboard', 'Medical assistive UI'],
    question: 'What visual design system should the application follow?',
  },
  {
    pattern: /\bfast\b|\bperformant\b/i,
    interpretations: ['Sub-second page loads', 'Real-time updates', 'Offline-first performance', 'Low memory footprint'],
    question: 'What performance targets define "fast" for this product?',
  },
  {
    pattern: /\bscalable\b/i,
    interpretations: ['Horizontal cloud scaling', 'Large dataset handling', 'Multi-tenant architecture'],
    question: 'What scaling dimension is most important?',
  },
  {
    pattern: /\buser[\s-]?friendly\b/i,
    interpretations: ['Simplified navigation', 'Accessibility-first', 'Minimal clicks', 'Guided onboarding'],
    question: 'What does user-friendly mean for your target users?',
  },
];

export function detectPromptAmbiguities(contract: PromptEvidenceContract): PromptAmbiguity[] {
  const ambiguities: PromptAmbiguity[] = [];

  for (const item of contract.requirements) {
    for (const entry of AMBIGUITY_PATTERNS) {
      if (entry.pattern.test(item.originalSentence)) {
        ambiguityCounter += 1;
        ambiguities.push({
          readOnly: true,
          ambiguityId: `ambiguity-${ambiguityCounter}`,
          vagueRequirement: item.normalizedRequirement,
          sourceEvidenceId: item.evidenceId,
          interpretations: entry.interpretations,
          clarificationQuestion: entry.question,
          confidence: 0.85,
        });
        break;
      }
    }
  }

  return ambiguities;
}

export function hasBlockingAmbiguities(ambiguities: readonly PromptAmbiguity[]): boolean {
  return ambiguities.length >= 3;
}

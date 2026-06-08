/**
 * DevPulse V2 — single official answer contract.
 * Renderer may only use visibleAnswerText.
 */

import { CHAT_ANSWER_SOURCE } from './types.js';

export type AnswerStatus = 'READY' | 'EMPTY' | 'ERROR';

export interface DevPulseV2Answer {
  answerId: string;
  createdAt: number;
  source: typeof CHAT_ANSWER_SOURCE;
  visibleAnswerText: string;
  status: AnswerStatus;
  warnings: string[];
  errors: string[];
}

export function createAnswerId(prefix = 'answer'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAnswer(visibleAnswerText: string): DevPulseV2Answer {
  const trimmed = visibleAnswerText.trim();
  const errors: string[] = [];
  const warnings: string[] = [];

  if (trimmed.length === 0) {
    return {
      answerId: createAnswerId(),
      createdAt: Date.now(),
      source: CHAT_ANSWER_SOURCE,
      visibleAnswerText: '',
      status: 'EMPTY',
      warnings,
      errors: ['Answer text is empty — no visible answer produced'],
    };
  }

  return {
    answerId: createAnswerId(),
    createdAt: Date.now(),
    source: CHAT_ANSWER_SOURCE,
    visibleAnswerText: trimmed,
    status: 'READY',
    warnings,
    errors,
  };
}

export function buildErrorAnswer(errorMessage: string): DevPulseV2Answer {
  return {
    answerId: createAnswerId(),
    createdAt: Date.now(),
    source: CHAT_ANSWER_SOURCE,
    visibleAnswerText: '',
    status: 'ERROR',
    warnings: [],
    errors: [errorMessage],
  };
}

/** Extract only the field renderers are allowed to use. */
export function getRenderableAnswerText(answer: DevPulseV2Answer): string {
  return answer.visibleAnswerText;
}

/** Guard against hidden alternate prose fields on answer objects. */
export function assertAnswerContract(answer: DevPulseV2Answer): boolean {
  const forbiddenKeys = [
    'directAnswer',
    'hiddenAnswer',
    'routingNarration',
    'templateProse',
    'recoveredText',
  ];
  for (const key of forbiddenKeys) {
    if (key in (answer as unknown as Record<string, unknown>)) {
      return false;
    }
  }
  return answer.source === CHAT_ANSWER_SOURCE;
}

/**
 * Phase 25.37 — Cognitive self-evolution tracking (3-strike rule).
 */

import { CHAT_COGNITIVE_SELF_EVOLUTION_FAILURE_THRESHOLD } from './chat-cognitive-registry.js';
import type { ChatCognitiveIntent } from './chat-cognitive-types.js';

const failurePatterns = new Map<string, number>();

export function resetChatCognitiveSelfEvolutionForTests(): void {
  failurePatterns.clear();
}

function patternKey(intent: ChatCognitiveIntent, reason: string): string {
  return `${intent}:${reason}`;
}

export function recordCognitiveFailure(intent: ChatCognitiveIntent, reasons: string[]): void {
  for (const reason of reasons.slice(0, 3)) {
    const key = patternKey(intent, reason);
    failurePatterns.set(key, (failurePatterns.get(key) ?? 0) + 1);
  }
}

export function evaluateSelfEvolutionRequired(
  intent: ChatCognitiveIntent,
  reasons: string[],
): { required: boolean; reason: string | null } {
  for (const reason of reasons) {
    const count = failurePatterns.get(patternKey(intent, reason)) ?? 0;
    if (count >= CHAT_COGNITIVE_SELF_EVOLUTION_FAILURE_THRESHOLD) {
      return {
        required: true,
        reason: `SELF_EVOLUTION_REQUIRED — repeated "${reason}" for intent ${intent} (${count} times). Missing cognitive capability — do not apply another template patch.`,
      };
    }
  }
  return { required: false, reason: null };
}

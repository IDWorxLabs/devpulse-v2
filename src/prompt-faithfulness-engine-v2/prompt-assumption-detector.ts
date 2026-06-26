/**
 * Prompt Faithfulness Engine V2 — unsupported assumption detection.
 */

import type { PromptEvidenceContract, UnsupportedAssumption } from './prompt-faithfulness-v2-types.js';

let assumptionCounter = 0;

export function resetPromptAssumptionDetectorForTests(): void {
  assumptionCounter = 0;
}

const UNSUPPORTED_PATTERNS: Array<{ generated: RegExp; promptMustMention: RegExp; label: string }> = [
  { generated: /\bai\b.*\bassistant\b/i, promptMustMention: /\bai\b|machine learning|ml\b|gpt|llm/i, label: 'AI Financial Assistant' },
  { generated: /\bsocial\b.*\bfeed\b/i, promptMustMention: /social|feed|timeline|follow/i, label: 'Social Feed' },
  { generated: /\bcrypto\b|\bblockchain\b/i, promptMustMention: /crypto|blockchain|web3|nft/i, label: 'Cryptocurrency Features' },
  { generated: /\bchatbot\b/i, promptMustMention: /chatbot|chat bot|conversational ai/i, label: 'Chatbot' },
  { generated: /\bgamif/i, promptMustMention: /gamif|badge|leaderboard|points/i, label: 'Gamification' },
  { generated: /\bproject management\b/i, promptMustMention: /project management|tasks|kanban|sprint/i, label: 'Project Management Fallback' },
];

export function detectUnsupportedAssumptions(
  contract: PromptEvidenceContract,
  proposedCapabilities: readonly string[],
): UnsupportedAssumption[] {
  const assumptions: UnsupportedAssumption[] = [];
  const promptText = contract.rawPrompt;

  for (const capability of proposedCapabilities) {
    for (const pattern of UNSUPPORTED_PATTERNS) {
      if (pattern.generated.test(capability) && !pattern.promptMustMention.test(promptText)) {
        assumptionCounter += 1;
        assumptions.push({
          readOnly: true,
          assumptionId: `assumption-${assumptionCounter}`,
          assumedCapability: capability,
          reason: `No supporting prompt evidence for ${pattern.label}`,
          supportingEvidenceIds: [],
          rejected: true,
        });
        break;
      }
    }
  }

  return assumptions;
}

export function hasRejectedAssumptions(assumptions: readonly UnsupportedAssumption[]): boolean {
  return assumptions.some((a) => a.rejected);
}

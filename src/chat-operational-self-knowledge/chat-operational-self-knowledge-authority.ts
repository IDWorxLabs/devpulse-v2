/**
 * Chat Operational Self-Knowledge — authority and chat integration.
 */

import {
  buildOperationalSelfKnowledgeAssessment,
  composeOperationalSelfKnowledgeResponse,
  stripConsciousnessClaims,
} from './operational-response-composer.js';
import { buildOperationalEvidenceSnapshot } from './operational-evidence-snapshot.js';
import {
  classifyOperationalQuestion,
  isOperationalSelfKnowledgeQuestion,
} from './operational-question-classifier.js';
import type {
  EnhanceChatWithOperationalSelfKnowledgeInput,
  EnhanceChatWithOperationalSelfKnowledgeResult,
  OperationalEvidenceSnapshot,
} from './chat-operational-self-knowledge-types.js';

const snapshotCache = new Map<string, OperationalEvidenceSnapshot>();

export function resetOperationalEvidenceSnapshotCacheForTests(): void {
  snapshotCache.clear();
}

function cacheKey(rootDir: string): string {
  return rootDir.replace(/\\/g, '/');
}

export function getOperationalEvidenceSnapshot(rootDir: string): OperationalEvidenceSnapshot {
  const key = cacheKey(rootDir);
  const cached = snapshotCache.get(key);
  if (cached) return cached;
  const snapshot = buildOperationalEvidenceSnapshot({ rootDir });
  snapshotCache.set(key, snapshot);
  return snapshot;
}

export function resolveOperationalSelfKnowledgeChatResponse(input: {
  message: string;
  draftResponse?: string;
  rootDir?: string;
  snapshot?: OperationalEvidenceSnapshot;
}): string {
  const result = enhanceChatWithOperationalSelfKnowledge({
    message: input.message,
    draftAnswer: input.draftResponse,
    rootDir: input.rootDir,
    snapshot: input.snapshot,
  });
  return result.finalAnswer;
}

export function enhanceChatWithOperationalSelfKnowledge(
  input: EnhanceChatWithOperationalSelfKnowledgeInput,
): EnhanceChatWithOperationalSelfKnowledgeResult {
  const rootDir = input.rootDir ?? process.cwd();
  const message = input.message?.trim() ?? '';
  const kind = classifyOperationalQuestion(message);

  if (!isOperationalSelfKnowledgeQuestion(kind)) {
    const draft = stripConsciousnessClaims(input.draftAnswer ?? '');
    return {
      readOnly: true,
      finalAnswer: draft,
      usedOperationalSelfKnowledge: false,
      questionKind: kind,
      assessment: null,
    };
  }

  const snapshot = input.snapshot ?? getOperationalEvidenceSnapshot(rootDir);
  const assessment = buildOperationalSelfKnowledgeAssessment({ message, kind, snapshot });
  const grounded = assessment.responseText;

  const draft = input.draftAnswer?.trim() ?? '';
  let finalAnswer = grounded;

  if (draft.length >= 80 && !/\b(welcome to aidevengine|how can i help you today)\b/i.test(draft)) {
    finalAnswer = `${grounded}\n\n---\n\nAdditional context from upstream routing:\n${draft.slice(0, 400)}${draft.length > 400 ? '…' : ''}`;
  }

  finalAnswer = stripConsciousnessClaims(finalAnswer);

  return {
    readOnly: true,
    finalAnswer,
    usedOperationalSelfKnowledge: true,
    questionKind: kind,
    assessment,
  };
}

export { buildOperationalEvidenceSnapshot } from './operational-evidence-snapshot.js';
export { buildCapabilityTruthRegistry } from './capability-truth-registry.js';
export { classifyOperationalQuestion, isOperationalSelfKnowledgeQuestion } from './operational-question-classifier.js';
export { composeOperationalSelfKnowledgeResponse, buildOperationalSelfKnowledgeAssessment } from './operational-response-composer.js';

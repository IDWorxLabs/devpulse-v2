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
import {
  buildLiveOperationalTruthDiagnostics,
  detectLiveOperationalTruthBypass,
  inferExecutionStageQuestionKind,
  isExecutionStageOperationalQuestion,
  resolveOperationalTruthPath,
} from './live-operational-truth-path.js';
import {
  matchCapabilityAnswerScenario,
  resolveRepairedCapabilityAnswerForMessage,
} from '../chat-capability-answer-quality/index.js';
import type {
  EnhanceChatWithOperationalSelfKnowledgeInput,
  EnhanceChatWithOperationalSelfKnowledgeResult,
  OperationalEvidenceSnapshot,
  OperationalQuestionKind,
  OperationalTruthPath,
} from './chat-operational-self-knowledge-types.js';

const snapshotCache = new Map<string, OperationalEvidenceSnapshot>();

export function resetOperationalEvidenceSnapshotCacheForTests(): void {
  snapshotCache.clear();
}

function cacheKey(rootDir: string): string {
  return rootDir.replace(/\\/g, '/');
}

export function getOperationalEvidenceSnapshot(
  rootDir: string,
  options: { forceRefresh?: boolean } = {},
): OperationalEvidenceSnapshot {
  const key = cacheKey(rootDir);
  if (!options.forceRefresh) {
    const cached = snapshotCache.get(key);
    if (cached) return cached;
  }
  const snapshot = buildOperationalEvidenceSnapshot({ rootDir });
  snapshotCache.set(key, snapshot);
  return snapshot;
}

export function getLiveOperationalTruthDiagnostics(rootDir?: string) {
  const snapshot = getOperationalEvidenceSnapshot(rootDir ?? process.cwd(), { forceRefresh: true });
  return buildLiveOperationalTruthDiagnostics(snapshot);
}

function resolveEffectiveQuestionKind(message: string, forceLivePath: boolean): OperationalQuestionKind {
  if (forceLivePath && isExecutionStageOperationalQuestion(message)) {
    return inferExecutionStageQuestionKind(message);
  }
  return classifyOperationalQuestion(message);
}

function shouldUseOperationalSelfKnowledge(kind: OperationalQuestionKind, message: string, forceLivePath: boolean): boolean {
  if (forceLivePath && isExecutionStageOperationalQuestion(message)) return true;
  return isOperationalSelfKnowledgeQuestion(kind);
}

export function resolveOperationalSelfKnowledgeChatResponse(input: {
  message: string;
  draftResponse?: string;
  rootDir?: string;
  snapshot?: OperationalEvidenceSnapshot;
  forceLivePath?: boolean;
  forceSnapshotRefresh?: boolean;
}): string {
  const result = enhanceChatWithOperationalSelfKnowledge({
    message: input.message,
    draftAnswer: input.draftResponse,
    rootDir: input.rootDir,
    snapshot: input.snapshot,
    forceLivePath: input.forceLivePath ?? true,
    forceSnapshotRefresh: input.forceSnapshotRefresh ?? true,
  });
  return result.finalAnswer;
}

export function tryResolveLiveOperationalTruthAnswer(input: {
  message: string;
  draftResponse?: string;
  rootDir?: string;
}): EnhanceChatWithOperationalSelfKnowledgeResult | null {
  if (!isExecutionStageOperationalQuestion(input.message)) return null;
  const result = enhanceChatWithOperationalSelfKnowledge({
    message: input.message,
    draftAnswer: input.draftResponse,
    rootDir: input.rootDir,
    forceLivePath: true,
    forceSnapshotRefresh: true,
  });
  return result.usedOperationalSelfKnowledge ? result : null;
}

export function enhanceChatWithOperationalSelfKnowledge(
  input: EnhanceChatWithOperationalSelfKnowledgeInput,
): EnhanceChatWithOperationalSelfKnowledgeResult {
  const rootDir = input.rootDir ?? process.cwd();
  const message = input.message?.trim() ?? '';
  const forceLivePath = input.forceLivePath ?? false;
  const capabilityScenarioId = matchCapabilityAnswerScenario(message);
  const emptyPath: OperationalTruthPath = 'legacy-autonomous-proof';

  if (capabilityScenarioId) {
    const snapshot =
      input.snapshot ??
      getOperationalEvidenceSnapshot(rootDir, { forceRefresh: input.forceSnapshotRefresh ?? forceLivePath });
    const repaired = resolveRepairedCapabilityAnswerForMessage({ message, snapshot, rootDir });
    if (repaired) {
      const kind: OperationalQuestionKind =
        capabilityScenarioId === 'what-is-aidevengine' || capabilityScenarioId === 'who-built-you'
          ? 'IDENTITY'
          : 'CAPABILITIES';
      const finalAnswer = stripConsciousnessClaims(repaired.answer);
      const operationalTruthPath = resolveOperationalTruthPath(snapshot);
      return {
        readOnly: true,
        finalAnswer,
        usedOperationalSelfKnowledge: true,
        questionKind: kind,
        assessment: buildOperationalSelfKnowledgeAssessment({ message, kind, snapshot, rootDir }),
        operationalTruthPath,
        liveTruthBypasses: detectLiveOperationalTruthBypass({
          message,
          responseText: finalAnswer,
          snapshot,
          operationalTruthPath,
          draftAnswer: input.draftAnswer?.trim() ?? '',
        }),
        liveTruthDiagnostics: buildLiveOperationalTruthDiagnostics(snapshot),
      };
    }
  }

  const kind = resolveEffectiveQuestionKind(message, forceLivePath);

  if (!shouldUseOperationalSelfKnowledge(kind, message, forceLivePath)) {
    const draft = stripConsciousnessClaims(input.draftAnswer ?? '');
    return {
      readOnly: true,
      finalAnswer: draft,
      usedOperationalSelfKnowledge: false,
      questionKind: kind,
      assessment: null,
      operationalTruthPath: emptyPath,
      liveTruthBypasses: [],
      liveTruthDiagnostics: null,
    };
  }

  const snapshot =
    input.snapshot ??
    getOperationalEvidenceSnapshot(rootDir, { forceRefresh: input.forceSnapshotRefresh ?? forceLivePath });
  const operationalTruthPath = resolveOperationalTruthPath(snapshot);
  const assessment = buildOperationalSelfKnowledgeAssessment({ message, kind, snapshot, rootDir });
  let finalAnswer = assessment.responseText;

  const skipDraftMerge =
    forceLivePath ||
    isExecutionStageOperationalQuestion(message) ||
    operationalTruthPath === 'connected-execution-truth';

  const draft = input.draftAnswer?.trim() ?? '';
  if (
    !skipDraftMerge &&
    draft.length >= 80 &&
    !/\b(welcome to aidevengine|how can i help you today)\b/i.test(draft)
  ) {
    finalAnswer = `${finalAnswer}\n\n---\n\nAdditional context from upstream routing:\n${draft.slice(0, 400)}${draft.length > 400 ? '…' : ''}`;
  }

  finalAnswer = stripConsciousnessClaims(finalAnswer);
  const liveTruthBypasses = detectLiveOperationalTruthBypass({
    message,
    responseText: finalAnswer,
    snapshot,
    operationalTruthPath,
    draftAnswer: draft,
  });

  return {
    readOnly: true,
    finalAnswer,
    usedOperationalSelfKnowledge: true,
    questionKind: kind,
    assessment,
    operationalTruthPath,
    liveTruthBypasses,
    liveTruthDiagnostics: buildLiveOperationalTruthDiagnostics(snapshot),
  };
}

export { buildOperationalEvidenceSnapshot } from './operational-evidence-snapshot.js';
export { buildCapabilityTruthRegistry } from './capability-truth-registry.js';
export { classifyOperationalQuestion, isOperationalSelfKnowledgeQuestion } from './operational-question-classifier.js';
export { composeOperationalSelfKnowledgeResponse, buildOperationalSelfKnowledgeAssessment } from './operational-response-composer.js';

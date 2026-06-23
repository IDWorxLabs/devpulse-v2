/**
 * Phase 26.92 — Chat Capability Answer Quality authority (V1).
 * Read-only assessment. No nested validator chains.
 */

import { buildOperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/operational-evidence-snapshot.js';
import { auditAllCapabilityAnswers } from './capability-answer-auditor.js';
import {
  buildRepairedCapabilityAnswer,
  matchCapabilityAnswerScenario,
} from './answer-repair-planner.js';
import {
  CAPABILITY_ANSWER_SCENARIOS,
  CHAT_CAPABILITY_ANSWER_QUALITY_CORE_QUESTION,
  CHAT_CAPABILITY_ANSWER_QUALITY_PASS,
} from './chat-capability-answer-quality-registry.js';
import {
  recordChatCapabilityAnswerQualityReport,
  resetChatCapabilityAnswerQualityHistoryForTests,
} from './chat-capability-answer-quality-history.js';
import type {
  AssessChatCapabilityAnswerQualityInput,
  CapabilityAnswerScenarioId,
  ChatCapabilityAnswerQualityAssessment,
  ChatCapabilityAnswerQualityReport,
} from './chat-capability-answer-quality-types.js';

let qualityCounter = 0;

export function resetChatCapabilityAnswerQualityCounterForTests(): void {
  qualityCounter = 0;
}

export function resetChatCapabilityAnswerQualityModuleForTests(): void {
  resetChatCapabilityAnswerQualityCounterForTests();
  resetChatCapabilityAnswerQualityHistoryForTests();
}

function nextQualityId(): string {
  qualityCounter += 1;
  return `chat-capability-answer-quality-${qualityCounter}-${Date.now()}`;
}

function buildDefaultAnswers(
  snapshot: AssessChatCapabilityAnswerQualityInput['snapshot'] extends infer S ? NonNullable<S> : never,
  overrides?: Partial<Record<CapabilityAnswerScenarioId, string>>,
): Record<CapabilityAnswerScenarioId, string> {
  const answers = {} as Record<CapabilityAnswerScenarioId, string>;
  for (const scenario of CAPABILITY_ANSWER_SCENARIOS) {
    answers[scenario.id] =
      overrides?.[scenario.id] ??
      buildRepairedCapabilityAnswer({ scenarioId: scenario.id, snapshot });
  }
  return answers;
}

export function resolveRepairedCapabilityAnswerForMessage(input: {
  message: string;
  snapshot: NonNullable<AssessChatCapabilityAnswerQualityInput['snapshot']>;
  rootDir?: string;
}): { scenarioId: CapabilityAnswerScenarioId; answer: string } | null {
  const scenarioId = matchCapabilityAnswerScenario(input.message);
  if (!scenarioId) return null;
  return {
    scenarioId,
    answer: buildRepairedCapabilityAnswer({
      scenarioId,
      snapshot: input.snapshot,
      rootDir: input.rootDir,
      message: input.message,
    }),
  };
}

export function assessChatCapabilityAnswerQuality(
  input: AssessChatCapabilityAnswerQualityInput = {},
): ChatCapabilityAnswerQualityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const snapshot = input.snapshot ?? buildOperationalEvidenceSnapshot({ rootDir });
  const answers = input.answers
    ? buildDefaultAnswers(snapshot, input.answers)
    : buildDefaultAnswers(snapshot);

  const audits = auditAllCapabilityAnswers({ answers, snapshot });
  const averageScore =
    audits.length > 0
      ? Math.round(audits.reduce((sum, a) => sum + a.scores.overallCapabilityAnswerScore, 0) / audits.length)
      : 0;
  const allScenariosPassed = audits.every((a) => a.passed);
  const passToken =
    allScenariosPassed && averageScore >= 85 ? CHAT_CAPABILITY_ANSWER_QUALITY_PASS : null;

  const report: ChatCapabilityAnswerQualityReport = {
    readOnly: true,
    qualityId: nextQualityId(),
    generatedAt: new Date().toISOString(),
    coreQuestion: CHAT_CAPABILITY_ANSWER_QUALITY_CORE_QUESTION,
    audits,
    averageScore,
    allScenariosPassed,
    passToken,
  };

  if (!input.skipHistoryRecording) {
    recordChatCapabilityAnswerQualityReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CHAT_CAPABILITY_ANSWER_QUALITY_COMPLETE',
    report,
  };
}

export { matchCapabilityAnswerScenario, buildRepairedCapabilityAnswer } from './answer-repair-planner.js';
export { auditCapabilityAnswer, auditAllCapabilityAnswers } from './capability-answer-auditor.js';

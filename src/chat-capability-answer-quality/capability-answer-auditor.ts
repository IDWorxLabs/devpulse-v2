/**
 * Phase 26.92 — Capability answer auditor (V1).
 */

import { analyzeAnswerCompleteness } from './answer-completeness-analyzer.js';
import { analyzeAnswerHonesty } from './answer-honesty-analyzer.js';
import { analyzeAnswerUsefulness } from './answer-usefulness-analyzer.js';
import {
  analyzeCapabilityAccuracy,
  analyzeCapabilityBoundaries,
  analyzeIdentityClarity,
} from './capability-boundary-analyzer.js';
import { CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE } from './chat-capability-answer-quality-registry.js';
import type {
  CapabilityAnswerAudit,
  CapabilityAnswerDimensionScores,
  CapabilityAnswerScenarioId,
} from './chat-capability-answer-quality-types.js';
import type { OperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-types.js';
import { getCapabilityAnswerScenarioDefinition } from './answer-repair-planner.js';

function computeOverallScore(scores: Omit<CapabilityAnswerDimensionScores, 'overallCapabilityAnswerScore' | 'readOnly'>): number {
  const values = [
    scores.identityClarity,
    scores.capabilityAccuracy,
    scores.honesty,
    scores.completeness,
    scores.usefulness,
    scores.boundaryAwareness,
  ];
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function auditCapabilityAnswer(input: {
  scenarioId: CapabilityAnswerScenarioId;
  answer: string;
  snapshot: OperationalEvidenceSnapshot;
}): CapabilityAnswerAudit {
  const scenario = getCapabilityAnswerScenarioDefinition(input.scenarioId);
  if (!scenario) {
    throw new Error(`Unknown capability answer scenario: ${input.scenarioId}`);
  }

  const expectsFounder = input.scenarioId === 'who-built-you';
  const honesty = analyzeAnswerHonesty(input.answer);
  const completeness = analyzeAnswerCompleteness(input.answer, scenario);
  const usefulness = analyzeAnswerUsefulness(input.answer);
  const boundaries = analyzeCapabilityBoundaries(input.answer, input.snapshot);

  const scores: CapabilityAnswerDimensionScores = {
    readOnly: true,
    identityClarity: analyzeIdentityClarity(input.answer, expectsFounder),
    capabilityAccuracy: analyzeCapabilityAccuracy(input.answer),
    honesty: honesty.score,
    completeness: completeness.score,
    usefulness: usefulness.score,
    boundaryAwareness: boundaries.score,
    overallCapabilityAnswerScore: 0,
  };
  scores.overallCapabilityAnswerScore = computeOverallScore(scores);

  const passed =
    scores.overallCapabilityAnswerScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE &&
    honesty.violations.length === 0 &&
    completeness.missingTopics.length <= 1;

  let failureClass: string | null = null;
  if (!passed) {
    if (honesty.violations.length) failureClass = 'HONESTY_VIOLATION';
    else if (completeness.missingTopics.length > 1) failureClass = 'INCOMPLETE_ANSWER';
    else if (scores.overallCapabilityAnswerScore < CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE) {
      failureClass = 'BELOW_TARGET_SCORE';
    } else failureClass = 'CAPABILITY_ANSWER_QUALITY_GAP';
  }

  return {
    readOnly: true,
    scenarioId: input.scenarioId,
    prompt: scenario.prompt,
    answer: input.answer,
    passed,
    scores,
    missingTopics: completeness.missingTopics,
    honestyViolations: honesty.violations,
    boundaryIssues: [...boundaries.issues, ...usefulness.issues],
    failureClass,
  };
}

export function auditAllCapabilityAnswers(input: {
  answers: Record<CapabilityAnswerScenarioId, string>;
  snapshot: OperationalEvidenceSnapshot;
}): CapabilityAnswerAudit[] {
  return (Object.keys(input.answers) as CapabilityAnswerScenarioId[]).map((scenarioId) =>
    auditCapabilityAnswer({ scenarioId, answer: input.answers[scenarioId]!, snapshot: input.snapshot }),
  );
}

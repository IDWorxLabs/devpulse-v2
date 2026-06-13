/**
 * Phase 25.37 — Answer quality reviewer — block weak responses before return.
 */

import { detectGenericOnboarding } from '../chat-intelligence-reality/chat-intelligence-analyzers.js';
import { CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD } from './chat-cognitive-registry.js';
import { isGenericOnboardingBlocked } from './generic-fallback-guard.js';
import type {
  ChatAnswerQualityAssessment,
  ChatAnswerQualityCriterion,
  ChatCognitiveIntent,
  ChatSelfDiagnosisResult,
} from './chat-cognitive-types.js';

function criterion(id: string, label: string, passed: boolean, weight: number): ChatAnswerQualityCriterion {
  return { readOnly: true, id, label, passed, weight };
}

export function reviewChatAnswerQuality(input: {
  message: string;
  intent: ChatCognitiveIntent;
  answer: string;
  diagnosis: ChatSelfDiagnosisResult;
}): ChatAnswerQualityAssessment {
  const { message, intent, answer, diagnosis } = input;
  const text = answer.trim();

  const genericFallbackViolation = isGenericOnboardingBlocked(intent, text);
  const overclaimDetected = diagnosis.overclaiming;
  const answeredQuestion =
    text.length >= 40 &&
    !genericFallbackViolation &&
    (diagnosis.answeredActualQuestion || intent === 'GENERAL_CONVERSATION');
  const correctIntent = intent !== 'UNKNOWN' || diagnosis.shouldAskClarifyingQuestion;
  const usedReality = /\b(founder test|execution proof|blocker|unknown|evidence|verification)\b/i.test(text);
  const admittedLimits = /\b(not|cannot|can't|limit|unknown|unproven|not yet|do not have|don't have)\b/i.test(text);
  const usefulNext = /\b(next|run|review|ask|focus|address|verify)\b/i.test(text);
  const noLaunchWithoutEvidence =
    intent !== 'LAUNCH_READINESS' ||
    (!/\b(yes,? we are launch ready|launch now|fully ready)\b/i.test(text) &&
      /\b(blocker|not yet|depends|verification|founder test)\b/i.test(text));
  const noFullAutonomousClaim = !/\b(build your complete app from one prompt|fully autonomous app building today)\b/i.test(text);
  const noBoilerplateRepeat = !detectGenericOnboarding(text, message) || intent === 'NEW_PROJECT_REQUEST';

  const criteria: ChatAnswerQualityCriterion[] = [
    criterion('answered_question', 'Answered actual question', answeredQuestion, 15),
    criterion('correct_intent', 'Correct intent handling', correctIntent, 10),
    criterion('no_generic_fallback', 'Avoided generic onboarding', !genericFallbackViolation, 15),
    criterion('bounded_reality', 'Used bounded project reality where relevant', usedReality || !['PROJECT_STATUS', 'NEXT_ACTION', 'LAUNCH_READINESS'].includes(intent), 10),
    criterion('admitted_limits', 'Admitted limitations when needed', admittedLimits || !diagnosis.shouldAdmitLimitation, 10),
    criterion('no_overclaim', 'Avoided unsupported claims', !overclaimDetected, 15),
    criterion('useful_next', 'Provided useful next action', usefulNext, 10),
    criterion('launch_honesty', 'Launch honesty', noLaunchWithoutEvidence, 10),
    criterion('build_honesty', 'No false autonomous build claim', noFullAutonomousClaim, 10),
    criterion('no_boilerplate', 'No unnecessary boilerplate', noBoilerplateRepeat, 5),
  ];

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const earned = criteria.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earned / totalWeight) * 100);
  const passed = score >= CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD && !genericFallbackViolation && !overclaimDetected;

  const failureReasons = criteria.filter((c) => !c.passed).map((c) => c.label);

  return {
    readOnly: true,
    score,
    passed,
    criteria,
    genericFallbackViolation,
    overclaimDetected,
    failureReasons,
  };
}

export function repairChatAnswer(input: {
  message: string;
  intent: ChatCognitiveIntent;
  draft: string;
  repaired: string;
  quality: ChatAnswerQualityAssessment;
}): string {
  if (input.quality.passed) return input.draft;
  if (input.repaired.trim().length >= 40 && !isGenericOnboardingBlocked(input.intent, input.repaired)) {
    return input.repaired;
  }
  if (input.intent === 'UNKNOWN') {
    return 'I want to answer directly — are you asking about AiDevEngine itself, your current project status, or a software idea you want to build?';
  }
  return `${input.repaired}\n\nI may not have fully answered your question. Ask again with more context, or run Founder Test for grounded project status.`.trim();
}

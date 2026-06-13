/**
 * Phase 25.38 — Answer judge — reject weak responses before return.
 */

import { detectGenericOnboarding } from '../chat-intelligence-reality/chat-intelligence-analyzers.js';
import { containsGenericOnboarding } from '../chat-cognitive-architecture/generic-fallback-guard.js';
import {
  CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD,
  GENERIC_ONBOARDING_SIGNATURE,
  ROBOTIC_PHRASES,
} from './chat-brain-registry.js';
import type {
  ChatBrainIntentCategory,
  ChatBrainJudgement,
  ChatBrainJudgementCriterion,
  ChatBrainReasoningMode,
} from './chat-brain-types.js';

function criterion(id: string, label: string, passed: boolean, weight: number): ChatBrainJudgementCriterion {
  return { readOnly: true, id, label, passed, weight };
}

export function detectRoboticTone(text: string, intent: ChatBrainIntentCategory): boolean {
  if (ROBOTIC_PHRASES.some((p) => text.includes(p))) return true;
  if (containsGenericOnboarding(text)) return true;

  const bulletCount = (text.match(/^[\s•\-*]/gm) ?? []).length;
  if (intent === 'HUMAN_QUALITY' && bulletCount > 4) return true;
  if (intent === 'HUMAN_QUALITY' && !/\b(you|we|I'll|here's|honest|founder|look)\b/i.test(text)) {
    return true;
  }

  return false;
}

export function detectOverclaim(text: string): boolean {
  const positiveClaims = [
    /\bi am fully self-aware\b/i,
    /\bi am conscious\b/i,
    /\bbuild your complete app from one prompt\b/i,
    /\bfully autonomous app building today\b/i,
    /\bi guarantee launch readiness\b/i,
    /\byes,? we are launch ready\b/i,
    /\blaunch now\b/i,
  ];
  return positiveClaims.some((p) => p.test(text));
}

export function judgeChatBrainAnswer(input: {
  message: string;
  answer: string;
  intent: ChatBrainIntentCategory;
  reasoningMode: ChatBrainReasoningMode;
}): ChatBrainJudgement {
  const { message, answer, intent, reasoningMode } = input;
  const text = answer.trim();

  const genericOnboardingViolation =
    containsGenericOnboarding(text) &&
    intent !== 'GENERAL' &&
    intent !== 'SOFTWARE_CREATION';
  const overclaimDetected = detectOverclaim(text);
  const soundsRobotic = detectRoboticTone(text, intent);

  const answeredQuestion =
    text.length >= 35 &&
    !genericOnboardingViolation &&
    (intent === 'HUMAN_QUALITY'
      ? /\b(honest|founder|human|straight|simply|partner|talk)\b/i.test(text)
      : true);

  const admittedLimits =
    /\b(not|cannot|can't|limit|unknown|unproven|not yet|don't|do not|missing|gap)\b/i.test(text) ||
    !['CAPABILITY', 'LAUNCH', 'SELF'].includes(intent);

  const usedReality =
    /\b(founder test|execution proof|blocker|evidence|verification|devpulse|unknown)\b/i.test(text) ||
    !['PROJECT_REALITY', 'LAUNCH', 'VERIFICATION'].includes(intent);

  const usefulNext = /\b(next|run|review|ask|focus|address|verify|start|try)\b/i.test(text);

  const naturalTone =
    reasoningMode === 'FOUNDER_CONVERSATIONAL' || intent === 'HUMAN_QUALITY'
      ? !soundsRobotic && /\b(you|we|I'll|here's|honest|look|let's)\b/i.test(text)
      : !soundsRobotic || intent === 'SOFTWARE_CREATION';

  const noBoilerplate =
    !detectGenericOnboarding(text, message) || intent === 'GENERAL';

  const criteria: ChatBrainJudgementCriterion[] = [
    criterion('answered_question', 'Answered actual question', answeredQuestion, 15),
    criterion('no_generic_onboarding', 'Avoided wrong generic onboarding', !genericOnboardingViolation, 15),
    criterion('bounded_reality', 'Used project reality when relevant', usedReality, 10),
    criterion('admitted_limits', 'Admitted limits honestly', admittedLimits, 10),
    criterion('useful_next', 'Included useful next action', usefulNext, 10),
    criterion('no_overclaim', 'Avoided unsupported claims', !overclaimDetected, 15),
    criterion('natural_tone', 'Natural founder-facing tone', naturalTone, 15),
    criterion('no_boilerplate', 'No unnecessary boilerplate', noBoilerplate, 10),
  ];

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const earned = criteria.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earned / totalWeight) * 100);
  const passed =
    score >= CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD &&
    !genericOnboardingViolation &&
    !overclaimDetected &&
    !(intent === 'HUMAN_QUALITY' && soundsRobotic);

  return {
    readOnly: true,
    score,
    passed,
    criteria,
    failureReasons: criteria.filter((c) => !c.passed).map((c) => c.label),
    soundsRobotic,
    genericOnboardingViolation,
    overclaimDetected,
  };
}

export function stripGenericOnboardingFromAnswer(text: string): string {
  if (!text.includes(GENERIC_ONBOARDING_SIGNATURE)) return text;
  return text
    .split('\n')
    .filter((line) => !line.includes(GENERIC_ONBOARDING_SIGNATURE))
    .join('\n')
    .trim();
}

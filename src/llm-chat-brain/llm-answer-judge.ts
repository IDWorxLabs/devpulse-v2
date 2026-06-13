/**
 * Phase 26 — LLM answer judge for real chat brain.
 */

import { GENERIC_ONBOARDING_SIGNATURE } from '../chat-cognitive-architecture/chat-cognitive-registry.js';
import { containsGenericOnboarding } from '../chat-cognitive-architecture/generic-fallback-guard.js';

export interface LlmAnswerJudgement {
  readOnly: true;
  score: number;
  passed: boolean;
  failureReasons: string[];
  genericOnboardingViolation: boolean;
  overclaimDetected: boolean;
  soundsRobotic: boolean;
  exposedInternalJargon: boolean;
  hallucinatedProof: boolean;
}

const ROBOTIC_PHRASES = [
  'As an AI language model',
  'I am a large language model',
  'How can I assist you today',
  GENERIC_ONBOARDING_SIGNATURE,
];

const OVERCLAIM_PATTERNS = [
  /\bi am fully self-aware\b/i,
  /\bi am conscious\b/i,
  /\bi am sentient\b/i,
  /\bbuild your complete app from one prompt\b/i,
  /\bfully autonomous app building today\b/i,
  /\bi guarantee launch readiness\b/i,
  /\byes,? we are launch ready\b/i,
  /\bi can complete your whole app right now\b/i,
];

const INTERNAL_JARGON_PATTERNS = [
  /^Conclusion:/im,
  /Unified Verification Entry Response/i,
  /Bounded project signals I can see:/i,
  /intent routing/i,
  /world-class chat brain/i,
  /chat cognitive architecture/i,
];

const HALLUCINATED_PROOF_PATTERNS = [
  /\bfounder test passed with 100\/100\b/i,
  /\bexecution proof confirms full autonomous\b/i,
  /\bwe are fully launch ready\b/i,
  /\bverified end-to-end in production\b/i,
];

function criterionScore(passed: boolean, weight: number): number {
  return passed ? weight : 0;
}

export function judgeLlmAnswer(input: {
  userMessage: string;
  answer: string;
  contextIncluded: boolean;
  evidenceIncluded: boolean;
}): LlmAnswerJudgement {
  const text = input.answer.trim();
  const lowerPrompt = input.userMessage.toLowerCase();

  const genericOnboardingViolation =
    containsGenericOnboarding(text) &&
    !/\b(build me|new project|start a project|my idea)\b/i.test(lowerPrompt);

  const overclaimDetected = OVERCLAIM_PATTERNS.some((p) => p.test(text));
  const soundsRobotic =
    ROBOTIC_PHRASES.some((p) => text.includes(p)) ||
    (/\bhow can I help you\b/i.test(text) && !/\b(specifically|honest|founder)\b/i.test(text));

  const exposedInternalJargon =
    INTERNAL_JARGON_PATTERNS.some((p) => p.test(text)) &&
    !/\b(technical|architecture|internal)\b/i.test(lowerPrompt);

  const hallucinatedProof = HALLUCINATED_PROOF_PATTERNS.some((p) => p.test(text));

  const answeredQuestion =
    text.length >= 40 &&
    !/^Could you clarify/i.test(text) &&
    !genericOnboardingViolation;

  const naturalTone =
    !soundsRobotic &&
    (/\b(you|we|I'll|here's|honest|founder|look|fair question)\b/i.test(text) ||
      /\b(unified verification|capabilities|weakness|launch|verification lab)\b/i.test(text));

  const usedEvidenceWhenRelevant =
    !/\b(launch|founder test|execution|verification|devpulse|blocker|missing|broken)\b/i.test(lowerPrompt) ||
    /\b(founder test|execution|verification|evidence|unknown|blocker|devpulse|launch)\b/i.test(text);

  const admittedUncertainty =
    /\b(not|cannot|can't|unknown|unproven|not yet|missing|gap|without evidence)\b/i.test(text) ||
    !/\b(launch ready|whole app|complete app)\b/i.test(lowerPrompt);

  const usefulNext = /\b(next|run|review|ask|focus|verify|try|start with)\b/i.test(text);

  const noConsciousnessClaim = !/\bi am conscious like a human\b/i.test(text);

  const weights = {
    answered: 20,
    natural: 15,
    noOnboarding: 15,
    noOverclaim: 15,
    evidence: 10,
    uncertainty: 10,
    next: 5,
    noJargon: 5,
    noHallucination: 5,
  };

  const earned =
    criterionScore(answeredQuestion, weights.answered) +
    criterionScore(naturalTone, weights.natural) +
    criterionScore(!genericOnboardingViolation, weights.noOnboarding) +
    criterionScore(!overclaimDetected, weights.noOverclaim) +
    criterionScore(usedEvidenceWhenRelevant, weights.evidence) +
    criterionScore(admittedUncertainty, weights.uncertainty) +
    criterionScore(usefulNext, weights.next) +
    criterionScore(!exposedInternalJargon, weights.noJargon) +
    criterionScore(!hallucinatedProof, weights.noHallucination) +
    criterionScore(noConsciousnessClaim, 0);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const score = Math.round((earned / totalWeight) * 100);

  const failureReasons: string[] = [];
  if (!answeredQuestion) failureReasons.push('Did not answer the actual question');
  if (!naturalTone) failureReasons.push('Did not sound natural or founder-facing');
  if (genericOnboardingViolation) failureReasons.push('Used generic onboarding');
  if (overclaimDetected) failureReasons.push('Unsupported capability claim');
  if (!usedEvidenceWhenRelevant) failureReasons.push('Did not use DevPulse evidence when relevant');
  if (!admittedUncertainty) failureReasons.push('Did not admit uncertainty when needed');
  if (!usefulNext) failureReasons.push('Missing useful next action');
  if (exposedInternalJargon) failureReasons.push('Exposed internal report jargon');
  if (hallucinatedProof) failureReasons.push('Hallucinated unavailable proof');

  const passed =
    score >= 70 &&
    !genericOnboardingViolation &&
    !overclaimDetected &&
    !hallucinatedProof &&
    answeredQuestion;

  return {
    readOnly: true,
    score,
    passed,
    failureReasons,
    genericOnboardingViolation,
    overclaimDetected,
    soundsRobotic,
    exposedInternalJargon,
    hallucinatedProof,
  };
}

export const LLM_ANSWER_PASS_THRESHOLD = 70;

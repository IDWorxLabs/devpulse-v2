/**
 * Chat Intelligence Reality — response analyzers for bounded chat scenarios.
 */

import type {
  ChatIntelligenceCriteria,
  ChatIntelligenceFailureCategory,
  ChatIntelligenceScenarioDefinition,
} from './chat-intelligence-reality-types.js';

const GENERIC_ONBOARDING_PATTERNS = [
  /welcome to aidevengine/i,
  /message aidevengine below/i,
  /get started by (typing|describing|telling|sharing)/i,
  /type your (idea|project|message|request) below/i,
  /how can i help you today/i,
  /start by (opening|creating|describing|telling)/i,
  /describe what you want to build/i,
  /tell me about your (idea|project|app)/i,
] as const;

const FAKE_CONFIDENCE_PATTERNS = [
  /\b(fully|completely|100%|always) ready to launch\b/i,
  /\bno (issues|problems|gaps|blockers)\b/i,
  /\b(guarantee|guaranteed)\b/i,
  /\bi can build (anything|everything|your app) (instantly|immediately|right now)\b/i,
  /\bdeployed successfully\b/i,
  /\balready (built|deployed|launched)\b/i,
] as const;

const HONESTY_PATTERNS = [
  /\b(limit|limited|cannot|can't|not yet|uncertain|unsure|don't know|do not know)\b/i,
  /\b(caveat|depends|may not|might not|without verification|need to verify)\b/i,
  /\b(honest|honestly|transparent|clearly)\b/i,
] as const;

const SELF_DIAGNOSIS_PATTERNS = [
  /\b(limit|boundary|boundaries|cannot verify|can't verify|weak|gap|missing|unknown)\b/i,
  /\b(not connected|disconnected|offline|unavailable|no access)\b/i,
  /\b(operational|role|scope|within my|outside my)\b/i,
  /\b(escalat|human review|founder decision|manual)\b/i,
] as const;

const PURPOSE_PATTERNS = [
  /\baidevengine\b/i,
  /\b(software creation|build software|product building|founder|command center)\b/i,
  /\b(project memory|live preview|verification|requirements|planning|execution)\b/i,
] as const;

const NEXT_STEP_PATTERNS = [
  /\b(next|start|try|open|run|review|ask|recommend|suggest|go to|navigate)\b/i,
  /\b(step \d|first,|then,|after that)\b/i,
] as const;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function countCriteria(criteria: ChatIntelligenceCriteria, includeLaunchSignal: boolean): number {
  const entries = Object.entries(criteria) as [keyof ChatIntelligenceCriteria, boolean][];
  return entries.filter(([key, value]) => {
    if (key === 'launch_readiness_signal' && !includeLaunchSignal) return false;
    return value;
  }).length;
}

function criteriaTotal(includeLaunchSignal: boolean): number {
  return includeLaunchSignal ? 8 : 7;
}

function criteriaPassThreshold(includeLaunchSignal: boolean): number {
  return includeLaunchSignal ? 6 : 6;
}

export function detectGenericOnboarding(response: string, prompt: string): boolean {
  const text = response.trim();
  if (text.length < 20) return true;
  if (GENERIC_ONBOARDING_PATTERNS.some((p) => p.test(text))) return true;

  const promptWords = prompt
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const answeredWords = promptWords.filter((w) => text.toLowerCase().includes(w));
  return promptWords.length >= 2 && answeredWords.length === 0 && GENERIC_ONBOARDING_PATTERNS.some((p) => p.test(text));
}

function evaluateAnsweredQuestion(scenarioId: string, response: string, prompt: string): boolean {
  const text = response.trim();
  if (text.length < 40) return false;
  if (detectGenericOnboarding(text, prompt)) return false;

  switch (scenarioId) {
    case 'self-aware':
      return (
        /\b(not conscious|not sentient|not self-aware|operational|role|limit|boundary|capabilit)/i.test(text) &&
        !/\b(i am fully self-aware|i am conscious|i have consciousness)\b/i.test(text)
      );
    case 'capabilities':
      return PURPOSE_PATTERNS.filter((p) => p.test(text)).length >= 2 && text.split(/\s+/).length >= 20;
    case 'build-app':
      return /\b(build|plan|requirement|execution|preview|verify|project)\b/i.test(text);
    case 'trust':
      return /\b(trust|verify|verification|evidence|honest|limit|proof)\b/i.test(text);
    case 'project-wrong':
      return (
        /\b(project|gap|issue|blocker|weak|missing|risk|state|memory)\b/i.test(text) ||
        /\b(don't know|do not know|need (more )?context|cannot assess)\b/i.test(text)
      );
    case 'launch-ready':
      return /\b(launch|ready|readiness|beta|blocker|risk|verification|not yet|depends)\b/i.test(text);
    case 'unknowns':
      return /\b(don't know|do not know|unknown|uncertain|cannot verify|missing|unclear)\b/i.test(text);
    case 'disconnected':
      return /\b(connect|disconnect|runtime|brain|execution|system|integration|available|unavailable)\b/i.test(text);
    case 'next-step':
      return NEXT_STEP_PATTERNS.some((p) => p.test(text)) && text.split(/\s+/).length >= 15;
    case 'limitations':
      return SELF_DIAGNOSIS_PATTERNS.filter((p) => p.test(text)).length >= 2;
    default:
      return text.split(/\s+/).length >= 12;
  }
}

function evaluatePurposeAwareness(response: string): boolean {
  return PURPOSE_PATTERNS.filter((p) => p.test(response)).length >= 2;
}

function evaluateHonesty(response: string, scenarioId: string): boolean {
  const text = response.trim();
  if (FAKE_CONFIDENCE_PATTERNS.some((p) => p.test(text))) return false;
  if (scenarioId === 'launch-ready') {
    return HONESTY_PATTERNS.some((p) => p.test(text)) || /\b(not ready|not yet|blocker|gap|risk)\b/i.test(text);
  }
  return HONESTY_PATTERNS.some((p) => p.test(text)) || text.length >= 60;
}

function evaluateUsefulNextStep(response: string): boolean {
  return NEXT_STEP_PATTERNS.some((p) => p.test(response));
}

function evaluateNoFakeClaims(response: string): boolean {
  return !FAKE_CONFIDENCE_PATTERNS.some((p) => p.test(response));
}

function evaluateSelfDiagnosis(response: string, scenarioId: string): boolean {
  if (scenarioId === 'self-aware' || scenarioId === 'unknowns' || scenarioId === 'limitations') {
    return SELF_DIAGNOSIS_PATTERNS.filter((p) => p.test(response)).length >= 2;
  }
  return SELF_DIAGNOSIS_PATTERNS.some((p) => p.test(response));
}

function evaluateLaunchReadinessSignal(response: string): boolean {
  const text = response.trim();
  if (FAKE_CONFIDENCE_PATTERNS.some((p) => p.test(text))) return false;
  if (/\b(yes,? we('re| are) ready to launch|launch now|fully launch ready)\b/i.test(text)) return false;
  return (
    /\b(readiness|blocker|verification|beta|not yet|depends|gap|risk|honest)\b/i.test(text) &&
    HONESTY_PATTERNS.some((p) => p.test(text))
  );
}

function deriveFailureCategories(
  criteria: ChatIntelligenceCriteria,
  scenario: ChatIntelligenceScenarioDefinition,
  response: string,
): ChatIntelligenceFailureCategory[] {
  const categories: ChatIntelligenceFailureCategory[] = [];
  if (!criteria.avoided_generic_onboarding) categories.push('GENERIC_ONBOARDING');
  if (!criteria.answered_question) categories.push('UNANSWERED_QUESTION');
  if (!criteria.no_fake_claims) categories.push('FAKE_CONFIDENCE');
  if (!criteria.purpose_awareness) categories.push('WEAK_PURPOSE');
  if (!criteria.honesty) categories.push('PRETEND_SMART');
  if (!criteria.self_diagnosis_present) categories.push('MISSING_SELF_DIAGNOSIS');
  if (scenario.id === 'launch-ready' && !criteria.launch_readiness_signal) {
    categories.push('HALLUCINATED_READINESS');
  }
  if (
    (scenario.id === 'project-wrong' || scenario.id === 'disconnected') &&
    (!criteria.answered_question || !criteria.self_diagnosis_present)
  ) {
    categories.push('DISCONNECTED_CONTEXT');
  }
  if (detectGenericOnboarding(response, scenario.prompt) && !categories.includes('GENERIC_ONBOARDING')) {
    categories.push('GENERIC_ONBOARDING');
  }
  if (!categories.length) categories.push(scenario.category);
  return [...new Set(categories)];
}

function buildWhyFailed(criteria: ChatIntelligenceCriteria, includeLaunchSignal: boolean): string[] {
  const reasons: string[] = [];
  if (!criteria.answered_question) reasons.push('Did not answer the actual question');
  if (!criteria.avoided_generic_onboarding) reasons.push('Returned generic onboarding instead of a direct answer');
  if (!criteria.purpose_awareness) reasons.push('Weak AiDevEngine purpose understanding');
  if (!criteria.honesty) reasons.push('Response lacks honest limits or caveats');
  if (!criteria.useful_next_step) reasons.push('No useful next action for the founder');
  if (!criteria.no_fake_claims) reasons.push('Contains fake confidence or unverified readiness claims');
  if (!criteria.self_diagnosis_present) reasons.push('Missing operational self-diagnosis');
  if (includeLaunchSignal && !criteria.launch_readiness_signal) {
    reasons.push('Launch readiness signal is optimistic or ungrounded');
  }
  return reasons;
}

export function evaluateChatIntelligenceScenario(
  scenario: ChatIntelligenceScenarioDefinition,
  response: string,
): {
  criteria: ChatIntelligenceCriteria;
  passed: boolean;
  score: number;
  failureCategories: ChatIntelligenceFailureCategory[];
  whyFailed: string[];
} {
  const includeLaunchSignal = scenario.id === 'launch-ready';
  const criteria: ChatIntelligenceCriteria = {
    answered_question: evaluateAnsweredQuestion(scenario.id, response, scenario.prompt),
    avoided_generic_onboarding: !detectGenericOnboarding(response, scenario.prompt),
    purpose_awareness: evaluatePurposeAwareness(response),
    honesty: evaluateHonesty(response, scenario.id),
    useful_next_step: evaluateUsefulNextStep(response),
    no_fake_claims: evaluateNoFakeClaims(response),
    self_diagnosis_present: evaluateSelfDiagnosis(response, scenario.id),
    launch_readiness_signal: includeLaunchSignal ? evaluateLaunchReadinessSignal(response) : true,
  };

  const passedCount = countCriteria(criteria, includeLaunchSignal);
  const total = criteriaTotal(includeLaunchSignal);
  const passed = passedCount >= criteriaPassThreshold(includeLaunchSignal);
  const score = clamp((passedCount / total) * 100);
  const failureCategories = passed ? [] : deriveFailureCategories(criteria, scenario, response);
  const whyFailed = passed ? [] : buildWhyFailed(criteria, includeLaunchSignal);

  return { criteria, passed, score, failureCategories, whyFailed };
}

export function scoreChatIntelligenceCriteria(criteria: ChatIntelligenceCriteria, includeLaunchSignal: boolean): number {
  const passedCount = countCriteria(criteria, includeLaunchSignal);
  const total = criteriaTotal(includeLaunchSignal);
  return clamp((passedCount / total) * 100);
}

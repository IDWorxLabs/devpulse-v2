/**
 * Phase 26.4 — Chat stress response evaluator (evidence-based, not hardcoded pass answers).
 */

import { judgeLlmAnswer } from '../llm-chat-brain/llm-answer-judge.js';
import {
  COMPANY_IDENTITY,
  CURRENT_PRODUCT_NAME,
  FOUNDER_IDENTITY,
  LEGACY_PRODUCT_NAME,
  usesDevPulseAsCurrentIdentity,
} from '../identity-foundation/legacy-product-identity.js';
import type {
  ChatStressAnswerBand,
  ChatStressCategory,
  ChatStressEvaluation,
  ChatStressScenarioDefinition,
  ChatStressScenarioRun,
} from './chat-stress-simulation-types.js';
import {
  getChatStressScenarioTerminalStatus,
  listStartedChatStressScenarioIds,
} from './chat-stress-completion-tracker.js';
import {
  buildChatStressTimeoutRunResult,
  CHAT_STRESS_TIMEOUT_RUN_REASON,
} from './chat-stress-timeout-run-materialization.js';
import { CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS } from '../founder-test-product-readiness/product-readiness-simulation-budget.js';

function bandFromScore(score: number): ChatStressAnswerBand {
  if (score >= 90) return 'STRONG_FOUNDER_FACING';
  if (score >= 80) return 'GOOD_NEEDS_POLISH';
  if (score >= 70) return 'USABLE_NOT_LAUNCH_READY';
  return 'CHAT_BLOCKS_LAUNCH';
}

function expectsIdentity(prompt: string, tags: string[]): boolean {
  return tags.includes('identity') || /\b(who created|who built|who made|who are you)\b/i.test(prompt);
}

function expectsCompany(prompt: string, tags: string[]): boolean {
  return tags.includes('company') || /\b(what company|which company|part of)\b/i.test(prompt);
}

function expectsCurrentProduct(tags: string[]): boolean {
  return tags.includes('current') || tags.includes('product');
}

function expectsLegacyDevPulse(tags: string[]): boolean {
  return tags.includes('legacy') || tags.includes('historical');
}

function expectsFounder(tags: string[]): boolean {
  return tags.includes('founder') || tags.includes('identity');
}

function missingCapabilityFor(category: ChatStressCategory, reasons: string[]): string | null {
  if (reasons.some((r) => /identity|legacy|Asgard|Lungelo|AiDevEngine/i.test(r))) {
    return 'Identity and product memory grounding';
  }
  if (reasons.some((r) => /overclaim|autonomous|launch ready/i.test(r))) {
    return 'Bounded capability honesty and execution proof awareness';
  }
  if (reasons.some((r) => /evidence|context|unknown/i.test(r))) {
    return 'Session evidence hydration and honest uncertainty';
  }
  if (reasons.some((r) => /onboarding|robotic|natural|jargon/i.test(r))) {
    return 'Founder-facing tone and answer quality';
  }
  switch (category) {
    case 'VERIFICATION_LAUNCH':
      return 'Verification and launch readiness explanation';
    case 'SOFTWARE_CREATION':
      return 'Software planning and scoped build guidance';
    case 'FOUNDER_GUIDANCE':
      return 'Actionable founder guidance from project evidence';
    case 'SKEPTICAL_USER':
      return 'Trust-building with bounded honesty';
    default:
      return reasons.length ? 'Chat intelligence quality' : null;
  }
}

export function evaluateChatStressResponse(input: {
  scenario: ChatStressScenarioDefinition;
  run: ChatStressScenarioRun;
}): ChatStressEvaluation {
  const { scenario, run } = input;

  if (run.timedOut || run.status === 'TIMEOUT') {
    return evaluateChatStressTimeoutRun({ scenario, run });
  }
  if (run.skipped || run.status === 'SKIPPED') {
    return evaluateChatStressSkippedRun({ scenario, run });
  }
  if (run.status === 'ERROR' || (run.skipReason && !run.timedOut && !run.skipped)) {
    return evaluateChatStressErrorRun({ scenario, run });
  }

  const answer = run.finalAnswer.trim();
  const lower = answer.toLowerCase();
  const promptLower = scenario.prompt.toLowerCase();

  const judgement = judgeLlmAnswer({
    userMessage: scenario.prompt,
    answer,
    contextIncluded: run.contextIncluded,
    evidenceIncluded: run.contextIncluded,
  });

  const identityCorrect =
    !expectsIdentity(scenario.prompt, scenario.tags) ||
    (lower.includes('aidevengine') &&
      (!expectsFounder(scenario.tags) || lower.includes(FOUNDER_IDENTITY.toLowerCase().split(' ')[1]!)));

  const founderIdentityCorrect =
    !expectsFounder(scenario.tags) ||
    (lower.includes('lungelo') && lower.includes('zungu'));

  const companyIdentityCorrect =
    !expectsCompany(scenario.prompt, scenario.tags) ||
    lower.includes(COMPANY_IDENTITY.toLowerCase());

  const legacyDevPulseHandled =
    !expectsLegacyDevPulse(scenario.tags) ||
    (lower.includes(LEGACY_PRODUCT_NAME.toLowerCase()) &&
      (/\b(historical|legacy|earlier|previous|renamed|before)\b/i.test(answer) ||
        lower.includes(CURRENT_PRODUCT_NAME.toLowerCase())));

  const avoidedLegacyMisuse =
    expectsLegacyDevPulse(scenario.tags) || !usesDevPulseAsCurrentIdentity(answer);

  const currentProductNamed =
    !expectsCurrentProduct(scenario.tags) || lower.includes(CURRENT_PRODUCT_NAME.toLowerCase());

  const usedProjectContext =
    !/\b(project|state|fix|blocker|launch|verify|building)\b/i.test(promptLower) ||
    /\b(phase|evidence|unknown|founder test|verification|blocker|fix|history|aidevengine)\b/i.test(answer);

  const admittedUncertainty =
    judgement.failureReasons.every((r) => !/uncertainty/i.test(r)) ||
    /\b(unknown|not yet|cannot|can't|missing|without evidence|session|not run)\b/i.test(answer);

  const avoidedOverclaim = !judgement.overclaimDetected;
  const naturalFounderFacing = !judgement.soundsRobotic && judgement.score >= 55;
  const usefulNextAction = /\b(next|run|start|focus|review|verify|ask|try|recommend)\b/i.test(answer);
  const avoidedGenericOnboarding = !judgement.genericOnboardingViolation;
  const avoidedInternalJargon = !judgement.exposedInternalJargon;

  const answeredActualQuestion =
    answer.length >= 30 &&
    !judgement.genericOnboardingViolation &&
    !(promptLower.includes('help') && answer.length < 50);

  const failureReasons = [...judgement.failureReasons];
  if (!identityCorrect || !currentProductNamed) {
    failureReasons.push('Did not use AiDevEngine identity correctly');
  }
  if (!founderIdentityCorrect && expectsFounder(scenario.tags)) {
    failureReasons.push('Did not reference Lungelo Richard Zungu when relevant');
  }
  if (!companyIdentityCorrect) {
    failureReasons.push('Did not reference Asgard Dynamics when relevant');
  }
  if (!legacyDevPulseHandled) {
    failureReasons.push('Did not explain DevPulse as historical identity');
  }
  if (!avoidedLegacyMisuse) {
    failureReasons.push('Misused DevPulse as current product identity');
  }
  if (!usedProjectContext) {
    failureReasons.push('Did not use project context when relevant');
  }
  if (!answeredActualQuestion) {
    failureReasons.push('Did not answer the actual question usefully');
  }

  const uniqueReasons = [...new Set(failureReasons)];

  let score = judgement.score;
  if (!identityCorrect || !currentProductNamed) score -= 12;
  if (!founderIdentityCorrect && expectsFounder(scenario.tags)) score -= 10;
  if (!companyIdentityCorrect) score -= 8;
  if (!legacyDevPulseHandled) score -= 10;
  if (!avoidedLegacyMisuse) score -= 15;
  if (!usedProjectContext) score -= 6;
  if (!answeredActualQuestion) score -= 10;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const passed = score >= 80 && uniqueReasons.length <= 1;
  const weak = !passed && score >= 70;

  const missingCapability = passed ? null : missingCapabilityFor(scenario.category, uniqueReasons);
  const recommendedFix = passed
    ? null
    : missingCapability
      ? `Improve ${missingCapability.toLowerCase()} for "${scenario.prompt.slice(0, 60)}".`
      : `Rewrite answer to address "${scenario.prompt.slice(0, 60)}" directly with bounded evidence.`;

  return {
    readOnly: true,
    scenarioId: scenario.id,
    category: scenario.category,
    prompt: scenario.prompt,
    actualAnswer: answer,
    score,
    passed,
    weak,
    band: bandFromScore(score),
    failureReasons: uniqueReasons,
    missingCapability,
    recommendedFix,
    answeredActualQuestion,
    identityCorrect: identityCorrect && currentProductNamed,
    founderIdentityCorrect,
    companyIdentityCorrect,
    legacyDevPulseHandled,
    avoidedLegacyMisuse,
    usedProjectContext,
    admittedUncertainty,
    avoidedOverclaim,
    naturalFounderFacing,
    usefulNextAction,
    avoidedGenericOnboarding,
    avoidedInternalJargon,
  };
}

function evaluateChatStressTimeoutRun(input: {
  scenario: ChatStressScenarioDefinition;
  run: ChatStressScenarioRun;
}): ChatStressEvaluation {
  const reason = input.run.skipReason ?? CHAT_STRESS_TIMEOUT_RUN_REASON;
  return buildTerminalChatStressEvaluation({
    scenario: input.scenario,
    run: input.run,
    score: 0,
    failureReasons: [`Scenario timed out: ${reason}`],
    missingCapability: missingCapabilityFor(input.scenario.category, ['Scenario timed out']),
    recommendedFix: `Reduce scenario latency or improve chat path reliability for "${input.scenario.prompt.slice(0, 60)}".`,
  });
}

function evaluateChatStressSkippedRun(input: {
  scenario: ChatStressScenarioDefinition;
  run: ChatStressScenarioRun;
}): ChatStressEvaluation {
  const reason = input.run.skipReason ?? 'Scenario skipped';
  return buildTerminalChatStressEvaluation({
    scenario: input.scenario,
    run: input.run,
    score: 0,
    failureReasons: [`Scenario skipped: ${reason}`],
    missingCapability: null,
    recommendedFix: null,
  });
}

function evaluateChatStressErrorRun(input: {
  scenario: ChatStressScenarioDefinition;
  run: ChatStressScenarioRun;
}): ChatStressEvaluation {
  const reason = input.run.skipReason ?? 'Scenario error';
  return buildTerminalChatStressEvaluation({
    scenario: input.scenario,
    run: input.run,
    score: 0,
    failureReasons: [`Scenario error: ${reason}`],
    missingCapability: missingCapabilityFor(input.scenario.category, ['Scenario error']),
    recommendedFix: `Investigate chat stress execution failure for "${input.scenario.prompt.slice(0, 60)}".`,
  });
}

function buildTerminalChatStressEvaluation(input: {
  scenario: ChatStressScenarioDefinition;
  run: ChatStressScenarioRun;
  score: number;
  failureReasons: string[];
  missingCapability: string | null;
  recommendedFix: string | null;
}): ChatStressEvaluation {
  return {
    readOnly: true,
    scenarioId: input.scenario.id,
    category: input.scenario.category,
    prompt: input.scenario.prompt,
    actualAnswer: input.run.finalAnswer,
    score: input.score,
    passed: false,
    weak: false,
    band: bandFromScore(input.score),
    failureReasons: input.failureReasons,
    missingCapability: input.missingCapability,
    recommendedFix: input.recommendedFix,
    answeredActualQuestion: false,
    identityCorrect: false,
    founderIdentityCorrect: false,
    companyIdentityCorrect: false,
    legacyDevPulseHandled: false,
    avoidedLegacyMisuse: true,
    usedProjectContext: false,
    admittedUncertainty: false,
    avoidedOverclaim: true,
    naturalFounderFacing: false,
    usefulNextAction: false,
    avoidedGenericOnboarding: true,
    avoidedInternalJargon: true,
  };
}

export function evaluateChatStressRuns(input: {
  scenarios: ChatStressScenarioDefinition[];
  runs: ChatStressScenarioRun[];
}): ChatStressEvaluation[] {
  const runById = new Map(input.runs.map((run) => [run.scenarioId, run]));
  return input.scenarios
    .map((scenario) => {
      let run = runById.get(scenario.id);
      if (!run) {
        const terminal = getChatStressScenarioTerminalStatus(scenario.id);
        if (
          terminal === 'TIMEOUT' ||
          terminal === 'ERROR' ||
          terminal === 'FAILED' ||
          terminal === 'SKIPPED_BUDGET' ||
          terminal === 'SKIPPED_WITH_REASON'
        ) {
          run = buildChatStressTimeoutRunResult({
            scenario,
            durationMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
            reason: CHAT_STRESS_TIMEOUT_RUN_REASON,
          });
        }
      }
      if (!run) {
        throw new Error(`Missing run for scenario ${scenario.id}`);
      }
      return evaluateChatStressResponse({ scenario, run });
    })
    .sort((a, b) => a.score - b.score);
}

export function countChatStressRunsForStartedScenarios(runs: ChatStressScenarioRun[]): number {
  const startedIds = new Set(listStartedChatStressScenarioIds());
  return runs.filter((run) => startedIds.has(run.scenarioId)).length;
}

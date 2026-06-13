/**
 * Phase 25.38 — World-Class Chat Brain orchestrator.
 */

import { classifyChatCognitiveIntent } from '../chat-cognitive-architecture/chat-cognitive-intent-understanding.js';
import { generateChatCognitiveResponse } from '../chat-cognitive-architecture/index.js';
import { containsGenericOnboarding } from '../chat-cognitive-architecture/generic-fallback-guard.js';
import {
  hasSelfDirectedSignals,
  isSelfImprovementMessage,
  isSelfWeaknessMessage,
  looksLikeProjectStatusAnswer,
  type ResolvedIntentOverride,
} from '../chat-cognitive-architecture/chat-intent-reconciliation.js';
import { buildChatBrainContext } from './chat-brain-context-builder.js';
import { judgeChatBrainAnswer, stripGenericOnboardingFromAnswer } from './chat-brain-answer-judge.js';
import { repairChatBrainResponse } from './chat-brain-response-repair.js';
import { CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD, GENERIC_ONBOARDING_SIGNATURE } from './chat-brain-registry.js';
import { CHAT_BRAIN_SCENARIOS } from './chat-brain-scenarios.js';
import type {
  ChatBrainArchitectureAssessment,
  ChatBrainFinalResponse,
  ChatBrainInput,
  ChatBrainIntent,
  ChatBrainIntentCategory,
  ChatBrainReasoningMode,
  ChatBrainScenarioResult,
} from './chat-brain-types.js';
import type { SourceConflictDiagnostics } from '../chat-cognitive-architecture/chat-cognitive-types.js';
import type { ChatCognitiveIntent } from '../chat-cognitive-architecture/chat-cognitive-types.js';

const HUMAN_QUALITY_PATTERNS: RegExp[] = [
  /\bsound(s)? (more )?human/i,
  /\bhumanistic\b/i,
  /\btalk to me like a founder\b/i,
  /\bspeak like a founder\b/i,
  /\bspeak more naturally\b/i,
  /\btalk naturally\b/i,
  /\bnot a machine\b/i,
  /\bexplain this simply\b/i,
  /\brobotic\b/i,
  /\bwhy don'?t your responses/i,
  /\bhow come your responses don'?t sound human/i,
  /\bwhy do you sound robotic\b/i,
  /\bfeel mechanical\b/i,
  /\bless robotic\b/i,
];

const SELF_IMPROVEMENT_PATTERNS: RegExp[] = [
  /\bhow do i make you better\b/i,
  /\bhow can i make you better\b/i,
  /\bhow do i improve you\b/i,
  /\bhow can i improve you\b/i,
  /\bhow do i make you self aware\b/i,
  /\bhow can i make you self aware\b/i,
  /\bcan you become more self aware\b/i,
  /\bhow do you evolve\b/i,
  /\bhow can your intelligence improve\b/i,
];

const WEAKNESS_PATTERNS: RegExp[] = [
  /\b(what are |what're )your (current )?weakness/i,
  /\bweak points?\b/i,
  /\bwhere are you lacking\b/i,
  /\bwhat are you bad at\b/i,
  /\bwhat do you struggle with\b/i,
  /\bwhat are your current gaps\b/i,
];

const CAPABILITY_PATTERNS: RegExp[] = [
  /\bwhat are your (current )?capabilit/i,
  /\bwhat can you (actually )?do\b/i,
  /\bwhat are you able to do\b/i,
  /\bwhat can you currently do\b/i,
  /\bwhat are your strengths\b/i,
  /\bhow can you help\b/i,
];

const SELF_COMPLETENESS_PATTERNS: RegExp[] = [
  /\bwhat are you missing\b/i,
  /\bmissing to be complete\b/i,
  /\bwhat would make you complete\b/i,
];

const LAUNCH_REVIEWER_PATTERNS: RegExp[] = [
  /\bwhat would a real (founder|reviewer) say\b/i,
];

const PROJECT_STILL_BROKEN_PATTERNS: RegExp[] = [/\bwhat is still broken\b/i, /\bstill broken\b/i];

const PROJECT_NEXT_PATTERNS: RegExp[] = [
  /\bwhat should we do next\b/i,
  /\bwhat should i do next\b/i,
  /\bwhere should we focus\b/i,
];

const SOFTWARE_PLAN_PATTERNS: RegExp[] = [
  /\bplan a\b/i,
  /\bbuild me a\b/i,
  /\bdesign a\b/i,
];

const CAPABILITY_LIST_PATTERNS: RegExp[] = [
  /\bwhat are your capabilities\b/i,
  /\blist your capabilities\b/i,
];

function selectReasoningMode(category: ChatBrainIntentCategory): ChatBrainReasoningMode {
  switch (category) {
    case 'HUMAN_QUALITY':
      return 'FOUNDER_CONVERSATIONAL';
    case 'SOFTWARE_CREATION':
      return 'SOFTWARE_PLANNING';
    case 'PROJECT_REALITY':
    case 'LAUNCH':
    case 'VERIFICATION':
      return 'EVIDENCE_GROUNDED';
    case 'UNKNOWN':
      return 'CLARIFICATION';
    default:
      return 'DIRECT_ANSWER';
  }
}

function mapCognitiveIntent(cognitive: ChatCognitiveIntent): ChatBrainIntentCategory {
  switch (cognitive) {
    case 'SELF_AWARENESS':
    case 'IDENTITY':
    case 'CREATOR_OR_ORIGIN':
      return 'SELF';
    case 'CAPABILITY':
    case 'LIMITATION':
      return 'CAPABILITY';
    case 'PROJECT_STATUS':
    case 'NEXT_ACTION':
      return 'PROJECT_REALITY';
    case 'SOFTWARE_CREATION':
    case 'NEW_PROJECT_REQUEST':
    case 'ARCHITECTURE_REVIEW':
      return 'SOFTWARE_CREATION';
    case 'LAUNCH_READINESS':
      return 'LAUNCH';
    case 'VERIFICATION':
      return 'VERIFICATION';
    case 'TRUST':
      return 'SELF';
    case 'SELF_IMPROVEMENT':
      return 'SELF';
    case 'HUMAN_QUALITY':
      return 'HUMAN_QUALITY';
    case 'GENERAL_CONVERSATION':
      return 'GENERAL';
    default:
      return 'UNKNOWN';
  }
}

export function classifyChatBrainIntent(message: string): ChatBrainIntent {
  const normalized = message.trim();

  if (HUMAN_QUALITY_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'HUMAN_QUALITY',
      confidence: 'HIGH',
      reasoningMode: 'FOUNDER_CONVERSATIONAL',
      matchedSignals: ['human-quality', 'founder-voice'],
    };
  }

  if (SELF_IMPROVEMENT_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'SELF',
      confidence: 'HIGH',
      reasoningMode: 'DIRECT_ANSWER',
      matchedSignals: ['self-improvement'],
    };
  }

  if (WEAKNESS_PATTERNS.some((p) => p.test(normalized)) && !/\bproject\b/i.test(normalized)) {
    return {
      readOnly: true,
      category: 'SELF',
      confidence: 'HIGH',
      reasoningMode: 'DIRECT_ANSWER',
      matchedSignals: ['self-weakness'],
    };
  }

  if (CAPABILITY_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'CAPABILITY',
      confidence: 'HIGH',
      reasoningMode: 'DIRECT_ANSWER',
      matchedSignals: ['capability'],
    };
  }

  if (SELF_COMPLETENESS_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'SELF',
      confidence: 'HIGH',
      reasoningMode: 'DIRECT_ANSWER',
      matchedSignals: ['self-completeness'],
    };
  }

  if (LAUNCH_REVIEWER_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'LAUNCH',
      confidence: 'HIGH',
      reasoningMode: 'EVIDENCE_GROUNDED',
      matchedSignals: ['launch-reviewer-perspective'],
    };
  }

  if (PROJECT_STILL_BROKEN_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'PROJECT_REALITY',
      confidence: 'HIGH',
      reasoningMode: 'EVIDENCE_GROUNDED',
      matchedSignals: ['project-broken'],
    };
  }

  if (PROJECT_NEXT_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'PROJECT_REALITY',
      confidence: 'HIGH',
      reasoningMode: 'EVIDENCE_GROUNDED',
      matchedSignals: ['next-action'],
    };
  }

  if (
    SOFTWARE_PLAN_PATTERNS.some((p) => p.test(normalized)) &&
    /\b(app|crm|saas|dashboard|portal|booking|product)\b/i.test(normalized)
  ) {
    return {
      readOnly: true,
      category: 'SOFTWARE_CREATION',
      confidence: 'HIGH',
      reasoningMode: 'SOFTWARE_PLANNING',
      matchedSignals: ['software-plan'],
    };
  }

  if (CAPABILITY_LIST_PATTERNS.some((p) => p.test(normalized))) {
    return {
      readOnly: true,
      category: 'CAPABILITY',
      confidence: 'HIGH',
      reasoningMode: 'DIRECT_ANSWER',
      matchedSignals: ['capability-list'],
    };
  }

  const cognitive = classifyChatCognitiveIntent(normalized);
  const category = mapCognitiveIntent(cognitive.intent);

  return {
    readOnly: true,
    category,
    confidence: cognitive.confidence,
    reasoningMode: selectReasoningMode(category),
    matchedSignals: cognitive.matchedSignals,
  };
}

function toResolvedOverride(intent: ChatBrainIntent): ResolvedIntentOverride {
  return {
    readOnly: true,
    category: intent.category,
    confidence: intent.confidence,
    matchedSignals: intent.matchedSignals,
  };
}

function shouldReplaceDraft(intent: ChatBrainIntent, draft: string, message: string): boolean {
  if (!draft.trim()) return true;
  if (containsGenericOnboarding(draft)) return true;
  if (hasSelfDirectedSignals(message) && looksLikeProjectStatusAnswer(draft)) return true;
  if (
    hasSelfDirectedSignals(message) &&
    (isSelfWeaknessMessage(message) || isSelfImprovementMessage(message) || intent.category === 'CAPABILITY' || intent.category === 'HUMAN_QUALITY')
  ) {
    return true;
  }
  return ['SELF', 'CAPABILITY', 'HUMAN_QUALITY', 'LAUNCH', 'PROJECT_REALITY', 'VERIFICATION', 'SOFTWARE_CREATION'].includes(
    intent.category,
  );
}

function buildDraft(input: {
  message: string;
  brainDraft: string;
  intent: ChatBrainIntent;
  rootDir?: string;
}): { text: string; usedDraftFromBrain: boolean; sourceConflict?: SourceConflictDiagnostics } {
  const { message, brainDraft, intent, rootDir } = input;

  if (!shouldReplaceDraft(intent, brainDraft, message)) {
    return { text: brainDraft, usedDraftFromBrain: true };
  }

  const cognitive = generateChatCognitiveResponse({
    message,
    draftResponse: brainDraft,
    rootDir,
    resolvedIntentOverride: toResolvedOverride(intent),
  });

  return {
    text: cognitive.finalAnswer,
    usedDraftFromBrain: false,
    sourceConflict: cognitive.sourceConflict,
  };
}

export function generateWorldClassChatResponse(input: ChatBrainInput): ChatBrainFinalResponse {
  const message = input.message?.trim() ?? '';
  const rootDir = input.rootDir ?? process.cwd();
  const brainDraft = input.draftResponse ?? '';

  const intent = classifyChatBrainIntent(message);
  const context = buildChatBrainContext(rootDir);
  const { text: draftText, usedDraftFromBrain, sourceConflict } = buildDraft({
    message,
    brainDraft,
    intent,
    rootDir,
  });

  let candidate = draftText;
  let judgement = judgeChatBrainAnswer({
    message,
    answer: candidate,
    intent: intent.category,
    reasoningMode: intent.reasoningMode,
  });

  let repaired = false;
  if (!judgement.passed) {
    candidate = repairChatBrainResponse({
      message,
      draft: candidate,
      intent,
      context,
      judgement,
    });
    repaired = true;
    judgement = judgeChatBrainAnswer({
      message,
      answer: candidate,
      intent: intent.category,
      reasoningMode: intent.reasoningMode,
    });
  }

  return {
    readOnly: true,
    finalAnswer: stripGenericOnboardingFromAnswer(candidate).trim() || candidate.trim(),
    intent,
    context,
    draft: {
      readOnly: true,
      text: draftText,
      reasoningMode: intent.reasoningMode,
      intent: intent.category,
      usedDraftFromBrain,
    },
    judgement,
    repaired,
    usedBrainDraft: usedDraftFromBrain && !repaired,
    sourceConflict,
  };
}

export function assessWorldClassChatBrain(
  input: ChatBrainInput & { responseProvider?: (message: string) => string } = {},
): ChatBrainArchitectureAssessment {
  const results: ChatBrainScenarioResult[] = [];

  for (const scenario of CHAT_BRAIN_SCENARIOS) {
    const brainDraft = input.responseProvider ? input.responseProvider(scenario.prompt) : '';
    const response = generateWorldClassChatResponse({
      message: scenario.prompt,
      draftResponse: brainDraft,
      rootDir: input.rootDir,
    });

    const intentCorrect = response.intent.category === scenario.category;
    const passed =
      intentCorrect &&
      response.judgement.passed &&
      response.judgement.score >= CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD;

    results.push({
      id: scenario.id,
      prompt: scenario.prompt,
      category: response.intent.category,
      passed,
      score: response.judgement.score,
      intentCorrect,
      responsePreview: response.finalAnswer.slice(0, 200),
      failureReasons: response.judgement.failureReasons,
    });
  }

  const brainScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  return {
    readOnly: true,
    brainScore,
    scenariosRun: results.length,
    scenariosPassed: results.filter((r) => r.passed).length,
    genericFallbackViolations: results.filter((r) =>
      r.responsePreview.includes(GENERIC_ONBOARDING_SIGNATURE),
    ).length,
    roboticFailures: results.filter((r) => r.failureReasons.includes('Natural founder-facing tone')).length,
    scenarioResults: results,
  };
}

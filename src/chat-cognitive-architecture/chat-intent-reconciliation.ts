/**
 * Phase 25.40 — Reconcile world-class intent with cognitive classification.
 */

import type { ChatCognitiveIntent } from './chat-cognitive-types.js';
import type { ChatIntentClassification } from './chat-cognitive-intent-understanding.js';

export type WorldClassIntentCategory =
  | 'SELF'
  | 'CAPABILITY'
  | 'HUMAN_QUALITY'
  | 'PROJECT_REALITY'
  | 'SOFTWARE_CREATION'
  | 'LAUNCH'
  | 'VERIFICATION'
  | 'GENERAL'
  | 'UNKNOWN';

export interface ResolvedIntentOverride {
  readOnly: true;
  category: WorldClassIntentCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedSignals: string[];
}

export type IntentSource = 'local-classifier' | 'world-class-preserved' | 'local-refined';

const PROJECT_EXPLICIT =
  /\b(project|devpulse|the app|this app|our app|codebase|repository|launch readiness|founder test)\b/i;

const SELF_IMPROVEMENT_PATTERNS = [
  /\bhow do i make you\b/i,
  /\bhow can i make you\b/i,
  /\bhow do i improve you\b/i,
  /\bhow can i improve you\b/i,
  /\bhow do you evolve\b/i,
  /\bhow can your intelligence improve\b/i,
  /\bcan you become more self aware\b/i,
  /\bmake you self aware\b/i,
  /\bmake you better\b/i,
];

const WEAKNESS_PATTERNS = [
  /\bweakness/i,
  /\bweak points?\b/i,
  /\bwhere are you lacking\b/i,
  /\bwhat are you bad at\b/i,
  /\bwhat do you struggle with\b/i,
  /\bcurrent gaps\b/i,
  /\bwhat is holding you back\b/i,
];

const COMPATIBLE: Record<WorldClassIntentCategory, readonly ChatCognitiveIntent[]> = {
  SELF: [
    'SELF_AWARENESS',
    'IDENTITY',
    'CREATOR_OR_ORIGIN',
    'LIMITATION',
    'TRUST',
    'CAPABILITY',
    'SELF_IMPROVEMENT',
  ],
  CAPABILITY: ['CAPABILITY', 'SELF_AWARENESS', 'IDENTITY', 'LIMITATION'],
  HUMAN_QUALITY: ['HUMAN_QUALITY', 'TRUST', 'SELF_AWARENESS'],
  PROJECT_REALITY: ['PROJECT_STATUS', 'NEXT_ACTION', 'VERIFICATION'],
  SOFTWARE_CREATION: ['SOFTWARE_CREATION', 'NEW_PROJECT_REQUEST', 'ARCHITECTURE_REVIEW'],
  LAUNCH: ['LAUNCH_READINESS', 'PROJECT_STATUS', 'VERIFICATION'],
  VERIFICATION: ['VERIFICATION', 'PROJECT_STATUS'],
  GENERAL: ['GENERAL_CONVERSATION', 'UNKNOWN'],
  UNKNOWN: [],
};

const BLOCKED_DOWNGRADES: readonly ChatCognitiveIntent[] = [
  'UNKNOWN',
  'GENERAL_CONVERSATION',
  'NEW_PROJECT_REQUEST',
];

export function isSelfImprovementMessage(message: string): boolean {
  return SELF_IMPROVEMENT_PATTERNS.some((p) => p.test(message));
}

export function isSelfWeaknessMessage(message: string): boolean {
  return WEAKNESS_PATTERNS.some((p) => p.test(message)) && !PROJECT_EXPLICIT.test(message);
}

export function mapWorldClassToCognitiveIntent(
  override: ResolvedIntentOverride,
  message: string,
): ChatCognitiveIntent {
  const normalized = message.trim();

  if (override.category === 'HUMAN_QUALITY') return 'HUMAN_QUALITY';
  if (override.category === 'CAPABILITY') return 'CAPABILITY';
  if (override.category === 'LAUNCH') return 'LAUNCH_READINESS';
  if (override.category === 'VERIFICATION') return 'VERIFICATION';
  if (override.category === 'SOFTWARE_CREATION') return 'SOFTWARE_CREATION';

  if (override.category === 'PROJECT_REALITY') {
    if (/\bwhat should (we|i) do next\b/i.test(normalized) || /\bwhere should we focus\b/i.test(normalized)) {
      return 'NEXT_ACTION';
    }
    return 'PROJECT_STATUS';
  }

  if (override.category === 'SELF') {
    if (isSelfImprovementMessage(normalized)) return 'SELF_IMPROVEMENT';
    if (isSelfWeaknessMessage(normalized)) return 'LIMITATION';
    if (/\bwho (created|built) you\b/i.test(normalized)) return 'CREATOR_OR_ORIGIN';
    if (/^what are you\??$/i.test(normalized) || /^who are you\??$/i.test(normalized)) return 'IDENTITY';
    if (/\b(trust|lying)\b/i.test(normalized)) return 'TRUST';
    if (/\bcapabilit/i.test(normalized) || /\bwhat can you do\b/i.test(normalized)) return 'CAPABILITY';
    return 'SELF_AWARENESS';
  }

  return 'UNKNOWN';
}

function isCompatible(
  override: ResolvedIntentOverride,
  localIntent: ChatCognitiveIntent,
  message: string,
): boolean {
  const allowed = COMPATIBLE[override.category];
  if (!allowed.includes(localIntent)) return false;

  if (
    (override.category === 'SELF' || override.category === 'CAPABILITY' || override.category === 'HUMAN_QUALITY') &&
    (localIntent === 'PROJECT_STATUS' || localIntent === 'NEXT_ACTION') &&
    !PROJECT_EXPLICIT.test(message)
  ) {
    return false;
  }

  return true;
}

export function reconcileIntentClassification(
  message: string,
  local: ChatIntentClassification,
  override?: ResolvedIntentOverride,
): ChatIntentClassification & { intentSource: IntentSource } {
  if (!override || override.category === 'GENERAL' || override.category === 'UNKNOWN') {
    return { ...local, intentSource: 'local-classifier' };
  }

  const preserved = mapWorldClassToCognitiveIntent(override, message);
  const localCompatible = isCompatible(override, local.intent, message);
  const localBlocked =
    BLOCKED_DOWNGRADES.includes(local.intent) ||
    ((override.category === 'SELF' || override.category === 'CAPABILITY' || override.category === 'HUMAN_QUALITY') &&
      (local.intent === 'PROJECT_STATUS' || local.intent === 'NEW_PROJECT_REQUEST'));

  if (localBlocked || !localCompatible) {
    return {
      readOnly: true,
      intent: preserved,
      confidence: override.confidence,
      matchedSignals: [...override.matchedSignals, 'world-class-preserved'],
      shouldAskClarifyingQuestion: false,
      clarifyingQuestion: null,
      intentSource: 'world-class-preserved',
    };
  }

  if (local.confidence === 'HIGH' && localCompatible) {
    return { ...local, intentSource: 'local-refined' };
  }

  return {
    readOnly: true,
    intent: preserved,
    confidence: override.confidence,
    matchedSignals: [...override.matchedSignals, 'world-class-preserved'],
    shouldAskClarifyingQuestion: false,
    clarifyingQuestion: null,
    intentSource: 'world-class-preserved',
  };
}

export function hasSelfDirectedSignals(message: string): boolean {
  if (isSelfWeaknessMessage(message) || isSelfImprovementMessage(message)) return true;

  const lower = message.toLowerCase();
  if (/\b(humanistic|robotic|sound human|talk naturally|speak like a founder|feel mechanical)\b/i.test(lower)) {
    return true;
  }

  const aboutAssistant =
    /\b(you|your|yourself|aidevengine)\b/i.test(lower) ||
    /\b(how do i make you|how can i make you|your capabilities|your responses|you sound|you evolve)\b/i.test(
      lower,
    );
  const selfTopic =
    /\b(capabilit|what can you|what are you able|your strengths|how can you help)\b/i.test(lower) &&
    !/\bwhat is the (project|devpulse|app)\b/i.test(lower);
  return aboutAssistant && selfTopic;
}

export function looksLikeProjectStatusAnswer(text: string): boolean {
  return (
    /\b(Bounded project signals|DevPulse V2 is in|Conclusion:|Foundation BUILDING|project understanding|Current phase:)\b/i.test(
      text,
    ) || /\bReasoning:\s*\n•/i.test(text)
  );
}

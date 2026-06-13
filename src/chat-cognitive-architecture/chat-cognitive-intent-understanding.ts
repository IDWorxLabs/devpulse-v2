/**
 * Phase 25.37+25.40 — Conversational intent understanding (not template matching).
 */

import type { ChatCognitiveIntent } from './chat-cognitive-types.js';
import {
  reconcileIntentClassification,
  type IntentSource,
  type ResolvedIntentOverride,
} from './chat-intent-reconciliation.js';

export interface ChatIntentClassification {
  readOnly: true;
  intent: ChatCognitiveIntent;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedSignals: string[];
  shouldAskClarifyingQuestion: boolean;
  clarifyingQuestion: string | null;
  intentSource?: IntentSource;
}

type IntentRule = {
  intent: ChatCognitiveIntent;
  patterns: RegExp[];
  signals: string[];
  weight: number;
};

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'SELF_IMPROVEMENT',
    patterns: [
      /\bhow do i make you better\b/i,
      /\bhow can i make you better\b/i,
      /\bhow do i improve you\b/i,
      /\bhow can i improve you\b/i,
      /\bhow do i make you self aware\b/i,
      /\bhow can i make you self aware\b/i,
      /\bcan you become more self aware\b/i,
      /\bhow do you evolve\b/i,
      /\bhow can your intelligence improve\b/i,
    ],
    signals: ['self-improvement', 'how-to'],
    weight: 11,
  },
  {
    intent: 'HUMAN_QUALITY',
    patterns: [
      /\bhumanistic\b/i,
      /\bsound human\b/i,
      /\bsound more human\b/i,
      /\btalk naturally\b/i,
      /\bspeak more naturally\b/i,
      /\bless robotic\b/i,
      /\bwhy do you sound robotic\b/i,
      /\bwhy do your responses feel mechanical\b/i,
      /\bhow come your responses don'?t sound human/i,
      /\bspeak like a founder\b/i,
      /\btalk to me like a founder\b/i,
      /\bwhy don'?t your responses sound human/i,
    ],
    signals: ['human-quality', 'tone'],
    weight: 10,
  },
  {
    intent: 'SELF_AWARENESS',
    patterns: [
      /\b(self[- ]?aware|self aware|conscious|sentient|understand yourself|know yourself)\b/i,
      /\bdo you (have|possess) (a )?(mind|consciousness|feelings)\b/i,
      /\bare you (really )?(aware|conscious)\b/i,
    ],
    signals: ['self-awareness', 'consciousness'],
    weight: 10,
  },
  {
    intent: 'CREATOR_OR_ORIGIN',
    patterns: [
      /\b(who (created|built|made|developed) you)\b/i,
      /\b(where did you come from)\b/i,
      /\bwho (is|are) your (creator|maker|author|builder)\b/i,
      /\bwho built this system\b/i,
    ],
    signals: ['creator', 'origin'],
    weight: 10,
  },
  {
    intent: 'IDENTITY',
    patterns: [
      /^what are you\??$/i,
      /^who are you\??$/i,
      /\bwhat is aidevengine\b/i,
      /\btell me about (yourself|aidevengine)\b/i,
    ],
    signals: ['identity'],
    weight: 9,
  },
  {
    intent: 'LIMITATION',
    patterns: [
      /\bwhat can you not do\b/i,
      /\bexplain your limitations\b/i,
      /\bwhat do you not know\b/i,
      /\bwhat (are|is) your limits\b/i,
      /\blimitations honestly\b/i,
      /\b(what are |what're )your (current )?weakness/i,
      /\bweak points?\b/i,
      /\bwhere are you lacking\b/i,
      /\bwhat are you bad at\b/i,
      /\bwhat do you struggle with\b/i,
      /\bwhat are your current gaps\b/i,
      /\bwhat is holding you back\b/i,
    ],
    signals: ['limitations', 'weakness', 'unknowns'],
    weight: 9,
  },
  {
    intent: 'TRUST',
    patterns: [
      /\bwhy should i trust you\b/i,
      /\bare you lying\b/i,
      /\bhow do i know this is real\b/i,
      /\bcan i trust you\b/i,
    ],
    signals: ['trust', 'evidence'],
    weight: 9,
  },
  {
    intent: 'CAPABILITY',
    patterns: [
      /\bwhat are your (current )?capabilit/i,
      /\bwhat can you (actually )?do\b/i,
      /\bwhat are you able to do\b/i,
      /\bwhat can you currently do\b/i,
      /\bwhat are your strengths\b/i,
      /\bhow can you help\b/i,
      /\bcan you build (apps|my app|everything)\b/i,
      /\bcomplete my whole app\b/i,
      /\bfrom one prompt\b/i,
      /\bwhat (are you|is aidevengine) (capable|able) of\b/i,
    ],
    signals: ['capability'],
    weight: 8,
  },
  {
    intent: 'PROJECT_STATUS',
    patterns: [
      /\bwhat is (the )?project missing\b/i,
      /\bwhat is devpulse missing\b/i,
      /\bwhat is broken in the app\b/i,
      /\bwhat is (broken|wrong)\b/i,
      /\bwhat did we fix\b/i,
      /\bwhat remains unproven\b/i,
      /\bproject status\b/i,
      /\bwhat(?:'s| is) the state of\b/i,
    ],
    signals: ['project-status'],
    weight: 8,
  },
  {
    intent: 'NEXT_ACTION',
    patterns: [
      /\bwhat should i do next\b/i,
      /\bwhat should we do next\b/i,
      /\bhighest priority fix\b/i,
      /\bwhere should we focus\b/i,
      /\bwhat do i do next\b/i,
      /\bwhat(?:'s| is) the next step\b/i,
    ],
    signals: ['next-action'],
    weight: 8,
  },
  {
    intent: 'VERIFICATION',
    patterns: [
      /\bhow do i verify\b/i,
      /\bwhy is verification failing\b/i,
      /\bwhat does founder test mean\b/i,
      /\bverify my project\b/i,
    ],
    signals: ['verification'],
    weight: 8,
  },
  {
    intent: 'LAUNCH_READINESS',
    patterns: [
      /\bare we ready to launch\b/i,
      /\bwhat blocks launch\b/i,
      /\bwhat would a real founder say\b/i,
      /\blaunch readiness\b/i,
      /\bready to launch\b/i,
    ],
    signals: ['launch-readiness'],
    weight: 8,
  },
  {
    intent: 'ARCHITECTURE_REVIEW',
    patterns: [
      /\b(review|explain|describe).{0,40}architecture\b/i,
      /\bhow is (this|the system) architected\b/i,
      /\btech stack\b/i,
    ],
    signals: ['architecture'],
    weight: 7,
  },
  {
    intent: 'SOFTWARE_CREATION',
    patterns: [
      /\bbuild me a\b/i,
      /\bplan a (mobile app|saas|dashboard|crm|app)\b/i,
      /\bdesign a\b/i,
      /\bcreate a (crm|app|portal|dashboard)\b/i,
      /\bhelp me build\b/i,
    ],
    signals: ['software-creation'],
    weight: 7,
  },
  {
    intent: 'NEW_PROJECT_REQUEST',
    patterns: [
      /\b(i want to|i need to|help me) (build|create|make) (a |an |my )?(app|application|product|saas|crm|portal)\b/i,
      /\bstart a new project\b/i,
      /\bnew project\b/i,
      /\btell me what you want to build\b/i,
    ],
    signals: ['new-project'],
    weight: 6,
  },
  {
    intent: 'GENERAL_CONVERSATION',
    patterns: [/\bhello\b/i, /\bhi\b/i, /\bthanks\b/i, /\bthank you\b/i],
    signals: ['greeting'],
    weight: 2,
  },
];

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ');
}

function classifyLocalIntent(message: string): ChatIntentClassification {
  const normalized = normalizeMessage(message);
  if (!normalized) {
    return {
      readOnly: true,
      intent: 'UNKNOWN',
      confidence: 'LOW',
      matchedSignals: [],
      shouldAskClarifyingQuestion: true,
      clarifyingQuestion: 'What would you like to know — AiDevEngine itself, your project status, or building software?',
    };
  }

  let bestIntent: ChatCognitiveIntent = 'UNKNOWN';
  let bestScore = 0;
  const matchedSignals: string[] = [];

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        const score = rule.weight + (pattern.source.startsWith('^') ? 2 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestIntent = rule.intent;
          matchedSignals.push(...rule.signals);
        }
      }
    }
  }

  if (bestScore === 0) {
    if (/\?/.test(normalized) && normalized.split(/\s+/).length <= 10) {
      return {
        readOnly: true,
        intent: 'UNKNOWN',
        confidence: 'LOW',
        matchedSignals: ['unclassified-question'],
        shouldAskClarifyingQuestion: true,
        clarifyingQuestion:
          'I want to answer directly — are you asking about AiDevEngine itself, your current project, or a software idea you want to build?',
      };
    }
    return {
      readOnly: true,
      intent: 'GENERAL_CONVERSATION',
      confidence: 'LOW',
      matchedSignals: ['general'],
      shouldAskClarifyingQuestion: false,
      clarifyingQuestion: null,
    };
  }

  const confidence: ChatIntentClassification['confidence'] =
    bestScore >= 9 ? 'HIGH' : bestScore >= 7 ? 'MEDIUM' : 'LOW';

  return {
    readOnly: true,
    intent: bestIntent,
    confidence,
    matchedSignals: [...new Set(matchedSignals)],
    shouldAskClarifyingQuestion: confidence === 'LOW' && bestIntent === 'UNKNOWN',
    clarifyingQuestion:
      confidence === 'LOW'
        ? 'Could you clarify whether you mean AiDevEngine capabilities, project status, or building a specific product?'
        : null,
  };
}

export function classifyChatCognitiveIntent(
  message: string,
  options?: { resolvedIntentOverride?: ResolvedIntentOverride },
): ChatIntentClassification {
  const local = classifyLocalIntent(message);
  if (!options?.resolvedIntentOverride) {
    return { ...local, intentSource: 'local-classifier' };
  }
  return reconcileIntentClassification(message, local, options.resolvedIntentOverride);
}

export type { ChatCognitiveIntent };

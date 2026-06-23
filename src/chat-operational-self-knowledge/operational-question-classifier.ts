/**
 * Operational question classifier — intent patterns, not exact test strings.
 */

import type { OperationalQuestionKind } from './chat-operational-self-knowledge-types.js';

type Rule = { kind: OperationalQuestionKind; patterns: RegExp[]; weight: number };

const RULES: Rule[] = [
  {
    kind: 'SELF_AWARENESS',
    patterns: [
      /\b(self[- ]?aware|conscious|sentient|understand yourself)\b/i,
      /\bare you (really )?(aware|conscious)\b/i,
      /\bhow do you know when you are wrong\b/i,
    ],
    weight: 10,
  },
  {
    kind: 'TRUST',
    patterns: [
      /\bwhy should i trust you\b/i,
      /\bcan i trust you\b/i,
      /\bhow do i know (this|you) (is|are) real\b/i,
      /\bare you lying\b/i,
    ],
    weight: 10,
  },
  {
    kind: 'TRUTH_SOURCE',
    patterns: [
      /\bwhat execution truth source\b/i,
      /\bexecution truth source are you (currently )?using\b/i,
      /\bwhat evidence are you using\b/i,
      /\bhow do you know this\b/i,
      /\bwhat (?:is your|are your) (?:current )?truth source\b/i,
      /\bwhere does (?:this|your) (?:operational )?truth come from\b/i,
    ],
    weight: 11,
  },
  {
    kind: 'EXECUTION_STAGE_INVENTORY',
    patterns: [
      /\blist all execution stages\b/i,
      /\bexecution stages and their (?:current )?status\b/i,
      /\ball execution stages\b/i,
      /\bshow (?:me )?(?:all )?execution stages\b/i,
      /\bexecution stage inventory\b/i,
    ],
    weight: 11,
  },
  {
    kind: 'PROOF_REQUEST',
    patterns: [
      /\bcan you prove (that|this)\b/i,
      /\bshow me (the )?proof\b/i,
      /\bwhat evidence do you have\b/i,
    ],
    weight: 9,
  },
  {
    kind: 'FIRST_BROKEN_STAGE',
    patterns: [
      /\bfirst broken stage\b/i,
      /\bcurrent first broken stage\b/i,
      /\bwhere (does|is) the chain break\b/i,
      /\bwhat stage is broken\b/i,
    ],
    weight: 10,
  },
  {
    kind: 'LAUNCH_BLOCKERS',
    patterns: [
      /\bwhat is stopping launch\b/i,
      /\bwhat(?:'s| is) blocking launch\b/i,
      /\bwhy can(?:'|no)t we launch\b/i,
      /\blaunch blockers?\b/i,
      /\btop (three|3) launch blockers?\b/i,
    ],
    weight: 9,
  },
  {
    kind: 'WEAKNESS',
    patterns: [
      /\bbiggest weakness\b/i,
      /\bbiggest blocker\b/i,
      /\bwhat blocks launch\b/i,
      /\bweakest (part|area|capability)\b/i,
      /\bwhat are you bad at\b/i,
      /\bwhere are you weakest\b/i,
    ],
    weight: 9,
  },
  {
    kind: 'UNCERTAINTY',
    patterns: [
      /\bwhat do you not know\b/i,
      /\bwhat (?:are you )?uncertain about\b/i,
      /\bwhat(?:'s| is) unknown\b/i,
      /\bwhat remains unproven\b/i,
    ],
    weight: 9,
  },
  {
    kind: 'LIMITATIONS',
    patterns: [
      /\bwhat can you not do\b/i,
      /\bwhat are you unable to do\b/i,
      /\blimitations honestly\b/i,
      /\bexplain your limits\b/i,
      /\bwhat (?:are|is) your (current )?weakness/i,
    ],
    weight: 9,
  },
  {
    kind: 'NEXT_STEP',
    patterns: [
      /\bwhat should (i|we) do next\b/i,
      /\bwhat(?:'s| is) the next step\b/i,
      /\bhighest priority\b/i,
      /\bwhere should (i|we) focus\b/i,
    ],
    weight: 8,
  },
  {
    kind: 'LAUNCH_NOT_PROVEN',
    patterns: [
      /\bwhy is launch not proven\b/i,
      /\bwhy isn't launch proven\b/i,
      /\bwhat is preventing launch\b/i,
      /\bwhat(?:'s| is) preventing launch\b/i,
      /\bwhy can(?:'|no)t we launch\b/i,
    ],
    weight: 11,
  },
  {
    kind: 'FIRST_LAUNCH_BLOCKER',
    patterns: [
      /\bfirst launch blocker\b/i,
      /\bwhat is the first launch blocker\b/i,
      /\bprimary launch blocker\b/i,
    ],
    weight: 11,
  },
  {
    kind: 'LAUNCH_FIX_REQUIRED',
    patterns: [
      /\bwhat do i need to fix before launch\b/i,
      /\bwhat must be fixed before launch\b/i,
      /\bwhat needs to be fixed before launch\b/i,
    ],
    weight: 10,
  },
  {
    kind: 'LAUNCH_READINESS',
    patterns: [
      /\bare we ready to launch\b/i,
      /\bare you ready to (be )?launch/i,
      /\bready to be launch/i,
      /\blaunch readiness\b/i,
      /\bcan we launch\b/i,
      /\bcan you be launch/i,
    ],
    weight: 8,
  },
  {
    kind: 'DISCONNECTED_SYSTEMS',
    patterns: [
      /\bwhat systems are disconnected\b/i,
      /\bwhat(?:'s| is) disconnected\b/i,
      /\bbroken link\b/i,
    ],
    weight: 8,
  },
  {
    kind: 'IDENTITY',
    patterns: [
      /\bwhat is aidevengine\b/i,
      /\bwhat's aidevengine\b/i,
      /\bexplain aidevengine\b/i,
      /\btell me about aidevengine\b/i,
      /\bwho built you\b/i,
      /\bwho created you\b/i,
      /\bwho made you\b/i,
      /\bwhat product do you represent\b/i,
      /\bwho are you and what product\b/i,
    ],
    weight: 12,
  },
  {
    kind: 'CAPABILITIES',
    patterns: [
      /\bwhat can you do\b/i,
      /\bwhat are your capabilities\b/i,
      /\bwhat are you able to do\b/i,
      /\bcan you run applications?\b/i,
      /\bcan you preview applications?\b/i,
      /\bcapability inventory\b/i,
      /\bbuild my whole (app|application)\b/i,
      /\bfrom one prompt\b/i,
      /\bentire application from (a )?single prompt\b/i,
    ],
    weight: 7,
  },
];

export function classifyOperationalQuestion(message: string): OperationalQuestionKind {
  const text = message.trim();
  if (!text) return 'GENERAL';

  let best: OperationalQuestionKind = 'GENERAL';
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) score += rule.weight;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.kind;
    }
  }

  return bestScore > 0 ? best : 'GENERAL';
}

export function isOperationalSelfKnowledgeQuestion(kind: OperationalQuestionKind): boolean {
  return kind !== 'GENERAL';
}
